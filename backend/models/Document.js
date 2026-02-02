const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
    department: {
    type: DataTypes.ENUM(
        'Reception',
        'Phlebotomy',
        'Hematology', 
        'Biochemistry', 
        'Serology', 
        'Parasitology', 
        'Bacteriology', 
        'TB Lab', 
        'Blood Bank', 
        'Molecular',
        'Histology', 
        'Quality'
    ),
    defaultValue: 'Quality'
    },
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    version: {
        type: DataTypes.STRING,
        defaultValue: '1.0'
    },
    filePath: {
        type: DataTypes.STRING, // Stores the location of the file on the server
        allowNull: false
    },
    isoClause: {
        type: DataTypes.STRING
    },
    expiryDate: {
        type: DataTypes.DATE
    }
});

module.exports = Document;