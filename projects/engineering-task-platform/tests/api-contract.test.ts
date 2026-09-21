import test from "node:test";
import assert from "node:assert/strict";
import { failure, success } from "../src/http/api-response.js";
import { createRequestContext } from "../src/http/request-context.js";
import { setSecurityHeaders } from "../src/http/security-headers.js";

class FakeResponse {
  private readonly headers = new Map<string, string>();
  public setHeader(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value);
  }
  public get(name: string): string | undefined {
    return this.headers.get(name.toLowerCase());
  }
}

test("success responses contain data and request correlation", () => {
  assert.deepEqual(success({ id: "task-1" }, "req-1"), {
    data: { id: "task-1" },
    meta: { requestId: "req-1" },
  });
});

test("error responses contain stable code and request correlation", () => {
  assert.deepEqual(failure("Not found", "NOT_FOUND", "req-2"), {
    error: "Not found",
    code: "NOT_FOUND",
    meta: { requestId: "req-2" },
  });
});

test("security headers are applied", () => {
  const response = new FakeResponse();
  setSecurityHeaders(response as never);

  assert.equal(response.get("x-content-type-options"), "nosniff");
  assert.equal(response.get("x-frame-options"), "DENY");
  assert.equal(response.get("referrer-policy"), "no-referrer");
  assert.equal(response.get("cache-control"), "no-store");
});

test("request context preserves bounded incoming request ids", () => {
  const context = createRequestContext({
    headers: { "x-request-id": "client-request-1" },
  } as never);

  assert.equal(context.requestId, "client-request-1");
});
