
import React, { useState, useEffect } from 'react';
import { HistorySession } from '../types';
import { db } from '../services/mockStorage';
import { FileDown, Calendar, ArrowRight, Package, Download } from 'lucide-react';
import { generateHistoryPDF } from '../utils/pdfGenerator';
import { generateHistoryExcel } from '../utils/excelGenerator';

const HistoryDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<HistorySession[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      const history = await db.getHistory();
      setSessions(history);
    };
    loadHistory();
  }, []);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-in fade-in">
        <Package size={64} strokeWidth={1} />
        <p className="mt-4 text-lg">No archived ordering cycles found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
        <Calendar className="text-blue-600" />
        Order Cycle History
      </h2>

      <div className="grid gap-4">
        {sessions.map(session => (
          <div
            key={session.id}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-300 transition-all group"
          >
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <FileDown size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{session.timestamp}</h3>
                <p className="text-sm text-gray-500">{session.orders.length} unique items ordered</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => generateHistoryExcel(session)}
                className="px-4 py-2 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-600 hover:text-white transition-all flex items-center gap-2"
              >
                <Download size={18} /> Excel
              </button>
              <button
                onClick={() => generateHistoryPDF(session)}
                className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
              >
                <FileDown size={18} /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryDashboard;
