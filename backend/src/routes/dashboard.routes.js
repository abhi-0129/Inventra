const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', dashboardController.getStats);
router.get('/trend', dashboardController.getInventoryTrend);
router.get('/categories', dashboardController.getCategoryDistribution);
router.get('/top-products', dashboardController.getTopProducts);

module.exports = router;
