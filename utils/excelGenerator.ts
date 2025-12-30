import * as XLSX from 'xlsx';
import { HistorySession } from '../types';

export const generateHistoryExcel = (session: HistorySession) => {
    try {
        // Sort orders: Company Name -> Product Name
        const sortedOrders = [...session.orders].sort((a, b) => {
            const companyA = a.companyName || '';
            const companyB = b.companyName || '';
            if (companyA !== companyB) return companyA.localeCompare(companyB);

            const productA = a.productName || '';
            const productB = b.productName || '';
            return productA.localeCompare(productB);
        });

        // Map to Excel format
        // Columns: No., Product Name, Company, Quantity, Stock Info, Image URL (optional, text only)
        const data = sortedOrders.map((o, index) => ({
            'No.': index + 1,
            'Product Name': o.productName,
            'Company': o.companyName,
            'Quantity': `${o.quantity} ${o.unit}`,
            'Stock Info': o.stock || '-',
            // 'Image URL': o.imageUrl || '-' // Optional: include if needed, but user asked for "everything except images" which implies summary data
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Order Details");

        // Sanitize filename
        const safeTimestamp = session.timestamp.replace(/[:/]/g, '-').replace(/,\s/g, '_');
        XLSX.writeFile(wb, `Order_History_${safeTimestamp}.xlsx`);
    } catch (error) {
        console.error("Excel generation failed:", error);
        alert("Failed to generate Excel file.");
    }
};
