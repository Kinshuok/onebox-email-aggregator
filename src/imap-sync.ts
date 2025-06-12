import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { Readable } from 'stream';

export interface ImapConfig {
    user: string;
    xoauth2: string;
    host: string;
    port: number;
    tls: boolean;
    accountName: string;
}

export function startImapSync(
    config: ImapConfig,
    onEmail: (email: {
        account: string;
        subject: string;
        from: string;
        to: string;
        body: string;
        date?: Date;
    }) => void
) {
    const imap = new Imap({
        user: config.user,
        password: '',
        xoauth2: config.xoauth2,
        host: config.host,
        port: config.port,
        tls: config.tls,
        tlsOptions: { rejectUnauthorized: false },
    });

    let currentTotal = 0;

    imap.once('ready', () => {
        console.log(`[${config.accountName}] Connected to IMAP`);
        imap.openBox('INBOX', false, (err, box) => {
            if (err) throw err;

            // Record the current total message count
            currentTotal = box.messages.total;

            // 1️⃣ Initial fetch: last 30 days (bootstrap, optional markSeen)
            const sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            imap.search([[ 'SINCE', sinceDate ]], (err, uids) => {
                if (err) return console.error('Initial search error:', err);
                if (!uids?.length) return;
                // Fetch all those bootstrap messages
                const f = imap.fetch(uids, { bodies: '' });
                f.on('message', msg => {
                    msg.on('body', stream => {
                        simpleParser(stream as Readable, (_err, parsed) => {
                            if (_err) return console.error('Parse error:', _err);
                            onEmail({
                                account: config.accountName,
                                subject: parsed.subject || '',
                                from: parsed.from?.text || '',
                                to: Array.isArray(parsed.to)
                                    ? parsed.to.map(t => (t as any).address).join(', ')
                                    : (parsed.to as any)?.address || '',
                                body: parsed.text || '',
                                date: parsed.date || new Date(),
                            });
                        });
                    });
                });
            });

            // 2️⃣ Real-time: on new mail, fetch only that range
            imap.on('mail', (numNewMsgs: number) => {
                console.log(
                    `[${config.accountName}] Mail event: ${numNewMsgs} new message(s)`
                );
                if (numNewMsgs <= 0) return;

                // Compute the sequence range: (total - new + 1) to total
                const startSeq = currentTotal + 1;
                currentTotal += numNewMsgs;
                const range = `${startSeq}:${currentTotal}`;

                const f2 = imap.seq.fetch(range, { bodies: '' });
                f2.on('message', msg => {
                    msg.on('body', stream => {
                        simpleParser(stream as Readable, (_err, parsed) => {
                            if (_err) return console.error('Parse error:', _err);
                            onEmail({
                                account: config.accountName,
                                subject: parsed.subject || '',
                                from: parsed.from?.text || '',
                                to: Array.isArray(parsed.to)
                                    ? parsed.to.map(t => (t as any).address).join(', ')
                                    : (parsed.to as any)?.address || '',
                                body: parsed.text || '',
                                date: parsed.date || new Date(),
                            });
                        });
                    });
                });
            });
        });
    });

    imap.once('error', (err: Error) => {
        console.error(`[${config.accountName}] IMAP error:`, err);
    });

    imap.once('end', () => {
        console.log(`[${config.accountName}] IMAP connection ended.`);
    });

    imap.connect();
}
