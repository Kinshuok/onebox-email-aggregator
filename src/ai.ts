// src/ai.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
// Pass the raw string key, not an object
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : undefined;

// Your fixed set of labels
const VALID = [
    'Interested',
    'Meeting Booked',
    'Not Interested',
    'Spam',
    'Out of Office'
];

export async function categorizeEmail(
    subject: string,
    body: string
): Promise<string> {
    if (!genAI) {
        console.log(`✉️ ${subject} (Uncategorized)`);
        return 'Uncategorized';
    }

    const prompt = `
You are an email classification assistant.
Classify the following email into exactly one of these labels:
- Interested
- Meeting Booked
- Not Interested
- Spam
- Out of Office

Reply with exactly the label and nothing else.

Examples:
Email: "Hey team, can we book a meeting for next Tuesday? Thanks!"
→ Meeting Booked

Email: "I’m very interested in your product. Let’s talk next steps."
→ Interested

Email: "Win a free iPad now!!! Click here"
→ Spam

Email: "I’m out of office until Monday, please contact my colleague."
→ Out of Office

Now classify this email:

Email:
${body}

→`.trim();

    try {
        // Use the Flash preview model you confirmed earlier
        const model = genAI.getGenerativeModel({
            model: 'models/gemini-2.5-flash-preview-05-20'
        });
        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim();
        const label = VALID.includes(raw) ? raw : 'Uncategorized';

        console.log(`✉️ ${subject} (${label})`);
        return label;
    } catch (err) {
        console.error('AI categorization failed:', err);
        console.log(`✉️ ${subject} (Uncategorized)`);
        return 'Uncategorized';
    }
}
