const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getLabsOverview,
    getLabUsers,
    createLab,
    createLabUser,
    updateLab,
    updateUser,
    getLabDashboardSnapshot
} = require('../controllers/adminController');

router.use(protect);

router.get('/labs', getLabsOverview);
router.post('/labs', createLab);
router.get('/labs/:labId/users', getLabUsers);
router.post('/labs/:labId/users', createLabUser);
router.put('/labs/:labId', updateLab);
router.get('/labs/:labId/dashboard', getLabDashboardSnapshot);
router.put('/users/:userId', updateUser);

module.exports = router;
