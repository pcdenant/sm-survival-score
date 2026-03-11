// /api/subscribe.js
// Serverless function — works on Vercel (default) and Netlify (with adapter)
// The Kit API key is stored as an environment variable on the hosting platform.
// The client never sees it.

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email || !email.includes("@") || !email.includes(".")) {
    return res.status(400).json({ error: "Email invalide" });
  }

  const API_KEY = process.env.KIT_API_KEY;
  const FORM_ID = process.env.KIT_FORM_ID;

  if (!API_KEY || !FORM_ID) {
    console.error("Missing KIT_API_KEY or KIT_FORM_ID environment variables");
    return res.status(500).json({ error: "Configuration serveur manquante" });
  }

  try {
    const response = await fetch(
      `https://api.kit.com/v4/forms/${FORM_ID}/subscribers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          email_address: email,
        }),
      }
    );

    // Kit v4 may return 200, 201 (with body) or 204 (empty)
    if (response.ok) {
      return res.status(200).json({ success: true });
    }

    // Error — try to parse response for logging
    let data;
    try {
      data = await response.json();
    } catch {
      data = { status: response.status, statusText: response.statusText };
    }
    console.error("Kit API error:", data);
    return res.status(response.status).json({ error: "Erreur Kit API" });
  } catch (error) {
    console.error("Subscribe error:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
