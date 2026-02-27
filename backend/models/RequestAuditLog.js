const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RequestAuditLog = sequelize.define('RequestAuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    requestId: {
        type: DataTypes.STRING(64),
        allowNull: false
    },
    labId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    method: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    route: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    statusCode: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    durationMs: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ipAddress: {
        type: DataTypes.STRING(64),
        allowNull: true
    },
    userAgent: {
        type: DataTypes.STRING(512),
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    updatedAt: false
});

module.exports = RequestAuditLog;
