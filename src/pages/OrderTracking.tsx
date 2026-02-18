import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, CheckCircle2, Clock, XCircle, ShoppingCart } from 'lucide-react';
import { OrderService } from '../services/api';
import type { Order, Product } from '../types';

import toast from 'react-hot-toast';

const OrderTracking: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<(Order & { product: Product })[]>([]);
  const [localOrders, setLocalOrders] = useState<(Order & { product: Product })[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchLocalHistory = async () => {
      const historyIds = JSON.parse(localStorage.getItem('order_history') || '[]');
      if (historyIds.length > 0) {
        try {
          // Fetch last 5 orders from history
          const promises = historyIds.slice(0, 5).map((id: string) => OrderService.getById(id));
          const results = await Promise.all(promises);
          setLocalOrders(results.filter(r => r !== null));
        } catch (err) {
          console.error('Failed to fetch local history:', err);
        }
      }
    };
    fetchLocalHistory();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    try {
      setLoading(true);
      const isEmail = q.includes('@');
      
      if (isEmail) {
        // Search by Email
        const data = await OrderService.getByEmail(q);
        setOrders(data);
      } else {
        // Search by Order ID (Smart Search)
        // 1. Check if it's a valid full UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(q)) {
          try {
            const data = await OrderService.getById(q);
            setOrders(data ? [data] : []);
          } catch (err) {
            setOrders([]);
          }
        } else if (q.length >= 4) {
          // 2. Smart Range Search for UUID Prefix (avoids operator error)
          // Pad query to create a valid UUID range
          const cleanQ = q.replace(/[^0-9a-f]/gi, '');
          if (cleanQ.length >= 4) {
            const pad = (char: string) => {
              let s = cleanQ + char.repeat(32 - cleanQ.length);
              return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
            };
            
            const startRange = pad('0');
            const endRange = pad('f');

            const { data, error } = await OrderService.supabase
              .from('orders')
              .select('*, product:products(*)')
              .gte('id', startRange)
              .lte('id', endRange)
              .limit(5);

            if (!error && data) {
              setOrders(data as any);
            } else {
              setOrders([]);
            }
          }
        } else {
          setOrders([]);
        }
      }
      setHasSearched(true);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast.error('Gagal mengambil data pesanan. Pastikan pencarian valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-container max-w-4xl pb-20">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black mb-4 uppercase tracking-tight">Cek Status Pesanan</h1>
        <p className="text-text-muted">Masukkan Email atau ID Pesanan Anda</p>
      </div>

      <div className="glass-card p-2 mb-12">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Email atau ID Pesanan (Order ID)..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-none focus:ring-0 outline-none transition-all font-medium"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary px-10 py-4 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            CARI PESANAN
          </button>
        </form>
      </div>

      {/* Local History Section */}
      {!hasSearched && localOrders.length > 0 && (
        <div className="space-y-6 mb-12">
          <h3 className="font-black text-sm uppercase tracking-widest text-text-muted px-2">Pesanan Terakhir Anda (Local)</h3>
          <div className="grid gap-4">
            {localOrders.map((order) => (
              <Link key={order.id} to={`/order/${order.id}`}>
                <OrderCard order={order} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasSearched && (
        <div className="space-y-6">
          <h3 className="font-black text-sm uppercase tracking-widest text-primary-dark px-2">Hasil Pencarian</h3>
          {orders.length > 0 ? (
            orders.map((order) => (
              <Link key={order.id} to={`/order/${order.id}`}>
                <OrderCard order={order} />
              </Link>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-text-muted">Tidak ditemukan pesanan untuk email ini.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OrderCard = ({ order }: { order: Order & { product: Product } }) => (
  <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary/50 transition-all group">
    <div className="flex items-center gap-6 flex-1 w-full">
      <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        <ShoppingCart className="text-primary-dark" size={32} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-black text-lg truncate uppercase tracking-tight">{order.product.name}</h3>
        <p className="text-sm text-text-muted font-mono bg-gray-50 px-2 py-0.5 rounded inline-block mt-1">ID: {order.customer_details.target_id}</p>
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">
          {new Date(order.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
        </p>
      </div>
    </div>

    <div className="flex flex-row md:flex-col items-center md:items-end gap-6 md:gap-2 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
      <div className="font-black text-xl text-primary-dark">
        Rp {order.total_price.toLocaleString('id-ID')}
      </div>
      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
        order.status === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
        order.status === 'processing' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
        order.status === 'completed' ? 'bg-green-50 text-green-600 border border-green-100' :
        'bg-red-50 text-red-600 border border-red-100'
      }`}>
        {order.status === 'pending' && <Clock size={12} />}
        {order.status === 'processing' && <Loader2 size={12} className="animate-spin" />}
        {order.status === 'completed' && <CheckCircle2 size={12} />}
        {order.status === 'canceled' && <XCircle size={12} />}
        {order.status}
      </span>
    </div>
  </div>
);

export default OrderTracking;
