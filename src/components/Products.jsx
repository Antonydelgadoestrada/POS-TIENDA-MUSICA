import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search, Plus, Edit2, Eye, ToggleLeft, LayoutGrid, List,
  X, Check, Upload, Download, Tag, Package, Wrench, Layers,
} from 'lucide-react';

import { fmt } from '../lib/format';

// ── Configuración de tipos ───────────────────────────────────────────────────
const PRODUCT_TYPES = {
  PRODUCTO_CON_CODIGO: {
    label: 'Producto con código',
    shortLabel: 'Con código',
    desc: 'Artículo con código de barras o SKU',
    icon: Tag,
    colorClass: 'text-violet-400 bg-violet-500/15 border-violet-500/40',
    hoverCard: 'hover:border-violet-500/60 hover:bg-violet-500/5',
    skuRequired: true,
    showStock: true,
    skuPlaceholder: 'Ej: FEND-STRAT-01',
  },
  PRODUCTO_SIN_CODIGO: {
    label: 'Producto sin código',
    shortLabel: 'Sin código',
    desc: 'Artículo físico sin código de barras',
    icon: Package,
    colorClass: 'text-blue-400 bg-blue-500/15 border-blue-500/40',
    hoverCard: 'hover:border-blue-500/60 hover:bg-blue-500/5',
    skuRequired: false,
    showStock: true,
    skuPlaceholder: 'Opcional',
  },
  SERVICIO: {
    label: 'Servicio',
    shortLabel: 'Servicio',
    desc: 'Cambio de cuerdas, reparación, afinación, clases...',
    icon: Wrench,
    colorClass: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
    hoverCard: 'hover:border-emerald-500/60 hover:bg-emerald-500/5',
    skuRequired: false,
    showStock: false,
    skuPlaceholder: 'Opcional (ej: SRV-001)',
  },
  COMBO: {
    label: 'Combo / Kit',
    shortLabel: 'Combo',
    desc: 'Paquete de productos a precio especial',
    icon: Layers,
    colorClass: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
    hoverCard: 'hover:border-amber-500/60 hover:bg-amber-500/5',
    skuRequired: false,
    showStock: true,
    skuPlaceholder: 'Opcional (ej: KIT-001)',
  },
};

const getTypeConfig = (type) => PRODUCT_TYPES[type] || PRODUCT_TYPES.PRODUCTO_CON_CODIGO;

// ── Badge de tipo ─────────────────────────────────────────────────────────────
function TypeBadge({ type, size = 'sm' }) {
  const cfg = getTypeConfig(type);
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full font-medium ${cfg.colorClass} ${size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}>
      <Icon size={size === 'xs' ? 10 : 11} />
      {cfg.shortLabel}
    </span>
  );
}

// ── Selector de tipo (paso previo) ────────────────────────────────────────────
function TypeSelector({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 animate-fade-in sm:p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <h2 className="text-white font-bold text-lg">¿Qué deseas agregar?</h2>
            <p className="text-slate-400 text-xs mt-0.5">Selecciona el tipo para adaptar el formulario</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20}/>
          </button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          {Object.entries(PRODUCT_TYPES).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className={`flex flex-col items-start gap-3 p-4 rounded-xl border border-slate-700 transition-all text-left ${cfg.hoverCard} group`}
              >
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${cfg.colorClass}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm group-hover:text-white">{cfg.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-snug">{cfg.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Modal de producto ─────────────────────────────────────────────────────────
function ProductModal({ product, selectedType, categories, onClose, onSave }) {
  const { dispatch } = useApp();
  const resolvedType = product?.type || selectedType || 'PRODUCTO_CON_CODIGO';
  const cfg = getTypeConfig(resolvedType);
  const [addingCat, setAddingCat]   = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  const emptyForm = {
    sku: '', name: '', type: resolvedType,
    category: categories[0] || 'Cuerdas', brand: '', model: '',
    description: '',
    cost: 0, price: 0,
    stock: cfg.showStock ? 0 : 0,
    stockMin: cfg.showStock ? 2 : 0,
    stockMax: cfg.showStock ? 20 : 9999,
    location: '', active: true,
  };

  const [form, setForm] = useState(product ? { ...product } : emptyForm);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const margin = form.cost > 0 ? (((form.price - form.cost) / form.cost) * 100).toFixed(1) : 0;
  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };

  const handleAddCategory = () => {
    const cat = newCatInput.trim();
    if (!cat || categories.includes(cat)) { setAddingCat(false); setNewCatInput(''); return; }
    dispatch({ type: 'UPDATE_CONFIG', payload: { categories: [...categories, cat] } });
    set('category', cat);
    setAddingCat(false);
    setNewCatInput('');
  };

  const numericFields = [
    ['Precio de costo (S/)', 'cost'], ['Precio de venta (S/)', 'price'],
  ];
  const stockFields = [
    ['Stock actual', 'stock'], ['Stock mínimo', 'stockMin'], ['Stock máximo', 'stockMax'],
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 animate-fade-in sm:p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl animate-slide-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-bold text-lg">{product ? 'Editar' : 'Nuevo'}</h2>
            <TypeBadge type={resolvedType} />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* SKU */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {cfg.skuRequired ? 'SKU / Código de barras *' : 'SKU / Código de barras'}
              {!cfg.skuRequired && <span className="text-slate-600 ml-1">(opcional)</span>}
            </label>
            <input
              value={form.sku}
              onChange={e => set('sku', e.target.value)}
              required={cfg.skuRequired}
              placeholder={cfg.skuPlaceholder}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nombre *</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              placeholder={resolvedType === 'SERVICIO' ? 'Ej: Cambio de cuerdas guitarra' : 'Nombre del producto'}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Categoría + Marca */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Categoría</label>
              {addingCat ? (
                <div className="flex gap-1.5">
                  <input
                    autoFocus
                    value={newCatInput}
                    onChange={e => setNewCatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } if (e.key === 'Escape') { setAddingCat(false); setNewCatInput(''); } }}
                    placeholder="Nueva categoría..."
                    className="flex-1 bg-slate-900 border border-violet-500 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  />
                  <button type="button" onClick={handleAddCategory} className="px-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white"><Check size={14}/></button>
                  <button type="button" onClick={() => { setAddingCat(false); setNewCatInput(''); }} className="px-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300"><X size={14}/></button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <select value={form.category} onChange={e => set('category', e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" onClick={() => setAddingCat(true)}
                    className="px-2.5 rounded-xl bg-slate-700 hover:bg-violet-600 text-slate-400 hover:text-white transition-all" title="Nueva categoría">
                    <Plus size={14}/>
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {resolvedType === 'SERVICIO' ? 'Técnico / Área' : 'Marca'}
              </label>
              <input
                value={form.brand}
                onChange={e => set('brand', e.target.value)}
                required={resolvedType === 'PRODUCTO_CON_CODIGO'}
                placeholder={resolvedType === 'SERVICIO' ? 'Ej: Servicio técnico' : 'Marca'}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Modelo (solo no-servicio) */}
          {resolvedType !== 'SERVICIO' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Modelo</label>
              <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="Modelo"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
            </div>
          )}

          {/* Precios */}
          <div className="grid grid-cols-3 gap-4">
            {numericFields.map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                <input type="number" min="0" step="0.01" value={form[key]}
                  onChange={e => set(key, parseFloat(e.target.value)||0)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Margen</label>
              <div className="bg-slate-900 border border-slate-700 text-emerald-400 rounded-xl px-3 py-2.5 text-sm font-bold">{margin}%</div>
            </div>
          </div>

          {/* Stock — solo si el tipo lo requiere */}
          {cfg.showStock && (
            <div className="grid grid-cols-4 gap-4">
              {stockFields.map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                  <input type="number" min="0" value={form[key]}
                    onChange={e => set(key, parseInt(e.target.value)||0)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Ubicación</label>
                <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="A-01"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
              </div>
            </div>
          )}

          {/* COMBO — campo de contenido */}
          {resolvedType === 'COMBO' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Contenido del combo</label>
              <textarea
                value={form.comboContents || ''}
                onChange={e => set('comboContents', e.target.value)}
                rows={2}
                placeholder="Ej: Guitarra Yamaha F310 + Cuerdas + Afinador + Funda"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Descripción</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 resize-none" />
          </div>

          {/* Estado */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-slate-400">Estado</label>
            <button type="button" onClick={() => set('active', !form.active)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${form.active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
              {form.active ? <><Check size={13}/> Activo</> : <><X size={13}/> Inactivo</>}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all">Cancelar</button>
            <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold transition-all">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Detalle de producto ───────────────────────────────────────────────────────
function ProductDetail({ product, onClose, onEdit }) {
  const margin = product.cost > 0 ? (((product.price - product.cost) / product.cost) * 100).toFixed(1) : 0;
  const cfg = getTypeConfig(product.type);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 animate-fade-in sm:p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-white font-bold text-lg truncate">{product.name}</h2>
            <TypeBadge type={product.type} />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white ml-3 shrink-0"><X size={20}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-16 h-16 rounded-xl border flex items-center justify-center ${cfg.colorClass}`}>
              {React.createElement(cfg.icon, { size: 28 })}
            </div>
            <div>
              <p className="text-white font-bold">{product.brand} {product.model}</p>
              <p className="text-slate-400 text-sm">{product.category}</p>
              <div className="flex gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${product.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {product.active ? 'Activo' : 'Inactivo'}
                </span>
                {product.sku && <span className="bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full text-xs font-medium">{product.sku}</span>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['Precio costo', fmt(product.cost), 'slate'], ['Precio venta', fmt(product.price), 'violet'], ['Margen', `${margin}%`, 'green']].map(([l, v, c]) => (
              <div key={l} className="bg-slate-900 rounded-xl p-3 text-center">
                <p className="text-slate-500 text-xs mb-1">{l}</p>
                <p className={`font-bold text-sm ${c==='violet'?'text-violet-400':c==='green'?'text-emerald-400':'text-white'}`}>{v}</p>
              </div>
            ))}
          </div>
          {cfg.showStock && (
            <div className="grid grid-cols-3 gap-3">
              {[['Stock actual', product.stock, product.stock <= product.stockMin ? 'red':'green'],
                ['Stock mínimo', product.stockMin, 'slate'],
                ['Stock máximo', product.stockMax, 'slate']].map(([l, v, c]) => (
                <div key={l} className="bg-slate-900 rounded-xl p-3 text-center">
                  <p className="text-slate-500 text-xs mb-1">{l}</p>
                  <p className={`font-bold text-sm ${c==='green'?'text-emerald-400':c==='red'?'text-red-400':'text-white'}`}>{v}</p>
                </div>
              ))}
            </div>
          )}
          {product.comboContents && (
            <div className="bg-slate-900 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-1">Contenido del combo</p>
              <p className="text-slate-300 text-sm">{product.comboContents}</p>
            </div>
          )}
          <p className="text-slate-400 text-sm">{product.description}</p>
          {product.location && <p className="text-slate-500 text-xs">📍 {product.location} &nbsp;|&nbsp; Creado: {new Date(product.createdAt).toLocaleDateString('es-PE')}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all">Cerrar</button>
            <button onClick={onEdit} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
              <Edit2 size={15}/> Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Productos de muestra para importación ────────────────────────────────────
const SAMPLE_IMPORT = [
  { sku:'SRV-001', name:'Cambio de cuerdas - guitarra', category:'Servicios', brand:'Servicio técnico', model:'', description:'Incluye cuerdas estándar y mano de obra.', cost:15, price:45, stock:0, stockMin:0, stockMax:9999, location:'', type:'SERVICIO', active:true },
  { sku:'SRV-002', name:'Afinación de piano', category:'Servicios', brand:'Servicio técnico', model:'', description:'Afinación profesional de piano acústico.', cost:80, price:180, stock:0, stockMin:0, stockMax:9999, location:'', type:'SERVICIO', active:true },
  { sku:'SAMPLE-01', name:'Cajón Peruano LP Aspire', category:'Percusión', brand:'LP', model:'Aspire', description:'Cajón de madera de abedul, sonido cálido.', cost:320, price:549, stock:5, stockMin:2, stockMax:10, location:'C-03', type:'PRODUCTO_CON_CODIGO', active:true },
];

// ── Componente principal ──────────────────────────────────────────────────────
export default function Products() {
  const { state, dispatch, toast, hasPermission } = useApp();
  const { products, companyConfig } = state;
  const categories = companyConfig.categories;
  const canManage = hasPermission('manage_products');

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [filterType, setFilterType] = useState('');
  const [viewMode, setViewMode] = useState('table');

  // modals
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [modalEdit, setModalEdit] = useState(null);
  const [modalDetail, setModalDetail] = useState(null);

  const filtered = useMemo(() => products.filter(p => {
    const s = search.toLowerCase();
    if (search && !p.name.toLowerCase().includes(s) && !p.sku?.toLowerCase().includes(s) && !p.brand?.toLowerCase().includes(s)) return false;
    if (filterCat && p.category !== filterCat) return false;
    if (filterStatus === 'active' && !p.active) return false;
    if (filterStatus === 'inactive' && p.active) return false;
    if (filterStock === 'low' && (!getTypeConfig(p.type).showStock || p.stock > p.stockMin)) return false;
    if (filterStock === 'zero' && p.stock !== 0) return false;
    if (filterType && p.type !== filterType) return false;
    return true;
  }), [products, search, filterCat, filterStatus, filterStock, filterType]);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setShowTypeSelector(false);
  };

  const handleSave = (form) => {
    if (modalEdit) {
      dispatch({ type: 'UPDATE_PRODUCT', payload: { ...form, id: modalEdit.id } });
      toast('Producto actualizado', 'success');
      setModalEdit(null);
    } else {
      dispatch({ type: 'ADD_PRODUCT', payload: form });
      toast('Ítem creado correctamente', 'success');
      setSelectedType(null);
    }
  };

  const handleBulkImport = () => {
    SAMPLE_IMPORT.forEach(p => dispatch({ type: 'ADD_PRODUCT', payload: p }));
    toast(`${SAMPLE_IMPORT.length} ítems importados`, 'success');
  };

  const handleExport = () => {
    if (window.confirm(`¿Exportar lista de ${filtered.length} productos a CSV?\n\nEn producción esto generaría un archivo descargable.`)) {
      toast(`${filtered.length} productos exportados (simulado)`, 'success');
    }
  };

  const stockBadge = (p) => {
    const cfg = getTypeConfig(p.type);
    if (!cfg.showStock) return null;
    if (p.stock === 0) return { label:'Agotado', c:'bg-red-500/20 text-red-400' };
    if (p.stock <= p.stockMin) return { label:'Stock bajo', c:'bg-amber-500/20 text-amber-400' };
    if (p.stock >= p.stockMax) return { label:'Óptimo', c:'bg-blue-500/20 text-blue-400' };
    return { label:'Normal', c:'bg-emerald-500/20 text-emerald-400' };
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Toolbar */}
      <div className="space-y-2">
        {/* Row 1: search + new button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              placeholder="Buscar nombre, SKU, marca..." />
          </div>
          {canManage && (
            <button onClick={() => setShowTypeSelector(true)}
              className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shrink-0">
              <Plus size={15}/> <span className="hidden sm:inline">Nuevo</span>
            </button>
          )}
        </div>
        {/* Row 2: filters + view toggle */}
        <div className="flex flex-wrap gap-2">
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none flex-1 min-w-0">
            <option value="">Categoría</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none flex-1 min-w-0">
            <option value="">Tipo</option>
            {Object.entries(PRODUCT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.shortLabel}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none">
            <option value="">Estado</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <select value={filterStock} onChange={e => setFilterStock(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none">
            <option value="">Stock</option>
            <option value="low">Stock bajo</option>
            <option value="zero">Agotados</option>
          </select>
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode==='table' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}><List size={14}/></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode==='grid' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}><LayoutGrid size={14}/></button>
          </div>
          {canManage && (
            <button onClick={handleBulkImport} className="bg-slate-700 text-slate-400 px-3 py-2 rounded-xl text-xs flex items-center gap-1 transition-all">
              <Upload size={13}/> <span className="hidden sm:inline">Importar</span>
            </button>
          )}
          <button onClick={handleExport} className="bg-slate-700 text-slate-400 px-3 py-2 rounded-xl text-xs flex items-center gap-1 transition-all">
            <Download size={13}/> <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      <p className="text-slate-500 text-xs">{filtered.length} de {products.length} ítems</p>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-slate-900/50">
                <tr className="text-slate-400 text-xs uppercase tracking-wide">
                  {['Tipo','SKU','Nombre','Categoría','Precio venta','Costo','Margen','Stock','Estado','Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map(p => {
                  const sb = stockBadge(p);
                  const margin = p.cost > 0 ? (((p.price - p.cost) / p.cost) * 100).toFixed(1) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3"><TypeBadge type={p.type} size="xs" /></td>
                      <td className="px-4 py-3 font-mono text-violet-400 text-xs">{p.sku || <span className="text-slate-600">—</span>}</td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium truncate max-w-[160px]">{p.name}</p>
                        <p className="text-slate-500 text-xs">{p.brand} {p.model}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{p.category}</td>
                      <td className="px-4 py-3 text-violet-400 font-bold whitespace-nowrap">{fmt(p.price)}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmt(p.cost)}</td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold whitespace-nowrap">{margin}%</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {sb
                          ? <><span className="font-bold text-white">{p.stock}</span><span className="text-slate-600 text-xs"> /{p.stockMin}</span></>
                          : <span className="text-slate-600 text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {sb
                          ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sb.c}`}>{sb.label}</span>
                          : <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-medium">Activo</span>
                        }
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setModalDetail(p)} className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-all"><Eye size={13}/></button>
                          {canManage && <>
                            <button onClick={() => setModalEdit(p)} className="p-1.5 rounded-lg bg-slate-700 hover:bg-violet-600 text-slate-400 hover:text-white transition-all"><Edit2 size={13}/></button>
                            <button onClick={() => { dispatch({ type:'DEACTIVATE_PRODUCT', payload: p.id }); toast('Desactivado','warning'); }}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-600/40 text-slate-400 hover:text-red-400 transition-all" title="Desactivar">
                              <ToggleLeft size={13}/>
                            </button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-slate-500 py-10">No se encontraron ítems</p>}
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map(p => {
            const sb = stockBadge(p);
            const cfg = getTypeConfig(p.type);
            const Icon = cfg.icon;
            return (
              <div key={p.id} className="bg-slate-800 border border-slate-700 hover:border-violet-500/50 rounded-2xl p-4 transition-all">
                <div className={`w-full h-20 rounded-xl flex items-center justify-center mb-3 border ${cfg.colorClass}`}>
                  <Icon size={32} />
                </div>
                <TypeBadge type={p.type} size="xs" />
                <p className="text-white font-semibold text-sm leading-tight truncate mt-1.5">{p.name}</p>
                <p className="text-slate-500 text-xs mt-0.5 truncate">{p.brand} · {p.category}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-violet-400 font-bold text-sm">{fmt(p.price)}</span>
                  {sb && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${sb.c}`}>{sb.label}</span>}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setModalDetail(p)} className="flex-1 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-all flex items-center justify-center gap-1"><Eye size={12}/> Ver</button>
                  <button onClick={() => setModalEdit(p)} className="flex-1 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-400 hover:text-white text-xs transition-all flex items-center justify-center gap-1"><Edit2 size={12}/> Editar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showTypeSelector && (
        <TypeSelector onSelect={handleTypeSelect} onClose={() => setShowTypeSelector(false)} />
      )}
      {selectedType && !showTypeSelector && (
        <ProductModal
          selectedType={selectedType}
          categories={categories}
          onClose={() => setSelectedType(null)}
          onSave={handleSave}
        />
      )}
      {modalEdit && (
        <ProductModal
          product={modalEdit}
          selectedType={modalEdit.type}
          categories={categories}
          onClose={() => setModalEdit(null)}
          onSave={handleSave}
        />
      )}
      {modalDetail && (
        <ProductDetail
          product={modalDetail}
          onClose={() => setModalDetail(null)}
          onEdit={() => { setModalEdit(modalDetail); setModalDetail(null); }}
        />
      )}
    </div>
  );
}
