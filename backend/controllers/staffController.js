const { Op } = require('sequelize');
const { Staff, Competency, Training, TrainingAttendance, AuthorizationMatrix } = require('../models');
const { validateStaff, validateCompetency } = require('../validators/staffValidator');

exports.createStaff = async (req, res) => {
    try {
        const validationError = validateStaff(req.body);
        if (validationError) return res.status(400).json({ message: validationError });
        const staff = await Staff.create({ ...req.body, labId: req.user.labId });
        res.status(201).json(staff);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.addCompetency = async (req, res) => {
    try {
        const validationError = validateCompetency(req.body);
        if (validationError) return res.status(400).json({ message: validationError });

        const competency = await Competency.create({
            staffId: req.params.id,
            testCode: req.body.testCode,
            status: req.body.status || 'Competent',
            assessedAt: req.body.assessedAt,
            expiresAt: req.body.expiresAt,
            assessorName: req.body.assessorName
        });

        if (competency.status === 'Competent') {
            await AuthorizationMatrix.create({
                staffId: req.params.id,
                testCode: competency.testCode,
                authorizedUntil: competency.expiresAt
            });
        }

        res.status(201).json(competency);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getCompetencyExpiry = async (req, res) => {
    try {
        const in30Days = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));
        const list = await Competency.findAll({
            include: [{ model: Staff, where: { labId: req.user.labId } }],
            where: { expiresAt: { [Op.lte]: in30Days, [Op.gte]: new Date() } },
            order: [['expiresAt', 'ASC']]
        });
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.recordTraining = async (req, res) => {
    try {
        const training = await Training.create({
            labId: req.user.labId,
            title: req.body.title,
            trainingDate: req.body.trainingDate,
            trainerName: req.body.trainerName,
            mandatory: req.body.mandatory ?? true,
            departmentId: req.body.departmentId || null
        });

        if (Array.isArray(req.body.staffIds)) {
            await Promise.all(req.body.staffIds.map((staffId) => TrainingAttendance.create({
                trainingId: training.id,
                staffId,
                completionStatus: 'Scheduled'
            })));
        }

        res.status(201).json(training);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getSkillMatrix = async (req, res) => {
    try {
        const staff = await Staff.findAll({
            where: { labId: req.user.labId, isActive: true },
            include: [{ model: Competency }, { model: AuthorizationMatrix }]
        });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCompetencyCompliance = async (req, res) => {
    try {
        const [activeStaff, compliant] = await Promise.all([
            Staff.count({ where: { labId: req.user.labId, isActive: true } }),
            Staff.count({
                where: { labId: req.user.labId, isActive: true },
                include: [{
                    model: Competency,
                    where: { status: 'Competent', expiresAt: { [Op.gte]: new Date() } },
                    required: true
                }]
            })
        ]);

        const competencyCompliance = activeStaff > 0 ? (compliant / activeStaff) * 100 : 0;
        res.json({ activeStaff, compliantStaff: compliant, competencyCompliance: Number(competencyCompliance.toFixed(2)) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
