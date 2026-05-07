import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { fmt } from '../lib/format';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle,
  X, Printer, Zap, CreditCard,
} from 'lucide-react';

// ── Modal de pago completo ────────────────────────────────────────────────────
function PaymentModal({ subtotal, taxAmt, total, companyConfig, onConfirm, onClose }) {
  const [discount, setDiscount]       = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [payments, setPayments]       = useState([{ method: 'Efectivo', amount: '', received: '', lastFour: '', reference: '' }]);

  const discountAmt = discountType === 'percent'
    ? subtotal * discount / 100
    : Math.min(discount, subtotal);

  const { finalTax, finalTotal } = useMemo(() => {
    const taxable   = subtotal - discountAmt;
    const finalTax  = taxable * companyConfig.taxRate / 100;
    return { finalTax, finalTotal: taxable + finalTax };
  }, [subtotal, discountAmt, companyConfig.taxRate]);

  const isCash    = (m) => m === 'Efectivo';
  const addPay    = () => setPayments(p => [...p, { method: 'Efectivo', amount: '', received: '', lastFour: '', reference: '' }]);
  const removePay = (i) => setPayments(p => p.filter((_, idx) => idx !== i));
  const updatePay = (i, f, v) => setPayments(p => p.map((x, idx) => idx === i ? { ...x, [f]: v } : x));

  const totalPaid = payments.reduce((s, p) => s + parseFloat(isCash(p.method) ? p.received || 0 : p.amount || 0), 0);
  const change    = totalPaid - finalTotal;

  const handleConfirm = () => {
    if (totalPaid < finalTotal) return;
    const mapped = payments.map(p => ({
      method: p.method,
      amount: parseFloat(isCash(p.method) ? p.received || 0 : p.amount || 0),
      ...(isCash(p.method)                           ? { received: parseFloat(p.received || 0), change: parseFloat(p.received || 0) - finalTotal } : {}),
      ...(p.method === 'Tarjeta'                     ? { lastFour: p.lastFour } : {}),
      ...(p.method === 'Yape' || p.method === 'Plin' ? { reference: p.reference } : {}),
    }));
    onConfirm(mapped, discountAmt, finalTax, finalTotal);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 animate-fade-in sm:p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md animate-slide-up max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 shrink-0">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <CreditCard size={18} className="text-violet-400"/> Cobrar
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Descuento */}
          <div className="flex gap-2 items-center">
            <span className="text-slate-400 text-xs w-20 shrink-0">Descuento</span>
            <select value={discountType} onChange={e => setDiscountType(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2 py-2 text-xs focus:outline-none w-14">
              <option value="fixed">S/</option>
              <option value="percent">%</option>
            </select>
            <input type="number" min="0" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
              className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-violet-500" />
          </div>

          {/* Totales */}
          <div className="bg-slate-900 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            {discountAmt > 0 && <div className="flex justify-between text-emerald-400"><span>Descuento</span><span>-{fmt(discountAmt)}</span></div>}
            <div className="flex justify-between text-slate-400"><span>{companyConfig.taxName} {companyConfig.taxRate}%</span><span>{fmt(finalTax)}</span></div>
            <div className="flex justify-between text-white font-bold text-lg border-t border-slate-700 pt-2 mt-1">
              <span>TOTAL</span><span className="text-violet-400">{fmt(finalTotal)}</span>
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="space-y-2">
            {payments.length > 1 && (
              <div className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-1.5 font-semibold">
                Pago mixto — {payments.length} métodos
              </div>
            )}
            {payments.map((p, i) => (
              <div key={i} className="bg-slate-900 rounded-xl p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <select value={p.method} onChange={e => updatePay(i, 'method', e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none">
                    {companyConfig.paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {payments.length > 1 && (
                    <button onClick={() => removePay(i)} className="text-slate-600 hover:text-red-400 p-1"><X size={14}/></button>
                  )}
                </div>
                {p.method === 'Efectivo' && (
                  <input type="number" min="0" placeholder="Monto recibido (S/)" value={p.received}
                    onChange={e => updatePay(i, 'received', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-base font-semibold focus:outline-none focus:border-violet-500" />
                )}
                {p.method === 'Tarjeta' && (
                  <div className="flex gap-2">
                    <input type="number" placeholder="Monto (S/)" value={p.amount} onChange={e => updatePay(i, 'amount', e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-2 text-sm focus:outline-none" />
                    <input type="text" placeholder="Últ. 4 díg." maxLength={4} value={p.lastFour} onChange={e => updatePay(i, 'lastFour', e.target.value)}
                      className="w-20 bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-2 text-sm focus:outline-none" />
                  </div>
                )}
                {(p.method === 'Yape' || p.method === 'Plin') && (
                  <div className="flex gap-2">
                    <input type="number" placeholder="Monto (S/)" value={p.amount} onChange={e => updatePay(i, 'amount', e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-2 text-sm focus:outline-none" />
                    <input type="text" placeholder="N° operación" value={p.reference} onChange={e => updatePay(i, 'reference', e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-2 text-sm focus:outline-none" />
                  </div>
                )}
              </div>
            ))}
            <button onClick={addPay}
              className="w-full text-xs text-slate-400 hover:text-violet-400 border border-dashed border-slate-700 hover:border-violet-500 rounded-xl py-2 transition-colors flex items-center justify-center gap-1">
              <Plus size={12}/> + Pago mixto
            </button>
          </div>

          {/* Vuelto / Falta */}
          {change > 0.005 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 flex justify-between text-sm">
              <span className="text-emerald-400 font-semibold">Vuelto</span>
              <span className="text-emerald-400 font-bold">{fmt(change)}</span>
            </div>
          )}
          {totalPaid > 0 && totalPaid < finalTotal && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 flex justify-between text-sm">
              <span className="text-red-400 font-semibold">Falta</span>
              <span className="text-red-400 font-bold">{fmt(finalTotal - totalPaid)}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 shrink-0">
          <button onClick={handleConfirm} disabled={totalPaid < finalTotal}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-base">
            <CheckCircle size={20}/> Confirmar pago · {fmt(finalTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal POS ──────────────────────────────────────────────────
export default function POS() {
  const { state, dispatch, toast } = useApp();
  const { products, currentCashRegister, currentUser, companyConfig } = state;

  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [cart, setCart]             = useState([]);
  const [mobileTab, setMobileTab]   = useState('products');
  const [payModal, setPayModal]     = useState(false);
  const [receiptModal, setReceiptModal] = useState(null);
  const receiptRef = useRef(null);

  const activeProducts = useMemo(() => products.filter(p => p.active && p.stock > 0), [products]);
  const filtered = useMemo(() => activeProducts.filter(p => {
    const q = search.toLowerCase();
    return (!search || p.name.toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q))
      && (!filterCat || p.category === filterCat);
  }), [activeProducts, search, filterCat]);

  // ── cart helpers ─────────────────────────────────────────────────────────
  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) {
        if (ex.qty >= product.stock) { toast(`Stock máximo: ${product.stock}`, 'warning'); return prev; }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };
  const updateQty = (id, qty) => {
    const p = products.find(p => p.id === id);
    if (qty < 1) return removeFromCart(id);
    if (qty > p.stock) { toast(`Stock disponible: ${p.stock}`, 'warning'); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);

  // ── totales ──────────────────────────────────────────────────────────────
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const { taxAmt, total } = useMemo(() => {
    const tax = subtotal * companyConfig.taxRate / 100;
    return { taxAmt: tax, total: subtotal + tax };
  }, [subtotal, companyConfig.taxRate]);

  // ── procesar venta ───────────────────────────────────────────────────────
  const doSale = (payments, discountAmt, saleTax, saleTotal) => {
    const nextId = `V-${String(state.nextSaleId).padStart(4, '0')}`;
    dispatch({
      type: 'PROCESS_SALE',
      payload: {
        cart, payments,
        discount: discountAmt,
        taxRate: companyConfig.taxRate,
        userId: currentUser.id,
        userName: currentUser.name,
      },
    });
    setReceiptModal({
      id: nextId, createdAt: new Date().toISOString(), userName: currentUser.name,
      items: cart.map(i => ({ ...i, subtotal: i.price * i.qty })),
      subtotal, discount: discountAmt, tax: saleTax, total: saleTotal,
      payments,
      change: payments[0]?.change ?? 0,
    });
    clearCart();
    setPayModal(false);
    setMobileTab('products');
    toast('¡Venta procesada!', 'success');
  };

  // ⚡ Pago rápido — efectivo exacto, sin modal, sin vuelto
  const quickPay = () => {
    if (!currentCashRegister) { toast('Abre la caja primero', 'error'); return; }
    if (cart.length === 0)    { toast('Carrito vacío', 'warning'); return; }
    doSale(
      [{ method: 'Efectivo', amount: total, received: total, change: 0 }],
      0, taxAmt, total
    );
  };

  // ── Caja cerrada ─────────────────────────────────────────────────────────
  if (!currentCashRegister) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
          <ShoppingCart size={36} className="text-red-400" />
        </div>
        <h2 className="text-white text-xl font-bold">Caja cerrada</h2>
        <p className="text-slate-400 max-w-xs text-sm">Debes abrir la caja antes de realizar ventas.</p>
        <button onClick={() => dispatch({ type: 'SET_MODULE', payload: 'cash' })}
          className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-semibold transition-all w-full max-w-xs">
          Ir a Caja
        </button>
      </div>
    );
  }

  // ── Cart Items (reutilizado móvil/desktop) ────────────────────────────────
  const CartItems = () => (
    <>
      {cart.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">
          <ShoppingCart size={32} className="mx-auto mb-2 opacity-30"/>
          Toca un producto para agregarlo
        </div>
      ) : cart.map(item => (
        <div key={item.id} className="bg-slate-900 rounded-xl p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{item.name}</p>
            <p className="text-violet-400 text-xs font-bold">{fmt(item.price)}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => updateQty(item.id, item.qty - 1)}
              className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 active:bg-slate-500">
              <Minus size={13}/>
            </button>
            <span className="text-white text-sm font-bold w-7 text-center">{item.qty}</span>
            <button onClick={() => updateQty(item.id, item.qty + 1)}
              className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 active:bg-slate-500">
              <Plus size={13}/>
            </button>
          </div>
          <div className="text-right shrink-0 w-16">
            <p className="text-white text-sm font-bold">{fmt(item.price * item.qty)}</p>
            <button onClick={() => removeFromCart(item.id)} className="text-slate-600 hover:text-red-400 mt-0.5">
              <Trash2 size={12}/>
            </button>
          </div>
        </div>
      ))}
    </>
  );

  // ── Totales + botones de pago ─────────────────────────────────────────────
  const CartFooter = () => cart.length > 0 ? (
    <div className="p-3 border-t border-slate-700 space-y-3 shrink-0">
      {/* Totales compactos */}
      <div className="bg-slate-900 rounded-xl px-3 py-2.5 space-y-1 text-xs">
        <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
        <div className="flex justify-between text-slate-400"><span>{companyConfig.taxName} {companyConfig.taxRate}%</span><span>{fmt(taxAmt)}</span></div>
        <div className="flex justify-between text-white font-bold text-base border-t border-slate-700 pt-1.5 mt-1">
          <span>TOTAL</span><span className="text-violet-400">{fmt(total)}</span>
        </div>
      </div>
      {/* Botones */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={quickPay}
          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all text-sm active:scale-95">
          <Zap size={16}/> Pago Rápido
        </button>
        <button onClick={() => setPayModal(true)}
          className="flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-all text-sm active:scale-95">
          <CreditCard size={16}/> Pagar
        </button>
      </div>
    </div>
  ) : null;

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── MOBILE TAB BAR ── */}
      <div className="lg:hidden fixed top-14 left-0 right-0 z-20 bg-slate-800 border-b border-slate-700 flex">
        <button onClick={() => setMobileTab('products')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${mobileTab === 'products' ? 'text-violet-400 border-violet-500' : 'text-slate-400 border-transparent'}`}>
          <Search size={15}/> Productos
        </button>
        <button onClick={() => setMobileTab('cart')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 relative transition-all ${mobileTab === 'cart' ? 'text-violet-400 border-violet-500' : 'text-slate-400 border-transparent'}`}>
          <ShoppingCart size={15}/> Carrito
          {cart.length > 0 && (
            <span className="absolute top-1.5 right-[calc(50%-28px)] w-5 h-5 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* ── DESKTOP: side-by-side fixed-height ── */}
      <div className="hidden lg:flex h-full -m-6 overflow-hidden">
        {/* Productos */}
        <div className="flex-1 flex flex-col bg-slate-900 p-4 overflow-hidden">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
                placeholder="Buscar producto o SKU..." />
            </div>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500">
              <option value="">Todas</option>
              {companyConfig.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="bg-slate-800 border border-slate-700 hover:border-violet-500 rounded-xl p-3 text-left transition-all group hover:shadow-lg hover:shadow-violet-900/20">
                  <div className="w-full h-14 bg-slate-700 rounded-lg flex items-center justify-center mb-2 group-hover:bg-violet-600/10 transition-colors">
                    <span className="text-xl font-bold text-slate-500 group-hover:text-violet-400">{p.name.charAt(0)}</span>
                  </div>
                  <p className="text-white text-xs font-semibold leading-tight truncate">{p.name}</p>
                  <p className="text-slate-500 text-xs truncate">{p.brand}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-violet-400 font-bold text-sm">{fmt(p.price)}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${p.stock <= p.stockMin ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                      {p.stock} uds
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {filtered.length === 0 && <div className="text-center py-16 text-slate-500">Sin productos</div>}
          </div>
        </div>

        {/* Carrito */}
        <div className="w-96 flex flex-col bg-slate-800 border-l border-slate-700 shrink-0">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between shrink-0">
            <h2 className="text-white font-bold flex items-center gap-2">
              <ShoppingCart size={17} className="text-violet-400"/> Carrito
              {cart.length > 0 && <span className="bg-violet-600 text-white text-xs px-1.5 py-0.5 rounded-full">{cart.length}</span>}
            </h2>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1">
                <Trash2 size={13}/> Limpiar
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2"><CartItems/></div>
          <CartFooter/>
        </div>
      </div>

      {/* ── MOBILE: tabs ── */}
      <div className="lg:hidden -mx-3 sm:-mx-4 pt-11">
        {/* Tab productos */}
        {mobileTab === 'products' && (
          <div className="p-3">
            <div className="flex gap-2 mb-3 sticky top-0 z-10 bg-slate-900 pb-2 pt-1 -mx-3 px-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
                  placeholder="Buscar..." />
              </div>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-2 py-2.5 text-xs focus:outline-none max-w-[110px]">
                <option value="">Todas</option>
                {companyConfig.categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pb-24">
              {filtered.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="bg-slate-800 border border-slate-700 active:border-violet-500 rounded-xl p-3 text-left transition-all active:scale-95">
                  <div className="w-full h-12 bg-slate-700 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-slate-500">{p.name.charAt(0)}</span>
                  </div>
                  <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{p.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-violet-400 font-bold text-sm">{fmt(p.price)}</span>
                    <span className="text-slate-500 text-xs">{p.stock}</span>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <p className="col-span-2 text-center py-10 text-slate-500 text-sm">Sin productos</p>}
            </div>
          </div>
        )}

        {/* Tab carrito */}
        {mobileTab === 'cart' && (
          <div className="bg-slate-800 min-h-screen">
            <div className="px-4 py-3.5 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
              <h2 className="text-white font-bold flex items-center gap-2">
                <ShoppingCart size={17} className="text-violet-400"/> Carrito
                {cart.length > 0 && <span className="bg-violet-600 text-white text-xs px-1.5 py-0.5 rounded-full">{cart.length}</span>}
              </h2>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1">
                  <Trash2 size={13}/> Limpiar
                </button>
              )}
            </div>
            <div className="p-3 space-y-2"><CartItems/></div>
            <div className="px-3 pb-28"><CartFooter/></div>
          </div>
        )}
      </div>

      {/* ── FAB móvil ── */}
      {cart.length > 0 && mobileTab === 'products' && (
        <button onClick={() => setMobileTab('cart')}
          className="lg:hidden fixed bottom-20 left-3 right-3 z-30 bg-violet-600 text-white rounded-2xl px-5 py-4 shadow-2xl shadow-violet-900/60 flex items-center justify-between font-bold text-sm animate-slide-up">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18}/>
            <span>{cart.length} producto{cart.length > 1 ? 's' : ''}</span>
          </div>
          <span className="text-violet-200 text-lg">{fmt(total)}</span>
        </button>
      )}

      {/* ── Payment Modal ── */}
      {payModal && (
        <PaymentModal
          subtotal={subtotal}
          taxAmt={taxAmt}
          total={total}
          companyConfig={companyConfig}
          onConfirm={(payments, discountAmt, saleTax, saleTotal) => doSale(payments, discountAmt, saleTax, saleTotal)}
          onClose={() => setPayModal(false)}
        />
      )}

      {/* ── Receipt Modal ── */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 animate-fade-in sm:p-4">
          <div className="bg-white text-slate-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
            <div ref={receiptRef} className="p-5 overflow-y-auto flex-1">
              <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
                <h2 className="font-bold text-lg">{companyConfig.name}</h2>
                <p className="text-xs text-slate-500">{companyConfig.address}</p>
                <p className="text-xs text-slate-500">{companyConfig.phone}</p>
              </div>
              <div className="mb-3 text-xs text-slate-600 flex justify-between">
                <span>N° <strong className="text-violet-600">{receiptModal.id}</strong></span>
                <span>{new Date(receiptModal.createdAt).toLocaleString('es-PE')}</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">Cajero: {receiptModal.userName}</p>
              <table className="w-full text-xs mb-4">
                <thead><tr className="border-b border-slate-200 text-slate-500">
                  <th className="text-left pb-1">Producto</th>
                  <th className="text-center pb-1">Cant</th>
                  <th className="text-right pb-1">Total</th>
                </tr></thead>
                <tbody>{receiptModal.items.map((i, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-1 text-slate-700 text-xs">{i.name}</td>
                    <td className="py-1 text-center text-slate-500">×{i.qty} @ {fmt(i.price)}</td>
                    <td className="py-1 text-right font-semibold">{fmt(i.subtotal)}</td>
                  </tr>
                ))}</tbody>
              </table>
              <div className="text-xs space-y-1">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{fmt(receiptModal.subtotal)}</span></div>
                {receiptModal.discount > 0 && <div className="flex justify-between text-green-600"><span>Descuento</span><span>-{fmt(receiptModal.discount)}</span></div>}
                <div className="flex justify-between text-slate-500"><span>{companyConfig.taxName} {companyConfig.taxRate}%</span><span>{fmt(receiptModal.tax)}</span></div>
                <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-1"><span>TOTAL</span><span>{fmt(receiptModal.total)}</span></div>
                {receiptModal.change > 0 && <div className="flex justify-between text-green-600 font-semibold"><span>Vuelto</span><span>{fmt(receiptModal.change)}</span></div>}
              </div>
              <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center text-xs text-slate-400">¡Gracias por su compra! 🎵</div>
            </div>
            <div className="flex gap-3 p-4 border-t border-slate-200 shrink-0">
              <button onClick={() => window.print()} className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50">
                <Printer size={15}/> Imprimir
              </button>
              <button onClick={() => setReceiptModal(null)} className="flex-1 bg-violet-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-violet-500">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
