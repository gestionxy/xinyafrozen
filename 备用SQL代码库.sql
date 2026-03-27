-- ==========================================
-- xinyafrozen 备用SQL代码库 (综合完整版)
-- 该文件用于数据和程序的整体迁移，包含了系统所有数据表及相关字段的创建语句。
-- 以后新增加的 SQL 语句可以继续追加补充到此文件中。
-- ==========================================

-- ==========================================
-- 1. 用户/客户表 (Profiles / Clients)
-- ==========================================
create table if not exists public.profiles (
  id text primary key,
  email text,
  password text,
  company_name text,
  role text default 'client',
  phone text,
  address text,
  delivery_address text,
  payment_method text,
  discount_rate float default 1.0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;
create policy "Public profiles access" on public.profiles for all using (true) with check (true);

-- ==========================================
-- 2. 产品表 (Products)
-- ==========================================
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text,
  name_cn text,
  name_fr text,
  company_name text,
  batch_code text,
  department text,
  price_unit float,
  price_case float,
  taxable boolean default false,
  image_url text,
  stock int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.products enable row level security;
create policy "Public products access" on public.products for all using (true) with check (true);

-- ==========================================
-- 3. 订单表 (Orders)
-- ==========================================
create table if not exists public.orders (
  id text primary key,
  user_id text,
  user_name text,
  sub_total float,
  discount_rate float default 1.0,
  tax_tps float,
  tax_tvq float,
  total float,
  status text default 'pending',
  delivery_method text,
  delivery_time text,
  order_details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.orders enable row level security;
create policy "Public orders access" on public.orders for all using (true) with check (true);

-- ==========================================
-- 4. 公司信息表 (Company Info)
-- ==========================================
create table if not exists public.company_info (
  id uuid default gen_random_uuid() primary key,
  name text,
  address text,
  postal_code text,
  email text,
  phone text,
  gst text,
  qst text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.company_info enable row level security;
create policy "Public company_info access" on public.company_info for all using (true) with check (true);

insert into public.company_info (name)
select 'My Company'
where not exists (select 1 from public.company_info);

-- ==========================================
-- 5. 存储桶 (Storage Buckets)
-- ==========================================
insert into storage.buckets (id, name, public) 
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "Public Access" on storage.objects for all using ( bucket_id = 'products' );

-- ==========================================
-- 6. 库存盘点表 (Stock Management)
-- ==========================================

-- Stock Items Table (Products)
create table if not exists stock_items (
  id uuid default gen_random_uuid() primary key,
  product_name text not null,
  company_name text not null,
  is_manual boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(product_name, company_name)
);

-- Stock Columns Table (Dynamic Columns like '0219')
create table if not exists stock_columns (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Stock Values Table (Cell Data)
create table if not exists stock_values (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references stock_items(id) on delete cascade not null,
  column_name text references stock_columns(name) on delete cascade not null,
  value text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(item_id, column_name)
);

-- RLS Policies for Stock
alter table stock_items enable row level security;
create policy "Enable all access for all users" on stock_items for all using (true) with check (true);

alter table stock_columns enable row level security;
create policy "Enable all access for all users" on stock_columns for all using (true) with check (true);

alter table stock_values enable row level security;
create policy "Enable all access for all users" on stock_values for all using (true) with check (true);

-- ==========================================
-- 7. 供应商表 (Suppliers)
-- ==========================================
create table if not exists public.suppliers (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.suppliers enable row level security;
create policy "Enable all access for all users" on public.suppliers for all using (true) with check (true);

-- ==========================================
-- 8. 历史大订单表 (Order Sessions & Items)
-- ==========================================
create table if not exists public.order_sessions (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.order_sessions enable row level security;
create policy "Enable all access for all users" on public.order_sessions for all using (true) with check (true);

create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.order_sessions(id) on delete cascade not null,
  product_id text,
  product_name text,
  company_name text,
  image_url text,
  quantity numeric,
  unit text,
  stock text,
  unit_price float, -- 新增的单价字段
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.order_items enable row level security;
create policy "Enable all access for all users" on public.order_items for all using (true) with check (true);

-- ==========================================
-- 9. 简易采购订单表 (Simple Order Admin)
-- ==========================================
create table if not exists public.simple_order_sessions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone
);

alter table public.simple_order_sessions enable row level security;
create policy "Enable all access for all users" on public.simple_order_sessions for all using (true) with check (true);

create table if not exists public.simple_orders (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.simple_order_sessions(id) on delete cascade not null,
  product_name text not null,
  company_name text not null,
  quantity numeric,
  department text,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.simple_orders enable row level security;
create policy "Enable all access for all users" on public.simple_orders for all using (true) with check (true);
