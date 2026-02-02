const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditFinding = sequelize.define('AuditFinding', {
    clause: {
        type: DataTypes.STRING, // e.g., "1.1 Management Responsibility"
        allowNull: false
    },
    scoreObtained: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    maxScore: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    findingNote: {
        type: DataTypes.TEXT // Objective evidence or non-conformance notes
    }
});

module.exports = AuditFinding;