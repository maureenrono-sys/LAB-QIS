const { QualityIndicator, NonConformance, Audit, Document } = require('../models');

exports.getManagementSummary = async (req, res) => {
    try {
        const labId = req.user.labId;

        const qiCount = await QualityIndicator.count({ where: { labId } });
        const openNCs = await NonConformance.count({ where: { labId, status: 'Open' } });
        const latestAudit = await Audit.findOne({ 
            where: { labId }, 
            order: [['createdAt', 'DESC']] 
        });

        res.json({
            summaryDate: new Date(),
            statistics: {
                totalQualityIndicators: qiCount,
                pendingCorrectiveActions: openNCs,
                currentStarLevel: latestAudit ? latestAudit.starLevel : "No Audit Done"
            },
            status: "Data retrieved for Management Review"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.generateISOReport = async (req, res) => {
    const labId = req.user.labId;
    
    // Fetch everything in parallel for speed
    const [ncCount, qiStats, docs] = await Promise.all([
        NonConformance.count({ where: { labId } }),
        QualityIndicator.findAll({ where: { labId } }),
        Document.count({ where: { labId } })
    ]);

    // Simple logic to find the weakest department based on NCs (if you add dept to NCs too)
    res.json({
        reportTitle: "ISO 15189 Management Review Summary",
        period: new Date().getFullYear(),
        metrics: {
            totalSOPs: docs,
            totalIncidents: ncCount,
            qiPerformance: qiStats.length > 0 ? "Data Available" : "No Data"
        },
        recommendation: ncCount > 10 ? "Immediate Internal Audit Required" : "Maintain current QMS vigilence"
    });
};
