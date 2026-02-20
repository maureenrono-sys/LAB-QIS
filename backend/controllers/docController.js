const { Document } = require('../models');

// @desc    Upload a new quality document/SOP
// @route   POST /api/docs
exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload a file" });
        }

        const { title, version, isoClause, expiryDate, department } = req.body;

        const doc = await Document.create({
            title,
            version,
            isoClause,
            expiryDate,
            department: department || 'Quality',
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

// @desc    Update document metadata
// @route   PUT /api/docs/:id
exports.updateDocument = async (req, res) => {
    try {
        const doc = await Document.findOne({
            where: { id: req.params.id, labId: req.user.labId }
        });

        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const allowedUpdates = ['title', 'version', 'isoClause', 'expiryDate', 'department'];
        for (const field of allowedUpdates) {
            if (req.body[field] !== undefined) {
                doc[field] = req.body[field];
            }
        }

        await doc.save();
        res.json(doc);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
