const { QualityIndicator } = require('../models');
const { Op, Sequelize } = require('sequelize');

exports.getRiskAnalysis = async (req, res) => {
    try {
        // Find all indicators for this lab where actual < target
        const failingIndicators = await QualityIndicator.findAll({
            where: {
                labId: req.user.labId,
                actualPercentage: { [Op.lt]: Sequelize.col('targetPercentage') }
            }
        });

        // Simple Intelligence: Identify which phase has the most failures
        const phaseRisks = failingIndicators.reduce((acc, curr) => {
            acc[curr.phase] = (acc[curr.phase] || 0) + 1;
            return acc;
        }, {});

        res.json({
            riskLevel: failingIndicators.length > 5 ? 'High' : 'Low',
            failingCount: failingIndicators.length,
            highRiskPhases: phaseRisks,
            recommendation: failingIndicators.length > 0 
                ? "Perform Root Cause Analysis on failing indicators immediately." 
                : "Quality standards are currently maintained."
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
