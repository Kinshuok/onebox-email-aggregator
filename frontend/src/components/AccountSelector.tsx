import ConnectAccountButton from "./ConnectAccountButton";

export default function AccountSelector({
    accounts,
    selected,
    onSelect,
}: {
    accounts: string[];
    selected: string | null;
    onSelect: (acc: string) => void;
}) {
    return (
        <div className="flex items-center space-x-2 mb-4">
            <select
                className="border px-2 py-1 rounded"
                value={selected ?? ""}
                onChange={(e) => onSelect(e.target.value)}
            >
                {accounts.length === 0 && <option value="">No accounts</option>}
                {accounts.length > 1 && <option value="">All accounts</option>}
                {accounts.map((acc) => (
                    <option key={acc} value={acc}>
                        {acc}
                    </option>
                ))}
            </select>
            <ConnectAccountButton />
        </div>
    );
}
