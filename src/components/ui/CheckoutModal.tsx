import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Info, Loader2, ShieldCheck, ShoppingCart } from 'lucide-react';
import { OrderService, ProductService, SettingsService } from '../../services/api';
import type { Product, Category, FeeSettings } from '../../types';
import { loadMidtransSnap } from '../../lib/midtrans';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  category: Category | null;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, product, category }) => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [feeSettings, setFeeSettings] = useState<FeeSettings | null>(null);

  useEffect(() => {
    if (isOpen) {
      SettingsService.getFeeSettings().then(setFeeSettings).catch(console.error);
    }
  }, [isOpen]);

  if (!product || !category) return null;

  const checkoutFields = product.checkout_config?.fields || ['user_id'];
  
  const basePrice = product.price * quantity;
  const adminFee = Math.round((basePrice * (feeSettings?.admin_fee_percent || 0)) / 100);
  const serviceFee = Math.round((basePrice * (feeSettings?.service_fee_percent || 0)) / 100);
  const taxAmount = Math.round((basePrice * (feeSettings?.tax_percent || 0)) / 100);
  const totalPrice = basePrice + adminFee + serviceFee + taxAmount;

  const handleCheckout = async () => {
    const missingFields = checkoutFields.some(f => !formValues[f]?.trim());
    if (missingFields) {
      toast.error('Mohon lengkapi semua data pesanan yang dibutuhkan');
      return;
    }

    const contactEmail = formValues['email'] || 'no-reply@jaszz-store.com';

    try {
      setProcessing(true);
      const expiresAt = new Date(Date.now() + 30 * 60000).toISOString();

      const newOrder = await OrderService.create({
        product_id: product.id,
        user_email: contactEmail,
        total_price: totalPrice,
        subtotal: basePrice,
        admin_fee: adminFee,
        service_fee: serviceFee,
        tax_amount: taxAmount,
        quantity: quantity,
        customer_details: {
          target_id: formValues['user_id'] || formValues['phone'] || formValues['email'] || formValues['custom'] || 'N/A',
          server_id: formValues['server_id'] || undefined,
          phone: formValues['phone'] || formValues['user_id'] || ''
        },
        status: 'pending',
        payment_status: 'unpaid',
        expires_at: expiresAt
      });

      // Stock is now handled via database trigger (decrement_stock_on_order)
      // to avoid RLS issues for non-authenticated users

      // Construct item details for Midtrans including fees
      const itemDetails = [
        {
          id: product.id,
          price: product.price,
          quantity: quantity,
          name: product.name
        }
      ];

      // Add fees as separate items if they exist
      if (adminFee > 0) {
        itemDetails.push({
          id: 'admin_fee',
          price: adminFee,
          quantity: 1,
          name: `Biaya Admin (${feeSettings?.admin_fee_percent}%)`
        });
      }

      if (serviceFee > 0) {
        itemDetails.push({
          id: 'service_fee',
          price: serviceFee,
          quantity: 1,
          name: `Biaya Layanan (${feeSettings?.service_fee_percent}%)`
        });
      }

      if (taxAmount > 0) {
        itemDetails.push({
          id: 'tax',
          price: taxAmount,
          quantity: 1,
          name: `Pajak (Tax ${feeSettings?.tax_percent}%)`
        });
      }

      const { data: session, error: sessionError } = await supabase.functions.invoke('create-payment', {
        body: {
          orderId: newOrder.id,
          amount: newOrder.total_price,
          customerDetails: {
            email: contactEmail,
            name: contactEmail.split('@')[0],
            phone: formValues['phone'] || formValues['user_id'] || ''
          },
          itemDetails: itemDetails
        }
      });

      if (sessionError || !session?.token) {
        await ProductService.update(product.id, { 
          stock: product.stock 
        });
        throw new Error(sessionError?.message || 'Failed to get payment token');
      }

      await OrderService.supabase
        .from('orders')
        .update({ midtrans_token: session.token })
        .eq('id', newOrder.id);

      const snap = await loadMidtransSnap() as any;
      onClose();

      snap.pay(session.token, {
        onSuccess: () => navigate(`/order/${newOrder.id}`),
        onPending: () => navigate(`/order/${newOrder.id}`),
        onError: () => toast.error('Pembayaran gagal, silakan coba lagi.'),
        onClose: () => navigate(`/order/${newOrder.id}`)
      });

    } catch (err) {
      console.error('Checkout failed:', err);
      toast.error('Gagal memproses pesanan. Silakan coba lagi.');
    } finally {
      setProcessing(false);
    }
  };

  const fieldLabels: Record<string, { label: string, placeholder: string }> = {
    user_id: { label: 'User / Account ID', placeholder: 'Masukkan ID akun' },
    server_id: { label: 'Server ID / Zone', placeholder: 'Pilih / Masukkan Server' },
    email: { label: 'Alamat Email', placeholder: 'user@example.com' },
    phone: { label: 'Nomor WhatsApp / HP', placeholder: 'Contoh: 0812xxxx' },
    custom: { label: product.checkout_config?.custom_label || 'Data Tambahan', placeholder: 'Masukkan data' }
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
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 40 }}
            className="relative w-full max-w-xl bg-white rounded-3xl md:rounded-4xl border-[3px] border-black shadow-[10px_10px_0px_0px_#000] md:shadow-[20px_20px_0px_0px_#000] flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden m-2"
          >
            {/* Header */}
            <div className="bg-black py-4 md:py-6 px-6 md:px-10 flex items-center justify-between border-b-[3px] border-black shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-primary p-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000]">
                  <Zap size={22} className="text-black" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg uppercase tracking-[0.3em] leading-none">CHECKOUT</h3>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1.5 opacity-80">Final Step to Purchase</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-10 custom-scrollbar">
                {/* Product Info Compact */}
                <div className="flex flex-row items-center gap-4 md:gap-6 p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="w-14 h-14 md:w-20 md:h-20 bg-white border-2 border-black rounded-xl md:rounded-2xl overflow-hidden shrink-0 shadow-lg font-black text-xl md:text-2xl flex items-center justify-center">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : product.name.charAt(0)}
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-primary-dark">{category.name}</div>
                        <h4 className="text-base md:text-lg font-black uppercase text-black line-clamp-1">{product.name}</h4>
                        <div className="text-xs md:text-sm font-bold text-text-muted mt-0.5 md:mt-1">@ Rp {product.price.toLocaleString('id-ID')}</div>
                    </div>
                </div>

                {/* Form Fields & Quantity */}
                <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-8">
                        {checkoutFields.map((field) => (
                           <div key={field} className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                                    <Info size={14} className="text-primary" />
                                    {fieldLabels[field]?.label || field}
                                </label>
                                <input 
                                    type={field === 'email' ? 'email' : 'text'}
                                    value={formValues[field] || ''}
                                    onChange={(e) => setFormValues(prev => ({ ...prev, [field]: e.target.value }))}
                                    placeholder={fieldLabels[field]?.placeholder}
                                    className="w-full px-5 md:px-6 py-3 md:py-4 bg-gray-50 border-2 border-black rounded-xl md:rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm md:text-base"
                                />
                           </div>
                        ))}
                        
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                                <ShoppingCart size={14} className="text-primary" />
                                Jumlah Pembelian
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="flex bg-gray-50 border-2 border-black rounded-xl md:rounded-2xl overflow-hidden p-1">
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-black text-lg hover:bg-red-50 text-red-500 transition-colors">-</button>
                                    <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-12 md:w-16 h-10 md:h-12 text-center bg-transparent font-black text-base md:text-lg outline-none" />
                                    <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-black text-lg hover:bg-green-50 text-green-500 transition-colors">+</button>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">Stock: <span className="text-black">{product.stock}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-6 md:p-8 border-2 border-black space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
                            <span>Subtotal ({quantity}x)</span>
                            <span className="text-black">Rp {basePrice.toLocaleString('id-ID')}</span>
                        </div>
                        {(adminFee > 0 || serviceFee > 0 || taxAmount > 0) && (
                            <div className="space-y-3 pt-4 border-t-2 border-dashed border-gray-200">
                                {adminFee > 0 && (
                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-text-muted/70">
                                        <span>Biaya Admin ({feeSettings?.admin_fee_percent}%)</span>
                                        <span className="text-black">+Rp {adminFee.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                {serviceFee > 0 && (
                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-text-muted/70">
                                        <span>Biaya Layanan ({feeSettings?.service_fee_percent}%)</span>
                                        <span className="text-black">+Rp {serviceFee.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                {taxAmount > 0 && (
                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-text-muted/70">
                                        <span>Pajak (Tax {feeSettings?.tax_percent}%)</span>
                                        <span className="text-black">+Rp {taxAmount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-4 border-t-[3px] border-black">
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Total Bayar</span>
                            <span className="text-xl md:text-2xl font-black text-black">Rp {totalPrice.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleCheckout}
                        disabled={processing || quantity > product.stock}
                        className={`w-full py-5 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase tracking-[0.2em] text-xs md:text-sm flex items-center justify-center gap-3 transition-all ${
                            processing || quantity > product.stock
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-gray-300' 
                            : 'bg-primary text-black border-4 border-black shadow-[8px_8px_0px_0px_#000] md:shadow-[12px_12px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1'
                        }`}
                    >
                        {processing ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <>PROSES PEMBAYARAN <ShieldCheck size={20} /></>
                        )}
                    </button>
                    
                    <p className="text-center text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">
                        Pembayaran Aman via Secure Gateway
                    </p>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CheckoutModal;
