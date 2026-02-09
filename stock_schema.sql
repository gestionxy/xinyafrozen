
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

-- RLS Policies (Open for now based on your existing pattern, adjust if needed)
alter table stock_items enable row level security;
create policy "Enable all access for all users" on stock_items for all using (true) with check (true);

alter table stock_columns enable row level security;
create policy "Enable all access for all users" on stock_columns for all using (true) with check (true);

alter table stock_values enable row level security;
create policy "Enable all access for all users" on stock_values for all using (true) with check (true);
