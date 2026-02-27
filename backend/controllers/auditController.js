const sequelize = require('../config/database');
const { Audit, AuditFinding, NonConformance, Notification } = require('../models');
const { sanitizeInput, sanitizeFreeText } = require('../validators/common');

// Helper to calculate SLIPTA stars
const calculateStars = (percentage) => {
    if (percentage >= 95) return 5;
    if (percentage >= 85) return 4;
    if (percentage >= 75) return 3;
    if (percentage >= 65) return 2;
    if (percentage >= 55) return 1;
    return 0;
};

function buildAutoNcPayload(findingsWithId, labId, auditId) {
    const dueDate = new Date(Date.now() + (14 * 24 * 60 * 60 * 1000));
    return findingsWithId
        .filter((finding) => Number(finding.scoreObtained) === 0)
        .map((finding) => ({
            labId,
            severity: 'High',
            status: 'Open',
            deadline: dueDate,
            description: `Auto-generated from audit ${auditId} | Clause: ${sanitizeInput(finding.clause || 'Unknown', 240)} | Evidence: ${sanitizeFreeText(finding.findingNote || 'No evidence note provided', 800)}`
        }));
}

exports.createAudit = async (req, res) => {
    try {
        const { auditType, findings } = req.body; // 'findings' is an array of objects
        if (!Array.isArray(findings) || findings.length === 0) {
            return res.status(400).json({ message: 'findings must be a non-empty array' });
        }

        const result = await sequelize.transaction(async (transaction) => {
            // 1. Create the Audit record
            const audit = await Audit.create({
                auditType,
                labId: req.user.labId
            }, { transaction });

            // 2. Save findings and calculate total score
            let totalPoints = 0;
            let possiblePoints = 0;

            const findingsWithId = findings.map((finding) => {
                const scoreObtained = Number(finding.scoreObtained) || 0;
                const maxScore = Number(finding.maxScore) || 0;
                if (scoreObtained < 0 || maxScore < 0 || scoreObtained > maxScore) {
                    throw new Error('Invalid finding score detected. Ensure 0 <= scoreObtained <= maxScore.');
                }
                totalPoints += scoreObtained;
                possiblePoints += maxScore;
                return {
                    ...finding,
                    clause: sanitizeInput(finding.clause || '', 255),
                    findingNote: sanitizeFreeText(finding.findingNote || '', 1000),
                    scoreObtained,
                    maxScore,
                    auditId: audit.id
                };
            });

            await AuditFinding.bulkCreate(findingsWithId, { transaction });

            // 3. Bridge Audit gaps -> NC workflow.
            // Rule: Any finding with zero score becomes an NC for mandatory closure.
            const autoNcPayload = buildAutoNcPayload(findingsWithId, req.user.labId, audit.id);

            if (autoNcPayload.length > 0) {
                await NonConformance.bulkCreate(autoNcPayload, { transaction });
                await Notification.create({
                    labId: req.user.labId,
                    type: 'Alert',
                    message: `Audit ${audit.id.substring(0, 8)} created ${autoNcPayload.length} auto-NC record(s) from zero-score gaps.`
                }, { transaction });
            }

            // 4. Update Audit with final scores
            const percentage = possiblePoints > 0 ? (totalPoints / possiblePoints) * 100 : 0;
            audit.totalScore = totalPoints;
            audit.starLevel = calculateStars(percentage);
            audit.status = 'Completed';
            await audit.save({ transaction });

            return { audit, autoNcCount: autoNcPayload.length };
        });

        res.status(201).json({
            ...result.audit.toJSON(),
            autoNcCreated: result.autoNcCount
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAudits = async (req, res) => {
    try {
        const audits = await Audit.findAll({
            where: { labId: req.user.labId },
            include: [{ model: AuditFinding }],
            order: [['createdAt', 'DESC']]
        });

        res.json(audits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.__testables = {
    calculateStars,
    buildAutoNcPayload
};
