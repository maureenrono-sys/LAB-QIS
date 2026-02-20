const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SopApproval = sequelize.define('SopApproval', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    approverName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    stepOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        defaultValue: 'Pending'
    },
    comment: {
        type: DataTypes.TEXT
    },
    actionAt: {
        type: DataTypes.DATE
    }
});

module.exports = SopApproval;
