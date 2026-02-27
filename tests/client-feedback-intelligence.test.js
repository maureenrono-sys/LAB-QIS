const test = require('node:test');
const assert = require('node:assert/strict');
const { __testables } = require('../backend/controllers/clientFeedbackController');

test('feedback severity inference prioritizes complaint risk', () => {
    assert.equal(__testables.inferSeverity('Complaint', 1, 'wrong result reported'), 'High');
    assert.equal(__testables.inferSeverity('Complaint', 3, 'late turnaround'), 'Medium');
    assert.equal(__testables.inferSeverity('Compliment', 5, 'good service'), 'Low');
});

test('feedback tags infer common complaint categories', () => {
    const tags = __testables.inferTags('Result delay and rude attitude by staff');
    assert.ok(tags.includes('TAT delay'));
    assert.ok(tags.includes('Staff attitude'));
});
