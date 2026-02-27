const test = require('node:test');
const assert = require('node:assert/strict');
const { __testables } = require('../backend/controllers/qcIntelligenceController');

test('westgard rejects when latest point exceeds 3SD', () => {
    const out = __testables.evaluateWestgard([10, 10.1, 15], 10, 1);
    assert.equal(out.status, 'REJECT');
    assert.ok(out.alerts.some((a) => a.ruleCode === '1-3s'));
});

test('qc gate reasons include overdue service and missing competency', () => {
    const reasons = __testables.buildQcGateReasons({
        equipment: {
            status: 'Operational',
            nextServiceDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        competency: null,
        now: new Date(),
        competencyTestCode: 'HIV'
    });
    assert.ok(reasons.some((r) => r.includes('overdue')));
    assert.ok(reasons.some((r) => r.includes('No competency record')));
});
