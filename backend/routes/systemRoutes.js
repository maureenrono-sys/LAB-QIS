const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');
const {
    getLiveness,
    getReadiness,
    getMaintenance,
    updateMaintenance,
    exportBackup,
    importBackup
} = require('../controllers/systemController');

router.get('/health/live', getLiveness);
router.get('/health/ready', getReadiness);

router.get('/maintenance', protect, authorizeRoleKeys('ADMIN'), getMaintenance);
router.put('/maintenance', protect, authorizeRoleKeys('ADMIN'), updateMaintenance);
router.get('/backup/export', protect, authorizeRoleKeys('ADMIN'), exportBackup);
router.post('/backup/import', protect, authorizeRoleKeys('ADMIN'), importBackup);

module.exports = router;
