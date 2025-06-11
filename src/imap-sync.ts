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

export function startImapSync(config: ImapConfig, onEmail: (email: any) => void) {
    const imap = new Imap({
        user: config.user,
        password: '',              // required by types
        xoauth2: config.xoauth2,
        host: config.host,
        port: config.port,
        tls: config.tls,
        tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
        console.log(`[${config.accountName}] Connected to IMAP`);

        imap.openBox('INBOX', false, (err) => {
            if (err) throw err;

            // --- FETCH LAST 30 DAYS ---
            const sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            // Pass a single array where each criterion is itself an array:
            imap.search([ ['SINCE', sinceDate] ], (err, uids) => {
                if (err) return console.error('Search error:', err);
                if (!uids || uids.length === 0) return;

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
                                    ? parsed.to.map(t => (t as any).address || '').join(', ')
                                    : (parsed.to as any)?.address || '',
                                body: parsed.text || ''
                            });
                        });
                    });
                });
            });

            // --- REAL-TIME UPDATES (IDLE) ---
            imap.on('mail', () => {
                console.log(`[${config.accountName}] New mail`);
                // Re-use the same search pattern for unseen messages
                imap.search([ 'UNSEEN' ], (err, results) => {
                    if (err) return console.error('Search error:', err);
                    if (!results || results.length === 0) return;

                    const f2 = imap.fetch(results, { bodies: '' });
                    f2.on('message', msg => {
                        msg.on('body', stream => {
                            simpleParser(stream as Readable, (_err, parsed) => {
                                if (_err) return console.error('Parse error:', _err);
                                onEmail({
                                    account: config.accountName,
                                    subject: parsed.subject || '',
                                    from: parsed.from?.text || '',
                                    to: Array.isArray(parsed.to)
                                        ? parsed.to.map(t => (t as any).address || '').join(', ')
                                        : (parsed.to as any)?.address || '',
                                    body: parsed.text || ''
                                });
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
