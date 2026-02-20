const { requireFields } = require('./common');

function validateRisk(payload) {
    const missingError = requireFields(payload, ['title', 'hazard', 'likelihood', 'impact']);
    if (missingError) return missingError;

    const likelihood = Number(payload.likelihood);
    const impact = Number(payload.impact);
    const controlEffectiveness = Number(payload.controlEffectiveness || 0);

    if (likelihood < 1 || likelihood > 5) return 'likelihood must be between 1 and 5';
    if (impact < 1 || impact > 5) return 'impact must be between 1 and 5';
    if (controlEffectiveness < 0 || controlEffectiveness > 100) return 'controlEffectiveness must be between 0 and 100';
    return null;
}

module.exports = {
    validateRisk
};
