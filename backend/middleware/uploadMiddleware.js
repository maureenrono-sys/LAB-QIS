const multer = require('multer');
const path = require('path');

// Configure how files are stored
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Files will be saved in an 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename file to avoid duplicates
    }
});

const upload = multer({ storage: storage });

module.exports = upload;