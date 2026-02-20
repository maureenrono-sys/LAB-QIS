const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SopVersion = sequelize.define('SopVersion', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    versionNo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: false
    },
    effectiveDate: {
        type: DataTypes.DATE
    },
    expiryDate: {
        type: DataTypes.DATE
    },
    changeSummary: {
        type: DataTypes.TEXT
    },
    approvedAt: {
        type: DataTypes.DATE
    }
});

module.exports = SopVersion;
