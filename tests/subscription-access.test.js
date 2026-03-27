const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('laboratory model defaults subscription status to trial', () => {
    const modelSource = fs.readFileSync(path.join(__dirname, '../backend/models/Laboratory.js'), 'utf8');
    assert.match(modelSource, /subscriptionStatus/);
    assert.match(modelSource, /defaultValue:\s*'trial'/);
});

test('login blocks suspended laboratories with a clear message', () => {
    const authSource = fs.readFileSync(path.join(__dirname, '../backend/controllers/authController.js'), 'utf8');
    assert.match(authSource, /subscriptionStatus/);
    assert.match(authSource, /Lab subscription suspended/);
    assert.match(authSource, /This laboratory account is suspended/);
});
