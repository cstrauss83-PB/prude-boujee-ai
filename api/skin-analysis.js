export default async function handler(req, res) {

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Call OpenAI API
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
            content: "You are a Korean skincare consultant for Prude & Boujee. Analyze the user's face and return skincare recommendations. Return ONLY valid JSON."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this face photo and return JSON in this format:

{
  "skinType":"",
  "hydrationLevel":"",
  "textureScore":"",
  "overallHealth":"",
  "concerns":[],
  "analysisText":"",
  "routine":[
    {"step":1,"name":"","why":"","timing":""}
  ],
  "products":[
    {"brand":"","name":"","why":""}
  ],
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

    // Return OpenAI response
    res.status(200).json(data);

  } catch (error) {

    console.error("Skin analysis error:", error);

    res.status(500).json({
      error: "Skin analysis failed"
    });

  }

}
