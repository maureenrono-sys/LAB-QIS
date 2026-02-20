const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QcRuleViolation = sequelize.define('QcRuleViolation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    ruleCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    severity: {
        type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
        allowNull: false
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = QcRuleViolation;
