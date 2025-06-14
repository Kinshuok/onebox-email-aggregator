import { IncomingWebhook } from '@slack/webhook';
import axios from 'axios';
import dotenv from 'dotenv';
import path from "path";

dotenv.config({ path: path.resolve('/Users/kinshuokmunjal/Desktop/reachinbox-onebox/src/.env') });

const slackUrl = process.env.SLACK_WEBHOOK_URL;
const webhookUrl = process.env.WEBHOOK_URL;

const slack = slackUrl ? new IncomingWebhook(slackUrl) : undefined;

export async function notifyInterested(email: { subject: string; from: string; body: string }) {
    try {
        if (slack) {
            await slack.send({ text: `Interested email from ${email.from}: ${email.subject}` });
        }
        if (webhookUrl) {
            await axios.post(webhookUrl, email);
        }
    } catch (err) {
        console.error('Notification failed:', err);
    }
}
