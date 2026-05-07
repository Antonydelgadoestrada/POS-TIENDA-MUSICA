import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MODULE_PERMISSION } from './data/permissions';
import { DB_ENABLED } from './lib/supabase';
import { Music, AlertTriangle, RefreshCw } from 'lucide-react';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Products from './components/Products';
import Inventory from './components/Inventory';
import Mercaderia from './components/Mercaderia';
import Kardex from './components/Kardex';
import StockAlerts from './components/StockAlerts';
import CashRegister from './components/CashRegister';
import Sales from './components/Sales';
import Settings from './components/Settings';
import Users from './components/Users';

const MODULE_MAP = {
  dashboard:  Dashboard,
  pos:        POS,
  products:   Products,
  inventory:  Inventory,
  mercaderia: Mercaderia,
  kardex:     Kardex,
  alerts:     StockAlerts,
  cash:       CashRegister,
  sales:      Sales,
  settings:   Settings,
  users:      Users,
};

function AppContent() {
  const { state, hasPermission, dbLoading, dbError } = useApp();
  const { currentUser, activeModule } = state;

  if ((dbLoading || dbError) && DB_ENABLED) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mb-2">
          <Music size={24} className="text-white" />
        </div>
        {dbError ? (
          <>
            <AlertTriangle size={32} className="text-amber-400" />
            <p className="text-white font-bold text-lg">No se pudo conectar a la base de datos</p>
            <p className="text-slate-400 text-sm text-center max-w-sm bg-slate-800 rounded-xl p-3 font-mono">
              {dbError}
            </p>
            <p className="text-slate-500 text-xs text-center max-w-xs">
              Asegúrate de haber ejecutado el SQL schema en Supabase y que las variables de entorno estén configuradas.
            </p>
            <button onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-all">
              <RefreshCw size={16}/> Reintentar
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Conectando con Supabase...</p>
          </>
        )}
      </div>
    );
  }

  if (!currentUser) return <Login />;

  // Módulos a los que tiene acceso según sus permisos individuales
  const allowed = Object.keys(MODULE_MAP).filter(id => {
    const perm = MODULE_PERMISSION[id];
    return perm ? hasPermission(perm) : true;
  });

  const moduleId = allowed.includes(activeModule) ? activeModule : allowed[0] || 'dashboard';
  const ActiveModule = MODULE_MAP[moduleId] || Dashboard;

  return (
    <Layout>
      <ActiveModule />
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
