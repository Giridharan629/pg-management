const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { enrollTenant, checkStatus } = require('../controllers/tenantController');

// Using the memory-upload middleware
router.post('/enroll', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 }
]), enrollTenant);

router.get('/status/:phone', checkStatus);

module.exports = router;