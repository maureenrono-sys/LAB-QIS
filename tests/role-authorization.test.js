const test = require('node:test');
const assert = require('node:assert/strict');
const { authorizeRoleKeys } = require('../backend/middleware/roleMiddleware');

function mockRes() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
}

test('authorizeRoleKeys allows permitted role', () => {
    const middleware = authorizeRoleKeys('ADMIN', 'LAB_MANAGER');
    const req = { user: { role: 'Laboratory Manager' } };
    const res = mockRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
});

test('authorizeRoleKeys denies disallowed role', () => {
    const middleware = authorizeRoleKeys('ADMIN');
    const req = { user: { role: 'Laboratory Technologist' } };
    const res = mockRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
});
