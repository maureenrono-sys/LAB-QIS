const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');
const {
    createSop,
    uploadVersion,
    submitForApproval,
    approveOrReject,
    getExpiringSops,
    getSopCompliance
} = require('../controllers/sopController');

router.post('/', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), createSop);
router.post('/:id/versions', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), uploadVersion);
router.post('/:id/submit', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), submitForApproval);
router.post('/approvals/:approvalId/action', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER'), approveOrReject);
router.get('/expiring', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), getExpiringSops);
router.get('/compliance', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), getSopCompliance);

module.exports = router;
