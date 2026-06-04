const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['purchase', 'sale', 'adjustment', 'transfer', 'return', 'damaged', 'expired'],
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  quantityBefore: { type: Number, required: true },
  quantityAfter: { type: Number, required: true },
  unitPrice: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  reference: {
    type: String,
    trim: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  notes: { type: String, maxlength: 500 },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  location: {
    from: String,
    to: String,
  },
  attachments: [{ type: String }],
}, {
  timestamps: true,
});

transactionSchema.index({ product: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ performedBy: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
