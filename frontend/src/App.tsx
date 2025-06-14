import { useState, useEffect } from "react";
import EmailCard from "./components/EmailCard";
import ConnectAccountButton from "./components/ConnectAccountButton";
import SearchBar from "./components/SearchBar";
import AccountSelector from "./components/AccountSelector";
import CategoryFilter from "./components/CategoryFilter";

type Email = {
    subject: string;
    body: string;
    label: string;
};

function App() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [search, setSearch] = useState("");
    const [accounts, setAccounts] = useState<string[]>([]);
    const [account, setAccount] = useState<string | null>(null);
    const [category, setCategory] = useState<string>("");

    // Load accounts from localStorage and handle OAuth redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const acc = params.get("account");

        const stored = JSON.parse(localStorage.getItem("accounts") || "[]") as string[];

        if (acc) {
            if (!stored.includes(acc)) {
                stored.push(acc);
                localStorage.setItem("accounts", JSON.stringify(stored));
            }
            setAccount(acc);
        } else if (stored.length > 0) {
            setAccount(stored[0]);
        }

        setAccounts(stored);
    }, []);

    useEffect(() => {
        if (!account) return;
        const url = `/search?account=${account}&q=${search}` + (category ? `&category=${encodeURIComponent(category)}` : "");
        fetch(url)
            .then(res => res.json())
            .then(data => setEmails(data))
            .catch(console.error);
    }, [search, account, category]);

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">📬 Your Onebox Emails</h1>

            {!account && accounts.length === 0 ? (
                <ConnectAccountButton />
            ) : (
                <>
                    <AccountSelector
                        accounts={accounts}
                        selected={account}
                        onSelect={(acc) => setAccount(acc)}
                    />
                    <SearchBar onSearch={setSearch} />
                    <CategoryFilter selected={category} onSelect={setCategory} />
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
