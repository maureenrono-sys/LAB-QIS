const { Laboratory, User, DashboardSnapshot, Audit } = require('../models');
const { sanitizeInput, sanitizeFreeText } = require('../validators/common');

async function getLatestSnapshotForLab(labId) {
    return DashboardSnapshot.findOne({
        where: { labId },
        order: [['createdAt', 'DESC']]
    });
}

async function getLatestAuditForLab(labId) {
    return Audit.findOne({
        where: { labId },
        order: [['createdAt', 'DESC']]
    });
}

exports.getLabsOverview = async (req, res) => {
    try {
        const labs = await Laboratory.findAll({ order: [['labName', 'ASC']] });
        const enriched = await Promise.all(labs.map(async (lab) => {
            const [users, latestSnapshot, latestAudit] = await Promise.all([
                User.count({ where: { labId: lab.id } }),
                getLatestSnapshotForLab(lab.id),
                getLatestAuditForLab(lab.id)
            ]);

            return {
                ...lab.toJSON(),
                userCount: users,
                latestPerformance: latestSnapshot
                    ? {
                        period: latestSnapshot.period,
                        labQualityIndex: Number(latestSnapshot.labQualityIndex || 0),
                        qcPassRate: Number(latestSnapshot.qcPassRate || 0),
                        openNcCount: Number(latestSnapshot.openNcCount || 0),
                        overdueNcCount: Number(latestSnapshot.overdueNcCount || 0),
                        competencyCompliance: Number(latestSnapshot.competencyCompliance || 0),
                        sliptaStarLevel: Number(latestSnapshot.sliptaStarLevel || 0)
                    }
                    : null,
                latestAudit: latestAudit
                    ? {
                        auditType: latestAudit.auditType,
                        totalScore: latestAudit.totalScore,
                        starLevel: latestAudit.starLevel,
                        status: latestAudit.status,
                        createdAt: latestAudit.createdAt
                    }
                    : null
            };
        }));

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLabUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { labId: req.params.labId },
            attributes: ['id', 'fullName', 'email', 'role', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateLab = async (req, res) => {
    try {
        const lab = await Laboratory.findByPk(req.params.labId);
        if (!lab) return res.status(404).json({ message: 'Lab not found.' });

        const updates = {};
        if (req.body.labName !== undefined) updates.labName = sanitizeInput(req.body.labName, 140);
        if (req.body.labType !== undefined) {
            const labType = sanitizeInput(req.body.labType, 24);
            const allowedLabTypes = ['Public', 'Private', 'Mid-level'];
            if (!allowedLabTypes.includes(labType)) {
                return res.status(400).json({ message: 'Invalid labType. Use Public, Private, or Mid-level.' });
            }
            updates.labType = labType;
        }
        if (req.body.registrationNumber !== undefined) updates.registrationNumber = sanitizeInput(req.body.registrationNumber, 60);
        if (req.body.address !== undefined) updates.address = sanitizeFreeText(req.body.address, 800);
        if (req.body.accreditationStatus !== undefined) updates.accreditationStatus = sanitizeInput(req.body.accreditationStatus, 120);

        await lab.update(updates);
        res.json({ message: 'Lab updated.', lab });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const allowedRoles = [
            'System Administrator',
            'Laboratory Manager',
            'Quality Officer',
            'Laboratory Technologist',
            'Auditor'
        ];

        if (req.body.fullName !== undefined) {
            const nextName = sanitizeInput(req.body.fullName, 120);
            if (!nextName) return res.status(400).json({ message: 'fullName cannot be empty.' });
            user.fullName = nextName;
        }

        if (req.body.role !== undefined) {
            const nextRole = sanitizeInput(req.body.role, 64);
            if (!allowedRoles.includes(nextRole)) {
                return res.status(400).json({ message: 'Invalid role value.' });
            }

            const systemAdminEmail = (process.env.SYSTEM_ADMIN_EMAIL || 'maureenrono98@gmail.com').toLowerCase();
            if (nextRole === 'System Administrator' && String(user.email || '').toLowerCase() !== systemAdminEmail) {
                return res.status(403).json({ message: 'System Administrator role is reserved for the systems developer account.' });
            }
            if (String(user.email || '').toLowerCase() === systemAdminEmail && nextRole !== 'System Administrator') {
                return res.status(403).json({ message: 'Systems developer account must remain System Administrator.' });
            }

            user.role = nextRole;
        }

        await user.save();
        res.json({
            message: 'User updated.',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                labId: user.labId
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLabDashboardSnapshot = async (req, res) => {
    try {
        const lab = await Laboratory.findByPk(req.params.labId);
        if (!lab) return res.status(404).json({ message: 'Lab not found.' });

        const [snapshot, audit] = await Promise.all([
            getLatestSnapshotForLab(lab.id),
            getLatestAuditForLab(lab.id)
        ]);

        res.json({
            lab: {
                id: lab.id,
                labName: lab.labName,
                labType: lab.labType
            },
            dashboard: snapshot,
            latestAudit: audit
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
