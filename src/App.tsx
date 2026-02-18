import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import OrderTracking from './pages/OrderTracking';
import OrderDetail from './pages/OrderDetail';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

import { Instagram, Facebook, MessageCircle } from 'lucide-react';

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#000',
            color: '#fff',
            borderRadius: '1rem',
            border: '2px solid #FFD700',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: '12px'
          },
          success: {
            iconTheme: {
              primary: '#FFD700',
              secondary: '#000',
            },
          },
        }}
      />
      <div className="min-h-screen bg-background text-text overflow-x-hidden">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cek-pesanan" element={<OrderTracking />} />
            <Route path="/order/:orderId" element={<OrderDetail />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <footer className="bg-black py-20 border-t-4 border-primary">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">JASZZ<span className="text-primary">STORE</span></h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs font-medium">Platform digital gaming terpercaya dengan layanan kilat 24 jam. Kami hadir untuk menunjang pengalaman gaming Anda.</p>
            </div>
            <div className="space-y-6">
              <h4 className="text-xs font-black text-white uppercase tracking-[0.3em]">QUICK LINKS</h4>
              <div className="flex flex-col gap-3">
                <Link to="/" className="text-gray-400 hover:text-primary text-sm transition-colors font-medium w-fit">Beranda</Link>
                <Link to="/cek-pesanan" className="text-gray-400 hover:text-primary text-sm transition-colors font-medium w-fit">Cek Pesanan</Link>
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="text-xs font-black text-white uppercase tracking-[0.3em]">SOCIALS</h4>
              <div className="flex gap-4">
                <a href="#" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all cursor-pointer group shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] hover:shadow-[4px_4px_0px_0px_#FFD700]">
                  <Instagram size={20} />
                </a>
                <a href="#" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all cursor-pointer group shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] hover:shadow-[4px_4px_0px_0px_#FFD700]">
                  <MessageCircle size={20} />
                </a>
                <a href="#" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all cursor-pointer group shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] hover:shadow-[4px_4px_0px_0px_#FFD700]">
                  <Facebook size={20} />
                </a>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">© 2024 Jaszz Store. All rights reserved.</p>
            <div className="flex gap-8">
              <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Privacy Policy</span>
              <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Terms of Service</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
