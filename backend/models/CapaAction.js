const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CapaAction = sequelize.define('CapaAction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    actionType: {
        type: DataTypes.ENUM('Corrective', 'Preventive'),
        allowNull: false
    },
    ownerName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Open', 'In Progress', 'Implemented', 'Verified', 'Closed'),
        defaultValue: 'Open'
    },
    effectivenessScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    effectivenessCheckDueAt: {
        type: DataTypes.DATE
    },
    effectivenessCheckedAt: {
        type: DataTypes.DATE
    },
    effectivenessResult: {
        type: DataTypes.ENUM('Pending', 'Effective', 'Ineffective'),
        defaultValue: 'Pending'
    },
    effectivenessNotes: {
        type: DataTypes.TEXT
    },
    details: {
        type: DataTypes.TEXT
    }
});

module.exports = CapaAction;
