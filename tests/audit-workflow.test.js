const test = require('node:test');
const assert = require('node:assert/strict');
const { __testables } = require('../backend/controllers/auditController');

test('audit stars are calculated across thresholds', () => {
    assert.equal(__testables.calculateStars(96), 5);
    assert.equal(__testables.calculateStars(87), 4);
    assert.equal(__testables.calculateStars(76), 3);
    assert.equal(__testables.calculateStars(66), 2);
    assert.equal(__testables.calculateStars(56), 1);
    assert.equal(__testables.calculateStars(40), 0);
});

test('auto NC payload only includes zero-score findings', () => {
    const payload = __testables.buildAutoNcPayload([
        { clause: '1.0', findingNote: 'missing record', scoreObtained: 0 },
        { clause: '2.0', findingNote: 'ok', scoreObtained: 3 }
    ], 'lab-1', 'audit-1');

    assert.equal(payload.length, 1);
    assert.equal(payload[0].labId, 'lab-1');
    assert.equal(payload[0].severity, 'High');
    assert.match(payload[0].description, /audit-1/);
    assert.match(payload[0].description, /missing record/);
});
