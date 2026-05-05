import React, { createContext, useContext, useReducer, useMemo } from 'react';
import {
  INITIAL_USERS, INITIAL_PRODUCTS, INITIAL_SALES,
  INITIAL_KARDEX, INITIAL_COMPANY, INITIAL_CASH_REGISTER, INITIAL_PREV_SALES,
} from '../data/initialData';
import { ROLE_TEMPLATES } from '../data/permissions';

// ── helpers ──────────────────────────────────────────────────────────────────
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
  incomingHistory: [],   // ingreso de mercadería
  outgoingHistory: [],   // salida de mercadería
  companyConfig: INITIAL_COMPANY,
  activeModule: 'dashboard',
  nextSaleId: 4,
  toasts: [],
};

// ── reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // AUTH
    case 'LOGIN': return { ...state, currentUser: action.payload };
    case 'LOGOUT': return { ...state, currentUser: null, activeModule: 'dashboard' };

    // NAVIGATION
    case 'SET_MODULE': return { ...state, activeModule: action.payload };

    // USERS CRUD
    case 'ADD_USER': {
      const newUser = {
        ...action.payload,
        id: uid(),
        createdAt: new Date().toISOString(),
        permissions: action.payload.permissions ?? ROLE_TEMPLATES[action.payload.role] ?? [],
      };
      return { ...state, users: [...state.users, newUser] };
    }
    case 'UPDATE_USER':
      return { ...state, users: state.users.map(u => u.id === action.payload.id ? { ...u, ...action.payload } : u) };
    case 'DELETE_USER':
      return { ...state, users: state.users.filter(u => u.id !== action.payload) };

    // PRODUCTS CRUD
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

    // INVENTORY ADJUSTMENT
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

    // SALE
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
        id: saleId, createdAt: new Date().toISOString(),
        userId, userName,
        items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, qty: i.qty, subtotal: i.price * i.qty })),
        subtotal, discount, taxRate, tax, total, payments, paymentSummary,
        status: 'ACTIVA',
      };

      // kardex entries for each cart item (servicios no descuentan stock)
      let updatedProducts = [...state.products];
      const newKardex = cart.map(item => {
        const prod = updatedProducts.find(p => p.id === item.id);
        const isService = prod?.type === 'SERVICIO';
        const sb = prod.stock;
        const sa = isService ? sb : sb - item.qty;
        if (!isService) {
          updatedProducts = updatedProducts.map(p => p.id === item.id ? { ...p, stock: sa } : p);
        }
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

      // cash register movement
      const cashMovement = {
        id: 'cm-' + uid(), type: 'INGRESO', concept: 'Venta',
        amount: total, description: saleId,
        userId, userName, createdAt: new Date().toISOString(),
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

    // MERCADERÍA — INGRESO (compra/recepción)
    case 'GOODS_IN': {
      const { supplier, docNum, docDate, items, userId, userName } = action.payload;
      const recId = 'REC-' + String(state.incomingHistory.length + 1).padStart(4, '0');
      let updatedProducts = [...state.products];
      const newKardex = items.map(item => {
        const prod = updatedProducts.find(p => p.id === item.productId);
        const sb = prod.stock;
        const sa = sb + item.qty;
        updatedProducts = updatedProducts.map(p => p.id === item.productId ? { ...p, stock: sa } : p);
        return {
          id: 'k-' + uid(), productId: item.productId, productName: prod.name,
          type: 'ENTRADA', concept: `Compra - ${supplier}`,
          reference: recId, userId, userName,
          qtyIn: item.qty, qtyOut: 0,
          stockBefore: sb, stockAfter: sa,
          unitCost: item.cost, totalValue: item.qty * item.cost,
          createdAt: new Date().toISOString(),
        };
      });
      const record = { id: recId, supplier, docNum, docDate, items, userId, userName, createdAt: new Date().toISOString() };
      return {
        ...state,
        products: updatedProducts,
        kardex: [...state.kardex, ...newKardex],
        incomingHistory: [...state.incomingHistory, record],
      };
    }

    // MERCADERÍA — SALIDA (no venta)
    case 'GOODS_OUT': {
      const { reason, docDate, items, userId, userName } = action.payload;
      const outId = 'SAL-' + String(state.outgoingHistory.length + 1).padStart(4, '0');
      let updatedProducts = [...state.products];
      const newKardex = items.map(item => {
        const prod = updatedProducts.find(p => p.id === item.productId);
        const sb = prod.stock;
        const sa = Math.max(0, sb - item.qty);
        updatedProducts = updatedProducts.map(p => p.id === item.productId ? { ...p, stock: sa } : p);
        return {
          id: 'k-' + uid(), productId: item.productId, productName: prod.name,
          type: 'SALIDA', concept: reason,
          reference: outId, userId, userName,
          qtyIn: 0, qtyOut: item.qty,
          stockBefore: sb, stockAfter: sa,
          unitCost: prod.cost, totalValue: item.qty * prod.cost,
          createdAt: new Date().toISOString(),
        };
      });
      const record = { id: outId, reason, docDate, items, userId, userName, createdAt: new Date().toISOString() };
      return {
        ...state,
        products: updatedProducts,
        kardex: [...state.kardex, ...newKardex],
        outgoingHistory: [...state.outgoingHistory, record],
      };
    }

    // CASH REGISTER
    case 'OPEN_CASH_REGISTER': {
      const cr = {
        id: 'cr-' + uid(),
        openedAt: new Date().toISOString(),
        openedBy: action.payload.userId,
        openedByName: action.payload.userName,
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
      return {
        ...state,
        currentCashRegister: {
          ...state.currentCashRegister,
          movements: [...state.currentCashRegister.movements, mv],
        },
      };
    }
    case 'CLOSE_CASH_REGISTER': {
      const cr = state.currentCashRegister;
      const balance = cr.movements.reduce((s, m) => m.type === 'INGRESO' ? s + m.amount : s - m.amount, 0);
      const record = {
        ...cr,
        closedAt: new Date().toISOString(),
        closedBy: action.payload.userId,
        closedByName: action.payload.userName,
        theoreticalBalance: balance,
        realBalance: action.payload.realBalance,
        difference: action.payload.realBalance - balance,
        notes: action.payload.notes,
      };
      return { ...state, currentCashRegister: null, cashHistory: [...state.cashHistory, record] };
    }

    // ANULAR VENTA
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
          const sb = prod.stock;
          const sa = sb + item.qty;
          updatedProducts = updatedProducts.map(p => p.id === item.productId ? { ...p, stock: sa } : p);
          newKardex.push({
            id: 'k-' + uid(), productId: item.productId, productName: item.name,
            type: 'ENTRADA', concept: `Anulación ${saleId}`,
            reference: `ANUL-${saleId}`, userId, userName,
            qtyIn: item.qty, qtyOut: 0,
            stockBefore: sb, stockAfter: sa,
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
      if (updatedCR) {
        updatedCR = { ...updatedCR, movements: [...updatedCR.movements, {
          id: 'cm-' + uid(), type: 'EGRESO', concept: 'Anulación de venta',
          amount: sale.total, description: `Anulación ${saleId}`,
          userId, userName, createdAt: new Date().toISOString(),
        }]};
      }

      return { ...state, sales: updatedSales, products: updatedProducts, kardex: [...state.kardex, ...newKardex], currentCashRegister: updatedCR };
    }

    // DEVOLVER ITEMS
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
          const sb = prod.stock;
          const sa = sb + item.qty;
          updatedProducts = updatedProducts.map(p => p.id === item.productId ? { ...p, stock: sa } : p);
          newKardex.push({
            id: 'k-' + uid(), productId: item.productId, productName: item.name,
            type: 'ENTRADA', concept: `Devolución de cliente`,
            reference: `DEV-${saleId}`, userId, userName,
            qtyIn: item.qty, qtyOut: 0,
            stockBefore: sb, stockAfter: sa,
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

      const updatedSales = state.sales.map(s => s.id === saleId ? {
        ...s,
        status: 'DEVOLUCION',
        returns: [...(s.returns || []), returnRecord],
      } : s);

      let updatedCR = state.currentCashRegister;
      if (updatedCR) {
        updatedCR = { ...updatedCR, movements: [...updatedCR.movements, {
          id: 'cm-' + uid(), type: 'EGRESO', concept: 'Devolución de cliente',
          amount: returnTotal, description: `Dev. ${saleId}`,
          userId, userName, createdAt: new Date().toISOString(),
        }]};
      }

      return { ...state, sales: updatedSales, products: updatedProducts, kardex: [...state.kardex, ...newKardex], currentCashRegister: updatedCR };
    }

    // RESET TOTAL DE DATA
    case 'RESET_ALL_DATA': {
      const keepUser = action.payload?.keepUser ? state.currentUser : null;
      return {
        ...INITIAL_STATE,
        currentUser: keepUser,
        activeModule: 'dashboard',
        toasts: [],
      };
    }

    // CONFIG
    case 'UPDATE_CONFIG':
      return { ...state, companyConfig: { ...state.companyConfig, ...action.payload } };

    // TOASTS
    case 'ADD_TOAST': {
      const t = { id: action.payload.id || uid(), ...action.payload };
      return { ...state, toasts: [...state.toasts, t] };
    }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };

    default: return state;
  }
}

// ── context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const toast = (message, type = 'success') => {
    const id = uid();
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3500);
  };

  // Cash balance helper
  const cashBalance = useMemo(() => {
    if (!state.currentCashRegister) return 0;
    return state.currentCashRegister.movements.reduce(
      (s, m) => m.type === 'INGRESO' ? s + m.amount : s - m.amount, 0
    );
  }, [state.currentCashRegister]);

  // Low-stock products
  const lowStockProducts = useMemo(
    () => state.products.filter(p => p.active && p.stock <= p.stockMin),
    [state.products]
  );

  // Today's sales
  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return state.sales.filter(s => new Date(s.createdAt).toDateString() === today);
  }, [state.sales]);

  // Verificar permiso del usuario actual (con fallback a plantilla de rol)
  const hasPermission = (key) => {
    if (!state.currentUser) return false;
    const perms = state.currentUser.permissions ?? ROLE_TEMPLATES[state.currentUser.role] ?? [];
    return perms.includes(key);
  };

  const value = { state, dispatch, toast, cashBalance, lowStockProducts, todaySales, hasPermission };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
