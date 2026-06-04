require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventra';

const Category = mongoose.model('Category', new mongoose.Schema({
  name: String, color: String, description: String,
  isActive: { type: Boolean, default: true }
}));

const Supplier = mongoose.model('Supplier', new mongoose.Schema({
  name: String, email: String, phone: String, contactPerson: String,
  paymentTerms: { type: String, default: 'net_30' },
  rating: { type: Number, default: 3 },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}));

const CATEGORIES = [
  { name: 'Electronics',       color: '#6366f1', description: 'Electronic components and devices' },
  { name: 'Office Supplies',   color: '#22c55e', description: 'Stationery and office essentials' },
  { name: 'Furniture',         color: '#f59e0b', description: 'Office and warehouse furniture' },
  { name: 'Cleaning Supplies', color: '#06b6d4', description: 'Cleaning and sanitation products' },
  { name: 'Packaging',         color: '#a855f7', description: 'Boxes, tape, and packaging materials' },
  { name: 'Tools & Equipment', color: '#ef4444', description: 'Hand tools and power equipment' },
  { name: 'Mobile Phones',     color: '#3b82f6', description: 'Smartphones and accessories' },
  { name: 'Food & Beverages',  color: '#84cc16', description: 'Food items and drinks' },
];

const SUPPLIERS = [
  { name: 'TechSource Global',   email: 'orders@techsource.com',     phone: '+91-98765-00001', contactPerson: 'Amit Verma',    paymentTerms: 'net_30', rating: 5, totalOrders: 42, totalSpent: 125000 },
  { name: 'Reliance Digital',    email: 'b2b@reliancedigital.com',    phone: '+91-98765-00002', contactPerson: 'Rahul Sharma',  paymentTerms: 'net_15', rating: 4, totalOrders: 18, totalSpent: 28000 },
  { name: 'SupplyChain Direct',  email: 'bulk@supplychaindirect.com', phone: '+91-98765-00003', contactPerson: 'Priya Mehta',   paymentTerms: 'net_60', rating: 3, totalOrders: 7,  totalSpent: 45000 },
  { name: 'CleanBright Ltd',     email: 'wholesale@cleanbright.com',  phone: '+91-98765-00004', contactPerson: 'David Park',    paymentTerms: 'net_30', rating: 4, totalOrders: 24, totalSpent: 12500 },
  { name: 'Office Mart India',   email: 'orders@officemart.in',       phone: '+91-98765-00005', contactPerson: 'Sneha Joshi',   paymentTerms: 'net_15', rating: 4, totalOrders: 31, totalSpent: 18000 },
];

const run = async () => {
  console.log('\n🌱 Inventra — Category & Supplier Seed');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Connecting to:', MONGO_URI);

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  // Check existing
  const existingCats = await Category.countDocuments();
  const existingSups = await Supplier.countDocuments();

  if (existingCats > 0) {
    console.log(`⚠  ${existingCats} categories already exist — skipping categories`);
    console.log('   (Delete them from MongoDB if you want to re-seed)\n');
  } else {
    await Category.insertMany(CATEGORIES);
    console.log(`✅ ${CATEGORIES.length} categories created`);
  }

  if (existingSups > 0) {
    console.log(`⚠  ${existingSups} suppliers already exist — skipping suppliers`);
  } else {
    await Supplier.insertMany(SUPPLIERS);
    console.log(`✅ ${SUPPLIERS.length} suppliers created`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Done! Refresh your browser now.');
  console.log('   Categories aur Suppliers dropdown mein dikhne chahiye.\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(e => {
  console.error('\n❌ Error:', e.message);
  process.exit(1);
});