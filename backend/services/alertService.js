const { Notification } = require('../models');

async function createAlert({ labId, message, type = 'Alert' }) {
    if (!labId || !message) return null;
    return Notification.create({ labId, message, type });
}

module.exports = {
    createAlert
};
