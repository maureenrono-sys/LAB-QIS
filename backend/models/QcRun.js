const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QcRun = sequelize.define('QcRun', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    analyte: {
        type: DataTypes.STRING,
        allowNull: false
    },
    controlLevel: {
        type: DataTypes.STRING,
        allowNull: false
    },
    runTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    value: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false
    },
    mean: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false
    },
    sd: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false
    },
    zScore: {
        type: DataTypes.DECIMAL(10, 4)
    },
    status: {
        type: DataTypes.ENUM('PASS', 'WARNING', 'REJECT'),
        defaultValue: 'PASS'
    }
});

module.exports = QcRun;
