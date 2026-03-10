import OpenAI from "openai";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { imageBase64 } = req.body;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
You are a Korean skincare consultant for Prude & Boujee.

Analyze the face photo and return ONLY JSON.

{
"skinType":"",
"hydrationLevel":"",
"textureScore":"",
"overallHealth":"",
"concerns":[],
"analysisText":"",
"routine":[],
"products":[],
"proTips":[]
}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            {
              type: "input_image",
              image_base64: imageBase64
            }
          ]
        }
      ]
    });

    const text = response.output[0].content[0].text;

    const result = JSON.parse(text);

    res.status(200).json(result);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Skin analysis failed"
    });

  }

}
