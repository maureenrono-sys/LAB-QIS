const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KpiDefinition = sequelize.define('KpiDefinition', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    weight: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    targetValue: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    formulaText: {
        type: DataTypes.TEXT
    }
});

module.exports = KpiDefinition;
