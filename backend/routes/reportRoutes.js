const express = require('express');
const router = express.Router();
const { getManagementSummary } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/management-review', protect, getManagementSummary);

module.exports = router;