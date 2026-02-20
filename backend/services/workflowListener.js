const eventBus = require('./eventBus');
const { createAlert } = require('./alertService');
const { computeDashboardSnapshot } = require('./kpiService');
const { NonConformance, RiskRegister } = require('../models');

function riskFromNcSeverity(severity) {
    const matrix = {
        Low: { likelihood: 2, impact: 2 },
        Medium: { likelihood: 3, impact: 3 },
        High: { likelihood: 4, impact: 4 },
        Critical: { likelihood: 5, impact: 5 }
    };
    return matrix[severity] || matrix.Medium;
}

function initWorkflowListeners() {
    eventBus.on('qc:failed', async (payload) => {
        const { labId, departmentId, analyte, severity, sourceRefId } = payload;
        const nc = await NonConformance.create({
            description: `Auto-generated NC from QC rule violation: ${analyte}`,
            severity: severity || 'High',
            status: 'Open',
            labId
        });

        const scoreBase = riskFromNcSeverity(nc.severity);
        await RiskRegister.create({
            labId,
            departmentId,
            title: `Risk from QC NC ${nc.id.slice(0, 8)}`,
            hazard: `QC failure risk for ${analyte}`,
            sourceType: 'QC',
            sourceRefId: sourceRefId || nc.id,
            likelihood: scoreBase.likelihood,
            impact: scoreBase.impact,
            inherentScore: scoreBase.likelihood * scoreBase.impact,
            residualScore: scoreBase.likelihood * scoreBase.impact,
            status: 'Open'
        });

        await createAlert({
            labId,
            message: `QC -> NC -> Risk triggered for analyte ${analyte}. Immediate CAPA required.`,
            type: 'Alert'
        });

        await computeDashboardSnapshot(labId);
    });

    eventBus.on('nc:updated', async ({ labId, ncId }) => {
        await createAlert({
            labId,
            message: `NC ${ncId.slice(0, 8)} updated. Risk and CAPA metrics refreshed.`,
            type: 'Update'
        });
        await computeDashboardSnapshot(labId);
    });

    eventBus.on('capa:updated', async ({ labId, ncId, status }) => {
        await createAlert({
            labId,
            message: `CAPA for NC ${ncId.slice(0, 8)} is now ${status}.`,
            type: 'Update'
        });
        await computeDashboardSnapshot(labId);
    });
}

module.exports = {
    initWorkflowListeners
};
