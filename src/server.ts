import express from 'express';
import dotenv from 'dotenv';
import { getAuthUrl, getTokens, oauth2Client } from './oauth';
import { startImapSync } from './imap-sync';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// 1) Return OAuth URL
app.get('/auth-url', (_req, res) => {
    res.json({ url: getAuthUrl() });
});

// 2) OAuth2 callback
app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code as string | undefined;
    if (!code) {
        res.status(400).send('Missing code');
        return;
    }

    try {
        const tokens = await getTokens(code);
        oauth2Client.setCredentials(tokens);

        // Extract email from ID token
        let email = 'unknown';
        if (tokens.id_token) {
            const payload = JSON.parse(
                Buffer.from(tokens.id_token.split('.')[1], 'base64').toString()
            );
            email = payload.email || 'unknown';
        }
        console.log(`✅ Stored token for: ${email}`);

        // Build XOAUTH2 auth string
        const authString = Buffer.from(
            `user=${email}\x01auth=Bearer ${tokens.access_token}\x01\x01`
        ).toString('base64');

        startImapSync({
            user: email,
            xoauth2: authString,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            accountName: email
        }, emailObj => {
            console.log(`[${email}] New Email: ${emailObj.subject}`);
        });

        res.send(`Now syncing email for ${email}`);
    } catch (err) {
        console.error('OAuth callback error:', err);
        res.status(500).send('OAuth failed.');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server listening at http://localhost:${PORT}`);
});
