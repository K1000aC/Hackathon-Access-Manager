import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
test("tipos de usuario: alta pública solo estudiante y asignación privilegiada auditada", async (t) => {
  const db = new PGlite();
  const ids = Array.from({ length: 4 }, (_, i) => `00000000-0000-4000-8000-00000000000${i + 1}`);
  try {
    await db.exec(`create role anon;create role authenticated;create schema auth;grant usage on schema auth to authenticated;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb,raw_app_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
    for (const name of ["001_platform.sql", "003_user_types.sql"])
      await db.exec(readFileSync(new URL(`../migrations/${name}`, import.meta.url), "utf8"));
    await t.test("ignora rol y origen enviados por un registro público", async () => {
      for (let i = 0; i < 3; i++)
        await db.query("insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)", [
          ids[i],
          `${i}@example.com`,
          JSON.stringify({
            display_name: "Usuario",
            role: "organizer",
            role_source: "developer",
            role_assigned_by: ids[0],
          }),
        ]);
      const profiles = (await db.query("select * from public.profiles")).rows;
      assert.ok(
        profiles.every(
          (p) =>
            p.role === "student" &&
            p.role_source === "public_signup" &&
            p.role_assigned_by === null,
        ),
      );
    });
    await t.test(
      "las cuentas del lote administrativo se identifican sin permitir elegir rol público",
      async () => {
        await db.query("insert into auth.users values($1,$2,$3,$4)", [
          ids[3],
          "qa@example.com",
          "{}",
          JSON.stringify({ qa_seed: "batch" }),
        ]);
        const p = (await db.query("select * from public.profiles where id=$1", [ids[3]])).rows[0];
        assert.equal(p.role, "student");
        assert.equal(p.role_source, "developer");
      },
    );
    await db.query("update public.profiles set role='organizer' where id=$1", [ids[0]]);
    const login = async (i) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [ids[i]]);
      await db.exec("set role authenticated");
    };
    await t.test("estudiante no puede convertirse en asesor ni editar su marca", async () => {
      await login(1);
      await assert.rejects(db.query("select public.set_user_role($1,'advisor')", [ids[1]]));
      await assert.rejects(
        db.exec("update public.profiles set role='advisor',role_source='developer'"),
      );
    });
    await t.test(
      "organizador asigna asesor con responsable y sin cambiarse a sí mismo",
      async () => {
        await login(0);
        await db.query("select public.set_user_role($1,'advisor')", [ids[2]]);
        const p = (await db.query("select * from public.profiles where id=$1", [ids[2]])).rows[0];
        assert.equal(p.role, "advisor");
        assert.equal(p.role_source, "organizer");
        assert.equal(p.role_assigned_by, ids[0]);
        await assert.rejects(db.query("select public.set_user_role($1,'student')", [ids[0]]));
      },
    );
    await t.test(
      "asesor no puede asignar roles; operaciones administrativas conservan rastro",
      async () => {
        await login(2);
        await assert.rejects(db.query("select public.set_user_role($1,'organizer')", [ids[1]]));
        await db.exec("reset role");
        await db.query("select set_config('request.jwt.claim.sub','',false)");
        await db.query("update public.profiles set role='advisor' where id=$1", [ids[1]]);
        let p = (await db.query("select * from public.profiles where id=$1", [ids[1]])).rows[0];
        assert.equal(p.role_source, "developer");
        assert.equal(p.role_assigned_by, null);
        await db.query(
          "update public.profiles set display_name='Actualizado',role_source='public_signup' where id=$1",
          [ids[1]],
        );
        p = (await db.query("select * from public.profiles where id=$1", [ids[1]])).rows[0];
        assert.equal(p.role_source, "developer");
      },
    );
  } finally {
    await db.close();
  }
});
