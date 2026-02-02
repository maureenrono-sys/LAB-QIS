const express = require('express');
const router = express.Router();
const { registerLab, login } = require('../controllers/authController');

router.post('/register', registerLab);
router.post('/login', login);

module.exports = router;