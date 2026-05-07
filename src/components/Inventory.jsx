import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Search, SlidersHorizontal, X, Check } from 'lucide-react';

import { fmt } from '../lib/format';

const REASONS = ['Conteo físico','Corrección de error','Merma','Donación','Otro'];

function StockBadge({ product }) {
  if (product.stock === 0) return <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs font-medium">🔴 Agotado</span>;
  if (product.stock <= product.stockMin) return <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-xs font-medium">🟠 Stock bajo</span>;
  if (product.stock >= product.stockMax) return <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs font-medium">🔵 Óptimo</span>;
  return <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-medium">🟢 Normal</span>;
}

function AdjustModal({ product, onClose }) {
  const { dispatch, toast, state } = useApp();
  const [newStock, setNewStock] = useState(product.stock);
  const [reason, setReason] = useState(REASONS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newStock === product.stock) { toast('No hubo cambio en el stock', 'warning'); return; }
    dispatch({
      type: 'ADJUST_INVENTORY',
      payload: { productId: product.id, newStock: parseInt(newStock), reason, userId: state.currentUser.id, userName: state.currentUser.name },
    });
    toast(`Stock ajustado a ${newStock} unidades`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Ajuste de inventario</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-white"/></button>
        </div>
        <p className="text-slate-300 text-sm mb-1 font-medium">{product.name}</p>
        <p className="text-slate-500 text-xs mb-4">Stock actual: <strong className="text-white">{product.stock}</strong></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nuevo stock</label>
            <input type="number" min="0" value={newStock} onChange={e => setNewStock(parseInt(e.target.value)||0)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500" required />
            {newStock !== product.stock && (
              <p className={`text-xs mt-1 ${newStock > product.stock ? 'text-emerald-400' : 'text-red-400'}`}>
                {newStock > product.stock ? `+${newStock - product.stock}` : `${newStock - product.stock}`} unidades
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Motivo del ajuste *</label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500">
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all">Cancelar</button>
            <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
              <Check size={15}/> Aplicar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Inventory() {
  const { state, hasPermission } = useApp();
  const canAdjust = hasPermission('adjust_inventory');
  const { products } = state;

  const [search, setSearch] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [adjustProduct, setAdjustProduct] = useState(null);

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (!p.active) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCat && p.category !== filterCat) return false;
      if (filterStock === 'zero' && p.stock !== 0) return false;
      if (filterStock === 'low' && (p.stock === 0 || p.stock > p.stockMin)) return false;
      if (filterStock === 'normal' && (p.stock <= p.stockMin || p.stock >= p.stockMax)) return false;
      if (filterStock === 'optimal' && p.stock < p.stockMax) return false;
      return true;
    });
  }, [products, search, filterCat, filterStock]);

  const summary = useMemo(() => ({
    total: products.filter(p => p.active).length,
    zero: products.filter(p => p.active && p.stock === 0).length,
    low: products.filter(p => p.active && p.stock > 0 && p.stock <= p.stockMin).length,
    normal: products.filter(p => p.active && p.stock > p.stockMin && p.stock < p.stockMax).length,
    optimal: products.filter(p => p.active && p.stock >= p.stockMax).length,
  }), [products]);

  const cats = [...new Set(products.map(p => p.category))];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Agotados',   val:'zero',    color:'red',   emoji:'🔴' },
          { label:'Stock bajo', val:'low',      color:'amber', emoji:'🟠' },
          { label:'Normal',     val:'normal',   color:'green', emoji:'🟢' },
          { label:'Óptimo',     val:'optimal',  color:'blue',  emoji:'🔵' },
        ].map(({ label, val, color, emoji }) => {
          const count = summary[val];
          return (
            <button key={val}
              onClick={() => setFilterStock(filterStock === val ? '' : val)}
              className={`bg-slate-800 border rounded-2xl p-4 text-left transition-all hover:border-slate-500 ${
                filterStock === val ? 'ring-2 ring-violet-500' : ''
              } ${
                color === 'red' ? 'border-red-500/30' : color === 'amber' ? 'border-amber-500/30' :
                color === 'green' ? 'border-emerald-500/30' : 'border-blue-500/30'
              }`}>
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-slate-400 text-xs mt-0.5">{emoji} {label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
            placeholder="Buscar producto..." />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
          <option value="">Categoría</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStock} onChange={e => setFilterStock(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
          <option value="">Todos</option>
          <option value="zero">Agotados</option>
          <option value="low">Stock bajo</option>
          <option value="normal">Normal</option>
          <option value="optimal">Óptimo</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-400 text-xs uppercase tracking-wide">
                {['Código','Producto','Categoría','Ubicación','Stock actual','Mínimo','Máximo','Estado','Valor','Ajuste'].map(h => (
                  <th key={h} className="text-left px-3 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-violet-400 text-xs">{p.sku}</td>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium text-sm truncate max-w-[180px]">{p.name}</p>
                    <p className="text-slate-500 text-xs">{p.brand}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{p.category}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{p.location}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-lg ${p.stock === 0 ? 'text-red-400' : p.stock <= p.stockMin ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{p.stockMin}</td>
                  <td className="px-4 py-3 text-slate-400">{p.stockMax}</td>
                  <td className="px-4 py-3"><StockBadge product={p}/></td>
                  <td className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">{fmt(p.stock * p.cost)}</td>
                  <td className="px-4 py-3">
                    {canAdjust ? (
                      <button onClick={() => setAdjustProduct(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-violet-600 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all">
                        <SlidersHorizontal size={12}/> Ajustar
                      </button>
                    ) : (
                      <span className="text-slate-600 text-xs px-3">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-slate-500 py-10">Sin productos</p>}
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between text-xs">
        <span className="text-slate-400">{filtered.length} productos mostrados</span>
        <span className="text-slate-400">Valor total inventario: <strong className="text-white">
          {fmt(filtered.reduce((s,p) => s + p.stock * p.cost, 0))}
        </strong></span>
      </div>

      {adjustProduct && <AdjustModal product={adjustProduct} onClose={() => setAdjustProduct(null)} />}
    </div>
  );
}
