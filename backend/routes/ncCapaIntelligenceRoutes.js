const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');
const {
    getOverdueNc,
    getRepeatNc,
    classifyNc,
    createCapaAction,
    updateCapaStatus
} = require('../controllers/ncCapaIntelligenceController');

router.get('/overdue', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), getOverdueNc);
router.get('/repeats', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), getRepeatNc);
router.post('/:id/classify', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), classifyNc);
router.post('/:id/capa', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), createCapaAction);
router.put('/capa/:capaId', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), updateCapaStatus);

module.exports = router;
