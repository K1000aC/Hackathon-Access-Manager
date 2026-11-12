import { test, expect, navigate, registerTeam } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("navegación: inicio, operación local y vista educativa", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: /^(Iniciar sesión|Paneles de estudiantes y asesores)$/ }),
  ).toBeVisible();
  await expect(page).toHaveTitle("HackaFlow | Control de accesos");
  await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
  for (const name of [
    "Mi panel",
    "Registro local",
    "Modelo AFD",
    "Seguimiento local",
    "El proyecto",
  ]) {
    await expect(
      page.getByRole("navigation").getByRole("button", { name, exact: true }),
    ).toBeVisible();
  }
  await navigate(page, "Registro local");
  await expect(page.getByRole("heading", { name: "Registra tu equipo" })).toBeVisible();
  await navigate(page, "Modelo AFD");
  await expect(page.getByRole("heading", { name: "Simulador de acceso" })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(6);
  await expect(page.getByText("M = (Q, Σ, δ, q₀, F)", { exact: true })).toBeVisible();
  await navigate(page, "Seguimiento local");
  await expect(page.getByRole("heading", { name: "Equipos y seguimiento" })).toBeVisible();
  await navigate(page, "El proyecto");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tecnología formal");
  await navigate(page, "Mi panel");
  await expect(page.getByRole("navigation").getByRole("button", { name: "Mi panel" })).toHaveClass(
    "active",
  );
  await expect(page.locator("main")).not.toBeEmpty();
});

test("registro: campos obligatorios, persistencia al recargar y duplicados", async ({ page }) => {
  await navigate(page, "Registro local");
  await page.getByRole("button", { name: "Guardar registro", exact: true }).click();
  await expect(page.getByLabel("Nombre del equipo", { exact: true })).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("hackaflow.teams.v2"))).toBeNull();
  await registerTeam(page);
  await expect(page.locator(".access-pass")).toContainText("REGISTRADO · q1");
  await page.getByRole("button", { name: "Continuar con mentoría y prototipo" }).click();
  await expect(page.locator(".team-detail")).toContainText("Estado q1 · Cadena R");
  await page.reload();
  await navigate(page, "Seguimiento local");
  await expect(
    page.getByRole("heading", { name: "Equipo QA", exact: true, level: 2 }),
  ).toBeVisible();
  await expect(page.locator(".team-timeline li")).toHaveCount(1);
  const teams = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hackaflow.teams.v2") || "[]"),
  );
  expect(teams).toHaveLength(1);
  expect(teams[0]).toMatchObject({
    teamName: "Equipo QA",
    leader: "Liz QA",
    email: "qa@example.com",
    members: "4",
    category: "Tecnología educativa",
    events: [{ symbol: "R" }],
  });
  await navigate(page, "Registro local");
  await page.getByLabel("Nombre del equipo", { exact: true }).fill(" Equipo QA ");
  await page.getByLabel("Líder del equipo", { exact: true }).fill("Otra persona");
  await page.getByLabel("Correo de contacto", { exact: true }).fill("otro@example.com");
  await page.getByRole("checkbox", { name: /Acepto el reglamento/ }).check();
  await page.getByRole("button", { name: "Guardar registro", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Ya existe un equipo");
});

test("seguimiento: mentoría, prototipo y constancia únicamente tras RMP", async ({ page }) => {
  await registerTeam(page);
  await page.getByRole("button", { name: "Continuar con mentoría y prototipo" }).click();
  await expect(page.getByRole("button", { name: "Guardar mentoría (M)" })).toBeDisabled();
  await expect(page.locator(".certificate")).toHaveCount(0);
  await page.getByLabel("Mentor o sesión realizada").fill("Mentoría de arquitectura con Liz");
  await page
    .getByRole("checkbox", { name: "Confirmo que el equipo asistió a la mentoría." })
    .check();
  await page.getByRole("button", { name: "Guardar mentoría (M)" }).click();
  await expect(page.locator(".team-detail")).toContainText("Estado q2 · Cadena RM");
  await expect(page.locator(".certificate")).toHaveCount(0);
  await page.reload();
  await navigate(page, "Seguimiento local");
  await expect(page.locator(".team-detail")).toContainText("Estado q2 · Cadena RM");
  await page
    .getByLabel("Enlace al repositorio o prototipo")
    .fill("https://example.com/prototipo-qa");
  await page
    .getByRole("checkbox", {
      name: "Confirmo que este enlace corresponde a la entrega del equipo.",
    })
    .check();
  await page.getByRole("button", { name: "Guardar entrega y certificar (P)" }).click();
  await expect(page.getByRole("region", { name: "Certificación del proyecto" })).toContainText(
    "ACEPTADO",
  );
  await expect(page.locator(".team-timeline li")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Abrir prototipo entregado" })).toHaveAttribute(
    "href",
    "https://example.com/prototipo-qa",
  );
  await page.reload();
  await navigate(page, "Seguimiento local");
  await expect(page.locator(".team-detail")).toContainText("Estado q3 · Cadena RMP");
  await page.getByRole("combobox", { name: /^Mostrar/ }).selectOption("aceptados");
  await expect(page.locator(".team-list button")).toHaveCount(1);
});

test("AFD válido: R M P paso a paso, estilos neón y sesión persistente", async ({ page }) => {
  await navigate(page, "Modelo AFD");
  await page.getByLabel("Cadena de eventos", { exact: true }).fill("R M P");
  await expect(page.getByLabel("Cadena de eventos", { exact: true })).toHaveValue("RMP");
  await expect(page.getByTestId("state-q0")).toHaveClass(/active/);
  for (const state of ["q1", "q2", "q3"]) {
    await page.getByRole("button", { name: "Paso", exact: true }).click();
    await expect(page.getByTestId(`state-${state}`)).toHaveClass(/active/);
    await expect(page.locator(".state-node.active")).toHaveCount(1);
  }
  const final = page.getByTestId("state-q3");
  await expect(final).toHaveClass(/accepting/);
  await expect(final).toHaveCSS("border-top-color", "rgb(194, 24, 91)");
  await expect(final).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(final).not.toHaveCSS("box-shadow", "none");
  await expect(page.getByTestId("simulation-result")).toContainText(
    "Cadena aceptada · Acceso concedido",
  );
  await expect(page.getByTestId("simulation-result")).toHaveClass(/accepted/);
  await expect(page.getByRole("button", { name: "Paso", exact: true })).toBeDisabled();
  await navigate(page, "Seguimiento local");
  await expect(page.getByText("Registra un equipo para comenzar su seguimiento.")).toBeVisible();
  await navigate(page, "Modelo AFD");
  await expect(page.getByTestId("state-q3")).toHaveClass(/active/);
  await page.reload();
  await navigate(page, "Modelo AFD");
  await expect(page.getByTestId("simulation-result")).toHaveClass(/accepted/);
  await expect(page.locator(".history-list")).toContainText("ACEPTADA");
});

test("AFD inválido: R P ejecuta, rechaza en qerr y permite reiniciar", async ({ page }) => {
  await navigate(page, "Modelo AFD");
  await page.getByLabel("Cadena de eventos", { exact: true }).fill("R P");
  await page.getByRole("button", { name: "Ejecutar cadena", exact: true }).click();
  const result = page.getByTestId("simulation-result");
  await expect(result).toContainText("Cadena rechazada · Acceso denegado");
  await expect(result).toContainText("El procesamiento finalizó en qerr.");
  await expect(result).toHaveClass(/rejected/);
  await expect(result).toHaveCSS("border-left-color", "rgb(194, 24, 91)");
  await expect(page.getByTestId("state-qerr")).toBeVisible();
  await expect(page.getByTestId("state-qerr")).toHaveCSS("border-top-color", "rgb(194, 24, 91)");
  await expect(page.locator(".state-node.active")).toHaveCount(0);
  await expect(page.locator(".history-list")).toContainText("RECHAZADA");
  await page.getByRole("button", { name: "Reiniciar simulación" }).click();
  await expect(page.getByTestId("state-q0")).toHaveClass(/active/);
  await expect(result).not.toHaveClass(/rejected|accepted/);
  await expect(page.getByTestId("state-qerr")).toHaveCount(0);
});

test("AFD: entrada vacía deshabilita acciones y un símbolo extra pierde aceptación", async ({
  page,
}) => {
  await navigate(page, "Modelo AFD");
  await page.getByLabel("Cadena de eventos", { exact: true }).fill("");
  await expect(page.getByRole("button", { name: "Ejecutar cadena", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Paso", exact: true })).toBeDisabled();
  await page.getByLabel("Cadena de eventos", { exact: true }).fill("RMPX");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Paso", exact: true }).click();
  await expect(page.getByTestId("state-q3")).toHaveClass(/active/);
  await expect(page.getByTestId("simulation-result")).not.toHaveClass(/accepted/);
  await page.getByRole("button", { name: "Paso", exact: true }).click();
  await expect(page.getByTestId("simulation-result")).toHaveClass(/rejected/);
});
