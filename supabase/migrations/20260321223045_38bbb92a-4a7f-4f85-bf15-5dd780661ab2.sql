create or replace function public.is_group_creator(_user_id uuid, _group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_groups
    where id = _group_id
      and created_by = _user_id
  )
$$;

drop policy if exists "Creator can add members" on public.chat_group_members;

create policy "Creator can add members"
on public.chat_group_members
for insert
to authenticated
with check (
  public.is_group_admin(auth.uid(), group_id)
  or user_id = auth.uid()
  or public.is_group_creator(auth.uid(), group_id)
);