import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Info, ShieldCheck, Share2, Package, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product, Category } from '../../types';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  category: Category | null;
  onBuy: (product: Product) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ isOpen, onClose, product, category, onBuy }) => {
  const handleShare = async () => {
    if (!product) return;
    
    const shareData = {
      title: product.name,
      text: `Cek ${product.name} di Jaszz Store! Murah dan Instant.`,
      url: `${window.location.origin}/#category-${product.category_id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link produk berhasil disalin!');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Gagal membagikan produk');
      }
    }
  };

  if (!product || !category) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-10">
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
            className="relative w-full max-w-4xl bg-white rounded-3xl md:rounded-4xl border-[3px] border-black shadow-[10px_10px_0px_0px_#000] md:shadow-[20px_20px_0px_0px_#000] flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden m-2"
          >
            {/* Header: Jaszz Style */}
            <div className="bg-black py-4 md:py-6 px-6 md:px-10 flex items-center justify-between border-b-[3px] border-black shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-primary p-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000]">
                  <Info size={22} className="text-black" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg uppercase tracking-[0.3em] leading-none">DETAIL PRODUK</h3>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1.5 opacity-80">Product Specification & Info</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleShare}
                  className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 hover:border-primary/50"
                  title="Share Produk"
                >
                  <Share2 size={22} />
                </button>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 hover:border-primary/50"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Visual Section */}
                <div className="p-6 md:p-10 bg-gray-50 flex items-center justify-center border-b-[3px] md:border-b-0 md:border-r-[3px] border-black/5">
                   <div className="relative group w-full aspect-square max-w-[200px] md:max-w-sm">
                        <div className="absolute -inset-4 bg-primary blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative h-full bg-white border-4 border-black rounded-3xl md:rounded-[3rem] overflow-hidden shadow-2xl">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200">
                                    <Package size={120} strokeWidth={1} />
                                </div>
                            )}
                            
                            {/* Badges Overlay */}
                            <div className="absolute top-6 left-6 flex flex-col gap-3">
                                <div className="bg-black text-white px-4 py-1.5 rounded-full border-2 border-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Zap size={14} className="text-primary" fill="currentColor" />
                                    {product.is_auto_delivery ? 'Instant' : 'Manual'}
                                </div>
                                <div className={`px-4 py-1.5 rounded-full border-2 border-black text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {product.stock > 0 ? `Ready: ${product.stock}` : 'Sold Out'}
                                </div>
                            </div>
                        </div>
                   </div>
                </div>

                {/* Content Section */}
                <div className="p-6 md:p-12 space-y-6 md:space-y-10">
                    <div className="space-y-4">
                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.4em] leading-none">{category.name}</div>
                        <h2 className="text-2xl md:text-4xl font-black text-black uppercase tracking-tighter leading-tight md:leading-none">{product.name}</h2>
                        <div className="h-2 w-20 bg-primary border-2 border-black" />
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest border-b-2 border-black/5 pb-2">Deskripsi Produk</h4>
                            <div className="text-black font-medium leading-relaxed prose prose-sm text-xs md:text-sm">
                                {product.description || 'Tidak ada deskripsi untuk produk ini.'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-4">
                            <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-black/5">
                                <span className="block text-[8px] font-black text-text-muted uppercase mb-1">Status Delivery</span>
                                <span className="text-[10px] font-bold text-black uppercase">{product.is_auto_delivery ? 'Kirim Otomatis (Instant)' : 'Proses Manual (1-10 Menit)'}</span>
                            </div>
                            <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-black/5">
                                <span className="block text-[8px] font-black text-text-muted uppercase mb-1">Sistem Layanan</span>
                                <span className="text-[10px] font-bold text-black uppercase">Aktif 24/7 Nonstop</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t-[3px] border-dashed border-black/10 mt-auto">
                        <div className="flex items-center justify-between gap-6">
                            <div className="shrink-0">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">HARGA TERBAIK</span>
                                <div className="text-2xl md:text-4xl font-black text-black tracking-tighter">
                                    <span className="text-xs md:text-sm mr-1">Rp</span>
                                    {product.price.toLocaleString('id-ID')}
                                </div>
                            </div>
                             <button 
                                onClick={() => {
                                    onClose();
                                    onBuy(product);
                                }}
                                disabled={product.stock <= 0}
                                className={`flex-1 py-4 md:py-5 rounded-2xl md:rounded-4xl font-black uppercase tracking-widest text-[10px] md:text-xs flex items-center justify-center gap-2 md:gap-3 transition-all ${
                                    product.stock <= 0 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200' 
                                    : 'bg-primary text-black border-[3px] border-black shadow-[6px_6px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1'
                                }`}
                            >
                                {product.stock <= 0 ? 'STOK KOSONG' : (
                                    <>BELI <span className="hidden sm:inline">SEKARANG</span> <ArrowRight size={18} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-black py-3 md:py-4 px-6 md:px-10 flex flex-col md:flex-row items-center justify-between border-t-[3px] border-black shrink-0 gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-primary" />
                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">SISTEM KEAMANAN TERVERIFIKASI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">POWERED BY JASZZ STACK</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductDetailModal;
