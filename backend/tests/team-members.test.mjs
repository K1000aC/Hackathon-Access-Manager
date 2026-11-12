import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
test("líder, integrantes y asesor: registro transaccional y cambios aprobados", async (t) => {
  const db = new PGlite();
  const ids = Array.from({ length: 8 }, (_, i) => `00000000-0000-4000-8000-00000000000${i + 1}`);
  try {
    await db.exec(
      `create role anon;create role authenticated;create schema auth;grant usage on schema auth to authenticated;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`,
    );
    await db.exec(readFileSync(new URL("../migrations/001_platform.sql", import.meta.url), "utf8"));
    for (let i = 0; i < 8; i++)
      await db.query("insert into auth.users values($1,$2,$3,$4)", [
        ids[i],
        `user${i}@example.com`,
        JSON.stringify({ display_name: `Usuario ${i}` }),
        i === 7 ? null : new Date().toISOString(),
      ]);
    await db.query("update public.profiles set role='organizer' where id=$1", [ids[0]]);
    await db.query("update public.profiles set role='advisor' where id=any($1)", [
      [ids[1], ids[2]],
    ]);
    await db.query(
      "insert into public.event_teams(owner_id,name,category,members) values($1,'Anterior','Social',3)",
      [ids[3]],
    );
    await db.exec(
      readFileSync(new URL("../migrations/004_team_members.sql", import.meta.url), "utf8"),
    );
    const rpc = async (name, args) =>
      (
        await db.query(
          `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(",")}) as result`,
          args,
        )
      ).rows[0].result;
    const login = async (i) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [ids[i]]);
      await db.exec("set role authenticated");
    };
    await t.test(
      "migra líderes existentes y asigna profesor sin inventar integrantes",
      async () => {
        await login(3);
        const team = (await db.query("select * from public.event_teams")).rows[0];
        assert.equal(team.members, 1);
        assert.equal(team.member_limit, 3);
        assert.ok(team.advisor_id);
        assert.equal((await rpc("get_team_roster", [team.id])).members[0].id, ids[3]);
      },
    );
    await login(4);
    await t.test(
      "registro sin cuenta confirmada de integrante revierte todo el acceso",
      async () => {
        await assert.rejects(
          rpc("register_event_team", ["Inválido", "Social", 3, ["user7@example.com"]]),
        );
        assert.equal((await db.query("select * from public.event_teams")).rows.length, 0);
      },
    );
    const teamId = await rpc("register_event_team", ["Nuevo", "Social", 3, ["user5@example.com"]]);
    const registered = (await db.query("select * from public.event_teams")).rows[0];
    const assigned = ids.indexOf(registered.advisor_id);
    const otherAdvisor = assigned === 1 ? 2 : 1;
    let request;
    await t.test("líder automático, profesor automático e incorporación pendiente", async () => {
      const roster = await rpc("get_team_roster", [teamId]);
      assert.equal(roster.leader_id, ids[4]);
      assert.equal(roster.members.length, 1);
      assert.ok(roster.advisor_name);
      assert.equal(roster.requests[0].status, "pending");
      request = roster.requests[0].id;
    });
    await t.test("solo asesor asignado puede aprobar y líder no se elimina", async () => {
      await assert.rejects(
        rpc("request_team_member", [teamId, "user4@example.com", "remove", "Me retiro"]),
      );
      for (const i of [0, 4, otherAdvisor, 6]) {
        await login(i);
        await assert.rejects(rpc("review_team_member", [request, true, ""]));
      }
      await login(assigned);
      await rpc("review_team_member", [request, true, "Aceptado"]);
      await assert.rejects(rpc("review_team_member", [request, true, "Duplicada"]));
    });
    await t.test("integrante ve su equipo pero no modifica composición ni crea otro", async () => {
      await login(5);
      assert.equal((await db.query("select * from public.event_teams")).rows.length, 1);
      await assert.rejects(
        rpc("request_team_member", [teamId, "user6@example.com", "add", "Agregar compañero"]),
      );
      await assert.rejects(rpc("register_event_team", ["Otro", "Social", 3, []]));
      await assert.rejects(db.exec("delete from public.team_members"));
    });
    await t.test(
      "baja espera revisión, rechazo conserva miembro y aprobación lo retira",
      async () => {
        await login(4);
        let r = await rpc("request_team_member", [
          teamId,
          "user5@example.com",
          "remove",
          "Cambio de equipo",
        ]);
        assert.equal((await rpc("get_team_roster", [teamId])).members.length, 2);
        await login(assigned);
        await assert.rejects(rpc("review_team_member", [r, false, ""]));
        await rpc("review_team_member", [r, false, "Debe concluir su actividad"]);
        await login(4);
        assert.equal((await rpc("get_team_roster", [teamId])).members.length, 2);
        r = await rpc("request_team_member", [
          teamId,
          "user5@example.com",
          "remove",
          "Retiro acordado",
        ]);
        await login(assigned);
        await rpc("review_team_member", [r, true, "Autorizado"]);
        await login(4);
        assert.equal((await rpc("get_team_roster", [teamId])).members.length, 1);
        await login(5);
        assert.equal((await db.query("select * from public.event_teams")).rows.length, 0);
      },
    );
    await t.test(
      "cupo incluye solicitudes y estudiante no puede reservar dos equipos",
      async () => {
        await login(4);
        await rpc("request_team_member", [teamId, "user5@example.com", "add", "Reincorporación"]);
        await db.exec("reset role");
        await db.query("update public.event_teams set member_limit=2 where id=$1", [teamId]);
        await login(4);
        await assert.rejects(
          rpc("request_team_member", [teamId, "user6@example.com", "add", "Sin cupo"]),
          /cupo/,
        );
        await login(3);
        const previous = (await db.query("select * from public.event_teams")).rows[0];
        await assert.rejects(
          rpc("request_team_member", [previous.id, "user5@example.com", "add", "Otro equipo"]),
        );
        await login(5);
        await assert.rejects(rpc("register_event_team", ["Reservado", "Social", 3, []]));
      },
    );
    await t.test("sin asesores no se genera un acceso huérfano", async () => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub','',false)");
      await db.query("update public.profiles set role='student' where id=any($1)", [
        [ids[1], ids[2]],
      ]);
      await login(6);
      await assert.rejects(
        rpc("register_event_team", ["Sin asesor", "Social", 2, []]),
        /No hay asesores/,
      );
      assert.equal((await db.query("select * from public.event_teams")).rows.length, 0);
    });
  } finally {
    await db.close();
  }
});
