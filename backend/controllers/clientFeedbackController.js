const { Op, Sequelize } = require('sequelize');
const { ClientFeedback, NonConformance, Notification } = require('../models');
const { validateClientFeedback, FEEDBACK_ENUMS } = require('../validators/clientFeedbackValidator');
const { sanitizeInput, sanitizeFreeText } = require('../validators/common');

function makeFeedbackCode() {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `FB-${y}${m}${d}-${suffix}`;
}

function inferSeverity(category, rating, description) {
    const text = String(description || '').toLowerCase();
    if (category === 'Complaint' && (rating <= 2 || text.includes('wrong result') || text.includes('critical'))) {
        return 'High';
    }
    if (category === 'Complaint' && rating <= 3) return 'Medium';
    if (category === 'Inquiry' || category === 'Compliment') return 'Low';
    return 'Medium';
}

function inferTags(description) {
    const text = String(description || '').toLowerCase();
    const tags = [];
    if (text.includes('tat') || text.includes('delay') || text.includes('late')) tags.push('TAT delay');
    if (text.includes('attitude') || text.includes('rude')) tags.push('Staff attitude');
    if (text.includes('accuracy') || text.includes('wrong result')) tags.push('Result accuracy');
    if (text.includes('reject')) tags.push('Sample rejection');
    if (text.includes('bill') || text.includes('charge') || text.includes('payment')) tags.push('Billing');
    if (text.includes('communicat') || text.includes('inform')) tags.push('Communication');
    if (!tags.length) tags.push('Other');
    return tags;
}

function normalizeTagList(tags) {
    if (!Array.isArray(tags)) return inferTags('');
    return tags
        .map((tag) => sanitizeInput(tag, 64))
        .filter((tag) => FEEDBACK_ENUMS.TAGS.includes(tag));
}

function normalizeDateOrNull(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

exports.createFeedback = async (req, res) => {
    try {
        const validationError = validateClientFeedback(req.body);
        if (validationError) return res.status(400).json({ message: validationError });

        const isAnonymous = Boolean(req.body.isAnonymous);
        const category = sanitizeInput(req.body.category, 40);
        const rating = Number(req.body.satisfactionRating);
        const description = sanitizeFreeText(req.body.description, 4000);
        const severity = req.body.severity || inferSeverity(category, rating, description);
        const tags = Array.isArray(req.body.tags) && req.body.tags.length > 0
            ? normalizeTagList(req.body.tags)
            : inferTags(description);

        const feedback = await ClientFeedback.create({
            feedbackCode: makeFeedbackCode(),
            submittedAt: new Date(),
            labId: req.user.labId,
            clientType: sanitizeInput(req.body.clientType, 64),
            department: sanitizeInput(req.body.department, 120),
            category,
            description,
            satisfactionRating: rating,
            isAnonymous,
            contactInfo: isAnonymous ? null : sanitizeInput(req.body.contactInfo || '', 255),
            severity,
            tags,
            status: 'New',
            assignedOfficer: sanitizeInput(req.body.assignedOfficer || '', 120) || null,
            dueDate: normalizeDateOrNull(req.body.dueDate)
        });

        // Auto-link serious complaints to NC workflow.
        let autoNc = null;
        if (feedback.category === 'Complaint' && ['High', 'Critical'].includes(feedback.severity)) {
            autoNc = await NonConformance.create({
                labId: req.user.labId,
                description: `Auto-generated from feedback ${feedback.feedbackCode}: ${feedback.description}`,
                severity: feedback.severity === 'Critical' ? 'Critical' : 'High',
                status: 'Open'
            });
            feedback.linkedNcId = autoNc.id;
            await feedback.save();
        }

        await Notification.create({
            labId: req.user.labId,
            type: 'Alert',
            message: `Client feedback ${feedback.feedbackCode} submitted (${feedback.category}, ${feedback.severity}).`
        });

        res.status(201).json({ feedback, autoNc });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFeedback = async (req, res) => {
    try {
        const where = { labId: req.user.labId };
        if (req.query.status && FEEDBACK_ENUMS.STATUSES.includes(req.query.status)) where.status = req.query.status;
        if (req.query.category && FEEDBACK_ENUMS.CATEGORIES.includes(req.query.category)) where.category = req.query.category;
        if (req.query.department) where.department = sanitizeInput(req.query.department, 120);
        const list = await ClientFeedback.findAll({
            where,
            order: [['submittedAt', 'DESC']]
        });
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateFeedback = async (req, res) => {
    try {
        const feedback = await ClientFeedback.findOne({
            where: { id: req.params.id, labId: req.user.labId }
        });
        if (!feedback) return res.status(404).json({ message: 'Feedback not found.' });

        if (req.body.severity !== undefined) {
            if (!FEEDBACK_ENUMS.SEVERITY.includes(req.body.severity)) {
                return res.status(400).json({ message: 'Invalid severity value.' });
            }
            feedback.severity = req.body.severity;
        }
        if (req.body.tags !== undefined) {
            if (!Array.isArray(req.body.tags)) {
                return res.status(400).json({ message: 'tags must be an array.' });
            }
            const tags = normalizeTagList(req.body.tags);
            if (!tags.length) return res.status(400).json({ message: 'No valid tags were provided.' });
            feedback.tags = tags;
        }
        if (req.body.status !== undefined) {
            if (!FEEDBACK_ENUMS.STATUSES.includes(req.body.status)) {
                return res.status(400).json({ message: 'Invalid status value.' });
            }
            feedback.status = req.body.status;
        }
        if (req.body.assignedOfficer !== undefined) {
            feedback.assignedOfficer = sanitizeInput(req.body.assignedOfficer, 120) || null;
        }
        if (req.body.dueDate !== undefined) {
            const due = normalizeDateOrNull(req.body.dueDate);
            if (req.body.dueDate && !due) return res.status(400).json({ message: 'Invalid dueDate.' });
            feedback.dueDate = due;
        }
        if (req.body.resolutionNotes !== undefined) {
            feedback.resolutionNotes = sanitizeFreeText(req.body.resolutionNotes, 4000) || null;
        }
        if (req.body.linkedNcId !== undefined) {
            feedback.linkedNcId = sanitizeInput(req.body.linkedNcId, 64) || null;
        }

        if (req.body.status === 'Closed' && !feedback.dateClosed) {
            feedback.dateClosed = new Date();
        }
        await feedback.save();
        res.json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.linkToNc = async (req, res) => {
    try {
        const feedback = await ClientFeedback.findOne({
            where: { id: req.params.id, labId: req.user.labId }
        });
        if (!feedback) return res.status(404).json({ message: 'Feedback not found.' });

        const nc = await NonConformance.findOne({
            where: { id: sanitizeInput(req.body.ncId, 64), labId: req.user.labId }
        });
        if (!nc) return res.status(404).json({ message: 'NC not found.' });

        feedback.linkedNcId = nc.id;
        await feedback.save();
        res.json({ message: 'Feedback linked to NC.', feedback });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFeedbackAnalytics = async (req, res) => {
    try {
        const feedback = await ClientFeedback.findAll({
            where: { labId: req.user.labId },
            order: [['submittedAt', 'ASC']]
        });

        const total = feedback.length;
        const avgSatisfaction = total
            ? Number((feedback.reduce((sum, item) => sum + Number(item.satisfactionRating || 0), 0) / total).toFixed(2))
            : 0;

        const byDept = {};
        const byMonth = {};
        let closedWithinTarget = 0;
        let closedCount = 0;
        const complaintGroups = {};

        feedback.forEach((item) => {
            byDept[item.department] = (byDept[item.department] || 0) + 1;
            const month = new Date(item.submittedAt).toISOString().slice(0, 7);
            byMonth[month] = (byMonth[month] || 0) + 1;

            if (item.status === 'Closed') {
                closedCount += 1;
                if (item.dueDate && item.dateClosed && new Date(item.dateClosed).getTime() <= new Date(item.dueDate).getTime()) {
                    closedWithinTarget += 1;
                }
            }

            const primaryTag = Array.isArray(item.tags) && item.tags.length ? item.tags[0] : 'Other';
            complaintGroups[primaryTag] = (complaintGroups[primaryTag] || 0) + 1;
        });

        const mostComplainedDepartment = Object.entries(byDept).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        const repeatComplaintTags = Object.entries(complaintGroups)
            .filter(([, count]) => count > 1)
            .map(([tag, count]) => ({ tag, count }));

        res.json({
            totalFeedback: total,
            avgSatisfaction,
            mostComplainedDepartment,
            trendByMonth: byMonth,
            closedCount,
            closedWithinTarget,
            resolvedWithinTargetPercent: closedCount
                ? Number(((closedWithinTarget / closedCount) * 100).toFixed(2))
                : 0,
            repeatComplaintTags
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFeedbackReport = async (req, res) => {
    try {
        const feedback = await ClientFeedback.findAll({
            where: { labId: req.user.labId },
            order: [['submittedAt', 'DESC']]
        });

        const byDepartment = feedback.reduce((acc, item) => {
            acc[item.department] = (acc[item.department] || 0) + 1;
            return acc;
        }, {});

        const byStatus = feedback.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {});

        res.json({
            reportTitle: 'Monthly Client Feedback Report',
            generatedAt: new Date().toISOString(),
            totalFeedback: feedback.length,
            byDepartment,
            byStatus,
            topIssues: feedback
                .flatMap((item) => (Array.isArray(item.tags) ? item.tags : ['Other']))
                .reduce((acc, tag) => {
                    acc[tag] = (acc[tag] || 0) + 1;
                    return acc;
                }, {})
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.__testables = {
    inferSeverity,
    inferTags,
    normalizeTagList
};
