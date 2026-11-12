-- Ejecutar una vez después de 001, 002 y 004 (003 puede estar aplicada).
begin;
alter table public.work_items drop constraint work_items_kind_check;
alter table public.work_items add constraint work_items_kind_check check(kind in ('backlog','sprint','task'));
update storage.buckets set allowed_mime_types=array_append(allowed_mime_types,'application/vnd.openxmlformats-officedocument.presentationml.presentation') where id='team-work';
create or replace function public.save_work_item(p_id uuid,p_team_id uuid,p_kind text,p_title text,p_detail text,p_url text,p_path text,p_submit boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare t public.event_teams; result uuid; w public.work_items;
begin
 select * into t from public.event_teams where id=p_team_id;
 if auth.uid() is null or public.viewer_role() is distinct from 'student' or t.owner_id is distinct from auth.uid() then raise exception 'Solo el equipo propietario puede organizar y entregar su trabajo.'; end if;
 if p_kind is null or p_kind not in ('backlog','sprint','task') then raise exception 'Tipo de trabajo inválido.'; end if;
 if p_submit is null then raise exception 'Indica si deseas enviar a revisión.'; end if;
 if p_path is null or (p_path<>'' and (p_path not like p_team_id::text||'/'||auth.uid()::text||'/%' or not exists(select 1 from storage.objects where bucket_id='team-work' and name=p_path))) then raise exception 'Archivo inválido.'; end if;
 if p_id is not null then
  select * into w from public.work_items where id=p_id for update;
  if not found or w.team_id<>p_team_id or w.kind<>p_kind or w.status not in ('draft','changes_requested') then raise exception 'Esta entrega no se puede editar.'; end if;
  update public.work_items set title=trim(p_title),detail=trim(p_detail),evidence_url=trim(p_url),attachment_path=p_path,status=case when p_submit then 'pending' else 'draft' end,feedback='',reviewed_by=null,updated_at=now() where id=p_id returning id into result;
 else
  insert into public.work_items(team_id,kind,title,detail,evidence_url,attachment_path,status) values(p_team_id,p_kind,trim(p_title),trim(p_detail),trim(p_url),p_path,case when p_submit then 'pending' else 'draft' end) returning id into result;
 end if;
 return result;
end $$;

create table public.project_management (
 team_id uuid primary key references public.event_teams(id) on delete cascade,
 board_url text not null check(length(board_url)<=2000 and board_url ~ '^https://[^[:space:]]+$'),
 repository_url text not null check(length(repository_url)<=2000 and repository_url ~ '^https://[^[:space:]]+$'),
 summary text not null check(length(trim(summary)) between 1 and 4000),
 status text not null default 'pending' check(status in ('pending','approved','changes_requested')),
 feedback text not null default '' check(length(feedback)<=2000),
 public_verified_by uuid references public.profiles(id),updated_at timestamptz not null default now()
);
alter table public.project_management enable row level security;
create policy management_read on public.project_management for select to authenticated using(public.can_access_team(team_id));
revoke all on public.project_management from anon,authenticated;
grant select on public.project_management to authenticated;
create function public.save_project_management(p_team_id uuid,p_board_url text,p_repository_url text,p_summary text,p_public_declared boolean) returns void language plpgsql security definer set search_path='' as $$
declare t public.event_teams;
begin
 select * into t from public.event_teams where id=p_team_id for update;
 if auth.uid() is null or public.viewer_role() is distinct from 'student' or t.owner_id is distinct from auth.uid() then raise exception 'Solo el líder puede actualizar los enlaces del proyecto.'; end if;
 if p_public_declared is distinct from true then raise exception 'Debes compartir enlaces públicos que abran sin iniciar sesión.'; end if;
 insert into public.project_management(team_id,board_url,repository_url,summary) values(t.id,trim(p_board_url),trim(p_repository_url),trim(p_summary))
 on conflict(team_id) do update set board_url=excluded.board_url,repository_url=excluded.repository_url,summary=excluded.summary,status='pending',feedback='',public_verified_by=null,updated_at=now();
end $$;
create function public.review_project_management(p_team_id uuid,p_approve boolean,p_feedback text,p_public_verified boolean) returns void language plpgsql security definer set search_path='' as $$
declare t public.event_teams; m public.project_management;
begin
 select * into t from public.event_teams where id=p_team_id for update;
 if auth.uid() is null or public.viewer_role() is distinct from 'advisor' or t.advisor_id is distinct from auth.uid() then raise exception 'Solo el asesor asignado puede validar los enlaces públicos.'; end if;
 select * into m from public.project_management where team_id=t.id for update;
 if not found or m.status<>'pending' then raise exception 'No hay enlaces pendientes de revisión.'; end if;
 if p_approve is null or p_feedback is null or length(p_feedback)>2000 or (not p_approve and length(trim(p_feedback))=0) then raise exception 'Indica las correcciones necesarias.'; end if;
 if p_approve and p_public_verified is distinct from true then raise exception 'Comprueba que ambos enlaces abran sin iniciar sesión.'; end if;
 update public.project_management set status=case when p_approve then 'approved' else 'changes_requested' end,feedback=trim(p_feedback),public_verified_by=case when p_approve then auth.uid() else null end,updated_at=now() where team_id=t.id;
end $$;
alter table public.submissions add column attachment_path text not null default '';
alter table public.event_teams add column final_grade numeric(5,2) check(final_grade between 0 and 100),add column final_reviewed_by uuid references public.profiles(id),add column final_reviewed_at timestamptz,add column final_feedback text not null default '' check(length(final_feedback)<=2000);
create function public.submit_stage(p_team_id uuid,p_stage text,p_detail text,p_attachment_path text) returns uuid language plpgsql security definer set search_path='' as $$
declare t public.event_teams; result uuid;
begin
 select * into t from public.event_teams where id=p_team_id for update;
 if auth.uid() is null or public.viewer_role() is distinct from 'student' or t.owner_id is distinct from auth.uid() then raise exception 'Solo el líder puede enviar una etapa.'; end if;
 if p_stage is null or (t.chain='R' and p_stage<>'M') or (t.chain='RM' and p_stage<>'P') or t.chain='RMP' then raise exception 'Completa las etapas en orden.'; end if;
 if p_attachment_path is null or (p_attachment_path<>'' and (p_attachment_path not like t.id::text||'/'||auth.uid()::text||'/%' or not exists(select 1 from storage.objects where bucket_id='team-work' and name=p_attachment_path))) then raise exception 'Archivo inválido.'; end if;
 if p_detail is null or length(trim(p_detail)) not between 1 and 2000 then raise exception 'Describe la entrega o comparte su enlace.'; end if;
 if p_stage='P' and p_attachment_path='' and trim(p_detail) !~* '^https?://[^[:space:]/]+([/?#][^[:space:]]*)?$' then raise exception 'Adjunta el proyecto final o comparte un enlace HTTP/HTTPS válido.'; end if;
 insert into public.submissions(team_id,stage,detail,attachment_path) values(t.id,p_stage,trim(p_detail),p_attachment_path) returning id into result;
 return result;
end $$;
create or replace function public.submit_stage(p_team_id uuid,p_stage text,p_detail text) returns uuid language sql security definer set search_path='' as $$select public.submit_stage(p_team_id,p_stage,p_detail,'')$$;
alter function public.review_stage(uuid,boolean,text) rename to review_stage_core;
revoke all on function public.review_stage_core(uuid,boolean,text) from public,anon,authenticated;
create function public.review_stage(p_submission_id uuid,p_approve boolean,p_feedback text,p_grade numeric) returns void language plpgsql security definer set search_path='' as $$
declare s public.submissions; t public.event_teams;
begin
 select t1.* into t from public.event_teams t1 join public.submissions s1 on s1.team_id=t1.id where s1.id=p_submission_id for update of t1;
 select * into s from public.submissions where id=p_submission_id;
 if s.stage='P' and p_approve then
  if auth.uid() is null or public.viewer_role() is distinct from 'advisor' or t.advisor_id is distinct from auth.uid() then raise exception 'La entrega final debe revisarla el asesor asignado.'; end if;
  if p_grade is null or p_grade not between 0 and 100 then raise exception 'Califica la entrega final de 0 a 100.'; end if;
 end if;
 perform public.review_stage_core(p_submission_id,p_approve,p_feedback);
 if s.stage='P' and p_approve then update public.event_teams set final_grade=p_grade,final_reviewed_by=auth.uid(),final_reviewed_at=now(),final_feedback=trim(p_feedback) where id=t.id; end if;
end $$;
create function public.review_stage(p_submission_id uuid,p_approve boolean,p_feedback text default '') returns void language sql security definer set search_path='' as $$select public.review_stage(p_submission_id,p_approve,p_feedback,null::numeric)$$;
create function public.grade_final_delivery(p_team_id uuid,p_grade numeric,p_feedback text) returns void language plpgsql security definer set search_path='' as $$
declare t public.event_teams;
begin
 select * into t from public.event_teams where id=p_team_id for update;
 if auth.uid() is null or public.viewer_role() is distinct from 'advisor' or t.advisor_id is distinct from auth.uid() then raise exception 'Solo el asesor asignado puede calificar.'; end if;
 if t.chain<>'RMP' or t.final_grade is not null or not exists(select 1 from public.submissions where team_id=t.id and stage='P' and status='approved') then raise exception 'Se necesita una entrega final aprobada pendiente de calificación.'; end if;
 if p_grade is null or p_grade not between 0 and 100 or p_feedback is null or length(p_feedback)>2000 then raise exception 'Indica una calificación de 0 a 100 y observaciones válidas.'; end if;
 update public.event_teams set final_grade=p_grade,final_reviewed_by=auth.uid(),final_reviewed_at=now(),final_feedback=trim(p_feedback) where id=t.id;
end $$;
drop policy work_file_cleanup on storage.objects;
create policy work_file_cleanup on storage.objects for delete to authenticated using(bucket_id='team-work' and split_part(storage.objects.name,'/',2)=auth.uid()::text and exists(select 1 from public.event_teams t where t.id::text=split_part(storage.objects.name,'/',1) and t.owner_id=auth.uid()) and not exists(select 1 from public.work_items w where w.attachment_path=storage.objects.name) and not exists(select 1 from public.submissions s where s.attachment_path=storage.objects.name));
revoke all on function public.save_project_management(uuid,text,text,text,boolean),public.review_project_management(uuid,boolean,text,boolean),public.submit_stage(uuid,text,text,text),public.review_stage(uuid,boolean,text,numeric),public.review_stage(uuid,boolean,text),public.grade_final_delivery(uuid,numeric,text) from public,anon;
grant execute on function public.save_project_management(uuid,text,text,text,boolean),public.review_project_management(uuid,boolean,text,boolean),public.submit_stage(uuid,text,text,text),public.review_stage(uuid,boolean,text,numeric),public.review_stage(uuid,boolean,text),public.grade_final_delivery(uuid,numeric,text) to authenticated;
commit;
