const express = require('express');
const router = express.Router();
const { getManagementSummary } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');

router.get('/management-review', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), getManagementSummary);

module.exports = router;
