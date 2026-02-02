const { NonConformance, Notification } = require('../models');

// @desc    Log a new Non-Conformance
// @route   POST /api/nc
exports.createNC = async (req, res) => {
    try {
        const { description, severity, rootCause, correctiveAction, deadline } = req.body;
        
        // 1. Save the Incident
        const nc = await NonConformance.create({
            description,
            severity,
            rootCause,
            correctiveAction,
            deadline,
            labId: req.user.labId 
        });

        // 2. Trigger the Notification for the UI
        await Notification.create({
            message: `Alert: New ${severity} severity incident logged.`,
            type: 'Alert',
            labId: req.user.labId
        });

        res.status(201).json(nc);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all Non-Conformances for my lab
// @route   GET /api/nc
exports.getNCs = async (req, res) => {
    try {
        const ncs = await NonConformance.findAll({ 
            where: { labId: req.user.labId },
            order: [['createdAt', 'DESC']]
        });
        res.json(ncs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};