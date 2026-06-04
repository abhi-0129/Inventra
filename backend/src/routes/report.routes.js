const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);
router.use(restrictTo('admin', 'manager'));

router.get('/inventory/pdf', reportController.exportInventoryPDF);
router.get('/inventory/excel', reportController.exportInventoryExcel);
router.get('/transactions/pdf', reportController.exportTransactionsPDF);

module.exports = router;
