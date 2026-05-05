import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, X, PackagePlus, PackageMinus, History, Search } from 'lucide-react';

const fmt = n => `S/ ${Number(n||0).toFixed(2)}`;
const OUT_REASONS = ['Devolución a proveedor','Préstamo','Muestra','Deterioro','Pérdida','Otro'];

// ── Combobox de búsqueda de productos ────────────────────────────────────────
function ProductCombobox({ value, products, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selected = products.find(p => p.id === value);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = products.filter(p => p.active);
    if (!q) return pool.slice(0, 8);
    return pool.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [products, query]);

  const handleSelect = (product) => {
    onChange('productId', product.id);
    setQuery('');
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    onChange('productId', '');
    setOpen(true);
  };

  const handleBlur = (e) => {
    // solo cerrar si el foco no va al listado
    if (listRef.current && listRef.current.contains(e.relatedTarget)) return;
    setOpen(false);
    setQuery('');
  };

  const displayValue = open ? query : (selected ? selected.name : query);

  return (
    <div className="relative flex-1">
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          placeholder="Buscar por nombre, SKU o marca..."
          className={`w-full bg-slate-800 border text-white rounded-lg pl-7 pr-3 py-2 text-xs focus:outline-none transition-colors ${
            selected ? 'border-violet-500/60' : 'border-slate-700 focus:border-violet-500'
          }`}
        />
      </div>

      {open && suggestions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-30 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto"
        >
          {suggestions.map(p => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => handleSelect(p)}
              className="w-full text-left px-3 py-2.5 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">{p.name}</p>
                  <p className="text-slate-500 text-[10px]">{p.sku} · {p.brand} · {p.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-violet-400 text-xs font-bold">{fmt(p.price)}</p>
                  <p className={`text-[10px] font-medium ${p.stock === 0 ? 'text-red-400' : p.stock <= p.stockMin ? 'text-amber-400' : 'text-emerald-400'}`}>
                    Stock: {p.stock}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.length > 1 && suggestions.length === 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-xs text-slate-500 shadow-xl">
          Sin resultados para "{query}"
        </div>
      )}
    </div>
  );
}

// ── Fila de producto en el formulario ────────────────────────────────────────
function ItemRow({ item, products, onChange, onRemove, showCost = true }) {
  const prod = products.find(p => p.id === item.productId);
  return (
    <div className="flex gap-2 items-center bg-slate-900 rounded-xl p-2.5">
      <ProductCombobox
        value={item.productId}
        products={products}
        onChange={onChange}
      />
      <input
        type="number" min="1" placeholder="Cant"
        value={item.qty}
        onChange={e => onChange('qty', parseInt(e.target.value)||1)}
        className="w-16 bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-2 text-xs text-center focus:outline-none"
      />
      {showCost && (
        <input
          type="number" min="0" step="0.01" placeholder="Costo"
          value={item.cost}
          onChange={e => onChange('cost', parseFloat(e.target.value)||0)}
          className="w-24 bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-2 text-xs text-center focus:outline-none"
        />
      )}
      <span className="text-slate-400 text-xs w-20 text-right shrink-0">
        {showCost ? fmt(item.qty * item.cost) : (prod ? fmt(item.qty * prod.cost) : '—')}
      </span>
      <button type="button" onClick={onRemove} className="text-slate-600 hover:text-red-400 ml-1 shrink-0">
        <Trash2 size={14}/>
      </button>
    </div>
  );
}

// ── Formulario de ingreso ─────────────────────────────────────────────────────
function GoodsInForm({ products, onSubmit, onCancel, currentUser }) {
  const [supplier, setSupplier] = useState('');
  const [docNum, setDocNum] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0,10));
  const [items, setItems] = useState([{ productId:'', qty:1, cost:0 }]);

  const updateItem = (i, field, val) => setItems(prev => prev.map((it,idx) => idx===i ? {...it,[field]:val} : it));
  const addItem    = () => setItems(prev => [...prev, { productId:'', qty:1, cost:0 }]);
  const removeItem = (i) => setItems(prev => prev.filter((_,idx) => idx!==i));
  const total = items.reduce((s,i) => s + i.qty * i.cost, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validItems = items.filter(i => i.productId && i.qty > 0);
    if (!supplier || validItems.length === 0) return;
    onSubmit({ supplier, docNum, docDate, items: validItems, userId: currentUser.id, userName: currentUser.name });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
      <h3 className="text-white font-bold flex items-center gap-2">
        <PackagePlus size={18} className="text-emerald-400"/> Ingreso de mercadería
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Proveedor *</label>
          <input value={supplier} onChange={e => setSupplier(e.target.value)} required placeholder="Nombre del proveedor"
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">N° Documento</label>
          <input value={docNum} onChange={e => setDocNum(e.target.value)} placeholder="FAC-0001"
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Fecha</label>
          <input type="date" value={docDate} onChange={e => setDocDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2 text-xs text-slate-500 px-2.5">
          <span className="flex-1">Producto</span>
          <span className="w-16 text-center">Cant</span>
          <span className="w-24 text-center">P. Costo (S/)</span>
          <span className="w-20 text-right">Total</span>
          <span className="w-5"/>
        </div>
        {items.map((item, i) => (
          <ItemRow key={i} item={item} products={products} showCost={true}
            onChange={(f,v) => updateItem(i,f,v)} onRemove={() => removeItem(i)} />
        ))}
        <button type="button" onClick={addItem}
          className="w-full text-xs text-slate-400 hover:text-violet-400 border border-dashed border-slate-700 hover:border-violet-500 rounded-xl py-2 transition-colors flex items-center justify-center gap-1">
          <Plus size={12}/> Agregar producto
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-slate-700 pt-3">
        <span className="text-white font-bold">Total: <span className="text-emerald-400">{fmt(total)}</span></span>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-all">Cancelar</button>
          <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all">Registrar Ingreso</button>
        </div>
      </div>
    </form>
  );
}

// ── Formulario de salida ──────────────────────────────────────────────────────
function GoodsOutForm({ products, onSubmit, onCancel, currentUser }) {
  const [reason, setReason] = useState(OUT_REASONS[0]);
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0,10));
  const [items, setItems] = useState([{ productId:'', qty:1, cost:0 }]);

  const updateItem = (i, field, val) => setItems(prev => prev.map((it,idx) => idx===i ? {...it,[field]:val} : it));
  const addItem    = () => setItems(prev => [...prev, { productId:'', qty:1, cost:0 }]);
  const removeItem = (i) => setItems(prev => prev.filter((_,idx) => idx!==i));

  const handleSubmit = (e) => {
    e.preventDefault();
    const validItems = items.filter(i => i.productId && i.qty > 0);
    if (validItems.length === 0) return;
    onSubmit({ reason, docDate, items: validItems, userId: currentUser.id, userName: currentUser.name });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
      <h3 className="text-white font-bold flex items-center gap-2">
        <PackageMinus size={18} className="text-amber-400"/> Salida de mercadería
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Motivo *</label>
          <select value={reason} onChange={e => setReason(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500">
            {OUT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Fecha</label>
          <input type="date" value={docDate} onChange={e => setDocDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2 text-xs text-slate-500 px-2.5">
          <span className="flex-1">Producto</span>
          <span className="w-16 text-center">Cant</span>
          <span className="w-20 text-right">Valor</span>
          <span className="w-5"/>
        </div>
        {items.map((item, i) => (
          <ItemRow key={i} item={item} products={products} showCost={false}
            onChange={(f,v) => updateItem(i,f,v)} onRemove={() => removeItem(i)} />
        ))}
        <button type="button" onClick={addItem}
          className="w-full text-xs text-slate-400 hover:text-violet-400 border border-dashed border-slate-700 hover:border-violet-500 rounded-xl py-2 transition-colors flex items-center justify-center gap-1">
          <Plus size={12}/> Agregar producto
        </button>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-700 pt-3">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-all">Cancelar</button>
        <button type="submit" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-sm font-bold transition-all">Registrar Salida</button>
      </div>
    </form>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Mercaderia() {
  const { state, dispatch, toast } = useApp();
  const { products, incomingHistory, outgoingHistory, currentUser } = state;
  const [tab, setTab] = useState('in');
  const [showForm, setShowForm] = useState(false);

  const handleGoodsIn = (data) => {
    dispatch({ type:'GOODS_IN', payload: data });
    toast('Ingreso registrado correctamente', 'success');
    setShowForm(false);
  };

  const handleGoodsOut = (data) => {
    dispatch({ type:'GOODS_OUT', payload: data });
    toast('Salida registrada correctamente', 'success');
    setShowForm(false);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1">
          <button onClick={() => { setTab('in'); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab==='in' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <PackagePlus size={15}/> Ingresos
          </button>
          <button onClick={() => { setTab('out'); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab==='out' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            <PackageMinus size={15}/> Salidas
          </button>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            showForm ? 'bg-slate-700 text-white' : tab==='in' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-white'
          }`}>
          {showForm ? <><X size={15}/> Cancelar</> : <><Plus size={15}/> {tab==='in' ? 'Nuevo ingreso' : 'Nueva salida'}</>}
        </button>
      </div>

      {/* Form */}
      {showForm && tab === 'in'  && <GoodsInForm  products={products} onSubmit={handleGoodsIn}  onCancel={() => setShowForm(false)} currentUser={currentUser} />}
      {showForm && tab === 'out' && <GoodsOutForm products={products} onSubmit={handleGoodsOut} onCancel={() => setShowForm(false)} currentUser={currentUser} />}

      {/* Historial ingresos */}
      {tab === 'in' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
            <History size={16} className="text-emerald-400"/>
            <h3 className="text-white font-bold">Historial de ingresos</h3>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">{incomingHistory.length}</span>
          </div>
          {incomingHistory.length === 0 ? (
            <p className="text-center text-slate-500 py-10 text-sm">Sin registros de ingreso</p>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {[...incomingHistory].reverse().map(rec => (
                <div key={rec.id} className="px-5 py-4 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-emerald-400 text-xs font-bold">{rec.id}</span>
                        <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">ENTRADA</span>
                      </div>
                      <p className="text-white text-sm font-semibold">Proveedor: {rec.supplier}</p>
                      <p className="text-slate-400 text-xs">Doc: {rec.docNum || '—'} · Fecha: {rec.docDate} · Por: {rec.userName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-emerald-400 font-bold">{fmt(rec.items.reduce((s,i) => s+i.qty*i.cost,0))}</p>
                      <p className="text-slate-500 text-xs">{rec.items.length} línea(s)</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {rec.items.map((item, i) => {
                      const prod = products.find(p => p.id === item.productId);
                      return <span key={i} className="bg-slate-900 text-slate-300 text-xs px-2 py-0.5 rounded-md">{prod?.name || item.productId} ×{item.qty}</span>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Historial salidas */}
      {tab === 'out' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
            <History size={16} className="text-amber-400"/>
            <h3 className="text-white font-bold">Historial de salidas</h3>
            <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">{outgoingHistory.length}</span>
          </div>
          {outgoingHistory.length === 0 ? (
            <p className="text-center text-slate-500 py-10 text-sm">Sin registros de salida</p>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {[...outgoingHistory].reverse().map(rec => (
                <div key={rec.id} className="px-5 py-4 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-amber-400 text-xs font-bold">{rec.id}</span>
                        <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">SALIDA</span>
                      </div>
                      <p className="text-white text-sm font-semibold">Motivo: {rec.reason}</p>
                      <p className="text-slate-400 text-xs">Fecha: {rec.docDate} · Por: {rec.userName}</p>
                    </div>
                    <p className="text-slate-500 text-xs shrink-0">{rec.items.length} línea(s)</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {rec.items.map((item, i) => {
                      const prod = products.find(p => p.id === item.productId);
                      return <span key={i} className="bg-slate-900 text-slate-300 text-xs px-2 py-0.5 rounded-md">{prod?.name || item.productId} ×{item.qty}</span>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
