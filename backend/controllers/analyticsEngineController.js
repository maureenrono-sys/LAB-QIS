const { DashboardSnapshot, Department, KpiValue } = require('../models');
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
    res.json({
        message: 'PDF export endpoint scaffolded. Integrate your preferred PDF engine (e.g., pdfkit/puppeteer).',
        reportId: req.params.id
    });
};
