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
const Department = require('./Department');
const QcRun = require('./QcRun');
const QcRuleViolation = require('./QcRuleViolation');
const CapaAction = require('./CapaAction');
const RiskRegister = require('./RiskRegister');
const KpiDefinition = require('./KpiDefinition');
const KpiValue = require('./KpiValue');
const DashboardSnapshot = require('./DashboardSnapshot');
const Sop = require('./Sop');
const SopVersion = require('./SopVersion');
const SopApproval = require('./SopApproval');
const SopAcknowledgement = require('./SopAcknowledgement');
const Staff = require('./Staff');
const Competency = require('./Competency');
const Training = require('./Training');
const TrainingAttendance = require('./TrainingAttendance');
const AuthorizationMatrix = require('./AuthorizationMatrix');
const SliptaChecklist = require('./SliptaChecklist');
const SliptaAssessment = require('./SliptaAssessment');
const SliptaAssessmentItem = require('./SliptaAssessmentItem');

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

Laboratory.hasMany(Department, { foreignKey: 'labId', onDelete: 'CASCADE' });
Department.belongsTo(Laboratory, { foreignKey: 'labId' });

Laboratory.hasMany(QcRun, { foreignKey: 'labId', onDelete: 'CASCADE' });
QcRun.belongsTo(Laboratory, { foreignKey: 'labId' });
Department.hasMany(QcRun, { foreignKey: 'departmentId', onDelete: 'SET NULL' });
QcRun.belongsTo(Department, { foreignKey: 'departmentId' });
Equipment.hasMany(QcRun, { foreignKey: 'equipmentId', onDelete: 'SET NULL' });
QcRun.belongsTo(Equipment, { foreignKey: 'equipmentId' });

QcRun.hasMany(QcRuleViolation, { foreignKey: 'qcRunId', onDelete: 'CASCADE' });
QcRuleViolation.belongsTo(QcRun, { foreignKey: 'qcRunId' });

Laboratory.hasMany(CapaAction, { foreignKey: 'labId', onDelete: 'CASCADE' });
CapaAction.belongsTo(Laboratory, { foreignKey: 'labId' });
NonConformance.hasMany(CapaAction, { foreignKey: 'ncId', onDelete: 'CASCADE' });
CapaAction.belongsTo(NonConformance, { foreignKey: 'ncId' });

Laboratory.hasMany(RiskRegister, { foreignKey: 'labId', onDelete: 'CASCADE' });
RiskRegister.belongsTo(Laboratory, { foreignKey: 'labId' });
Department.hasMany(RiskRegister, { foreignKey: 'departmentId', onDelete: 'SET NULL' });
RiskRegister.belongsTo(Department, { foreignKey: 'departmentId' });

Laboratory.hasMany(KpiDefinition, { foreignKey: 'labId', onDelete: 'CASCADE' });
KpiDefinition.belongsTo(Laboratory, { foreignKey: 'labId' });
Laboratory.hasMany(KpiValue, { foreignKey: 'labId', onDelete: 'CASCADE' });
KpiValue.belongsTo(Laboratory, { foreignKey: 'labId' });
Department.hasMany(KpiValue, { foreignKey: 'departmentId', onDelete: 'SET NULL' });
KpiValue.belongsTo(Department, { foreignKey: 'departmentId' });
Laboratory.hasMany(DashboardSnapshot, { foreignKey: 'labId', onDelete: 'CASCADE' });
DashboardSnapshot.belongsTo(Laboratory, { foreignKey: 'labId' });

Laboratory.hasMany(Sop, { foreignKey: 'labId', onDelete: 'CASCADE' });
Sop.belongsTo(Laboratory, { foreignKey: 'labId' });
Department.hasMany(Sop, { foreignKey: 'departmentId', onDelete: 'SET NULL' });
Sop.belongsTo(Department, { foreignKey: 'departmentId' });
Sop.hasMany(SopVersion, { foreignKey: 'sopId', onDelete: 'CASCADE' });
SopVersion.belongsTo(Sop, { foreignKey: 'sopId' });
SopVersion.hasMany(SopApproval, { foreignKey: 'sopVersionId', onDelete: 'CASCADE' });
SopApproval.belongsTo(SopVersion, { foreignKey: 'sopVersionId' });
SopVersion.hasMany(SopAcknowledgement, { foreignKey: 'sopVersionId', onDelete: 'CASCADE' });
SopAcknowledgement.belongsTo(SopVersion, { foreignKey: 'sopVersionId' });

Laboratory.hasMany(Staff, { foreignKey: 'labId', onDelete: 'CASCADE' });
Staff.belongsTo(Laboratory, { foreignKey: 'labId' });
Department.hasMany(Staff, { foreignKey: 'departmentId', onDelete: 'SET NULL' });
Staff.belongsTo(Department, { foreignKey: 'departmentId' });
Staff.hasMany(Competency, { foreignKey: 'staffId', onDelete: 'CASCADE' });
Competency.belongsTo(Staff, { foreignKey: 'staffId' });
Staff.hasMany(AuthorizationMatrix, { foreignKey: 'staffId', onDelete: 'CASCADE' });
AuthorizationMatrix.belongsTo(Staff, { foreignKey: 'staffId' });

Laboratory.hasMany(Training, { foreignKey: 'labId', onDelete: 'CASCADE' });
Training.belongsTo(Laboratory, { foreignKey: 'labId' });
Department.hasMany(Training, { foreignKey: 'departmentId', onDelete: 'SET NULL' });
Training.belongsTo(Department, { foreignKey: 'departmentId' });
Training.hasMany(TrainingAttendance, { foreignKey: 'trainingId', onDelete: 'CASCADE' });
TrainingAttendance.belongsTo(Training, { foreignKey: 'trainingId' });
Staff.hasMany(TrainingAttendance, { foreignKey: 'staffId', onDelete: 'CASCADE' });
TrainingAttendance.belongsTo(Staff, { foreignKey: 'staffId' });

Laboratory.hasMany(SliptaAssessment, { foreignKey: 'labId', onDelete: 'CASCADE' });
SliptaAssessment.belongsTo(Laboratory, { foreignKey: 'labId' });
SliptaAssessment.hasMany(SliptaAssessmentItem, { foreignKey: 'sliptaAssessmentId', onDelete: 'CASCADE' });
SliptaAssessmentItem.belongsTo(SliptaAssessment, { foreignKey: 'sliptaAssessmentId' });
SliptaChecklist.hasMany(SliptaAssessmentItem, { foreignKey: 'sliptaChecklistId', onDelete: 'SET NULL' });
SliptaAssessmentItem.belongsTo(SliptaChecklist, { foreignKey: 'sliptaChecklistId' });

// This is the object your controllers use
module.exports = {
    User,
    Laboratory,
    QualityIndicator,
    NonConformance,
    Document,
    Audit,
    AuditFinding,
    Notification,
    Equipment,
    Maintenance,
    Department,
    QcRun,
    QcRuleViolation,
    CapaAction,
    RiskRegister,
    KpiDefinition,
    KpiValue,
    DashboardSnapshot,
    Sop,
    SopVersion,
    SopApproval,
    SopAcknowledgement,
    Staff,
    Competency,
    Training,
    TrainingAttendance,
    AuthorizationMatrix,
    SliptaChecklist,
    SliptaAssessment,
    SliptaAssessmentItem
};
