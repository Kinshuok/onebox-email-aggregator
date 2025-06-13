// src/server.ts
import express from 'express';
import dotenv from 'dotenv';
import { getAuthUrl, getTokens, oauth2Client } from './oauth';
import { startImapSync } from './imap-sync';
import { es, ensureIndex, indexEmail } from './elasticsearch';
import { categorizeEmails } from './ai';
import { notifyInterested } from './notify';

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '5', 10);
const BATCH_INTERVAL = parseInt(process.env.BATCH_INTERVAL || '5000', 10);

interface QueuedEmail {
    account: string;
    subject: string;
    from: string;
    to: string;
    body: string;
    date?: Date;
}

const queue: QueuedEmail[] = [];
let processing = false;

async function processQueue() {
    if (processing || queue.length === 0) return;
    processing = true;
    const batch = queue.splice(0, BATCH_SIZE);
    const labels = await categorizeEmails(
        batch.map(e => ({ subject: e.subject, body: e.body }))
    );
    for (let i = 0; i < batch.length; i++) {
        const emailObj = batch[i];
        const category = labels[i];
        await indexEmail({ ...emailObj, category });
        if (category === 'Interested') {
            await notifyInterested(emailObj);
        }
        console.log(`✉️  ${emailObj.subject} (${category})`);
    }
    processing = false;
}

setInterval(processQueue, BATCH_INTERVAL);

// 1️⃣ Ensure the ES index exists (with category mapping)
ensureIndex().catch(console.error);

// 2️⃣ In-memory token store
const userTokens: Record<string, string> = {};

// 3️⃣ OAuth URL endpoint
app.get('/auth-url', (_req, res) => {
    res.json({ url: getAuthUrl() });
});

// 4️⃣ OAuth2 callback
app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code as string | undefined;
    if (!code) {
        res.status(400).send('Missing code');
        return;
    }

    try {
        const tokens = await getTokens(code);
        oauth2Client.setCredentials(tokens);

        // Extract user email from ID token
        let email = 'unknown';
        if (tokens.id_token) {
            const payload = JSON.parse(
                Buffer.from(tokens.id_token.split('.')[1], 'base64').toString()
            );
            email = payload.email || 'unknown';
        }
        userTokens[email] = tokens.access_token!;

        // Build xoauth2 string
        const authString = Buffer.from(
            `user=${email}\x01auth=Bearer ${tokens.access_token}\x01\x01`
        ).toString('base64');

        // Start IMAP sync + classification
        startImapSync(
            {
                user: email,
                xoauth2: authString,
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
                accountName: email
            },
            async (emailObj) => {
                queue.push(emailObj);
                if (queue.length >= BATCH_SIZE) {
                    processQueue();
                }
            }
        );

        res.send(`Connected & syncing ${email}`);
    } catch (err) {
        console.error('OAuth callback error:', err);
        res.status(500).send('OAuth failed.');
    }
});

// 5️⃣ Search endpoint
app.get('/search', async (req, res) => {
    const q        = (req.query.q        as string | undefined) || '';
    const account  = (req.query.account  as string | undefined);
    const category = (req.query.category as string | undefined);

    // Build must clause
    const mustClause = q
        ? { multi_match: { query: q, fields: ['subject', 'body'] } }
        : { match_all: {} };

    // Build optional filters
    const filters: any[] = [];
    if (account)  filters.push({ term: { account } });
    if (category) filters.push({ term: { category } });

    const esQuery: Record<string, any> = {
        bool: {
            must: mustClause,
            ...(filters.length ? { filter: filters } : {})
        }
    };

    try {
        const result = await es.search({
            index: 'emails',
            body: {
                query: esQuery,
                sort: [{ date: { order: 'asc' } }]
            }
        });
        const hits = (result.body as any).hits.hits.map((h: any) => h._source);
        res.json(hits);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).send('Search failed');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server listening at http://localhost:${PORT}`);
});
