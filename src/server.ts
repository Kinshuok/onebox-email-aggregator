// src/server.ts
import express, { Request, Response, NextFunction } from 'express';
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

(async () => {
    await ensureIndex();

    app.get('/auth-url', (_req, res) => {
        res.json({ url: getAuthUrl() });
    });

    // <-- Notice the 3rd param `next: NextFunction` here -->
    app.get(
        '/oauth2callback',
        async (req: Request, res: Response, next: NextFunction) => {
            const code = req.query.code as string | undefined;
            if (!code) {
                res.status(400).send('Missing code');
                return;
            }

            try {
                const tokens = await getTokens(code);
                oauth2Client.setCredentials(tokens);

                let email = 'unknown';
                if (tokens.id_token) {
                    const payload = JSON.parse(
                        Buffer.from(tokens.id_token.split('.')[1], 'base64').toString()
                    );
                    email = payload.email || 'unknown';
                }

                const authString = Buffer.from(
                    `user=${email}\x01auth=Bearer ${tokens.access_token}\x01\x01`
                ).toString('base64');

                startImapSync(
                    {
                        user:        email,
                        xoauth2:     authString,
                        host:        'imap.gmail.com',
                        port:        993,
                        tls:         true,
                        accountName: email,
                    },
                    async emailObj => {
                        const category = await categorizeEmail(
                            emailObj.subject,
                            emailObj.body
                        );
                        await indexEmail({ ...emailObj, category });
                        if (category === 'Interested') {
                            await notifyInterested(emailObj);
                        }
                        console.log(`✉️ ${emailObj.subject} → ${category}`);
                    }
                );
                res.redirect(`http://localhost:5173/?account=${email}`);
                res.send(`Connected & syncing ${email}`);
            } catch (err) {
                // forward to error handler
                next(err);
            }
        }
    );

    app.get('/search', async (req, res) => {
        const q        = (req.query.q        as string | undefined) || '';
        const account  = (req.query.account  as string | undefined);
        const category = (req.query.category as string | undefined);

        const must = q
            ? { multi_match: { query: q, fields: ['subject','body'] } }
            : { match_all: {} };
        const filters: any[] = [];
        if (account)  filters.push({ term: { account } });
        if (category) filters.push({ term: { category } });

        try {
            const result = await es.search({
                index: 'emails',
                body: {
                    query: { bool: { must, ...(filters.length ? { filter: filters } : {}) } },
                    sort: [{ date: { order: 'asc' } }],
                    size:10000
                },
            });
            const hits = (result.body as any).hits.hits.map((h: any) => h._source);
            res.json(hits);
        } catch (err) {
            console.error('Search error:', err);
            res.status(500).send('Search failed');
        }
    });

    app.listen(PORT, () => {
        console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
})();
