const sequelize = require('../backend/config/database');
const models = require('../backend/models');

const REQUIRED_MODELS = [
    models.User,
    models.Laboratory,
    models.NonConformance,
    models.Audit,
    models.AuditFinding,
    models.ClientFeedback,
    models.LoginLog,
    models.ErrorLog,
    models.RequestAuditLog
];

async function run() {
    try {
        await sequelize.authenticate();
        const query = sequelize.getQueryInterface();
        const tables = await query.showAllTables();
        const normalized = tables.map((t) => (typeof t === 'string' ? t : Object.values(t)[0]));

        const expected = REQUIRED_MODELS.map((model) => {
            const tableName = model.getTableName();
            return typeof tableName === 'string' ? tableName : tableName.tableName;
        });
        const normalizedLower = normalized.map((name) => String(name).toLowerCase());
        const missing = expected.filter((name) => !normalizedLower.includes(String(name).toLowerCase()));
        console.log('Database connectivity: OK');
        console.log(`Detected tables: ${normalized.length}`);
        if (missing.length) {
            console.log(`Missing expected tables: ${missing.join(', ')}`);
            process.exitCode = 1;
        } else {
            console.log('Schema check passed.');
        }
    } catch (error) {
        console.error(`Schema check failed: ${error.message}`);
        process.exitCode = 1;
    } finally {
        await sequelize.close().catch(() => {});
    }
}

run();
