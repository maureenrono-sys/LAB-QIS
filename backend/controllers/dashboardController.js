const { Op } = require('sequelize');
const { DashboardSnapshot, Notification, RiskRegister, Department } = require('../models');
const { computeDashboardSnapshot, getCurrentPeriod } = require('../services/kpiService');

exports.getDashboardSummary = async (req, res) => {
    try {
        const period = req.query.period || getCurrentPeriod();
        let snapshot = await DashboardSnapshot.findOne({ where: { labId: req.user.labId, period } });
        if (!snapshot) {
            snapshot = await computeDashboardSnapshot(req.user.labId, period);
        }
        res.json(snapshot);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAlertsPanel = async (req, res) => {
    try {
        const alerts = await Notification.findAll({
            where: { labId: req.user.labId },
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRiskHeatMap = async (req, res) => {
    try {
        const risks = await RiskRegister.findAll({
            where: { labId: req.user.labId, status: { [Op.ne]: 'Closed' } },
            include: [{ model: Department, attributes: ['id', 'name'] }]
        });

        const matrix = risks.map((risk) => ({
            department: risk.Department ? risk.Department.name : 'Unassigned',
            likelihood: risk.likelihood,
            impact: risk.impact,
            residualScore: risk.residualScore
        }));

        res.json(matrix);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.recompute = async (req, res) => {
    try {
        const period = req.body.period || getCurrentPeriod();
        const snapshot = await computeDashboardSnapshot(req.user.labId, period);
        res.json(snapshot);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
