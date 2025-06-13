async function fetchAccounts() {
    const res = await fetch('/accounts');
    const accounts = await res.json();
    const sel = document.getElementById('account-select');
    accounts.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        sel.appendChild(opt);
    });
}

async function connectGmail() {
    const res = await fetch('/auth-url');
    const { url } = await res.json();
    window.location.href = url;
}

async function search() {
    const q = document.getElementById('search-box').value;
    const account = document.getElementById('account-select').value;
    const category = document.getElementById('category-select').value;
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (account) params.append('account', account);
    if (category) params.append('category', category);
    const res = await fetch('/search?' + params.toString());
    const emails = await res.json();
    const container = document.getElementById('results');
    container.innerHTML = '';
    emails.forEach(e => {
        const div = document.createElement('div');
        div.className = 'email-item';
        div.innerHTML = `<strong>${e.subject}</strong> - ${e.from} (${e.category}) <div class="email-body">${e.body}</div>`;
        div.addEventListener('click', () => {
            const body = div.querySelector('.email-body');
            body.style.display = body.style.display === 'none' ? 'block' : 'none';
        });
        container.appendChild(div);
    });
}

document.getElementById('connect-btn').addEventListener('click', connectGmail);
document.getElementById('search-btn').addEventListener('click', search);

fetchAccounts();
