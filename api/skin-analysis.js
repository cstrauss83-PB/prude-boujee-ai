// api/skin-analysis.js
// CRITICAL: Disable Vercel's default body parser — base64 images are large
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  // ── CORS headers on EVERY response, including errors ──────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  // ── Preflight — must return 200 immediately, no further processing ─────────
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ── Only allow POST ────────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ── Parse body ─────────────────────────────────────────────────────────
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    const { imageBase64 } = body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Strip data URI prefix if the client accidentally included it
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    // ── Call OpenAI GPT-4o Vision ──────────────────────────────────────────
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content:
              "You are an expert Korean skincare consultant with 15 years of experience. " +
              "Analyze face photos and return ONLY valid JSON — no markdown, no backticks, no preamble. " +
              "Be specific, warm, and professional.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this face photo carefully and return ONLY this JSON structure (fill in all fields):

{
  "skinType": "e.g. Combination / Oily / Dry / Normal / Sensitive",
  "hydrationLevel": "e.g. Well Hydrated / Moderately Dehydrated / Very Dehydrated",
  "textureScore": "e.g. Smooth / Slightly Uneven / Rough",
  "overallHealth": "e.g. Excellent / Good / Fair / Needs Attention",
  "concerns": ["list", "of", "concerns"],
  "analysisText": "2-3 sentence friendly summary of their skin",
  "routine": [
    {"step": 1, "name": "Step name", "why": "Why this step matters for their skin"}
  ],
  "products": [
    {"brand": "Brand name", "name": "Product name", "why": "Why this product suits their skin"}
  ],
  "proTips": ["tip 1", "tip 2", "tip 3"]
}

Return 4-6 routine steps and 3-4 product recommendations. Focus on Korean skincare where appropriate.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${cleanBase64}`,
                  detail: "low", // "low" = cheaper + faster; still sufficient for skin analysis
                },
              },
            ],
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI error:", openaiRes.status, errText);
      return res.status(502).json({
        error: `OpenAI returned ${openaiRes.status}`,
        detail: errText.slice(0, 200),
      });
    }

    const data = await openaiRes.json();
    const aiText = data?.choices?.[0]?.message?.content || "{}";

    // ── Parse OpenAI response — strip markdown fences if present ──────────
    let parsed;
    try {
      const clean = aiText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      parsed = JSON.parse(clean);
    } catch {
      // Fallback: return raw text so the widget can still show something
      parsed = {
        analysisText: aiText,
        skinType: "Analysis complete",
        hydrationLevel: "See details below",
        textureScore: "See details below",
        overallHealth: "See details below",
        concerns: [],
        routine: [],
        products: [],
        proTips: [],
      };
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Skin analysis error:", err);
    return res.status(500).json({ error: "Skin analysis failed. Please try again." });
  }
}
