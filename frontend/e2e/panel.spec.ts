import { test, expect } from "./fixtures";
const account = "00000000-0000-4000-8000-000000000001";
const teamId = "10000000-0000-4000-8000-000000000001";
const advisorId = "00000000-0000-4000-8000-000000000002";
const team = {
  id: teamId,
  owner_id: account,
  advisor_id: advisorId,
  name: "Neon Builders",
  category: "Social",
  members: 3,
  chain: "R",
  created_at: new Date().toISOString(),
  events: [{ symbol: "R", at: new Date().toISOString(), detail: "Acceso creado", actor: account }],
};
async function setup(
  page: import("@playwright/test").Page,
  role: "student" | "advisor" | "organizer",
) {
  const people = [
    { id: account, display_name: "Liz QA", email: "qa@example.com", role },
    { id: advisorId, display_name: "Asesor QA", email: "asesor@example.com", role: "advisor" },
  ];
  const works: Record<string, unknown>[] =
    role === "student"
      ? []
      : [
          {
            id: "work-1",
            team_id: teamId,
            kind: "task",
            title: "Sprint 1",
            detail: "Primer avance",
            evidence_url: "",
            attachment_path: "",
            status: "pending",
            feedback: "",
          },
        ];
  const calls: string[] = [];
  let management: Record<string, unknown> | null = null;
  await page.route("https://auth-qa.supabase.co/**", async (route) => {
    const r = route.request(),
      u = new URL(r.url());
    if (u.pathname === "/rest/v1/profiles")
      return route.fulfill({ json: u.searchParams.has("id") ? people[0] : people });
    if (u.pathname === "/rest/v1/project_management") return route.fulfill({ json: management });
    if (u.pathname === "/rest/v1/rpc/save_project_management") {
      const v = r.postDataJSON();
      management = {
        board_url: v.p_board_url,
        repository_url: v.p_repository_url,
        summary: v.p_summary,
        status: "pending",
        feedback: "",
        public_verified_by: null,
      };
      calls.push("management");
      return route.fulfill({ json: null });
    }
    if (u.pathname === "/rest/v1/event_teams") return route.fulfill({ json: [team] });
    if (u.pathname === "/rest/v1/submissions") return route.fulfill({ json: [] });
    if (u.pathname === "/rest/v1/work_items")
      return route.fulfill({
        json: works.filter((w) => `eq.${w.kind}` === u.searchParams.get("kind")),
      });
    if (u.pathname === "/rest/v1/rpc/set_user_role") {
      const v = r.postDataJSON();
      people[1].role = v.p_role;
      calls.push("role");
      return route.fulfill({ json: null });
    }
    if (u.pathname.startsWith("/storage/v1/object/team-work/")) {
      calls.push("upload");
      return route.fulfill({ json: { Key: "team-work/file" } });
    }
    if (u.pathname === "/rest/v1/rpc/save_work_item") {
      const v = r.postDataJSON();
      works.push({
        id: "work-2",
        team_id: teamId,
        kind: v.p_kind,
        title: v.p_title,
        detail: v.p_detail,
        evidence_url: v.p_url,
        attachment_path: v.p_path,
        status: v.p_submit ? "pending" : "draft",
        feedback: "",
      });
      calls.push("save");
      return route.fulfill({ json: "work-2" });
    }
    if (u.pathname === "/rest/v1/rpc/review_work_item") {
      const v = r.postDataJSON();
      const item = works.find((w) => w.id === v.p_id)!;
      item.status = v.p_approve ? "approved" : "changes_requested";
      item.feedback = v.p_feedback;
      calls.push("review");
      return route.fulfill({ json: null });
    }
    return route.fallback();
  });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Navegación principal" })
    .getByRole("button", { name: "Mi panel", exact: true })
    .click();
  await page.getByLabel("Correo", { exact: true }).fill("qa@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("Test-password-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("tablist", { name: "Apartados de Mi panel" })).toBeVisible();
  return calls;
}
test("organizador: subpestañas y tabla de roles con búsqueda y guardado explícito", async ({
  page,
}, info) => {
  const calls = await setup(page, "organizer");
  await expect(page.getByRole("tab", { name: "Equipos", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Mi perfil", exact: true }).click();
  await page.getByLabel("Buscar usuario").fill("Asesor QA");
  await expect(page.getByRole("row")).toHaveCount(2);
  await page
    .getByRole("combobox", { name: "Rol de Asesor QA", exact: true })
    .selectOption("student");
  expect(calls).not.toContain("role");
  await page.getByRole("button", { name: "Guardar rol de Asesor QA", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Rol actualizado");
  expect(calls).toContain("role");
  await page.screenshot({ path: info.outputPath("perfil-organizador.png"), fullPage: true });
  await page.getByRole("tab", { name: "Certificados", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Aún no hay certificados" })).toBeVisible();
  await page.getByRole("tab", { name: "Equipos", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Neon Builders", exact: true })).toBeVisible();
});
test("estudiante: gestión unificada con enlaces públicos y tarea con PPTX", async ({ page }) => {
  const calls = await setup(page, "student");
  await page.getByRole("tab", { name: "Mi perfil", exact: true }).click();
  await expect(page.getByText("Administrar usuarios y roles", { exact: false })).toHaveCount(0);
  await page.getByRole("tab", { name: "Backlog / Sprints", exact: true }).click();
  await page
    .getByLabel("Enlace público del tablero Backlog/Sprints", { exact: true })
    .fill("https://github.com/users/equipo/projects/1");
  await page
    .getByLabel("Enlace público del repositorio", { exact: true })
    .fill("https://github.com/equipo/repo");
  await page
    .getByLabel("Resumen del avance", { exact: true })
    .fill("Sprint 1: prototipo en curso.");
  await page.getByLabel("Confirmo que ambos enlaces son públicos", { exact: false }).check();
  await page.getByRole("button", { name: "Guardar gestión del proyecto", exact: true }).click();
  await expect(
    page.getByText("Visibilidad pendiente de revisión del asesor", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Abrir repositorio público", exact: false }),
  ).toHaveAttribute("href", "https://github.com/equipo/repo");
  await page.getByRole("tab", { name: "Mis entregas", exact: true }).click();
  await page.getByText("Añadir nueva entrega / tarea", { exact: true }).click();
  await page.getByLabel("Título", { exact: true }).fill("Presentación del proyecto");
  await page.getByLabel("Descripción y objetivos", { exact: true }).fill("Propuesta inicial");
  await page
    .getByLabel("Adjuntar archivo (opcional)", { exact: true })
    .setInputFiles({
      name: "propuesta.pptx",
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      buffer: Buffer.from("QA presentation"),
    });
  await page.getByRole("button", { name: "Enviar trabajo a revisión", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Presentación del proyecto", exact: true }),
  ).toBeVisible();
  expect(calls).toEqual(["management", "upload", "save"]);
  await expect(page.getByRole("button", { name: "Aprobar trabajo", exact: true })).toHaveCount(0);
});
test("asesor: revisa un sprint con observaciones desde su panel", async ({ page }) => {
  const calls = await setup(page, "advisor");
  await page.getByRole("tab", { name: "Por revisar", exact: true }).click();
  await page.getByLabel("Observaciones del trabajo", { exact: true }).fill("Falta evidencia");
  await page.getByRole("button", { name: "Solicitar corrección del trabajo", exact: true }).click();
  await expect(page.getByText("Requiere correcciones", { exact: true })).toBeVisible();
  expect(calls).toContain("review");
  await page.getByRole("tab", { name: "Mi perfil", exact: true }).click();
  await expect(page.getByText("Administrar usuarios y roles", { exact: false })).toHaveCount(0);
});

test("registro público muestra únicamente estudiante como tipo de usuario", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Navegación principal" })
    .getByRole("button", { name: "Mi panel", exact: true })
    .click();
  await page.getByRole("button", { name: "Crear una cuenta", exact: true }).click();
  await expect(page.getByLabel("Tipo de usuario", { exact: true })).toHaveValue("Estudiante");
  await expect(page.getByLabel("Tipo de usuario", { exact: true })).not.toBeEditable();
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect(
    page.getByText("El registro público crea únicamente cuentas de estudiante.", { exact: false }),
  ).toBeVisible();
});
