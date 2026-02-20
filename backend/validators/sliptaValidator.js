const { requireFields } = require('./common');

function validateSliptaAssessment(payload) {
    const missingError = requireFields(payload, ['items']);
    if (missingError) return missingError;
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
        return 'items must be a non-empty array';
    }
    return null;
}

module.exports = {
    validateSliptaAssessment
};
