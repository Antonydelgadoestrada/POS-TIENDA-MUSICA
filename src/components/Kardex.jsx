import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Search, ArrowUpCircle, ArrowDownCircle, SlidersHorizontal } from 'lucide-react';

import { fmt } from '../lib/format';

export default function Kardex() {
  const { state } = useApp();
  const { kardex, products } = state;

  const [selectedProduct, setSelectedProduct] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const productSearch = useMemo(() => {
    if (!search) return products.filter(p => p.active);
    return products.filter(p => p.active && (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    ));
  }, [products, search]);

  const selectedProd = products.find(p => p.id === selectedProduct);

  const filteredKardex = useMemo(() => {
    if (!selectedProduct) return [];
    return kardex.filter(k => {
      if (k.productId !== selectedProduct) return false;
      if (filterType && k.type !== filterType) return false;
      if (dateFrom && new Date(k.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(k.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    }).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [kardex, selectedProduct, filterType, dateFrom, dateTo]);

  const summary = useMemo(() => ({
    totalIn: filteredKardex.reduce((s,k) => s + k.qtyIn, 0),
    totalOut: filteredKardex.reduce((s,k) => s + k.qtyOut, 0),
    valorized: (selectedProd?.stock || 0) * (selectedProd?.cost || 0),
  }), [filteredKardex, selectedProd]);

  const typeColor = (type) => {
    if (type === 'ENTRADA') return 'bg-emerald-500/20 text-emerald-400';
    if (type === 'SALIDA')  return 'bg-red-500/20 text-red-400';
    return 'bg-blue-500/20 text-blue-400';
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Product selector */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3 lg:sticky lg:top-0">
            <h3 className="text-white font-bold text-sm">Seleccionar producto</h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-violet-500" />
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {productSearch.map(p => (
                <button key={p.id} onClick={() => setSelectedProduct(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${
                    selectedProduct === p.id ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}>
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-slate-500 text-[10px]">{p.sku} · Stock: {p.stock}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Kardex content */}
        <div className="lg:col-span-3 space-y-4">
          {!selectedProduct ? (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center h-64">
              <div className="text-center">
                <SlidersHorizontal size={36} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Selecciona un producto para ver su kardex</p>
              </div>
            </div>
          ) : (
            <>
              {/* Selected product header */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-white font-bold text-base">{selectedProd?.name}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">{selectedProd?.brand} · {selectedProd?.category} · SKU: {selectedProd?.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-violet-400 font-bold text-xl">{selectedProd?.stock} uds</p>
                    <p className="text-slate-500 text-xs">Stock actual · {fmt(summary.valorized)} valorizado</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label:'Total entradas', val:summary.totalIn, color:'text-emerald-400' },
                    { label:'Total salidas',  val:summary.totalOut, color:'text-red-400' },
                    { label:'Movimientos',    val:filteredKardex.length, color:'text-white' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="bg-slate-900 rounded-xl p-3 text-center">
                      <p className={`font-bold text-lg ${color}`}>{val}</p>
                      <p className="text-slate-500 text-xs">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-3 flex-wrap">
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none">
                  <option value="">Todos los tipos</option>
                  <option value="ENTRADA">Entradas</option>
                  <option value="SALIDA">Salidas</option>
                  <option value="AJUSTE">Ajustes</option>
                </select>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                {(filterType || dateFrom || dateTo) && (
                  <button onClick={() => { setFilterType(''); setDateFrom(''); setDateTo(''); }}
                    className="text-xs text-slate-400 hover:text-white px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl transition-colors">
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Kardex table */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[750px]">
                    <thead className="bg-slate-900/60">
                      <tr className="text-slate-400 uppercase tracking-wide">
                        {['Fecha/Hora','Tipo','Concepto','Referencia','Usuario','Entrada','Salida','Stock ant.','Stock result.','P. Unit','Total'].map(h => (
                          <th key={h} className="text-left px-3 py-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {filteredKardex.map(k => (
                        <tr key={k.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-3 py-3 whitespace-nowrap text-slate-400">
                            {new Date(k.createdAt).toLocaleDateString('es-PE')}<br/>
                            <span className="text-slate-600">{new Date(k.createdAt).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' })}</span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor(k.type)}`}>
                              {k.type}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-slate-300 whitespace-nowrap">{k.concept}</td>
                          <td className="px-3 py-3 font-mono text-violet-400">{k.reference}</td>
                          <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{k.userName}</td>
                          <td className="px-3 py-3 text-emerald-400 font-bold text-center">
                            {k.qtyIn > 0 ? <span className="flex items-center gap-1"><ArrowUpCircle size={12}/>{k.qtyIn}</span> : '—'}
                          </td>
                          <td className="px-3 py-3 text-red-400 font-bold text-center">
                            {k.qtyOut > 0 ? <span className="flex items-center gap-1"><ArrowDownCircle size={12}/>{k.qtyOut}</span> : '—'}
                          </td>
                          <td className="px-3 py-3 text-slate-500 text-center">{k.stockBefore}</td>
                          <td className="px-3 py-3 font-bold text-white text-center">{k.stockAfter}</td>
                          <td className="px-3 py-3 text-slate-400">{fmt(k.unitCost)}</td>
                          <td className="px-3 py-3 font-semibold text-slate-200">{fmt(k.totalValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredKardex.length === 0 && (
                    <p className="text-center text-slate-500 py-10">Sin movimientos para los filtros seleccionados</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
