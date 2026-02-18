import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Upload, Image as ImageIcon, Zap, Package, Layers, Info, Check, ShieldCheck, ShoppingCart } from 'lucide-react';
import type { Product, Category } from '../../types';
import { ProductService, StorageService, CategoryService } from '../../services/api';
import toast from 'react-hot-toast';

interface ProductModalProps {
  product?: Product; // For editing
  onClose: () => void;
  onSave: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product?.image_url || '');
  const [stockInput, setStockInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: product?.name || '',
    category_id: product?.category_id || '',
    price: product?.price || 0,
    description: product?.description || '',
    image_url: product?.image_url || '',
    stock: product?.stock || 0,
    is_available: product?.is_available ?? true,
    is_auto_delivery: product?.is_auto_delivery ?? false,
    requires_delivery_data: product?.requires_delivery_data ?? false,
    checkout_config: product?.checkout_config || { fields: ['user_id'] }
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await CategoryService.getAll();
        setCategories(data);
        if (data.length > 0 && !formData.category_id) {
          setFormData(prev => ({ ...prev, category_id: data[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category_id) {
        toast.error('Mohon lengkapi data produk!');
        return;
    }

    try {
      setLoading(true);

      let finalImageUrl = formData.image_url;
      if (imageFile) {
        finalImageUrl = await StorageService.uploadProductImage(imageFile);
      }

      const payload = {
        ...formData,
        image_url: finalImageUrl,
        stock: formData.is_auto_delivery ? 0 : formData.stock,
        category: categories.find(c => c.id === formData.category_id)?.name || ''
      };

      if (product?.id) {
        await ProductService.update(product.id, payload);
        if (formData.is_auto_delivery && stockInput.trim()) {
            const items = stockInput.split('\n').filter(i => i.trim());
            if (items.length > 0) {
              await ProductService.addStockItems(product.id, items);
            }
        }
      } else {
        const newProduct = await ProductService.create(payload);
        if (formData.is_auto_delivery && stockInput.trim()) {
            const items = stockInput.split('\n').filter(i => i.trim());
            if (items.length > 0) {
              await ProductService.addStockItems(newProduct.id, items);
            }
        }
      }

      toast.success(product?.id ? 'Produk berhasil diupdate!' : 'Produk berhasil ditambahkan!');
      onSave();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan produk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl bg-white rounded-4xl border-4 border-black shadow-[24px_24px_0px_0px_#000] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header - Brutalist Style */}
        <div className="bg-black py-8 px-10 flex items-center justify-between border-b-4 border-black shrink-0 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
             <Package size={140} className="text-white" />
           </div>
           
           <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-primary rounded-2xl border-4 border-black flex items-center justify-center shadow-[6px_6px_0px_0px_#fff]">
                <Package size={32} className="text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] leading-none mb-2">
                  {product?.id ? 'EDIT PRODUCT' : 'NEW PRODUCT'}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-white/10 px-3 py-1 rounded-lg">Management Panel</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                </div>
              </div>
           </div>

           <button 
             type="button"
             onClick={onClose}
             className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border-2 border-white/10 hover:border-primary/50 cursor-pointer"
           >
             <X size={32} />
           </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50">
           <form onSubmit={handleSubmit} className="p-10 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                 {/* Left Column: Basic Info & Description */}
                 <div className="lg:col-span-7 space-y-10">
                    
                    {/* Section: Main Info */}
                    <div className="bg-white p-8 rounded-4xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] space-y-8">
                       <div className="flex items-center gap-3 border-b-2 border-black/5 pb-6">
                          <Info size={20} className="text-primary-dark" />
                          <h3 className="font-black text-xs uppercase tracking-widest text-black">Informasi Dasar</h3>
                       </div>

                       <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Nama Produk</label>
                            <input 
                              type="text" 
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full px-8 py-5 rounded-2xl border-2 border-black focus:bg-white bg-gray-50 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-lg"
                              placeholder="Contoh: 86 Diamonds MLBB"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Pilih Katalog</label>
                              <div className="relative">
                                <Layers className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <select 
                                  value={formData.category_id}
                                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                  className="w-full pl-16 pr-8 py-5 rounded-2xl border-2 border-black bg-gray-50 focus:bg-white outline-none appearance-none font-bold"
                                >
                                  {categories.map(c => (
                                      <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                                  ))}
                                  {categories.length === 0 && <option disabled>Muat Katalog...</option>}
                                </select>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Harga Jual (IDR)</label>
                              <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400">Rp</span>
                                <input 
                                  type="text" 
                                  required
                                  value={formData.price ? formData.price.toLocaleString('id-ID') : ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setFormData({ ...formData, price: val ? Number(val) : 0 });
                                  }}
                                  className="w-full pl-16 pr-8 py-5 rounded-2xl border-2 border-black bg-gray-50 focus:bg-white outline-none font-black text-xl"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Deskripsi Detail</label>
                            <textarea 
                              rows={4}
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="w-full p-8 rounded-3xl border-2 border-black bg-gray-50 focus:bg-white outline-none font-medium leading-relaxed"
                              placeholder="Berikan penjelasan lengkap mengenai produk ini..."
                            />
                          </div>
                       </div>
                    </div>

                    {/* Section: Checkout Config */}
                    <div className="bg-white p-8 rounded-4xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] space-y-8">
                       <div className="flex items-center gap-3 border-b-2 border-black/5 pb-6">
                            <ShoppingCart size={20} className="text-blue-500" />
                            <h3 className="font-black text-xs uppercase tracking-widest text-black">Konfigurasi Checkout</h3>
                       </div>

                       <div className="space-y-6">
                          <p className="text-[10px] font-black uppercase text-text-muted tracking-widest">Pilih field input yang harus diisi pembeli:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              { id: 'user_id', label: 'User / ID Akun' },
                              { id: 'server_id', label: 'ID Server (Game)' },
                              { id: 'phone', label: 'Nomor WhatsApp' },
                              { id: 'email', label: 'Alamat Email' },
                              { id: 'custom', label: 'Field Custom' },
                            ].map((field) => (
                              <label key={field.id} className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer group ${
                                formData.checkout_config?.fields?.includes(field.id as any) 
                                ? 'border-black bg-primary/5' 
                                : 'border-gray-100 bg-gray-50 hover:border-primary/50'
                               }`}>
                                <div className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center transition-all ${
                                  formData.checkout_config?.fields?.includes(field.id as any) ? 'bg-primary' : 'bg-white'
                                }`}>
                                  {formData.checkout_config?.fields?.includes(field.id as any) && <Check size={16} strokeWidth={4} />}
                                </div>
                                <input 
                                  type="checkbox"
                                  className="hidden"
                                  checked={formData.checkout_config?.fields?.includes(field.id as any)}
                                  onChange={(e) => {
                                    const currentFields = formData.checkout_config?.fields || [];
                                    const newFields = e.target.checked 
                                      ? [...currentFields, field.id as any]
                                      : currentFields.filter(f => f !== field.id);
                                    setFormData({
                                      ...formData,
                                      checkout_config: { ...formData.checkout_config!, fields: newFields }
                                    });
                                  }}
                                />
                                <span className="text-xs font-black uppercase tracking-tight text-black">{field.label}</span>
                              </label>
                            ))}
                          </div>

                          {formData.checkout_config?.fields?.includes('custom') && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 p-6 bg-primary/5 border-2 border-dashed border-primary rounded-3xl">
                              <label className="text-[10px] font-black uppercase tracking-widest text-primary-dark">Label Field Custom</label>
                              <input 
                                type="text"
                                placeholder="Contoh: Username atau Nickname"
                                value={formData.checkout_config?.custom_label || ''}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  checkout_config: { ...formData.checkout_config!, custom_label: e.target.value } 
                                })}
                                className="w-full px-6 py-4 rounded-xl border-2 border-black bg-white outline-none font-bold"
                              />
                            </motion.div>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Right Column: Image & Fulfillment */}
                 <div className="lg:col-span-5 space-y-10">
                    
                    {/* Section: Image Upload */}
                    <div className="bg-white p-8 rounded-4xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] space-y-6">
                       <div className="flex items-center gap-3 border-b-2 border-black/5 pb-6">
                          <ImageIcon size={20} className="text-purple-500" />
                          <h3 className="font-black text-xs uppercase tracking-widest text-black">Media & Gambar</h3>
                       </div>

                       <div 
                         onClick={() => fileInputRef.current?.click()}
                         className="group relative aspect-square rounded-4xl border-4 border-dashed border-gray-200 hover:border-primary transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-2 bg-gray-50 shadow-inner"
                       >
                          {imagePreview ? (
                            <div className="w-full h-full relative">
                              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-3 p-4 text-center">
                                 <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-black border-2 border-black">
                                    <Upload size={24} />
                                 </div>
                                 <span className="font-black text-xs uppercase tracking-[0.2em] shadow-lg">Ganti Foto Produk</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-6 p-8">
                               <div className="w-20 h-20 bg-white border-2 border-black rounded-3xl flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] group-hover:bg-primary group-hover:rotate-6 transition-all duration-300">
                                  <ImageIcon size={32} className="text-black" />
                               </div>
                               <div className="text-center">
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Support: JPG, PNG, WEBP</p>
                                  <button type="button" className="px-6 py-2 bg-black text-white rounded-full font-black text-[9px] uppercase tracking-widest group-hover:bg-primary group-hover:text-black transition-colors">Pilih File</button>
                               </div>
                            </div>
                          )}
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                       </div>
                    </div>

                    {/* Section: Fulfillment & Inventory */}
                    <div className="bg-white p-8 rounded-4xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] space-y-8">
                       <div className="flex items-center gap-3 border-b-2 border-black/5 pb-6">
                          <Zap size={20} className="text-orange-500" />
                          <h3 className="font-black text-xs uppercase tracking-widest text-black">Fulfillment & Stok</h3>
                       </div>

                       <div className="space-y-8">
                          {/* Auto Delivery Toggle */}
                          <div className="p-6 bg-gray-50 rounded-3xl border-2 border-black/5 flex items-center justify-between group">
                             <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center transition-all ${formData.is_auto_delivery ? 'bg-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}>
                                   <Zap size={20} className={formData.is_auto_delivery ? 'text-black' : 'text-gray-300'} fill={formData.is_auto_delivery ? 'currentColor' : 'none'} />
                                </div>
                                <div>
                                   <p className="text-xs font-black uppercase tracking-tight">Auto Instant (S3)</p>
                                   <p className="text-[9px] font-bold text-text-muted uppercase">Kirim otomatis via stok</p>
                                </div>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer scale-110">
                               <input type="checkbox" className="sr-only peer" checked={formData.is_auto_delivery} onChange={(e) => setFormData({ ...formData, is_auto_delivery: e.target.checked })} />
                               <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-2 after:border-black after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border-2 border-black shadow-inner"></div>
                             </label>
                          </div>

                          {/* Manual Delivery Data Toggle */}
                          <div className="p-6 bg-gray-50 rounded-3xl border-2 border-black/5 flex items-center justify-between group">
                             <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center transition-all ${formData.requires_delivery_data ? 'bg-blue-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}>
                                   <Layers size={20} className={formData.requires_delivery_data ? 'text-white' : 'text-gray-300'} />
                                </div>
                                <div>
                                   <p className="text-xs font-black uppercase tracking-tight">Kirim Data Manual</p>
                                   <p className="text-[9px] font-bold text-text-muted uppercase">Admin input data di dashboard</p>
                                </div>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer scale-110">
                               <input type="checkbox" className="sr-only peer" checked={formData.requires_delivery_data} onChange={(e) => setFormData({ ...formData, requires_delivery_data: e.target.checked })} />
                               <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-2 after:border-black after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 border-2 border-black shadow-inner"></div>
                             </label>
                          </div>

                          <div className="h-px bg-black/5" />

                          {/* Inventory Input Area */}
                          {formData.is_auto_delivery ? (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                               <div className="flex items-center justify-between px-1">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-primary-dark flex items-center gap-2">
                                     <Zap size={12} fill="currentColor" /> {product?.id ? 'Tambah Stok Tambahan' : 'Input Stok Awal'}
                                  </label>
                                  <span className="text-[8px] font-bold text-text-muted uppercase">1 Item per baris</span>
                               </div>
                               <textarea 
                                 rows={6}
                                 value={stockInput}
                                 onChange={(e) => setStockInput(e.target.value)}
                                 placeholder="email:password&#10;user:pass123&#10;LINK-DOWNLOAD-URL"
                                 className="w-full p-6 rounded-3xl border-2 border-black bg-white outline-none font-mono text-xs leading-relaxed focus:bg-primary/5 transition-colors shadow-inner"
                               />
                               {product?.id && product.stock > 0 && (
                                 <div className="flex items-center gap-2 px-6 py-3 bg-green-50 rounded-xl border border-green-100">
                                    <ShieldCheck className="text-green-500" size={14} />
                                    <span className="text-[9px] font-bold text-green-700 uppercase leading-none">Status: {product.stock} items tersedia</span>
                                 </div>
                               )}
                            </motion.div>
                          ) : (
                            <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Jumlah Stok Manual</label>
                              <div className="relative">
                                 <Package className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                 <input 
                                   type="text" 
                                   value={formData.stock === 0 ? '' : formData.stock}
                                   onChange={(e) => {
                                     const val = e.target.value.replace(/\D/g, '');
                                     setFormData({ ...formData, stock: val ? Number(val) : 0 });
                                   }}
                                   className="w-full pl-16 pr-8 py-5 rounded-2xl border-2 border-black bg-white outline-none font-black text-xl"
                                   placeholder="0"
                                 />
                              </div>
                            </div>
                          )}

                          {/* Active Status */}
                          <div className="flex items-center justify-between p-6 bg-gray-900 rounded-3xl">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl border-2 border-white/20 flex items-center justify-center bg-white/5">
                                   <ShieldCheck size={20} className={formData.is_available ? 'text-green-400' : 'text-gray-500'} />
                                </div>
                                <div>
                                   <p className="text-[10px] font-black uppercase text-white tracking-widest">Visibility</p>
                                   <p className={`text-[9px] font-bold uppercase ${formData.is_available ? 'text-green-400' : 'text-red-400'}`}>
                                      {formData.is_available ? 'Produk Aktif' : 'Tersembunyi'}
                                   </p>
                                </div>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer scale-110">
                               <input type="checkbox" className="sr-only peer" checked={formData.is_available} onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })} />
                               <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-2 after:border-black after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 border-2 border-white/20"></div>
                             </label>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Footer Submit Button */}
              <div className="pt-10 border-t-4 border-black flex gap-6 sticky bottom-0 bg-gray-50/90 backdrop-blur-md pb-4 z-10 transition-all">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 btn-primary py-7 rounded-3xl flex items-center justify-center gap-4 shadow-[12px_12px_0px_0px_#000] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all text-sm font-black uppercase tracking-[0.3em] overflow-hidden group relative"
                >
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                  {loading ? (
                    <Loader2 className="animate-spin text-black" size={24} />
                  ) : (
                    <Check size={24} strokeWidth={4} />
                  )}
                  <span className="relative z-10">
                    {loading ? 'MEMPROSES DATA...' : product?.id ? 'UPDATE PRODUCT NOW' : 'CREATE NEW PRODUCT'}
                  </span>
                </button>
              </div>
           </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductModal;
