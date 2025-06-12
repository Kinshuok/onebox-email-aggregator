import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { getAuthUrl, getTokens, oauth2Client } from './oauth';
import { startImapSync } from './imap-sync';
import { es, ensureIndex, indexEmail } from './elasticsearch';
import { categorizeEmail } from './ai';
import { notifyInterested } from './notify';

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 1️⃣ Ensure the ES index exists
ensureIndex().catch(console.error);

// 2️⃣ In-memory token store
const userTokens: Record<string,string> = {};

// 3️⃣ OAuth URL endpoint
app.get('/auth-url', (_req: Request, res: Response) => {
    res.json({ url: getAuthUrl() });
});

// 4️⃣ OAuth2 callback
app.get('/oauth2callback', async (req: Request, res: Response) => {
    const code = req.query.code as string | undefined;
    if (!code) {
        res.status(400).send('Missing code');
        return;
    }

    try {
        const tokens = await getTokens(code);
        oauth2Client.setCredentials(tokens);

        // Extract user email
        let email = 'unknown';
        if (tokens.id_token) {
            const payload = JSON.parse(
                Buffer.from(tokens.id_token.split('.')[1], 'base64').toString()
            );
            email = payload.email || 'unknown';
        }
        userTokens[email] = tokens.access_token!;

        // Build XOAUTH2 auth string
        const authString = Buffer.from(
            `user=${email}\x01auth=Bearer ${tokens.access_token}\x01\x01`
        ).toString('base64');

        // Start IMAP sync and index each email
        startImapSync({
            user: email,
            xoauth2: authString,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            accountName: email
        }, async emailObj => {
            console.log(`[${email}] Received: ${emailObj.subject}`);
            const category = await categorizeEmail(emailObj.body);
            await indexEmail({ ...emailObj, category });
            if (category === 'Interested') {
                await notifyInterested(emailObj);
            }
            console.log(`[${email}] Indexed: ${emailObj.subject} (${category})`);
        });

        res.send(`Connected & syncing ${email}`);
    } catch (err) {
        console.error('OAuth callback error:', err);
        res.status(500).send('OAuth failed.');
    }
});

// 5️⃣ Search endpoint


app.get('/search', async (req: Request, res: Response) => {
    const q        = (req.query.q        as string | undefined) || '';
    const account  = (req.query.account  as string | undefined);
    const category = (req.query.category as string | undefined);

    // Build the "must" clause: either multi_match or match_all
    const mustClause = q
        ? { multi_match: { query: q, fields: ['subject', 'body'] } }
        : { match_all: {} };

    // Optional "filter" clauses
    const filters: any[] = [];
    if (account) {
        filters.push({ term: { account } });
    }
    if (category) {
        filters.push({ term: { category } });
    }

    // Combine into a bool query
    const esQuery: Record<string, any> = {
        bool: {
            must: mustClause,
            ...(filters.length ? { filter: filters } : {})
        }
    };

    try {
        // Execute the search, sorted by date ascending
        const result = await es.search({
            index: 'emails',
            body: {
                query: esQuery,
                sort:  [{ date: { order: 'asc' } }]
            }
        });

        // Extract the _source documents
        const hits = (result.body as any).hits.hits.map((h: any) => h._source);
        res.json(hits);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).send('Search failed');
    }
});

// ... your other routes and app.listen() ...


app.listen(PORT, () => {
    console.log(`🚀 Server listening at http://localhost:${PORT}`);
});
