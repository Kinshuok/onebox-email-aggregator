import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : undefined;

export async function categorizeEmail(body: string): Promise<string> {
    if (!genAI) {
        return 'Uncategorized';
    }

    const prompt = `Categorize the following email into one of these labels: Interested, Meeting Booked, Not Interested, Spam, Out of Office. Reply ONLY with the label.\nEmail:\n${body}`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        return text || 'Uncategorized';
    } catch (err) {
        console.error('AI categorization failed:', err);
        return 'Uncategorized';
    }
}
