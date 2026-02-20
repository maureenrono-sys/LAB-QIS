const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KpiValue = sequelize.define('KpiValue', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    period: {
        type: DataTypes.STRING,
        allowNull: false
    },
    value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Good', 'Watch', 'Critical'),
        defaultValue: 'Good'
    }
});

module.exports = KpiValue;
