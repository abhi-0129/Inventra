const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getAllProducts = catchAsync(async (req, res) => {
  const {
    page = 1, limit = 20, search, category, supplier,
    stockStatus, sortBy = 'createdAt', sortOrder = 'desc',
    minPrice, maxPrice, isActive = true,
  } = req.query;

  const filter = { isActive };
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (supplier) filter.supplier = supplier;
  if (minPrice || maxPrice) {
    filter.sellingPrice = {};
    if (minPrice) filter.sellingPrice.$gte = Number(minPrice);
    if (maxPrice) filter.sellingPrice.$lte = Number(maxPrice);
  }
  if (stockStatus === 'low_stock') filter.$expr = { $lte: ['$quantity', '$minStockLevel'] };
  if (stockStatus === 'out_of_stock') filter.quantity = 0;

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name color icon')
      .populate('supplier', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    },
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name color icon')
    .populate('supplier')
    .populate('createdBy', 'name email');

  if (!product) return next(new AppError('Product not found.', 404));

  res.status(200).json({ success: true, data: { product } });
});

exports.createProduct = catchAsync(async (req, res) => {
  const product = await Product.create({ ...req.body, createdBy: req.user._id });
  await product.populate('category', 'name color');

  res.status(201).json({ success: true, data: { product } });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: Date.now() },
    { new: true, runValidators: true }
  ).populate('category', 'name color').populate('supplier', 'name');

  if (!product) return next(new AppError('Product not found.', 404));

  res.status(200).json({ success: true, data: { product } });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!product) return next(new AppError('Product not found.', 404));

  res.status(200).json({ success: true, message: 'Product deactivated successfully.' });
});

exports.adjustStock = catchAsync(async (req, res, next) => {
  const { quantity, type, notes, unitPrice, reference } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) return next(new AppError('Product not found.', 404));

  const quantityBefore = product.quantity;
  let quantityAfter;

  if (['purchase', 'return'].includes(type)) {
    quantityAfter = quantityBefore + Math.abs(quantity);
  } else if (['sale', 'damaged', 'expired'].includes(type)) {
    quantityAfter = quantityBefore - Math.abs(quantity);
  } else if (type === 'adjustment') {
    quantityAfter = quantity; // absolute set
  } else {
    quantityAfter = quantityBefore + quantity;
  }

  if (quantityAfter < 0) {
    return next(new AppError('Insufficient stock for this operation.', 400));
  }

  product.quantity = quantityAfter;
  await product.save();

  await Transaction.create({
    type,
    product: product._id,
    quantity: Math.abs(quantityAfter - quantityBefore),
    quantityBefore,
    quantityAfter,
    unitPrice: unitPrice || (type === 'sale' ? product.sellingPrice : product.costPrice),
    totalAmount: Math.abs(quantityAfter - quantityBefore) * (unitPrice || product.costPrice),
    notes,
    reference,
    performedBy: req.user._id,
  });

  res.status(200).json({
    success: true,
    message: 'Stock adjusted successfully.',
    data: { product },
  });
});

exports.getLowStockProducts = catchAsync(async (req, res) => {
  const products = await Product.find({
    isActive: true,
    $expr: { $lte: ['$quantity', '$minStockLevel'] },
  }).populate('category', 'name').populate('supplier', 'name email').sort({ quantity: 1 });

  res.status(200).json({
    success: true,
    data: { products, count: products.length },
  });
});

exports.getProductHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const transactions = await Transaction.find({ product: req.params.id })
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Transaction.countDocuments({ product: req.params.id });

  res.status(200).json({
    success: true,
    data: { transactions, total },
  });
});
