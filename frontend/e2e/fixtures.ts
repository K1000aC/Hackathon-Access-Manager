import { test as base, expect, type Page } from "@playwright/test";
export const test = base.extend<{ runtimeErrors: string[] }>({
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
      expect(errors, "La interfaz no debe lanzar excepciones JavaScript").toEqual([]);
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
  await navigate(page, "Registro local");
  await page.getByLabel("Nombre del equipo", { exact: true }).fill(teamName);
  await page.getByLabel("Líder del equipo", { exact: true }).fill("Liz QA");
  await page.getByRole("combobox", { name: /^Integrantes/ }).selectOption("4");
  await page.getByLabel("Correo de contacto", { exact: true }).fill("qa@example.com");
  await page
    .getByRole("combobox", { name: /^Categoría de participación/ })
    .selectOption("Tecnología educativa");
  await page.getByRole("checkbox", { name: /Acepto el reglamento/ }).check();
  await page.getByRole("button", { name: "Guardar registro", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Registro guardado." })).toBeVisible();
}
