-- ============================================================
-- KidsBank Migration: Accounts, Avatar Storage, Edit/Delete
-- Run this AFTER the initial schema.sql
-- ============================================================

-- ============================================================
-- AVATAR STORAGE BUCKET
-- ============================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "avatar_upload" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);

create policy "avatar_read" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatar_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid() is not null);

-- ============================================================
-- ACCOUNTS TABLE (multiple per kid)
-- ============================================================
create table public.accounts (
  id          uuid primary key default gen_random_uuid(),
  kid_id      uuid not null references public.kids(id) on delete cascade,
  name        text not null default 'Default',
  balance     numeric(10, 2) not null default 0.00,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index accounts_kid_id_idx on public.accounts(kid_id);

alter table public.accounts enable row level security;

create policy "accounts_all" on public.accounts for all using (
  exists (
    select 1 from public.kids k
    join public.families f on f.id = k.family_id
    where k.id = kid_id and f.user_id = auth.uid()
  )
);

-- ============================================================
-- ADD account_id TO TRANSACTIONS
-- ============================================================
alter table public.transactions add column account_id uuid references public.accounts(id);

-- ============================================================
-- DATA MIGRATION: Create default accounts for existing kids
-- ============================================================
insert into public.accounts (kid_id, name, balance, is_default)
select id, 'Default', balance, true from public.kids;

-- Link existing transactions to the default account
update public.transactions t
set account_id = a.id
from public.accounts a
where a.kid_id = t.kid_id and a.is_default = true;

-- Now make account_id NOT NULL
alter table public.transactions alter column account_id set not null;

create index transactions_account_id_idx on public.transactions(account_id, created_at desc);

-- ============================================================
-- TRIGGER: Auto-create default account when a kid is added
-- ============================================================
create or replace function public.create_default_account()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.accounts (kid_id, name, balance, is_default)
  values (NEW.id, 'Default', 0, true);
  return NEW;
end;
$$;

create trigger kids_after_insert_create_account
  after insert on public.kids
  for each row execute function public.create_default_account();

-- ============================================================
-- UPDATED: apply_transaction (now account-aware)
-- ============================================================
create or replace function public.apply_transaction(
  p_kid_id      uuid,
  p_amount      numeric,
  p_type        public.transaction_type,
  p_description text default null,
  p_account_id  uuid default null
)
returns public.transactions
language plpgsql security definer
as $$
declare
  v_delta    numeric;
  v_account  public.accounts;
  v_txn      public.transactions;
  v_acct_id  uuid;
begin
  -- Resolve account: use provided or default
  if p_account_id is not null then
    v_acct_id := p_account_id;
  else
    select id into v_acct_id
    from public.accounts
    where kid_id = p_kid_id and is_default = true
    limit 1;
  end if;

  if v_acct_id is null then
    raise exception 'No account found for kid: %', p_kid_id;
  end if;

  -- Deposits and allowances add; withdrawals and goal transfers subtract
  if p_type in ('deposit', 'allowance') then
    v_delta := abs(p_amount);
  else
    v_delta := -abs(p_amount);
  end if;

  -- Lock the account row
  select * into v_account from public.accounts where id = v_acct_id for update;
  if not found then
    raise exception 'Account not found: %', v_acct_id;
  end if;

  if (v_account.balance + v_delta) < 0 then
    raise exception 'Insufficient balance';
  end if;

  -- Update account balance
  update public.accounts
    set balance = balance + v_delta, updated_at = now()
  where id = v_acct_id;

  -- Update kid's total balance
  update public.kids
    set balance = (
      select coalesce(sum(balance), 0) from public.accounts where kid_id = p_kid_id
    ) + v_delta,
    updated_at = now()
  where id = p_kid_id;

  -- Insert transaction
  insert into public.transactions(kid_id, account_id, amount, type, description)
  values (p_kid_id, v_acct_id, abs(p_amount), p_type, p_description)
  returning * into v_txn;

  return v_txn;
end;
$$;

-- ============================================================
-- UPDATED: transfer_to_goal (account-aware)
-- ============================================================
create or replace function public.transfer_to_goal(
  p_kid_id     uuid,
  p_goal_id    uuid,
  p_amount     numeric,
  p_account_id uuid default null
)
returns void
language plpgsql security definer
as $$
declare
  v_new_amount numeric;
  v_target     numeric;
begin
  perform public.apply_transaction(
    p_kid_id, p_amount, 'goal_transfer', 'Transfer to savings goal', p_account_id
  );

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

-- ============================================================
-- NEW: reverse_transaction (atomic delete + balance reversal)
-- ============================================================
create or replace function public.reverse_transaction(p_txn_id uuid)
returns void
language plpgsql security definer
as $$
declare
  v_txn    public.transactions;
  v_delta  numeric;
begin
  select * into v_txn from public.transactions where id = p_txn_id for update;
  if not found then
    raise exception 'Transaction not found';
  end if;

  -- Reverse: deposits/allowances were +, so reverse is -
  if v_txn.type in ('deposit', 'allowance') then
    v_delta := -v_txn.amount;
  else
    v_delta := v_txn.amount;
  end if;

  -- Update account balance
  update public.accounts
    set balance = balance + v_delta, updated_at = now()
  where id = v_txn.account_id;

  -- Update kid total balance
  update public.kids
    set balance = balance + v_delta, updated_at = now()
  where id = v_txn.kid_id;

  -- Delete the transaction
  delete from public.transactions where id = p_txn_id;
end;
$$;

-- ============================================================
-- NEW: edit_transaction (atomic edit + balance adjustment)
-- ============================================================
create or replace function public.edit_transaction(
  p_txn_id      uuid,
  p_amount      numeric,
  p_type        public.transaction_type,
  p_description text default null
)
returns public.transactions
language plpgsql security definer
as $$
declare
  v_old        public.transactions;
  v_old_delta  numeric;
  v_new_delta  numeric;
  v_diff       numeric;
  v_txn        public.transactions;
begin
  select * into v_old from public.transactions where id = p_txn_id for update;
  if not found then
    raise exception 'Transaction not found';
  end if;

  -- Calculate old effective delta
  if v_old.type in ('deposit', 'allowance') then
    v_old_delta := v_old.amount;
  else
    v_old_delta := -v_old.amount;
  end if;

  -- Calculate new effective delta
  if p_type in ('deposit', 'allowance') then
    v_new_delta := abs(p_amount);
  else
    v_new_delta := -abs(p_amount);
  end if;

  v_diff := v_new_delta - v_old_delta;

  -- Check the account won't go negative
  if (select balance + v_diff from public.accounts where id = v_old.account_id) < 0 then
    raise exception 'Edit would result in negative balance';
  end if;

  -- Update account balance
  update public.accounts
    set balance = balance + v_diff, updated_at = now()
  where id = v_old.account_id;

  -- Update kid total balance
  update public.kids
    set balance = balance + v_diff, updated_at = now()
  where id = v_old.kid_id;

  -- Update the transaction
  update public.transactions
    set amount = abs(p_amount),
        type = p_type,
        description = p_description
  where id = p_txn_id
  returning * into v_txn;

  return v_txn;
end;
$$;

-- ============================================================
-- RLS: Allow update and delete on transactions
-- ============================================================
create policy "transactions_update" on public.transactions for update using (
  exists (
    select 1 from public.kids k join public.families f on f.id = k.family_id
    where k.id = kid_id and f.user_id = auth.uid()
  )
);

create policy "transactions_delete" on public.transactions for delete using (
  exists (
    select 1 from public.kids k join public.families f on f.id = k.family_id
    where k.id = kid_id and f.user_id = auth.uid()
  )
);
