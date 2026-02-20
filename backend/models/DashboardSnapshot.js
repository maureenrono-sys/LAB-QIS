const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DashboardSnapshot = sequelize.define('DashboardSnapshot', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    period: {
        type: DataTypes.STRING,
        allowNull: false
    },
    labQualityIndex: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    qcPassRate: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    openNcCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    overdueNcCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    calibrationAlerts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    sliptaStarLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    competencyCompliance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    }
});

module.exports = DashboardSnapshot;
