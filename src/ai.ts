// src/ai.ts
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
    console.warn(
        '[⚠️] GROQ_API_KEY not set—calls to categorizeEmail will be no-ops.'
    );
}

const client = new Groq({
    apiKey,
    // apiUrl: process.env.GROQ_API_URL,
});

const VALID = [
    'Interested',
    'Meeting Booked',
    'Not Interested',
    'Spam',
    'Out of Office',
] as const;

type Label = (typeof VALID)[number] | 'Uncategorized';

/**
 * Classify a single email into one of the VALID labels.
 */
export async function categorizeEmail(
    subject: string,
    body: string
): Promise<Label> {
    if (!apiKey) {
        console.log(`✉️ ${subject} → Uncategorized`);
        return 'Uncategorized';
    }

    const systemPrompt = [
        'You are an email classification assistant.',
        'Classify the following email into exactly one of these labels:',
        ...VALID.map(l => `- ${l}`),
        '',
        'Reply with only the label name.',
    ].join('\n');

    const userPrompt = [
        `Subject: ${subject}`,
        '',
        `Body:\n${body}`,
    ].join('\n');

    try {
        const res = await client.chat.completions.create({
            model: process.env.GROQ_MODEL || 'grok-1',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user',   content: userPrompt },
            ],
            temperature: 0,
        });

        const raw = res.choices?.[0]?.message?.content?.trim() || '';
        const label = VALID.includes(raw as any) ? raw : 'Uncategorized';
        console.log(`✉️ ${subject} → ${label}`);
        return label as Label;

    } catch (err) {
        console.error('AI categorization failed:', err);
        console.log(`✉️ ${subject} → Uncategorized`);
        return 'Uncategorized';
    }
}
