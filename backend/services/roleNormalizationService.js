const sequelize = require('../config/database');

async function usersTableExists() {
    const [rows] = await sequelize.query("SHOW TABLES LIKE 'Users'");
    return Array.isArray(rows) && rows.length > 0;
}

async function prepareUserRolesForSync() {
    const dialect = sequelize.getDialect();
    if (dialect !== 'mysql') return;
    if (!(await usersTableExists())) return;

    const table = 'Users';
    const roleColumn = 'role';

    // Expand enum first so legacy values can be updated safely before model sync.
    await sequelize.query(
        `ALTER TABLE \`${table}\` MODIFY COLUMN \`${roleColumn}\` ENUM('Administrator','Laboratory Manager','Quality Assurance Manager','Laboratory Scientist','System Administrator','Admin','Lab Manager','Quality Assurance Officer','Quality Officer','Laboratory Technologist','Lab Technologist','Auditor') NOT NULL`
    );

    const updates = [
        [`UPDATE \`${table}\` SET \`${roleColumn}\` = 'Administrator' WHERE \`${roleColumn}\` IN ('System Administrator', 'Admin')`],
        [`UPDATE \`${table}\` SET \`${roleColumn}\` = 'Laboratory Manager' WHERE \`${roleColumn}\` IN ('Lab Manager')`],
        [`UPDATE \`${table}\` SET \`${roleColumn}\` = 'Quality Assurance Manager' WHERE \`${roleColumn}\` IN ('Quality Assurance Officer', 'Quality Officer')`],
        [`UPDATE \`${table}\` SET \`${roleColumn}\` = 'Laboratory Scientist' WHERE \`${roleColumn}\` IN ('Laboratory Technologist', 'Lab Technologist', 'Auditor')`]
    ];

    for (const [sql] of updates) {
        await sequelize.query(sql);
    }
}

async function normalizeUserRoles() {
    const dialect = sequelize.getDialect();
    if (dialect !== 'mysql') return;
    if (!(await usersTableExists())) return;

    const table = 'Users';
    const roleColumn = 'role';

    const updates = [
        [`UPDATE \`${table}\` SET \`${roleColumn}\` = 'Administrator' WHERE \`${roleColumn}\` IN ('System Administrator', 'Admin')`],
        [`UPDATE \`${table}\` SET \`${roleColumn}\` = 'Laboratory Manager' WHERE \`${roleColumn}\` IN ('Lab Manager')`],
        [`UPDATE \`${table}\` SET \`${roleColumn}\` = 'Quality Assurance Manager' WHERE \`${roleColumn}\` IN ('Quality Assurance Officer', 'Quality Officer')`],
        [`UPDATE \`${table}\` SET \`${roleColumn}\` = 'Laboratory Scientist' WHERE \`${roleColumn}\` IN ('Laboratory Technologist', 'Lab Technologist', 'Auditor')`]
    ];

    for (const [sql] of updates) {
        await sequelize.query(sql);
    }

    await sequelize.query(
        `ALTER TABLE \`${table}\` MODIFY COLUMN \`${roleColumn}\` ENUM('Administrator','Laboratory Manager','Quality Assurance Manager','Laboratory Scientist') NOT NULL`
    );
}

module.exports = { prepareUserRolesForSync, normalizeUserRoles };
