import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, LogOut, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform border-2 border-primary">
            <ShoppingBag className="text-primary" size={24} fill="currentColor" />
          </div>
          <span className="text-2xl font-black uppercase tracking-tighter text-black">
            JASZZ<span className="text-primary drop-shadow-[1px_1px_0px_#000]">STORE</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-10">
          <Link to="/" className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors relative group">
            Beranda
            <span className="absolute -bottom-1 left-0 w-0 h-1 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link to="/cek-pesanan" className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors relative group">
            Cek Pesanan
            <span className="absolute -bottom-1 left-0 w-0 h-1 bg-primary transition-all group-hover:w-full" />
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <button className="hidden sm:flex p-3 hover:bg-gray-100 rounded-2xl transition-all border-2 border-transparent hover:border-black">
            <Search size={22} className="text-black" />
          </button>
          
          {session && (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-3 btn-primary py-3! px-6! shadow-none hover:shadow-xl border-2 border-black">
                <User size={18} />
                <span className="hidden sm:inline">Portal Admin</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="p-3 bg-red-50 text-red-500 rounded-2xl border-2 border-transparent hover:border-red-500 transition-all shadow-sm"
                title="Logout"
              >
                <LogOut size={22} />
              </button>
            </div>
          )}

          <button 
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden p-3 bg-black text-white rounded-2xl hover:bg-primary hover:text-black transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-100 lg:hidden bg-white h-dvh"
          >
            <div className="flex flex-col h-full overflow-hidden">
              {/* Mobile Header */}
              <div className="flex items-center justify-between px-6 h-20 border-b-2 border-black shrink-0">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border-2 border-primary">
                    <ShoppingBag className="text-primary" size={20} fill="currentColor" />
                  </div>
                  <span className="text-xl font-black uppercase tracking-tighter text-black">
                    JASZZ<span className="text-primary">STORE</span>
                  </span>
                </Link>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-3 bg-gray-100 rounded-2xl border-2 border-black"
                >
                  <X size={24} className="text-black" />
                </button>
              </div>

              {/* Mobile Links */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                <div className="grid grid-cols-1 gap-4">
                  <Link 
                    to="/" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border-2 border-black group hover:bg-primary transition-colors"
                  >
                    <span className="text-xl font-black uppercase tracking-widest text-black">Beranda</span>
                    <ShoppingBag size={24} className="text-black/20 group-hover:text-black" />
                  </Link>
                  <Link 
                    to="/cek-pesanan" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border-2 border-black group hover:bg-primary transition-colors"
                  >
                    <span className="text-xl font-black uppercase tracking-widest text-black">Cek Pesanan</span>
                    <Search size={24} className="text-black/20 group-hover:text-black" />
                  </Link>
                  <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border-2 border-dashed border-black/20 group hover:border-black transition-colors"
                  >
                    <span className="text-xl font-black uppercase tracking-widest text-black/40 group-hover:text-black">Cari Game...</span>
                    <Search size={24} className="text-black/10 group-hover:text-black" />
                  </button>
                </div>

                {session && (
                  <div className="pt-6 border-t-2 border-dashed border-black/10 space-y-4">
                    <Link 
                      to="/dashboard" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-3 w-full btn-primary py-5 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_#000]"
                    >
                      <User size={20} />
                      <span className="text-lg font-black uppercase tracking-widest">Portal Admin</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-3 w-full py-5 bg-red-50 text-red-500 rounded-3xl border-2 border-red-500 font-black uppercase tracking-widest"
                    >
                      <LogOut size={20} />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Footer */}
              <div className="p-8 bg-black text-center shrink-0">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Official Jaszz Store App</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
