const { User, Laboratory } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getRoleKey, ROLE_KEYS, ROLE_LABELS_BY_KEY } = require('../constants/roles');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.registerLab = async (req, res) => {
    try {
        const { labName, labType, fullName, email, password, roleKey: requestedRoleKey } = req.body;

        if (!labName || !fullName || !email || !password) {
            return res.status(400).json({ message: 'labName, fullName, email, and password are required.' });
        }

        const allowedRoleKeys = [
            ROLE_KEYS.ADMIN,
            ROLE_KEYS.LAB_MANAGER,
            ROLE_KEYS.QUALITY_ASSURANCE_MANAGER,
            ROLE_KEYS.LAB_TECHNOLOGIST
        ];
        const resolvedRoleKey = allowedRoleKeys.includes(requestedRoleKey) ? requestedRoleKey : ROLE_KEYS.LAB_MANAGER;
        const roleLabel = ROLE_LABELS_BY_KEY[resolvedRoleKey];

        if (!roleLabel) {
            return res.status(400).json({ message: 'Invalid role selected for registration.' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const [lab] = await Laboratory.findOrCreate({
            where: { labName },
            defaults: { labName, labType: labType || 'Private' }
        });

        const user = await User.create({
            fullName,
            email,
            password,
            role: roleLabel,
            labId: lab.id
        });

        const roleKey = getRoleKey(user.role);

        res.status(201).json({
            token: generateToken(user.id),
            user: {
                id: user.id,
                fullName: user.fullName,
                role: user.role,
                roleKey,
                labName: lab.labName
            }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email }, include: Laboratory });

        if (user && (await bcrypt.compare(password, user.password))) {
            const roleKey = getRoleKey(user.role);

            res.json({
                token: generateToken(user.id),
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    role: user.role,
                    roleKey,
                    labName: user.Laboratory?.labName || ''
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
