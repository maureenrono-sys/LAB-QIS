const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClientFeedback = sequelize.define('ClientFeedback', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    feedbackCode: {
        type: DataTypes.STRING,
        unique: true
    },
    submittedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    clientType: {
        type: DataTypes.ENUM('Patient', 'Clinician', 'Corporate Client', 'Internal Staff'),
        allowNull: false
    },
    department: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('Complaint', 'Suggestion', 'Compliment', 'Inquiry'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    satisfactionRating: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    isAnonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    contactInfo: {
        type: DataTypes.STRING
    },
    severity: {
        type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
        defaultValue: 'Low'
    },
    tags: {
        type: DataTypes.JSON
    },
    status: {
        type: DataTypes.ENUM('New', 'Under Review', 'Investigation Ongoing', 'Action Implemented', 'Closed'),
        defaultValue: 'New'
    },
    assignedOfficer: {
        type: DataTypes.STRING
    },
    dueDate: {
        type: DataTypes.DATE
    },
    dateClosed: {
        type: DataTypes.DATE
    },
    resolutionNotes: {
        type: DataTypes.TEXT
    },
    linkedNcId: {
        type: DataTypes.UUID
    }
});

module.exports = ClientFeedback;
