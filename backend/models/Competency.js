const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Competency = sequelize.define('Competency', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    testCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Competent', 'Needs Retraining', 'Expired'),
        defaultValue: 'Competent'
    },
    assessedAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    assessorName: {
        type: DataTypes.STRING
    }
});

module.exports = Competency;
