import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir, rename, chmod } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

import { planIdentities } from "./qa-identities.mjs";

const credentialsURL = new URL("../.local/qa-users.json", import.meta.url);
export function planAccounts() {
  const identities = planIdentities();
  return Array.from({ length: 15 }, (_, i) => {
    const role = i < 10 ? "student" : "advisor";
    return {
      ...identities[i],
      role,
      password: `Hf!${randomBytes(18).toString("base64url")}9aA`,
      id: null,
      ready: false,
    };
  });
}
export async function seedAccounts(client, batch, save) {
  // La API administrativa mantiene Auth, identidades y el trigger de profiles coherentes.
  const existing = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`No se pudieron consultar usuarios: ${error.message}`);
    for (const user of data.users) existing.set(user.email?.toLowerCase(), user);
    if (data.users.length < 200) break;
  }
  for (const account of batch.accounts) {
    let user = existing.get(account.email);
    if (
      user &&
      (user.app_metadata?.qa_seed !== batch.id || (account.id && account.id !== user.id))
    ) {
      throw new Error(
        `La cuenta ${account.email} ya existe y no pertenece a este lote. No se modificó.`,
      );
    }
    if (!user) {
      if (account.id)
        throw new Error(
          `La cuenta ${account.email} fue eliminada. No se recreará automáticamente.`,
        );
      const result = await client.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { display_name: account.display_name },
        app_metadata: { qa_seed: batch.id },
      });
      if (result.error)
        throw new Error(`No se pudo crear ${account.email}: ${result.error.message}`);
      user = result.data.user;
      if (!user) throw new Error("Supabase no devolvió el usuario creado.");
      account.id = user.id;
      await save(batch);
    }
    account.id = user.id;
    // El perfil lo crea handle_signup. No se reemplazan perfiles de otras cuentas.
    const result = await client
      .from("profiles")
      .update({ role: account.role })
      .eq("id", user.id)
      .select("id,role")
      .single();
    if (result.error)
      throw new Error(
        `Auth creado para ${account.email}, pero falta su rol: ${result.error.message}. Revisa la migración y reejecuta el script.`,
      );
    if (result.data.role !== account.role) throw new Error("El rol no coincide con el esperado.");
    account.ready = true;
    await save(batch);
  }
}
export async function saveBatch(batch) {
  await mkdir(new URL("../.local/", import.meta.url), { recursive: true, mode: 0o700 });
  const temporary = new URL("../.local/qa-users.json.tmp", import.meta.url);
  await writeFile(temporary, JSON.stringify(batch, null, 2) + "\n", { mode: 0o600 });
  await chmod(temporary, 0o600);
  await rename(temporary, credentialsURL);
}
async function main() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_ADMIN_KEY?.trim();
  if (!url || !key)
    throw new Error("Completa SUPABASE_URL y SUPABASE_ADMIN_KEY en backend/.env.qa.local.");
  if (key.startsWith("sb_publishable_"))
    throw new Error(
      "Este script requiere una clave administrativa secret o service_role, no la publishable.",
    );
  const projectURL = new URL(url).origin;
  if (
    !projectURL.startsWith("https://") &&
    !["localhost", "127.0.0.1"].includes(new URL(projectURL).hostname)
  )
    throw new Error("La conexión remota debe usar HTTPS.");
  let batch;
  try {
    batch = JSON.parse(await readFile(credentialsURL, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    batch = {
      id: randomUUID(),
      projectURL,
      createdAt: new Date().toISOString(),
      accounts: planAccounts(),
    };
  }
  if (batch.projectURL !== projectURL)
    throw new Error("El archivo de accesos pertenece a otro proyecto. No se modificará.");
  if (!Array.isArray(batch.accounts) || batch.accounts.length !== 15)
    throw new Error("El lote local no es válido.");
  // Guardar las contraseñas ANTES de crear usuarios permite retomar ejecuciones parciales.
  await saveBatch(batch);
  const client = createClient(projectURL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  await seedAccounts(client, batch, saveBatch);
  console.table(
    batch.accounts.map(({ display_name, email, role, ready }) => ({
      nombre: display_name,
      correo: email,
      rol: role,
      listo: ready,
    })),
  );
  console.log(`15 cuentas listas. Accesos y contraseñas: ${fileURLToPath(credentialsURL)}`);
  console.log("La verificación de correo de los registros normales no se ha modificado.");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`No se completó el lote: ${error.message}`);
    process.exitCode = 1;
  });
}
