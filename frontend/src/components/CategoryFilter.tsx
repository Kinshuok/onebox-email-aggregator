export const CATEGORIES = [
    'Interested',
    'Meeting Booked',
    'Not Interested',
    'Spam',
    'Out of Office',
    'Uncategorized',
];

export default function CategoryFilter({
    selected,
    onSelect,
}: {
    selected: string;
    onSelect: (c: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2 mb-4">
            <button
                className={`px-2 py-1 rounded ${selected === '' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => onSelect('')}
            >
                All
            </button>
            {CATEGORIES.map((cat) => (
                <button
                    key={cat}
                    className={`px-2 py-1 rounded ${selected === cat ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => onSelect(cat)}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
