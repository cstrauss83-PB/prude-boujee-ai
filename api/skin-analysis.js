export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req, res) {

  // ---- CORS ----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ---- IMPORTANT: Handle preflight BEFORE anything else ----
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {

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

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z+]+;base64,/, "");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content:
              "You are an expert Korean skincare consultant. Return ONLY valid JSON."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this face photo and return JSON like:

{
"skinType":"",
"hydrationLevel":"",
"textureScore":"",
"overallHealth":"",
"concerns":[],
"analysisText":"",
"routine":[{"step":1,"name":"","why":""}],
"products":[{"brand":"","name":"","why":""}],
"proTips":[]
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${cleanBase64}`,
                  detail: "low"
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", err);
      return res.status(502).json({ error: "AI service error." });
    }

    const data = await response.json();

    const aiText = data?.choices?.[0]?.message?.content || "{}";

    let parsed;

    try {
      parsed = JSON.parse(
        aiText.replace(/```json/g, "").replace(/```/g, "").trim()
      );
    } catch {
      parsed = { analysisText: aiText };
    }

    return res.status(200).json(parsed);

  } catch (err) {

    console.error("Skin analysis error:", err);

    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });

  }
}
