const express = require('express');
const router = express.Router();
const { addQI, getMyLabQI } = require('../controllers/qiController');
const { protect } = require('../middleware/authMiddleware');

// All QI routes should be protected (requires login)
router.route('/')
    .post(protect, addQI)
    .get(protect, getMyLabQI);

module.exports = router;