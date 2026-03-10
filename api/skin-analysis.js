export default async function handler(req, res) {

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request FIRST
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {

    const { imageBase64 } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: "No image provided" });
      return;
    }

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
          "You are a Korean skincare consultant for Prude & Boujee. Analyze the face and return ONLY valid JSON."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this face photo and return JSON exactly like this:

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
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a Korean skincare consultant for Prude & Boujee. Always return valid JSON."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this face photo and return JSON in this exact structure:

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
            content: "You are a Korean skincare consultant for Prude & Boujee. Return ONLY JSON."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this face photo and return JSON with skinType, hydrationLevel, textureScore, overallHealth, concerns, analysisText, routine, products, proTips."
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

    res.status(200).json(parsed);

  } catch (error) {

    console.error("Skin analysis error:", error);

    res.status(500).json({
      error: "Skin analysis failed"
    });

  }

}
