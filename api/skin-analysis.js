export default async function handler(req, res) {

  // ---- CORS HEADERS ----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ---- HANDLE PREFLIGHT FIRST ----
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    // ---- PARSE BODY SAFELY ----
    let body;

    if (typeof req.body === "string") {
      body = JSON.parse(req.body);
    } else {
      body = req.body;
    }

    const { imageBase64 } = body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    // ---- CALL OPENAI ----
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a Korean skincare consultant. Return ONLY valid JSON."
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
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 800
      })
    });

    const data = await response.json();

    const aiText = data?.choices?.[0]?.message?.content || "{}";

    let parsed;

    try {
      parsed = JSON.parse(aiText);
    } catch {
      parsed = { analysisText: aiText };
    }

    return res.status(200).json(parsed);

  } catch (error) {

    console.error("Skin analysis error:", error);

    return res.status(500).json({
      error: "Skin analysis failed"
    });

  }

}
