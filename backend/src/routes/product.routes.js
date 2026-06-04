const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/', productController.getAllProducts);
router.get('/low-stock', productController.getLowStockProducts);
router.get('/:id', productController.getProduct);
router.get('/:id/history', productController.getProductHistory);
router.post('/', restrictTo('admin', 'manager'), productController.createProduct);
router.put('/:id', restrictTo('admin', 'manager'), productController.updateProduct);
router.delete('/:id', restrictTo('admin'), productController.deleteProduct);
router.patch('/:id/adjust-stock', restrictTo('admin', 'manager', 'staff'), productController.adjustStock);

module.exports = router;
