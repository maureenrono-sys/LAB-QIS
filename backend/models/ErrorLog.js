const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ErrorLog = sequelize.define('ErrorLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    scope: {
        type: DataTypes.STRING,
        allowNull: false
    },
    route: {
        type: DataTypes.STRING
    },
    method: {
        type: DataTypes.STRING
    },
    statusCode: {
        type: DataTypes.INTEGER
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    stack: {
        type: DataTypes.TEXT
    },
    ipAddress: {
        type: DataTypes.STRING
    },
    userAgent: {
        type: DataTypes.TEXT
    },
    errorAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = ErrorLog;
