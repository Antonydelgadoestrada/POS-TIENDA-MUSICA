import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MODULE_PERMISSION } from './data/permissions';
import { DB_ENABLED } from './lib/supabase';
import { Music } from 'lucide-react';
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
  const { state, hasPermission, dbLoading } = useApp();
  const { currentUser, activeModule } = state;

  if (dbLoading && DB_ENABLED) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mb-2">
          <Music size={24} className="text-white" />
        </div>
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Cargando datos...</p>
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
