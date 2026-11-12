-- Se ejecuto SOLO una vez en el proyecto Supabase nuevo desde SQL Editor.
begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 120),
  email text not null,
  role text not null default 'student' check (role in ('student','advisor','organizer'))
);
create function public.handle_signup() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,display_name,email) values(new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'Participante'),120),new.email);
  return new;
end $$;
create trigger on_signup after insert on auth.users for each row execute function public.handle_signup();
create function public.viewer_role() returns text language sql stable security definer set search_path = '' as $$
 select role from public.profiles where id = auth.uid()
$$;
create table public.event_teams (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null unique references public.profiles(id),
 advisor_id uuid references public.profiles(id),
 name text not null check(length(trim(name)) between 1 and 100),
 category text not null check(length(trim(category)) between 1 and 100),
 members integer not null check(members between 1 and 10),
 chain text not null default 'R' check(chain in ('R','RM','RMP')),
 events jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now()
);
create unique index unique_team_name on public.event_teams(lower(trim(name)));
create table public.submissions (
 id uuid primary key default gen_random_uuid(),
 team_id uuid not null references public.event_teams(id) on delete cascade,
 stage text not null check(stage in ('M','P')),
 detail text not null check(length(trim(detail)) between 1 and 2000),
 status text not null default 'pending' check(status in ('pending','approved','changes_requested')),
 submitted_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references public.profiles(id),
 feedback text not null default ''
);
create unique index one_pending_stage on public.submissions(team_id,stage) where status='pending';
create index team_advisor on public.event_teams(advisor_id);
create index submission_team on public.submissions(team_id);
alter table public.profiles enable row level security;
alter table public.event_teams enable row level security;
alter table public.submissions enable row level security;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or public.viewer_role()='organizer');
create policy team_read on public.event_teams for select to authenticated using(owner_id=auth.uid() or advisor_id=auth.uid() or public.viewer_role()='organizer');
create policy submission_read on public.submissions for select to authenticated using(exists(select 1 from public.event_teams t where t.id=team_id and (t.owner_id=auth.uid() or t.advisor_id=auth.uid() or public.viewer_role()='organizer')));
-- Todas las escrituras pasan por funciones que comprueban identidad, rol y etapa.
revoke all on public.profiles,public.event_teams,public.submissions from anon,authenticated;
grant select on public.profiles,public.event_teams,public.submissions to authenticated;
create function public.register_event_team(p_name text,p_category text,p_members integer) returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
 if auth.uid() is null or public.viewer_role() is distinct from 'student' then raise exception 'Solo estudiantes pueden registrar equipos.'; end if;
 insert into public.event_teams(owner_id,name,category,members,events) values(auth.uid(),trim(p_name),trim(p_category),p_members,jsonb_build_array(jsonb_build_object('symbol','R','at',now(),'detail','Registro confirmado','actor',auth.uid()))) returning id into result;
 return result;
end $$;
create function public.submit_stage(p_team_id uuid,p_stage text,p_detail text) returns uuid language plpgsql security definer set search_path = '' as $$
declare t public.event_teams; result uuid;
begin
 select * into t from public.event_teams where id=p_team_id for update;
 if auth.uid() is null or public.viewer_role() is distinct from 'student' or t.owner_id is distinct from auth.uid() then raise exception 'No tienes permiso para entregar por este equipo.'; end if;
 if p_stage is null or (t.chain='R' and p_stage<>'M') or (t.chain='RM' and p_stage<>'P') or t.chain='RMP' then raise exception 'Completa las etapas en orden.'; end if;
 if p_stage='P' and trim(p_detail) !~* '^https?://[^[:space:]/]+([/?#][^[:space:]]*)?$' then raise exception 'Introduce un enlace HTTP/HTTPS válido.'; end if;
 insert into public.submissions(team_id,stage,detail) values(p_team_id,p_stage,trim(p_detail)) returning id into result;
 return result;
end $$;
create function public.review_stage(p_submission_id uuid,p_approve boolean,p_feedback text default '') returns void language plpgsql security definer set search_path = '' as $$
declare t public.event_teams; s public.submissions;
begin
 select t1.* into t from public.event_teams t1 join public.submissions s1 on s1.team_id=t1.id where s1.id=p_submission_id for update of t1;
 if auth.uid() is null or coalesce(public.viewer_role(),'') not in ('advisor','organizer') or (public.viewer_role()='advisor' and t.advisor_id is distinct from auth.uid()) or t.id is null then raise exception 'No puedes revisar este equipo.'; end if;
 select * into s from public.submissions where id=p_submission_id for update;
 if s.status<>'pending' then raise exception 'Esta entrega ya fue revisada.'; end if;
 if p_approve is null then raise exception 'Selecciona una decisión.'; end if;
 if p_feedback is null or length(p_feedback)>2000 then raise exception 'Observación inválida.'; end if;
 if not p_approve and length(trim(p_feedback))=0 then raise exception 'Indica las correcciones necesarias.'; end if;
 if (t.chain='R' and s.stage<>'M') or (t.chain='RM' and s.stage<>'P') or t.chain='RMP' then raise exception 'La etapa no corresponde al progreso actual.'; end if;
 update public.submissions set status=case when p_approve then 'approved' else 'changes_requested' end,feedback=trim(p_feedback),reviewed_by=auth.uid(),reviewed_at=now() where id=s.id;
 if p_approve then
  update public.event_teams set chain=chain||s.stage,events=events||jsonb_build_array(jsonb_build_object('symbol',s.stage,'at',now(),'detail',s.detail,'actor',auth.uid(),'submission_id',s.id)) where id=t.id;
 end if;
end $$;
create function public.assign_advisor(p_team_id uuid,p_advisor_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or public.viewer_role() is distinct from 'organizer' then raise exception 'Solo el organizador asigna asesores.'; end if;
 if not exists(select 1 from public.profiles where id=p_advisor_id and role='advisor') then raise exception 'Selecciona un asesor válido.'; end if;
 update public.event_teams set advisor_id=p_advisor_id where id=p_team_id;
 if not found then raise exception 'Equipo inexistente.'; end if;
end $$;
create function public.set_user_role(p_user_id uuid,p_role text) returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or public.viewer_role() is distinct from 'organizer' then raise exception 'Solo el organizador administra roles.'; end if;
 if p_user_id=auth.uid() then raise exception 'No puedes cambiar tu propio rol.'; end if;
 if p_role is null or p_role not in ('student','advisor','organizer') then raise exception 'Rol inválido.'; end if;
 if exists(select 1 from public.event_teams where advisor_id=p_user_id) and p_role<>'advisor' then raise exception 'Reasigna los equipos de este asesor antes de cambiar su rol.'; end if;
 if exists(select 1 from public.event_teams where owner_id=p_user_id) and p_role<>'student' then raise exception 'Esta cuenta representa un equipo estudiante; usa otra cuenta para asesoría.'; end if;
 update public.profiles set role=p_role where id=p_user_id;
 if not found then raise exception 'Usuario inexistente.'; end if;
end $$;
revoke execute on function public.handle_signup(),public.viewer_role(),public.register_event_team(text,text,integer),public.submit_stage(uuid,text,text),public.review_stage(uuid,boolean,text),public.assign_advisor(uuid,uuid),public.set_user_role(uuid,text) from public,anon;
grant execute on function public.viewer_role(),public.register_event_team(text,text,integer),public.submit_stage(uuid,text,text),public.review_stage(uuid,boolean,text),public.assign_advisor(uuid,uuid),public.set_user_role(uuid,text) to authenticated;
commit;
