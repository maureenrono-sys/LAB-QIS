const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuthorizationMatrix = sequelize.define('AuthorizationMatrix', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    testCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    authorizedUntil: {
        type: DataTypes.DATE,
        allowNull: false
    }
});

module.exports = AuthorizationMatrix;
