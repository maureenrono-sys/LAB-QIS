const PDFDocument = require('pdfkit');
const { DashboardSnapshot, Department, KpiValue, QualityIndicator, NonConformance, Audit } = require('../models');
const { getCurrentPeriod } = require('../services/kpiService');

exports.generateMonthlyReport = async (req, res) => {
    try {
        const period = req.body.period || getCurrentPeriod();
        const snapshot = await DashboardSnapshot.findOne({ where: { labId: req.user.labId, period } });
        if (!snapshot) {
            return res.status(404).json({ message: 'No dashboard snapshot available for the requested period' });
        }

        res.json({
            reportType: 'Monthly Quality Report',
            period,
            metrics: snapshot,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.compareDepartments = async (req, res) => {
    try {
        const departments = await Department.findAll({ where: { labId: req.user.labId } });
        const comparison = await Promise.all(departments.map(async (department) => {
            const values = await KpiValue.findAll({
                where: { labId: req.user.labId, departmentId: department.id }
            });
            const avg = values.length > 0
                ? values.reduce((sum, item) => sum + Number(item.value), 0) / values.length
                : 0;
            return { department: department.name, kpiAverage: Number(avg.toFixed(2)) };
        }));
        res.json(comparison);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTrendProjections = async (req, res) => {
    try {
        const snapshots = await DashboardSnapshot.findAll({
            where: { labId: req.user.labId },
            order: [['period', 'ASC']],
            limit: 12
        });
        const projections = snapshots.map((snapshot, index) => ({
            period: snapshot.period,
            observedLqi: Number(snapshot.labQualityIndex),
            projectedLqi: Number(snapshot.labQualityIndex) + (index + 1) * 0.5
        }));
        res.json(projections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.exportPdf = async (req, res) => {
    try {
        const requestedId = req.params.id;
        const period = req.query.period
            || (requestedId && requestedId !== 'latest' ? decodeURIComponent(requestedId) : getCurrentPeriod());

        let snapshot = await DashboardSnapshot.findOne({
            where: { labId: req.user.labId, period }
        });

        if (!snapshot) {
            snapshot = await DashboardSnapshot.findOne({
                where: { labId: req.user.labId },
                order: [['createdAt', 'DESC']]
            });
        }

        const [latestAudit, qiRows, ncRows] = await Promise.all([
            Audit.findOne({
                where: { labId: req.user.labId },
                order: [['createdAt', 'DESC']]
            }),
            QualityIndicator.findAll({
                where: { labId: req.user.labId },
                order: [['createdAt', 'DESC']],
                limit: 12
            }),
            NonConformance.findAll({
                where: { labId: req.user.labId },
                order: [['createdAt', 'DESC']],
                limit: 20
            })
        ]);

        const openNc = ncRows.filter((item) => item.status !== 'Closed').length;
        const overdueNc = ncRows.filter((item) => item.deadline && new Date(item.deadline).getTime() < Date.now() && item.status !== 'Closed').length;
        const qiMet = qiRows.filter((item) => Number(item.actualPercentage) >= Number(item.targetPercentage)).length;
        const qiCount = qiRows.length;

        const fileName = `management-review-pack-${period || getCurrentPeriod()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        doc.pipe(res);

        const renderHeader = (title) => {
            doc.fontSize(9).fillColor('#4b5563').text('Lab-QIS | Quality Intelligence System', { align: 'left' });
            doc.text(`Management Review Pack`, { align: 'right' });
            doc.moveDown(0.6);
            doc.fontSize(17).fillColor('#111827').text(title, { align: 'left' });
            doc.moveDown(0.3);
            doc.fontSize(10).fillColor('#6b7280').text(`Generated: ${new Date().toLocaleString()}`);
            doc.text(`Laboratory ID: ${req.user.labId}`);
            doc.text(`Reporting Period: ${snapshot?.period || period || 'Latest Available'}`);
            doc.moveDown(0.8);
            doc.fillColor('#111827');
        };

        const ensureSectionSpace = (estimatedHeight = 180) => {
            if (doc.y + estimatedHeight > doc.page.height - 80) {
                doc.addPage();
            }
        };

        renderHeader('Monthly Quality & Compliance Report');
        doc.moveDown(0.3);
        doc.fontSize(14).text('1. Executive Summary');
        doc.moveDown(0.4);
        doc.fontSize(11);
        doc.text(`Lab Quality Index: ${snapshot ? Number(snapshot.labQualityIndex).toFixed(2) : 'N/A'}`);
        doc.text(`QC Pass Rate: ${snapshot ? Number(snapshot.qcPassRate).toFixed(2) : 'N/A'}%`);
        doc.text(`SLIPTA Star Level: ${snapshot ? Number(snapshot.sliptaStarLevel) : (latestAudit?.starLevel ?? 0)}`);
        doc.text(`Competency Compliance: ${snapshot ? Number(snapshot.competencyCompliance).toFixed(2) : 'N/A'}%`);
        doc.text(`Open NC/CAPA: ${openNc}`);
        doc.text(`Overdue NC/CAPA: ${overdueNc}`);

        ensureSectionSpace(220);
        doc.moveDown(1);
        doc.fontSize(14).text('2. Quality Indicator Performance');
        doc.moveDown(0.4);
        if (!qiRows.length) {
            doc.fontSize(11).text('No quality indicator data available for this period.');
        } else {
            doc.fontSize(11).text(`Indicators meeting target: ${qiMet}/${qiCount} (${qiCount > 0 ? ((qiMet / qiCount) * 100).toFixed(1) : 0}%)`);
            doc.moveDown(0.3);
            qiRows.slice(0, 8).forEach((row, index) => {
                const actual = Number(row.actualPercentage || 0).toFixed(1);
                const target = Number(row.targetPercentage || 0).toFixed(1);
                const status = Number(row.actualPercentage || 0) >= Number(row.targetPercentage || 0) ? 'Met' : 'Not Met';
                doc.text(`${index + 1}. ${row.name} (${row.phase}) - Actual ${actual}% / Target ${target}% -> ${status}`);
            });
        }

        ensureSectionSpace(220);
        doc.moveDown(1);
        doc.fontSize(14).text('3. Non-Conformance and CAPA');
        doc.moveDown(0.4);
        if (!ncRows.length) {
            doc.fontSize(11).text('No NC records available.');
        } else {
            const severityCount = ncRows.reduce((acc, row) => {
                const key = row.severity || 'Medium';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            doc.fontSize(11).text(`Severity mix: Low ${severityCount.Low || 0}, Medium ${severityCount.Medium || 0}, High ${severityCount.High || 0}, Critical ${severityCount.Critical || 0}`);
            doc.text(`Current open workload: ${openNc} (overdue: ${overdueNc})`);
            doc.moveDown(0.3);
            ncRows.slice(0, 6).forEach((row, index) => {
                doc.text(`${index + 1}. [${row.severity}] ${row.status} - ${String(row.description || '').slice(0, 100)}`);
            });
        }

        ensureSectionSpace(180);
        doc.moveDown(1);
        doc.fontSize(14).text('4. Audit Status');
        doc.moveDown(0.4);
        if (!latestAudit) {
            doc.fontSize(11).text('No audit records available.');
        } else {
            doc.fontSize(11).text(`Latest audit type: ${latestAudit.auditType}`);
            doc.text(`Latest audit score: ${latestAudit.totalScore}`);
            doc.text(`Latest SLIPTA stars: ${latestAudit.starLevel}`);
            doc.text(`Audit status: ${latestAudit.status}`);
            doc.text(`Audit date: ${new Date(latestAudit.createdAt).toLocaleDateString()}`);
        }

        ensureSectionSpace(140);
        doc.moveDown(1);
        doc.fontSize(14).text('5. Recommendations');
        doc.moveDown(0.4);
        doc.fontSize(11);
        if (overdueNc > 0) doc.text(`- Escalate ${overdueNc} overdue NC/CAPA item(s) for immediate closure.`);
        if (qiCount > 0 && qiMet < qiCount) doc.text(`- Prioritize corrective actions for ${qiCount - qiMet} QI(s) below target.`);
        if (latestAudit && Number(latestAudit.starLevel) < 3) doc.text('- Schedule targeted internal audit follow-up for low-scoring clauses.');
        if (overdueNc === 0 && (qiCount === 0 || qiMet === qiCount) && (!latestAudit || Number(latestAudit.starLevel) >= 3)) {
            doc.text('- Maintain current controls and continue trend monitoring.');
        }

        ensureSectionSpace(180);
        doc.moveDown(1);
        doc.fontSize(14).text('6. Management Review Sign-off');
        doc.moveDown(0.4);
        doc.fontSize(11).text('Prepared by: ___________________________   Date: __________________');
        doc.moveDown(0.5);
        doc.text('Reviewed by (QA Manager): _______________   Date: __________________');
        doc.moveDown(0.5);
        doc.text('Approved by (Lab Manager): ______________   Date: __________________');
        doc.moveDown(0.5);
        doc.text('Notes / Decisions:');
        doc.rect(doc.x, doc.y + 4, 500, 90).strokeColor('#d1d5db').stroke();

        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
