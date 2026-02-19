import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Zap, Star, ShieldCheck, Clock, ChevronRight, Info } from 'lucide-react';
import { ProductService, CategoryService } from '../services/api';
import type { Product, Category } from '../types';
import CheckoutModal from '../components/ui/CheckoutModal';
import ProductDetailModal from '../components/ui/ProductDetailModal';

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const scrollToResults = () => {
    if (searchQuery.trim()) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, prods] = await Promise.all([
          CategoryService.getAll(),
          ProductService.getAll()
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openCheckout = (product: Product) => {
    setSelectedProduct(product);
    setIsCheckoutModalOpen(true);
  };

  const openDetail = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const currentCategory = (selectedProduct ? categories.find(c => c.id === selectedProduct.category_id) : null) ?? null;

  const filteredCategories = categories.filter(cat => 
    (cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    products.some(p => p.category_id === cat.id && p.name.toLowerCase().includes(searchQuery.toLowerCase()))) &&
    products.some(p => p.category_id === cat.id && p.is_available)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <Zap className="absolute inset-0 m-auto text-primary animate-pulse" size={32} />
        </div>
        <div className="text-center space-y-4">
            <h2 className="font-black text-2xl uppercase tracking-[0.3em] text-black">JASZZ STORE</h2>
            <div className="flex gap-2 justify-center">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Cinematic & Premium */}
      <section className="relative h-[90vh] flex items-center overflow-hidden bg-black">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        </div>

        <div className="section-container relative z-10 w-full pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-10"
                >
                    <div className="space-y-4">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full"
                        >
                            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Official Store Online</span>
                        </motion.div>
                        <h1 className="text-5xl md:text-7xl lg:text-9xl font-black text-white leading-none uppercase tracking-tighter">
                            LEVEL UP <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-primary">FASTER.</span>
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl font-bold max-w-lg leading-relaxed uppercase tracking-wide">
                            Top up instant, legal, dan terpercaya. <br/>
                            <span className="text-white">Jaszz Store</span> hadir untuk mendukung setiap kemenanganmu.
                        </p>
                    </div>

                    <div className="relative group max-w-xl">
                        <div className="absolute -inset-1 bg-primary rounded-[2rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                        <div className="relative flex items-center bg-white rounded-[2rem] border-4 border-black p-2 shadow-2xl">
                             <Search className="ml-4 md:ml-6 text-gray-400 shrink-0" size={20} />
                            <input 
                                type="text" 
                                placeholder="CARI GAME..."
                                className="w-full bg-transparent border-none focus:ring-0 px-3 md:px-6 py-3 md:py-4 font-black text-black placeholder:text-gray-300 uppercase tracking-widest text-[10px] md:text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && scrollToResults()}
                            />
                            <button 
                                onClick={scrollToResults}
                                className="bg-black text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black hover:bg-primary hover:text-black transition-all uppercase tracking-widest text-[10px] md:text-xs border-2 border-black shrink-0"
                            >
                                FIND
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-12 pt-4">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-4 border-black bg-gray-800 overflow-hidden shadow-xl">
                                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                                </div>
                            ))}
                            <div className="w-12 h-12 rounded-full border-4 border-black bg-primary flex items-center justify-center font-black text-xs shadow-xl">
                                50k+
                            </div>
                        </div>
                        <div className="h-10 w-px bg-white/20" />
                        <div className="space-y-1">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} className="text-primary" fill="currentColor" />)}
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TRUSTED BY GAMERS</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="hidden lg:block relative"
                >
                    <div className="relative z-10 w-full aspect-square bg-gradient-to-br from-primary/20 to-transparent rounded-[4rem] border-2 border-white/10 backdrop-blur-sm p-12 overflow-hidden shadow-2xl group">
                        <img 
                            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" 
                            alt="Gaming banner" 
                            className="w-full h-full object-cover rounded-[3rem] border-4 border-black shadow-2xl grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                        <div className="absolute bottom-20 left-20 right-20 space-y-4">
                            <div className="w-20 h-2 bg-primary" />
                            <h3 className="text-5xl font-black text-white uppercase leading-none">PREMIUM <br/> QUALITY.</h3>
                        </div>
                    </div>
                    {/* Floating Cards */}
                    <div className="absolute -top-10 -right-10 bg-white border-4 border-black p-6 rounded-[2rem] shadow-[20px_20px_0px_0px_#FFD700] animate-float z-20">
                        <Zap className="text-primary mb-2" size={32} fill="currentColor" />
                        <p className="font-black text-xl uppercase leading-none">INSTANT<br/>PROCESS</p>
                    </div>
                </motion.div>
            </div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="relative z-20 ">
        <div className="section-container">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <HeroFeature icon={<Zap size={24} />} title="INSTANT" desc="Proses Otomatis" />
                <HeroFeature icon={<ShieldCheck size={24} />} title="SECURE" desc="Legal & Garansi" />
                <HeroFeature icon={<Clock size={24} />} title="NON-STOP" desc="Aktif 24 Jam" />
                <HeroFeature icon={<Star size={24} />} title="PREMIUM" desc="Harga Terbaik" />
            </div>
        </div>
      </section>

      <div className="section-container space-y-32">
        {/* Modern Catalog Grid */}
        <section className="space-y-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black">TOP CATEGORIES</h2>
                    <p className="text-text-muted font-bold text-sm uppercase tracking-[0.3em] mt-2 flex items-center gap-3">
                        Layanan Terpopuler <span className="h-1 flex-1 bg-primary/20" />
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="w-12 h-12 rounded-2xl border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all">
                        <ChevronRight className="rotate-180" size={20} />
                    </button>
                    <button className="w-12 h-12 rounded-2xl border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-8">
                {categories.map((cat) => (
                    <motion.div
                        key={cat.id}
                        whileHover={{ y: -15 }}
                        className="relative"
                    >
                        <div 
                            onClick={() => document.getElementById(`category-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                            className="block group cursor-pointer"
                        >
                            <div className="relative aspect-[3/4.5] rounded-[2.5rem] overflow-hidden border-4 border-black bg-white shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)] group-hover:shadow-[10px_10px_0px_0px_rgba(255,215,0,0.8)] transition-all">
                                {cat.image_url ? (
                                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover grayscale-20 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-black font-black text-4xl">
                                        {cat.name.charAt(0)}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                                    <div className="text-[8px] font-black text-primary uppercase tracking-[0.3em] bg-primary/10 w-fit px-2 py-1 rounded">HOT ITEM</div>
                                    <h3 className="text-white font-black text-xl leading-none uppercase tracking-tight line-clamp-2">{cat.name}</h3>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>

        {/* Categorized Products - Premium Brutalism Style */}
        <div ref={resultsRef} className="space-y-40 scroll-mt-20">
            {searchQuery && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-6 p-10 bg-black rounded-[3rem] border-4 border-primary shadow-[15px_15px_0px_0px_rgba(255,215,0,0.2)]"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center border-4 border-black rotate-3">
                            <Search size={32} className="text-black" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2">HASIL PENCARIAN</h3>
                            <p className="text-primary font-bold text-xs uppercase tracking-widest">Menampilkan hasil untuk: "{searchQuery}"</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 px-6 py-3 rounded-xl border border-white/20">
                            <span className="text-white font-black text-sm uppercase tracking-widest">{filteredCategories.length} KATALOG DITEMUKAN</span>
                        </div>
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="bg-primary text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all border-2 border-black"
                        >
                            CLEAR
                        </button>
                    </div>
                </motion.div>
            )}

            {filteredCategories.length === 0 && searchQuery && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-40 text-center space-y-10"
                >
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
                        <div className="relative w-40 h-40 bg-white border-4 border-black rounded-[3rem] flex items-center justify-center mx-auto shadow-[15px_15px_0px_0px_#ef4444] -rotate-6">
                            <Search size={64} className="text-red-500" />
                        </div>
                    </div>
                    <div className="space-y-4 max-w-xl mx-auto px-6">
                        <h3 className="text-5xl font-black text-black uppercase tracking-tighter leading-none">GAME TIDAK DITEMUKAN</h3>
                        <p className="text-text-muted font-bold text-lg leading-relaxed">
                            Maaf, produk yang Anda cari tidak tersedia saat ini. <br/>
                            Coba masukkan kata kunci lain atau cek katalog kami lainnya.
                        </p>
                    </div>
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="btn-primary py-5 px-12 rounded-3xl text-sm"
                    >
                        RESET PENCARIAN
                    </button>
                </motion.div>
            )}

            {filteredCategories.map((cat) => {
                        const catProducts = products.filter(p => p.category_id === cat.id && p.is_available && 
                            (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        );
                        if (catProducts.length === 0) return null;

                        return (
                            <section key={cat.id} id={`category-${cat.id}`} className="section-container mb-5 scroll-mt-32">
                                <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
                                    <div className="flex items-center gap-10">
                                        <div className="relative group">
                                            <div className="absolute -inset-4 bg-primary blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                            <div className="relative w-32 h-32 bg-white border-4 border-black rounded-[2.5rem] overflow-hidden rotate-[-4deg] group-hover:rotate-0 transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                                                {cat.image_url ? (
                                                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-primary font-black text-4xl">
                                                        {cat.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-center md:text-left">
                                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black leading-none">{cat.name}</h2>
                                            <div className="inline-flex items-center gap-4 bg-gray-100 px-4 py-2 rounded-full border-2 border-black/5">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{catProducts.length} ITEMS AVAILABLE</span>
                                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                                    {catProducts.map((product) => (
                                        <motion.div
                                            key={product.id}
                                            whileHover={{ y: -12 }}
                                            className="bg-white rounded-[2.5rem] border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(255,215,0,1)] transition-all group relative overflow-hidden"
                                        >
                                    {product.is_auto_delivery && (
                                        <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
                                            {product.stock <= 0 && (
                                                <div className="bg-red-600 border-2 border-black text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                                    <span className="text-[8px] font-black uppercase tracking-widest">STOK HABIS</span>
                                                </div>
                                            )}
                                            <div className="bg-primary border-2 border-black text-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                                <Zap size={14} fill="currentColor" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">INSTANT</span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {!product.is_auto_delivery && product.stock <= 0 && (
                                        <div className="absolute top-6 right-6 z-10">
                                            <div className="bg-red-600 border-2 border-black text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest">STOK HABIS</span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-6 md:space-y-10 pt-6">
                                        <div className="space-y-3">
                                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-text-muted">{cat.name}</div>
                                            <h3 className="text-2xl font-black leading-tight uppercase tracking-tight line-clamp-2 min-h-[3.5rem]">{product.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-black/10 ${product.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                    STOK: {product.stock}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-200 line-through">RP {(product.price * 1.3).toLocaleString('id-ID')}</span>
                                                <div className="text-2xl md:text-3xl font-black text-black flex items-baseline gap-1">
                                                    <span className="text-xs md:text-sm">Rp</span>
                                                    <span className="text-3xl md:text-4xl text-primary drop-shadow-[2px_2px_0px_#000]">{product.price.toLocaleString('id-ID')}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-3">
                                                <button 
                                                    onClick={() => openDetail(product)}
                                                    className="w-full py-3 bg-gray-50 border-2 border-black rounded-2xl flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all cursor-pointer shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 font-black uppercase text-[10px] tracking-widest"
                                                >
                                                    <Info size={16} /> LIHAT DETAIL
                                                </button>
                                                <button 
                                                    onClick={() => product.stock > 0 && openCheckout(product)}
                                                    disabled={product.stock <= 0}
                                                    className={`w-full btn-primary py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                                        product.stock <= 0 
                                                        ? 'bg-gray-200! text-gray-400! border-gray-300! cursor-not-allowed opacity-50 shadow-none!' 
                                                        : 'bg-black! text-white! hover:bg-primary! hover:text-black!'
                                                    }`}
                                                >
                                                    {product.stock <= 0 ? 'STOK KOSONG' : (
                                                        <>BELI SEKARANG <Zap size={16} /></>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Subtle background detail */}
                                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                                </motion.div>
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
      </div>

      {/* Trust Banner - Modern Section */}
      <section className="bg-black py-32 mt-40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_40%_20%,_var(--tw-gradient-stops))] from-primary/40 via-transparent to-transparent" />
        <div className="section-container relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-24 gap-12">
                <div className="text-center md:text-left space-y-4">
                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">TRUST THE <br/><span className="text-primary underline decoration-4 underline-offset-8">BEST SERVICE.</span></h2>
                    <p className="text-gray-400 font-bold max-w-sm">Bergabunglah dengan ribuan gamer yang puas belanja di Jaszz Store setiap hari.</p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <StatInfo label="SALES" value="50K+" />
                    <StatInfo label="REVIEWS" value="4.9/5" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <TrustCard title="INSTANT PROCESS" desc="Sistem otomatis kami mengirimkan pesanan Anda sesaat setelah pembayaran dikonfirmasi." />
                <TrustCard title="SECURE PAYMENT" desc="Integrasi sistem pembayaran tercanggih untuk menjamin keamanan setiap transaksi Anda." />
                <TrustCard title="24/7 SUPPORT" desc="Bantuan operasional setiap saat melalui tim support profesional kami di WhatsApp & Email." />
            </div>
        </div>
      </section>

      <CheckoutModal 
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        product={selectedProduct}
        category={currentCategory}
      />

      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        product={selectedProduct}
        category={currentCategory}
        onBuy={openCheckout}
      />
    </div>
  );
};

const HeroFeature = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all group overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center border-2 border-black group-hover:rotate-12 transition-transform">
                {icon}
            </div>
            <div>
                <h4 className="font-black text-sm uppercase tracking-tight">{title}</h4>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{desc}</p>
            </div>
        </div>
        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/30 transition-all" />
    </div>
);

const StatInfo = ({ label, value }: { label: string, value: string }) => (
    <div className="text-center md:text-left p-6 border-l-4 border-primary">
        <div className="text-4xl font-black text-white mb-2">{value}</div>
        <div className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">{label}</div>
    </div>
);

const TrustCard = ({ title, desc }: { title: string, desc: string }) => (
    <div className="p-10 rounded-[3rem] border-2 border-white/10 hover:border-primary transition-all bg-white/5 backdrop-blur-xl group space-y-6">
        <div className="w-12 h-1 bg-primary group-hover:w-full transition-all duration-500" />
        <h3 className="text-2xl font-black text-white uppercase tracking-widest leading-none">{title}</h3>
        <p className="text-gray-400 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
);

export default Home;
