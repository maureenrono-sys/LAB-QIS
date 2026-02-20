const express = require('express');
const router = express.Router();
const { uploadDocument, getDocuments, updateDocument } = require('../controllers/docController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoleKeys } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, authorizeRoleKeys('ADMIN', 'QUALITY_ASSURANCE_MANAGER', 'LAB_MANAGER'), upload.single('file'), uploadDocument);
router.get('/', protect, authorizeRoleKeys('ADMIN', 'QUALITY_ASSURANCE_MANAGER', 'LAB_MANAGER', 'LAB_TECHNOLOGIST'), getDocuments);
router.put('/:id', protect, authorizeRoleKeys('ADMIN', 'QUALITY_ASSURANCE_MANAGER', 'LAB_MANAGER'), updateDocument);

module.exports = router;
