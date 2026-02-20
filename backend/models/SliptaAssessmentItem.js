const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SliptaAssessmentItem = sequelize.define('SliptaAssessmentItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    evidence: {
        type: DataTypes.TEXT
    },
    gapFlag: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = SliptaAssessmentItem;
