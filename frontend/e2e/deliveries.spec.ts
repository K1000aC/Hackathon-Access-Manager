import { test, expect, navigate } from "./fixtures";
const me = "00000000-0000-4000-8000-000000000001",
  other = "00000000-0000-4000-8000-000000000002",
  teamId = "10000000-0000-4000-8000-000000000001";
async function setup(page: import("@playwright/test").Page, student = false) {
  const now = new Date().toISOString();
  const team: Record<string, unknown> = {
    id: teamId,
    owner_id: student ? me : other,
    advisor_id: student ? other : me,
    name: "Proyecto Aurora",
    category: "Social",
    members: 1,
    chain: "RM",
    final_grade: null,
    final_reviewed_by: null,
    final_reviewed_at: null,
    created_at: now,
    events: [
      { symbol: "R", at: now, detail: "Acceso", actor: other },
      { symbol: "M", at: now, detail: "Mentoría aprobada", actor: me },
    ],
  };
  const submissions: Record<string, unknown>[] = student
    ? []
    : [
        {
          id: "final",
          team_id: teamId,
          stage: "P",
          detail: "https://github.com/equipo/proyecto",
          status: "pending",
          feedback: "",
          submitted_at: now,
          reviewed_at: null,
          attachment_path: "",
        },
      ];
  const management = {
    team_id: teamId,
    board_url: "https://github.com/users/equipo/projects/1",
    repository_url: "https://github.com/equipo/proyecto",
    summary: "Backlog definido; sprint 1 en curso.",
    status: "pending",
    feedback: "",
    public_verified_by: null as string | null,
  };
  const calls: Record<string, unknown>[] = [];
  await page.route("https://auth-qa.supabase.co/**", async (route) => {
    const r = route.request(),
      u = new URL(r.url());
    if (u.pathname === "/rest/v1/profiles")
      return route.fulfill({
        json: {
          id: me,
          display_name: "Persona QA",
          email: "qa@example.com",
          role: student ? "student" : "advisor",
        },
      });
    if (u.pathname === "/rest/v1/event_teams") return route.fulfill({ json: [team] });
    if (u.pathname === "/rest/v1/submissions") return route.fulfill({ json: submissions });
    if (u.pathname === "/rest/v1/work_items") return route.fulfill({ json: [] });
    if (u.pathname === "/rest/v1/project_management") return route.fulfill({ json: management });
    if (u.pathname === "/rest/v1/rpc/review_stage") {
      const v = r.postDataJSON();
      calls.push(v);
      team.chain = "RMP";
      team.final_grade = v.p_grade;
      team.final_reviewed_by = me;
      team.final_reviewed_at = now;
      (team.events as unknown[]).push({ symbol: "P", at: now, detail: "Final", actor: me });
      submissions[0].status = "approved";
      return route.fulfill({ json: null });
    }
    if (u.pathname === "/rest/v1/rpc/review_project_management") {
      const v = r.postDataJSON();
      if (v.p_approve && !v.p_public_verified)
        return route.fulfill({
          status: 400,
          json: { message: "Comprueba que ambos enlaces abran sin iniciar sesión." },
        });
      management.status = "approved";
      management.public_verified_by = me;
      return route.fulfill({ json: null });
    }
    if (u.pathname.startsWith("/storage/v1/object/team-work/"))
      return route.fulfill({ json: { Key: "team-work/final.pdf" } });
    if (u.pathname === "/rest/v1/rpc/submit_stage") {
      const v = r.postDataJSON();
      calls.push(v);
      submissions.push({
        id: "uploaded",
        team_id: teamId,
        stage: "P",
        detail: v.p_detail,
        attachment_path: v.p_attachment_path,
        status: "pending",
        feedback: "",
        submitted_at: now,
      });
      return route.fulfill({ json: "uploaded" });
    }
    return route.fallback();
  });
  await page.goto("/");
  await navigate(page, "Mi panel");
  await page.getByLabel("Correo", { exact: true }).fill("qa@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("Test-password-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("tablist")).toBeVisible();
  return calls;
}
test("certificado final exige nota y aparece tras la revisión del asesor", async ({
  page,
}, info) => {
  const calls = await setup(page);
  await page.getByRole("tab", { name: "Certificados", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Certificado de finalización", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Por revisar", exact: true }).click();
  await page.getByRole("button", { name: "Aprobar etapa", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "calificar de 0 a 100" })).toBeVisible();
  expect(calls).toHaveLength(0);
  await page.getByLabel("Calificación final (0 a 100)", { exact: true }).fill("95");
  await page.getByRole("button", { name: "Aprobar etapa", exact: true }).click();
  await page.getByRole("tab", { name: "Certificados", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Certificado de finalización", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("95/100", { exact: true })).toBeVisible();
  expect(calls[0].p_grade).toBe(95);
  await page.screenshot({ path: info.outputPath("certificado-final.png"), fullPage: true });
});
test("asesor debe confirmar la visibilidad de ambos enlaces antes de validarlos", async ({
  page,
}) => {
  await setup(page);
  await page.getByRole("tab", { name: "Backlog / Sprints", exact: true }).click();
  await expect(
    page.getByText("Backlog definido; sprint 1 en curso.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Validar enlaces públicos", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Comprueba que ambos enlaces" }),
  ).toBeVisible();
  await page
    .getByLabel("Comprobé que tablero y repositorio abren sin iniciar sesión.", { exact: true })
    .check();
  await page.getByRole("button", { name: "Validar enlaces públicos", exact: true }).click();
  await expect(
    page.getByText("Enlaces públicos validados por el asesor", { exact: true }),
  ).toBeVisible();
});
test("líder adjunta PDF a la propuesta final sin emitir certificado antes de la revisión", async ({
  page,
}) => {
  const calls = await setup(page, true);
  await page.getByRole("tab", { name: "Mis entregas", exact: true }).click();
  await page
    .getByLabel("Archivo de la entrega (opcional)", { exact: false })
    .setInputFiles({
      name: "propuesta-final.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-QA"),
    });
  await page.getByRole("button", { name: "Enviar para aprobación", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Descargar archivo de entrega", exact: false }),
  ).toBeVisible();
  expect(calls[0].p_attachment_path).toContain(`${teamId}/${me}/`);
  await page.getByRole("tab", { name: "Certificados", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Certificado de finalización", exact: true }),
  ).toHaveCount(0);
});
