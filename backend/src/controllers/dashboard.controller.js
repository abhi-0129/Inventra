const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Supplier = require('../models/Supplier');
const User = require('../models/User');
const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');

exports.getStats = catchAsync(async (req, res) => {
  const [
    totalProducts,
    totalSuppliers,
    lowStockCount,
    outOfStockCount,
    categoryCount,
    recentTransactions,
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Supplier.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, $expr: { $lte: ['$quantity', '$minStockLevel'] } }),
    Product.countDocuments({ isActive: true, quantity: 0 }),
    Category.countDocuments({ isActive: true }),
    Transaction.find()
      .populate('product', 'name sku')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  // Inventory value calculation
  const inventoryValue = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalCostValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
        totalRetailValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } },
      },
    },
  ]);

  const valueData = inventoryValue[0] || { totalCostValue: 0, totalRetailValue: 0 };

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalProducts,
        totalSuppliers,
        lowStockCount,
        outOfStockCount,
        categoryCount,
        totalCostValue: valueData.totalCostValue,
        totalRetailValue: valueData.totalRetailValue,
        potentialProfit: valueData.totalRetailValue - valueData.totalCostValue,
      },
      recentTransactions,
    },
  });
});

exports.getInventoryTrend = catchAsync(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));

  const trend = await Transaction.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$type',
        },
        totalQty: { $sum: '$quantity' },
        totalAmount: { $sum: '$totalAmount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.date': 1 } },
  ]);

  res.status(200).json({ success: true, data: { trend } });
});

exports.getCategoryDistribution = catchAsync(async (req, res) => {
  const distribution = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        productCount: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $ifNull: ['$category.name', 'Uncategorized'] },
        color: { $ifNull: ['$category.color', '#6366f1'] },
        productCount: 1,
        totalQuantity: 1,
        totalValue: 1,
      },
    },
    { $sort: { productCount: -1 } },
  ]);

  res.status(200).json({ success: true, data: { distribution } });
});

exports.getTopProducts = catchAsync(async (req, res) => {
  const { limit = 10, type = 'sale' } = req.query;

  const topProducts = await Transaction.aggregate([
    { $match: { type } },
    {
      $group: {
        _id: '$product',
        totalQuantity: { $sum: '$quantity' },
        totalRevenue: { $sum: '$totalAmount' },
        transactionCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        name: '$product.name',
        sku: '$product.sku',
        totalQuantity: 1,
        totalRevenue: 1,
        transactionCount: 1,
      },
    },
  ]);

  res.status(200).json({ success: true, data: { topProducts } });
});
