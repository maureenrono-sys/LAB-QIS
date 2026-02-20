const { Op } = require('sequelize');
const { Sop, SopVersion, SopApproval, SopAcknowledgement, Notification } = require('../models');
const { validateSop, validateSopVersion } = require('../validators/sopValidator');

exports.createSop = async (req, res) => {
    try {
        const validationError = validateSop(req.body);
        if (validationError) return res.status(400).json({ message: validationError });

        const sop = await Sop.create({
            code: req.body.code,
            title: req.body.title,
            isoClause: req.body.isoClause,
            departmentId: req.body.departmentId || null,
            labId: req.user.labId
        });

        res.status(201).json(sop);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.uploadVersion = async (req, res) => {
    try {
        const validationError = validateSopVersion(req.body);
        if (validationError) return res.status(400).json({ message: validationError });

        const version = await SopVersion.create({
            sopId: req.params.id,
            versionNo: req.body.versionNo,
            filePath: req.body.filePath,
            effectiveDate: req.body.effectiveDate,
            expiryDate: req.body.expiryDate,
            changeSummary: req.body.changeSummary
        });

        await Sop.update({ status: 'Draft' }, { where: { id: req.params.id, labId: req.user.labId } });
        res.status(201).json(version);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.submitForApproval = async (req, res) => {
    try {
        const sop = await Sop.findOne({ where: { id: req.params.id, labId: req.user.labId } });
        if (!sop) return res.status(404).json({ message: 'SOP not found' });

        await sop.update({ status: 'Under Review' });
        await SopApproval.create({
            sopVersionId: req.body.sopVersionId,
            approverName: req.body.approverName || 'Lab Manager',
            stepOrder: req.body.stepOrder || 1
        });

        await Notification.create({
            labId: req.user.labId,
            type: 'Reminder',
            message: `SOP ${sop.code} submitted for approval`
        });

        res.json({ message: 'Submitted for approval' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.approveOrReject = async (req, res) => {
    try {
        const approval = await SopApproval.findByPk(req.params.approvalId);
        if (!approval) return res.status(404).json({ message: 'Approval step not found' });

        approval.status = req.body.action === 'approve' ? 'Approved' : 'Rejected';
        approval.comment = req.body.comment || null;
        approval.actionAt = new Date();
        await approval.save();

        if (approval.status === 'Approved') {
            const version = await SopVersion.findByPk(approval.sopVersionId);
            if (version) {
                version.approvedAt = new Date();
                await version.save();
                await Sop.update({ status: 'Approved' }, { where: { id: version.sopId } });
            }
        }

        res.json(approval);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getExpiringSops = async (req, res) => {
    try {
        const in30Days = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));
        const versions = await SopVersion.findAll({
            where: {
                expiryDate: { [Op.lte]: in30Days, [Op.gte]: new Date() }
            }
        });
        res.json(versions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSopCompliance = async (req, res) => {
    try {
        const [requiredCount, ackCount] = await Promise.all([
            SopVersion.count(),
            SopAcknowledgement.count()
        ]);
        const compliance = requiredCount > 0 ? (ackCount / requiredCount) * 100 : 0;
        res.json({ requiredCount, ackCount, sopCompliance: Number(compliance.toFixed(2)) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
