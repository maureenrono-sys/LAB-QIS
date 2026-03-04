const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');
const { getLoginLogs, getErrorLogs, getRequestAuditLogs } = require('../controllers/systemLogController');

router.get('/logins', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), getLoginLogs);
router.get('/errors', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), getErrorLogs);
router.get('/requests', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), getRequestAuditLogs);

module.exports = router;
