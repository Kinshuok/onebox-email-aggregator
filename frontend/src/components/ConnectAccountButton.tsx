export default function ConnectAccountButton() {
    const handleClick = async () => {
        try {
            const res = await fetch("/auth-url");
            const data = await res.json();
            window.location.href = data.url;
        } catch (err) {
            alert("Failed to get auth URL. Is the backend running?");
            console.error(err);
        }
    };

    return (
        <button onClick={handleClick} className="bg-blue-600 text-white px-4 py-2 rounded">
            Connect Gmail Account
        </button>
    );
}
