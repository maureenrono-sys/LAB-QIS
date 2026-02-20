const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');
const {
    generateMonthlyReport,
    compareDepartments,
    getTrendProjections,
    exportPdf
} = require('../controllers/analyticsEngineController');

router.post('/reports/monthly', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), generateMonthlyReport);
router.get('/department-compare', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), compareDepartments);
router.get('/projections', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), getTrendProjections);
router.get('/reports/:id/pdf', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'), exportPdf);

module.exports = router;
