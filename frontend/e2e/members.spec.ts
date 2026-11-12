import { test, expect, navigate } from "./fixtures";
const me = "00000000-0000-4000-8000-000000000001",
  other = "00000000-0000-4000-8000-000000000002",
  candidate = "00000000-0000-4000-8000-000000000003",
  teamId = "10000000-0000-4000-8000-000000000001";
async function setup(
  page: import("@playwright/test").Page,
  kind: "leader" | "advisor" | "member",
  initial = true,
) {
  let created = initial;
  let approved = false;
  let requests: Record<string, unknown>[] =
    kind === "advisor"
      ? [
          {
            id: "request",
            name: "Sofía QA",
            email: "sofia@example.com",
            action: "add",
            status: "pending",
            reason: "Alta inicial",
            feedback: "",
          },
        ]
      : [];
  const team = {
    id: teamId,
    owner_id: kind === "leader" ? me : other,
    advisor_id: kind === "advisor" ? me : other,
    name: "Equipo Aurora",
    category: "Social",
    members: 1,
    chain: "R",
    created_at: new Date().toISOString(),
    events: [{ symbol: "R", at: new Date().toISOString(), detail: "Acceso creado", actor: me }],
  };
  let submitted: Record<string, unknown> | undefined;
  await page.route("https://auth-qa.supabase.co/**", async (route) => {
    const req = route.request(),
      u = new URL(req.url());
    if (u.pathname === "/rest/v1/profiles")
      return route.fulfill({
        json: {
          id: me,
          display_name: "Lucía QA",
          email: "qa@example.com",
          role: kind === "advisor" ? "advisor" : "student",
        },
      });
    if (u.pathname === "/rest/v1/event_teams")
      return route.fulfill({ json: created ? [team] : [] });
    if (u.pathname === "/rest/v1/submissions" || u.pathname === "/rest/v1/work_items")
      return route.fulfill({ json: [] });
    if (u.pathname === "/rest/v1/rpc/register_event_team") {
      submitted = req.postDataJSON();
      created = true;
      requests = [
        {
          id: "request",
          name: "Sofía QA",
          email: "sofia@example.com",
          action: "add",
          status: "pending",
          reason: "Alta inicial",
          feedback: "",
        },
      ];
      return route.fulfill({ json: teamId });
    }
    if (u.pathname === "/rest/v1/rpc/get_team_roster")
      return route.fulfill({
        json: {
          leader_id: team.owner_id,
          advisor_name: "Profesor Daniel QA",
          member_limit: 4,
          members: [
            { id: team.owner_id, name: "Lucía QA", email: "lider@example.com", leader: true },
            ...(approved || kind === "member"
              ? [
                  {
                    id: kind === "member" ? me : candidate,
                    name: "Sofía QA",
                    email: "sofia@example.com",
                    leader: false,
                  },
                ]
              : []),
          ],
          requests,
        },
      });
    if (u.pathname === "/rest/v1/rpc/request_team_member") {
      if (requests.length)
        return route.fulfill({
          status: 400,
          json: { code: "23505", message: "duplicate request" },
        });
      const values = req.postDataJSON();
      requests.push({
        id: "request",
        name: "Sofía QA",
        email: values.p_email,
        action: values.p_action,
        status: "pending",
        reason: values.p_reason,
        feedback: "",
      });
      return route.fulfill({ json: "request" });
    }
    if (u.pathname === "/rest/v1/rpc/review_team_member") {
      approved = true;
      requests[0].status = "approved";
      return route.fulfill({ json: null });
    }
    return route.fallback();
  });
  await page.goto("/");
  await navigate(page, "Mi panel");
  await page.getByLabel("Correo", { exact: true }).fill("qa@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("Test-password-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("tablist")).toBeVisible();
  return () => submitted;
}
test("líder registra correos, ve profesor y espera aprobación de incorporaciones", async ({
  page,
}) => {
  const submitted = await setup(page, "leader", false);
  await navigate(page, "Registro");
  await page.getByLabel("Nombre del equipo", { exact: true }).fill("Equipo Aurora");
  await page.getByRole("combobox", { name: "Integrantes", exact: true }).selectOption("4");
  await page
    .getByLabel("Correos de integrantes con cuenta (opcional)", { exact: true })
    .fill("sofia@example.com");
  await page.getByLabel("Acepto el reglamento", { exact: false }).check();
  await page.getByRole("button", { name: "Generar acceso", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tu equipo ya tiene acceso" })).toBeVisible();
  expect(submitted()?.p_member_emails).toEqual(["sofia@example.com"]);
  await page.getByRole("button", { name: "Continuar al seguimiento" }).click();
  await expect(page.getByText("Profesor Daniel QA", { exact: false })).toBeVisible();
  await expect(page.getByText("Eres el líder del equipo.", { exact: false })).toBeVisible();
  await expect(page.getByText("Sofía QA", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Aprobar integrante" })).toHaveCount(0);
});
test("profesor asignado aprueba y aparecen los integrantes activos", async ({ page }) => {
  await setup(page, "advisor");
  await page.getByRole("tab", { name: "Equipos", exact: true }).click();
  await page.getByRole("button", { name: "Aprobar integrante", exact: true }).click();
  await expect(page.getByText("2 integrantes activos", { exact: false })).toBeVisible();
  await expect(page.getByText("Revisión guardada.", { exact: true })).toBeVisible();
});
test("integrante consulta el equipo sin controles de líder", async ({ page }) => {
  await setup(page, "member");
  await page.getByRole("tab", { name: "Mi equipo", exact: true }).click();
  await expect(
    page.getByText("Solo el líder puede solicitar cambios de integrantes.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("Solicitar alta o baja de integrante", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Enviar para aprobación", exact: true }),
  ).toHaveCount(0);
});

test("solicitud confirma el envío junto al botón y no anuncia éxito si falla", async ({
  page,
}, info) => {
  await setup(page, "leader");
  await page.getByRole("tab", { name: "Mi equipo", exact: true }).click();
  const toggle = page.getByText("Solicitar alta o baja de integrante", { exact: true });
  await toggle.click();
  await expect(toggle).toHaveCSS("display", "flex");
  await page.getByLabel("Correo del estudiante", { exact: true }).fill("sofia@example.com");
  await page.getByLabel("Motivo del cambio", { exact: true }).fill("Se incorpora al prototipo.");
  await page.route(
    "**/rest/v1/rpc/request_team_member",
    (route) =>
      route.fulfill({ status: 503, json: { message: "Servicio temporalmente no disponible" } }),
    { times: 1 },
  );
  await page.getByRole("button", { name: "Solicitar aprobación del asesor", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Servicio temporalmente no disponible" }),
  ).toBeVisible();
  await expect(page.getByText("Solicitud enviada correctamente", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Correo del estudiante", { exact: true })).toHaveValue(
    "sofia@example.com",
  );
  await page.getByRole("button", { name: "Solicitar aprobación del asesor", exact: true }).click();
  const message = page.getByRole("status").filter({ hasText: "Solicitud enviada correctamente" });
  await expect(message).toBeInViewport();
  await expect(message).toContainText("sofia@example.com");
  await expect(message).toContainText("pendiente hasta su aprobación");
  await expect(page.getByLabel("Correo del estudiante", { exact: true })).toHaveValue("");
  await page.screenshot({ path: info.outputPath("solicitud-confirmada.png") });
  await page.getByLabel("Correo del estudiante", { exact: true }).fill("sofia@example.com");
  await page.getByLabel("Motivo del cambio", { exact: true }).fill("Reintento");
  await page.getByRole("button", { name: "Solicitar aprobación del asesor", exact: true }).click();
  await expect(page.getByText("Solicitud enviada correctamente", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("alert").filter({ hasText: "Ya hay una solicitud pendiente" }),
  ).toBeVisible();
});
