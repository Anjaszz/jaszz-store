import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Upload, Image as ImageIcon, Layers, Info, Check, ShieldCheck } from 'lucide-react';
import type { Category } from '../../types';
import { CategoryService, StorageService } from '../../services/api';
import toast from 'react-hot-toast';

interface CategoryModalProps {
  category?: Category; // For editing
  onClose: () => void;
  onSave: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ category, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(category?.image_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Category>>({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    image_url: category?.image_url || '',
    display_order: category?.display_order || 0
  });

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
    if (!formData.name || !formData.slug) {
      toast.error('Mohon lengkapi nama dan slug katalog!');
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
        image_url: finalImageUrl
      };

      if (category?.id) {
        await CategoryService.update(category.id, payload);
        toast.success('Katalog berhasil diupdate!');
      } else {
        await CategoryService.create(payload as any);
        toast.success('Katalog berhasil ditambahkan!');
      }

      onSave();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal menyimpan katalog.');
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
        className="relative w-full max-w-2xl bg-white rounded-4xl border-4 border-black shadow-[24px_24px_0px_0px_#000] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header - Brutalist Style */}
        <div className="bg-black py-8 px-10 flex items-center justify-between border-b-4 border-black shrink-0 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
             <Layers size={140} className="text-white" />
           </div>
           
           <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-primary rounded-2xl border-4 border-black flex items-center justify-center shadow-[6px_6px_0px_0px_#fff]">
                <Layers size={32} className="text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] leading-none mb-2">
                  {category?.id ? 'EDIT KATALOG' : 'NEW KATALOG'}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-white/10 px-3 py-1 rounded-lg">Katalog Management</span>
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
           <form onSubmit={handleSubmit} className="p-10 space-y-10">
              {/* Section: Basic Info */}
              <div className="bg-white p-8 rounded-4xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] space-y-8">
                 <div className="flex items-center gap-3 border-b-2 border-black/5 pb-6">
                    <Info size={20} className="text-primary-dark" />
                    <h3 className="font-black text-xs uppercase tracking-widest text-black">Informasi Katalog</h3>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Nama Katalog (Game/Layanan)</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ 
                            ...formData, 
                            name: val,
                            slug: val.toLowerCase().replace(/\s+/g, '-')
                          });
                        }}
                        className="w-full px-8 py-5 rounded-2xl border-2 border-black focus:bg-white bg-gray-50 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-lg"
                        placeholder="Contoh: Mobile Legends"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Slug (URL)</label>
                        <input 
                          type="text" 
                          required
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          className="w-full px-6 py-4 rounded-xl border-2 border-black bg-gray-50 focus:bg-white outline-none font-bold"
                          placeholder="mobile-legends"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Urutan Tampilan</label>
                        <input 
                          type="number" 
                          value={formData.display_order}
                          onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                          className="w-full px-6 py-4 rounded-xl border-2 border-black bg-gray-50 focus:bg-white outline-none font-black text-xl"
                        />
                      </div>
                    </div>
                 </div>
              </div>

              {/* Section: Banner */}
              <div className="bg-white p-8 rounded-4xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] space-y-6">
                 <div className="flex items-center gap-3 border-b-2 border-black/5 pb-6">
                    <ImageIcon size={20} className="text-purple-500" />
                    <h3 className="font-black text-xs uppercase tracking-widest text-black">Banner Katalog</h3>
                 </div>

                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="group relative aspect-video rounded-3xl border-4 border-dashed border-gray-200 hover:border-primary transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-2 bg-gray-50 shadow-inner"
                 >
                    {imagePreview ? (
                      <div className="w-full h-full relative">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-3 p-4 text-center">
                           <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-black border-2 border-black">
                              <Upload size={24} />
                           </div>
                           <span className="font-black text-xs uppercase tracking-[0.2em]">Ganti Foto Banner</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-6 p-8">
                         <div className="w-20 h-20 bg-white border-2 border-black rounded-3xl flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] group-hover:bg-primary group-hover:rotate-6 transition-all duration-300">
                            <ImageIcon size={32} className="text-black" />
                         </div>
                         <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Pilih banner katalog untuk tampilan grid</p>
                            <button type="button" className="px-6 py-2 bg-black text-white rounded-full font-black text-[9px] uppercase tracking-widest group-hover:bg-primary group-hover:text-black transition-colors">Pilih File</button>
                         </div>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                 </div>
              </div>

              {/* Active Status Info */}
              <div className="flex items-center justify-between p-6 bg-gray-900 rounded-3xl">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl border-2 border-white/20 flex items-center justify-center bg-white/5 text-primary">
                       <ShieldCheck size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-white tracking-widest">Katalog Status</p>
                       <p className="text-[9px] font-bold uppercase text-green-400">AKTIF & TERLIHAT</p>
                    </div>
                 </div>
              </div>

              {/* Footer Submit Button */}
              <div className="pt-6 flex gap-6 sticky bottom-0 bg-gray-50/90 backdrop-blur-md pb-4 z-10 transition-all">
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
                  <span className="relative z-10 text-xs md:text-sm">
                    {loading ? 'MEMPROSES...' : category?.id ? 'UPDATE KATALOG SEKARANG' : 'SIMPAN KATALOG BARU'}
                  </span>
                </button>
              </div>
           </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CategoryModal;
