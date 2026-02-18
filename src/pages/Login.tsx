import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Gagal login. Pastikan akun sudah terdaftar di Supabase Auth.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-text-muted hover:text-primary-dark transition-colors mb-8"
        >
          <ChevronLeft size={20} />
          Kembali ke Beranda
        </button>

        <div className="glass-card p-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="text-primary-dark" size={32} />
            </div>
            <h1 className="text-2xl font-black">Admin Login</h1>
            <p className="text-text-muted text-sm mt-2">Masuk untuk mengelola pesanan & produk</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-muted">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jaszzstore.com"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-100 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-muted">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-100 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : null}
              {loading ? 'Masuk...' : 'Login Ke Dashboard'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-50 text-center">
            <p className="text-xs text-text-muted leading-relaxed">
              Hanya diperuntukkan bagi pengelola toko Jaszz Store. <br />
              Belum punya akun? Buat di Dashboard Supabase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
