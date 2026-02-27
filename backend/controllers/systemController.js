const sequelize = require('../config/database');
const {
    Laboratory,
    User,
    QualityIndicator,
    NonConformance,
    Audit,
    ClientFeedback,
    Equipment,
    Staff,
    DashboardSnapshot
} = require('../models');
const { getSystemState, setMaintenanceMode } = require('../services/systemStateService');

const BACKUP_MODELS = {
    laboratories: Laboratory,
    users: User,
    qualityIndicators: QualityIndicator,
    nonConformances: NonConformance,
    audits: Audit,
    clientFeedback: ClientFeedback,
    equipment: Equipment,
    staff: Staff,
    dashboardSnapshots: DashboardSnapshot
};

exports.getLiveness = async (req, res) => {
    res.json({
        status: 'ok',
        service: 'lab-qis',
        now: new Date().toISOString()
    });
};

exports.getReadiness = async (req, res) => {
    try {
        await sequelize.authenticate();
        const state = await getSystemState();
        res.json({
            ready: true,
            database: 'ok',
            maintenanceMode: Boolean(state.maintenanceMode),
            now: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            ready: false,
            database: 'error',
            message: error.message
        });
    }
};

exports.getMaintenance = async (req, res) => {
    const state = await getSystemState();
    res.json({
        maintenanceMode: Boolean(state.maintenanceMode),
        maintenanceReason: state.maintenanceReason || '',
        updatedAt: state.updatedAt || null,
        updatedBy: state.updatedBy || null
    });
};

exports.updateMaintenance = async (req, res) => {
    const enabled = req.body.enabled === true;
    const reason = String(req.body.reason || '').trim();
    const updatedBy = req.user?.email || req.user?.id || 'unknown';
    const state = await setMaintenanceMode({ enabled, reason, updatedBy });
    res.json({
        message: enabled ? 'Maintenance mode enabled.' : 'Maintenance mode disabled.',
        state
    });
};

exports.exportBackup = async (req, res) => {
    try {
        const scope = req.query.scope === 'all' ? 'all' : 'lab';
        const whereLab = scope === 'all' ? {} : { labId: req.user.labId };
        const backup = {
            metadata: {
                exportedAt: new Date().toISOString(),
                exportedBy: req.user?.email || req.user?.id || 'unknown',
                scope,
                version: 1
            },
            data: {}
        };

        for (const [key, model] of Object.entries(BACKUP_MODELS)) {
            const supportsLabScope = Object.prototype.hasOwnProperty.call(model.getAttributes(), 'labId');
            const rows = await model.findAll({
                where: supportsLabScope ? whereLab : (scope === 'all' ? {} : { id: null }),
                raw: true
            });
            backup.data[key] = rows;
        }

        res.json(backup);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.importBackup = async (req, res) => {
    const payload = req.body || {};
    if (!payload.data || typeof payload.data !== 'object') {
        return res.status(400).json({ message: 'Invalid backup payload: missing data object.' });
    }

    const imported = {};
    try {
        for (const [key, model] of Object.entries(BACKUP_MODELS)) {
            const rows = Array.isArray(payload.data[key]) ? payload.data[key] : [];
            if (!rows.length) {
                imported[key] = 0;
                continue;
            }
            const supportsLabScope = Object.prototype.hasOwnProperty.call(model.getAttributes(), 'labId');
            const scopedRows = supportsLabScope
                ? rows.filter((row) => row.labId === req.user.labId || req.query.scope === 'all')
                : rows;

            if (!scopedRows.length) {
                imported[key] = 0;
                continue;
            }

            await model.bulkCreate(scopedRows, {
                ignoreDuplicates: true
            });
            imported[key] = scopedRows.length;
        }

        return res.json({
            message: 'Backup import completed (duplicates ignored).',
            imported
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
