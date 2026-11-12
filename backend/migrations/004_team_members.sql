-- Ejecutar UNA VEZ después de 001. Compatible con 002/003 aplicadas o pendientes.
-- Plataforma actual: un evento. Cada estudiante puede pertenecer a un único equipo.
begin;
alter table public.event_teams add column member_limit integer not null default 10 check(member_limit between 1 and 10);
update public.event_teams set member_limit=members;
create table public.team_members (
 team_id uuid not null references public.event_teams(id) on delete cascade,
 student_id uuid not null unique references public.profiles(id),
 joined_at timestamptz not null default now(),primary key(team_id,student_id)
);
insert into public.team_members(team_id,student_id) select id,owner_id from public.event_teams;
-- No inventar integrantes: los conteos anteriores eran cantidades sin cuentas asociadas.
update public.event_teams set members=1;
create table public.member_requests (
 id uuid primary key default gen_random_uuid(), team_id uuid not null references public.event_teams(id) on delete cascade,
 student_id uuid not null references public.profiles(id), requested_by uuid not null references public.profiles(id),
 action text not null check(action in ('add','remove')), reason text not null check(length(trim(reason)) between 1 and 2000),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),reviewed_by uuid references public.profiles(id),feedback text not null default '',reviewed_at timestamptz
);
create unique index one_pending_member_request on public.member_requests(team_id,student_id) where status='pending';
create unique index one_pending_team_invite on public.member_requests(student_id) where status='pending' and action='add';
create function public.can_access_team(p_team_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.event_teams t where t.id=p_team_id and (t.owner_id=auth.uid() or t.advisor_id=auth.uid() or public.viewer_role()='organizer' or exists(select 1 from public.team_members m where m.team_id=t.id and m.student_id=auth.uid())))
$$;
alter table public.team_members enable row level security;
alter table public.member_requests enable row level security;
create policy member_read on public.team_members for select to authenticated using(public.can_access_team(team_id));
create policy member_request_read on public.member_requests for select to authenticated using(public.can_access_team(team_id));
revoke all on public.team_members,public.member_requests from anon,authenticated;
grant select on public.team_members,public.member_requests to authenticated;
drop policy team_read on public.event_teams;
create policy team_read on public.event_teams for select to authenticated using(public.can_access_team(id));
drop policy submission_read on public.submissions;
create policy submission_read on public.submissions for select to authenticated using(public.can_access_team(team_id));
-- Mantener las evidencias compartidas visibles para los integrantes si 002 ya fue aplicada.
do $$ begin
 if to_regclass('public.work_items') is not null then
  execute 'drop policy work_read on public.work_items';
  execute 'create policy work_read on public.work_items for select to authenticated using(public.can_access_team(team_id))';
 end if;
 if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='work_file_read') then
  execute 'drop policy work_file_read on storage.objects';
  execute 'create policy work_file_read on storage.objects for select to authenticated using(bucket_id=''team-work'' and exists(select 1 from public.event_teams t where t.id::text=split_part(storage.objects.name,''/'',1) and public.can_access_team(t.id)))';
 end if;
end $$;
create function public.sync_team_member_count() returns trigger language plpgsql security definer set search_path='' as $$
declare team uuid;
begin
 team:=case when tg_op='DELETE' then old.team_id else new.team_id end;
 update public.event_teams set members=(select count(*) from public.team_members where team_id=team) where id=team;
 return null;
end $$;
create trigger sync_members after insert or delete on public.team_members for each row execute function public.sync_team_member_count();
create function public.guard_member_role() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.role<>'student' and exists(select 1 from public.team_members where student_id=new.id) then raise exception 'Primero retira a este estudiante de su equipo mediante el asesor.'; end if;
 return new;
end $$;
create trigger guard_member_role before update of role on public.profiles for each row execute function public.guard_member_role();
create function public.request_team_member(p_team_id uuid,p_email text,p_action text,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare t public.event_teams; target uuid; result uuid;
begin
 perform pg_advisory_xact_lock(740041);
 select * into t from public.event_teams where id=p_team_id for update;
 if auth.uid() is null or t.owner_id is distinct from auth.uid() or public.viewer_role() is distinct from 'student' then raise exception 'Solo el líder puede solicitar cambios de integrantes.'; end if;
 if t.advisor_id is null then raise exception 'La organización debe asignar un asesor antes de solicitar cambios.'; end if;
 if p_action is null or p_action not in ('add','remove') or p_reason is null or length(trim(p_reason)) not between 1 and 2000 then raise exception 'Indica el cambio y su motivo.'; end if;
 select p.id into target from public.profiles p join auth.users u on u.id=p.id where lower(p.email)=lower(trim(p_email)) and p.role='student' and u.email_confirmed_at is not null for update of p;
 if target is null then raise exception 'El correo debe corresponder a un estudiante con cuenta confirmada.'; end if;
 if target=t.owner_id then raise exception 'El líder no puede retirarse de su propio equipo.'; end if;
 if p_action='add' then
  if exists(select 1 from public.team_members where student_id=target) then raise exception 'Este estudiante ya pertenece a un equipo.'; end if;
  if (select count(*) from public.team_members where team_id=t.id)+(select count(*) from public.member_requests where team_id=t.id and action='add' and status='pending')>=t.member_limit then raise exception 'El equipo ya alcanzó su cupo, incluidas solicitudes pendientes.'; end if;
 elsif not exists(select 1 from public.team_members where team_id=t.id and student_id=target) then raise exception 'El estudiante no pertenece a este equipo.';
 end if;
 insert into public.member_requests(team_id,student_id,requested_by,action,reason) values(t.id,target,auth.uid(),p_action,trim(p_reason)) returning id into result;
 return result;
end $$;
create function public.review_team_member(p_request_id uuid,p_approve boolean,p_feedback text) returns void language plpgsql security definer set search_path='' as $$
declare r public.member_requests; t public.event_teams;
begin
 perform pg_advisory_xact_lock(740041);
 -- Bloquear primero el equipo, igual que las solicitudes, para serializar cupos.
 select * into r from public.member_requests where id=p_request_id;
 select * into t from public.event_teams where id=r.team_id for update;
 select * into r from public.member_requests where id=p_request_id for update;
 if not found or r.status<>'pending' then raise exception 'La solicitud no está pendiente.'; end if;
 if auth.uid() is null or public.viewer_role() is distinct from 'advisor' or t.advisor_id is distinct from auth.uid() then raise exception 'Solo el asesor asignado puede aprobar integrantes.'; end if;
 if p_approve is null or p_feedback is null or length(p_feedback)>2000 or (not p_approve and length(trim(p_feedback))=0) then raise exception 'Indica el motivo del rechazo.'; end if;
 if p_approve then
  if r.action='add' then
   perform 1 from public.profiles where id=r.student_id and role='student' for update;
   if not found then raise exception 'La cuenta ya no es estudiante.'; end if;
   if (select count(*) from public.team_members where team_id=t.id)>=t.member_limit then raise exception 'No hay cupo en el equipo.'; end if;
   insert into public.team_members(team_id,student_id) values(t.id,r.student_id);
  else
   if r.student_id=t.owner_id then raise exception 'No se puede eliminar al líder.'; end if;
   delete from public.team_members where team_id=t.id and student_id=r.student_id;
   if not found then raise exception 'El integrante ya no pertenece al equipo.'; end if;
  end if;
 end if;
 update public.member_requests set status=case when p_approve then 'approved' else 'rejected' end,feedback=trim(p_feedback),reviewed_by=auth.uid(),reviewed_at=now() where id=r.id;
end $$;
create function public.register_event_team(p_name text,p_category text,p_members integer,p_member_emails text[]) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; advisor uuid; email text;
begin
 perform pg_advisory_xact_lock(740041);
 if auth.uid() is null or public.viewer_role() is distinct from 'student' then raise exception 'Solo estudiantes pueden registrar equipos.'; end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 if exists(select 1 from public.team_members where student_id=auth.uid()) or exists(select 1 from public.member_requests where student_id=auth.uid() and action='add' and status='pending') then raise exception 'Ya perteneces a un equipo o tienes una incorporación pendiente.'; end if;
 if p_members is null or p_members not between 1 and 10 or p_member_emails is null or cardinality(p_member_emails)>p_members-1 then raise exception 'Revisa el cupo y los correos de los integrantes.'; end if;
 select p.id into advisor from public.profiles p join auth.users u on u.id=p.id where p.role='advisor' and u.email_confirmed_at is not null order by (select count(*) from public.event_teams t where t.advisor_id=p.id),p.id limit 1;
 if advisor is null then raise exception 'No hay asesores disponibles. Contacta a la organización.'; end if;
 insert into public.event_teams(owner_id,name,category,members,member_limit,advisor_id,events) values(auth.uid(),trim(p_name),trim(p_category),1,p_members,advisor,jsonb_build_array(jsonb_build_object('symbol','R','at',now(),'detail','Acceso creado por el líder','actor',auth.uid()))) returning id into result;
 insert into public.team_members(team_id,student_id) values(result,auth.uid());
 foreach email in array p_member_emails loop
  perform public.request_team_member(result,email,'add','Incorporación solicitada por el líder al registrar el equipo.');
 end loop;
 return result;
end $$;
-- Conservar clientes anteriores sin eludir membresías ni la asignación automática.
create or replace function public.register_event_team(p_name text,p_category text,p_members integer) returns uuid language sql security definer set search_path='' as $$
 select public.register_event_team(p_name,p_category,p_members,array[]::text[])
$$;
create function public.get_team_roster(p_team_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.can_access_team(p_team_id) then raise exception 'No tienes acceso a este equipo.'; end if;
 select jsonb_build_object('leader_id',t.owner_id,'advisor_name',(select display_name from public.profiles where id=t.advisor_id),'member_limit',t.member_limit,
 'members',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'email',p.email,'leader',p.id=t.owner_id) order by p.display_name) from public.team_members m join public.profiles p on p.id=m.student_id where m.team_id=t.id),'[]'::jsonb),
 'requests',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'name',p.display_name,'email',p.email,'action',r.action,'status',r.status,'reason',r.reason,'feedback',r.feedback) order by r.created_at desc) from public.member_requests r join public.profiles p on p.id=r.student_id where r.team_id=t.id),'[]'::jsonb)) into result from public.event_teams t where t.id=p_team_id;
 return result;
end $$;
-- Asignar profesor a equipos anteriores que aún no lo tenían, si hay asesores.
do $$ declare t record; a uuid; begin
 for t in select id from public.event_teams where advisor_id is null order by created_at loop
  select p.id into a from public.profiles p join auth.users u on u.id=p.id where p.role='advisor' and u.email_confirmed_at is not null order by (select count(*) from public.event_teams e where e.advisor_id=p.id),p.id limit 1;
  if a is not null then update public.event_teams set advisor_id=a where id=t.id; end if;
 end loop;
end $$;
revoke all on function public.can_access_team(uuid),public.sync_team_member_count(),public.guard_member_role(),public.request_team_member(uuid,text,text,text),public.review_team_member(uuid,boolean,text),public.register_event_team(text,text,integer,text[]),public.get_team_roster(uuid) from public,anon;
grant execute on function public.can_access_team(uuid),public.request_team_member(uuid,text,text,text),public.review_team_member(uuid,boolean,text),public.register_event_team(text,text,integer,text[]),public.get_team_roster(uuid) to authenticated;
commit;
