// src/ai.ts
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configure the Groq Cloud API parameters. You can obtain an API key by
// creating a project at https://console.groq.com/home
const apiKey = process.env.GROQ_API_KEY || '';
const apiUrl = process.env.GROQ_API_URL;
const model  = process.env.GROQ_MODEL  || 'groq-1';

const groq = apiKey
    ? new Groq({ apiKey, baseURL: apiUrl })
    : undefined;

// Your fixed set of labels
const VALID = [
    'Interested',
    'Meeting Booked',
    'Not Interested',
    'Spam',
    'Out of Office'
];

export async function categorizeEmails(
    emails: { subject: string; body: string }[]
): Promise<string[]> {
    if (!groq) {
        emails.forEach(e => console.log(`✉️ ${e.subject} (Uncategorized)`));
        return emails.map(() => 'Uncategorized');
    }

    const systemPrompt = [
        'You are an email classification assistant.',
        'Classify each email into exactly one of these labels:',
        '- Interested',
        '- Meeting Booked',
        '- Not Interested',
        '- Spam',
        '- Out of Office',
        '',
        'Reply with one label per line in the same order as the emails.'
    ].join('\n');

    const userPrompt = emails
        .map((e, i) => `Email ${i + 1}:\n${e.body}`)
        .join('\n\n');

    try {
        const response = await groq.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0
        });

        const text: string = response.choices?.[0]?.message?.content || '';
        const lines = text.trim().split(/\n+/);

        return emails.map((e, i) => {
            const raw = lines[i] || '';
            const label = VALID.includes(raw) ? raw : 'Uncategorized';
            console.log(`✉️ ${e.subject} (${label})`);
            return label;
        });
    } catch (err) {
        console.error('AI categorization failed:', err);
        emails.forEach(e => console.log(`✉️ ${e.subject} (Uncategorized)`));
        return emails.map(() => 'Uncategorized');
    }
}

export async function categorizeEmail(
    subject: string,
    body: string
): Promise<string> {
    const [label] = await categorizeEmails([{ subject, body }]);
    return label;
}
