-- 部員の連絡先・緊急連絡先（マイページで本人が登録 → 管理者の「部員リスト」に表示）
-- 本人と管理者だけが読める。ほかの部員からは見えない。
-- Supabase ダッシュボード → SQL Editor に貼り付けて「Run」で実行してください（1回だけ）。

-- 管理者かどうか（profiles の RLS に左右されないよう security definer）
create or replace function public.sjfc_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

create table if not exists public.member_contacts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  phone text check (char_length(phone) <= 40),
  emergency_name text check (char_length(emergency_name) <= 60),
  emergency_relation text check (char_length(emergency_relation) <= 30),
  emergency_phone text check (char_length(emergency_phone) <= 80),
  updated_at timestamptz not null default now()
);

alter table public.member_contacts enable row level security;

drop policy if exists "member_contacts_select_own_or_admin" on public.member_contacts;
create policy "member_contacts_select_own_or_admin" on public.member_contacts
  for select to authenticated
  using (profile_id = auth.uid() or public.sjfc_is_admin());

drop policy if exists "member_contacts_insert_own_or_admin" on public.member_contacts;
create policy "member_contacts_insert_own_or_admin" on public.member_contacts
  for insert to authenticated
  with check (profile_id = auth.uid() or public.sjfc_is_admin());

drop policy if exists "member_contacts_update_own_or_admin" on public.member_contacts;
create policy "member_contacts_update_own_or_admin" on public.member_contacts
  for update to authenticated
  using (profile_id = auth.uid() or public.sjfc_is_admin())
  with check (profile_id = auth.uid() or public.sjfc_is_admin());

-- 削除は管理者のみ（部員の退会時など）
drop policy if exists "member_contacts_delete_admin" on public.member_contacts;
create policy "member_contacts_delete_admin" on public.member_contacts
  for delete to authenticated
  using (public.sjfc_is_admin());

-- 未ログインの利用者には一切見せない
revoke all on public.member_contacts from anon;
