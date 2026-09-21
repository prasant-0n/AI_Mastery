import test from "node:test";
import assert from "node:assert/strict";
import { TokenService } from "../src/application/token-service.js";

const secret = "0123456789abcdef0123456789abcdef";

test("issues and verifies access tokens", () => {
  const tokens = new TokenService(secret, 900);

  const token = tokens.issue({
    userId: "user-1",
    organizationId: "org-1",
  });

  const claims = tokens.verify(token);

  assert.equal(claims.userId, "user-1");
  assert.equal(claims.organizationId, "org-1");
  assert.ok(claims.expiresAt > Math.floor(Date.now() / 1000));
});

test("tampered tokens are rejected", () => {
  const tokens = new TokenService(secret);
  const token = tokens.issue({
    userId: "user-1",
    organizationId: "org-1",
  });

  const [payload, signature] = token.split(".");
  assert.ok(payload);
  assert.ok(signature);

  assert.throws(
    () => tokens.verify(`${payload}.${signature.slice(0, -1)}x`),
    /Invalid access token/,
  );
});

test("expired tokens are rejected", () => {
  const tokens = new TokenService(secret, -1);

  const token = tokens.issue({
    userId: "user-1",
    organizationId: "org-1",
  });

  assert.throws(
    () => tokens.verify(token),
    /Expired or invalid access token/,
  );
});
