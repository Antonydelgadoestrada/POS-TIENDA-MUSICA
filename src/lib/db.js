import { supabase, DB_ENABLED } from './supabase';
import {
  INITIAL_USERS, INITIAL_PRODUCTS, INITIAL_KARDEX,
  INITIAL_COMPANY, INITIAL_CASH_REGISTER, INITIAL_SALES,
} from '../data/initialData';

// ── Cargar TODO desde Supabase al iniciar ─────────────────────────────────────
export async function loadAllData() {
  if (!DB_ENABLED) return null;

  try {
    const [
      { data: users,     error: e1 },
      { data: products,  error: e2 },
      { data: sales,     error: e3 },
      { data: kardex,    error: e4 },
      { data: cashRegs,  error: e5 },
      { data: config,    error: e6 },
      { data: incoming,  error: e7 },
      { data: outgoing,  error: e8 },
    ] = await Promise.all([
      supabase.from('users').select('*').order('createdAt'),
      supabase.from('products').select('*').order('createdAt'),
      supabase.from('sales').select('*').order('createdAt'),
      supabase.from('kardex').select('*').order('createdAt'),
      supabase.from('cash_registers').select('*'),
      supabase.from('company_config').select('*').eq('id', 1).single(),
      supabase.from('incoming_history').select('*').order('createdAt'),
      supabase.from('outgoing_history').select('*').order('createdAt'),
    ]);

    const loadErrors = [e1,e2,e3,e4,e5,e7,e8].filter(Boolean);
    if (loadErrors.length) console.warn('Supabase load warnings:', loadErrors);

    // Primera vez: sembrar datos iniciales si las tablas están vacías
    if (!users || users.length === 0) {
      await seedInitialData();
      return loadAllData(); // Reintentar después de sembrar
    }

    const openCashReg = cashRegs?.find(cr => cr.status === 'OPEN') ?? null;
    const cashHistory = cashRegs?.filter(cr => cr.status !== 'OPEN') ?? [];

    // Calcular nextSaleId desde las ventas existentes
    const maxId = (sales ?? []).reduce((max, s) => {
      const n = parseInt(s.id?.replace('V-', '') ?? '0');
      return isNaN(n) ? max : Math.max(max, n);
    }, 3);

    return {
      users:               users     ?? [],
      products:            products  ?? [],
      sales:               sales     ?? [],
      kardex:              kardex    ?? [],
      currentCashRegister: openCashReg,
      cashHistory,
      incomingHistory:     incoming  ?? [],
      outgoingHistory:     outgoing  ?? [],
      companyConfig:       config    ?? INITIAL_COMPANY,
      nextSaleId:          maxId + 1,
    };
  } catch (err) {
    console.error('Error cargando datos de Supabase:', err);
    return null;
  }
}

// ── Sembrar datos iniciales (primera vez) ─────────────────────────────────────
async function seedInitialData() {
  try {
    await Promise.all([
      supabase.from('users').upsert(INITIAL_USERS),
      supabase.from('products').upsert(INITIAL_PRODUCTS),
      supabase.from('kardex').upsert(INITIAL_KARDEX),
      supabase.from('cash_registers').upsert([{ ...INITIAL_CASH_REGISTER, status: 'OPEN' }]),
      supabase.from('company_config').upsert([{ id: 1, ...INITIAL_COMPANY }]),
      supabase.from('sales').upsert(INITIAL_SALES),
    ]);
    console.log('✅ Datos iniciales cargados en Supabase');
  } catch (err) {
    console.error('Error sembrando datos:', err);
  }
}

// ── Operaciones por tabla ─────────────────────────────────────────────────────
export const db = {
  // Products
  async upsertProducts(products) {
    if (!DB_ENABLED) return;
    const { error } = await supabase.from('products').upsert(products);
    if (error) console.error('upsertProducts:', error);
  },

  // Sales
  async upsertSale(sale) {
    if (!DB_ENABLED || !sale) return;
    const { error } = await supabase.from('sales').upsert(sale);
    if (error) console.error('upsertSale:', error);
  },

  // Kardex
  async upsertKardex(entries) {
    if (!DB_ENABLED || !entries?.length) return;
    const { error } = await supabase.from('kardex').upsert(entries);
    if (error) console.error('upsertKardex:', error);
  },

  // Cash register
  async upsertCashRegister(cr) {
    if (!DB_ENABLED || !cr) return;
    const { error } = await supabase.from('cash_registers').upsert({ ...cr, status: 'OPEN' });
    if (error) console.error('upsertCashRegister:', error);
  },
  async closeCashRegister(cr) {
    if (!DB_ENABLED || !cr) return;
    const { error } = await supabase.from('cash_registers').upsert({ ...cr, status: 'CLOSED' });
    if (error) console.error('closeCashRegister:', error);
  },

  // Users
  async upsertUsers(users) {
    if (!DB_ENABLED) return;
    const { error } = await supabase.from('users').upsert(users);
    if (error) console.error('upsertUsers:', error);
  },
  async deleteUser(id) {
    if (!DB_ENABLED) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) console.error('deleteUser:', error);
  },

  // Config
  async updateConfig(config) {
    if (!DB_ENABLED) return;
    const { error } = await supabase.from('company_config').upsert({ id: 1, ...config });
    if (error) console.error('updateConfig:', error);
  },

  // Mercadería
  async upsertIncoming(record) {
    if (!DB_ENABLED || !record) return;
    const { error } = await supabase.from('incoming_history').upsert(record);
    if (error) console.error('upsertIncoming:', error);
  },
  async upsertOutgoing(record) {
    if (!DB_ENABLED || !record) return;
    const { error } = await supabase.from('outgoing_history').upsert(record);
    if (error) console.error('upsertOutgoing:', error);
  },

  // Reset total
  async resetAll() {
    if (!DB_ENABLED) return;
    await Promise.all([
      supabase.from('sales').delete().neq('id', ''),
      supabase.from('kardex').delete().neq('id', ''),
      supabase.from('cash_registers').delete().neq('id', ''),
      supabase.from('incoming_history').delete().neq('id', ''),
      supabase.from('outgoing_history').delete().neq('id', ''),
    ]);
    await seedInitialData();
  },
};
