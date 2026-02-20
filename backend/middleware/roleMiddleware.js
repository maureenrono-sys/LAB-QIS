const { ROLE_LABELS_BY_KEY } = require('../constants/roles');

exports.authorize = (...roleLabels) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'Not authorized: missing user context.' });
        }

        if (!roleLabels.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access Denied: Your role (${req.user.role}) does not have permission for this action.`
            });
        }

        next();
    };
};

exports.authorizeRoleKeys = (...roleKeys) => {
    const labels = roleKeys
        .map((key) => ROLE_LABELS_BY_KEY[key])
        .filter(Boolean);

    return exports.authorize(...labels);
};
