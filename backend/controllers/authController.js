const { User, Laboratory, LoginLog, UserPreference } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getRoleKey, ROLE_KEYS } = require('../constants/roles');
const { logLoginEvent, logErrorEvent } = require('../services/loggingService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

function isAdministrator(user) {
    return getRoleKey(user?.role) === ROLE_KEYS.ADMIN;
}

function isSuspendedLab(lab) {
    return String(lab?.subscriptionStatus || '').toLowerCase() === 'suspended';
}

function normalizePhotoPath(rawPath) {
    if (!rawPath) return null;
    return String(rawPath).replace(/\\/g, '/');
}

function buildPhotoUrl(rawPath) {
    const normalized = normalizePhotoPath(rawPath);
    if (!normalized) return null;
    const publicBaseUrl = String(process.env.PUBLIC_APP_URL || '').replace(/\/+$/, '');
    return publicBaseUrl ? `${publicBaseUrl}/${normalized}` : `/${normalized}`;
}

async function getOrCreateUserPreference(userId) {
    let preference = await UserPreference.findOne({ where: { userId } });
    if (!preference) {
        preference = await UserPreference.create({ userId });
    }
    return preference;
}

async function getRecentLogins(userId) {
    return LoginLog.findAll({
        where: { userId, status: 'SUCCESS' },
        order: [['loggedAt', 'DESC']],
        limit: 2
    });
}

function makeUserPayload(user, preference, recentLogins) {
    const roleKey = getRoleKey(user.role);
    const latestLogin = recentLogins?.[0] || null;
    const previousLogin = recentLogins?.[1] || null;

    return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        roleKey,
        labName: user.Laboratory?.labName || '',
        labSubscriptionStatus: user.Laboratory?.subscriptionStatus || 'trial',
        lab: user.Laboratory || null,
        profilePhotoPath: normalizePhotoPath(preference?.profilePhotoPath),
        profilePhotoUrl: buildPhotoUrl(preference?.profilePhotoPath),
        notificationPreferences: {
            notifyQcAlerts: preference?.notifyQcAlerts ?? true,
            notifyNcAlerts: preference?.notifyNcAlerts ?? true,
            notifyMaintenanceAlerts: preference?.notifyMaintenanceAlerts ?? true,
            notifyBenchmarkUpdates: preference?.notifyBenchmarkUpdates ?? true,
            notifyEmailDigest: preference?.notifyEmailDigest ?? false
        },
        lastLoginAt: latestLogin?.loggedAt || null,
        previousLoginAt: previousLogin?.loggedAt || null
    };
}

exports.registerLab = async (req, res) => {
    res.status(403).json({
        message: 'Self sign-up is disabled. Contact the Administrator to create your account.'
    });
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email }, include: Laboratory });

        if (user && (await bcrypt.compare(password, user.password))) {
            if (isSuspendedLab(user.Laboratory)) {
                await logLoginEvent({
                    labId: user.labId,
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.fullName,
                    roleName: user.role,
                    status: 'FAILED',
                    failureReason: 'Lab subscription suspended',
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                });
                return res.status(403).json({
                    message: 'This laboratory account is suspended. Contact the administrator to reactivate access.'
                });
            }

            await logLoginEvent({
                labId: user.labId,
                userId: user.id,
                userEmail: user.email,
                userName: user.fullName,
                roleName: user.role,
                status: 'SUCCESS',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            const [preference, recentLogins] = await Promise.all([
                getOrCreateUserPreference(user.id),
                getRecentLogins(user.id)
            ]);

            res.json({
                token: generateToken(user.id),
                user: makeUserPayload(user, preference, recentLogins)
            });
        } else {
            await logLoginEvent({
                labId: user?.labId || null,
                userId: user?.id || null,
                userEmail: email,
                userName: user?.fullName || null,
                roleName: user?.role || null,
                status: 'FAILED',
                failureReason: 'Invalid email or password',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        await logErrorEvent({
            labId: req.user?.labId || null,
            userId: req.user?.id || null,
            scope: 'AUTH_LOGIN',
            route: req.originalUrl,
            method: req.method,
            statusCode: 500,
            message: error.message,
            stack: error.stack,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        res.status(500).json({ message: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { include: Laboratory });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const [preference, recentLogins] = await Promise.all([
            getOrCreateUserPreference(user.id),
            getRecentLogins(user.id)
        ]);
        res.json({
            user: makeUserPayload(user, preference, recentLogins)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const { fullName, currentPassword, newPassword, notificationPreferences } = req.body;
        const user = await User.findByPk(req.user.id, { include: Laboratory });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const preference = await getOrCreateUserPreference(user.id);

        if (fullName && String(fullName).trim()) {
            user.fullName = String(fullName).trim();
        }

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'currentPassword is required to set a new password.' });
            }

            const matches = await bcrypt.compare(currentPassword, user.password);
            if (!matches) {
                return res.status(401).json({ message: 'Current password is incorrect.' });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        if (notificationPreferences && typeof notificationPreferences === 'object') {
            if (notificationPreferences.notifyQcAlerts !== undefined) {
                preference.notifyQcAlerts = Boolean(notificationPreferences.notifyQcAlerts);
            }
            if (notificationPreferences.notifyNcAlerts !== undefined) {
                preference.notifyNcAlerts = Boolean(notificationPreferences.notifyNcAlerts);
            }
            if (notificationPreferences.notifyMaintenanceAlerts !== undefined) {
                preference.notifyMaintenanceAlerts = Boolean(notificationPreferences.notifyMaintenanceAlerts);
            }
            if (notificationPreferences.notifyBenchmarkUpdates !== undefined) {
                preference.notifyBenchmarkUpdates = Boolean(notificationPreferences.notifyBenchmarkUpdates);
            }
            if (notificationPreferences.notifyEmailDigest !== undefined) {
                preference.notifyEmailDigest = Boolean(notificationPreferences.notifyEmailDigest);
            }
        }

        await user.save();
        await preference.save();
        const recentLogins = await getRecentLogins(user.id);
        res.json({
            message: 'Profile updated successfully.',
            user: makeUserPayload(user, preference, recentLogins)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateLabSettings = async (req, res) => {
    try {
        if (!isAdministrator(req.user)) {
            return res.status(403).json({ message: 'Only the Administrator can update lab settings.' });
        }

        const allowed = ['labName', 'labType', 'address', 'registrationNumber', 'accreditationStatus', 'subscriptionStatus'];
        const updates = {};
        allowed.forEach((key) => {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        });

        const lab = await Laboratory.findByPk(req.user.labId);
        if (!lab) return res.status(404).json({ message: 'Laboratory not found.' });

        await lab.update(updates);
        res.json({ message: 'Lab settings updated.', lab });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Profile photo file is required.' });
        }

        const user = await User.findByPk(req.user.id, { include: Laboratory });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const preference = await getOrCreateUserPreference(user.id);
        preference.profilePhotoPath = normalizePhotoPath(req.file.path);
        await preference.save();

        const recentLogins = await getRecentLogins(user.id);
        res.json({
            message: 'Profile photo updated.',
            user: makeUserPayload(user, preference, recentLogins)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.promoteSelfAdmin = async (req, res) => {
    res.status(410).json({
        message: 'Self-promotion is disabled. The Administrator role is reserved for the configured admin account.'
    });
};
