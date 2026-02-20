const express = require('express');
const router = express.Router();
const { registerLab, login } = require('../controllers/authController');
const { bootstrapDemoData } = require('../controllers/demoController');

router.post('/register', registerLab);
router.post('/login', login);
router.post('/demo-bootstrap', bootstrapDemoData);

module.exports = router;
