-- Ejecutar una vez después de 001_platform.sql. Compatible con 002 aplicada o pendiente.
begin;
alter table public.profiles
 add column role_source text not null default 'legacy' check(role_source in ('public_signup','organizer','developer','legacy')),
 add column role_assigned_by uuid references public.profiles(id) on delete set null;
-- No inventar responsables de cambios anteriores. Los lotes QA sí tienen marca administrativa.
update public.profiles p set role_source='developer' from auth.users u where u.id=p.id and u.raw_app_meta_data ? 'qa_seed';
create or replace function public.handle_signup() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name,email,role,role_source)
 values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'Participante'),120),new.email,'student',case when new.raw_app_meta_data ? 'qa_seed' or new.raw_app_meta_data->>'provisioning_source'='developer' then 'developer' else 'public_signup' end);
 return new;
end $$;
create function public.stamp_user_role() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then
  -- El alta pública del trigger anterior fija estudiante; cualquier inserción administrativa conserva el rastro.
  if new.role_source<>'public_signup' then new.role_source:='developer'; new.role_assigned_by:=null; end if;
 elsif new.role is distinct from old.role then
  if auth.uid() is not null and public.viewer_role()='organizer' then
   new.role_source:='organizer'; new.role_assigned_by:=auth.uid();
  else
   new.role_source:='developer'; new.role_assigned_by:=null;
  end if;
 else
  -- No permitir editar el rastro al cambiar nombre o correo.
  new.role_source:=old.role_source; new.role_assigned_by:=old.role_assigned_by;
 end if;
 return new;
end $$;
create trigger profile_role_stamp before insert or update on public.profiles for each row execute function public.stamp_user_role();
revoke all on function public.stamp_user_role() from public,anon,authenticated;
comment on column public.profiles.role is 'Tipo único de usuario: student (registro público), advisor (alta autorizada), organizer (administración del evento). Nunca confiar en raw_user_meta_data para permisos.';
comment on column public.profiles.role_source is 'Origen de la asignación actual del rol; legacy significa que no se conoce el origen histórico.';
commit;
