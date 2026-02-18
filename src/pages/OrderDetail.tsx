import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, Loader2, Download, ChevronLeft, ShoppingBag, Copy, ExternalLink, Zap } from 'lucide-react';
import { OrderService, ProductService } from '../services/api';
import type { Order, Product } from '../types';
import { loadMidtransSnap } from '../lib/midtrans';
import toast from 'react-hot-toast';
import ReceiptModal from '../components/ui/ReceiptModal';

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<(Order & { product: Product }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const handleRevertStock = async (product: Product, quantity: number) => {
    try {
      await ProductService.update(product.id, { 
        stock: product.stock + (quantity || 1) 
      });
    } catch (err) {
      console.error('Failed to revert stock:', err);
    }
  };

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const data = await OrderService.getById(orderId);
      
      // Handle Expiration Logic
      if (data.status === 'pending' && data.payment_status === 'unpaid' && data.expires_at) {
        const expiryDate = new Date(data.expires_at).getTime();
        const now = new Date().getTime();
        
        if (now > expiryDate) {
          // Order has expired
          await OrderService.updateStatus(orderId, 'canceled');
          await handleRevertStock(data.product, data.quantity);
          // Refresh data
          const updated = await OrderService.getById(orderId);
          setOrder(updated);
          return;
        }
      }
      
      setOrder(data);
    } catch (err) {
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    if (!order || order.status !== 'pending' || !order.expires_at) {
      setTimeLeft('');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(order.expires_at!).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        clearInterval(timer);
        fetchOrder();
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order]);

  const handleContinuePayment = async () => {
    if (!order?.midtrans_token) {
      toast.error('Token pembayaran tidak ditemukan.');
      return;
    }

    try {
      const snap = await loadMidtransSnap() as any;
      snap.pay(order.midtrans_token, {
        onSuccess: () => fetchOrder(),
        onPending: () => fetchOrder(),
        onError: () => toast.error('Pembayaran gagal, silakan coba lagi.'),
        onClose: () => fetchOrder()
      });
    } catch (err) {
      console.error('Failed to load Midtrans:', err);
      toast.error('Gagal memuat sistem pembayaran.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('ID Pesanan disalin!');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-dark" size={48} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="section-container text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Pesanan Tidak Ditemukan</h1>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <ChevronLeft size={20} /> Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="section-container max-w-3xl pb-20">
      <div className="flex items-center justify-between mb-8">
        <Link to="/cek-pesanan" className="text-text-muted hover:text-primary-dark flex items-center gap-2 text-sm font-medium">
          <ChevronLeft size={18} /> Riwayat Pesanan
        </Link>
        <button 
          onClick={() => setIsReceiptOpen(true)} 
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl hover:bg-primary hover:text-black transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-black/10 active:scale-95"
        >
          <Download size={16} strokeWidth={3} /> Download Struk
        </button>
      </div>

      <div className="glass-card overflow-hidden shadow-2xl shadow-primary/5">
        {/* Header Struk */}
        <div className="bg-primary/10 p-6 md:p-8 border-b border-primary/20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
            <ShoppingBag size={120} />
          </div>
          
          <div className={`w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg ${
            order.status === 'completed' ? 'bg-green-500' : 
            order.status === 'canceled' ? 'bg-red-500' : 'bg-orange-500'
          }`}>
            {order.status === 'completed' ? <CheckCircle2 className="text-white" size={40} /> :
             order.status === 'canceled' ? <XCircle className="text-white" size={40} /> :
             <Clock className="text-white" size={40} />}
          </div>
          
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
            {order.status === 'pending' ? 'Menunggu Pembayaran' :
             order.status === 'processing' ? 'Pesanan Diproses' :
             order.status === 'completed' ? 'Pesanan Berhasil' : 'Pesanan Dibatalkan'}
          </h1>
          <p className="text-text-muted text-[10px] md:text-sm mt-1">Order ID: {order.id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Detail Ringkasan */}
        <div className="p-5 md:p-8 space-y-6 md:space-y-8">
          <div className="flex flex-row items-center justify-between p-4 bg-gray-50 rounded-2xl gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <ShoppingBag className="text-primary" size={20} />
              </div>
              <div>
                <p className="text-[8px] md:text-xs text-text-muted font-bold uppercase tracking-wider">Metode Pembayaran</p>
                <p className="text-xs md:text-base font-bold">E-Wallet / Transfer</p>
              </div>
            </div>
            <div className={`px-3 md:px-4 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shrink-0 ${
                order.payment_status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
            }`}>
                {order.payment_status}
            </div>
          </div>

           <div className="space-y-4">
            <h3 className="font-black text-[10px] md:text-sm uppercase tracking-widest text-text-muted border-b border-gray-100 pb-2">Informasi Pesanan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] md:text-xs text-text-muted block font-bold mb-1">Item</label>
                  <p className="font-bold text-base md:text-lg">{order.product.name}</p>
                </div>
                <div>
                  <label className="text-[10px] md:text-xs text-text-muted block font-bold mb-1">Target ID / No HP</label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono bg-primary/5 px-3 py-1 rounded-lg text-primary-dark font-bold text-sm md:text-base break-all">{order.customer_details.target_id}</p>
                    <button onClick={() => copyToClipboard(order.customer_details.target_id!)} className="p-1 hover:text-primary transition-colors shrink-0"><Copy size={14}/></button>
                  </div>
                </div>
                {order.customer_details.server_id && (
                  <div>
                    <label className="text-[10px] md:text-xs text-text-muted block font-bold mb-1">Server</label>
                    <p className="font-bold text-sm md:text-base">{order.customer_details.server_id}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4 md:text-right">
                <div>
                  <label className="text-[10px] md:text-xs text-text-muted block font-bold mb-1">Tanggal</label>
                  <p className="font-bold text-sm md:text-base">{new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
                </div>
                <div>
                  <label className="text-[10px] md:text-xs text-text-muted block font-bold mb-1">Email</label>
                  <p className="font-bold text-sm md:text-base truncate">{order.user_email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-dashed border-gray-200 space-y-3">
            <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted font-bold">Harga Produk (x{order.quantity})</span>
                <span className="font-bold text-black">Rp {order.subtotal?.toLocaleString('id-ID') || order.total_price.toLocaleString('id-ID')}</span>
            </div>
            {order.admin_fee > 0 && (
              <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted font-bold">Biaya Admin</span>
                  <span className="font-bold text-black">+Rp {order.admin_fee.toLocaleString('id-ID')}</span>
              </div>
            )}
            {order.tax_amount > 0 && (
              <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted font-bold">Pajak (Tax)</span>
                  <span className="font-bold text-black">+Rp {order.tax_amount.toLocaleString('id-ID')}</span>
              </div>
            )}
            {order.service_fee > 0 && (
              <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted font-bold">Biaya Layanan</span>
                  <span className="font-bold text-black">+Rp {order.service_fee.toLocaleString('id-ID')}</span>
              </div>
            )}
            
             <div className="flex justify-between items-center p-5 md:p-6 bg-primary/5 rounded-2xl border-2 border-primary/20 mt-4 shadow-sm">
                <span className="text-sm md:text-lg font-black uppercase tracking-widest leading-none">Total Bayar</span>
                <span className="text-xl md:text-2xl font-black text-primary-dark leading-none">Rp {order.total_price.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Delivery Data Section */}
          {order.status === 'completed' && (
            <div className="space-y-6">
              {order.product.requires_delivery_data || order.delivery_data ? (
                // CASE 1: Needs Data (Token, Account, etc)
                 <div className="bg-green-50 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-green-100 space-y-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shrink-0">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h4 className="font-black text-[10px] md:text-xs uppercase tracking-widest text-green-800">Data Terkirim</h4>
                            <p className="text-xs md:text-sm text-green-700 font-medium">Pesanan Anda telah berhasil dikirim!</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 md:p-5 rounded-2xl border border-green-200 shadow-sm relative group">
                        <pre className="font-mono text-base md:text-lg font-black text-center text-green-900 whitespace-pre-wrap break-all">
                            {order.delivery_data || 'Data sedang disiapkan...'}
                        </pre>
                        {order.delivery_data && (
                          <button 
                              onClick={() => {
                                  navigator.clipboard.writeText(order.delivery_data!);
                                  toast.success('Data berhasil disalin!');
                              }}
                              className="absolute top-2 right-2 p-2 hover:bg-gray-50 rounded-lg text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              <Copy size={16} />
                          </button>
                        )}
                    </div>
                    <p className="text-[8px] md:text-[10px] text-green-600 font-bold text-center uppercase tracking-widest">
                        PENTING: Jangan berikan data di atas kepada siapapun!
                    </p>
                </div>
              ) : (
                // CASE 2: Direct Top-up (Diamonds, etc)
                 <div className="bg-blue-50 p-6 md:p-8 rounded-3xl md:rounded-4xl border border-blue-100 space-y-4 md:space-y-6 text-center animate-in fade-in zoom-in-95">
                  <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-200">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <h4 className="text-lg md:text-xl font-black text-blue-900 uppercase tracking-tight">Top-Up Berhasil!</h4>
                    <p className="text-xs md:text-sm text-blue-700 font-medium leading-relaxed">
                      Layanan <strong>{order.product.name}</strong> telah berhasil ditambahkan ke akun Anda. 
                      Silakan cek aplikasi/game Anda sekarang.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-blue-200/50">
                    <p className="text-[8px] md:text-[10px] text-blue-500 font-black uppercase tracking-[0.2em] mb-4">Belum Masuk?</p>
                    <a 
                      href={`https://wa.me/628123456789?text=Halo%20Admin,%20pesanan%20saya%20dengan%20ID%20${order.id}%20statusnya%20sudah%20berhasil%20tapi%20produk%20belum%20masuk.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 md:px-8 py-3 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                      Customer Service <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

           {order.payment_status === 'paid' && order.status === 'canceled' && (
            <div className="bg-red-50 p-8 rounded-4xl border border-red-100 space-y-6 text-center animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg shadow-red-200">
                    <XCircle size={40} />
                </div>
                <div className="space-y-3">
                    <h4 className="text-xl font-black text-red-900 uppercase tracking-tight">Pesanan Dibatalkan</h4>
                    <p className="text-sm text-red-700 font-medium leading-relaxed">
                        Mohon maaf, pesanan Anda tidak dapat diproses oleh admin. Karena Anda sudah melakukan pembayaran, silakan hubungi admin untuk proses pengembalian dana (refund).
                    </p>
                </div>
                <div className="pt-4 border-t border-red-200/50">
                    <a 
                    href={`https://wa.me/6282258040148?text=Halo%20Admin,%20saya%20ingin%20mengajukan%20refund%20untuk%20pesanan%20dengan%20ID%20${order.id.toUpperCase()}%20sebesar%20Rp%20${order.total_price.toLocaleString('id-ID')}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200"
                    >
                    Hubungi Admin untuk Refund <ExternalLink size={16} />
                    </a>
                </div>
            </div>
          )}

           {order.payment_status === 'unpaid' && order.status === 'pending' && (
            <div className="bg-orange-50 p-5 md:p-6 rounded-2xl border border-orange-100 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-4">
                        <Clock className="text-orange-500 shrink-0" />
                        <div className="text-center sm:text-left">
                            <h4 className="font-bold text-orange-900 text-sm md:text-base">Pembayaran Belum Selesai</h4>
                            <p className="text-xs md:text-sm text-orange-700">Selesaikan pembayaran agar pesanan segera diproses.</p>
                        </div>
                    </div>
                    {timeLeft && (
                        <div className="bg-black text-primary px-4 py-2 rounded-xl font-black font-mono text-lg md:text-xl shadow-lg animate-pulse">
                            {timeLeft}
                        </div>
                    )}
                </div>
                <button 
                  onClick={handleContinuePayment}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2 shadow-xl shadow-primary/20 text-xs md:text-sm"
                >
                    Lanjutkan Pembayaran <ExternalLink size={18} />
                </button>
            </div>
          )}
        </div>

        {/* Footer Struk */}
        <div className="p-8 bg-gray-50 text-center border-t border-gray-100">
          <p className="text-xs text-text-muted leading-relaxed">
            Terima kasih telah berbelanja di <strong>Jaszz Store</strong>.<br />
            Simpan struk ini sebagai bukti transaksi yang sah.
          </p>
        </div>
      </div>

      <ReceiptModal 
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={order}
      />
    </div>
  );
};

export default OrderDetail;
