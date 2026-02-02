const { Audit, AuditFinding } = require('../models');

// Helper to calculate SLIPTA stars
const calculateStars = (percentage) => {
    if (percentage >= 95) return 5;
    if (percentage >= 85) return 4;
    if (percentage >= 75) return 3;
    if (percentage >= 65) return 2;
    if (percentage >= 55) return 1;
    return 0;
};

exports.createAudit = async (req, res) => {
    try {
        const { auditType, findings } = req.body; // 'findings' is an array of objects

        // 1. Create the Audit record
        const audit = await Audit.create({
            auditType,
            labId: req.user.labId
        });

        // 2. Save findings and calculate total score
        let totalPoints = 0;
        let possiblePoints = 0;

        const findingsWithId = findings.map(f => {
            totalPoints += f.scoreObtained;
            possiblePoints += f.maxScore;
            return { ...f, auditId: audit.id };
        });

        await AuditFinding.bulkCreate(findingsWithId);

        // 3. Update Audit with final scores
        const percentage = (totalPoints / possiblePoints) * 100;
        audit.totalScore = totalPoints;
        audit.starLevel = calculateStars(percentage);
        audit.status = 'Completed';
        await audit.save();

        res.status(201).json(audit);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};