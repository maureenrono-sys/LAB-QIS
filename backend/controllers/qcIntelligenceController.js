const { Op } = require('sequelize');
const { QcRun, QcRuleViolation } = require('../models');
const { validateQcRun } = require('../validators/qcValidator');
const eventBus = require('../services/eventBus');

function evaluateWestgard(values, mean, sd) {
    const latest = values[values.length - 1];
    const prev = values[values.length - 2];
    const alerts = [];
    let status = 'PASS';

    if (Math.abs(latest - mean) > 3 * sd) {
        alerts.push({ ruleCode: '1-3s', severity: 'Critical', message: 'Single point exceeded 3SD.' });
        status = 'REJECT';
    }

    if (prev !== undefined) {
        const latestDiff = latest - mean;
        const prevDiff = prev - mean;
        if (Math.abs(latestDiff) > 2 * sd && Math.abs(prevDiff) > 2 * sd && ((latestDiff > 0 && prevDiff > 0) || (latestDiff < 0 && prevDiff < 0))) {
            alerts.push({ ruleCode: '2-2s', severity: 'High', message: 'Two consecutive points exceeded 2SD on same side.' });
            status = 'REJECT';
        }
    }

    if (status !== 'REJECT' && Math.abs(latest - mean) > 2 * sd) {
        alerts.push({ ruleCode: '1-2s', severity: 'Medium', message: 'Latest point exceeded 2SD.' });
        status = 'WARNING';
    }

    return { status, alerts };
}

exports.createQcRun = async (req, res) => {
    try {
        const validationError = validateQcRun(req.body);
        if (validationError) return res.status(400).json({ message: validationError });

        const value = Number(req.body.value);
        const mean = Number(req.body.mean);
        const sd = Number(req.body.sd);
        const zScore = (value - mean) / sd;

        const recent = await QcRun.findAll({
            where: { labId: req.user.labId, analyte: req.body.analyte },
            order: [['runTime', 'DESC']],
            limit: 1
        });
        const values = [...recent.map((r) => Number(r.value)).reverse(), value];
        const { status, alerts } = evaluateWestgard(values, mean, sd);

        const run = await QcRun.create({
            labId: req.user.labId,
            departmentId: req.body.departmentId || null,
            equipmentId: req.body.equipmentId || null,
            analyte: req.body.analyte,
            controlLevel: req.body.controlLevel,
            runTime: req.body.runTime || new Date(),
            value,
            mean,
            sd,
            zScore,
            status
        });

        if (alerts.length > 0) {
            await Promise.all(alerts.map((alert) => QcRuleViolation.create({ ...alert, qcRunId: run.id })));
        }

        const failCount = await QcRun.count({
            where: {
                labId: req.user.labId,
                analyte: req.body.analyte,
                status: { [Op.in]: ['WARNING', 'REJECT'] },
                runTime: { [Op.gte]: new Date(Date.now() - (48 * 60 * 60 * 1000)) }
            }
        });

        if (status === 'REJECT' || failCount >= 2) {
            eventBus.emit('qc:failed', {
                labId: req.user.labId,
                departmentId: req.body.departmentId || null,
                analyte: req.body.analyte,
                severity: status === 'REJECT' ? 'Critical' : 'High',
                sourceRefId: run.id
            });
        }

        res.status(201).json({ run, alerts, failCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getQcRuns = async (req, res) => {
    try {
        const where = { labId: req.user.labId };
        if (req.query.analyte) where.analyte = req.query.analyte;
        const runs = await QcRun.findAll({ where, order: [['runTime', 'DESC']], limit: 200 });
        res.json(runs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getQcViolations = async (req, res) => {
    try {
        const violations = await QcRuleViolation.findAll({
            include: [{ model: QcRun, where: { labId: req.user.labId } }],
            order: [['createdAt', 'DESC']]
        });
        res.json(violations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getQcTrends = async (req, res) => {
    try {
        const runs = await QcRun.findAll({ where: { labId: req.user.labId } });
        const total = runs.length;
        const pass = runs.filter((item) => item.status === 'PASS').length;
        const warning = runs.filter((item) => item.status === 'WARNING').length;
        const reject = runs.filter((item) => item.status === 'REJECT').length;
        const passRate = total > 0 ? (pass / total) * 100 : 0;

        res.json({
            totalRuns: total,
            pass,
            warning,
            reject,
            passRate: Number(passRate.toFixed(2))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
