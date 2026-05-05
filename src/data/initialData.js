
import { ROLE_TEMPLATES } from './permissions';

// ─── helpers ────────────────────────────────────────────────────────────────
const ts = (daysAgo = 0, h = 9, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

// ─── USERS ───────────────────────────────────────────────────────────────────
export const INITIAL_USERS = [
  { id: 'u1', name: 'Administrador', username: 'admin',     password: 'admin123', role: 'ADMIN',    active: true, createdAt: ts(30), permissions: ROLE_TEMPLATES.ADMIN    },
  { id: 'u2', name: 'Juan Cajero',   username: 'cajero1',   password: 'caj123',   role: 'CAJERO',   active: true, createdAt: ts(20), permissions: ROLE_TEMPLATES.CAJERO   },
  { id: 'u3', name: 'María Auxiliar',username: 'auxiliar1', password: 'aux123',   role: 'AUXILIAR', active: true, createdAt: ts(15), permissions: ROLE_TEMPLATES.AUXILIAR },
];

// ─── PRODUCTS (precios en Soles) ─────────────────────────────────────────────
export const INITIAL_PRODUCTS = [
  { id:'p01', sku:'FEND-STRAT-01', name:'Guitarra Eléctrica Fender Stratocaster', category:'Cuerdas',       brand:'Fender',        model:'Stratocaster',       description:'Guitarra eléctrica de cuerpo sólido, acabado sunburst.',          cost:1900, price:3299, stock:8,  stockMin:2, stockMax:20, location:'A-01', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(60) },
  { id:'p02', sku:'YAMA-F310-01',  name:'Guitarra Acústica Yamaha F310',          category:'Cuerdas',       brand:'Yamaha',         model:'F310',               description:'Guitarra acústica de tapa sólida, ideal para principiantes.',    cost:350,  price:699,  stock:15, stockMin:3, stockMax:30, location:'A-02', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(58) },
  { id:'p03', sku:'IBAN-GSR200-01',name:'Bajo Eléctrico Ibanez GSR200',           category:'Cuerdas',       brand:'Ibanez',         model:'GSR200',             description:'Bajo eléctrico de 4 cuerdas, cuerpo agathis.',                  cost:640,  price:1099, stock:6,  stockMin:2, stockMax:15, location:'A-03', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(55) },
  { id:'p04', sku:'CASI-CTS300-01',name:'Piano Digital Casio CT-S300',            category:'Teclados',      brand:'Casio',          model:'CT-S300',            description:'Teclado digital de 61 teclas con 400 timbres.',                 cost:950,  price:1699, stock:5,  stockMin:1, stockMax:10, location:'B-01', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(50) },
  { id:'p05', sku:'PERL-RS-01',    name:'Batería Acústica Pearl Roadshow',        category:'Percusión',     brand:'Pearl',          model:'Roadshow',           description:'Set completo de batería acústica de 5 piezas.',                 cost:1400, price:2399, stock:3,  stockMin:1, stockMax:8,  location:'C-01', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(48) },
  { id:'p06', sku:'STEN-VIO44-01', name:'Violín 4/4 Stentor Student',            category:'Cuerdas',       brand:'Stentor',        model:'Student II',         description:'Violín de estudio tamaño completo con arco y estuche.',         cost:310,  price:549,  stock:10, stockMin:2, stockMax:20, location:'A-04', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(45) },
  { id:'p07', sku:'BACH-TR300-01', name:'Trompeta Bach TR300',                   category:'Vientos',       brand:'Bach',           model:'TR300',              description:'Trompeta en Si♭ de latón lacado, ideal para estudiantes.',      cost:840,  price:1469, stock:4,  stockMin:1, stockMax:10, location:'D-01', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(42) },
  { id:'p08', sku:'ARTU-MINI-01',  name:'Teclado MIDI Arturia MiniLab',          category:'Teclados',      brand:'Arturia',        model:'MiniLab MkII',       description:'Controlador MIDI USB de 25 teclas mini.',                       cost:240,  price:399,  stock:12, stockMin:3, stockMax:25, location:'B-02', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(40) },
  { id:'p09', sku:'FEND-FF10G-01', name:'Amplificador Fender Frontman 10G',      category:'Amplificación', brand:'Fender',         model:'Frontman 10G',       description:'Amplificador de guitarra 10W con entrada auxiliar.',            cost:190,  price:329,  stock:9,  stockMin:2, stockMax:18, location:'E-01', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(38) },
  { id:'p10', sku:'SHUR-SM58-01',  name:'Micrófono Shure SM58',                  category:'Accesorios',    brand:'Shure',          model:'SM58',               description:'Micrófono dinámico cardioide para voces en vivo.',              cost:210,  price:369,  stock:14, stockMin:3, stockMax:30, location:'F-01', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(35) },
  { id:'p11', sku:'ERBA-2221-01',  name:'Cuerdas Ernie Ball 2221 (pack)',         category:'Accesorios',    brand:'Ernie Ball',     model:'Regular Slinky',     description:'Juego de cuerdas para guitarra eléctrica calibre 10-46.',       cost:15,   price:29,   stock:50, stockMin:10,stockMax:100,location:'F-02', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(32) },
  { id:'p12', sku:'VICF-5A-01',    name:'Baquetas Vic Firth 5A (par)',            category:'Percusión',     brand:'Vic Firth',      model:'American Classic 5A',description:'Baquetas de madera de nogal, punta de madera.',                cost:22,   price:45,   stock:35, stockMin:8, stockMax:80, location:'C-02', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(30) },
  { id:'p13', sku:'KORG-AWOTG-01', name:'Afinador Clip-On Korg AW-OTG',          category:'Accesorios',    brand:'Korg',           model:'AW-OTG-POLY',        description:'Afinador cromático de clip para todo tipo de instrumento.',     cost:40,   price:69,   stock:20, stockMin:5, stockMax:40, location:'F-03', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(28) },
  { id:'p14', sku:'ATRL-FOLD-01',  name:'Atril de Música Plegable',              category:'Accesorios',    brand:'Genérico',       model:'Plegable Standard',  description:'Atril metálico plegable, altura ajustable.',                    cost:44,   price:89,   stock:18, stockMin:4, stockMax:35, location:'F-04', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(25) },
  { id:'p15', sku:'CABL-3M-01',    name:'Cable Instrumento 3m',                  category:'Accesorios',    brand:'Hosa',           model:'HSS-003',            description:'Cable TS 6.35mm de 3 metros para instrumentos.',               cost:26,   price:55,   stock:1,  stockMin:5, stockMax:50, location:'F-05', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(22) },
  { id:'p16', sku:'ROLN-JC120-01', name:'Amplificador Roland JC-120',            category:'Amplificación', brand:'Roland',         model:'Jazz Chorus 120',    description:'Amplificador de guitarra estéreo 120W, efecto chorus.',         cost:2860, price:4799, stock:2,  stockMin:1, stockMax:5,  location:'E-02', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(20) },
  { id:'p17', sku:'AUDA-M50X-01',  name:'Auriculares Audio-Technica ATH-M50x',   category:'Accesorios',    brand:'Audio-Technica', model:'ATH-M50x',           description:'Auriculares de monitoreo profesional, respuesta plana.',        cost:440,  price:729,  stock:7,  stockMin:2, stockMax:15, location:'F-06', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(18) },
  { id:'p18', sku:'SCHL-AL03-01',  name:'Software Ableton Live 11 Lite (código)',category:'Software',      brand:'Ableton',        model:'Live 11 Lite',       description:'Licencia digital de software DAW para producción musical.',     cost:145,  price:289,  stock:0,  stockMin:5, stockMax:30, location:'DIGITAL', image:'', type:'PRODUCTO_CON_CODIGO', active:true, createdAt:ts(15) },
];

// ─── COMPANY CONFIG ──────────────────────────────────────────────────────────
export const INITIAL_COMPANY = {
  name: 'MusicWorld Pro',
  ruc: '20512345678',
  address: 'Av. Musical 123, Lima, Perú',
  phone: '+51 1 234-5678',
  email: 'ventas@musicworldpro.com',
  taxName: 'IGV',
  taxRate: 18,
  currency: 'PEN',
  paymentMethods: ['Efectivo', 'Tarjeta', 'Yape', 'Plin'],
  categories: ['Cuerdas','Vientos','Percusión','Teclados','Accesorios','Amplificación','Software','Otros'],
};

// ─── PRE-LOADED CASH REGISTER ────────────────────────────────────────────────
// Saldo inicial S/500 + 3 ventas del día
export const INITIAL_CASH_REGISTER = {
  id: 'cr1',
  openedAt: ts(0, 8, 0),
  openedBy: 'u2',
  openedByName: 'Juan Cajero',
  initialAmount: 500,
  movements: [
    { id:'cm1', type:'INGRESO', concept:'Apertura de caja', amount:500,    description:'Saldo inicial',  userId:'u2', userName:'Juan Cajero', createdAt: ts(0,8,0)   },
    { id:'cm2', type:'INGRESO', concept:'Venta',            amount:121.54, description:'V-0001',         userId:'u2', userName:'Juan Cajero', createdAt: ts(0,9,15)  },
    { id:'cm3', type:'INGRESO', concept:'Venta',            amount:146.32, description:'V-0002',         userId:'u2', userName:'Juan Cajero', createdAt: ts(0,10,45) },
    { id:'cm4', type:'INGRESO', concept:'Venta',            amount:885.00, description:'V-0003',         userId:'u2', userName:'Juan Cajero', createdAt: ts(0,12,0)  },
  ],
};

// ─── PRE-LOADED SALES (montos en Soles) ──────────────────────────────────────
export const INITIAL_SALES = [
  {
    id: 'V-0001',
    createdAt: ts(0, 9, 15),
    userId: 'u2', userName: 'Juan Cajero',
    items: [
      { productId:'p11', name:'Cuerdas Ernie Ball 2221', price:29, qty:2, subtotal:58 },
      { productId:'p12', name:'Baquetas Vic Firth 5A',   price:45, qty:1, subtotal:45 },
    ],
    subtotal: 103, discount: 0, taxRate: 18, tax: 18.54, total: 121.54,
    payments: [{ method:'Efectivo', amount:121.54, received:130, change:8.46 }],
    paymentSummary: 'Efectivo', status: 'ACTIVA',
  },
  {
    id: 'V-0002',
    createdAt: ts(0, 10, 45),
    userId: 'u2', userName: 'Juan Cajero',
    items: [
      { productId:'p13', name:'Afinador Korg AW-OTG', price:69, qty:1, subtotal:69 },
      { productId:'p15', name:'Cable Instrumento 3m',  price:55, qty:1, subtotal:55 },
    ],
    subtotal: 124, discount: 0, taxRate: 18, tax: 22.32, total: 146.32,
    payments: [{ method:'Tarjeta', amount:146.32, lastFour:'4521' }],
    paymentSummary: 'Tarjeta ****4521', status: 'ACTIVA',
  },
  {
    id: 'V-0003',
    createdAt: ts(0, 12, 0),
    userId: 'u2', userName: 'Juan Cajero',
    items: [
      { productId:'p02', name:'Guitarra Acústica Yamaha F310', price:699, qty:1, subtotal:699 },
      { productId:'p14', name:'Atril de Música Plegable',      price:89,  qty:1, subtotal:89  },
    ],
    subtotal: 788, discount: 38, taxRate: 18, tax: 135.00, total: 885.00,
    payments: [{ method:'Transferencia', amount:885.00, reference:'TRF-87654' }],
    paymentSummary: 'Transferencia TRF-87654', status: 'ACTIVA',
  },
];

// ─── PRE-LOADED KARDEX ───────────────────────────────────────────────────────
export const INITIAL_KARDEX = [
  // Stock entries (initial stock loads) — costos en Soles, auto desde INITIAL_PRODUCTS
  ...INITIAL_PRODUCTS.map((p, i) => ({
    id: `k-init-${p.id}`,
    productId: p.id, productName: p.name,
    type: 'ENTRADA', concept: 'Stock inicial',
    reference: 'APERTURA', userId: 'u1', userName: 'Administrador',
    qtyIn: p.stock, qtyOut: 0,
    stockBefore: 0, stockAfter: p.stock,
    unitCost: p.cost, totalValue: p.stock * p.cost,
    createdAt: ts(60 - i),
  })),
  // Sale V-0001 movements
  { id:'k-v1-1', productId:'p11', productName:'Cuerdas Ernie Ball 2221', type:'SALIDA', concept:'Venta', reference:'V-0001', userId:'u2', userName:'Juan Cajero', qtyIn:0, qtyOut:2, stockBefore:52, stockAfter:50, unitCost:15, totalValue:30,  createdAt:ts(0,9,15)  },
  { id:'k-v1-2', productId:'p12', productName:'Baquetas Vic Firth 5A',   type:'SALIDA', concept:'Venta', reference:'V-0001', userId:'u2', userName:'Juan Cajero', qtyIn:0, qtyOut:1, stockBefore:36, stockAfter:35, unitCost:22, totalValue:22,  createdAt:ts(0,9,15)  },
  // Sale V-0002 movements
  { id:'k-v2-1', productId:'p13', productName:'Afinador Korg AW-OTG',   type:'SALIDA', concept:'Venta', reference:'V-0002', userId:'u2', userName:'Juan Cajero', qtyIn:0, qtyOut:1, stockBefore:21, stockAfter:20, unitCost:40, totalValue:40,  createdAt:ts(0,10,45) },
  { id:'k-v2-2', productId:'p15', productName:'Cable Instrumento 3m',    type:'SALIDA', concept:'Venta', reference:'V-0002', userId:'u2', userName:'Juan Cajero', qtyIn:0, qtyOut:1, stockBefore:2,  stockAfter:1,  unitCost:26, totalValue:26,  createdAt:ts(0,10,45) },
  // Sale V-0003 movements
  { id:'k-v3-1', productId:'p02', productName:'Guitarra Acústica Yamaha F310', type:'SALIDA', concept:'Venta', reference:'V-0003', userId:'u2', userName:'Juan Cajero', qtyIn:0, qtyOut:1, stockBefore:16, stockAfter:15, unitCost:350, totalValue:350, createdAt:ts(0,12,0) },
  { id:'k-v3-2', productId:'p14', productName:'Atril de Música Plegable',      type:'SALIDA', concept:'Venta', reference:'V-0003', userId:'u2', userName:'Juan Cajero', qtyIn:0, qtyOut:1, stockBefore:19, stockAfter:18, unitCost:44,  totalValue:44,  createdAt:ts(0,12,0) },
];

// ─── PREVIOUS DAY SALES — montos en Soles ────────────────────────────────────
export const INITIAL_PREV_SALES = [
  { date: ts(6), total: 1150.50, count: 4 },
  { date: ts(5), total: 1785.00, count: 6 },
  { date: ts(4), total:  730.75, count: 3 },
  { date: ts(3), total: 2461.20, count: 8 },
  { date: ts(2), total: 1998.80, count: 7 },
  { date: ts(1), total: 1435.00, count: 5 },
];
