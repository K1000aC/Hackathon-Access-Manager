import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
test("backlog y sprints: permisos, archivos y revisiones independientes del AFD", async (t) => {
  const db = new PGlite();
  const ids = Array.from({ length: 5 }, (_, i) => `00000000-0000-4000-8000-00000000000${i + 1}`);
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; grant usage on schema auth to authenticated;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create schema storage; grant usage on schema storage to authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant select,insert,delete on storage.objects to authenticated;`);
    for (const migration of ["001_platform.sql", "002_work_items.sql"])
      await db.exec(readFileSync(new URL(`../migrations/${migration}`, import.meta.url), "utf8"));
    for (const id of ids)
      await db.query("insert into auth.users values($1,$2,$3)", [id, `${id}@example.com`, "{}"]);
    await db.query("update public.profiles set role='organizer' where id=$1", [ids[4]]);
    await db.query("update public.profiles set role='advisor' where id=any($1)", [
      [ids[2], ids[3]],
    ]);
    const login = async (i) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [ids[i]]);
      await db.exec("set role authenticated");
    };
    const rpc = (name, args) =>
      db.query(
        `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(",")}) as result`,
        args,
      );
    await login(0);
    const team = (await rpc("register_event_team", ["Equipo", "Social", 3])).rows[0].result;
    const args = [
      null,
      team,
      "backlog",
      "Historias de usuario",
      "Definir historias",
      "",
      "",
      false,
    ];
    await t.test("propietario crea borrador y otros estudiantes no acceden", async () => {
      await login(1);
      await assert.rejects(rpc("save_work_item", args));
      await login(0);
      await rpc("save_work_item", args);
      await login(1);
      assert.equal((await db.query("select * from public.work_items")).rows.length, 0);
    });
    await login(0);
    const item = (await db.query("select * from public.work_items")).rows[0].id;
    await t.test("archivos privados solo admiten carpeta del equipo propio", async () => {
      const path = `${team}/${ids[0]}/evidencia.pdf`;
      await db.query("insert into storage.objects(bucket_id,name) values('team-work',$1)", [path]);
      await assert.rejects(
        db.query("insert into storage.objects(bucket_id,name) values('team-work',$1)", [
          `${team}/${ids[1]}/falso.pdf`,
        ]),
      );
      await login(1);
      assert.equal((await db.query("select * from storage.objects")).rows.length, 0);
      await assert.rejects(
        db.query("insert into storage.objects(bucket_id,name) values('team-work',$1)", [
          `${team}/${ids[1]}/ajeno.pdf`,
        ]),
      );
      await login(0);
      await assert.rejects(
        rpc("save_work_item", [
          item,
          team,
          "backlog",
          "Título",
          "Detalle",
          "javascript:alert(1)",
          "",
          true,
        ]),
      );
      await rpc("save_work_item", [item, team, "backlog", "Título", "Detalle", "", path, true]);
      await db.query("delete from storage.objects where name=$1", [path]);
      assert.equal((await db.query("select * from storage.objects")).rows.length, 1);
    });
    await t.test("asesor sin asignación y estudiante no pueden revisar", async () => {
      for (const i of [0, 2, 3]) {
        await login(i);
        await assert.rejects(rpc("review_work_item", [item, true, ""]));
      }
    });
    await login(4);
    await rpc("assign_advisor", [team, ids[2]]);
    await t.test("correcciones, reenvío y aprobación conservan R", async () => {
      await login(2);
      await assert.rejects(rpc("review_work_item", [item, false, ""]));
      await rpc("review_work_item", [item, false, "Agrega detalles"]);
      await login(0);
      await rpc("save_work_item", [
        item,
        team,
        "backlog",
        "Historias corregidas",
        "Detalle completo",
        "",
        "",
        true,
      ]);
      await login(2);
      await rpc("review_work_item", [item, true, "Correcto"]);
      await assert.rejects(rpc("review_work_item", [item, true, "Repetida"]));
      await login(0);
      await assert.rejects(
        rpc("save_work_item", [
          item,
          team,
          "backlog",
          "Cambiar aprobado",
          "Detalle",
          "",
          "",
          false,
        ]),
      );
      assert.equal((await db.query("select chain from public.event_teams")).rows[0].chain, "R");
    });
    await t.test("sprints se guardan separados y no permiten escrituras directas", async () => {
      await login(0);
      await rpc("save_work_item", [
        null,
        team,
        "sprint",
        "Sprint 1",
        "Objetivos",
        "https://example.com/evidencia",
        "",
        true,
      ]);
      assert.equal(
        (await db.query("select * from public.work_items where kind='sprint'")).rows.length,
        1,
      );
      await assert.rejects(db.exec("update public.work_items set status='approved'"));
      await login(3);
      assert.equal((await db.query("select * from public.work_items")).rows.length, 0);
    });
  } finally {
    await db.close();
  }
});
