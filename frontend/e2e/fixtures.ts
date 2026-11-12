import { test as base, expect, type Page } from "@playwright/test";
const user = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "qa@example.com",
  app_metadata: { provider: "email" },
  user_metadata: { display_name: "Liz QA" },
  created_at: new Date().toISOString(),
};
const token = `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.fake`;
export const test = base.extend<{ runtimeErrors: string[]; sharedBackend: void }>({
  sharedBackend: [
    async ({ page }, use) => {
      const teams: Record<string, unknown>[] = [];
      await page.route("https://auth-qa.supabase.co/**", async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname;
        let data: unknown = {};
        let status = 200;
        if (path === "/auth/v1/token")
          data = {
            access_token: token,
            refresh_token: "test-refresh",
            expires_in: 3600,
            token_type: "bearer",
            user,
          };
        else if (path === "/auth/v1/user") data = user;
        else if (path === "/rest/v1/profiles")
          data = { id: user.id, display_name: "Liz QA", email: user.email, role: "student" };
        else if (path === "/rest/v1/event_teams") data = teams;
        else if (path === "/rest/v1/submissions") data = [];
        else if (path === "/rest/v1/rpc/register_event_team") {
          if (teams.length) {
            status = 400;
            data = { message: "La cuenta ya tiene un equipo." };
          } else {
            const values = request.postDataJSON();
            teams.push({
              id: "qa-team",
              owner_id: user.id,
              advisor_id: null,
              name: values.p_name,
              category: values.p_category,
              members: values.p_members,
              chain: "R",
              created_at: new Date().toISOString(),
              events: [
                {
                  symbol: "R",
                  at: new Date().toISOString(),
                  detail: "Registro confirmado",
                  actor: user.id,
                },
              ],
            });
            data = "qa-team";
          }
        }
        await route.fulfill({ status, json: data });
      });
      await use();
    },
    { auto: true },
  ],
  runtimeErrors: [
    async ({ page }, use, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      if (errors.length)
        await testInfo.attach("errores-javascript", {
          body: errors.join("\n"),
          contentType: "text/plain",
        });
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
export async function navigate(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Navegación principal" })
    .getByRole("button", { name, exact: true })
    .click();
}
export async function registerTeam(page: Page, teamName = "Equipo QA") {
  await navigate(page, "Mi panel");
  await page.getByLabel("Correo", { exact: true }).fill("qa@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("Test-password-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await navigate(page, "Registro");
  await expect(page.getByRole("heading", { name: "Registra tu equipo" })).toBeVisible();
  await page.getByLabel("Nombre", { exact: true }).fill(teamName);
  await page.getByLabel("Categoría", { exact: true }).fill("Tecnología educativa");
  await page.getByLabel("Integrantes", { exact: true }).fill("4");
  await page.getByRole("button", { name: "Guardar registro (R)", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tu equipo ya está registrado" })).toBeVisible();
}
