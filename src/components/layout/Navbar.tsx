import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Navbar: React.FC = () => {
  const [session, setSession] = useState<any>(null);
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

          <button className="lg:hidden p-3 bg-black text-white rounded-2xl">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
