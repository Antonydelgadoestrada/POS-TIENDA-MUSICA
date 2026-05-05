// ── Definición de todos los permisos del sistema ─────────────────────────────
export const PERMISSIONS = {
  // General
  view_dashboard:    { label: 'Ver dashboard y estadísticas',       group: 'General' },

  // Ventas
  use_pos:           { label: 'Usar punto de venta (POS)',           group: 'Ventas' },
  view_sales:        { label: 'Ver lista de todas las ventas',       group: 'Ventas' },
  cancel_sales:      { label: 'Anular notas de venta',               group: 'Ventas' },
  return_items:      { label: 'Registrar devoluciones de productos', group: 'Ventas' },

  // Caja
  view_cash:         { label: 'Acceder al módulo de caja',           group: 'Caja' },
  open_cash:         { label: 'Abrir caja',                          group: 'Caja' },
  close_cash:        { label: 'Cerrar caja',                         group: 'Caja' },
  cash_movements:    { label: 'Registrar ingresos/egresos de caja',  group: 'Caja' },

  // Productos
  view_products:     { label: 'Ver catálogo de productos',           group: 'Productos' },
  manage_products:   { label: 'Crear, editar y desactivar productos',group: 'Productos' },

  // Inventario
  view_inventory:    { label: 'Ver inventario y stocks',             group: 'Inventario' },
  adjust_inventory:  { label: 'Ajustar stock manualmente',           group: 'Inventario' },
  view_kardex:       { label: 'Ver kardex de movimientos',           group: 'Inventario' },
  view_alerts:       { label: 'Ver alertas de stock bajo',           group: 'Inventario' },

  // Mercadería
  view_mercaderia:   { label: 'Ver módulo de mercadería',            group: 'Mercadería' },
  manage_mercaderia: { label: 'Registrar ingresos/salidas de stock', group: 'Mercadería' },

  // Administración
  manage_users:      { label: 'Gestionar usuarios y permisos',       group: 'Administración' },
  manage_settings:   { label: 'Configuración del sistema',           group: 'Administración' },
  reset_data:        { label: 'Reiniciar datos del sistema',         group: 'Administración' },
};

// ── Permisos por defecto de cada rol (plantillas) ─────────────────────────────
export const ROLE_TEMPLATES = {
  ADMIN: Object.keys(PERMISSIONS),

  CAJERO: [
    'view_dashboard',
    'use_pos', 'view_sales', 'cancel_sales', 'return_items',
    'view_cash', 'open_cash', 'close_cash', 'cash_movements',
    'view_products',
    'view_kardex', 'view_alerts',
  ],

  AUXILIAR: [
    'view_dashboard',
    'view_products',
    'view_inventory', 'adjust_inventory',
    'view_kardex', 'view_alerts',
    'view_mercaderia', 'manage_mercaderia',
  ],
};

// ── Permiso mínimo requerido para acceder a cada módulo ───────────────────────
export const MODULE_PERMISSION = {
  dashboard:  'view_dashboard',
  pos:        'use_pos',
  products:   'view_products',
  inventory:  'view_inventory',
  mercaderia: 'view_mercaderia',
  kardex:     'view_kardex',
  alerts:     'view_alerts',
  cash:       'view_cash',
  sales:      'view_sales',
  settings:   'manage_settings',
  users:      'manage_users',
};

// ── Grupos para la UI ──────────────────────────────────────────────────────────
export const PERMISSION_GROUPS = [
  'General', 'Ventas', 'Caja', 'Productos', 'Inventario', 'Mercadería', 'Administración',
];
