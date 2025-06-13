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
        console.log(`🔌 [${config.accountName}] IMAP ready`);
        imap.openBox('INBOX', false, (err, box) => {
            if (err) throw err;
            currentTotal = box.messages.total;

            // Bootstrap last 30 days
            const sinceDate = new Date(Date.now());
            sinceDate.setHours(11, 0, 0, 0);
            imap.search([['SINCE', sinceDate]], (err, uids) => {
                if (err) return console.error(err);
                if (!uids?.length) return;
                const f = imap.fetch(uids, { bodies: '' });
                f.on('message', msg => {
                    msg.on('body', stream => {
                        simpleParser(stream as Readable, (_err, parsed) => {
                            if (_err) return console.error(_err);
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

            // Real-time updates
            imap.on('mail', (numNew: number) => {
                if (numNew <= 0) return;
                const startSeq = currentTotal + 1;
                currentTotal += numNew;
                const range = `${startSeq}:${currentTotal}`;
                const f2 = imap.seq.fetch(range, { bodies: '' });
                f2.on('message', msg => {
                    msg.on('body', stream => {
                        simpleParser(stream as Readable, (_err, parsed) => {
                            if (_err) return console.error(_err);
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

    imap.once('error', (err:Error) => {
        console.error(`❌ [${config.accountName}] IMAP error`, err);
    });
    imap.once('end', () => {
        console.log(`⚠️ [${config.accountName}] IMAP connection ended`);
    });

    imap.connect();
}
