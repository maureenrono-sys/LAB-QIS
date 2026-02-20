const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SliptaChecklist = sequelize.define('SliptaChecklist', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    sectionCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    clause: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    maxScore: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    }
});

module.exports = SliptaChecklist;
