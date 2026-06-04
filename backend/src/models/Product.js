const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 200,
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    maxlength: 2000,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  unit: {
    type: String,
    enum: ['pcs', 'kg', 'litre', 'box', 'set', 'meter', 'dozen'],
    default: 'pcs',
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: 0,
  },
  maxStockLevel: {
    type: Number,
    default: 1000,
  },
  reorderPoint: {
    type: Number,
    default: 20,
  },
  location: {
    warehouse: String,
    aisle: String,
    shelf: String,
  },
  images: [{ type: String }],
  tags: [{ type: String, lowercase: true }],
  barcode: { type: String, unique: true, sparse: true },
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date, default: null },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: stock status
productSchema.virtual('stockStatus').get(function () {
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= this.minStockLevel) return 'low_stock';
  if (this.quantity >= this.maxStockLevel) return 'overstock';
  return 'in_stock';
});

// Virtual: profit margin
productSchema.virtual('profitMargin').get(function () {
  if (!this.costPrice || this.costPrice === 0) return 0;
  return (((this.sellingPrice - this.costPrice) / this.costPrice) * 100).toFixed(2);
});

// Indexes
productSchema.index({ name: 'text', sku: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ quantity: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
