import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MODULE_PERMISSION } from '../data/permissions';
import { DB_ENABLED } from '../lib/supabase';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse, ArrowLeftRight,
  ClipboardList, AlertTriangle, Wallet, Settings, Users, LogOut,
  Music, ChevronRight, Bell, Receipt, Menu, X, MoreHorizontal,
} from 'lucide-react';

const MENU_ITEMS = [
  { id:'dashboard',   label:'Dashboard',       icon: LayoutDashboard },
  { id:'pos',         label:'Punto de Venta',  icon: ShoppingCart },
  { id:'products',    label:'Productos',        icon: Package },
  { id:'inventory',   label:'Inventario',       icon: Warehouse },
  { id:'mercaderia',  label:'Mercadería',       icon: ArrowLeftRight },
  { id:'kardex',      label:'Kardex',           icon: ClipboardList },
  { id:'alerts',      label:'Alertas Stock',    icon: AlertTriangle },
  { id:'cash',        label:'Caja',             icon: Wallet },
  { id:'sales',       label:'Ventas',           icon: Receipt },
  { id:'settings',    label:'Configuración',    icon: Settings },
  { id:'users',       label:'Usuarios',         icon: Users },
];

export default function Layout({ children }) {
  const { state, dispatch, cashBalance, lowStockProducts, hasPermission, dbError } = useApp();
  const { currentUser, activeModule, currentCashRegister, companyConfig } = state;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const visibleMenus   = useMemo(() => MENU_ITEMS.filter(m => {
    const perm = MODULE_PERMISSION[m.id];
    return perm ? hasPermission(perm) : true;
  }), [hasPermission]);
  const bottomNavItems = useMemo(() => visibleMenus.slice(0, 4), [visibleMenus]);
  const moreItems      = useMemo(() => visibleMenus.slice(4),    [visibleMenus]);

  // Cerrar drawer al cambiar de módulo
  useEffect(() => { setDrawerOpen(false); setMoreOpen(false); }, [activeModule]);

  // Cerrar drawer en desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setDrawerOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const roleColor = { ADMIN:'bg-violet-600', CAJERO:'bg-amber-500', AUXILIAR:'bg-emerald-500' };

  const NavItem = ({ item, onClick, compact = false }) => {
    const Icon = item.icon;
    const active = activeModule === item.id;
    const alertCount = item.id === 'alerts' ? lowStockProducts.length : 0;
    return (
      <button
        onClick={() => { dispatch({ type: 'SET_MODULE', payload: item.id }); onClick?.(); }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group w-full ${
          active ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
        }`}
      >
        <Icon size={17} className={active ? 'text-white' : 'text-slate-500 group-hover:text-violet-400'} />
        {!compact && <span className="flex-1 text-left">{item.label}</span>}
        {alertCount > 0 && (
          <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full badge-pulse">
            {alertCount}
          </span>
        )}
        {!compact && active && <ChevronRight size={14} className="text-violet-300" />}
      </button>
    );
  };

  // ── Contenido del sidebar (compartido entre desktop y drawer) ──────────────
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center glow-purple shrink-0">
          <Music size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white text-sm leading-tight truncate">{companyConfig.name}</p>
          <p className="text-slate-400 text-xs">Sistema POS</p>
        </div>
        {/* Cerrar drawer en móvil */}
        <button onClick={() => setDrawerOpen(false)} className="lg:hidden ml-auto text-slate-400 hover:text-white p-1">
          <X size={18}/>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleMenus.map(item => <NavItem key={item.id} item={item} />)}
      </nav>

      {/* User Card */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${roleColor[currentUser?.role]}`}>
            {currentUser?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{currentUser?.name}</p>
            <p className="text-slate-400 text-xs">{currentUser?.role}</p>
          </div>
          <button onClick={() => dispatch({ type: 'LOGOUT' })}
            className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded" title="Cerrar sesión">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex w-64 bg-slate-800 flex-col border-r border-slate-700 shrink-0">
        <SidebarContent />
      </aside>

      {/* ── MOBILE BACKDROP ── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40 animate-fade-in"
          onClick={() => setDrawerOpen(false)} />
      )}

      {/* ── MOBILE DRAWER ── */}
      <aside className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-slate-800 border-r border-slate-700 z-50 flex flex-col transition-transform duration-250 ease-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Banner estado de BD */}
        {(!DB_ENABLED || dbError) && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-400 flex items-center gap-2 shrink-0">
            <AlertTriangle size={12} className="shrink-0"/>
            <span className="font-semibold">Modo sin conexión</span>
            <span className="opacity-70 hidden sm:inline">
              {dbError
                ? ` — ${dbError}`
                : ' — variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no detectadas en el build.'}
            </span>
          </div>
        )}

        {/* HEADER */}
        <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-3 shrink-0">
          {/* Hamburger — solo móvil */}
          <button onClick={() => setDrawerOpen(true)} className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors">
            <Menu size={20}/>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-white font-semibold text-sm capitalize truncate">
              {MENU_ITEMS.find(m => m.id === activeModule)?.label || 'Dashboard'}
            </h1>
          </div>

          {/* Cash status */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
            currentCashRegister ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            <Wallet size={12} />
            <span className="hidden sm:inline">{currentCashRegister ? `S/ ${cashBalance.toFixed(2)}` : 'Caja cerrada'}</span>
            <span className="sm:hidden">{currentCashRegister ? `S/ ${cashBalance.toFixed(0)}` : '✕'}</span>
          </div>

          {/* Alerts badge */}
          {lowStockProducts.length > 0 && (
            <button onClick={() => dispatch({ type: 'SET_MODULE', payload: 'alerts' })}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-medium hover:bg-amber-500/30 transition-colors">
              <Bell size={12} />
              <span>{lowStockProducts.length}</span>
            </button>
          )}

          {/* User avatar — solo móvil */}
          <div className={`lg:hidden w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${roleColor[currentUser?.role]}`}>
            {currentUser?.name?.charAt(0)}
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6 animate-fade-in">
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-30 flex items-stretch">
        {bottomNavItems.map(item => {
          const Icon = item.icon;
          const active = activeModule === item.id;
          const alertCount = item.id === 'alerts' ? lowStockProducts.length : 0;
          return (
            <button key={item.id}
              onClick={() => dispatch({ type: 'SET_MODULE', payload: item.id })}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all relative ${
                active ? 'text-violet-400' : 'text-slate-500 active:text-slate-300'
              }`}>
              <div className="relative">
                <Icon size={20} />
                {alertCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {alertCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label.split(' ')[0]}</span>
              {active && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-violet-500 rounded-b-full"/>}
            </button>
          );
        })}

        {/* Botón "Más" si hay ítems extra */}
        {moreItems.length > 0 && (
          <button onClick={() => setMoreOpen(!moreOpen)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all ${
              moreItems.some(m => m.id === activeModule) ? 'text-violet-400' : 'text-slate-500'
            }`}>
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-medium leading-none">Más</span>
            {moreItems.some(m => m.id === activeModule) && (
              <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-violet-500 rounded-b-full"/>
            )}
          </button>
        )}
      </nav>

      {/* ── BOTTOM SHEET "MÁS" ── */}
      {moreOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMoreOpen(false)} />
          <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-slate-800 border-t border-slate-700 z-50 rounded-t-2xl animate-slide-up p-4">
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4"/>
            <div className="grid grid-cols-3 gap-2">
              {moreItems.map(item => {
                const Icon = item.icon;
                const active = activeModule === item.id;
                return (
                  <button key={item.id}
                    onClick={() => { dispatch({ type: 'SET_MODULE', payload: item.id }); setMoreOpen(false); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                      active ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 active:bg-slate-600'
                    }`}>
                    <Icon size={22} />
                    <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* TOASTS */}
      <div className="fixed bottom-20 lg:bottom-6 right-3 lg:right-6 z-50 space-y-2 pointer-events-none max-w-xs">
        {state.toasts.map(t => (
          <div key={t.id} className={`animate-slide-up px-4 py-3 rounded-xl shadow-2xl text-sm font-medium pointer-events-auto ${
            t.type === 'success' ? 'bg-emerald-600 text-white' :
            t.type === 'error'   ? 'bg-red-600 text-white' :
            t.type === 'warning' ? 'bg-amber-500 text-white' :
            'bg-slate-700 text-white'
          }`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
