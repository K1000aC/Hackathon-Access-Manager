import { test, expect, navigate } from "./fixtures";

test("cada pestaña conserva una cuenta independiente y cierra por inactividad", async ({
  page,
}) => {
  await page.clock.install({ time: new Date() });
  await page.goto("/");
  await navigate(page, "Mi panel");
  await page.getByLabel("Correo", { exact: true }).fill("qa@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("Test-password-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("tablist")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => ({
        local: localStorage.length,
        session: sessionStorage.length,
      })),
    )
    .toMatchObject({ local: 0 });

  const secondTab = await page.context().newPage();
  const organizer = {
    id: "00000000-0000-4000-8000-000000000003",
    aud: "authenticated",
    role: "authenticated",
    email: "organizer@example.com",
    app_metadata: { provider: "email" },
    user_metadata: { display_name: "Organizador QA" },
    created_at: new Date().toISOString(),
  };
  const token = `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(
    JSON.stringify({ sub: organizer.id, exp: Math.floor(Date.now() / 1000) + 3600 }),
  ).toString("base64url")}.fake`;
  await secondTab.route("https://auth-qa.supabase.co/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/auth/v1/token")
      return route.fulfill({
        json: {
          access_token: token,
          refresh_token: "organizer-refresh",
          expires_in: 3600,
          token_type: "bearer",
          user: organizer,
        },
      });
    if (path === "/auth/v1/user") return route.fulfill({ json: organizer });
    if (path === "/rest/v1/profiles")
      return route.fulfill({
        json: {
          id: organizer.id,
          display_name: "Organizador QA",
          email: organizer.email,
          role: "organizer",
        },
      });
    if (path === "/rest/v1/event_teams" || path === "/rest/v1/submissions")
      return route.fulfill({ json: [] });
    return route.fallback();
  });
  await secondTab.goto("/");
  expect(
    await secondTab.evaluate(() =>
      Object.values(sessionStorage).some((value) => {
        try {
          return Boolean(JSON.parse(value).user?.id);
        } catch {
          return false;
        }
      }),
    ),
  ).toBe(false);
  await navigate(secondTab, "Mi panel");
  await secondTab.getByLabel("Correo", { exact: true }).fill(organizer.email);
  await secondTab.getByLabel("Contraseña", { exact: true }).fill("Test-password-123");
  await secondTab.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(secondTab.getByRole("tablist")).toBeVisible();
  await expect(secondTab.getByText("Organizador", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Estudiante", { exact: true }).first()).toBeVisible();

  const sessionUserIds = await Promise.all(
    [page, secondTab].map((tab) =>
      tab.evaluate(() => {
        for (const value of Object.values(sessionStorage)) {
          try {
            const userId = JSON.parse(value).user?.id;
            if (userId) return userId as string;
          } catch {
            continue;
          }
        }
        return null;
      }),
    ),
  );
  expect(sessionUserIds).toEqual([
    "00000000-0000-4000-8000-000000000001",
    organizer.id,
  ]);

  await page.bringToFront();
  await page.clock.fastForward(14 * 60 * 1000);
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(secondTab.getByRole("alertdialog")).toBeVisible();
  await secondTab.evaluate(() =>
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" })),
  );
  await expect(secondTab.getByRole("alertdialog")).toHaveCount(0);
  await page.clock.fastForward(60 * 1000);
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("cerró por inactividad");
  await expect(secondTab.getByRole("tablist")).toBeVisible();
});
