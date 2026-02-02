const express = require('express');
const router = express.Router();
const { createNC, getNCs } = require('../controllers/ncController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createNC)
    .get(protect, getNCs);

module.exports = router;