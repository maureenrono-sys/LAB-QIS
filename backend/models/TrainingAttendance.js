const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrainingAttendance = sequelize.define('TrainingAttendance', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    completionStatus: {
        type: DataTypes.ENUM('Completed', 'Missed', 'Scheduled'),
        defaultValue: 'Scheduled'
    },
    score: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    }
});

module.exports = TrainingAttendance;
