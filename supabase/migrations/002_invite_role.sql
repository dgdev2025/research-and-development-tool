-- Run this if you already applied the original schema and need invite role support

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'role', '')::public.user_role,
      case
        when (select count(*) from public.profiles) = 0 then 'admin'::public.user_role
        else 'contributor'::public.user_role
      end
    )
  );
  return new;
end;
$$;
