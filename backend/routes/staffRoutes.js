const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');
const {
    createStaff,
    addCompetency,
    getCompetencyExpiry,
    recordTraining,
    getSkillMatrix,
    getCompetencyCompliance
} = require('../controllers/staffController');

router.post('/', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), createStaff);
router.post('/:id/competencies', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), addCompetency);
router.get('/competency-expiry', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), getCompetencyExpiry);
router.post('/trainings', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), recordTraining);
router.get('/skill-matrix', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), getSkillMatrix);
router.get('/competency-compliance', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), getCompetencyCompliance);

module.exports = router;
