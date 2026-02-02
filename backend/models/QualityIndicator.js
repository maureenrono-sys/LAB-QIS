const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QualityIndicator = sequelize.define('QualityIndicator', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false // e.g., "Specimen Rejection Rate"
    },
    phase: {
        type: DataTypes.ENUM('Pre-analytical', 'Analytical', 'Post-analytical'),
        allowNull: false
    },
    targetPercentage: {
        type: DataTypes.DECIMAL(5, 2), // e.g., 98.00
        allowNull: false
    },
    actualPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00
    },
    month: {
        type: DataTypes.STRING, // e.g., "January 2026"
        allowNull: false
    },
    isoClause: {
        type: DataTypes.STRING, // e.g., "7.2.3"
    },
    status: {
        type: DataTypes.VIRTUAL, // Calculated on the fly
        get() {
            return this.actualPercentage >= this.targetPercentage ? 'Met' : 'Not Met';
        }
    }
});

module.exports = QualityIndicator;