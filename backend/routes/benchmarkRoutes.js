const express = require('express');
const router = express.Router();
const { getGlobalBenchmarks } = require('../controllers/benchmarkController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, getGlobalBenchmarks);

module.exports = router;