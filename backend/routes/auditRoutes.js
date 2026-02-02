const express = require('express');
const router = express.Router();
const { createAudit } = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createAudit);

module.exports = router;