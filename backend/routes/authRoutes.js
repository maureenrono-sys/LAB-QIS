const express = require('express');
const router = express.Router();
const { registerLab, login, getMe, updateMe, updateLabSettings, uploadProfilePhoto, promoteSelfAdmin } = require('../controllers/authController');
const { bootstrapDemoData } = require('../controllers/demoController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', registerLab);
router.post('/login', login);
router.post('/demo-bootstrap', bootstrapDemoData);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.post('/me/photo', protect, upload.single('photo'), uploadProfilePhoto);
router.post('/promote-self-admin', protect, promoteSelfAdmin);
router.put('/lab-settings', protect, authorizeRoleKeys('ADMIN'), updateLabSettings);

module.exports = router;
