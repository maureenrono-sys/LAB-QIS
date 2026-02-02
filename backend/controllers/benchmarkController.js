const { Audit, Laboratory } = require('../models');
const { Sequelize } = require('sequelize');

exports.getGlobalBenchmarks = async (req, res) => {
    try {
        // Calculate the average star level across ALL labs in the system
        const stats = await Audit.findAll({
            attributes: [
                [Sequelize.fn('AVG', Sequelize.col('starLevel')), 'averageStarLevel'],
                [Sequelize.fn('MAX', Sequelize.col('starLevel')), 'topStarLevel'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalAuditsDone']
            ]
        });

        // Get the current lab's latest audit
        const myLatestAudit = await Audit.findOne({
            where: { labId: req.user.labId },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            myPerformance: myLatestAudit ? myLatestAudit.starLevel : 0,
            globalAverage: parseFloat(stats[0].dataValues.averageStarLevel).toFixed(1),
            topPerformer: stats[0].dataValues.topStarLevel,
            totalPeerDataPoints: stats[0].dataValues.totalAuditsDone
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};