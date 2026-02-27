const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserPreference = sequelize.define('UserPreference', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    profilePhotoPath: {
        type: DataTypes.STRING
    },
    notifyQcAlerts: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    notifyNcAlerts: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    notifyMaintenanceAlerts: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    notifyBenchmarkUpdates: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    notifyEmailDigest: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = UserPreference;
