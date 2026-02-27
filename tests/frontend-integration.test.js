const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '../frontend');

test('critical pages include app.js and bootstrap bundle', () => {
    const pages = ['dashboard.html', 'admin-portal.html', 'client-feedback.html', 'benchmarking.html'];
    for (const page of pages) {
        const html = fs.readFileSync(path.join(FRONTEND_DIR, page), 'utf8');
        assert.match(html, /app\.js/);
        assert.match(html, /bootstrap(?:\.bundle)?\.min\.js/);
    }
});

test('feedback/admin workflows no longer use prompt-based editing', () => {
    const appJs = fs.readFileSync(path.join(FRONTEND_DIR, 'app.js'), 'utf8');
    const criticalFns = ['updateFeedbackWorkflow', 'linkFeedbackToNc', 'editLabFromAdmin', 'editUserFromAdmin'];
    for (const fn of criticalFns) {
        const fnStart = appJs.indexOf(`async function ${fn}`);
        assert.notEqual(fnStart, -1, `${fn} function not found`);
        const snippet = appJs.slice(fnStart, fnStart + 1200);
        assert.equal(snippet.includes('prompt('), false, `${fn} still uses prompt()`);
    }
});
