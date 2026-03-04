const express = require('express');
const router = express.Router();
const { addEquipment, getDeptEquipment, checkServiceReminders, recordMaintenance } = require('../controllers/equipmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');

router.post('/', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), addEquipment);
router.post('/maintenance', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), recordMaintenance);

router.get('/dept/:dept', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), getDeptEquipment);
router.get('/check-reminders', protect, authorizeRoleKeys('ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER', 'LAB_SCIENTIST'), checkServiceReminders);

module.exports = router;
