type Email = {
    subject: string;
    body: string;
    label: string;
};

import { useState } from 'react';

export default function EmailCard({ email }: { email: Email }) {
    const [open, setOpen] = useState(false);
    const snippet =
        email.body.length > 120 ? email.body.slice(0, 120) + '...' : email.body;

    return (
        <div className="border p-4 rounded shadow-sm">
            <h3 className="font-bold mb-1">{email.subject}</h3>
            <p className="text-gray-700 whitespace-pre-line">
                {open ? email.body : snippet}
            </p>
            <div className="mt-2 flex items-center space-x-2">
                <span className="inline-block bg-gray-200 text-sm px-2 py-1 rounded">
                    {email.label}
                </span>
                <button
                    className="text-blue-600 text-sm underline"
                    onClick={() => setOpen(!open)}
                >
                    {open ? 'Hide' : 'Open'}
                </button>
            </div>
        </div>
    );
}
