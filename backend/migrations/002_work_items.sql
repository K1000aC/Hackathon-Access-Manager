-- Ejecutar después de 001_platform.sql en SQL Editor de Supabase.
begin;
create table public.work_items (
 id uuid primary key default gen_random_uuid(),
 team_id uuid not null references public.event_teams(id) on delete cascade,
 kind text not null check(kind in ('backlog','sprint')),
 title text not null check(length(trim(title)) between 1 and 120),
 detail text not null check(length(trim(detail)) between 1 and 4000),
 evidence_url text not null default '' check(evidence_url='' or evidence_url ~ '^https?://[^[:space:]]+$'),
 attachment_path text not null default '',
 status text not null default 'draft' check(status in ('draft','pending','approved','changes_requested')),
 feedback text not null default '' check(length(feedback)<=2000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 reviewed_by uuid references public.profiles(id)
);
create index work_items_team on public.work_items(team_id,kind);
alter table public.work_items enable row level security;
create policy work_read on public.work_items for select to authenticated using (
 exists(select 1 from public.event_teams t where t.id=team_id and (t.owner_id=auth.uid() or t.advisor_id=auth.uid() or public.viewer_role()='organizer'))
);
revoke all on public.work_items from anon,authenticated;
grant select on public.work_items to authenticated;
create function public.save_work_item(p_id uuid,p_team_id uuid,p_kind text,p_title text,p_detail text,p_url text,p_path text,p_submit boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare t public.event_teams; result uuid; w public.work_items;
begin
 select * into t from public.event_teams where id=p_team_id;
 if auth.uid() is null or public.viewer_role() is distinct from 'student' or t.owner_id is distinct from auth.uid() then raise exception 'Solo el equipo propietario puede organizar y entregar su trabajo.'; end if;
 if p_kind is null or p_kind not in ('backlog','sprint') then raise exception 'Tipo de trabajo inválido.'; end if;
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
create function public.review_work_item(p_id uuid,p_approve boolean,p_feedback text) returns void language plpgsql security definer set search_path='' as $$
declare w public.work_items; t public.event_teams;
begin
 select * into w from public.work_items where id=p_id for update;
 if not found or w.status<>'pending' then raise exception 'La entrega no está pendiente.'; end if;
 select * into t from public.event_teams where id=w.team_id;
 if auth.uid() is null or not (coalesce(public.viewer_role()='organizer',false) or coalesce(public.viewer_role()='advisor' and t.advisor_id=auth.uid(),false)) then raise exception 'Solo el asesor asignado o la organización pueden revisar.'; end if;
 if p_approve is null or p_feedback is null or length(p_feedback)>2000 or (not p_approve and length(trim(p_feedback))=0) then raise exception 'Indica las correcciones necesarias.'; end if;
 update public.work_items set status=case when p_approve then 'approved' else 'changes_requested' end,feedback=trim(p_feedback),reviewed_by=auth.uid(),updated_at=now() where id=p_id;
end $$;
revoke all on function public.save_work_item(uuid,uuid,text,text,text,text,text,boolean),public.review_work_item(uuid,boolean,text) from public,anon;
grant execute on function public.save_work_item(uuid,uuid,text,text,text,text,text,boolean),public.review_work_item(uuid,boolean,text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('team-work','team-work',false,10485760,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain','image/png','image/jpeg','application/zip']);
create policy work_file_read on storage.objects for select to authenticated using(bucket_id='team-work' and exists(select 1 from public.event_teams t where t.id::text=split_part(storage.objects.name,'/',1) and (t.owner_id=auth.uid() or t.advisor_id=auth.uid() or public.viewer_role()='organizer')));
create policy work_file_upload on storage.objects for insert to authenticated with check(bucket_id='team-work' and split_part(storage.objects.name,'/',2)=auth.uid()::text and public.viewer_role()='student' and exists(select 1 from public.event_teams t where t.id::text=split_part(storage.objects.name,'/',1) and t.owner_id=auth.uid()));
-- Solo retirar archivos huérfanos: una evidencia ya vinculada se conserva.
create policy work_file_cleanup on storage.objects for delete to authenticated using(bucket_id='team-work' and split_part(storage.objects.name,'/',2)=auth.uid()::text and exists(select 1 from public.event_teams t where t.id::text=split_part(storage.objects.name,'/',1) and t.owner_id=auth.uid()) and not exists(select 1 from public.work_items w where w.attachment_path=storage.objects.name));
commit;
