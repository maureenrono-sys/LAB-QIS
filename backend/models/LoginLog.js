const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoginLog = sequelize.define('LoginLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userEmail: {
        type: DataTypes.STRING
    },
    userName: {
        type: DataTypes.STRING
    },
    roleName: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.ENUM('SUCCESS', 'FAILED'),
        allowNull: false
    },
    failureReason: {
        type: DataTypes.STRING
    },
    ipAddress: {
        type: DataTypes.STRING
    },
    userAgent: {
        type: DataTypes.TEXT
    },
    loggedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = LoginLog;
