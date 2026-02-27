const { requireFields } = require('./common');

function validateQcRun(payload) {
    const missingError = requireFields(payload, ['analyte', 'controlLevel', 'value', 'mean', 'sd', 'equipmentId', 'staffId']);
    if (missingError) return missingError;

    if (Number(payload.sd) <= 0) return 'sd must be greater than zero';
    if (Number.isNaN(Number(payload.value)) || Number.isNaN(Number(payload.mean)) || Number.isNaN(Number(payload.sd))) {
        return 'value, mean, and sd must be numeric';
    }
    return null;
}

module.exports = {
    validateQcRun
};
