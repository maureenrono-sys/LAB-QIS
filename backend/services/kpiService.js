const { Op } = require('sequelize');
const {
    DashboardSnapshot,
    NonConformance,
    QcRun,
    Equipment,
    SliptaAssessment,
    Staff,
    Competency
} = require('../models');

function getCurrentPeriod() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}-${month}`;
}

function safePercent(num, den) {
    if (!den || den <= 0) return 0;
    return (num / den) * 100;
}

async function computeDashboardSnapshot(labId, period = getCurrentPeriod()) {
    const [openNcCount, overdueNcCount, qcTotal, qcPassed, calibrationAlerts, latestSlipta, activeStaff, competentStaff] = await Promise.all([
        NonConformance.count({ where: { labId, status: { [Op.in]: ['Open', 'In Progress'] } } }),
        NonConformance.count({ where: { labId, status: { [Op.in]: ['Open', 'In Progress'] }, deadline: { [Op.lt]: new Date() } } }),
        QcRun.count({ where: { labId } }),
        QcRun.count({ where: { labId, status: 'PASS' } }),
        Equipment.count({ where: { labId, nextServiceDate: { [Op.lte]: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) } } }),
        SliptaAssessment.findOne({ where: { labId }, order: [['assessmentDate', 'DESC']] }),
        Staff.count({ where: { labId, isActive: true } }),
        Competency.count({
            include: [{ model: Staff, where: { labId, isActive: true } }],
            where: { status: 'Competent', expiresAt: { [Op.gte]: new Date() } }
        }).catch(() => 0)
    ]);

    const qcPassRate = safePercent(qcPassed, qcTotal);
    const competencyCompliance = safePercent(competentStaff, activeStaff);
    const sliptaStarLevel = latestSlipta ? latestSlipta.starLevel : 0;

    const labQualityIndex = (
        (qcPassRate * 0.25) +
        (Math.max(0, 100 - (openNcCount * 3)) * 0.20) +
        (Math.max(0, 100 - (calibrationAlerts * 5)) * 0.20) +
        ((sliptaStarLevel * 20) * 0.20) +
        (competencyCompliance * 0.15)
    );

    const [snapshot] = await DashboardSnapshot.findOrCreate({
        where: { labId, period },
        defaults: {
            labId,
            period,
            labQualityIndex,
            qcPassRate,
            openNcCount,
            overdueNcCount,
            calibrationAlerts,
            sliptaStarLevel,
            competencyCompliance
        }
    });

    snapshot.labQualityIndex = labQualityIndex;
    snapshot.qcPassRate = qcPassRate;
    snapshot.openNcCount = openNcCount;
    snapshot.overdueNcCount = overdueNcCount;
    snapshot.calibrationAlerts = calibrationAlerts;
    snapshot.sliptaStarLevel = sliptaStarLevel;
    snapshot.competencyCompliance = competencyCompliance;
    await snapshot.save();

    return snapshot;
}

module.exports = {
    computeDashboardSnapshot,
    getCurrentPeriod
};
