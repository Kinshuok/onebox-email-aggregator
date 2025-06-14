type Email = {
    subject: string;
    body: string;
    label: string;
};

import { useState } from 'react';

export default function EmailCard({ email }: { email: Email }) {
    const [open, setOpen] = useState(false);
    const [starred, setStarred] = useState(false);
    const snippet =
        email.body.length > 120 ? email.body.slice(0, 120) + '...' : email.body;

    return (
        <div className="email-card border-b p-3">
            <div className="flex justify-between items-start">
                <div className="flex-1" onClick={() => setOpen(!open)}>
                    <h3 className="font-bold mb-1">{email.subject}</h3>
                    <p className="text-gray-700 whitespace-pre-line">
                        {open ? email.body : snippet}
                    </p>
                </div>
                <div className="ml-2 flex items-center space-x-2">
                    <span className="label text-sm px-2 py-1">{email.label}</span>
                    <button
                        className="star"
                        onClick={(e) => {
                            e.stopPropagation();
                            setStarred(!starred);
                        }}
                    >
                        {starred ? '⭐' : '☆'}
                    </button>
                </div>
            </div>
        </div>
    );
}
