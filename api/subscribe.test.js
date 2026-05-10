/**
 * api/subscribe.js — Integration tests
 * Run: node api/subscribe.test.js
 */

import handler from "./subscribe.js";

// ============================================================
// TEST FRAMEWORK
// ============================================================

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    failures.push(testName);
    console.log(`  ✗ FAIL: ${testName}`);
  }
}

function assertEqual(actual, expected, testName) {
  const match = JSON.stringify(actual) === JSON.stringify(expected);
  if (!match) {
    console.log(`    Expected: ${JSON.stringify(expected)}`);
    console.log(`    Actual:   ${JSON.stringify(actual)}`);
  }
  assert(match, testName);
}

function describe(suiteName, fn) {
  console.log(`\n${suiteName}`);
  return fn();
}

// ============================================================
// MOCK HELPERS
// ============================================================

const mockReq = (method, body = {}) => ({ method, body });

const mockRes = () => {
  const r = { _status: null, _json: null };
  r.status = (code) => { r._status = code; return r; };
  r.json   = (data) => { r._json  = data; return r; };
  return r;
};

const mockFetch = (ok, status = 200) => async () => ({
  ok,
  status,
  json: async () => ({ message: "mock" }),
});

const mockFetchThrow = () => async () => { throw new Error("network error"); };

function withEnv(vars, fn) {
  const saved = {};
  for (const k of Object.keys(vars)) {
    saved[k] = process.env[k];
    process.env[k] = vars[k];
  }
  const result = fn();
  for (const k of Object.keys(saved)) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  return result;
}

const VALID_ENV = { KIT_API_KEY: "test-key", KIT_FORM_ID: "test-form" };

// ============================================================
// TESTS
// ============================================================

await describe("METHOD VALIDATION", async () => {
  const reqGet = mockReq("GET");
  const res = mockRes();
  await handler(reqGet, res);
  assertEqual(res._status, 405, "GET → 405");
  assertEqual(res._json, { error: "Method not allowed" }, "GET → Method not allowed");

  const reqDelete = mockReq("DELETE");
  const res2 = mockRes();
  await handler(reqDelete, res2);
  assertEqual(res2._status, 405, "DELETE → 405");
});

await describe("EMAIL VALIDATION", async () => {
  const cases = [
    [undefined, "email absent"],
    ["",        "email vide"],
    ["nodot",   "email sans @"],
    ["test@",   "email sans ."],
    ["@nodot",  "email sans . après @"],
  ];

  for (const [email, label] of cases) {
    await withEnv(VALID_ENV, async () => {
      global.fetch = mockFetch(true, 200);
      const req = mockReq("POST", { email });
      const res = mockRes();
      await handler(req, res);
      assertEqual(res._status, 400, `${label} → 400`);
      assertEqual(res._json, { error: "Email invalide" }, `${label} → message`);
    });
  }
});

await describe("CONFIGURATION SERVEUR", async () => {
  global.fetch = mockFetch(true, 200);

  await withEnv({ KIT_API_KEY: "", KIT_FORM_ID: "x" }, async () => {
    const res = mockRes();
    await handler(mockReq("POST", { email: "a@b.c" }), res);
    assertEqual(res._status, 500, "KIT_API_KEY manquant → 500");
    assertEqual(res._json, { error: "Configuration serveur manquante" }, "KIT_API_KEY → message");
  });

  await withEnv({ KIT_API_KEY: "key", KIT_FORM_ID: "" }, async () => {
    const res = mockRes();
    await handler(mockReq("POST", { email: "a@b.c" }), res);
    assertEqual(res._status, 500, "KIT_FORM_ID manquant → 500");
    assertEqual(res._json, { error: "Configuration serveur manquante" }, "KIT_FORM_ID → message");
  });
});

await describe("KIT API — CAS NOMINAUX", async () => {
  for (const kitStatus of [200, 201]) {
    await withEnv(VALID_ENV, async () => {
      global.fetch = mockFetch(true, kitStatus);
      const res = mockRes();
      await handler(mockReq("POST", { email: "user@example.com" }), res);
      assertEqual(res._status, 200, `Kit ${kitStatus} ok → réponse 200`);
      assertEqual(res._json, { success: true }, `Kit ${kitStatus} ok → success: true`);
    });
  }
});

await describe("KIT API — ERREURS", async () => {
  await withEnv(VALID_ENV, async () => {
    global.fetch = mockFetch(false, 422);
    const res = mockRes();
    await handler(mockReq("POST", { email: "user@example.com" }), res);
    assertEqual(res._status, 422, "Kit 422 non-ok → proxy 422");
    assertEqual(res._json, { error: "Erreur Kit API" }, "Kit 422 → message");
  });

  await withEnv(VALID_ENV, async () => {
    global.fetch = mockFetchThrow();
    const res = mockRes();
    await handler(mockReq("POST", { email: "user@example.com" }), res);
    assertEqual(res._status, 500, "fetch throw → 500");
    assertEqual(res._json, { error: "Erreur serveur" }, "fetch throw → message");
  });
});

// ============================================================
// RESULTS
// ============================================================

console.log("\n" + "=".repeat(50));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log("\nFAILURES:");
  failures.forEach(f => console.log(`  - ${f}`));
}
console.log("=".repeat(50));

process.exit(failed > 0 ? 1 : 0);
