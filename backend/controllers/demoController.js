const {
    User,
    Laboratory,
    Equipment,
    Document,
    QualityIndicator,
    NonConformance,
    Audit,
    AuditFinding,
    QcRun
} = require('../models');

async function ensureUser({ fullName, email, password, role, labId }) {
    const existing = await User.findOne({ where: { email } });
    if (existing) return existing;
    return User.create({ fullName, email, password, role, labId });
}

exports.bootstrapDemoData = async (req, res) => {
    try {
        const [lab] = await Laboratory.findOrCreate({
            where: { labName: 'Lab QIS Demo Laboratory' },
            defaults: {
                labName: 'Lab QIS Demo Laboratory',
                labType: 'Private',
                registrationNumber: 'LQIS-DEMO-001',
                address: 'Demo Avenue, Quality City',
                accreditationStatus: 'In Progress'
            }
        });

        await ensureUser({
            fullName: 'Demo Administrator',
            email: 'admin@labqis.demo',
            password: 'Admin@123',
            role: 'System Administrator',
            labId: lab.id
        });
        await ensureUser({
            fullName: 'Demo Lab Manager',
            email: 'manager@labqis.demo',
            password: 'Admin@123',
            role: 'Laboratory Manager',
            labId: lab.id
        });
        await ensureUser({
            fullName: 'Demo Quality Officer',
            email: 'qa@labqis.demo',
            password: 'Admin@123',
            role: 'Quality Officer',
            labId: lab.id
        });
        await ensureUser({
            fullName: 'Demo Technologist',
            email: 'tech@labqis.demo',
            password: 'Admin@123',
            role: 'Laboratory Technologist',
            labId: lab.id
        });

        const equipmentSeed = [
            { name: 'Sysmex XN-1000', serialNumber: 'HXN-1000-001', department: 'Hematology', status: 'Operational' },
            { name: 'Cobas c311', serialNumber: 'BIO-C311-001', department: 'Biochemistry', status: 'Operational' },
            { name: 'ELISA Reader RT-2100', serialNumber: 'SER-RT2100-001', department: 'Serology', status: 'Under Maintenance' },
            { name: 'PCR Thermocycler 7500', serialNumber: 'MOL-7500-001', department: 'Molecular', status: 'Operational' },
            { name: 'Blood Bank Fridge BB-12', serialNumber: 'BB-B12-001', department: 'Blood Bank', status: 'Operational' },
            { name: 'Reception Barcode Printer', serialNumber: 'REC-BP-001', department: 'Reception', status: 'Operational' }
        ];

        for (const item of equipmentSeed) {
            await Equipment.findOrCreate({
                where: { serialNumber: item.serialNumber },
                defaults: {
                    ...item,
                    labId: lab.id,
                    nextServiceDate: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000))
                }
            });
        }

        const documentSeed = [
            { title: 'SOP-HM-CBC Analyzer Operation', version: '2.1', isoClause: '7.3', department: 'Hematology' },
            { title: 'SOP-BIO-Glucose QC Procedure', version: '1.4', isoClause: '7.7', department: 'Biochemistry' },
            { title: 'Job Aid - Sample Reception and Accessioning', version: '1.0', isoClause: '7.2', department: 'Reception' },
            { title: 'Job Aid - Pipette Calibration Quick Check', version: '1.2', isoClause: '6.4', department: 'Quality' }
        ];

        for (const doc of documentSeed) {
            await Document.findOrCreate({
                where: { labId: lab.id, title: doc.title, version: doc.version },
                defaults: {
                    ...doc,
                    filePath: 'uploads/demo-reference.pdf',
                    expiryDate: new Date(Date.now() + (120 * 24 * 60 * 60 * 1000))
                }
            });
        }

        const qiSeed = [
            { name: 'Specimen Rejection Rate', phase: 'Pre-analytical', targetPercentage: 98, actualPercentage: 96, month: 'February 2026', isoClause: '7.2' },
            { name: 'Internal QC Pass Rate', phase: 'Analytical', targetPercentage: 95, actualPercentage: 92, month: 'February 2026', isoClause: '7.7' },
            { name: 'Critical Results Notification Compliance', phase: 'Post-analytical', targetPercentage: 99, actualPercentage: 97, month: 'February 2026', isoClause: '7.8' }
        ];

        for (const qi of qiSeed) {
            await QualityIndicator.findOrCreate({
                where: { labId: lab.id, name: qi.name, month: qi.month },
                defaults: qi
            });
        }

        const qcSeed = [
            { analyte: 'Hemoglobin', controlLevel: 'Level 2', value: 12.1, mean: 12.0, sd: 0.5, status: 'PASS' },
            { analyte: 'Hemoglobin', controlLevel: 'Level 2', value: 13.2, mean: 12.0, sd: 0.5, status: 'WARNING' },
            { analyte: 'Glucose', controlLevel: 'Normal', value: 95.0, mean: 100.0, sd: 2.0, status: 'REJECT' },
            { analyte: 'Creatinine', controlLevel: 'High', value: 1.9, mean: 1.8, sd: 0.2, status: 'PASS' }
        ];

        for (const qc of qcSeed) {
            await QcRun.findOrCreate({
                where: { labId: lab.id, analyte: qc.analyte, value: qc.value, controlLevel: qc.controlLevel },
                defaults: {
                    ...qc,
                    runTime: new Date(Date.now() - (Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000))
                }
            });
        }

        await NonConformance.findOrCreate({
            where: { labId: lab.id, description: 'QC control exceeded 2SD on two consecutive runs' },
            defaults: {
                severity: 'High',
                rootCause: 'Expired control material used during setup',
                correctiveAction: 'Replace lot and retrain on lot verification',
                status: 'In Progress',
                deadline: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))
            }
        });

        const [audit] = await Audit.findOrCreate({
            where: { labId: lab.id, auditType: 'SLIPTA Baseline' },
            defaults: {
                status: 'Completed',
                totalScore: 120,
                starLevel: 3
            }
        });

        await AuditFinding.findOrCreate({
            where: { auditId: audit.id, clause: '1.0 Management Responsibility' },
            defaults: { scoreObtained: 4, maxScore: 5, findingNote: 'Policy documented and communicated.' }
        });
        await AuditFinding.findOrCreate({
            where: { auditId: audit.id, clause: '2.0 Documents & Records' },
            defaults: { scoreObtained: 3, maxScore: 5, findingNote: 'Version control needs stronger traceability.' }
        });

        res.json({
            message: 'Demo data is ready.',
            login: {
                admin: { email: 'admin@labqis.demo', password: 'Admin@123' },
                manager: { email: 'manager@labqis.demo', password: 'Admin@123' },
                qualityOfficer: { email: 'qa@labqis.demo', password: 'Admin@123' },
                labTechnologist: { email: 'tech@labqis.demo', password: 'Admin@123' }
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
