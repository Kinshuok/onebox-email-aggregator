import { useState, useEffect } from "react";
import EmailCard from "./components/EmailCard";
import ConnectAccountButton from "./components/ConnectAccountButton";
import SearchBar from "./components/SearchBar";

type Email = {
    subject: string;
    body: string;
    label: string;
};

function App() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [search, setSearch] = useState("");
    const [account, setAccount] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const acc = params.get("account");
        if (acc) setAccount(acc);
    }, []);

    useEffect(() => {
        if (!account) return;
        fetch(`/search?account=${account}&q=${search}`)
            .then(res => res.json())
            .then(data => setEmails(data))
            .catch(console.error);
    }, [search, account]);

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">📬 Your Onebox Emails</h1>

            {!account ? (
                <ConnectAccountButton />
            ) : (
                <>
                    <p className="mb-2">Logged in as <b>{account}</b></p>
                    <SearchBar onSearch={setSearch} />
                    <div className="mt-4 space-y-2">
                        {emails.length === 0 ? (
                            <p>No emails found.</p>
                        ) : (
                            emails.map((email, i) => <EmailCard key={i} email={email} />)
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default App;
