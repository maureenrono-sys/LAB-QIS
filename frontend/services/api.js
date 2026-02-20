const API_URL = 'http://localhost:5000/api';

function authHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
    };
}

async function apiGet(path) {
    const res = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`GET ${path} failed`);
    return res.json();
}

async function apiPost(path, payload) {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`POST ${path} failed`);
    return res.json();
}

async function apiPut(path, payload) {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`PUT ${path} failed`);
    return res.json();
}

window.labQisApi = { apiGet, apiPost, apiPut };
