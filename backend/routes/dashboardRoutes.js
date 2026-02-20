const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');
const {
    getDashboardSummary,
    getAlertsPanel,
    getRiskHeatMap,
    recompute
} = require('../controllers/dashboardController');

router.get('/summary', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_TECHNOLOGIST'), getDashboardSummary);
router.get('/alerts', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_TECHNOLOGIST'), getAlertsPanel);
router.get('/heatmap', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), getRiskHeatMap);
router.post('/recompute', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), recompute);

module.exports = router;
