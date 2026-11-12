import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { planIdentities } from "./qa-identities.mjs";
import { saveBatch } from "./seed-qa-users.mjs";
export async function renameAccounts(client, batch, save) {
  if (batch.accounts.length !== 15 || batch.accounts.some((a) => !a.id))
    throw new Error("Se requiere el lote original de 15 cuentas con sus identificadores.");
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error("No se pudo consultar Auth.");
    users.push(...data.users);
    if (data.users.length < 200) break;
  }
  // Preparar y guardar el plan antes de escribir permite retomar una interrupción sin volver a sortear.
  if (!batch.identityPlan) {
    const identities = planIdentities(15, new Set(users.map((u) => u.email?.toLowerCase())));
    batch.identityPlan = batch.accounts.map((a, i) => ({
      id: a.id,
      previousEmail: a.email,
      ...identities[i],
    }));
  }
  if (batch.identityPlan.length !== 15 || new Set(batch.identityPlan.map((p) => p.id)).size !== 15)
    throw new Error("Plan de identidades inválido.");
  // Verificar TODO el lote antes de modificar la primera cuenta.
  for (const account of batch.accounts) {
    const plan = batch.identityPlan.find((p) => p.id === account.id);
    const user = users.find((u) => u.id === account.id);
    if (
      !plan ||
      !user ||
      user.app_metadata?.qa_seed !== batch.id ||
      ![plan.previousEmail, plan.email].includes(user.email)
    )
      throw new Error(
        "Una cuenta no pertenece al lote original o cambió fuera del plan. No se continuará.",
      );
    if (!plan.email.endsWith("@example.com") || !plan.display_name.endsWith(" QA"))
      throw new Error("La identidad debe ser ficticia y llevar QA.");
    if (users.some((u) => u.email?.toLowerCase() === plan.email && u.id !== account.id))
      throw new Error("Hay una colisión de correos. No se continuará.");
  }
  await save(batch);
  for (const account of batch.accounts) {
    const plan = batch.identityPlan.find((p) => p.id === account.id);
    const user = users.find((u) => u.id === account.id);
    const { error } = await client.auth.admin.updateUserById(account.id, {
      email: plan.email,
      email_confirm: true,
      user_metadata: { ...user.user_metadata, display_name: plan.display_name },
    });
    if (error) throw new Error(`No se pudo actualizar Auth de la cuenta QA ${account.id}.`);
    // El trigger inicial de signup no sincroniza posteriores cambios; actualizar también profiles.
    const result = await client
      .from("profiles")
      .update({ email: plan.email, display_name: plan.display_name })
      .eq("id", account.id)
      .select("id,email,display_name,role")
      .single();
    if (result.error)
      throw new Error(
        "Auth se actualizó, pero falta sincronizar el perfil. Reejecuta este script para retomar el plan.",
      );
    if (result.data.email !== plan.email || result.data.display_name !== plan.display_name)
      throw new Error("El perfil no coincide con la identidad esperada.");
    account.email = plan.email;
    account.display_name = plan.display_name;
    account.role = result.data.role;
    account.ready = true;
    await save(batch);
  }
}
async function main() {
  const batch = JSON.parse(
    await readFile(new URL("../.local/qa-users.json", import.meta.url), "utf8"),
  );
  const url = process.env.SUPABASE_URL;
  if (!url || !process.env.SUPABASE_ADMIN_KEY || new URL(url).origin !== batch.projectURL)
    throw new Error("Configura el mismo proyecto del lote original.");
  const client = createClient(url, process.env.SUPABASE_ADMIN_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await renameAccounts(client, batch, saveBatch);
  console.table(
    batch.accounts.map(({ display_name, email, role }) => ({
      nombre: display_name,
      correo: email,
      rol: role,
    })),
  );
  console.log(
    "15 identidades ficticias actualizadas. Se conservaron los identificadores, las contraseñas y los roles. Accesos actualizados en backend/.local/qa-users.json (privado).",
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
