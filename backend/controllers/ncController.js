const { Op } = require('sequelize');
const { NonConformance, Notification, RiskRegister } = require('../models');

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(dateValue) {
    if (!dateValue) return 0;
    return Math.floor((Date.now() - new Date(dateValue).getTime()) / DAY_MS);
}

function normalizeSignature(input) {
    return String(input || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 90);
}

function riskKeywords(nc) {
    const source = `${nc.description || ''} ${nc.rootCause || ''}`.toLowerCase();
    return source
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length >= 5)
        .slice(0, 6);
}

async function createEscalationIfMissing(labId, message) {
    const existing = await Notification.findOne({
        where: { labId, message, isRead: false }
    });
    if (existing) return;

    await Notification.create({
        message,
        type: 'Alert',
        labId
    });
}

async function deriveRiskSuggestion(nc) {
    const windowStart = new Date(Date.now() - (180 * DAY_MS));
    const recent = await NonConformance.findAll({
        where: {
            labId: nc.labId,
            createdAt: { [Op.gte]: windowStart }
        },
        attributes: ['id', 'description', 'rootCause', 'severity', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 500
    });

    const signature = normalizeSignature(nc.rootCause || nc.description);
    if (!signature) return null;

    const repeats = recent.filter((item) => normalizeSignature(item.rootCause || item.description) === signature);
    if (repeats.length < 3) return null;

    const keywords = riskKeywords(nc);
    const riskWhere = {
        labId: nc.labId,
        status: { [Op.ne]: 'Closed' }
    };

    if (keywords.length) {
        riskWhere[Op.or] = keywords.map((word) => ({
            [Op.or]: [
                { title: { [Op.like]: `%${word}%` } },
                { hazard: { [Op.like]: `%${word}%` } }
            ]
        }));
    }

    const matchingRisks = await RiskRegister.findAll({
        where: riskWhere,
        attributes: ['id', 'title', 'likelihood', 'impact', 'residualScore', 'status'],
        order: [['residualScore', 'DESC']],
        limit: 3
    });

    const suggestion = {
        signature,
        repeatCount: repeats.length,
        recommendation: 'This NC pattern has occurred at least 3 times. Review linked risk likelihood and strengthen controls.',
        matchingRisks
    };

    const riskLead = matchingRisks[0];
    const riskText = riskLead
        ? `Top matching risk: ${riskLead.title} (Likelihood ${riskLead.likelihood}/5).`
        : 'No matching risk was found; consider creating a new NC-sourced risk.';

    await createEscalationIfMissing(
        nc.labId,
        `Risk linkage alert: NC pattern repeated ${repeats.length} times in 6 months. ${riskText}`
    );

    return suggestion;
}

exports.createNC = async (req, res) => {
    try {
        const { description, severity, rootCause, correctiveAction, deadline } = req.body;

        const nc = await NonConformance.create({
            description,
            severity,
            rootCause,
            correctiveAction,
            deadline,
            labId: req.user.labId
        });

        await Notification.create({
            message: `Alert: New ${severity} severity incident logged.`,
            type: 'Alert',
            labId: req.user.labId
        });

        const riskSuggestion = await deriveRiskSuggestion(nc);

        res.status(201).json({ ...nc.toJSON(), riskSuggestion });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getNCs = async (req, res) => {
    try {
        const ncs = await NonConformance.findAll({
            where: { labId: req.user.labId },
            order: [['createdAt', 'DESC']]
        });

        for (const nc of ncs) {
            if (nc.status === 'Open' && daysSince(nc.createdAt) > 2) {
                await createEscalationIfMissing(
                    req.user.labId,
                    `Escalation: NC ${nc.id.substring(0, 8)} has remained Open for more than 48 hours.`
                );
            }

            if (nc.status === 'In Progress' && daysSince(nc.updatedAt) > 7) {
                await createEscalationIfMissing(
                    req.user.labId,
                    `Escalation: CAPA ${nc.id.substring(0, 8)} has remained In Progress for over 7 days.`
                );
            }
        }

        res.json(ncs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateNC = async (req, res) => {
    try {
        const nc = await NonConformance.findOne({
            where: { id: req.params.id, labId: req.user.labId }
        });

        if (!nc) {
            return res.status(404).json({ message: 'Non-conformance not found.' });
        }

        const {
            rootCause,
            correctiveAction,
            deadline,
            assignedTo,
            status,
            overdueJustification,
            effectivenessEvidence
        } = req.body;

        if (rootCause !== undefined) nc.rootCause = rootCause;
        if (correctiveAction !== undefined) nc.correctiveAction = correctiveAction;
        if (deadline !== undefined) nc.deadline = deadline || null;
        if (assignedTo !== undefined) nc.assignedTo = assignedTo || null;
        if (overdueJustification !== undefined) nc.overdueJustification = overdueJustification || null;
        if (effectivenessEvidence !== undefined) nc.effectivenessEvidence = effectivenessEvidence || null;

        if (status !== undefined) {
            const currentStatus = nc.status;
            const transitions = {
                Open: ['In Progress'],
                'In Progress': ['Verified'],
                Verified: ['Closed'],
                Closed: []
            };

            if (status !== currentStatus && !transitions[currentStatus].includes(status)) {
                return res.status(400).json({
                    message: `Invalid workflow transition: ${currentStatus} -> ${status}.`
                });
            }

            if (['In Progress', 'Verified', 'Closed'].includes(status)) {
                if (!nc.rootCause || !nc.correctiveAction) {
                    return res.status(400).json({
                        message: 'Root cause and corrective action must be completed before advancing status.'
                    });
                }
            }

            if (status === 'In Progress') {
                if (!nc.assignedTo || !String(nc.assignedTo).trim()) {
                    return res.status(400).json({
                        message: 'An assignee is required before moving to In Progress.'
                    });
                }
                if (!nc.deadline) {
                    return res.status(400).json({
                        message: 'A deadline is required before moving to In Progress.'
                    });
                }
            }

            if (status === 'Verified') {
                const isOverdue = nc.deadline && new Date(nc.deadline).getTime() < Date.now();
                if (isOverdue && (!nc.overdueJustification || !String(nc.overdueJustification).trim())) {
                    return res.status(400).json({
                        message: 'This CAPA is overdue. Add an overdue justification before moving to Verified.'
                    });
                }
            }

            if (status === 'Closed') {
                if (!nc.effectivenessEvidence || !String(nc.effectivenessEvidence).trim()) {
                    return res.status(400).json({
                        message: 'Effectiveness evidence is required before closing CAPA.'
                    });
                }
            }

            nc.status = status;
        }

        await nc.save();

        await Notification.create({
            message: `NC ${nc.id.substring(0, 8)} updated to "${nc.status}".`,
            type: 'Alert',
            labId: req.user.labId
        });

        const riskSuggestion = await deriveRiskSuggestion(nc);

        res.json({ ...nc.toJSON(), riskSuggestion });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};