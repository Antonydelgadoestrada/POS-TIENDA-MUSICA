import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Save, Plus, Trash2, X, Check, Settings as SettingsIcon, AlertTriangle, RotateCcw } from 'lucide-react';

function ResetModal({ onClose, onConfirm }) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 animate-fade-in sm:p-4">
      <div className="bg-slate-800 border border-red-500/40 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md animate-slide-up">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} className="text-red-400"/>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Reiniciar sistema</h3>
              <p className="text-slate-400 text-xs">Esta acción no se puede deshacer</p>
            </div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm space-y-1.5">
            <p className="text-red-400 font-semibold">Se eliminará permanentemente:</p>
            {['Todas las ventas registradas','Todos los movimientos de caja','Todo el historial de kardex','Ingresos y salidas de mercadería','Historial de cierres de caja'].map(item => (
              <p key={item} className="text-slate-400 flex items-center gap-2"><X size={12} className="text-red-400 shrink-0"/> {item}</p>
            ))}
            <p className="text-emerald-400 font-semibold mt-2">Se conservará:</p>
            {['Productos y precios','Configuración de empresa','Usuarios y contraseñas'].map(item => (
              <p key={item} className="text-slate-400 flex items-center gap-2"><Check size={12} className="text-emerald-400 shrink-0"/> {item}</p>
            ))}
          </div>
          <button type="button" onClick={() => setConfirmed(!confirmed)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${confirmed ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${confirmed ? 'bg-red-500 border-red-500' : 'border-slate-600'}`}>
              {confirmed && <Check size={12} className="text-white"/>}
            </div>
            <span className="text-sm font-medium">Entiendo que se eliminarán todos los datos operativos</span>
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all">Cancelar</button>
            <button onClick={onConfirm} disabled={!confirmed}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
              <RotateCcw size={15}/> Reiniciar ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { state, dispatch, toast, hasPermission } = useApp();
  const { companyConfig } = state;
  const canReset = hasPermission('reset_data');
  const [form, setForm] = useState({ ...companyConfig });
  const [newCat, setNewCat] = useState('');
  const [tab, setTab] = useState('company');
  const [showReset, setShowReset] = useState(false);

  const handleReset = () => {
    dispatch({ type: 'RESET_ALL_DATA', payload: { keepUser: true } });
    toast('Sistema reiniciado a datos iniciales', 'success');
    setShowReset(false);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    dispatch({ type:'UPDATE_CONFIG', payload: form });
    toast('Configuración guardada', 'success');
  };

  const addCategory = () => {
    const cat = newCat.trim();
    if (!cat || form.categories.includes(cat)) return;
    set('categories', [...form.categories, cat]);
    setNewCat('');
  };

  const removeCategory = (cat) => {
    set('categories', form.categories.filter(c => c !== cat));
  };

  const togglePayment = (method) => {
    if (form.paymentMethods.includes(method)) {
      set('paymentMethods', form.paymentMethods.filter(m => m !== method));
    } else {
      set('paymentMethods', [...form.paymentMethods, method]);
    }
  };

  const ALL_PAYMENTS = ['Efectivo','Tarjeta','Yape','Plin'];

  const tabs = [
    { id:'company',  label:'Empresa' },
    { id:'taxes',    label:'Impuestos' },
    { id:'categories', label:'Categorías' },
    { id:'payments', label:'Métodos de pago' },
  ];

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center">
          <SettingsIcon size={20} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg">Configuración del Sistema</h2>
          <p className="text-slate-400 text-sm">Administra los parámetros generales</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 overflow-x-auto gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 sm:flex-1 px-3 sm:px-0 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab===t.id ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        {/* Company */}
        {tab === 'company' && (
          <div className="space-y-4">
            <h3 className="text-white font-bold mb-4">Datos de la empresa</h3>
            {[
              ['Nombre de la empresa', 'name'], ['RUC / NIT', 'ruc'],
              ['Dirección', 'address'], ['Teléfono', 'phone'], ['Email', 'email'],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <input value={form[key]||''} onChange={e => set(key, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
              </div>
            ))}
          </div>
        )}

        {/* Taxes */}
        {tab === 'taxes' && (
          <div className="space-y-4">
            <h3 className="text-white font-bold mb-4">Configuración de impuestos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nombre del impuesto</label>
                <input value={form.taxName||''} onChange={e => set('taxName', e.target.value)}
                  placeholder="IGV, IVA, VAT..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Porcentaje (%)</label>
                <input type="number" min="0" max="100" step="0.01" value={form.taxRate||0} onChange={e => set('taxRate', parseFloat(e.target.value)||0)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 text-sm">
              <p className="text-slate-400">Vista previa: Para una venta de <strong className="text-white">$100.00</strong>, el {form.taxName} ({form.taxRate}%) sería <strong className="text-violet-400">${(100 * form.taxRate / 100).toFixed(2)}</strong></p>
            </div>
          </div>
        )}

        {/* Categories */}
        {tab === 'categories' && (
          <div className="space-y-4">
            <h3 className="text-white font-bold mb-4">Categorías de productos</h3>
            <div className="flex gap-2">
              <input value={newCat} onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                placeholder="Nueva categoría..."
                className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
              <button onClick={addCategory}
                className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-1">
                <Plus size={16}/>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.categories.map(cat => (
                <span key={cat} className="flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-sm">
                  {cat}
                  <button onClick={() => removeCategory(cat)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <X size={13}/>
                  </button>
                </span>
              ))}
            </div>
            <p className="text-slate-500 text-xs">{form.categories.length} categorías registradas</p>
          </div>
        )}

        {/* Payment methods */}
        {tab === 'payments' && (
          <div className="space-y-4">
            <h3 className="text-white font-bold mb-4">Métodos de pago habilitados</h3>
            <div className="grid grid-cols-2 gap-3">
              {ALL_PAYMENTS.map(method => {
                const enabled = form.paymentMethods.includes(method);
                return (
                  <button key={method} onClick={() => togglePayment(method)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      enabled ? 'bg-violet-600/20 border-violet-500/50 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${enabled ? 'border-violet-500 bg-violet-500' : 'border-slate-600'}`}>
                      {enabled && <Check size={13} className="text-white"/>}
                    </div>
                    <span className="font-medium">{method}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={handleSave}
          className="mt-6 w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
          <Save size={17}/> Guardar cambios
        </button>
      </div>

      {/* Zona de peligro — Reinicio (solo si tiene permiso reset_data) */}
      {canReset && (
        <div className="bg-slate-800 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <RotateCcw size={18} className="text-red-400"/>
              </div>
              <div>
                <h3 className="text-red-400 font-bold text-sm">Reiniciar datos del sistema</h3>
                <p className="text-slate-500 text-xs mt-0.5">Elimina ventas, caja y kardex. Conserva productos, config y usuarios.</p>
              </div>
            </div>
            <button onClick={() => setShowReset(true)}
              className="shrink-0 bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
              <RotateCcw size={14}/> Reiniciar
            </button>
          </div>
        </div>
      )}

      {showReset && <ResetModal onClose={() => setShowReset(false)} onConfirm={handleReset} />}
    </div>
  );
}

