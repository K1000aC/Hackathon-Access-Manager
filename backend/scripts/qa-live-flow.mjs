/** Opt-in QA contra la plataforma real. No se ejecuta con npm test ni test:e2e. */
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const batch = JSON.parse(
  await readFile(new URL("../.local/qa-users.json", import.meta.url), "utf8"),
);
const student = batch.accounts.find(
  (account) => account.email === "hackaflow.qa.student01@example.com",
);
const advisor = batch.accounts.find(
  (account) => account.email === "hackaflow.qa.advisor01@example.com",
);
const target = "https://hackathon-access-manager.vercel.app";
const key = process.env.SUPABASE_ADMIN_KEY;
assert(
  student?.ready && advisor?.ready && key,
  "Se requieren las cuentas QA y la configuración administrativa local.",
);
assert.equal(
  new URL(process.env.SUPABASE_URL).origin,
  batch.projectURL,
  "El lote pertenece a otro proyecto.",
);
const admin = createClient(batch.projectURL, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const secrets = [key, student.password, advisor.password];
const redact = (message) =>
  secrets.reduce((text, secret) => text.replaceAll(secret, "[REDACTADO]"), String(message));
const results = [];
let browser;
let currentStep = "";
function mark(name) {
  currentStep = name;
  console.log(`QA: ${name}`);
}
async function teamData() {
  const { data, error } = await admin
    .from("event_teams")
    .select("*")
    .eq("owner_id", student.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
async function pendingSubmission(teamId) {
  const { data, error } = await admin
    .from("submissions")
    .select("*")
    .eq("team_id", teamId)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  return data;
}
async function login(context, account) {
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  await page.goto(target);
  await page
    .getByRole("navigation", { name: "Navegación principal" })
    .getByRole("button", { name: "Mi panel", exact: true })
    .click();
  await page.getByLabel("Correo", { exact: true }).fill(account.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("heading", { name: `Hola, ${account.display_name}`, exact: true }).waitFor();
  return page;
}
async function refresh(page) {
  await page.getByRole("button", { name: "Actualizar", exact: true }).click();
}
async function expectChain(chain) {
  for (let i = 0; i < 40; i++) {
    const team = await teamData();
    if (team?.chain === chain) return team;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No se alcanzó la cadena ${chain}`);
}
try {
  mark("Iniciar sesiones independientes de estudiante y asesor");
  browser = await chromium.launch();
  const studentContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const advisorContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const s = await login(studentContext, student);
  const a = await login(advisorContext, advisor);
  results.push("Login real de estudiante móvil y asesor escritorio correcto");
  mark("Registrar equipo desde la interfaz del estudiante");
  let team = await teamData();
  if (!team) {
    await s.getByLabel("Nombre", { exact: true }).fill("Equipo QA 01 · validación integral");
    await s.getByLabel("Categoría", { exact: true }).fill("Pruebas de plataforma");
    await s.getByLabel("Integrantes", { exact: true }).fill("3");
    await s.getByRole("button", { name: "Guardar registro (R)", exact: true }).click();
    team = await expectChain("R");
    results.push("Registro UI persistido con cadena R");
  }
  assert.equal(team.owner_id, student.id);
  if (team.chain !== "R")
    throw new Error(
      `El equipo QA 01 ya tiene progreso ${team.chain}; no se reiniciará ni borrará.`,
    );
  assert.equal(
    (await pendingSubmission(team.id)).length,
    0,
    "Ya hay una entrega pendiente en este equipo; no se alterará sin revisar.",
  );
  mark("Preparar asignación exclusivamente del equipo QA 01");
  if (team.advisor_id && team.advisor_id !== advisor.id)
    throw new Error("El equipo tiene otro asesor; no se sobrescribe su asignación.");
  const assigned = await admin
    .from("event_teams")
    .update({ advisor_id: advisor.id })
    .eq("id", team.id)
    .eq("owner_id", student.id)
    .select("id")
    .single();
  if (assigned.error) throw new Error(assigned.error.message);
  results.push(
    "Asignación preparada mediante cliente administrativo, sin usar la cuenta organizadora",
  );
  mark("Enviar mentoría desde el estudiante y comprobar estado pendiente");
  await refresh(s);
  await s
    .getByLabel("Describe la sesión y el mentor con quien asististe")
    .fill("QA: mentoría de arquitectura; falta precisar la evidencia de la sesión.");
  await s.getByRole("button", { name: "Enviar para aprobación", exact: true }).click();
  await s.getByText("Tu envío está pendiente de revisión.", { exact: false }).waitFor();
  assert.equal((await teamData()).chain, "R");
  assert.equal(await s.getByRole("button", { name: "Aprobar etapa", exact: true }).count(), 0);
  results.push("Entrega pendiente mantiene R; estudiante no tiene controles de aprobación");
  mark("Solicitar correcciones como asesor asignado");
  await refresh(a);
  await a.getByRole("heading", { name: team.name, exact: true }).waitFor();
  const { data: visibleAssigned, error: assignmentError } = await admin
    .from("event_teams")
    .select("id")
    .eq("advisor_id", advisor.id);
  if (assignmentError) throw new Error(assignmentError.message);
  await a.locator(".team-list button").first().waitFor();
  assert.equal(
    await a.locator(".team-list button").count(),
    visibleAssigned.length,
    "El asesor debe ver solo sus asignaciones.",
  );
  assert.equal(
    visibleAssigned.length,
    1,
    "La cuenta QA advisor01 tiene asignaciones adicionales; no se modifica ninguna.",
  );
  await a
    .getByLabel("Observaciones", { exact: true })
    .fill("QA: agrega el nombre del asesor y el tema tratado en la mentoría.");
  await a.getByRole("button", { name: "Solicitar correcciones", exact: true }).click();
  await a.getByText("Mentoría · Requiere correcciones", { exact: true }).waitFor();
  assert.equal((await teamData()).chain, "R");
  results.push("Asesor ve solo su equipo; corrección se guarda sin avanzar el AFD");
  mark("Reenviar mentoría corregida y aprobarla");
  await refresh(s);
  await s
    .getByLabel("Describe la sesión y el mentor con quien asististe")
    .fill("QA: sesión realizada con Asesor QA 01 sobre arquitectura MVC y el AFD RMP.");
  await s.getByRole("button", { name: "Enviar para aprobación", exact: true }).click();
  await s.getByText("Tu envío está pendiente de revisión.", { exact: false }).waitFor();
  await refresh(a);
  await a.getByRole("button", { name: "Aprobar etapa", exact: true }).waitFor();
  await a.getByLabel("Observaciones", { exact: true }).fill("QA: mentoría revisada y aprobada.");
  await a.getByRole("button", { name: "Aprobar etapa", exact: true }).click();
  await expectChain("RM");
  results.push("Reenvío y aprobación de mentoría avanzan R → RM");
  mark("Enviar prototipo desde estudiante y aprobarlo como asesor");
  await refresh(s);
  await s
    .getByLabel("Enlace al repositorio o prototipo", { exact: true })
    .fill("https://example.com/hackaflow-qa-prototipo");
  await s.getByRole("button", { name: "Enviar para aprobación", exact: true }).click();
  await s.getByText("Tu envío está pendiente de revisión.", { exact: false }).waitFor();
  assert.equal((await teamData()).chain, "RM");
  await refresh(a);
  await a.getByRole("button", { name: "Aprobar etapa", exact: true }).waitFor();
  await a
    .getByLabel("Observaciones", { exact: true })
    .fill("QA: entrega de prototipo aprobada para verificar el flujo de certificación.");
  await a.getByRole("button", { name: "Aprobar etapa", exact: true }).click();
  team = await expectChain("RMP");
  results.push("Entrega pendiente mantiene RM; aprobación avanza RM → RMP");
  mark("Comprobar constancia, persistencia, historial y AFD");
  await refresh(s);
  await s
    .locator(".certificate")
    .getByRole("heading", { name: "Proyecto certificado", exact: true })
    .waitFor();
  await s.reload();
  await s
    .locator(".certificate")
    .getByRole("heading", { name: "Proyecto certificado", exact: true })
    .waitFor();
  assert.deepEqual(
    team.events.map((event) => event.symbol),
    ["R", "M", "P"],
  );
  assert.equal(team.events[1].actor, advisor.id);
  assert.equal(team.events[2].actor, advisor.id);
  const { data: history, error: historyError } = await admin
    .from("submissions")
    .select("stage,status,feedback")
    .eq("team_id", team.id);
  if (historyError) throw new Error(historyError.message);
  assert.equal(history.length, 3);
  assert.equal(history.filter((item) => item.status === "changes_requested").length, 1);
  assert.equal(history.filter((item) => item.status === "approved").length, 2);
  await s.getByText("Ver recorrido del AFD de este equipo", { exact: true }).click();
  assert.equal(await s.locator(".state-node.active").innerText(), "q3");
  await s.screenshot({
    path: fileURLToPath(new URL("../.local/qa-live-certified.png", import.meta.url)),
    fullPage: true,
  });
  results.push(
    "Constancia visible tras recarga; historial de tres entregas y eventos R/M/P; AFD q3",
  );
  const report = {
    target,
    finishedAt: new Date().toISOString(),
    teamId: team.id,
    result: "passed",
    steps: results,
    limitations: [
      "Asignación hecha con fixture administrativo: no se probó la UI de organizadora.",
      "Chromium con viewport móvil y escritorio: no es prueba física iOS/Android.",
      "URL example.com es evidencia ficticia de QA, no un prototipo evaluado externamente.",
    ],
  };
  await writeFile(
    new URL("../.local/qa-live-report.json", import.meta.url),
    JSON.stringify(report, null, 2) + "\n",
    { mode: 0o600 },
  );
  console.log(
    `QA COMPLETO: ${results.length} comprobaciones de flujo correctas. Historial R → RM → RMP.`,
  );
} catch (error) {
  console.error(`QA BLOQUEADO en «${currentStep}»: ${redact(error.message)}`);
  await writeFile(
    new URL("../.local/qa-live-report.json", import.meta.url),
    JSON.stringify(
      {
        target,
        finishedAt: new Date().toISOString(),
        result: "failed",
        step: currentStep,
        error: redact(error.message),
        completed: results,
      },
      null,
      2,
    ) + "\n",
    { mode: 0o600 },
  );
  process.exitCode = 1;
} finally {
  await browser?.close();
}
