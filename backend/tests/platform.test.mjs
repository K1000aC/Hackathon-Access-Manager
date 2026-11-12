import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("permisos y flujo compartido en PostgreSQL", async (t) => {
  const db = new PGlite();
  const ids = {
    student: "00000000-0000-4000-8000-000000000001",
    other: "00000000-0000-4000-8000-000000000002",
    advisor: "00000000-0000-4000-8000-000000000003",
    stranger: "00000000-0000-4000-8000-000000000004",
    organizer: "00000000-0000-4000-8000-000000000005",
  };
  try {
    await db.exec(`create role anon; create role authenticated;
   create schema auth; grant usage on schema auth to authenticated;
   create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant execute on function auth.uid() to authenticated;`);
    await db.exec(readFileSync(new URL("../migrations/001_platform.sql", import.meta.url), "utf8"));
    for (const [name, id] of Object.entries(ids))
      await db.query("insert into auth.users values($1,$2,$3)", [
        id,
        `${name}@example.com`,
        JSON.stringify({ display_name: name, role: "organizer" }),
      ]);
    await db.query("update public.profiles set role='organizer' where id=$1", [ids.organizer]);
    const login = async (name) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [ids[name]]);
      await db.exec("set role authenticated");
    };
    const rpc = async (name, params) =>
      db.query(
        `select public.${name}(${params.map((_, i) => `$${i + 1}`).join(",")}) as result`,
        params,
      );
    await t.test(
      "metadatos no permiten autoasignarse roles y se bloquean escrituras directas",
      async () => {
        await login("student");
        assert.equal((await db.query("select role from public.profiles")).rows[0].role, "student");
        await assert.rejects(rpc("set_user_role", [ids.student, "organizer"]));
        await assert.rejects(db.exec("update public.profiles set role='organizer'"));
        await assert.rejects(
          db.exec(
            "insert into public.event_teams(owner_id,name,category,members) values(auth.uid(),'Fake','Demo',3)",
          ),
        );
      },
    );
    await login("organizer");
    await rpc("set_user_role", [ids.advisor, "advisor"]);
    await rpc("set_user_role", [ids.stranger, "advisor"]);
    await login("student");
    await t.test("registro rechaza datos inválidos sin crear equipos", async () => {
      await assert.rejects(rpc("register_event_team", ["   ", "Social", 3]));
      await assert.rejects(rpc("register_event_team", ["Binary", "Social", 0]));
      await assert.rejects(rpc("register_event_team", ["Binary", "Social", 11]));
      assert.equal((await db.query("select * from public.event_teams")).rows.length, 0);
    });
    const team = (await rpc("register_event_team", ["Binary", "Demo", 3])).rows[0].result;
    await t.test("registro crea un único acceso R y bloquea duplicados", async () => {
      const row = (await db.query("select * from public.event_teams")).rows[0];
      assert.equal(row.owner_id, ids.student);
      assert.equal(row.chain, "R");
      assert.equal(row.events.length, 1);
      assert.equal(row.events[0].symbol, "R");
      await assert.rejects(rpc("register_event_team", ["Segundo", "Social", 3]));
      assert.equal((await db.query("select * from public.event_teams")).rows.length, 1);
    });

    await t.test("un alumno no ve ni modifica equipos ajenos", async () => {
      await login("other");
      assert.equal((await db.query("select * from public.event_teams")).rows.length, 0);
      await assert.rejects(rpc("submit_stage", [team, "M", "Sesión ajena"]));
      await assert.rejects(rpc("assign_advisor", [team, ids.advisor]));
    });
    await login("organizer");
    await rpc("assign_advisor", [team, ids.advisor]);
    await login("student");
    await assert.rejects(rpc("submit_stage", [team, "P", "https://example.com"]));
    let submission = (await rpc("submit_stage", [team, "M", "Mentoría del equipo"])).rows[0].result;
    await assert.rejects(rpc("submit_stage", [team, "M", "Duplicada"]));
    await t.test("el alumno y un asesor no asignado no pueden aprobar", async () => {
      await assert.rejects(rpc("review_stage", [submission, true, ""]));
      await login("stranger");
      assert.equal((await db.query("select * from public.submissions")).rows.length, 0);
      await assert.rejects(rpc("review_stage", [submission, true, ""]));
    });
    await t.test(
      "correcciones conservan estado y reenvío aprobado avanza exactamente una vez",
      async () => {
        await login("advisor");
        await assert.rejects(rpc("review_stage", [submission, false, ""]));
        await rpc("review_stage", [submission, false, "Falta detallar la sesión"]);
        assert.equal((await db.query("select chain from public.event_teams")).rows[0].chain, "R");
        await login("student");
        submission = (await rpc("submit_stage", [team, "M", "Sesión completada con asesor"]))
          .rows[0].result;
        await login("advisor");
        await rpc("review_stage", [submission, true, "Correcto"]);
        await assert.rejects(rpc("review_stage", [submission, true, "Repetida"]));
        assert.equal((await db.query("select chain from public.event_teams")).rows[0].chain, "RM");
      },
    );
    await t.test("prototipo requiere URL y aprobación antes de certificar", async () => {
      await login("student");
      await assert.rejects(rpc("submit_stage", [team, "P", "javascript:alert(1)"]));
      submission = (await rpc("submit_stage", [team, "P", "https://example.com/proyecto"])).rows[0]
        .result;
      assert.equal((await db.query("select chain from public.event_teams")).rows[0].chain, "RM");
      await login("advisor");
      await rpc("review_stage", [submission, true, "Aceptado"]);
      const result = (await db.query("select chain,events from public.event_teams")).rows[0];
      assert.equal(result.chain, "RMP");
      assert.deepEqual(
        result.events.map((e) => e.symbol),
        ["R", "M", "P"],
      );
      assert.equal(result.events[2].actor, ids.advisor);
      await login("student");
      await assert.rejects(rpc("submit_stage", [team, "P", "https://example.com/extra"]));
    });
    await t.test("organizador ve el historial y acceso anónimo queda bloqueado", async () => {
      await login("organizer");
      assert.equal((await db.query("select * from public.submissions")).rows.length, 3);
      await assert.rejects(rpc("set_user_role", [ids.organizer, "student"]));
      await db.exec("reset role; set role anon");
      await assert.rejects(db.exec("select * from public.event_teams"));
      await assert.rejects(rpc("review_stage", [submission, true, ""]));
    });
  } finally {
    await db.close();
  }
});
