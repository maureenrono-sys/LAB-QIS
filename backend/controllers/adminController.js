const { Laboratory, User, DashboardSnapshot, Audit } = require('../models');
const { sanitizeInput, sanitizeFreeText } = require('../validators/common');
const { ROLE_KEYS, ROLE_LABELS_BY_KEY, getRoleKey } = require('../constants/roles');

function getSystemAdminEmail() {
    return String(process.env.SYSTEM_ADMIN_EMAIL || 'maureenrono98@gmail.com').toLowerCase();
}

function isAdministrator(req) {
    return getRoleKey(req.user?.role) === ROLE_KEYS.ADMIN;
}

function canManageLabUsers(req, labId) {
    if (isAdministrator(req)) return true;
    const roleKey = getRoleKey(req.user?.role);
    if (![ROLE_KEYS.LAB_MANAGER, ROLE_KEYS.QUALITY_ASSURANCE_MANAGER].includes(roleKey)) {
        return false;
    }
    return req.user?.labId === labId;
}

function resolveRoleLabel(value) {
    if (!value) return null;
    if (ROLE_LABELS_BY_KEY[value]) return ROLE_LABELS_BY_KEY[value];
    const trimmed = sanitizeInput(value, 64);
    if (!trimmed) return null;
    if (Object.values(ROLE_LABELS_BY_KEY).includes(trimmed)) return trimmed;
    return null;
}

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
        if (!isAdministrator(req)) {
            return res.status(403).json({ message: 'Only Administrator can view all labs.' });
        }

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
        const labId = req.params.labId;
        if (!canManageLabUsers(req, labId)) {
            return res.status(403).json({ message: 'You are not allowed to view users for this lab.' });
        }

        const users = await User.findAll({
            where: { labId },
            attributes: ['id', 'fullName', 'email', 'role', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createLab = async (req, res) => {
    try {
        if (!isAdministrator(req)) {
            return res.status(403).json({ message: 'Only Administrator can create labs.' });
        }

        const labName = sanitizeInput(req.body.labName, 140);
        if (!labName) return res.status(400).json({ message: 'labName is required.' });

        const labType = sanitizeInput(req.body.labType || 'Private', 24);
        if (!['Public', 'Private', 'Mid-level'].includes(labType)) {
            return res.status(400).json({ message: 'Invalid labType. Use Public, Private, or Mid-level.' });
        }

        const existing = await Laboratory.findOne({ where: { labName } });
        if (existing) return res.status(409).json({ message: 'A lab with this name already exists.' });

        const lab = await Laboratory.create({
            labName,
            labType,
            registrationNumber: sanitizeInput(req.body.registrationNumber, 60),
            address: sanitizeFreeText(req.body.address, 800),
            accreditationStatus: sanitizeInput(req.body.accreditationStatus, 120)
        });

        res.status(201).json({ message: 'Lab created.', lab });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createLabUser = async (req, res) => {
    try {
        const labId = req.params.labId;
        if (!canManageLabUsers(req, labId)) {
            return res.status(403).json({ message: 'You are not allowed to add users for this lab.' });
        }

        const lab = await Laboratory.findByPk(labId);
        if (!lab) return res.status(404).json({ message: 'Lab not found.' });

        const fullName = sanitizeInput(req.body.fullName, 120);
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const role = resolveRoleLabel(req.body.roleKey || req.body.role);

        if (!fullName || !email || !password || !role) {
            return res.status(400).json({ message: 'fullName, email, password, and role are required.' });
        }

        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(409).json({ message: 'User with this email already exists.' });

        const allowedNonAdminRoles = [
            ROLE_LABELS_BY_KEY[ROLE_KEYS.LAB_MANAGER],
            ROLE_LABELS_BY_KEY[ROLE_KEYS.QUALITY_ASSURANCE_MANAGER],
            ROLE_LABELS_BY_KEY[ROLE_KEYS.LAB_SCIENTIST]
        ];

        if (role === ROLE_LABELS_BY_KEY[ROLE_KEYS.ADMIN]) {
            const systemAdminEmail = getSystemAdminEmail();
            if (!isAdministrator(req) || email !== systemAdminEmail) {
                return res.status(403).json({ message: 'Administrator role is reserved for the system admin account only.' });
            }
        } else if (!allowedNonAdminRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role for lab user.' });
        }

        const user = await User.create({
            fullName,
            email,
            password,
            role,
            labId: lab.id
        });

        res.status(201).json({
            message: 'User created.',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                roleKey: getRoleKey(user.role),
                labId: user.labId
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateLab = async (req, res) => {
    try {
        if (!isAdministrator(req)) {
            return res.status(403).json({ message: 'Only Administrator can update labs.' });
        }

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
        if (!canManageLabUsers(req, user.labId)) {
            return res.status(403).json({ message: 'You are not allowed to edit this user.' });
        }

        if (req.body.fullName !== undefined) {
            const nextName = sanitizeInput(req.body.fullName, 120);
            if (!nextName) return res.status(400).json({ message: 'fullName cannot be empty.' });
            user.fullName = nextName;
        }

        if (req.body.role !== undefined) {
            const nextRole = resolveRoleLabel(req.body.role);
            if (!nextRole) return res.status(400).json({ message: 'Invalid role value.' });

            const systemAdminEmail = getSystemAdminEmail();
            if (String(user.email || '').toLowerCase() === systemAdminEmail && nextRole !== ROLE_LABELS_BY_KEY[ROLE_KEYS.ADMIN]) {
                return res.status(403).json({ message: 'The configured admin account must remain Administrator.' });
            }
            if (nextRole === ROLE_LABELS_BY_KEY[ROLE_KEYS.ADMIN] && String(user.email || '').toLowerCase() !== systemAdminEmail) {
                return res.status(403).json({ message: 'Administrator role is reserved for the configured admin account.' });
            }
            if (!isAdministrator(req) && nextRole === ROLE_LABELS_BY_KEY[ROLE_KEYS.ADMIN]) {
                return res.status(403).json({ message: 'Only Administrator can assign the Administrator role.' });
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
                roleKey: getRoleKey(user.role),
                labId: user.labId
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLabDashboardSnapshot = async (req, res) => {
    try {
        const labId = req.params.labId;
        if (!isAdministrator(req) && !canManageLabUsers(req, labId)) {
            return res.status(403).json({ message: 'You are not allowed to access this lab dashboard.' });
        }

        const lab = await Laboratory.findByPk(labId);
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
