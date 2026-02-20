const { Op } = require('sequelize');
const { RiskRegister } = require('../models');
const { validateRisk } = require('../validators/riskValidator');

function computeScores(likelihood, impact, controlEffectiveness = 0) {
    const inherentScore = Number(likelihood) * Number(impact);
    const reduction = Math.round((inherentScore * Number(controlEffectiveness || 0)) / 100);
    const residualScore = Math.max(1, inherentScore - reduction);
    return { inherentScore, residualScore };
}

exports.createRisk = async (req, res) => {
    try {
        const validationError = validateRisk(req.body);
        if (validationError) return res.status(400).json({ message: validationError });

        const { inherentScore, residualScore } = computeScores(req.body.likelihood, req.body.impact, req.body.controlEffectiveness);
        const risk = await RiskRegister.create({
            ...req.body,
            labId: req.user.labId,
            inherentScore,
            residualScore,
            lastReviewedAt: new Date()
        });
        res.status(201).json(risk);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateRiskScore = async (req, res) => {
    try {
        const risk = await RiskRegister.findOne({ where: { id: req.params.id, labId: req.user.labId } });
        if (!risk) return res.status(404).json({ message: 'Risk not found' });

        risk.likelihood = req.body.likelihood ?? risk.likelihood;
        risk.impact = req.body.impact ?? risk.impact;
        risk.controlEffectiveness = req.body.controlEffectiveness ?? risk.controlEffectiveness;
        risk.status = req.body.status || risk.status;
        const scores = computeScores(risk.likelihood, risk.impact, risk.controlEffectiveness);
        risk.inherentScore = scores.inherentScore;
        risk.residualScore = scores.residualScore;
        risk.lastReviewedAt = new Date();
        await risk.save();

        res.json(risk);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getRiskMatrix = async (req, res) => {
    try {
        const data = await RiskRegister.findAll({
            where: { labId: req.user.labId, status: { [Op.ne]: 'Closed' } },
            order: [['residualScore', 'DESC']]
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
