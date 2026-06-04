const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', aiController.getInventorySummary);
router.get('/reorder/:id', aiController.predictReorder);
router.get('/anomalies', aiController.detectAnomalies);
router.post('/chat', aiController.chat);

module.exports = router;
