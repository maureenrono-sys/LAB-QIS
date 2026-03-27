const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Laboratory = sequelize.define('Laboratory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    labName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    labType: {
        type: DataTypes.ENUM('Public', 'Private', 'Mid-level'),
        allowNull: false
    },
    registrationNumber: {
        type: DataTypes.STRING,
        unique: true
    },
    address: {
        type: DataTypes.TEXT
    },
    accreditationStatus: {
        type: DataTypes.STRING,
        defaultValue: 'Non-accredited'
    },
    subscriptionStatus: {
        type: DataTypes.ENUM('trial', 'active', 'suspended'),
        allowNull: false,
        defaultValue: 'trial'
    }
});

module.exports = Laboratory;
