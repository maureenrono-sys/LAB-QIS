const { requireFields } = require('./common');

function validateStaff(payload) {
    return requireFields(payload, ['staffNo', 'fullName', 'roleName']);
}

function validateCompetency(payload) {
    const missingError = requireFields(payload, ['testCode', 'assessedAt', 'expiresAt']);
    if (missingError) return missingError;
    if (new Date(payload.expiresAt) <= new Date(payload.assessedAt)) {
        return 'expiresAt must be later than assessedAt';
    }
    return null;
}

module.exports = {
    validateStaff,
    validateCompetency
};
