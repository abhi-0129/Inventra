const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) throw new AppError('Gemini API key not configured.', 500);
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

exports.getInventorySummary = catchAsync(async (req, res) => {
  const [products, lowStock, recentTx] = await Promise.all([
    Product.find({ isActive: true }).populate('category', 'name').lean(),
    Product.find({ isActive: true, $expr: { $lte: ['$quantity', '$minStockLevel'] } }).lean(),
    Transaction.find().sort({ createdAt: -1 }).limit(50).lean(),
  ]);

  const context = {
    totalProducts: products.length,
    totalStockValue: products.reduce((s, p) => s + p.quantity * p.costPrice, 0),
    lowStockItems: lowStock.map(p => ({ name: p.name, sku: p.sku, qty: p.quantity, min: p.minStockLevel })),
    recentActivity: recentTx.slice(0, 10).map(t => ({ type: t.type, qty: t.quantity, date: t.createdAt })),
    categorySummary: products.reduce((acc, p) => {
      const cat = p.category?.name || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {}),
  };

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an inventory analyst for a business. Based on the following inventory data, provide a concise, actionable executive summary in 3-4 paragraphs. Highlight key insights, risks, and opportunities.

Inventory Data:
${JSON.stringify(context, null, 2)}

Focus on:
1. Overall inventory health
2. Critical stock issues
3. Financial exposure
4. Immediate recommended actions

Keep the tone professional and direct.`;

  const result = await model.generateContent(prompt);
  const summary = result.response.text();

  res.status(200).json({ success: true, data: { summary, context } });
});

exports.predictReorder = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate('category', 'name').lean();
  if (!product) return next(new AppError('Product not found.', 404));

  const transactions = await Transaction.find({ product: req.params.id })
    .sort({ createdAt: -1 }).limit(90).lean();

  const salesData = transactions
    .filter(t => t.type === 'sale')
    .map(t => ({ date: t.createdAt, qty: t.quantity }));

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an inventory optimization AI. Analyze this product's sales history and provide a reorder recommendation.

Product: ${product.name} (SKU: ${product.sku})
Current Stock: ${product.quantity} ${product.unit}
Min Stock Level: ${product.minStockLevel}
Reorder Point: ${product.reorderPoint}
Cost Price: $${product.costPrice}
Category: ${product.category?.name}

Last 90 days sales: ${JSON.stringify(salesData)}

Respond ONLY with a valid JSON object (no markdown):
{
  "shouldReorder": true/false,
  "urgency": "critical|high|medium|low",
  "recommendedQuantity": number,
  "estimatedDaysUntilStockout": number,
  "averageDailySales": number,
  "reasoning": "string",
  "estimatedCost": number
}`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().replace(/```json|```/g, '').trim();

  let recommendation;
  try {
    recommendation = JSON.parse(text);
  } catch {
    logger.error('Gemini JSON parse error:', text);
    return next(new AppError('AI response parsing failed. Try again.', 500));
  }

  res.status(200).json({ success: true, data: { product: { name: product.name, sku: product.sku, quantity: product.quantity }, recommendation } });
});

exports.detectAnomalies = catchAsync(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const transactions = await Transaction.find({ createdAt: { $gte: thirtyDaysAgo } })
    .populate('product', 'name sku costPrice')
    .populate('performedBy', 'name')
    .lean();

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a fraud and anomaly detection AI for an inventory system. Analyze these transactions from the past 30 days for unusual patterns, potential fraud, or data entry errors.

Transactions: ${JSON.stringify(transactions.slice(0, 100), null, 2)}

Respond ONLY with a valid JSON object (no markdown):
{
  "anomalies": [
    {
      "type": "string",
      "severity": "high|medium|low",
      "description": "string",
      "affectedTransactionIds": ["id1"],
      "recommendation": "string"
    }
  ],
  "overallRiskScore": number (0-100),
  "summary": "string"
}`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().replace(/```json|```/g, '').trim();

  let analysis;
  try {
    analysis = JSON.parse(text);
  } catch {
    analysis = { anomalies: [], overallRiskScore: 0, summary: 'Analysis completed. No structured data returned.' };
  }

  res.status(200).json({ success: true, data: analysis });
});

exports.chat = catchAsync(async (req, res, next) => {
  const { message, history = [] } = req.body;
  if (!message) return next(new AppError('Message is required.', 400));

  const [totalProducts, lowStock] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, $expr: { $lte: ['$quantity', '$minStockLevel'] } }),
  ]);

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const systemContext = `You are Inventra AI, an intelligent inventory management assistant. You help users manage their inventory, analyze trends, and make data-driven decisions.

Current System State:
- Total Active Products: ${totalProducts}
- Low Stock Items: ${lowStock}
- Current Date: ${new Date().toLocaleDateString()}

Be concise, helpful, and data-focused. If asked about specific data you don't have access to, guide the user to find it in the appropriate section of the dashboard.`;

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemContext }] },
      { role: 'model', parts: [{ text: 'Understood. I am Inventra AI, ready to help with inventory management.' }] },
      ...history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
    ],
  });

  const result = await chat.sendMessage(message);
  const reply = result.response.text();

  res.status(200).json({ success: true, data: { reply } });
});