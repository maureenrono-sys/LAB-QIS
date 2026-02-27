const { LoginLog, ErrorLog, RequestAuditLog } = require('../models');

function resolveLimit(rawValue, fallback = 100) {
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed) || parsed <= 0) return fallback;
    return Math.min(parsed, 500);
}

exports.getLoginLogs = async (req, res) => {
    try {
        const limit = resolveLimit(req.query.limit);
        const logs = await LoginLog.findAll({
            where: { labId: req.user.labId },
            order: [['loggedAt', 'DESC']],
            limit
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getErrorLogs = async (req, res) => {
    try {
        const limit = resolveLimit(req.query.limit);
        const logs = await ErrorLog.findAll({
            where: { labId: req.user.labId },
            order: [['errorAt', 'DESC']],
            limit
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRequestAuditLogs = async (req, res) => {
    try {
        const limit = resolveLimit(req.query.limit, 200);
        const logs = await RequestAuditLog.findAll({
            where: { labId: req.user.labId },
            order: [['createdAt', 'DESC']],
            limit
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
