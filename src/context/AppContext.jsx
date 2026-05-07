import React, { createContext, useContext, useReducer, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  INITIAL_USERS, INITIAL_PRODUCTS, INITIAL_SALES,
  INITIAL_KARDEX, INITIAL_COMPANY, INITIAL_CASH_REGISTER, INITIAL_PREV_SALES,
} from '../data/initialData';
import { ROLE_TEMPLATES } from '../data/permissions';
import { loadAllData, db } from '../lib/db';
import { DB_ENABLED } from '../lib/supabase';

const uid = () => Math.random().toString(36).slice(2, 10);

const INITIAL_STATE = {
  currentUser: null,
  users: INITIAL_USERS,
  products: INITIAL_PRODUCTS,
  sales: INITIAL_SALES,
  prevSales: INITIAL_PREV_SALES,
  kardex: INITIAL_KARDEX,
  currentCashRegister: INITIAL_CASH_REGISTER,
  cashHistory: [],
  incomingHistory: [],
  outgoingHistory: [],
  companyConfig: INITIAL_COMPANY,
  activeModule: 'dashboard',
  nextSaleId: 4,
  toasts: [],
};

// ── Sincronización asíncrona con Supabase ─────────────────────────────────────
async function syncToDb(action, state) {
  if (!DB_ENABLED) return;
  const { type, payload } = action;

  switch (type) {
    case 'PROCESS_SALE': {
      const sale = state.sales[state.sales.length - 1];
      const changedProds = payload.cart.map(i => state.products.find(p => p.id === i.id)).filter(Boolean);
      const newKardex = state.kardex.slice(-payload.cart.length);
      await Promise.all([
        db.upsertSale(sale),
        db.upsertProducts(changedProds),
        db.upsertKardex(newKardex),
        state.currentCashRegister && db.upsertCashRegister(state.currentCashRegister),
      ].filter(Boolean));
      break;
    }
    case 'CANCEL_SALE': {
      const sale = state.sales.find(s => s.id === payload.saleId);
      const ops = [db.upsertSale(sale)];
      if (payload.restoreStock) ops.push(db.upsertProducts(state.products));
      if (state.currentCashRegister) ops.push(db.upsertCashRegister(state.currentCashRegister));
      const cancelKardex = state.kardex.filter(k => k.reference === `ANUL-${payload.saleId}`);
      if (cancelKardex.length) ops.push(db.upsertKardex(cancelKardex));
      await Promise.all(ops);
      break;
    }
    case 'RETURN_ITEMS': {
      const sale = state.sales.find(s => s.id === payload.saleId);
      const ops = [db.upsertSale(sale)];
      if (payload.restoreStock) ops.push(db.upsertProducts(state.products));
      if (state.currentCashRegister) ops.push(db.upsertCashRegister(state.currentCashRegister));
      const retKardex = state.kardex.filter(k => k.reference === `DEV-${payload.saleId}`);
      if (retKardex.length) ops.push(db.upsertKardex(retKardex));
      await Promise.all(ops);
      break;
    }
    case 'ADD_PRODUCT':
    case 'UPDATE_PRODUCT':
    case 'DEACTIVATE_PRODUCT': {
      const lastKardex = state.kardex[state.kardex.length - 1];
      await Promise.all([
        db.upsertProducts(state.products),
        lastKardex && db.upsertKardex([lastKardex]),
      ].filter(Boolean));
      break;
    }
    case 'ADJUST_INVENTORY': {
      const prod = state.products.find(p => p.id === payload.productId);
      const lastKardex = state.kardex[state.kardex.length - 1];
      await Promise.all([
        prod && db.upsertProducts([prod]),
        lastKardex && db.upsertKardex([lastKardex]),
      ].filter(Boolean));
      break;
    }
    case 'GOODS_IN': {
      const newKardex = state.kardex.slice(-payload.items.length);
      const last = state.incomingHistory[state.incomingHistory.length - 1];
      await Promise.all([
        db.upsertProducts(state.products),
        db.upsertKardex(newKardex),
        last && db.upsertIncoming(last),
      ].filter(Boolean));
      break;
    }
    case 'GOODS_OUT': {
      const newKardex = state.kardex.slice(-payload.items.length);
      const last = state.outgoingHistory[state.outgoingHistory.length - 1];
      await Promise.all([
        db.upsertProducts(state.products),
        db.upsertKardex(newKardex),
        last && db.upsertOutgoing(last),
      ].filter(Boolean));
      break;
    }
    case 'OPEN_CASH_REGISTER':
    case 'CASH_MOVEMENT':
      await db.upsertCashRegister(state.currentCashRegister);
      break;
    case 'CLOSE_CASH_REGISTER':
      await db.closeCashRegister(state.cashHistory[state.cashHistory.length - 1]);
      break;
    case 'ADD_USER':
    case 'UPDATE_USER':
      await db.upsertUsers(state.users);
      break;
    case 'DELETE_USER':
      await db.deleteUser(payload);
      break;
    case 'UPDATE_CONFIG':
      await db.updateConfig(state.companyConfig);
      break;
    case 'RESET_ALL_DATA':
      await db.resetAll();
      break;
  }
}

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    case 'LOAD_FROM_DB':
      return { ...state, ...action.payload, currentUser: null, activeModule: 'dashboard', toasts: [] };

    case 'LOGIN':  return { ...state, currentUser: action.payload };
    case 'LOGOUT': return { ...state, currentUser: null, activeModule: 'dashboard' };
    case 'SET_MODULE': return { ...state, activeModule: action.payload };

    case 'ADD_USER': {
      const newUser = {
        ...action.payload, id: uid(), createdAt: new Date().toISOString(),
        permissions: action.payload.permissions ?? ROLE_TEMPLATES[action.payload.role] ?? [],
      };
      return { ...state, users: [...state.users, newUser] };
    }
    case 'UPDATE_USER':
      return { ...state, users: state.users.map(u => u.id === action.payload.id ? { ...u, ...action.payload } : u) };
    case 'DELETE_USER':
      return { ...state, users: state.users.filter(u => u.id !== action.payload) };

    case 'ADD_PRODUCT': {
      const p = { ...action.payload, id: 'p' + uid(), createdAt: new Date().toISOString() };
      const kardexEntry = {
        id: 'k-' + uid(), productId: p.id, productName: p.name,
        type: 'ENTRADA', concept: 'Producto creado (stock inicial)',
        reference: 'SISTEMA', userId: state.currentUser.id, userName: state.currentUser.name,
        qtyIn: p.stock, qtyOut: 0, stockBefore: 0, stockAfter: p.stock,
        unitCost: p.cost, totalValue: p.stock * p.cost,
        createdAt: new Date().toISOString(),
      };
      return { ...state, products: [...state.products, p], kardex: [...state.kardex, kardexEntry] };
    }
    case 'UPDATE_PRODUCT':
      return { ...state, products: state.products.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p) };
    case 'DEACTIVATE_PRODUCT':
      return { ...state, products: state.products.map(p => p.id === action.payload ? { ...p, active: false } : p) };

    case 'ADJUST_INVENTORY': {
      const { productId, newStock, reason, userId, userName } = action.payload;
      const product = state.products.find(p => p.id === productId);
      const diff = newStock - product.stock;
      const entry = {
        id: 'k-' + uid(), productId, productName: product.name,
        type: 'AJUSTE', concept: `Ajuste: ${reason}`,
        reference: 'AJUSTE-MANUAL', userId, userName,
        qtyIn: diff > 0 ? diff : 0, qtyOut: diff < 0 ? Math.abs(diff) : 0,
        stockBefore: product.stock, stockAfter: newStock,
        unitCost: product.cost, totalValue: Math.abs(diff) * product.cost,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        products: state.products.map(p => p.id === productId ? { ...p, stock: newStock } : p),
        kardex: [...state.kardex, entry],
      };
    }

    case 'PROCESS_SALE': {
      const { cart, payments, discount, taxRate, userId, userName } = action.payload;
      const saleId = `V-${String(state.nextSaleId).padStart(4, '0')}`;
      const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
      const discountedSub = subtotal - discount;
      const tax = discountedSub * taxRate / 100;
      const total = discountedSub + tax;
      const paymentSummary = payments.length > 1 ? 'Mixto' :
        payments.map(p =>
          p.method === 'Tarjeta' ? `Tarjeta ****${p.lastFour||''}` :
          p.method === 'Yape'    ? `Yape ${p.reference||''}` :
          p.method === 'Plin'    ? `Plin ${p.reference||''}` : 'Efectivo'
        ).join(' + ');

      const sale = {
        id: saleId, createdAt: new Date().toISOString(), userId, userName,
        items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, qty: i.qty, subtotal: i.price * i.qty })),
        subtotal, discount, taxRate, tax, total, payments, paymentSummary, status: 'ACTIVA',
      };

      let updatedProducts = [...state.products];
      const newKardex = cart.map(item => {
        const prod = updatedProducts.find(p => p.id === item.id);
        const isService = prod?.type === 'SERVICIO';
        const sb = prod.stock;
        const sa = isService ? sb : sb - item.qty;
        if (!isService) updatedProducts = updatedProducts.map(p => p.id === item.id ? { ...p, stock: sa } : p);
        return {
          id: 'k-' + uid(), productId: item.id, productName: item.name,
          type: 'SALIDA', concept: isService ? 'Servicio prestado' : 'Venta',
          reference: saleId, userId, userName,
          qtyIn: 0, qtyOut: isService ? 0 : item.qty,
          stockBefore: sb, stockAfter: sa,
          unitCost: item.cost || 0, totalValue: item.qty * (item.cost || 0),
          createdAt: new Date().toISOString(),
        };
      });

      const cashMovement = {
        id: 'cm-' + uid(), type: 'INGRESO', concept: 'Venta',
        amount: total, description: saleId, userId, userName, createdAt: new Date().toISOString(),
      };
      const updatedCR = state.currentCashRegister
        ? { ...state.currentCashRegister, movements: [...state.currentCashRegister.movements, cashMovement] }
        : state.currentCashRegister;

      return {
        ...state,
        sales: [...state.sales, sale],
        products: updatedProducts,
        kardex: [...state.kardex, ...newKardex],
        currentCashRegister: updatedCR,
        nextSaleId: state.nextSaleId + 1,
      };
    }

    case 'GOODS_IN': {
      const { supplier, docNum, docDate, items, userId, userName } = action.payload;
      const recId = 'REC-' + String(state.incomingHistory.length + 1).padStart(4, '0');
      let updatedProducts = [...state.products];
      const newKardex = items.map(item => {
        const prod = updatedProducts.find(p => p.id === item.productId);
        const sb = prod.stock; const sa = sb + item.qty;
        updatedProducts = updatedProducts.map(p => p.id === item.productId ? { ...p, stock: sa } : p);
        return {
          id: 'k-' + uid(), productId: item.productId, productName: prod.name,
          type: 'ENTRADA', concept: `Compra - ${supplier}`,
          reference: recId, userId, userName,
          qtyIn: item.qty, qtyOut: 0, stockBefore: sb, stockAfter: sa,
          unitCost: item.cost, totalValue: item.qty * item.cost,
          createdAt: new Date().toISOString(),
        };
      });
      const record = { id: recId, supplier, docNum, docDate, items, userId, userName, createdAt: new Date().toISOString() };
      return { ...state, products: updatedProducts, kardex: [...state.kardex, ...newKardex], incomingHistory: [...state.incomingHistory, record] };
    }

    case 'GOODS_OUT': {
      const { reason, docDate, items, userId, userName } = action.payload;
      const outId = 'SAL-' + String(state.outgoingHistory.length + 1).padStart(4, '0');
      let updatedProducts = [...state.products];
      const newKardex = items.map(item => {
        const prod = updatedProducts.find(p => p.id === item.productId);
        const sb = prod.stock; const sa = Math.max(0, sb - item.qty);
        updatedProducts = updatedProducts.map(p => p.id === item.productId ? { ...p, stock: sa } : p);
        return {
          id: 'k-' + uid(), productId: item.productId, productName: prod.name,
          type: 'SALIDA', concept: reason, reference: outId, userId, userName,
          qtyIn: 0, qtyOut: item.qty, stockBefore: sb, stockAfter: sa,
          unitCost: prod.cost, totalValue: item.qty * prod.cost,
          createdAt: new Date().toISOString(),
        };
      });
      const record = { id: outId, reason, docDate, items, userId, userName, createdAt: new Date().toISOString() };
      return { ...state, products: updatedProducts, kardex: [...state.kardex, ...newKardex], outgoingHistory: [...state.outgoingHistory, record] };
    }

    case 'OPEN_CASH_REGISTER': {
      const cr = {
        id: 'cr-' + uid(), openedAt: new Date().toISOString(),
        openedBy: action.payload.userId, openedByName: action.payload.userName,
        initialAmount: action.payload.initialAmount,
        movements: [{
          id: 'cm-' + uid(), type: 'INGRESO', concept: 'Apertura de caja',
          amount: action.payload.initialAmount, description: 'Saldo inicial',
          userId: action.payload.userId, userName: action.payload.userName,
          createdAt: new Date().toISOString(),
        }],
      };
      return { ...state, currentCashRegister: cr };
    }
    case 'CASH_MOVEMENT': {
      const mv = { id: 'cm-' + uid(), ...action.payload, createdAt: new Date().toISOString() };
      return { ...state, currentCashRegister: { ...state.currentCashRegister, movements: [...state.currentCashRegister.movements, mv] } };
    }
    case 'CLOSE_CASH_REGISTER': {
      const cr = state.currentCashRegister;
      const balance = cr.movements.reduce((s, m) => m.type === 'INGRESO' ? s + m.amount : s - m.amount, 0);
      const record = {
        ...cr, closedAt: new Date().toISOString(),
        closedBy: action.payload.userId, closedByName: action.payload.userName,
        theoreticalBalance: balance, realBalance: action.payload.realBalance,
        difference: action.payload.realBalance - balance, notes: action.payload.notes,
      };
      return { ...state, currentCashRegister: null, cashHistory: [...state.cashHistory, record] };
    }

    case 'CANCEL_SALE': {
      const { saleId, restoreStock, reason, userId, userName } = action.payload;
      const sale = state.sales.find(s => s.id === saleId);
      if (!sale || sale.status === 'ANULADA') return state;
      let updatedProducts = [...state.products];
      const newKardex = [];
      if (restoreStock) {
        sale.items.forEach(item => {
          const prod = updatedProducts.find(p => p.id === item.productId);
          if (!prod || prod.type === 'SERVICIO') return;
          const sb = prod.stock; const sa = sb + item.qty;
          updatedProducts = updatedProducts.map(p => p.id === item.productId ? { ...p, stock: sa } : p);
          newKardex.push({
            id: 'k-' + uid(), productId: item.productId, productName: item.name,
            type: 'ENTRADA', concept: `Anulación ${saleId}`,
            reference: `ANUL-${saleId}`, userId, userName,
            qtyIn: item.qty, qtyOut: 0, stockBefore: sb, stockAfter: sa,
            unitCost: prod.cost, totalValue: item.qty * prod.cost,
            createdAt: new Date().toISOString(),
          });
        });
      }
      const updatedSales = state.sales.map(s => s.id === saleId ? {
        ...s, status: 'ANULADA',
        cancellation: { cancelledAt: new Date().toISOString(), cancelledBy: userId, cancelledByName: userName, restoreStock, reason },
      } : s);
      let updatedCR = state.currentCashRegister;
      if (updatedCR) updatedCR = { ...updatedCR, movements: [...updatedCR.movements, {
        id: 'cm-' + uid(), type: 'EGRESO', concept: 'Anulación de venta',
        amount: sale.total, description: `Anulación ${saleId}`,
        userId, userName, createdAt: new Date().toISOString(),
      }]};
      return { ...state, sales: updatedSales, products: updatedProducts, kardex: [...state.kardex, ...newKardex], currentCashRegister: updatedCR };
    }

    case 'RETURN_ITEMS': {
      const { saleId, returnedItems, restoreStock, reason, userId, userName } = action.payload;
      const sale = state.sales.find(s => s.id === saleId);
      if (!sale) return state;
      const returnSubtotal = returnedItems.reduce((s, i) => s + i.qty * i.price, 0);
      const returnTotal = parseFloat((returnSubtotal * (1 + (sale.taxRate || 18) / 100)).toFixed(2));
      let updatedProducts = [...state.products];
      const newKardex = [];
      if (restoreStock) {
        returnedItems.forEach(item => {
          const prod = updatedProducts.find(p => p.id === item.productId);
          if (!prod || prod.type === 'SERVICIO') return;
          const sb = prod.stock; const sa = sb + item.qty;
          updatedProducts = updatedProducts.map(p => p.id === item.productId ? { ...p, stock: sa } : p);
          newKardex.push({
            id: 'k-' + uid(), productId: item.productId, productName: item.name,
            type: 'ENTRADA', concept: 'Devolución de cliente',
            reference: `DEV-${saleId}`, userId, userName,
            qtyIn: item.qty, qtyOut: 0, stockBefore: sb, stockAfter: sa,
            unitCost: prod.cost, totalValue: item.qty * prod.cost,
            createdAt: new Date().toISOString(),
          });
        });
      }
      const returnRecord = {
        id: 'DEV-' + uid(), returnedAt: new Date().toISOString(),
        returnedBy: userId, returnedByName: userName,
        items: returnedItems, restoreStock, reason, amount: returnTotal,
      };
      const updatedSales = state.sales.map(s => s.id === saleId ? { ...s, status: 'DEVOLUCION', returns: [...(s.returns || []), returnRecord] } : s);
      let updatedCR = state.currentCashRegister;
      if (updatedCR) updatedCR = { ...updatedCR, movements: [...updatedCR.movements, {
        id: 'cm-' + uid(), type: 'EGRESO', concept: 'Devolución de cliente',
        amount: returnTotal, description: `Dev. ${saleId}`,
        userId, userName, createdAt: new Date().toISOString(),
      }]};
      return { ...state, sales: updatedSales, products: updatedProducts, kardex: [...state.kardex, ...newKardex], currentCashRegister: updatedCR };
    }

    case 'RESET_ALL_DATA': {
      const keepUser = action.payload?.keepUser ? state.currentUser : null;
      return { ...INITIAL_STATE, currentUser: keepUser, activeModule: 'dashboard', toasts: [] };
    }

    case 'UPDATE_CONFIG':
      return { ...state, companyConfig: { ...state.companyConfig, ...action.payload } };

    case 'ADD_TOAST': {
      const t = { id: action.payload.id || uid(), ...action.payload };
      return { ...state, toasts: [...state.toasts, t] };
    }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };

    default: return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, reactDispatch] = useReducer(reducer, INITIAL_STATE);
  const [dbLoading, setDbLoading] = useState(DB_ENABLED);
  const stateRef = useRef(state);

  // Mantener ref sincronizado para que syncToDb siempre vea el último estado
  useEffect(() => { stateRef.current = state; }, [state]);

  // Cargar datos desde Supabase al montar (solo si DB está habilitada)
  useEffect(() => {
    if (!DB_ENABLED) { setDbLoading(false); return; }
    loadAllData().then(data => {
      if (data) reactDispatch({ type: 'LOAD_FROM_DB', payload: data });
      setDbLoading(false);
    });
  }, []);

  // dispatch optimista: actualiza UI inmediatamente, sincroniza a DB en background
  const dispatch = useCallback((action) => {
    const newState = reducer(stateRef.current, action);
    stateRef.current = newState;
    reactDispatch(action);
    syncToDb(action, newState).catch(err => console.error('DB sync error:', action.type, err));
  }, []);

  const toast = useCallback((message, type = 'success') => {
    const id = uid();
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3500);
  }, [dispatch]);

  const cashBalance = useMemo(() => {
    if (!state.currentCashRegister) return 0;
    return state.currentCashRegister.movements.reduce(
      (s, m) => m.type === 'INGRESO' ? s + m.amount : s - m.amount, 0
    );
  }, [state.currentCashRegister]);

  const lowStockProducts = useMemo(
    () => state.products.filter(p => p.active && p.stock <= p.stockMin),
    [state.products]
  );

  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return state.sales.filter(s => new Date(s.createdAt).toDateString() === today);
  }, [state.sales]);

  const hasPermission = useCallback((key) => {
    if (!state.currentUser) return false;
    const perms = state.currentUser.permissions ?? ROLE_TEMPLATES[state.currentUser.role] ?? [];
    return perms.includes(key);
  }, [state.currentUser]);

  const value = { state, dispatch, toast, cashBalance, lowStockProducts, todaySales, hasPermission, dbLoading };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
