const { requireFields } = require('./common');

function validateSop(payload) {
    const missingError = requireFields(payload, ['code', 'title']);
    if (missingError) return missingError;
    return null;
}

function validateSopVersion(payload) {
    const missingError = requireFields(payload, ['versionNo', 'filePath']);
    if (missingError) return missingError;
    if (payload.effectiveDate && payload.expiryDate && new Date(payload.expiryDate) <= new Date(payload.effectiveDate)) {
        return 'expiryDate must be later than effectiveDate';
    }
    return null;
}

module.exports = {
    validateSop,
    validateSopVersion
};
