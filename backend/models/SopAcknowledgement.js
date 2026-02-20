const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SopAcknowledgement = sequelize.define('SopAcknowledgement', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    staffName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    acknowledgedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = SopAcknowledgement;
