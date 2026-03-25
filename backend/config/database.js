const Sequelize = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const dbPassword = process.env.DB_PASS || process.env.DB_PASSWORD || '';

// Initialize Sequelize with MySQL connection details
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    dbPassword,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false, // Set to true if you want to see raw SQL in the terminal
    }
);

module.exports = sequelize;
