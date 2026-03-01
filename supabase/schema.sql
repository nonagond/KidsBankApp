-- ============================================================
-- KidsBank — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ENUMS
create type public.transaction_type as enum (
  'deposit', 'withdrawal', 'allowance', 'goal_transfer'
);

create type public.allowance_frequency as enum (
  'daily', 'weekly', 'monthly'
);

-- ============================================================
-- FAMILIES (one per parent account)
-- ============================================================
create table public.families (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  family_name  text not null default 'My Family',
  pin_hash     text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint families_user_id_key unique (user_id)
);

-- ============================================================
-- KIDS
-- ============================================================
create table public.kids (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.families(id) on delete cascade,
  name         text not null,
  avatar       text not null default '🐱',
  balance      numeric(10, 2) not null default 0.00,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- TRANSACTIONS (full ledger)
-- ============================================================
create table public.transactions (
  id           uuid primary key default gen_random_uuid(),
  kid_id       uuid not null references public.kids(id) on delete cascade,
  amount       numeric(10, 2) not null,
  type         public.transaction_type not null,
  description  text,
  created_at   timestamptz not null default now()
);

create index transactions_kid_id_created_at_idx
  on public.transactions(kid_id, created_at desc);

-- ============================================================
-- SAVINGS GOALS
-- ============================================================
create table public.savings_goals (
  id             uuid primary key default gen_random_uuid(),
  kid_id         uuid not null references public.kids(id) on delete cascade,
  name           text not null,
  target_amount  numeric(10, 2) not null,
  current_amount numeric(10, 2) not null default 0.00,
  completed      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- ALLOWANCE SCHEDULES (one per kid)
-- ============================================================
create table public.allowance_schedules (
  id                uuid primary key default gen_random_uuid(),
  kid_id            uuid not null references public.kids(id) on delete cascade,
  amount            numeric(10, 2) not null,
  frequency         public.allowance_frequency not null,
  next_payment_date date not null,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint allowance_schedules_kid_id_key unique (kid_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.families            enable row level security;
alter table public.kids                enable row level security;
alter table public.transactions        enable row level security;
alter table public.savings_goals       enable row level security;
alter table public.allowance_schedules enable row level security;

-- Families: owner only
create policy "families_select" on public.families for select using (auth.uid() = user_id);
create policy "families_insert" on public.families for insert with check (auth.uid() = user_id);
create policy "families_update" on public.families for update using (auth.uid() = user_id);
create policy "families_delete" on public.families for delete using (auth.uid() = user_id);

-- Kids: via family ownership
create policy "kids_all" on public.kids for all using (
  exists (select 1 from public.families f where f.id = family_id and f.user_id = auth.uid())
);

-- Transactions: via kid → family
create policy "transactions_select" on public.transactions for select using (
  exists (
    select 1 from public.kids k join public.families f on f.id = k.family_id
    where k.id = kid_id and f.user_id = auth.uid()
  )
);
create policy "transactions_insert" on public.transactions for insert with check (
  exists (
    select 1 from public.kids k join public.families f on f.id = k.family_id
    where k.id = kid_id and f.user_id = auth.uid()
  )
);

-- Savings goals: via kid → family
create policy "goals_all" on public.savings_goals for all using (
  exists (
    select 1 from public.kids k join public.families f on f.id = k.family_id
    where k.id = kid_id and f.user_id = auth.uid()
  )
);

-- Allowance schedules: via kid → family
create policy "allowance_all" on public.allowance_schedules for all using (
  exists (
    select 1 from public.kids k join public.families f on f.id = k.family_id
    where k.id = kid_id and f.user_id = auth.uid()
  )
);

-- ============================================================
-- DB FUNCTION: apply_transaction
-- Atomically updates kid balance + inserts transaction record.
-- All money mutations in the app go through this function.
-- ============================================================
create or replace function public.apply_transaction(
  p_kid_id      uuid,
  p_amount      numeric,
  p_type        public.transaction_type,
  p_description text default null
)
returns public.transactions
language plpgsql security definer
as $$
declare
  v_delta numeric;
  v_kid   public.kids;
  v_txn   public.transactions;
begin
  -- Deposits and allowances add; withdrawals and goal transfers subtract
  if p_type in ('deposit', 'allowance') then
    v_delta := abs(p_amount);
  else
    v_delta := -abs(p_amount);
  end if;

  -- Lock the kid row to prevent concurrent balance issues
  select * into v_kid from public.kids where id = p_kid_id for update;
  if not found then
    raise exception 'Kid not found: %', p_kid_id;
  end if;

  if (v_kid.balance + v_delta) < 0 then
    raise exception 'Insufficient balance';
  end if;

  update public.kids
    set balance    = balance + v_delta,
        updated_at = now()
  where id = p_kid_id;

  insert into public.transactions(kid_id, amount, type, description)
  values (p_kid_id, abs(p_amount), p_type, p_description)
  returning * into v_txn;

  return v_txn;
end;
$$;

-- ============================================================
-- DB FUNCTION: transfer_to_goal
-- Deducts from kid balance and adds to savings goal atomically.
-- ============================================================
create or replace function public.transfer_to_goal(
  p_kid_id  uuid,
  p_goal_id uuid,
  p_amount  numeric
)
returns void
language plpgsql security definer
as $$
declare
  v_new_amount numeric;
  v_target     numeric;
begin
  -- Deduct from balance (will raise exception if insufficient)
  perform public.apply_transaction(
    p_kid_id, p_amount, 'goal_transfer', 'Transfer to savings goal'
  );

  -- Update goal progress
  select current_amount + p_amount, target_amount
  into v_new_amount, v_target
  from public.savings_goals
  where id = p_goal_id and kid_id = p_kid_id;

  if not found then
    raise exception 'Goal not found';
  end if;

  update public.savings_goals
    set current_amount = least(v_new_amount, v_target),
        completed      = (v_new_amount >= v_target),
        updated_at     = now()
  where id = p_goal_id;
end;
$$;
