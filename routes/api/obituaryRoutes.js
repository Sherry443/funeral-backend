// ==========================================
// routes/obituaryRoutes.js - FIXED
// ==========================================
const express = require('express');
const router = express.Router();
const multer = require('multer'); // ADD THIS
const obituaryController = require('../../controller/obituaryController');
const upload = require('../../config/multer');

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(400).json({
            message: 'File upload error',
            error: err.message
        });
    } else if (err) {
        console.error('Upload error:', err);
        return res.status(500).json({
            message: 'Upload failed',
            error: err.message
        });
    }
    next();
};

// Specific routes first
router.get('/recent', obituaryController.getRecentObituaries);
router.get('/search', obituaryController.searchObituaries);

// General routes
router.get('/', obituaryController.getAllObituaries);

// POST with file upload and error handling
router.post('/',
    (req, res, next) => {
        console.log('POST /api/obituaries - Request received');
        console.log('Content-Type:', req.headers['content-type']);
        next();
    },
    upload.fields([
        { name: 'photo', maxCount: 1 },
        { name: 'backgroundImage', maxCount: 1 }
    ]),
    handleMulterError,
    obituaryController.createObituary
);

// Routes with params last
router.get('/:slug', obituaryController.getObituaryBySlug);

// PUT with file upload
router.put('/:id',
    upload.fields([
        { name: 'photo', maxCount: 1 },
        { name: 'backgroundImage', maxCount: 1 }
    ]),
    handleMulterError,
    obituaryController.updateObituary
);

router.delete('/:id', obituaryController.deleteObituary);

module.exports = router;