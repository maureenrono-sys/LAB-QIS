const { Op } = require('sequelize');
const { NonConformance, CapaAction } = require('../models');
const eventBus = require('../services/eventBus');

const EFFECTIVENESS_REVIEW_DAYS = 90;

function severityScore(severity) {
    const scores = { Low: 2, Medium: 6, High: 12, Critical: 20 };
    return scores[severity] || 6;
}

function computeEffectivenessDueDate(fromDate = new Date()) {
    return new Date(fromDate.getTime() + (EFFECTIVENESS_REVIEW_DAYS * 24 * 60 * 60 * 1000));
}

exports.getOverdueNc = async (req, res) => {
    try {
        const items = await NonConformance.findAll({
            where: {
                labId: req.user.labId,
                status: { [Op.in]: ['Open', 'In Progress'] },
                deadline: { [Op.lt]: new Date() }
            },
            order: [['deadline', 'ASC']]
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRepeatNc = async (req, res) => {
    try {
        const since = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
        const all = await NonConformance.findAll({
            where: { labId: req.user.labId, createdAt: { [Op.gte]: since } },
            order: [['createdAt', 'DESC']]
        });

        const grouped = all.reduce((acc, nc) => {
            const key = `${nc.severity}:${(nc.rootCause || '').slice(0, 80)}`;
            acc[key] = acc[key] || [];
            acc[key].push(nc);
            return acc;
        }, {});

        const repeats = Object.values(grouped).filter((group) => group.length >= 2).flat();
        res.json(repeats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.classifyNc = async (req, res) => {
    try {
        const nc = await NonConformance.findOne({ where: { id: req.params.id, labId: req.user.labId } });
        if (!nc) return res.status(404).json({ message: 'NC not found' });

        nc.rootCause = req.body.rootCauseCategory || nc.rootCause;
        await nc.save();
        eventBus.emit('nc:updated', { labId: req.user.labId, ncId: nc.id });

        res.json({
            ncId: nc.id,
            rootCauseCategory: req.body.rootCauseCategory || null,
            riskSeverityScore: severityScore(nc.severity)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCapaAction = async (req, res) => {
    try {
        const nc = await NonConformance.findOne({ where: { id: req.params.id, labId: req.user.labId } });
        if (!nc) return res.status(404).json({ message: 'NC not found' });

        const capa = await CapaAction.create({
            labId: req.user.labId,
            ncId: nc.id,
            actionType: req.body.actionType || 'Corrective',
            ownerName: req.body.ownerName || 'Unassigned',
            dueDate: req.body.dueDate,
            details: req.body.details,
            effectivenessResult: 'Pending'
        });

        res.status(201).json(capa);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateCapaStatus = async (req, res) => {
    try {
        const capa = await CapaAction.findOne({
            where: { id: req.params.capaId, labId: req.user.labId }
        });
        if (!capa) return res.status(404).json({ message: 'CAPA action not found' });

        const previousStatus = capa.status;
        capa.status = req.body.status || capa.status;
        capa.effectivenessScore = req.body.effectivenessScore ?? capa.effectivenessScore;

        if (capa.status === 'Closed' && previousStatus !== 'Closed') {
            capa.effectivenessCheckDueAt = computeEffectivenessDueDate();
            capa.effectivenessResult = 'Pending';
            capa.effectivenessCheckedAt = null;
            capa.effectivenessNotes = null;
        }

        if (capa.status !== 'Closed' && previousStatus === 'Closed') {
            capa.effectivenessCheckDueAt = null;
            capa.effectivenessResult = 'Pending';
            capa.effectivenessCheckedAt = null;
            capa.effectivenessNotes = null;
        }

        await capa.save();

        eventBus.emit('capa:updated', {
            labId: req.user.labId,
            ncId: capa.ncId,
            status: capa.status
        });

        res.json(capa);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getEffectivenessQueue = async (req, res) => {
    try {
        const today = new Date();
        const rows = await CapaAction.findAll({
            where: {
                labId: req.user.labId,
                status: 'Closed',
                effectivenessResult: 'Pending'
            },
            include: [{
                model: NonConformance,
                attributes: ['id', 'description', 'severity', 'createdAt']
            }],
            order: [['effectivenessCheckDueAt', 'ASC'], ['updatedAt', 'DESC']]
        });

        const payload = rows.map((item) => {
            const dueAt = item.effectivenessCheckDueAt ? new Date(item.effectivenessCheckDueAt) : null;
            const daysToDue = dueAt ? Math.floor((dueAt.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)) : null;
            return {
                id: item.id,
                ncId: item.ncId,
                ownerName: item.ownerName,
                actionType: item.actionType,
                status: item.status,
                dueDate: item.dueDate,
                effectivenessCheckDueAt: item.effectivenessCheckDueAt,
                isOverdue: dueAt ? dueAt.getTime() < today.getTime() : false,
                daysToDue,
                NonConformance: item.NonConformance
            };
        });

        res.json({ total: payload.length, queue: payload });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateEffectivenessCheck = async (req, res) => {
    try {
        const capa = await CapaAction.findOne({
            where: { id: req.params.capaId, labId: req.user.labId }
        });
        if (!capa) return res.status(404).json({ message: 'CAPA action not found' });

        const result = req.body.effectivenessResult;
        const allowed = ['Effective', 'Ineffective', 'Pending'];
        if (!allowed.includes(result)) {
            return res.status(400).json({ message: 'effectivenessResult must be Effective, Ineffective, or Pending.' });
        }

        capa.effectivenessResult = result;
        capa.effectivenessScore = req.body.effectivenessScore ?? capa.effectivenessScore;
        capa.effectivenessNotes = req.body.effectivenessNotes || null;
        capa.effectivenessCheckedAt = result === 'Pending' ? null : new Date();

        if (result !== 'Pending' && !capa.effectivenessCheckDueAt) {
            capa.effectivenessCheckDueAt = new Date();
        }

        await capa.save();

        eventBus.emit('capa:updated', {
            labId: req.user.labId,
            ncId: capa.ncId,
            status: capa.status
        });

        res.json(capa);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};