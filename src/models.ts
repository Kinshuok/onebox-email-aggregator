import { categorizeEmail } from './ai';

async function runTests() {
    const samples: { body: string; expected?: string }[] = [
        { body: "Hey team, can we book a meeting for next Tuesday? Thanks!", expected: "Meeting Booked" },
        { body: "I’m very interested in your product. Let’s talk next steps.", expected: "Interested" },
        { body: "Win a free iPad now!!! Click here", expected: "Spam" },
        { body: "I’m out of office until Monday, please contact my colleague.", expected: "Out of Office" },
    ];

    for (const { body, expected } of samples) {
        const subject = body; // Use the first line as subject
        const label = await categorizeEmail(subject, body);
        console.log(`\nInput: "${body}"`);
        console.log(`→ Model returned: "${label}"${expected ? ` (expected: ${expected})` : ''}`);
    }
}

runTests().catch(console.error);
