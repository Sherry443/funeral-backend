// ==========================================
// routes/condolenceRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const condolenceController = require('../../controller/condolenceController.js');

// Get all condolences (admin view with pagination)
router.get('/', condolenceController.getAllCondolences);

// Get condolences for a specific obituary by ID
router.get('/obituary/:obituaryId', condolenceController.getCondolencesByObituaryId);

// Get condolences for a specific obituary by slug
router.get('/obituary/slug/:slug', condolenceController.getCondolencesBySlug);

// Get condolence statistics for an obituary
router.get('/stats/:obituaryId', condolenceController.getCondolenceStats);

// Create a new condolence
router.post('/', condolenceController.createCondolence);

// Update a condolence (for moderation)
router.put('/:id', condolenceController.updateCondolence);

// Delete a condolence
router.delete('/:id', condolenceController.deleteCondolence);

module.exports = router;