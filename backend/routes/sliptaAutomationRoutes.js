const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');
const {
    createAssessment,
    getAssessment,
    linkGapToCapa
} = require('../controllers/sliptaAutomationController');

router.post('/assessments', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), createAssessment);
router.get('/assessments/:id', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_TECHNOLOGIST'), getAssessment);
router.post('/gaps/:itemId/link-capa', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), linkGapToCapa);

module.exports = router;
