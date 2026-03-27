const { Laboratory, User } = require('../models');

function getBootstrapConfig() {
    const email = String(process.env.SYSTEM_ADMIN_EMAIL || '').trim().toLowerCase();
    const password = String(process.env.SYSTEM_ADMIN_PASSWORD || '');
    const fullName = String(process.env.SYSTEM_ADMIN_NAME || 'System Administrator').trim();
    const labName = String(process.env.SYSTEM_ADMIN_LAB_NAME || 'Lab QIS HQ').trim();

    return {
        email,
        password,
        fullName,
        labName
    };
}

async function ensureSystemAdmin() {
    const { email, password, fullName, labName } = getBootstrapConfig();
    if (!email || !password) return;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        if (existingUser.role !== 'Administrator') {
            existingUser.role = 'Administrator';
            await existingUser.save();
        }
        return;
    }

    const [lab] = await Laboratory.findOrCreate({
        where: { labName },
        defaults: {
            labName,
            labType: 'Private',
            registrationNumber: `SYS-${Date.now()}`,
            address: 'Configured during deployment bootstrap',
            accreditationStatus: 'Pending Setup'
        }
    });

    await User.create({
        fullName,
        email,
        password,
        role: 'Administrator',
        labId: lab.id
    });
}

module.exports = { ensureSystemAdmin };
