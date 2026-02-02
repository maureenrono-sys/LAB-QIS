const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Audit = sequelize.define('Audit', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    auditType: {
        type: DataTypes.ENUM('Internal', 'External', 'SLIPTA Baseline', 'SLIPTA Surveillance'),
        allowNull: false
    },
    totalScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    starLevel: {
        type: DataTypes.INTEGER, // 0 to 5 Stars based on SLIPTA scoring
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('Planned', 'In Progress', 'Completed'),
        defaultValue: 'Planned'
    }
});

module.exports = Audit;