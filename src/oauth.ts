import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;

export const SCOPES = [
    'https://mail.google.com/',
    'openid',
    'email',
    'profile'
];

export const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

export function getAuthUrl(): string {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });
}

export async function getTokens(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}
