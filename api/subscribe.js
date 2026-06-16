import { createHmac } from "crypto";

export function createGhostToken(apiKey) {
  const [id, secret] = apiKey.split(":");
  const header = Buffer.from(JSON.stringify({ alg: "HS256", kid: id, typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: "/ghost/api/admin/" })).toString("base64url");
  const sig = createHmac("sha256", Buffer.from(secret, "hex")).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "Email invalide" });

  const { GHOST_ADMIN_API_KEY, GHOST_URL } = process.env;
  if (!GHOST_ADMIN_API_KEY || !GHOST_URL) {
    console.error("Missing GHOST_ADMIN_API_KEY or GHOST_URL");
    return res.status(500).json({ error: "Configuration serveur manquante" });
  }

  try {
    const token = createGhostToken(GHOST_ADMIN_API_KEY);
    const response = await fetch(`${GHOST_URL}/ghost/api/admin/members/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Ghost ${token}`,
      },
      body: JSON.stringify({ members: [{ email, labels: [{ name: "SM Score" }] }] }),
    });

    // 201 = created, 409 = already a member (older Ghost versions) → success
    if (response.status === 201 || response.status === 409) return res.status(200).json({ success: true });

    const err = await response.json().catch(() => ({}));

    // Ghost returns 422 with this message when the email is already a member — not a real error.
    const isDuplicateMember = err?.errors?.some((e) => /already exists/i.test(e?.message ?? ""));
    if (response.status === 422 && isDuplicateMember) return res.status(200).json({ success: true });

    console.error("Ghost API error:", response.status, err);
    return res.status(response.status).json({ error: "Erreur Ghost API" });
  } catch (err) {
    console.error("Subscribe error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
