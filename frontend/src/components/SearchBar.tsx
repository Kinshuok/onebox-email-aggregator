import { useState } from "react";

export default function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
    const [input, setInput] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(input.trim());
    };

    return (
        <form onSubmit={handleSubmit} className="mb-4">
            <input
                type="text"
                className="border px-3 py-1 rounded mr-2"
                placeholder="Search emails"
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            <button className="bg-gray-700 text-white px-3 py-1 rounded" type="submit">
                Search
            </button>
        </form>
    );
}
