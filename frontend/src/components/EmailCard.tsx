type Email = {
    subject: string;
    body: string;
    label: string;
};

export default function EmailCard({ email }: { email: Email }) {
    return (
        <div className="border p-4 rounded shadow-sm">
            <h3 className="font-bold">{email.subject}</h3>
            <p className="text-gray-700 mt-1 whitespace-pre-line">{email.body}</p>
            <span className="mt-2 inline-block bg-gray-200 text-sm px-2 py-1 rounded">
        {email.label}
      </span>
        </div>
    );
}
