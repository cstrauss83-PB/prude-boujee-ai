export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

const STORE_BRANDS = [
  "Medicube",
  "Skin1004",
  "Mixsoon",
  "Beauty of Joseon",
  "COSRX",
  "SOME BY MI",
  "Anua",
  "TIRTIR",
  "Round Lab",
  "Torriden",
  "Isntree",
  "Klairs"
];

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    let body = req.body;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const { imageBase64 } = body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z+]+;base64,/, "");

    const prompt = `
You are a professional Korean skincare consultant with 15 years of dermatology experience.

Analyze facial skin for:
- hydration
- pore visibility
- redness
- acne / congestion
- pigmentation
- oil balance
- texture irregularities

Return ONLY valid JSON.

{
"skinType":"",
"hydrationLevel":"",
"textureScore":"",
"overallHealth":"",
"concerns":[],
"analysisText":"",
"skinScore":{
"hydration":0,
"texture":0,
"clarity":0,
"barrier":0,
"glassSkinScore":0
},
"routine":[{"step":1,"name":"","why":""}],
"products":[{"brand":"","name":"","why":"","url":""}],
"proTips":[]
}

IMPORTANT:

Only recommend products from these brands:
${STORE_BRANDS.join(", ")}

Use URLs in this format:
https://www.prudeandboujee.com/search?q=PRODUCT_NAME
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${process.env.OPENAI_API_KEY}`
      },
      body:JSON.stringify({
        model:"gpt-4o-mini",
        max_tokens:1200,
        messages:[
          {role:"system",content:prompt},
          {
            role:"user",
            content:[
              {
                type:"text",
                text:"Analyze this face photo."
              },
              {
                type:"image_url",
                image_url:{
                  url:`data:image/jpeg;base64,${cleanBase64}`,
                  detail:"low"
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    const aiText = data?.choices?.[0]?.message?.content || "{}";

    let parsed;

    try{
      parsed = JSON.parse(aiText.replace(/```json/g,"").replace(/```/g,""));
    }catch{
      parsed = { analysisText: aiText };
    }

    return res.status(200).json(parsed);

  } catch(err){

    console.error("Skin analysis error:",err);

    return res.status(500).json({
      error:"Something went wrong. Please try again."
    });

  }
}
