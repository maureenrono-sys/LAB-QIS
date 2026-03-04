const jwt = require('jsonwebtoken');
const { User, Laboratory } = require('../models');
const { getRoleKey, ROLE_KEYS } = require('../constants/roles');

const protect = async (req, res, next) => {
    let token;

    // Check if header exists and starts with Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from string "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Add user to request (excluding password)
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            });
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            const requestedLabId = String(req.headers['x-lab-context'] || '').trim();
            if (requestedLabId && getRoleKey(req.user.role) === ROLE_KEYS.ADMIN) {
                const targetLab = await Laboratory.findByPk(requestedLabId, {
                    attributes: ['id', 'labName']
                });
                if (!targetLab) {
                    return res.status(400).json({ message: 'Invalid lab context provided.' });
                }
                req.user.originalLabId = req.user.labId;
                req.user.labId = targetLab.id;
                req.user.labContextName = targetLab.labName;
            }

            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
