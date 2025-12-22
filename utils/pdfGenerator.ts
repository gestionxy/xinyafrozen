
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Product, OrderItem, HistorySession } from '../types';

export const generatePDF = (orders: Record<string, OrderItem>, products: Product[], filename: string) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Xinya Frozen Logistics - Order Report", 15, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 30);
  doc.text(`Status: Current Draft Order`, 15, 35);

  const orderList = Object.values(orders).map(o => {
    const p = products.find(prod => prod.id === o.productId);
    return {
      company: p?.company_name || 'Unknown',
      product: p?.name || 'Unknown',
      stock: o.stock || '-',
      order: `${o.quantity} ${o.unit}${o.quantity > 1 ? 's' : ''}`
    };
  }).sort((a,b) => a.company.localeCompare(b.company) || a.product.localeCompare(b.product));

  const tableData = orderList.map(item => [item.company, item.product, item.stock, item.order]);

  (doc as any).autoTable({
    startY: 50,
    head: [['Company', 'Product Name', 'Stock Info', 'Order Quantity']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 50 }
  });

  doc.save(`${filename}.pdf`);
};

export const generateHistoryPDF = (session: HistorySession) => {
  const doc = new jsPDF();
  
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Xinya Logistics - Archived Order", 15, 20);
  
  doc.setFontSize(10);
  doc.text(`Cycle Timestamp: ${session.timestamp}`, 15, 30);
  doc.text(`Session ID: ${session.id}`, 15, 35);

  const tableData = session.orders.map(o => [
    o.companyName, 
    o.productName, 
    o.stock || '-', 
    `${o.quantity} ${o.unit}${o.quantity > 1 ? 's' : ''}`
  ]);

  (doc as any).autoTable({
    startY: 50,
    head: [['Company', 'Product Name', 'Stock Info', 'Order Quantity']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  });

  doc.save(`Order_Archive_${session.timestamp}.pdf`);
};
