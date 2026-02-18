import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  Plus, 
  CheckCircle2,
  Clock,
  Loader2,
  Check,
  X,
  Layers,
  Trash2,
  Edit,
  Power,
  Zap
} from 'lucide-react';
import type { Order, Product, Category, FeeSettings } from '../types';
import { ProductService, OrderService, CategoryService, SettingsService } from '../services/api';
import ProductModal from '../components/ui/ProductModal';
import CategoryModal from '../components/ui/CategoryModal';
import ConfirmModal from '../components/ui/ConfirmModal';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'categories' | 'settings'>('overview');
  const [feeSettings, setFeeSettings] = useState<FeeSettings | null>(null);
  const [orders, setOrders] = useState<(Order & { product?: Product })[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Confirm Modal State
  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersData, productsData, categoriesData, feeData] = await Promise.all([
        OrderService.getAllAdmin(),
        ProductService.getAll(),
        CategoryService.getAll(),
        SettingsService.getFeeSettings()
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      setCategories(categoriesData);
      setFeeSettings(feeData);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      toast.error('Gagal mengambil data dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-dark" size={48} />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50/50">
      <ConfirmModal 
        isOpen={confirmData.isOpen}
        title={confirmData.title}
        message={confirmData.message}
        onConfirm={confirmData.onConfirm}
        onClose={() => setConfirmData(prev => ({ ...prev, isOpen: false }))}
        type={confirmData.type}
      />
      
      <AnimatePresence>
        {(showProductModal || editingProduct) && (
          <ProductModal 
            product={editingProduct}
            onClose={() => {
                setShowProductModal(false);
                setEditingProduct(undefined);
            }}
            onSave={() => {
              setShowProductModal(false);
              setEditingProduct(undefined);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showCategoryModal || editingCategory) && (
          <CategoryModal 
            category={editingCategory}
            onClose={() => {
              setShowCategoryModal(false);
              setEditingCategory(undefined);
            }}
            onSave={() => {
              setShowCategoryModal(false);
              setEditingCategory(undefined);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:block">
        <div className="p-6 space-y-2 sticky top-0">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-primary text-black font-bold' : 'text-text-muted hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={20} />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-primary text-black font-bold' : 'text-text-muted hover:bg-gray-50'}`}
          >
            <ShoppingCart size={20} />
            Pesanan
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'products' ? 'bg-primary text-black font-bold' : 'text-text-muted hover:bg-gray-50'}`}
          >
            <Package size={20} />
            Produk
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'categories' ? 'bg-primary text-black font-bold' : 'text-text-muted hover:bg-gray-50'}`}
          >
            <Layers size={20} />
            Katalog
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-primary text-black font-bold' : 'text-text-muted hover:bg-gray-50'}`}
          >
            <Settings size={20} />
            Pengaturan
          </button>
          
          <div className="pt-4 mt-4 border-t border-gray-50">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium italic">
              <Power size={20} />
              Keluar Panel
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'overview' && <OverviewView orders={orders} products={products} />}
        {activeTab === 'orders' && <OrdersView orders={orders} refetch={fetchData} setConfirmData={setConfirmData} />}
        {activeTab === 'products' && (
          <ProductsView 
            products={products} 
            onAdd={() => setShowProductModal(true)} 
            onEdit={setEditingProduct} 
            refetch={fetchData} 
            setConfirmData={setConfirmData}
          />
        )}
        {activeTab === 'categories' && (
          <CategoriesView 
            categories={categories} 
            onAdd={() => setShowCategoryModal(true)} 
            onEdit={setEditingCategory}
            refetch={fetchData} 
            setConfirmData={setConfirmData}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsView 
            feeSettings={feeSettings} 
            onUpdate={setFeeSettings} 
          />
        )}
      </main>
    </div>
  );
};

const SettingsView = ({ feeSettings, onUpdate }: { feeSettings: FeeSettings | null, onUpdate: (settings: FeeSettings) => void }) => {
  const [formData, setFormData] = useState<FeeSettings>({
    admin_fee_percent: 0,
    service_fee_percent: 0,
    tax_percent: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (feeSettings) {
      setFormData(feeSettings);
    }
  }, [feeSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await SettingsService.updateFeeSettings(formData);
      onUpdate(formData);
      toast.success('Pengaturan biaya berhasil diperbarui');
    } catch (err) {
      toast.error('Gagal memperbarui pengaturan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Pengaturan Toko</h1>
        <p className="text-text-muted text-sm font-medium">Atur biaya tambahan dan pajak dalam bentuk persentase (%).</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border-4 border-black p-12 shadow-[12px_12px_0px_0px_#000]">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Biaya Admin (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1"
                  value={formData.admin_fee_percent}
                  onChange={e => setFormData({...formData, admin_fee_percent: Number(e.target.value)})}
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-black rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-black text-right pr-14"
                />
                <div className="absolute inset-y-0 right-6 flex items-center text-gray-400 font-bold">%</div>
              </div>
              <p className="text-[10px] text-text-muted font-medium">Contoh: 1.5% dari harga produk.</p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Pajak / Tax (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1"
                  value={formData.tax_percent}
                  onChange={e => setFormData({...formData, tax_percent: Number(e.target.value)})}
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-black rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-black text-right pr-14"
                />
                <div className="absolute inset-y-0 right-6 flex items-center text-gray-400 font-bold">%</div>
              </div>
              <p className="text-[10px] text-text-muted font-medium">Persentase pajak standar.</p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Biaya Layanan (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1"
                  value={formData.service_fee_percent}
                  onChange={e => setFormData({...formData, service_fee_percent: Number(e.target.value)})}
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-black rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-black text-right pr-14"
                />
                <div className="absolute inset-y-0 right-6 flex items-center text-gray-400 font-bold">%</div>
              </div>
              <p className="text-[10px] text-text-muted font-medium">Biaya tambahan pelengkap.</p>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full md:w-auto px-12 py-5 bg-primary border-4 border-black font-black uppercase tracking-widest text-xs shadow-[8px_8px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              SIMPAN PENGATURAN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Sub Components ---

const CategoriesView = ({ categories, onAdd, onEdit, refetch, setConfirmData }: { 
  categories: Category[], 
  onAdd: () => void, 
  onEdit: (cat: Category) => void,
  refetch: () => void,
  setConfirmData: any
}) => {
    const handleDelete = (id: string) => {
      setConfirmData({
        isOpen: true,
        title: 'Hapus Katalog?',
        message: 'Hapus katalog ini? Semua produk di dalamnya juga akan terhapus secara permanen.',
        type: 'danger',
        onConfirm: async () => {
          try {
            await CategoryService.delete(id);
            toast.success('Katalog berhasil dihapus');
            refetch();
          } catch (err: any) {
            if (err.code === '23503') {
              toast.error('Gagal hapus: Katalog masih memiliki produk. Hapus semua produk di dalamnya dulu atau nonaktifkan saja.');
            } else {
              toast.error('Gagal menghapus katalog');
            }
          }
        }
      });
    };
  
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Manajemen Katalog</h1>
            <p className="text-text-muted text-sm font-medium">Tambah atau edit kategori layanan (MLBB, Pulsa, dll).</p>
          </div>
          <button onClick={onAdd} className="btn-primary flex items-center gap-2 px-6">
            <Plus size={20} />
            TAMBAH KATALOG
          </button>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:border-primary transition-all group relative overflow-hidden">
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <Layers className="text-gray-300" size={24} />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight">{cat.name}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted px-2 py-0.5 bg-gray-50 rounded-full w-fit mt-1">
                    /{cat.slug}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-50 relative z-10">
                <span className="text-xs font-bold text-text-muted">Order: {cat.display_order}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEdit(cat)}
                    className="p-2 text-text-muted hover:text-primary transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 text-text-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

const OverviewView = ({ orders, products }: { orders: any[], products: any[] }) => {
  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total_price), 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2 uppercase tracking-tighter">Admin Dashboard</h1>
          <p className="text-text-muted text-sm font-medium">Monitoring performa Jaszz Store hari ini.</p>
        </div>
        <div className="text-xs font-black uppercase tracking-widest bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Pendapatan" value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} icon={<ShoppingCart className="text-blue-500" />} change="+12.5%" />
        <StatCard title="Pesanan Sukses" value={orders.filter(o => o.status === 'completed').length.toString()} icon={<CheckCircle2 className="text-green-500" />} change="+5.2%" />
        <StatCard title="Produk Aktif" value={products.filter(p => p.is_available).length.toString()} icon={<Package className="text-purple-500" />} change="0%" />
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase tracking-tight">Pesanan Baru (Pending)</h3>
        </div>
        <div className="space-y-6">
          {orders.filter(o => o.status === 'processing').slice(0, 5).map((order) => (
            <div key={order.id} className="flex items-center justify-between py-5 px-6 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <ShoppingCart size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="font-black text-sm uppercase tracking-tight">#{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-text-muted font-bold">{order.product?.name || 'Produk'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-black">Rp {order.total_price.toLocaleString('id-ID')}</p>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">{new Date(order.created_at).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          {orders.filter(o => o.status === 'processing').length === 0 && (
            <div className="text-center py-20">
                <Clock className="mx-auto text-gray-200 mb-4" size={48} />
                <p className="text-text-muted font-bold text-sm">Tidak ada pesanan baru yang perlu diproses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OrdersView = ({ orders, refetch, setConfirmData }: { 
  orders: any[], 
  refetch: () => void,
  setConfirmData: any
}) => {
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'completed' | 'canceled'>('all');
  const [completingOrder, setCompletingOrder] = useState<any>(null);
  const [deliveryDataList, setDeliveryDataList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize delivery data list when completing an order
  useEffect(() => {
    if (completingOrder) {
      setDeliveryDataList(new Array(completingOrder.quantity || 1).fill(''));
    } else {
      setDeliveryDataList([]);
    }
  }, [completingOrder]);

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'unpaid') return o.payment_status === 'unpaid' && o.status !== 'canceled';
    if (filter === 'paid') return o.payment_status === 'paid' && o.status === 'processing';
    if (filter === 'completed') return o.status === 'completed';
    if (filter === 'canceled') return o.status === 'canceled';
    return true;
  });

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingOrder) return;
    
    // Combine multiple inputs into one string
    const finalData = deliveryDataList.filter(d => d.trim()).join('\n');

    try {
      setLoading(true);
      await OrderService.completeOrder(completingOrder.id, finalData);
      toast.success('Pesanan berhasil diselesaikan');
      setCompletingOrder(null);
      refetch();
    } catch (err) {
      toast.error('Gagal menyelesaikan pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (id: string) => {
    setConfirmData({
      isOpen: true,
      title: 'Batalkan Pesanan?',
      message: 'Apakah Anda yakin ingin membatalkan pesanan ini? Pembeli akan melihat status pesanan sebagai "Canceled".',
      type: 'danger',
      onConfirm: async () => {
        try {
          await OrderService.updateStatus(id, 'canceled');
          toast.success('Pesanan berhasil dibatalkan');
          refetch();
        } catch (err) {
          toast.error('Gagal membatalkan pesanan');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-black uppercase tracking-tight">Daftar Pesanan</h1>
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto max-w-full">
          {(['all', 'unpaid', 'paid', 'completed', 'canceled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === f ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-gray-50'
              }`}
            >
              {f === 'paid' ? 'Pesanan Masuk' : f === 'unpaid' ? 'Belum Bayar' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
            <tr>
              <th className="px-8 py-6">Order ID</th>
              <th className="px-8 py-6">Item & Target</th>
              <th className="px-8 py-6">Total Harga</th>
              <th className="px-8 py-6">Status Bayar</th>
              <th className="px-8 py-6">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5 font-mono text-xs font-bold">#{order.id.slice(0, 8)}</td>
                <td className="px-8 py-5">
                  <div className="font-black text-sm uppercase tracking-tight">{order.product?.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Target: {order.customer_details?.target_id}</span>
                    <span className="bg-primary/10 text-primary-dark text-[8px] font-black px-2 py-0.5 rounded leading-none">QTY: {order.quantity || 1}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm font-black">Rp {order.total_price.toLocaleString('id-ID')}</td>
                <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${order.payment_status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        {order.payment_status}
                    </span>
                </td>
                <td className="px-8 py-5 text-right">
                  {order.status === 'processing' ? (
                    <div className="flex gap-2">
                      <button onClick={() => setCompletingOrder(order)} className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-200"><Check size={18} /></button>
                      <button onClick={() => handleCancel(order.id)} className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200"><X size={18} /></button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted px-3 py-1 bg-gray-100 rounded-full">{order.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {completingOrder && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCompletingOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl p-10 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar border-4 border-black"
            >
              <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Selesaikan Pesanan</h2>
                  <div className="flex items-center gap-2 mt-2">
                      <span className="bg-primary text-black text-[10px] font-black px-2 py-1 rounded">JUMLAH: {completingOrder.quantity || 1} ITEM</span>
                      <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest leading-none">
                      {completingOrder.product?.requires_delivery_data 
                          ? 'Harap lengkapi data pengiriman'
                          : 'Produk akan segera terkirim'}
                      </p>
                  </div>
              </div>
              
              {(completingOrder.product?.requires_delivery_data || completingOrder.product?.id === undefined) && (
                <div className="space-y-6">
                  <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Masukkan Data Pengiriman ({completingOrder.quantity} item):</p>
                      <div className="grid grid-cols-1 gap-4">
                          {deliveryDataList.map((data, index) => (
                              <div key={index} className="flex gap-4">
                                  <div className="w-10 h-14 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center font-black text-xs text-text-muted shrink-0">
                                      {index + 1}
                                  </div>
                                  <input 
                                      type="text"
                                      value={data}
                                      onChange={(e) => {
                                          const newList = [...deliveryDataList];
                                          newList[index] = e.target.value;
                                          setDeliveryDataList(newList);
                                      }}
                                      className="flex-1 px-6 py-4 rounded-2xl border border-gray-100 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm bg-white"
                                      placeholder={`Masukkan data item ke-${index+1} (Account/Voucher)`}
                                  />
                              </div>
                          ))}
                      </div>
                  </div>
                </div>
              )}

              {!completingOrder.product?.requires_delivery_data && (
                <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-[0.2em] text-center leading-relaxed">
                  <Zap className="mx-auto mb-3 text-blue-500" size={24} />
                  Konfirmasi ini akan mengirimkan status<br/>"Selesai" kepada pelanggan.
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-gray-50">
                <button 
                  type="button"
                  onClick={() => setCompletingOrder(null)}
                  className="flex-1 py-4 font-black uppercase tracking-widest text-xs text-text-muted hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 btn-primary py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  KIRIM DATA & SELESAI
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductsView = ({ products, onAdd, onEdit, refetch, setConfirmData }: { 
  products: any[], 
  onAdd: () => void, 
  onEdit: (p: any) => void, 
  refetch: () => void,
  setConfirmData: any
}) => {
    const handleDelete = (id: string) => {
        setConfirmData({
          isOpen: true,
          title: 'Hapus Produk?',
          message: 'Apakah Anda yakin ingin menghapus produk ini secara permanen? Tindakan ini tidak dapat dibatalkan.',
          type: 'danger',
          onConfirm: async () => {
            try {
              await ProductService.delete(id);
              toast.success('Produk berhasil dihapus');
              refetch();
            } catch (err: any) {
              if (err.code === '23503') {
                toast.error('Gagal hapus: Produk sudah pernah dibeli. Silakan nonaktifkan saja untuk menyembunyikannya.');
              } else {
                toast.error('Gagal menghapus produk');
              }
            }
          }
        });
    };

    const toggleAvailability = async (product: Product) => {
        try {
            await ProductService.update(product.id, { is_available: !product.is_available });
            toast.success(`Produk ${product.is_available ? 'dinonaktifkan' : 'diaktifkan'}`);
            refetch();
        } catch (err) {
            toast.error('Gagal mengubah status produk');
        }
    };

    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Katalog Produk</h1>
          <p className="text-text-muted text-sm font-medium">Atur harga, stok, dan sistem delivery produk.</p>
        </div>
        <button onClick={onAdd} className="btn-primary flex items-center gap-2 px-8 py-3.5 shadow-xl shadow-primary/20">
          <Plus size={20} />
          TAMBAH PRODUK
        </button>
      </div>
  
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm group hover:border-primary/50 transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors overflow-hidden relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={28} className="text-gray-300" />
                )}
                {!product.is_available && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <Power size={20} className="text-red-600" />
                    </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${product.is_available ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {product.is_available ? 'Aktif' : 'Nonaktif'}
                  </span>
                  {product.is_auto_delivery && (
                      <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-700 flex items-center gap-1">
                          <Zap size={8} fill="currentColor" /> S3 Instant
                      </span>
                   )}
              </div>
            </div>
            
            <div className="space-y-1 mb-6">
                <h3 className="font-black text-sm uppercase tracking-tight line-clamp-1">{product.name}</h3>
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Katalog: {product.category}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${product.stock <= 0 ? 'text-red-500' : 'text-primary-dark'}`}>
                        Stok: {product.stock}
                    </p>
                </div>
            </div>

            <div className="h-px bg-gray-50 mb-6" />

            <div className="flex items-center justify-between">
              <span className="font-black text-lg text-black">Rp {product.price.toLocaleString('id-ID')}</span>
              <div className="flex gap-1">
                  <button 
                    onClick={() => toggleAvailability(product)}
                    className={`p-2 rounded-xl transition-all ${product.is_available ? 'text-text-muted hover:text-red-500' : 'text-red-500 hover:text-green-500'}`}
                    title={product.is_available ? "Nonaktifkan" : "Aktifkan"}
                  >
                      <Power size={18} />
                  </button>
                  <button 
                    onClick={() => onEdit(product)}
                    className="p-2 text-text-muted hover:text-primary-dark transition-all rounded-xl hover:bg-gray-50"
                  >
                      <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-text-muted hover:text-red-500 transition-all rounded-xl hover:bg-gray-50"
                  >
                      <Trash2 size={18} />
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, change }: { title: string, value: string, icon: React.ReactNode, change: string }) => (
  <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-8 opacity-5 translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform">
      {icon}
    </div>
    <div className="flex justify-between items-start mb-8">
      <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center shadow-inner group-hover:bg-primary/10 transition-colors">
        {icon}
      </div>
      <div className="flex flex-col items-end">
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${change.startsWith('+') ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
            {change}
        </span>
      </div>
    </div>
    <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
    <h4 className="text-3xl font-black text-black">{value}</h4>
  </div>
);

export default AdminDashboard;
