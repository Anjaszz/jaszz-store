import React, { useRef } from 'react';
import { ShoppingBag, Package, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Order, Product } from '../../types';

interface ReceiptModalProps {
  order: Order & { product: Product };
  isOpen: boolean;
  onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, isOpen, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200], // Typical thermal receipt width
      });

      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Receipt-Jaszz-${order.id.slice(0, 8).toUpperCase()}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-gray-100 rounded-[2.5rem] overflow-hidden border-4 border-black shadow-[16px_16px_0px_0px_#000]"
          >
            {/* Modal Header */}
            <div className="p-6 bg-black text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-widest">E-Receipt</h3>
                <p className="text-[10px] font-bold text-gray-400">PROCESSED BY JASZZ CORE</p>
              </div>
              <button 
                onClick={handleDownload}
                className="bg-primary text-black px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Save PDF
              </button>
            </div>

            {/* Scrollable Container for Preview */}
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div 
                ref={receiptRef}
                className="bg-white p-8 shadow-sm relative overflow-hidden receipt-preview"
                style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}
              >
                {/* Decorative Elements for the Receipt Paper */}
                <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                
                {/* Brand Header */}
                <div className="text-center mb-8 pt-4">
                  <div className="w-16 h-16 bg-black rounded-2xl mx-auto flex items-center justify-center mb-3 rotate-3">
                    <ShoppingBag className="text-primary" size={32} />
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic">Jaszz Store</h2>
                  <p className="text-[9px] font-bold text-gray-400 tracking-[0.3em] uppercase">Premium Digital Goods</p>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center mb-8">
                  <div className={`px-6 py-2 rounded-full border-2 border-black flex items-center gap-2 ${
                    order.status === 'completed' ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      order.status === 'completed' ? 'bg-green-600' : 'bg-orange-600'
                    }`} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-6 mb-8">
                  <div className="flex justify-between items-start border-b border-dashed border-gray-200 pb-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Order ID</p>
                      <p className="text-xs font-black font-mono">#{order.id.slice(0, 12).toUpperCase()}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                      <p className="text-xs font-black">
                        {new Date(order.created_at).toLocaleDateString('id-ID', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 shadow-sm">
                        <Package size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Product</p>
                        <p className="text-sm font-black leading-tight">{order.product.name}</p>
                        <p className="text-[10px] font-bold text-gray-500">Qty: {order.quantity}</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 shadow-sm">
                        <User size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Customer ID</p>
                        <p className="text-sm font-black font-mono">{order.customer_details.target_id}</p>
                        {order.customer_details.server_id && (
                          <p className="text-[10px] font-bold text-gray-500">Server: {order.customer_details.server_id}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-gray-50 p-5 rounded-4xl border-2 border-black/5 space-y-3 mb-8">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-gray-500">Item Price</span>
                    <span className="text-black">Rp {order.subtotal?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-gray-500">Admin Fee</span>
                    <span>+Rp {order.admin_fee.toLocaleString('id-ID')}</span>
                  </div>
                  {order.tax_amount > 0 && (
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-gray-500">Tax</span>
                      <span>+Rp {order.tax_amount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t-2 border-black/5 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total</span>
                    <span className="text-xl font-black text-black">Rp {order.total_price.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Order Footer Message */}
                <div className="text-center relative py-4">
                  <div className="absolute inset-x-0 top-1/2 h-px bg-dashed-border opacity-20" />
                  <p className="relative z-10 bg-white px-4 inline-block text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">
                    Validated Transaction
                  </p>
                </div>

                {/* Zebra Lines Bottom Decoration */}
                <div className="mt-8 flex justify-center gap-1 opacity-10">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-1 h-3 bg-black rounded-full rotate-12" />
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Bottom Action */}
            <div className="p-8 border-t-2 border-black/5 bg-gray-50 flex justify-center">
              <button 
                onClick={onClose}
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
              >
                Close Preview
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReceiptModal;
