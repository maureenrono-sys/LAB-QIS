const { Audit, QualityIndicator } = require('../models');
const { Sequelize } = require('sequelize');

exports.getGlobalBenchmarks = async (req, res) => {
    try {
        // Calculate aggregate star statistics across all audits (anonymized).
        const stats = await Audit.findAll({
            attributes: [
                [Sequelize.fn('AVG', Sequelize.col('starLevel')), 'averageStarLevel'],
                [Sequelize.fn('MAX', Sequelize.col('starLevel')), 'topStarLevel'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalAuditsDone']
            ]
        });

        // Current lab latest audit.
        const myLatestAudit = await Audit.findOne({
            where: { labId: req.user.labId },
            order: [['createdAt', 'DESC']]
        });

        // Percentile and quartile ranking (anonymized against all audit data points).
        const allAuditScores = await Audit.findAll({
            attributes: ['starLevel'],
            raw: true
        });
        const sortedScores = allAuditScores
            .map((row) => Number(row.starLevel) || 0)
            .sort((a, b) => a - b);
        const myScore = myLatestAudit ? Number(myLatestAudit.starLevel) || 0 : 0;
        const totalScores = sortedScores.length;
        const lessOrEqualCount = sortedScores.filter((score) => score <= myScore).length;
        const minimumPeerSample = 5;
        const percentile = totalScores > 0
            ? Number(((lessOrEqualCount / totalScores) * 100).toFixed(1))
            : 0;

        let percentileBand = 'No peer data yet';
        if (totalScores >= minimumPeerSample) {
            if (percentile <= 25) percentileBand = 'Bottom 25%';
            else if (percentile <= 50) percentileBand = '25th-50th percentile';
            else if (percentile <= 75) percentileBand = '50th-75th percentile';
            else percentileBand = 'Top 25%';
        } else if (totalScores > 0) {
            percentileBand = 'Limited peer sample';
        }

        // QI peer comparison (anonymized).
        const allQi = await QualityIndicator.findAll({
            attributes: ['actualPercentage', 'targetPercentage'],
            raw: true
        });
        const myQi = await QualityIndicator.findAll({
            where: { labId: req.user.labId },
            attributes: ['actualPercentage', 'targetPercentage'],
            raw: true
        });

        const computeQiSummary = (rows) => {
            if (!rows.length) {
                return { total: 0, metRate: 0, avgActual: 0, avgTarget: 0 };
            }
            const total = rows.length;
            const metCount = rows.filter((row) => Number(row.actualPercentage) >= Number(row.targetPercentage)).length;
            const avgActual = rows.reduce((sum, row) => sum + Number(row.actualPercentage || 0), 0) / total;
            const avgTarget = rows.reduce((sum, row) => sum + Number(row.targetPercentage || 0), 0) / total;
            return {
                total,
                metRate: Number(((metCount / total) * 100).toFixed(1)),
                avgActual: Number(avgActual.toFixed(1)),
                avgTarget: Number(avgTarget.toFixed(1))
            };
        };

        const globalQi = computeQiSummary(allQi);
        const myQiSummary = computeQiSummary(myQi);

        const allQiForTat = await QualityIndicator.findAll({
            attributes: ['labId', 'name', 'actualPercentage'],
            raw: true
        });
        const tatRowsAll = allQiForTat.filter((row) => String(row.name || '').toLowerCase().includes('tat'));
        const tatRowsMyLab = tatRowsAll.filter((row) => row.labId === req.user.labId);

        const percentileOf = (values, value) => {
            if (!values.length) return null;
            const sorted = [...values].sort((a, b) => a - b);
            const count = sorted.filter((v) => v <= value).length;
            return Number(((count / sorted.length) * 100).toFixed(1));
        };

        const allTatValues = tatRowsAll.map((row) => Number(row.actualPercentage || 0)).filter((n) => Number.isFinite(n));
        const myTatValues = tatRowsMyLab.map((row) => Number(row.actualPercentage || 0)).filter((n) => Number.isFinite(n));
        const myTatMedian = myTatValues.length
            ? [...myTatValues].sort((a, b) => a - b)[Math.floor(myTatValues.length / 2)]
            : null;
        const tatPercentile = myTatMedian === null ? null : percentileOf(allTatValues, myTatMedian);

        res.json({
            myPerformance: myScore,
            globalAverage: Number(parseFloat(stats[0].dataValues.averageStarLevel || 0).toFixed(1)),
            topPerformer: stats[0].dataValues.topStarLevel,
            totalPeerDataPoints: Number(stats[0].dataValues.totalAuditsDone || 0),
            percentile,
            percentileBand,
            sampleGuard: {
                minimumPeerSample,
                hasSufficientPeerSample: totalScores >= minimumPeerSample
            },
            peerLearning: {
                my: myQiSummary,
                global: globalQi
            },
            comparativeKpis: {
                tat: {
                    myMedianActual: myTatMedian,
                    globalSampleSize: allTatValues.length,
                    percentile: tatPercentile
                }
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
