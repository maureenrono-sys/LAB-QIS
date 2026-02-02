const { User, Laboratory } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to create JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new Lab and its Admin User
// @route   POST /api/auth/register
exports.registerLab = async (req, res) => {
    try {
        const { labName, labType, fullName, email, password } = req.body;

        // 1. Create the Laboratory
        const lab = await Laboratory.create({ labName, labType });

        // 2. Create the User linked to that Lab
        const user = await User.create({
            fullName,
            email,
            password,
            role: 'Laboratory Manager', // First user is usually the manager
            labId: lab.id
        });

        res.status(201).json({
            token: generateToken(user.id),
            user: { id: user.id, fullName: user.fullName, labName: lab.labName }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email }, include: Laboratory });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                token: generateToken(user.id),
                user: {
                    id: user.id,
                    role: user.role,
                    labName: user.Laboratory.labName
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};