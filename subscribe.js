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
      `https://api.convertkit.com/v3/forms/${FORM_ID}/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: API_KEY,
          email: email,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Kit API error:", data);
      return res.status(response.status).json({ error: "Erreur Kit API" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
