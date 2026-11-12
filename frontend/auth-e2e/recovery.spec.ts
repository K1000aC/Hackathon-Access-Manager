import { test, expect } from "@playwright/test";
const id = "00000000-0000-4000-8000-000000000001";
const user = {
  id,
  aud: "authenticated",
  role: "authenticated",
  email: "qa@example.com",
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: "email" },
  user_metadata: { display_name: "Persona QA" },
  identities: [],
  created_at: new Date().toISOString(),
};
const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated", aud: "authenticated" })).toString("base64url")}.test-signature`;
const session = {
  access_token: token,
  refresh_token: "fake-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  user,
};
test("recuperación no se pierde en Inicio; guardar permite entrar con contraseña nueva", async ({
  page,
}) => {
  let password = "Old-password-123";
  let updates = 0;
  await page.route("https://auth-qa.supabase.co/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    let data: unknown = {};
    let status = 200;
    if (url.pathname === "/auth/v1/user") {
      if (request.method() === "PUT") {
        password = request.postDataJSON().password;
        updates++;
      }
      data = user;
    } else if (url.pathname === "/auth/v1/token") {
      if (request.postDataJSON().password === password) data = session;
      else {
        status = 400;
        data = { code: "invalid_credentials", msg: "Invalid login credentials" };
      }
    } else if (url.pathname === "/rest/v1/profiles")
      data = { id, display_name: "Persona QA", role: "student", email: "qa@example.com" };
    else if (url.pathname.startsWith("/rest/")) data = [];
    await route.fulfill({ status, json: data });
  });
  await page.goto(
    `/?flow=recovery#access_token=${token}&refresh_token=fake-refresh-token&expires_in=3600&token_type=bearer&type=recovery`,
  );
  await expect(page.getByRole("heading", { name: "Establecer nueva contraseña" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hola, Persona QA" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Establecer nueva contraseña" })).toBeVisible();
  await page.getByLabel("Nueva contraseña", { exact: true }).fill("New-password-456");
  await page.getByRole("button", { name: "Guardar contraseña", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
  expect(updates).toBe(1);
  await page.getByLabel("Correo", { exact: true }).fill("qa@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("Old-password-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Correo o contraseña incorrectos");
  await page.getByLabel("Contraseña", { exact: true }).fill("New-password-456");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hola, Persona QA" })).toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
  await page.getByLabel("Correo", { exact: true }).fill("qa@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("New-password-456");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hola, Persona QA" })).toBeVisible();
});
test("un enlace expirado muestra acceso y no abre el panel", async ({ page }) => {
  await page.goto("/?flow=recovery#error=access_denied&error_code=otp_expired&type=recovery");
  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(/expiró|no es válido/);
  await expect(page.getByRole("heading", { name: "Establecer nueva contraseña" })).toHaveCount(0);
});
