const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const catchAsync = require('../utils/catchAsync');

const formatCurrency = (n) => `$${Number(n || 0).toFixed(2)}`;
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

exports.exportInventoryPDF = catchAsync(async (req, res) => {
  const products = await Product.find({ isActive: true })
    .populate('category', 'name')
    .populate('supplier', 'name')
    .sort({ name: 1 })
    .lean();

  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="inventra-inventory-${Date.now()}.pdf"`);
  doc.pipe(res);

  // Header
  doc.rect(0, 0, doc.page.width, 70).fill('#0f172a');
  doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('INVENTRA', 40, 22);
  doc.fontSize(10).font('Helvetica').text('Inventory Report', 40, 48);
  doc.text(`Generated: ${formatDate(new Date())}`, 40, 60);
  doc.text(`Total Products: ${products.length}`, 400, 48);

  doc.moveDown(3);

  // Summary Stats
  const totalValue = products.reduce((s, p) => s + p.quantity * p.costPrice, 0);
  const lowStock = products.filter(p => p.quantity <= p.minStockLevel).length;
  const outOfStock = products.filter(p => p.quantity === 0).length;

  doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold');
  const summaryY = 90;
  const cols = [40, 200, 360, 520];

  doc.rect(30, summaryY - 5, 770, 35).fill('#f8fafc');
  doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold');
  doc.text(`Total Inventory Value: ${formatCurrency(totalValue)}`, cols[0], summaryY + 5);
  doc.text(`Low Stock Items: ${lowStock}`, cols[1], summaryY + 5);
  doc.text(`Out of Stock: ${outOfStock}`, cols[2], summaryY + 5);
  doc.text(`Categories: ${[...new Set(products.map(p => p.category?.name))].length}`, cols[3], summaryY + 5);

  // Table Header
  const tableTop = 145;
  const headers = ['SKU', 'Product Name', 'Category', 'Qty', 'Cost Price', 'Sell Price', 'Stock Value', 'Status'];
  const widths = [80, 160, 100, 45, 80, 80, 90, 80];
  let x = 30;

  doc.rect(30, tableTop, 780, 20).fill('#0f172a');
  doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
  headers.forEach((h, i) => {
    doc.text(h, x + 3, tableTop + 6, { width: widths[i] });
    x += widths[i];
  });

  // Table Rows
  let rowY = tableTop + 20;
  products.forEach((p, idx) => {
    if (rowY > doc.page.height - 60) {
      doc.addPage({ layout: 'landscape' });
      rowY = 40;
    }

    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    doc.rect(30, rowY, 780, 18).fill(bg);

    const status = p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.minStockLevel ? 'Low Stock' : 'In Stock';
    const statusColor = p.quantity === 0 ? '#ef4444' : p.quantity <= p.minStockLevel ? '#f59e0b' : '#22c55e';

    const row = [
      p.sku, p.name, p.category?.name || '-',
      p.quantity.toString(), formatCurrency(p.costPrice),
      formatCurrency(p.sellingPrice), formatCurrency(p.quantity * p.costPrice),
    ];

    x = 30;
    doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica');
    row.forEach((val, i) => {
      doc.text(val, x + 3, rowY + 5, { width: widths[i] - 4, ellipsis: true });
      x += widths[i];
    });

    // Status badge
    doc.fillColor(statusColor).font('Helvetica-Bold').text(status, x + 3, rowY + 5, { width: widths[7] });
    rowY += 18;
  });

  // Footer
  doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
    .text('Confidential — Inventra Inventory Management System', 40, doc.page.height - 30, { align: 'center' });

  doc.end();
});

exports.exportInventoryExcel = catchAsync(async (req, res) => {
  const products = await Product.find({ isActive: true })
    .populate('category', 'name')
    .populate('supplier', 'name')
    .sort({ name: 1 })
    .lean();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Inventra';
  workbook.created = new Date();

  // ── Sheet 1: Inventory ──
  const sheet = workbook.addWorksheet('Inventory', {
    pageSetup: { fitToPage: true, orientation: 'landscape' },
  });

  sheet.columns = [
    { header: 'SKU', key: 'sku', width: 14 },
    { header: 'Product Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 16 },
    { header: 'Supplier', key: 'supplier', width: 18 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Unit', key: 'unit', width: 8 },
    { header: 'Min Stock', key: 'minStockLevel', width: 12 },
    { header: 'Reorder Point', key: 'reorderPoint', width: 14 },
    { header: 'Cost Price', key: 'costPrice', width: 13 },
    { header: 'Selling Price', key: 'sellingPrice', width: 14 },
    { header: 'Stock Value', key: 'stockValue', width: 14 },
    { header: 'Profit Margin %', key: 'margin', width: 16 },
    { header: 'Status', key: 'status', width: 14 },
  ];

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF6366F1' } } };
  });

  products.forEach((p, idx) => {
    const status = p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.minStockLevel ? 'Low Stock' : 'In Stock';
    const margin = p.costPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.costPrice) * 100).toFixed(1) : 0;
    const stockValue = p.quantity * p.costPrice;

    const row = sheet.addRow({
      sku: p.sku, name: p.name,
      category: p.category?.name || '-', supplier: p.supplier?.name || '-',
      quantity: p.quantity, unit: p.unit,
      minStockLevel: p.minStockLevel, reorderPoint: p.reorderPoint,
      costPrice: p.costPrice, sellingPrice: p.sellingPrice,
      stockValue, margin: Number(margin), status,
    });

    row.height = 18;
    const bgColor = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
    row.eachCell({ includeEmpty: true }, cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.alignment = { vertical: 'middle' };
    });

    // Highlight low/out of stock
    const statusCell = row.getCell('status');
    if (status === 'Out of Stock') {
      statusCell.font = { color: { argb: 'FFEF4444' }, bold: true };
    } else if (status === 'Low Stock') {
      statusCell.font = { color: { argb: 'FFF59E0B' }, bold: true };
    } else {
      statusCell.font = { color: { argb: 'FF22C55E' }, bold: true };
    }

    ['costPrice', 'sellingPrice', 'stockValue'].forEach(key => {
      row.getCell(key).numFmt = '$#,##0.00';
    });
    row.getCell('margin').numFmt = '0.00"%"';
  });

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [{ header: 'Metric', key: 'metric', width: 30 }, { header: 'Value', key: 'value', width: 20 }];

  const totalValue = products.reduce((s, p) => s + p.quantity * p.costPrice, 0);
  const totalRetail = products.reduce((s, p) => s + p.quantity * p.sellingPrice, 0);

  const summaryData = [
    ['Total Products', products.length],
    ['Total Cost Value', totalValue],
    ['Total Retail Value', totalRetail],
    ['Potential Gross Profit', totalRetail - totalValue],
    ['Low Stock Items', products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel).length],
    ['Out of Stock Items', products.filter(p => p.quantity === 0).length],
    ['Active Suppliers', [...new Set(products.map(p => p.supplier?.name).filter(Boolean))].length],
    ['Categories', [...new Set(products.map(p => p.category?.name))].length],
    ['Report Date', new Date().toLocaleDateString()],
  ];

  summarySheet.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
  });

  summaryData.forEach(([metric, value]) => {
    const row = summarySheet.addRow({ metric, value });
    if (typeof value === 'number' && metric.includes('Value') || metric.includes('Profit')) {
      row.getCell('value').numFmt = '$#,##0.00';
    }
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="inventra-inventory-${Date.now()}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});

exports.exportTransactionsPDF = catchAsync(async (req, res) => {
  const { startDate, endDate, type } = req.query;
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  if (type) filter.type = type;

  const transactions = await Transaction.find(filter)
    .populate('product', 'name sku')
    .populate('performedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="inventra-transactions-${Date.now()}.pdf"`);
  doc.pipe(res);

  doc.rect(0, 0, doc.page.width, 70).fill('#0f172a');
  doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('INVENTRA', 40, 22);
  doc.fontSize(10).font('Helvetica').text('Transaction Report', 40, 48);
  doc.text(`Generated: ${formatDate(new Date())} | Records: ${transactions.length}`, 40, 60);

  const headers = ['Date', 'Type', 'Product', 'SKU', 'Qty Before', 'Qty Change', 'Qty After', 'Unit Price', 'Total', 'Performed By'];
  const widths = [75, 65, 150, 70, 60, 60, 60, 70, 70, 90];
  const tableTop = 90;
  let x = 30;

  doc.rect(30, tableTop, 780, 20).fill('#1e293b');
  doc.fillColor('white').fontSize(7.5).font('Helvetica-Bold');
  headers.forEach((h, i) => { doc.text(h, x + 3, tableTop + 6, { width: widths[i] }); x += widths[i]; });

  let rowY = tableTop + 20;
  const typeColors = { purchase: '#22c55e', sale: '#3b82f6', adjustment: '#f59e0b', damaged: '#ef4444', expired: '#ef4444', return: '#a855f7', transfer: '#06b6d4' };

  transactions.forEach((t, idx) => {
    if (rowY > doc.page.height - 60) { doc.addPage({ layout: 'landscape' }); rowY = 40; }
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    doc.rect(30, rowY, 780, 16).fill(bg);

    const row = [
      formatDate(t.createdAt), '', t.product?.name || '-', t.product?.sku || '-',
      t.quantityBefore.toString(), t.quantity.toString(), t.quantityAfter.toString(),
      formatCurrency(t.unitPrice), formatCurrency(t.totalAmount), t.performedBy?.name || '-',
    ];

    x = 30;
    doc.fillColor('#1e293b').fontSize(7).font('Helvetica');
    row.forEach((val, i) => {
      if (i === 1) {
        doc.fillColor(typeColors[t.type] || '#6366f1').font('Helvetica-Bold').text(t.type.toUpperCase(), x + 3, rowY + 4, { width: widths[i] });
        doc.font('Helvetica').fillColor('#1e293b');
      } else {
        doc.text(val, x + 3, rowY + 4, { width: widths[i] - 4, ellipsis: true });
      }
      x += widths[i];
    });
    rowY += 16;
  });

  doc.end();
});
