const { Document } = require('../models');

// @desc    Upload a new quality document/SOP
// @route   POST /api/docs
exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload a file" });
        }

        const { title, version, isoClause, expiryDate } = req.body;

        const doc = await Document.create({
            title,
            version,
            isoClause,
            expiryDate,
            filePath: req.file.path, // Path to the file in the 'uploads' folder
            labId: req.user.labId    // From the auth token
        });

        res.status(201).json(doc);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all documents for the lab
// @route   GET /api/docs
exports.getDocuments = async (req, res) => {
    try {
        const docs = await Document.findAll({ 
            where: { labId: req.user.labId },
            order: [['createdAt', 'DESC']]
        });
        res.json(docs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};