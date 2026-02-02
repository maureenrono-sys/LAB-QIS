const express = require('express');
const router = express.Router();
// ADD 'checkServiceReminders' TO THE LINE BELOW:
const { addEquipment, getDeptEquipment, checkServiceReminders } = require('../controllers/equipmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Only Admins and Lab Managers can ADD equipment
router.post('/', protect, authorize('Admin', 'Lab Manager'), addEquipment);

// Everyone can VIEW equipment
router.get('/dept/:dept', protect, getDeptEquipment);
router.get('/check-reminders', protect, checkServiceReminders);

module.exports = router;