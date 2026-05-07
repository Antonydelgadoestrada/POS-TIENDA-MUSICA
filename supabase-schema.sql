-- ============================================================
-- POS TIENDA MÚSICA — Schema para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create table if not exists users (
  id text primary key,
  name text not null,
  username text unique not null,
  password text not null,
  role text not null default 'CAJERO',
  active boolean default true,
  permissions jsonb default '[]'::jsonb,
  "createdAt" text
);

create table if not exists products (
  id text primary key,
  sku text default '',
  name text not null,
  brand text default '',
  model text default '',
  category text default '',
  description text default '',
  cost numeric default 0,
  price numeric default 0,
  stock int default 0,
  "stockMin" int default 2,
  "stockMax" int default 20,
  location text default '',
  type text default 'PRODUCTO_CON_CODIGO',
  active boolean default true,
  image text default '',
  "comboContents" text default '',
  "createdAt" text
);

create table if not exists sales (
  id text primary key,
  "createdAt" text,
  "userId" text,
  "userName" text,
  items jsonb default '[]'::jsonb,
  subtotal numeric default 0,
  discount numeric default 0,
  "taxRate" numeric default 18,
  tax numeric default 0,
  total numeric default 0,
  payments jsonb default '[]'::jsonb,
  "paymentSummary" text default '',
  status text default 'ACTIVA',
  cancellation jsonb,
  returns jsonb default '[]'::jsonb
);

create table if not exists kardex (
  id text primary key,
  "productId" text,
  "productName" text,
  type text,
  concept text,
  reference text,
  "userId" text,
  "userName" text,
  "qtyIn" int default 0,
  "qtyOut" int default 0,
  "stockBefore" int default 0,
  "stockAfter" int default 0,
  "unitCost" numeric default 0,
  "totalValue" numeric default 0,
  "createdAt" text
);

create table if not exists cash_registers (
  id text primary key,
  "openedAt" text,
  "openedBy" text,
  "openedByName" text,
  "initialAmount" numeric default 0,
  movements jsonb default '[]'::jsonb,
  "closedAt" text,
  "closedBy" text,
  "closedByName" text,
  "theoreticalBalance" numeric,
  "realBalance" numeric,
  difference numeric,
  notes text,
  status text default 'OPEN'
);

create table if not exists company_config (
  id int primary key default 1,
  name text default 'Mi Tienda',
  ruc text default '',
  address text default '',
  phone text default '',
  email text default '',
  "taxName" text default 'IGV',
  "taxRate" numeric default 18,
  currency text default 'PEN',
  "paymentMethods" jsonb default '["Efectivo","Tarjeta","Yape","Plin"]'::jsonb,
  categories jsonb default '["Cuerdas","Vientos","Percusión","Teclados","Accesorios","Amplificación","Software","Otros"]'::jsonb
);

create table if not exists incoming_history (
  id text primary key,
  supplier text,
  "docNum" text,
  "docDate" text,
  items jsonb default '[]'::jsonb,
  "userId" text,
  "userName" text,
  "createdAt" text
);

create table if not exists outgoing_history (
  id text primary key,
  reason text,
  "docDate" text,
  items jsonb default '[]'::jsonb,
  "userId" text,
  "userName" text,
  "createdAt" text
);

-- Desactivar RLS para uso interno (herramienta interna de tienda)
alter table users disable row level security;
alter table products disable row level security;
alter table sales disable row level security;
alter table kardex disable row level security;
alter table cash_registers disable row level security;
alter table company_config disable row level security;
alter table incoming_history disable row level security;
alter table outgoing_history disable row level security;
