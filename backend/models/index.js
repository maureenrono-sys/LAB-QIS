const User = require('./user');
const Laboratory = require('./Laboratory');
const QualityIndicator = require('./QualityIndicator');
const NonConformance = require('./NonConformance');
const Document = require('./Document'); // or './document' if your file is lowercase
const Audit = require('./Audit');
const AuditFinding = require('./AuditFinding');
const Notification = require('./Notification');
const Equipment = require('./Equipment');
const Maintenance = require('./Maintenance');

// Relationships
Laboratory.hasMany(User, { foreignKey: 'labId', onDelete: 'CASCADE' });
User.belongsTo(Laboratory, { foreignKey: 'labId' });

Laboratory.hasMany(QualityIndicator, { foreignKey: 'labId', onDelete: 'CASCADE' });
QualityIndicator.belongsTo(Laboratory, { foreignKey: 'labId' });

Laboratory.hasMany(NonConformance, { foreignKey: 'labId', onDelete: 'CASCADE' });
NonConformance.belongsTo(Laboratory, { foreignKey: 'labId' });

Laboratory.hasMany(Document, { foreignKey: 'labId', onDelete: 'CASCADE' });
Document.belongsTo(Laboratory, { foreignKey: 'labId' });

Laboratory.hasMany(Audit, { foreignKey: 'labId' });
Audit.belongsTo(Laboratory, { foreignKey: 'labId' });

Audit.hasMany(AuditFinding, { foreignKey: 'auditId', onDelete: 'CASCADE' });
AuditFinding.belongsTo(Audit, { foreignKey: 'auditId' });

Laboratory.hasMany(Notification, { foreignKey: 'labId' });
Notification.belongsTo(Laboratory, { foreignKey: 'labId' });

Laboratory.hasMany(Equipment, { foreignKey: 'labId' });
Equipment.belongsTo(Laboratory, { foreignKey: 'labId' });

Equipment.hasMany(Maintenance, { foreignKey: 'equipmentId' });
Maintenance.belongsTo(Equipment, { foreignKey: 'equipmentId' });

// This is the object your controllers use
module.exports = {
    User,
    Laboratory,
    QualityIndicator,
    NonConformance,
    Document,
    Audit,
    AuditFinding,
    Equipment
};