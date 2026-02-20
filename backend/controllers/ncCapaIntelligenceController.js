const { Op } = require('sequelize');
const { NonConformance, CapaAction } = require('../models');
const eventBus = require('../services/eventBus');

function severityScore(severity) {
    const scores = { Low: 2, Medium: 6, High: 12, Critical: 20 };
    return scores[severity] || 6;
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
            details: req.body.details
        });

        res.status(201).json(capa);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateCapaStatus = async (req, res) => {
    try {
        const capa = await CapaAction.findByPk(req.params.capaId);
        if (!capa) return res.status(404).json({ message: 'CAPA action not found' });

        capa.status = req.body.status || capa.status;
        capa.effectivenessScore = req.body.effectivenessScore ?? capa.effectivenessScore;
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
