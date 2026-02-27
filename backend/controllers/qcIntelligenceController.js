const { Op } = require('sequelize');
const { QcRun, QcRuleViolation, Equipment, Staff, Competency, NonConformance, Notification } = require('../models');
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

function buildQcGateReasons({ equipment, competency, now, competencyTestCode }) {
    const gateReasons = [];
    if (!equipment) {
        gateReasons.push('Equipment record not found');
        return gateReasons;
    }

    if (equipment.status !== 'Operational') {
        gateReasons.push(`Equipment status is ${equipment.status}`);
    }
    if (equipment.nextServiceDate && new Date(equipment.nextServiceDate).getTime() < now.getTime()) {
        gateReasons.push('Equipment service is overdue');
    }

    if (!competency) {
        gateReasons.push(`No competency record for method "${competencyTestCode}"`);
    } else {
        if (competency.status !== 'Competent') {
            gateReasons.push(`Staff competency status is ${competency.status}`);
        }
        if (new Date(competency.expiresAt).getTime() < now.getTime()) {
            gateReasons.push(`Staff competency expired on ${new Date(competency.expiresAt).toLocaleDateString()}`);
        }
    }

    return gateReasons;
}

async function createQcGateBlockRecords(req, equipment, gateReasons) {
    const reasonText = gateReasons.join('; ');
    const description = `QC run blocked by quality gate for equipment "${equipment?.name || 'Unknown'}": ${reasonText}`;

    await NonConformance.create({
        labId: req.user.labId,
        severity: 'High',
        status: 'Open',
        description,
        assignedTo: req.user.fullName || null
    });

    await Notification.create({
        labId: req.user.labId,
        type: 'Alert',
        message: `QC Gate Block: ${reasonText}`
    });
}

exports.getQcGateOptions = async (req, res) => {
    try {
        const [equipment, staff] = await Promise.all([
            Equipment.findAll({
                where: { labId: req.user.labId },
                order: [['department', 'ASC'], ['name', 'ASC']]
            }),
            Staff.findAll({
                where: { labId: req.user.labId, isActive: true },
                order: [['fullName', 'ASC']]
            })
        ]);

        res.json({ equipment, staff });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createQcRun = async (req, res) => {
    try {
        const validationError = validateQcRun(req.body);
        if (validationError) return res.status(400).json({ message: validationError });

        const value = Number(req.body.value);
        const mean = Number(req.body.mean);
        const sd = Number(req.body.sd);
        const zScore = (value - mean) / sd;

        const [equipment, staff] = await Promise.all([
            Equipment.findOne({
                where: { id: req.body.equipmentId, labId: req.user.labId }
            }),
            Staff.findOne({
                where: { id: req.body.staffId, labId: req.user.labId, isActive: true }
            })
        ]);

        if (!equipment) {
            return res.status(404).json({ message: 'Selected equipment not found for this lab.' });
        }
        if (!staff) {
            return res.status(404).json({ message: 'Selected staff member not found or inactive.' });
        }

        const now = new Date();

        const competencyTestCode = req.body.testCode || req.body.analyte;
        const competency = await Competency.findOne({
            where: {
                staffId: staff.id,
                testCode: competencyTestCode
            },
            order: [['expiresAt', 'DESC']]
        });

        const gateReasons = buildQcGateReasons({ equipment, competency, now, competencyTestCode });

        if (gateReasons.length > 0) {
            await createQcGateBlockRecords(req, equipment, gateReasons);
            return res.status(409).json({
                message: 'QC run blocked by quality gate.',
                code: 'QC_GATE_BLOCKED',
                gateReasons
            });
        }

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
            equipmentId: req.body.equipmentId,
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

exports.__testables = {
    evaluateWestgard,
    buildQcGateReasons
};
