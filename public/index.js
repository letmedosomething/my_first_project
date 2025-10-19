const nameEl = document.getElementById('name');
const passEl = document.getElementById('pass');
const msg = document.getElementById('msg');
const usernames = '';
async function post(url, data) {
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

function show(text, ok = true) {
    msg.style.color = ok ? 'green' : 'red';
    msg.textContent = text;
}

document.getElementById('reg').onclick = async () => {
    const name = nameEl.value.trim(), password = passEl.value;
    if (!name || !password) { show('Fill both', false); return; }

    const r = await post('/register', { name, password });
    const json = await r.json().catch(() => ({ message: 'Error' }));

    show(json.message || (r.ok ? 'Registered' : 'Failed'), r.ok);

    if (r.ok) {
        // ✅ Save username only if registration succeeded
        localStorage.setItem('currentUser', name);
        const currentUser = localStorage.getItem('currentUser');
        console.log("regist page done" + currentUser);
    }
};

document.getElementById('log').onclick = async () => {
    const name = nameEl.value.trim(), password = passEl.value;
    if (!name || !password) { show('Fill both', false); return; }
    const r = await post('/login', { name, password });
    const json = await r.json().catch(() => ({ message: 'Error' }));
    if (r.ok) {
        // redirect to welcome page
        localStorage.setItem('currentUser', name);
        const currentUser = localStorage.getItem('currentUser');
        console.log("Login page done — currentUser:", currentUser);

        window.location.href = '/info';
    } else {
        show(json.message || 'Login failed', false);

    }


    console.log("login page done")
};
