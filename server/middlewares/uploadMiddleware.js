const multer = require('multer');

// Store files in memory temporarily instead of writing to disk
const storage = multer.memoryStorage();

// Accept only specific image formats and PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file to prevent crashing
    fileFilter: fileFilter
});

module.exports = upload;