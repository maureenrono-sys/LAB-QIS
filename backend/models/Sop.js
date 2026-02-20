const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sop = sequelize.define('Sop', {
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
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isoClause: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.ENUM('Draft', 'Under Review', 'Approved', 'Archived'),
        defaultValue: 'Draft'
    }
});

module.exports = Sop;
