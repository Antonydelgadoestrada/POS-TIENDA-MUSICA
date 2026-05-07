import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search, Eye, XCircle, RotateCcw, ChevronDown, ChevronUp,
  ShoppingBag, CheckCircle, AlertTriangle, X, Check, Minus, Plus,
} from 'lucide-react';

import { fmt } from '../lib/format';

// ── Colores por estado ────────────────────────────────────────────────────────
const STATUS_STYLE = {
  ACTIVA:          'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  ANULADA:         'bg-red-500/20 text-red-400 border-red-500/30',
  DEVOLUCION:      'bg-amber-500/20 text-amber-400 border-amber-500/30',
};
const STATUS_LABEL = { ACTIVA:'Activa', ANULADA:'Anulada', DEVOLUCION:'Devolución' };

// ── Modal de Anulación ────────────────────────────────────────────────────────
function CancelModal({ sale, onClose }) {
  const { dispatch, toast, state } = useApp();
  const [restoreStock, setRestoreStock] = useState(true);
  const [reason, setReason] = useState('');

  const hasPhysicalItems = sale.items.some(item => {
    const prod = state.products.find(p => p.id === item.productId);
    return prod && prod.type !== 'SERVICIO';
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({
      type: 'CANCEL_SALE',
      payload: { saleId: sale.id, restoreStock: hasPhysicalItems && restoreStock, reason, userId: state.currentUser.id, userName: state.currentUser.name },
    });
    toast(`Venta ${sale.id} anulada correctamente`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 animate-fade-in sm:p-4">
      <div className="bg-slate-800 border border-red-500/30 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <XCircle size={20} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Anular venta</h3>
              <p className="text-slate-400 text-xs">{sale.id} — {fmt(sale.total)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Items de la venta */}
          <div className="bg-slate-900 rounded-xl p-3 space-y-1.5">
            {sale.items.map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-slate-300">{item.name} × {item.qty}</span>
                <span className="text-slate-400">{fmt(item.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold border-t border-slate-700 pt-2 mt-2">
              <span className="text-white">Total</span>
              <span className="text-red-400">{fmt(sale.total)}</span>
            </div>
          </div>

          {/* Restaurar stock */}
          {hasPhysicalItems && (
            <button type="button" onClick={() => setRestoreStock(!restoreStock)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${restoreStock ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${restoreStock ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                {restoreStock && <Check size={12} className="text-white"/>}
              </div>
              <div>
                <p className="font-semibold text-sm">Restaurar stock de productos</p>
                <p className="text-xs opacity-70">Los ítems volverán al inventario</p>
              </div>
            </button>
          )}

          {/* Motivo */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Motivo de anulación *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} required rows={2}
              placeholder="Ej: Error en precio, solicitud del cliente..."
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 resize-none" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all">Cancelar</button>
            <button type="submit" className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
              <XCircle size={15}/> Confirmar Anulación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal de Devolución ───────────────────────────────────────────────────────
function ReturnModal({ sale, onClose }) {
  const { dispatch, toast, state } = useApp();
  const [selected, setSelected] = useState(
    sale.items.reduce((acc, item) => ({ ...acc, [item.productId + '_' + item.name]: { checked: false, qty: 1, max: item.qty, price: item.price, productId: item.productId, name: item.name } }), {})
  );
  const [restoreStock, setRestoreStock] = useState(true);
  const [reason, setReason] = useState('');

  const toggleItem = (key) => setSelected(prev => ({ ...prev, [key]: { ...prev[key], checked: !prev[key].checked } }));
  const setQty = (key, qty) => setSelected(prev => ({ ...prev, [key]: { ...prev[key], qty: Math.max(1, Math.min(qty, prev[key].max)) } }));

  const returnedItems = Object.entries(selected).filter(([, v]) => v.checked).map(([, v]) => ({
    productId: v.productId, name: v.name, qty: v.qty, price: v.price,
  }));

  const returnSubtotal = returnedItems.reduce((s, i) => s + i.qty * i.price, 0);
  const returnTotal = returnSubtotal * (1 + (sale.taxRate || 18) / 100);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (returnedItems.length === 0) { toast('Selecciona al menos un ítem', 'warning'); return; }
    dispatch({
      type: 'RETURN_ITEMS',
      payload: { saleId: sale.id, returnedItems, restoreStock, reason, userId: state.currentUser.id, userName: state.currentUser.name },
    });
    toast(`Devolución registrada — ${fmt(returnTotal)}`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 animate-fade-in sm:p-4">
      <div className="bg-slate-800 border border-amber-500/30 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <RotateCcw size={20} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Devolución de productos</h3>
              <p className="text-slate-400 text-xs">{sale.id} — Selecciona los ítems a devolver</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* Ítems seleccionables */}
          {sale.items.map((item, i) => {
            const key = item.productId + '_' + item.name;
            const sel = selected[key];
            const prod = state.products.find(p => p.id === item.productId);
            const isService = prod?.type === 'SERVICIO';
            return (
              <div key={i} className={`rounded-xl border p-3 transition-all ${sel.checked ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-700 bg-slate-900'}`}>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => toggleItem(key)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${sel.checked ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>
                    {sel.checked && <Check size={11} className="text-white"/>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.name}</p>
                    <p className="text-slate-500 text-xs">{fmt(item.price)} × {item.qty} vendidos {isService && '· Servicio (no afecta stock)'}</p>
                  </div>
                  <span className="text-slate-300 text-sm font-bold shrink-0">{fmt(item.subtotal)}</span>
                </div>
                {sel.checked && (
                  <div className="flex items-center gap-3 mt-3 pl-8">
                    <span className="text-slate-400 text-xs">Cant. a devolver:</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setQty(key, sel.qty - 1)} className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300"><Minus size={11}/></button>
                      <span className="text-white font-bold w-6 text-center text-sm">{sel.qty}</span>
                      <button type="button" onClick={() => setQty(key, sel.qty + 1)} className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300"><Plus size={11}/></button>
                    </div>
                    <span className="text-amber-400 text-xs font-semibold">{fmt(sel.qty * item.price)}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Total devolución */}
          {returnedItems.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex justify-between text-sm">
              <span className="text-amber-400 font-semibold">Total a devolver (c/IGV)</span>
              <span className="text-amber-400 font-bold">{fmt(returnTotal)}</span>
            </div>
          )}

          {/* Restaurar stock */}
          <button type="button" onClick={() => setRestoreStock(!restoreStock)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${restoreStock ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${restoreStock ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
              {restoreStock && <Check size={12} className="text-white"/>}
            </div>
            <div>
              <p className="font-semibold text-sm">Restaurar stock al inventario</p>
              <p className="text-xs opacity-70">Los ítems devueltos vuelven al almacén</p>
            </div>
          </button>

          {/* Motivo */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Motivo de devolución *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} required rows={2}
              placeholder="Ej: Producto defectuoso, talla incorrecta..."
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 resize-none" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all">Cancelar</button>
            <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
              <RotateCcw size={15}/> Registrar Devolución
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal de Detalle ──────────────────────────────────────────────────────────
function DetailModal({ sale, onClose, onCancel, onReturn }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 animate-fade-in sm:p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-lg font-mono">{sale.id}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[sale.status] || STATUS_STYLE.ACTIVA}`}>
                {STATUS_LABEL[sale.status] || sale.status}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">{new Date(sale.createdAt).toLocaleString('es-PE')} · {sale.userName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white shrink-0"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Items */}
          <table className="w-full text-sm">
            <thead><tr className="text-slate-500 text-xs border-b border-slate-700">
              <th className="text-left pb-2">Producto</th><th className="text-center pb-2">Cant</th><th className="text-right pb-2">P. Unit</th><th className="text-right pb-2">Subtotal</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {sale.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2 text-white text-xs">{item.name}</td>
                  <td className="py-2 text-slate-400 text-xs text-center">{item.qty}</td>
                  <td className="py-2 text-slate-400 text-xs text-right">{fmt(item.price)}</td>
                  <td className="py-2 text-white text-xs font-medium text-right">{fmt(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <div className="bg-slate-900 rounded-xl p-3 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{fmt(sale.subtotal)}</span></div>
            {sale.discount > 0 && <div className="flex justify-between text-emerald-400"><span>Descuento</span><span>-{fmt(sale.discount)}</span></div>}
            <div className="flex justify-between text-slate-400"><span>IGV {sale.taxRate}%</span><span>{fmt(sale.tax)}</span></div>
            <div className="flex justify-between text-white font-bold text-base border-t border-slate-700 pt-2"><span>TOTAL</span><span className="text-violet-400">{fmt(sale.total)}</span></div>
            <div className="flex justify-between text-slate-500"><span>Método</span><span>{sale.paymentSummary}</span></div>
          </div>

          {/* Anulación info */}
          {sale.cancellation && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs">
              <p className="text-red-400 font-semibold mb-1">Anulada por {sale.cancellation.cancelledByName}</p>
              <p className="text-slate-400">{new Date(sale.cancellation.cancelledAt).toLocaleString('es-PE')}</p>
              <p className="text-slate-400 mt-1">Motivo: {sale.cancellation.reason}</p>
              {sale.cancellation.restoreStock && <p className="text-emerald-400 mt-1">✓ Stock restaurado</p>}
            </div>
          )}

          {/* Devoluciones info */}
          {sale.returns?.map((ret, i) => (
            <div key={i} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs">
              <p className="text-amber-400 font-semibold mb-1">Devolución por {ret.returnedByName}</p>
              <p className="text-slate-400">{new Date(ret.returnedAt).toLocaleString('es-PE')} — {fmt(ret.amount)}</p>
              <p className="text-slate-400 mt-1">Motivo: {ret.reason}</p>
              {ret.restoreStock && <p className="text-emerald-400 mt-1">✓ Stock restaurado</p>}
            </div>
          ))}

          {/* Actions */}
          {sale.status === 'ACTIVA' && (onReturn || onCancel) && (
            <div className="flex gap-3 pt-2">
              {onReturn && (
                <button onClick={onReturn} className="flex-1 bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-white py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
                  <RotateCcw size={14}/> Devolución
                </button>
              )}
              {onCancel && (
                <button onClick={onCancel} className="flex-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
                  <XCircle size={14}/> Anular
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Sales() {
  const { state, hasPermission } = useApp();
  const { sales } = state;
  const canCancel = hasPermission('cancel_sales');
  const canReturn = hasPermission('return_items');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCajero, setFilterCajero] = useState('');

  const [modalDetail, setModalDetail] = useState(null);
  const [modalCancel, setModalCancel] = useState(null);
  const [modalReturn, setModalReturn] = useState(null);

  const cajeros = useMemo(() => [...new Set(sales.map(s => s.userName))], [sales]);

  const filtered = useMemo(() => {
    return [...sales].reverse().filter(s => {
      if (search && !s.id.toLowerCase().includes(search.toLowerCase()) && !s.userName.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      if (filterDate && !s.createdAt.startsWith(filterDate)) return false;
      if (filterCajero && s.userName !== filterCajero) return false;
      return true;
    });
  }, [sales, search, filterStatus, filterDate, filterCajero]);

  const stats = useMemo(() => ({
    total: sales.length,
    activas: sales.filter(s => s.status === 'ACTIVA').length,
    anuladas: sales.filter(s => s.status === 'ANULADA').length,
    devoluciones: sales.filter(s => s.status === 'DEVOLUCION').length,
    montoActivo: sales.filter(s => s.status === 'ACTIVA').reduce((s, v) => s + v.total, 0),
  }), [sales]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Total ventas',    value: stats.total,                  sub: 'registradas',           color:'slate' },
          { label:'Ventas activas',  value: stats.activas,                sub: fmt(stats.montoActivo),  color:'emerald' },
          { label:'Anuladas',        value: stats.anuladas,               sub: 'canceladas',            color:'red' },
          { label:'Con devolución',  value: stats.devoluciones,           sub: 'devoluciones parciales',color:'amber' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className={`bg-slate-800 border rounded-2xl p-4 ${color === 'emerald' ? 'border-emerald-500/30' : color === 'red' ? 'border-red-500/30' : color === 'amber' ? 'border-amber-500/30' : 'border-slate-700'}`}>
            <p className={`text-2xl font-bold ${color === 'emerald' ? 'text-emerald-400' : color === 'red' ? 'text-red-400' : color === 'amber' ? 'text-amber-400' : 'text-white'}`}>{value}</p>
            <p className="text-white text-xs font-semibold mt-0.5">{label}</p>
            <p className="text-slate-500 text-xs">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
            placeholder="Buscar N° venta o cajero..." />
        </div>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
        <select value={filterCajero} onChange={e => setFilterCajero(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
          <option value="">Todos los cajeros</option>
          {cajeros.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
          <option value="">Todos los estados</option>
          <option value="ACTIVA">Activas</option>
          <option value="ANULADA">Anuladas</option>
          <option value="DEVOLUCION">Con devolución</option>
        </select>
        {(search || filterDate || filterStatus || filterCajero) && (
          <button onClick={() => { setSearch(''); setFilterDate(''); setFilterStatus(''); setFilterCajero(''); }}
            className="text-xs text-slate-400 hover:text-white px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl transition-colors flex items-center gap-1">
            <X size={13}/> Limpiar
          </button>
        )}
      </div>

      <p className="text-slate-500 text-xs">{filtered.length} venta(s) encontradas</p>

      {/* Tabla */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-400 text-xs uppercase tracking-wide">
                {['N° Venta','Fecha','Hora','Cajero','Ítems','Descuento','IGV','Total','Método','Estado','Acciones'].map(h => (
                  <th key={h} className="text-left px-3 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map(sale => (
                <tr key={sale.id} className={`hover:bg-slate-700/30 transition-colors ${sale.status === 'ANULADA' ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-mono text-violet-400 font-semibold whitespace-nowrap">{sale.id}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs whitespace-nowrap">{new Date(sale.createdAt).toLocaleDateString('es-PE')}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(sale.createdAt).toLocaleTimeString('es-PE', {hour:'2-digit',minute:'2-digit'})}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs whitespace-nowrap">{sale.userName}</td>
                  <td className="px-4 py-3 text-center text-slate-400 text-xs">{sale.items.length}</td>
                  <td className="px-4 py-3 text-emerald-400 text-xs whitespace-nowrap">{sale.discount > 0 ? `-${fmt(sale.discount)}` : '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmt(sale.tax)}</td>
                  <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{fmt(sale.total)}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">{sale.paymentSummary}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[sale.status] || STATUS_STYLE.ACTIVA}`}>
                      {STATUS_LABEL[sale.status] || sale.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setModalDetail(sale)}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-all" title="Ver detalle">
                        <Eye size={13}/>
                      </button>
                      {sale.status === 'ACTIVA' && canReturn && (
                        <button onClick={() => { setModalDetail(null); setModalReturn(sale); }}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-amber-600/40 text-slate-400 hover:text-amber-400 transition-all" title="Devolución">
                          <RotateCcw size={13}/>
                        </button>
                      )}
                      {sale.status === 'ACTIVA' && canCancel && (
                        <button onClick={() => { setModalDetail(null); setModalCancel(sale); }}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-600/40 text-slate-400 hover:text-red-400 transition-all" title="Anular">
                          <XCircle size={13}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-14">
              <ShoppingBag size={36} className="text-slate-700 mx-auto mb-3"/>
              <p className="text-slate-500 text-sm">No se encontraron ventas</p>
            </div>
          )}
        </div>
        {/* Total filtrado */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
            <span>{filtered.filter(s => s.status === 'ACTIVA').length} activas · {filtered.filter(s => s.status === 'ANULADA').length} anuladas</span>
            <span className="font-bold text-white">
              Total activo: <span className="text-emerald-400">{fmt(filtered.filter(s => s.status === 'ACTIVA').reduce((s, v) => s + v.total, 0))}</span>
            </span>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalDetail && (
        <DetailModal
          sale={modalDetail}
          onClose={() => setModalDetail(null)}
          onCancel={canCancel ? () => { setModalCancel(modalDetail); setModalDetail(null); } : null}
          onReturn={canReturn ? () => { setModalReturn(modalDetail); setModalDetail(null); } : null}
        />
      )}
      {modalCancel && <CancelModal sale={modalCancel} onClose={() => setModalCancel(null)} />}
      {modalReturn && <ReturnModal sale={modalReturn} onClose={() => setModalReturn(null)} />}
    </div>
  );
}
