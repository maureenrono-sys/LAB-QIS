const { getSystemState } = require('../services/systemStateService');

const BYPASS_PREFIXES = [
    '/api/system/health',
    '/api/auth/login',
    '/api/auth/demo-bootstrap'
];

async function enforceMaintenanceMode(req, res, next) {
    try {
        const state = await getSystemState();
        if (!state.maintenanceMode) return next();

        if (BYPASS_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
            return next();
        }

        return res.status(503).json({
            message: 'System is temporarily in maintenance mode. Please try again later.',
            maintenance: {
                enabled: true,
                reason: state.maintenanceReason || 'Scheduled maintenance',
                updatedAt: state.updatedAt || null
            }
        });
    } catch (error) {
        return next();
    }
}

module.exports = { enforceMaintenanceMode };
