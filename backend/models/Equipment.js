const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Equipment = sequelize.define('Equipment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }, // e.g., Sysmex XN-1000
    serialNumber: { type: DataTypes.STRING, unique: true },
    department: { 
        type: DataTypes.ENUM('Reception', 'Phlebotomy', 'Hematology', 'Biochemistry', 'Serology', 'Parasitology', 'Bacteriology', 'Microbiology', 'TB Lab', 'Blood Bank', 'Molecular', 'Histology', 'Quality'),
        allowNull: false 
    },
    lastServiceDate: { type: DataTypes.DATE },
    nextServiceDate: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM('Operational', 'Down', 'Under Maintenance'), defaultValue: 'Operational' }
});

module.exports = Equipment;
