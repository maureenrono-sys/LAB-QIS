const express = require('express');
const router = express.Router();
const { uploadDocument, getDocuments } = require('../controllers/docController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// 'file' matches the key name you will use in Postman
router.post('/', protect, upload.single('file'), uploadDocument);
router.get('/', protect, getDocuments);

module.exports = router;