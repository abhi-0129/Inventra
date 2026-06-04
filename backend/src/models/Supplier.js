const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: 200,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  phone: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  contactPerson: { type: String },
  taxId: { type: String },
  paymentTerms: {
    type: String,
    enum: ['net_15', 'net_30', 'net_60', 'immediate', 'custom'],
    default: 'net_30',
  },
  rating: { type: Number, min: 1, max: 5, default: 3 },
  notes: { type: String, maxlength: 1000 },
  isActive: { type: Boolean, default: true },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
}, {
  timestamps: true,
});

supplierSchema.index({ name: 'text', email: 'text' });

module.exports = mongoose.model('Supplier', supplierSchema);
