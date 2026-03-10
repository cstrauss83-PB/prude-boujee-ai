// api/skin-analysis.js
export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req, res) {
  // CORS on every response
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); }
      catch { return res.status(400).json({ error: "Invalid JSON body" }); }
    }

    const { imageBase64 } = body || {};
    if (!imageBase64) return res.status(400).json({ error: "No image provided" });

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z+]+;base64,/, "");

    // gpt-4o-mini: full vision support, 10x higher rate limits than gpt-4o, ~20x cheaper
    const payload = {
      model: "gpt-4o-mini",
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You are an expert Korean skincare consultant with 15 years of experience. " +
            "Analyze face photos and return ONLY valid JSON — no markdown, no backticks, no extra text. " +
            "Be specific, warm, and professional.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this face photo and return ONLY this exact JSON structure with all fields filled in:

{
  "skinType": "e.g. Combination / Oily / Dry / Normal / Sensitive",
  "hydrationLevel": "e.g. Well Hydrated / Moderately Dehydrated / Very Dehydrated",
  "textureScore": "e.g. Smooth / Slightly Uneven / Rough",
  "overallHealth": "e.g. Excellent / Good / Fair / Needs Attention",
  "concerns": ["list", "of", "visible", "concerns"],
  "analysisText": "2-3 warm, specific sentences summarising their skin",
  "routine": [
    {"step": 1, "name": "Step name", "why": "Why this step helps their specific skin"}
  ],
  "products": [
    {"brand": "Brand", "name": "Product name", "why": "Why it suits their skin"}
  ],
  "proTips": ["tip 1", "tip 2", "tip 3"]
}

Return 4-6 routine steps and 3-4 product recommendations. Favour Korean skincare brands where appropriate.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${cleanBase64}`,
                detail: "low",
              },
            },
          ],
        },
      ],
    };

    // Retry up to 3 times on 429 with exponential backoff
    let openaiRes;
    for (let attempt = 1; attempt <= 3; attempt++) {
      openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (openaiRes.status !== 429) break;

      if (attempt < 3) {
        const waitMs = attempt * 2000;
        console.warn(`OpenAI 429, retrying in ${waitMs}ms (attempt ${attempt}/3)`);
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }

    if (!openaiRes.ok) {
      const errBody = await openaiRes.json().catch(() => ({}));
      console.error("OpenAI error:", openaiRes.status, errBody);

      if (openaiRes.status === 429) {
        return res.status(429).json({
          error: "Our AI consultant is very busy right now. Please wait 30 seconds and try again.",
        });
      }
      if (openaiRes.status === 401) {
        return res.status(502).json({ error: "API authentication error — please contact support." });
      }
      return res.status(502).json({
        error: `AI service error (${openaiRes.status}). Please try again shortly.`,
      });
    }

    const data = await openaiRes.json();
    const aiText = data?.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      const clean = aiText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        analysisText: aiText,
        skinType: "Analysis complete",
        hydrationLevel: "See summary below",
        textureScore: "See summary below",
        overallHealth: "See summary below",
        concerns: [],
        routine: [],
        products: [],
        proTips: [],
      };
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Skin analysis error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
