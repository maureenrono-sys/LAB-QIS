const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Training = sequelize.define('Training', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    trainingDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    trainerName: {
        type: DataTypes.STRING
    },
    mandatory: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = Training;
