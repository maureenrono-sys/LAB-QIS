const { SliptaAssessment, SliptaAssessmentItem, SliptaChecklist, CapaAction } = require('../models');
const { validateSliptaAssessment } = require('../validators/sliptaValidator');

function calculateStars(percentage) {
    if (percentage >= 95) return 5;
    if (percentage >= 85) return 4;
    if (percentage >= 75) return 3;
    if (percentage >= 65) return 2;
    if (percentage >= 55) return 1;
    return 0;
}

exports.createAssessment = async (req, res) => {
    try {
        const validationError = validateSliptaAssessment(req.body);
        if (validationError) return res.status(400).json({ message: validationError });

        let totalScore = 0;
        let maxScore = 0;

        const assessment = await SliptaAssessment.create({
            labId: req.user.labId,
            assessmentDate: req.body.assessmentDate || new Date()
        });

        for (const item of req.body.items) {
            const checklist = await SliptaChecklist.findByPk(item.sliptaChecklistId);
            const itemMax = checklist ? checklist.maxScore : (item.maxScore || 5);
            totalScore += Number(item.score || 0);
            maxScore += Number(itemMax);
            await SliptaAssessmentItem.create({
                sliptaAssessmentId: assessment.id,
                sliptaChecklistId: item.sliptaChecklistId || null,
                score: item.score || 0,
                evidence: item.evidence || null,
                gapFlag: Number(item.score || 0) < Number(itemMax)
            });
        }

        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        assessment.totalScore = totalScore;
        assessment.percentage = percentage;
        assessment.starLevel = calculateStars(percentage);
        await assessment.save();

        res.status(201).json(assessment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAssessment = async (req, res) => {
    try {
        const assessment = await SliptaAssessment.findOne({
            where: { id: req.params.id, labId: req.user.labId },
            include: [{ model: SliptaAssessmentItem, include: [{ model: SliptaChecklist }] }]
        });

        if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
        res.json(assessment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.linkGapToCapa = async (req, res) => {
    try {
        const item = await SliptaAssessmentItem.findByPk(req.params.itemId);
        if (!item) return res.status(404).json({ message: 'Assessment item not found' });
        if (!item.gapFlag) return res.status(400).json({ message: 'Selected item is not a gap' });

        const capa = await CapaAction.create({
            labId: req.user.labId,
            ncId: req.body.ncId,
            actionType: 'Preventive',
            ownerName: req.body.ownerName || 'QA Manager',
            dueDate: req.body.dueDate,
            details: req.body.details || `CAPA generated from SLIPTA gap item ${item.id}`
        });

        res.status(201).json(capa);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
