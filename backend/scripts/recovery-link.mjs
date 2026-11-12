// Herramienta administrativa local: genera un enlace privado sin enviar correo.
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
const email = process.argv[2];
if (!email || !process.env.SUPABASE_URL || !process.env.SUPABASE_ADMIN_KEY) {
  console.error(
    "Uso: node --env-file=backend/.env.qa.local backend/scripts/recovery-link.mjs correo",
  );
  process.exit(1);
}
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ADMIN_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, error } = await client.auth.admin.generateLink({
  type: "recovery",
  email,
  options: { redirectTo: "https://hackathon-access-manager.vercel.app/?flow=recovery" },
});
if (error) {
  console.error(`No se pudo generar el enlace (${error.code || error.status || "auth"}).`);
  process.exit(1);
}
const link = data.properties.action_link;
if (new URL(link).origin !== new URL(process.env.SUPABASE_URL).origin)
  throw new Error("Origen inesperado.");
const escaped = link.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
await mkdir(new URL("../.local/", import.meta.url), { recursive: true, mode: 0o700 });
await writeFile(
  new URL("../.local/recover-account.html", import.meta.url),
  `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Recuperación privada de HackaFlow</title><body><h1>Elige tu nueva contraseña</h1><p>Enlace privado de un solo uso. No lo compartas.</p><a href="${escaped}" rel="noreferrer">Abrir recuperación de HackaFlow</a></body></html>`,
  { mode: 0o600 },
);
console.log(
  "Enlace privado guardado en backend/.local/recover-account.html. No se envió correo ni se cambió la contraseña.",
);
