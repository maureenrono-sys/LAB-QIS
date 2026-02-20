const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SliptaAssessment = sequelize.define('SliptaAssessment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    assessmentDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    totalScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    percentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    starLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

module.exports = SliptaAssessment;
