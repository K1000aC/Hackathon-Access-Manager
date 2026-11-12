import { test } from "node:test";
import assert from "node:assert/strict";
import { planAccounts } from "../scripts/seed-qa-users.mjs";
import { renameAccounts } from "../scripts/rename-qa-users.mjs";
function fixture() {
  const batch = { id: "batch", accounts: planAccounts().map((a, i) => ({ ...a, id: `qa-${i}` })) };
  const users = batch.accounts.map((a) => ({
    id: a.id,
    email: a.email,
    app_metadata: { qa_seed: "batch" },
    user_metadata: { keep: true },
  }));
  const updates = [];
  const profiles = [];
  const client = {
    auth: {
      admin: {
        listUsers: async () => ({ data: { users } }),
        updateUserById: async (id, values) => {
          updates.push({ id, values });
          Object.assign(
            users.find((u) => u.id === id),
            { email: values.email, user_metadata: values.user_metadata },
          );
          return { error: null };
        },
      },
    },
    from: () => ({
      update: (values) => ({
        eq: (_key, id) => ({
          select: () => ({
            single: async () => {
              profiles.push(values);
              return { data: { ...values, role: batch.accounts.find((a) => a.id === id).role } };
            },
          }),
        }),
      }),
    }),
  };
  return { batch, users, client, updates, profiles };
}
test("renombra solo el lote, sincroniza perfiles y conserva contraseñas, UUID y roles", async () => {
  const { batch, client, updates, profiles } = fixture();
  const originals = batch.accounts.map((a) => ({ id: a.id, password: a.password, role: a.role }));
  await renameAccounts(client, batch, async () => {});
  assert.equal(updates.length, 15);
  assert.equal(profiles.length, 15);
  assert.equal(new Set(batch.accounts.map((a) => a.email)).size, 15);
  for (let i = 0; i < 15; i++) {
    assert.ok(batch.accounts[i].display_name.endsWith(" QA"));
    assert.ok(batch.accounts[i].email.endsWith("@example.com"));
    for (const key of ["id", "password", "role"])
      assert.equal(batch.accounts[i][key], originals[i][key]);
    assert.equal(updates[i].values.password, undefined);
    assert.equal(profiles[i].role, undefined);
    assert.equal(updates[i].values.user_metadata.keep, true);
  }
  const emails = batch.accounts.map((a) => a.email);
  await renameAccounts(client, batch, async () => {});
  assert.deepEqual(
    batch.accounts.map((a) => a.email),
    emails,
  );
});
test("bloquea el lote completo antes de tocar una cuenta ajena", async () => {
  const { batch, client, users, updates } = fixture();
  users[14].app_metadata = {};
  await assert.rejects(
    renameAccounts(client, batch, async () => {}),
    /no pertenece/,
  );
  assert.equal(updates.length, 0);
});
