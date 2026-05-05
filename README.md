# 🎸 MusicWorld Pro — Sistema POS

Sistema de Punto de Venta profesional para tiendas de instrumentos musicales. Construido con React + Tailwind CSS + Vite.

---

## 🚀 Instalación local (3 pasos)

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir en el navegador
# → http://localhost:5173
```

---

## 👤 Usuarios de prueba

| Usuario | Contraseña | Rol | Acceso |
|---------|-----------|-----|--------|
| `admin` | `admin123` | ADMIN | Todos los módulos |
| `cajero1` | `caj123` | CAJERO | Dashboard, POS, Kardex, Alertas, Caja |
| `auxiliar1` | `aux123` | AUXILIAR | Dashboard, Inventario, Mercadería, Kardex, Alertas |

---

## 📦 Módulos del sistema

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | KPIs del día, gráficas de ventas, tabla de últimas transacciones |
| **Punto de Venta (POS)** | Catálogo interactivo, carrito, métodos de pago múltiples, comprobante imprimible |
| **Productos** | CRUD completo, vista tabla/grid, filtros por categoría y estado de stock |
| **Inventario** | Estado visual del stock, ajustes manuales con motivo, valor valorizado |
| **Mercadería** | Ingresos de compra y salidas no-venta con historial completo |
| **Kardex** | Trazabilidad completa de movimientos por producto con filtros |
| **Alertas Stock** | Lista priorizada de productos agotados y con stock bajo |
| **Caja** | Apertura/cierre con cuadre, ingresos/egresos, historial de cierres |
| **Configuración** | Datos empresa, impuestos, categorías, métodos de pago |
| **Usuarios** | CRUD de usuarios con roles y permisos |

---

## ☁️ Deploy en Vercel (5 pasos)

1. Sube el proyecto a un repositorio GitHub
2. Crea cuenta gratuita en [vercel.com](https://vercel.com)
3. Haz clic en **"Add New Project"** → importa desde GitHub
4. Vercel detecta automáticamente Vite/React — no necesitas configurar nada
5. Haz clic en **"Deploy"** → en ~2 minutos estará en línea

```bash
# Para build de producción local
npm run build
# → Genera carpeta /dist lista para subir
```

---

## 🛠️ Tecnologías

- **React 18** — Hooks (useState, useReducer, useContext, useMemo)
- **Vite 4** — Bundler ultrarrápido
- **Tailwind CSS 3** — Estilos utilitarios
- **Recharts** — Gráficas de ventas y métricas
- **Lucide React** — Iconografía consistente

---

## 📋 Reglas de negocio

- ❌ No se puede vender sin caja abierta
- ❌ No se puede vender un producto con stock 0
- ✅ Toda venta actualiza stock + kardex + caja automáticamente
- ✅ Todo movimiento de mercadería actualiza stock + kardex
- ✅ El kardex es inmutable (solo lectura, no editable)
- ✅ Solo puede haber una caja abierta a la vez
- ✅ Los menús se ocultan según el rol del usuario

---

*MusicWorld Pro POS © 2025 — Desarrollado con ❤️ y 🎵*
