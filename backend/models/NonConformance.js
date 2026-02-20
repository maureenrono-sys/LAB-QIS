const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NonConformance = sequelize.define('NonConformance', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    severity: {
        type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
        defaultValue: 'Medium'
    },
    rootCause: {
        type: DataTypes.TEXT
    },
    correctiveAction: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.ENUM('Open', 'In Progress', 'Verified', 'Closed'),
        defaultValue: 'Open'
    },
    assignedTo: {
        type: DataTypes.STRING // Name or ID of staff responsible
    },
    deadline: {
        type: DataTypes.DATE
    },
    overdueJustification: {
        type: DataTypes.TEXT
    },
    effectivenessEvidence: {
        type: DataTypes.TEXT
    }
});

module.exports = NonConformance;
