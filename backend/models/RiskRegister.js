const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RiskRegister = sequelize.define('RiskRegister', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hazard: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    sourceType: {
        type: DataTypes.ENUM('QC', 'NC', 'AUDIT', 'MANUAL'),
        defaultValue: 'MANUAL'
    },
    sourceRefId: {
        type: DataTypes.UUID
    },
    likelihood: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    impact: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    inherentScore: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    controlEffectiveness: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    residualScore: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    status: {
        type: DataTypes.ENUM('Open', 'Mitigating', 'Controlled', 'Closed'),
        defaultValue: 'Open'
    },
    ownerName: {
        type: DataTypes.STRING
    },
    lastReviewedAt: {
        type: DataTypes.DATE
    }
});

module.exports = RiskRegister;
