import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Music, Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const user = state.users.find(
        u => u.username === form.username && u.password === form.password && u.active
      );
      if (user) {
        dispatch({ type: 'LOGIN', payload: user });
      } else {
        setError('Usuario o contraseña incorrectos');
      }
      setLoading(false);
    }, 600);
  };

  const quickLogin = (username, password) => setForm({ username, password });

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl" />

      <div className="w-full max-w-md animate-slide-up px-2 sm:px-0">
        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-violet-600 items-center justify-center mb-4 glow-purple">
              <Music size={30} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">MusicWorld Pro</h1>
            <p className="text-slate-400 text-sm mt-1">Sistema de Punto de Venta</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Usuario</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                placeholder="Ingresa tu usuario"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-violet-900/40"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn size={17} /> Iniciar Sesión</>
              )}
            </button>
          </form>

          {/* Quick Access */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-slate-500 text-xs text-center mb-3">Acceso rápido (demo)</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label:'Admin', user:'admin', pass:'admin123', color:'bg-violet-600/20 text-violet-400 border-violet-500/30' },
                { label:'Cajero', user:'cajero1', pass:'caj123', color:'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                { label:'Auxiliar', user:'auxiliar1', pass:'aux123', color:'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
              ].map(q => (
                <button key={q.label} onClick={() => quickLogin(q.user, q.pass)}
                  className={`border rounded-lg py-2 text-xs font-medium transition-all hover:opacity-80 ${q.color}`}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          MusicWorld Pro POS &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
