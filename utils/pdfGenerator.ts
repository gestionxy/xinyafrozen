
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, OrderItem, HistorySession } from '../types';

// Extend jsPDF type to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => void;
}

export const generatePDF = (orders: Record<string, OrderItem>, products: Product[], filename: string) => {
  try {
    const doc = new jsPDF() as jsPDFWithAutoTable;

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
        image: p?.image_url || null,
        stock: o.stock || '-',
        order: `${o.quantity} ${o.unit}${o.quantity > 1 ? 's' : ''}`
      };
    }).sort((a, b) => a.company.localeCompare(b.company) || a.product.localeCompare(b.product));

    const tableData = orderList.map(item => [
      '', // Image placeholder
      item.product,
      item.company,
      item.stock,
      item.order
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Image', 'Product Name', 'Company', 'Stock Info', 'Order Qty']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 25, minCellHeight: 25, valign: 'middle' }, // Image column
        1: { valign: 'middle' },
        2: { valign: 'middle' },
        3: { valign: 'middle', halign: 'center' },
        4: { valign: 'middle', halign: 'center', fontStyle: 'bold', textColor: [220, 38, 38] } // Red for quantity
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 0) {
          const item = orderList[data.row.index];
          if (item.image) {
            try {
              doc.addImage(item.image, 'JPEG', data.cell.x + 2, data.cell.y + 2, 20, 20);
            } catch (e) {
              // Fallback if image fails
            }
          }
        }
      }
    });

    doc.save(`${filename}.pdf`);
  } catch (err) {
    console.error("PDF Generation failed:", err);
    alert("Failed to generate PDF. Please try again.");
  }
};

}
