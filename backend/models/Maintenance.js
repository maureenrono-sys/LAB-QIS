const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Maintenance = sequelize.define('Maintenance', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    serviceDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    serviceType: { type: DataTypes.ENUM('Routine', 'Repair', 'Calibration'), defaultValue: 'Routine' },
    technicianName: { type: DataTypes.STRING },
    notes: { type: DataTypes.TEXT },
    cost: { type: DataTypes.DECIMAL(10, 2) }
});

module.exports = Maintenance;