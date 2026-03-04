const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');
const {
    getQcGateOptions,
    createQcRun,
    getQcRuns,
    getQcViolations,
    getQcTrends
} = require('../controllers/qcIntelligenceController');

router.get('/gate-options', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), getQcGateOptions);
router.post('/runs', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), createQcRun);
router.get('/runs', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), getQcRuns);
router.get('/violations', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), getQcViolations);
router.get('/trends', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), getQcTrends);

module.exports = router;
