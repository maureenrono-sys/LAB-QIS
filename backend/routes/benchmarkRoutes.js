const express = require('express');
const router = express.Router();
const { getGlobalBenchmarks } = require('../controllers/benchmarkController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');

router.get('/summary', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_TECHNOLOGIST'), getGlobalBenchmarks);

module.exports = router;
