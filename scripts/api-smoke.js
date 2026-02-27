const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const EMAIL = process.env.SMOKE_USER_EMAIL || '';
const PASSWORD = process.env.SMOKE_USER_PASSWORD || '';

async function request(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, options);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

async function run() {
    if (!EMAIL || !PASSWORD) {
        console.error('Set SMOKE_USER_EMAIL and SMOKE_USER_PASSWORD to run smoke tests.');
        process.exit(1);
    }

    const login = await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });
    if (!login.ok) {
        console.error(`Login failed: ${login.status} ${login.data.message || ''}`);
        process.exit(1);
    }

    const token = login.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    const checks = [
        ['/benchmarks/summary', 'GET'],
        ['/nc', 'GET'],
        ['/audits', 'GET'],
        ['/client-feedback/analytics/summary', 'GET'],
        ['/system/health/ready', 'GET']
    ];

    for (const [path, method] of checks) {
        const result = await request(path, { method, headers });
        if (!result.ok) {
            console.error(`Smoke check failed: ${method} ${path} -> ${result.status}`);
            process.exit(1);
        }
        console.log(`OK ${method} ${path}`);
    }

    console.log('API smoke checks passed.');
}

run().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
