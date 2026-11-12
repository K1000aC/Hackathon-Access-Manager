import { test } from "node:test";
import assert from "node:assert/strict";
import { planAccounts, seedAccounts } from "../scripts/seed-qa-users.mjs";
function fakeClient(users = []) {
  const roles = new Map();
  const created = [];
  return {
    users,
    roles,
    created,
    auth: {
      admin: {
        listUsers: async () => ({ data: { users }, error: null }),
        createUser: async (options) => {
          const user = {
            id: `id-${created.length}`,
            email: options.email,
            app_metadata: options.app_metadata,
          };
          users.push(user);
          created.push(options);
          return { data: { user }, error: null };
        },
      },
    },
    from: () => ({
      update: ({ role }) => ({
        eq: (_column, id) => ({
          select: () => ({
            single: async () => {
              roles.set(id, role);
              return { data: { id, role }, error: null };
            },
          }),
        }),
      }),
    }),
  };
}
test("lote de 15 cuentas con contraseñas distintas y sin organizadores adicionales", () => {
  const accounts = planAccounts();
  assert.equal(accounts.length, 15);
  assert.equal(accounts.filter((a) => a.role === "student").length, 10);
  assert.equal(accounts.filter((a) => a.role === "advisor").length, 5);
  assert.equal(new Set(accounts.map((a) => a.email)).size, 15);
  assert.equal(new Set(accounts.map((a) => a.password)).size, 15);
  assert.ok(accounts.every((a) => a.password.length >= 24 && a.email.endsWith("@example.com")));
});
test("usa confirmación individual, aplica roles y reejecuta sin duplicar ni cambiar contraseñas", async () => {
  const client = fakeClient();
  const batch = { id: "batch", accounts: planAccounts() };
  let saves = 0;
  await seedAccounts(client, batch, async () => saves++);
  assert.equal(client.created.length, 15);
  assert.equal(client.roles.size, 15);
  assert.ok(client.created.every((options) => options.email_confirm === true));
  assert.ok(batch.accounts.every((a) => a.ready));
  assert.equal(saves, 30);
  await seedAccounts(client, batch, async () => {});
  assert.equal(client.created.length, 15);
});
test("no modifica una cuenta existente ajena al lote", async () => {
  const batch = { id: "batch", accounts: planAccounts() };
  const client = fakeClient([
    { id: "real-user", email: batch.accounts[0].email, app_metadata: {} },
  ]);
  await assert.rejects(
    seedAccounts(client, batch, async () => {}),
    /no pertenece a este lote/,
  );
  assert.equal(client.created.length, 0);
  assert.equal(client.roles.size, 0);
});
