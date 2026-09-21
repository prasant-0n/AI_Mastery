import test from "node:test";
import assert from "node:assert/strict";
import { parsePagination, parseTaskStatus, requireNonEmptyString } from "../src/application/request-validation.js";

test("requires non-empty strings", () => {
  assert.equal(requireNonEmptyString("  hello  ", "name"), "hello");
  assert.throws(
    () => requireNonEmptyString("   ", "name"),
    /name is required/,
  );
});

test("accepts only known task statuses", () => {
  assert.equal(parseTaskStatus("QUEUED"), "QUEUED");
  assert.throws(
    () => parseTaskStatus("UNKNOWN"),
    /Invalid task status/,
  );
});

test("validates pagination bounds", () => {
  assert.deepEqual(
    parsePagination(new URLSearchParams("limit=50&offset=10")),
    { limit: 50, offset: 10 },
  );

  assert.throws(
    () => parsePagination(new URLSearchParams("limit=101")),
    /limit must be between 1 and 100/,
  );

  assert.throws(
    () => parsePagination(new URLSearchParams("offset=-1")),
    /offset must be non-negative/,
  );
});
