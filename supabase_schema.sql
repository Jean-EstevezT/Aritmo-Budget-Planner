create extension if not exists "uuid-ossp";

create table if not exists categories (
  id text not null,
  user_id text not null,
  name text,
  type text,
  color text,
  budget_limit numeric,
  updated_at timestamptz default now(),
  primary key (id, user_id)
);

create table if not exists transactions (
  id text not null,
  user_id text not null,
  description text,
  amount numeric,
  date text,
  category_id text,
  type text,
  status text,
  original_amount numeric,
  original_currency text,
  tag text,
  updated_at timestamptz default now(),
  primary key (id, user_id)
);

create table if not exists debts (
  id text not null,
  user_id text not null,
  name text not null,
  total_amount numeric,
  remaining_amount numeric,
  interest_rate numeric,
  minimum_payment numeric,
  due_date text,
  updated_at timestamptz default now(),
  primary key (id, user_id)
);

create table if not exists recurring_rules (
  id text not null,
  user_id text not null,
  description text,
  amount numeric,
  category_id text,
  type text,
  frequency text,
  next_due_date text,
  active boolean,
  updated_at timestamptz default now(),
  primary key (id, user_id)
);

create table if not exists savings_goals (
  id text not null,
  user_id text not null,
  name text,
  target_amount numeric,
  current_amount numeric,
  deadline text,
  color text,
  icon text,
  monthly_contribution numeric,
  updated_at timestamptz default now(),
  primary key (id, user_id)
);

create table if not exists bills (
  id text not null,
  user_id text not null,
  name text,
  amount numeric,
  due_date text,
  is_paid boolean,
  category text,
  updated_at timestamptz default now(),
  primary key (id, user_id)
);

create table if not exists settings (
  key text not null,
  user_id text not null,
  value text,
  updated_at timestamptz default now(),
  primary key (key, user_id)
);
