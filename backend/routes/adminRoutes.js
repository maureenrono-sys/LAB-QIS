const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');
const {
    getLabsOverview,
    getLabUsers,
    updateLab,
    updateUser,
    getLabDashboardSnapshot
} = require('../controllers/adminController');

router.use(protect, authorizeRoleKeys('ADMIN'));

router.get('/labs', getLabsOverview);
router.get('/labs/:labId/users', getLabUsers);
router.put('/labs/:labId', updateLab);
router.get('/labs/:labId/dashboard', getLabDashboardSnapshot);
router.put('/users/:userId', updateUser);

module.exports = router;
