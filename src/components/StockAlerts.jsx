import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, PackagePlus, ArrowRight } from 'lucide-react';

export default function StockAlerts() {
  const { lowStockProducts, dispatch } = useApp();

  const sorted = [...lowStockProducts].sort((a, b) => a.stock - b.stock);
  const outOfStock = sorted.filter(p => p.stock === 0);
  const lowStock   = sorted.filter(p => p.stock > 0);

  const handleReorder = (product) => {
    dispatch({ type: 'SET_MODULE', payload: 'mercaderia' });
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Alertas de Stock</h2>
            <p className="text-slate-400 text-sm">{lowStockProducts.length} producto(s) requieren atención</p>
          </div>
        </div>
        <button onClick={() => dispatch({ type:'SET_MODULE', payload:'mercaderia' })}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
          <PackagePlus size={15} /> Registrar ingreso
        </button>
      </div>

      {lowStockProducts.length === 0 && (
        <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={30} className="text-emerald-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-1">¡Todo en orden!</h3>
          <p className="text-slate-400 text-sm">No hay productos con stock bajo en este momento.</p>
        </div>
      )}

      {/* Agotados */}
      {outOfStock.length > 0 && (
        <div>
          <h3 className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>
            Agotados ({outOfStock.length})
          </h3>
          <div className="space-y-2">
            {outOfStock.map(p => (
              <div key={p.id} className="bg-slate-800 border border-red-500/30 rounded-2xl px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-red-400 font-bold text-lg">{p.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{p.name}</p>
                    <p className="text-slate-500 text-xs truncate">{p.brand} · {p.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-center w-16 sm:w-20">
                    <p className="text-red-400 font-bold text-xl sm:text-2xl">0</p>
                    <p className="text-slate-500 text-[10px] sm:text-xs">en stock</p>
                  </div>
                  <div className="text-center w-16 sm:w-20">
                    <p className="text-slate-300 font-semibold">{p.stockMin}</p>
                    <p className="text-slate-500 text-[10px] sm:text-xs">mínimo</p>
                  </div>
                  <div className="text-center bg-red-500/10 rounded-xl px-3 py-2 w-20">
                    <p className="text-red-400 font-bold">-{p.stockMin}</p>
                    <p className="text-slate-500 text-[10px]">faltan</p>
                  </div>
                  <button onClick={() => handleReorder(p)}
                    className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap">
                    Reponer <ArrowRight size={13}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock bajo */}
      {lowStock.length > 0 && (
        <div>
          <h3 className="text-amber-400 font-bold text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>
            Stock bajo ({lowStock.length})
          </h3>
          <div className="space-y-2">
            {lowStock.map(p => {
              const diff = p.stockMin - p.stock;
              const pct = Math.round((p.stock / p.stockMin) * 100);
              return (
                <div key={p.id} className="bg-slate-800 border border-amber-500/20 rounded-2xl px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-amber-400 font-bold text-lg">{p.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold truncate">{p.name}</p>
                      <p className="text-slate-500 text-xs truncate">{p.brand} · {p.category}</p>
                      <div className="mt-1.5 h-1.5 bg-slate-700 rounded-full overflow-hidden max-w-[120px]">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${Math.min(pct,100)}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-center w-16 sm:w-20">
                      <p className="text-amber-400 font-bold text-xl sm:text-2xl">{p.stock}</p>
                      <p className="text-slate-500 text-[10px] sm:text-xs">en stock</p>
                    </div>
                    <div className="text-center w-16 sm:w-20">
                      <p className="text-slate-300 font-semibold">{p.stockMin}</p>
                      <p className="text-slate-500 text-[10px] sm:text-xs">mínimo</p>
                    </div>
                    <div className="text-center bg-amber-500/10 rounded-xl px-3 py-2 w-20">
                      <p className="text-amber-400 font-bold">-{diff}</p>
                      <p className="text-slate-500 text-[10px]">faltan</p>
                    </div>
                    <button onClick={() => handleReorder(p)}
                      className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap">
                      Reponer <ArrowRight size={13}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
