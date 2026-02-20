const { QualityIndicator } = require('../models');

// @desc    Add a new Quality Indicator record
// @route   POST /api/qi
exports.addQI = async (req, res) => {
    try {
        const { name, phase, targetPercentage, actualPercentage, month, isoClause } = req.body;
        
        // req.user.labId comes from the Protect middleware we wrote earlier
        const qi = await QualityIndicator.create({
            name,
            phase,
            targetPercentage,
            actualPercentage,
            month,
            isoClause,
            labId: req.user.labId 
        });

        res.status(201).json(qi);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all QI records for the logged-in lab
// @route   GET /api/qi
exports.getMyLabQI = async (req, res) => {
    try {
        const indicators = await QualityIndicator.findAll({
            where: { labId: req.user.labId },
            order: [['createdAt', 'DESC']]
        });
        res.json(indicators);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
