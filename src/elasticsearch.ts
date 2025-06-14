// src/elasticsearch.ts
import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
import path from "path";
dotenv.config({ path: path.resolve('/Users/kinshuokmunjal/Desktop/reachinbox-onebox/src/.env') });

export const es = new Client({
    node: process.env.ELASTIC_URL || 'http://localhost:9200',
});

export async function ensureIndex(): Promise<void> {
    const index = 'emails';
    const exists = await es.indices.exists({ index });
    if (!exists.body) {
        await es.indices.create({
            index,
            body: {
                mappings: {
                    properties: {
                        account:  { type: 'keyword' },
                        subject:  { type: 'text'    },
                        from:     { type: 'keyword' },
                        to:       { type: 'keyword' },
                        body:     { type: 'text'    },
                        date:     { type: 'date'    },
                        category: { type: 'keyword' }   // ensure this is present
                    }
                }
            }
        });
        console.log(`📑 Created index ${index}`);
    }
}

export async function indexEmail(email: {
    account: string;
    subject: string;
    from: string;
    to: string;
    body: string;
    date?: Date;
    category?: string;
}): Promise<void> {
    await es.index({
        index: 'emails',
        body: {
            account:  email.account,
            subject:  email.subject,
            from:     email.from,
            to:       email.to,
            body:     email.body,
            date:     email.date || new Date(),
            category: email.category || 'Uncategorized',
        },
    });
}
