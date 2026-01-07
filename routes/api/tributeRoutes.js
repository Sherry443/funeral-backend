// ==========================================
// routes/tributeRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const tributeController = require('../../services/tributeService');

router.get('/obituary/:obituaryId', tributeController.getTributesByObituary);
router.post('/', tributeController.createTribute);
router.put('/:id', tributeController.updateTribute);
router.delete('/:id', tributeController.deleteTribute);
router.patch('/:id/approve', tributeController.approveTribute);

module.exports = router;