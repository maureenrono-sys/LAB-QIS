const Sequelize = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const dbPassword = process.env.DB_PASS || process.env.DB_PASSWORD || '';
const databaseUrl = process.env.DATABASE_URL || '';
const configuredDialect = String(process.env.DB_DIALECT || '').trim().toLowerCase();
const inferredDialect = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')
    ? 'postgres'
    : 'mysql';
const dialect = configuredDialect || inferredDialect;
const useSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true';
const commonOptions = {
    dialect,
    logging: false
};

if (useSsl) {
    commonOptions.dialectOptions = {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    };
}

const sequelize = databaseUrl
    ? new Sequelize(databaseUrl, commonOptions)
    : new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        dbPassword,
        {
            ...commonOptions,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined
        }
    );

module.exports = sequelize;
