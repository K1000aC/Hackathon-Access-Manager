import { test, expect, navigate, registerTeam } from "./fixtures";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
test("navegación compartida y sidebar desplegable en todas las pantallas", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("TRANSFORMA.");
  await expect(page.getByRole("button", { name: "Abrir menú lateral" })).toBeVisible();
  await page.getByRole("button", { name: "Abrir menú lateral" }).click();
  await expect(page.getByRole("dialog", { name: "Menú de navegación" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Abrir menú lateral" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await navigate(page, "Mi panel");
  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
  await navigate(page, "Registro");
  await expect(
    page.getByRole("heading", { name: "Registra tu equipo", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toHaveCount(0);
  await navigate(page, "Seguimiento");
  await expect(
    page.getByRole("heading", { name: "Centro de seguimiento", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toHaveCount(0);
  await navigate(page, "Modelo AFD");
  await expect(page.getByRole("heading", { name: "Simulador de acceso" })).toBeVisible();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(6);
});
test("registro compartido requiere sesión, valida campos y persiste después de recargar", async ({
  page,
}, testInfo) => {
  await registerTeam(page);
  await page.getByRole("button", { name: "Continuar al seguimiento" }).click();
  await expect(page.getByRole("heading", { name: "Centro de seguimiento" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Equipo QA", exact: true })).toBeVisible();
  await expect(page.getByText("Pendiente de asignación de asesor", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("hackaflow.teams.v2"))).toBeNull();
  await page.reload();
  await navigate(page, "Seguimiento");
  await expect(page.getByRole("heading", { name: "Equipo QA", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Aprobar etapa" })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("seguimiento.png"), fullPage: true });
  await navigate(page, "Registro");
  await expect(page.getByRole("heading", { name: "Tu equipo ya tiene acceso" })).toBeVisible();
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
  await navigate(page, "Seguimiento");
  await expect(
    page.getByRole("heading", { name: "Centro de seguimiento", exact: true }),
  ).toBeVisible();
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

test("dashboard: registro separado, logo, navegación lateral y sin desbordamiento", async ({
  page,
}, testInfo) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("TRANSFORMA.");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.getByText("HUB CENTRAL", { exact: true })).toBeVisible();
  await expect(page.getByText("64 EQUIPOS", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Un evento conectado" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Crecer con cada edición" })).toBeVisible();
  await expect(page.getByLabel("Nombre del equipo", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "HackaFlow · Inicio" }).locator("svg"),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("dashboard.png"), fullPage: true });
  await expect(page.getByRole("heading", { name: "Camila Suárez Cruz" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Lizeth Margarita Crisoto García" }),
  ).toBeVisible();
  const toggle = page.getByRole("button", { name: "Abrir menú lateral" });
  if (await toggle.isVisible()) await toggle.click();
  const lateral = page.getByRole("navigation", { name: "Navegación lateral" });
  await expect(lateral).toBeInViewport();
  await lateral.getByRole("button", { name: /Modelo AFD/ }).click();
  await expect(page.getByRole("heading", { name: "Simulador de acceso" })).toBeVisible();
  await navigate(page, "Inicio");
  await page.getByRole("button", { name: "Crear acceso de mi equipo", exact: false }).click();
  await expect(
    page.getByRole("heading", { name: "Registra tu equipo", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /ENTRA/ })).toHaveCount(0);
});

test("las tres vistas son diferentes antes y después de iniciar sesión y conservan el formulario", async ({
  page,
}, testInfo) => {
  await navigate(page, "Registro");
  await expect(page.getByRole("heading", { name: "Un pase. Tres hitos." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Visualizar el autómata" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("registro.png"), fullPage: true });
  await expect(page.getByText("REG / 001", { exact: true })).toHaveCount(0);
  await expect(page.getByText("WORKSPACE / 2025", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Generar acceso", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toHaveCount(0);
  await page.getByLabel("Nombre del equipo", { exact: true }).fill("   ");
  await page.getByLabel("Acepto el reglamento", { exact: false }).check();
  await page.getByRole("button", { name: "Generar acceso", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Escribe un nombre de equipo");
  await page.getByLabel("Nombre del equipo", { exact: true }).fill("Equipo QA");
  await page
    .getByRole("combobox", { name: "Categoría de participación", exact: true })
    .selectOption("Tecnología educativa");
  await page.getByLabel("Acepto el reglamento", { exact: false }).check();
  await page.getByRole("button", { name: "Generar acceso" }).click();
  await page.getByLabel("Correo", { exact: true }).fill("qa@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("Test-password-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByLabel("Nombre del equipo", { exact: true })).toHaveValue("Equipo QA");
  await expect(page.getByLabel("Líder del equipo", { exact: true })).toHaveValue("Liz QA");
  await expect(page.getByLabel("Correo de contacto", { exact: true })).toHaveValue(
    "qa@example.com",
  );
  await page.route(
    "**/rest/v1/rpc/register_event_team",
    (route) =>
      route.fulfill({ status: 503, json: { message: "Servicio temporalmente no disponible" } }),
    { times: 1 },
  );
  await page.getByLabel("Acepto el reglamento", { exact: false }).check();
  await page.getByRole("button", { name: "Generar acceso", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Servicio temporalmente no disponible");
  await expect(page.getByLabel("Nombre del equipo", { exact: true })).toHaveValue("Equipo QA");

  await page.getByLabel("Acepto el reglamento", { exact: false }).check();
  await page.getByRole("button", { name: "Generar acceso" }).click();
  await expect(page.getByRole("heading", { name: "Tu equipo ya tiene acceso" })).toBeVisible();
  await navigate(page, "Mi panel");
  await expect(page.getByRole("heading", { name: "Mi cuenta", exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Centro de seguimiento", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Filtrar equipos")).toHaveCount(0);
  await page.getByRole("button", { name: "Ir a Seguimiento", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Centro de seguimiento", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Filtrar equipos")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mi cuenta", exact: true })).toHaveCount(0);
});
