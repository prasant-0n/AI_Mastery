import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/application/password-hashing.js";

test("password hashing is salted and verifiable", async () => {
  const password = "correct horse battery staple";
  const first = await hashPassword(password);
  const second = await hashPassword(password);

  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("wrong password", first), false);
});

test("invalid encoded hashes fail closed", async () => {
  assert.equal(await verifyPassword("password", "invalid"), false);
  assert.equal(await verifyPassword("password", "scrypt$1$bad$bad"), false);
});

test("short passwords are rejected", async () => {
  await assert.rejects(
    () => hashPassword("short"),
    /at least 8 characters/,
  );
});
