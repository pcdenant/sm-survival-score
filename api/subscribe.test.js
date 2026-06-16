/**
 * api/subscribe.js — Integration tests (Ghost Admin API)
 * Run: node api/subscribe.test.js
 */

import handler, { createGhostToken } from "./subscribe.js";

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

const mockFetch = (status, body = { message: "mock" }) => async () => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
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

const VALID_ENV = {
  GHOST_ADMIN_API_KEY: "6645e4d67c0e5e4e3cc4a9c2:aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899",
  GHOST_URL: "https://example.ghost.io",
};

// ============================================================
// TESTS
// ============================================================

await describe("METHOD VALIDATION", async () => {
  const res = mockRes();
  await handler(mockReq("GET"), res);
  assertEqual(res._status, 405, "GET → 405");
  assertEqual(res._json, { error: "Méthode non autorisée" }, "GET → message");

  const res2 = mockRes();
  await handler(mockReq("DELETE"), res2);
  assertEqual(res2._status, 405, "DELETE → 405");
});

await describe("EMAIL VALIDATION", async () => {
  const cases = [
    [undefined, "email absent"],
    ["",        "email vide"],
    ["nodot",   "email sans @"],
  ];

  for (const [email, label] of cases) {
    await withEnv(VALID_ENV, async () => {
      global.fetch = mockFetch(201);
      const res = mockRes();
      await handler(mockReq("POST", { email }), res);
      assertEqual(res._status, 400, `${label} → 400`);
      assertEqual(res._json, { error: "Email invalide" }, `${label} → message`);
    });
  }
});

await describe("CONFIGURATION SERVEUR", async () => {
  global.fetch = mockFetch(201);

  await withEnv({ GHOST_ADMIN_API_KEY: "", GHOST_URL: "https://example.ghost.io" }, async () => {
    const res = mockRes();
    await handler(mockReq("POST", { email: "a@b.c" }), res);
    assertEqual(res._status, 500, "GHOST_ADMIN_API_KEY manquant → 500");
    assertEqual(res._json, { error: "Configuration serveur manquante" }, "GHOST_ADMIN_API_KEY → message");
  });

  await withEnv({ GHOST_ADMIN_API_KEY: "id:secret", GHOST_URL: "" }, async () => {
    const res = mockRes();
    await handler(mockReq("POST", { email: "a@b.c" }), res);
    assertEqual(res._status, 500, "GHOST_URL manquant → 500");
    assertEqual(res._json, { error: "Configuration serveur manquante" }, "GHOST_URL → message");
  });
});

await describe("GHOST API — CAS NOMINAUX", async () => {
  await withEnv(VALID_ENV, async () => {
    global.fetch = mockFetch(201);
    const res = mockRes();
    await handler(mockReq("POST", { email: "user@example.com" }), res);
    assertEqual(res._status, 200, "Ghost 201 → réponse 200");
    assertEqual(res._json, { success: true }, "Ghost 201 → success: true");
  });

  // 409 = already a member — must also be treated as success
  await withEnv(VALID_ENV, async () => {
    global.fetch = mockFetch(409);
    const res = mockRes();
    await handler(mockReq("POST", { email: "existing@example.com" }), res);
    assertEqual(res._status, 200, "Ghost 409 (membre existant) → réponse 200");
    assertEqual(res._json, { success: true }, "Ghost 409 → success: true");
  });

  // 422 avec "already exists" dans context (comportement réel de Ghost — le message reste générique) → succès
  await withEnv(VALID_ENV, async () => {
    global.fetch = mockFetch(422, {
      errors: [
        {
          message: "Validation error, cannot save member.",
          context: "Member already exists. Attempting to add member with existing email address",
          type: "ValidationError",
        },
      ],
    });
    const res = mockRes();
    await handler(mockReq("POST", { email: "existing@example.com" }), res);
    assertEqual(res._status, 200, "Ghost 422 (membre existant) → réponse 200");
    assertEqual(res._json, { success: true }, "Ghost 422 membre existant → success: true");
  });
});

await describe("GHOST API — ERREURS", async () => {
  await withEnv(VALID_ENV, async () => {
    global.fetch = mockFetch(422, {
      errors: [{ message: "Invalid email address", type: "ValidationError" }],
    });
    const res = mockRes();
    await handler(mockReq("POST", { email: "user@example.com" }), res);
    assertEqual(res._status, 422, "Ghost 422 (erreur générique) → proxy 422");
    assertEqual(res._json, { error: "Erreur Ghost API" }, "Ghost 422 générique → message");
  });

  await withEnv(VALID_ENV, async () => {
    global.fetch = mockFetchThrow();
    const res = mockRes();
    await handler(mockReq("POST", { email: "user@example.com" }), res);
    assertEqual(res._status, 500, "fetch throw → 500");
    assertEqual(res._json, { error: "Erreur serveur" }, "fetch throw → message");
  });
});

await describe("createGhostToken", async () => {
  const key = "6645e4d67c0e5e4e3cc4a9c2:aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899";
  const token = createGhostToken(key);

  const parts = token.split(".");
  assert(parts.length === 3, "token a 3 parties (header.payload.sig)");

  const headerJson = JSON.parse(Buffer.from(parts[0], "base64url").toString());
  assertEqual(headerJson.alg, "HS256", "header.alg = HS256");
  assertEqual(headerJson.kid, "6645e4d67c0e5e4e3cc4a9c2", "header.kid = key id");

  const payloadJson = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  assertEqual(payloadJson.aud, "/ghost/api/admin/", "payload.aud = /ghost/api/admin/");
  assert(typeof payloadJson.iat === "number" && payloadJson.iat > 0, "payload.iat est un timestamp");
  assert(payloadJson.exp === payloadJson.iat + 300, "payload.exp = iat + 300s");
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
