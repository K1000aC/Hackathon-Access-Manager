import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
function compile(path, imports = {}) {
  let code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  for (const [from, to] of Object.entries(imports))
    code = code.replaceAll(`"${from}"`, `"${to}"`).replaceAll(`'${from}'`, `"${to}"`);
  return `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
}
const automaton = compile("../src/model/automaton.ts");
const teamModule = compile("../src/model/team.ts", { "./automaton": automaton });
const { advanceTeam, teamState, teamInput } = await import(teamModule);
const repository = await import(
  compile("../src/infrastructure/storage/teamRepository.ts", { "../../model/team": teamModule })
);
const data = new Map();
globalThis.localStorage = {
  getItem: (key) => data.get(key) ?? null,
  setItem: (key, value) => data.set(key, String(value)),
};
globalThis.window = new EventTarget();
const pass = {
  id: "team-1",
  teamName: "Binary",
  leader: "Liz",
  email: "liz@example.com",
  category: "Educación",
  members: "3",
};
test("registro persistente, bloqueo de saltos y certificación únicamente con RMP", () => {
  data.clear();
  repository.registerTeam(pass);
  assert.equal(teamState(repository.listTeams()[0]), "q1");
  assert.equal(repository.listAcceptedTeams().length, 0);
  assert.throws(() => repository.recordEvent(pass.id, "P", "https://example.com/prototype"));
  assert.throws(() => repository.recordEvent(pass.id, "M", "  "));
  repository.recordEvent(pass.id, "M", "Mentoría con Ana");
  assert.equal(teamState(repository.listTeams()[0]), "q2");
  assert.throws(() => repository.recordEvent(pass.id, "M", "Otra mentoría"));
  for (const url of ["no-es-url", "javascript:alert(1)", "ftp://example.com"])
    assert.throws(() => repository.recordEvent(pass.id, "P", url));
  repository.recordEvent(pass.id, "P", "https://example.com/prototype");
  const restored = repository.listTeams()[0];
  assert.equal(teamState(restored), "q3");
  assert.equal(teamInput(restored), "RMP");
  assert.equal(restored.events[1].detail, "Mentoría con Ana");
  assert.equal(repository.listAcceptedTeams().length, 1);
  assert.throws(() => advanceTeam(restored, "P", "https://example.com"));
  assert.throws(() => repository.registerTeam({ ...pass, id: "other", teamName: " BINARY " }));
});
test("varios equipos mantienen progresos independientes y se notifican cambios", () => {
  data.clear();
  let notifications = 0;
  const listener = () => notifications++;
  window.addEventListener("hackaflow:teams", listener);
  repository.registerTeam(pass);
  repository.registerTeam({ ...pass, id: "team-2", teamName: "Neon" });
  repository.recordEvent("team-1", "M", "Sesión A");
  assert.equal(teamState(repository.listTeams().find((team) => team.id === "team-2")), "q1");
  assert.equal(notifications, 3);
  window.removeEventListener("hackaflow:teams", listener);
});
test("conserva datos anteriores al guardar nuevos equipos y señala ausencia de evidencias", () => {
  data.clear();
  localStorage.setItem(
    "hackaflow.accepted.v1",
    JSON.stringify([{ ...pass, input: "RMP", acceptedAt: "2026-11-11T12:00:00Z" }]),
  );
  assert.equal(repository.listTeams()[0].legacy, true);
  repository.registerTeam({ ...pass, id: "team-2", teamName: "Neon" });
  assert.equal(repository.listTeams().length, 2);
  assert.equal(repository.listAcceptedTeams()[0].legacy, true);
});
test("un fallo de almacenamiento no se anuncia como guardado exitoso", () => {
  data.clear();
  const original = localStorage.setItem;
  localStorage.setItem = () => {
    throw new Error("quota");
  };
  try {
    assert.throws(() => repository.registerTeam(pass), /quota/);
    assert.equal(repository.listTeams().length, 0);
  } finally {
    localStorage.setItem = original;
  }
});
