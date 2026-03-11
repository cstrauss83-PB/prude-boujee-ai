import fs from "fs";
import { fileURLToPath } from "url";

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

const CATALOG_URL = new URL("../data/products.catalog.json", import.meta.url);
const CATALOG_PATH = fileURLToPath(CATALOG_URL);

function loadProductCatalog() {
  try {
    console.log("import.meta catalog URL:", CATALOG_URL.href);
    console.log("Catalog path:", CATALOG_PATH);
    console.log("process.cwd():", process.cwd());
    console.log("Catalog exists:", fs.existsSync(CATALOG_PATH));

    const raw = fs.readFileSync(CATALOG_PATH, "utf8");
    const parsed = JSON.parse(raw);

    let products = [];

    if (Array.isArray(parsed)) {
      products = parsed;
    } else if (parsed && Array.isArray(parsed.products)) {
      products = parsed.products;
    } else {
      throw new Error("Invalid catalog shape. Expected [] or { products: [] }");
    }

    console.log(`Loaded product catalog: ${products.length} products`);
    return products;
  } catch (err) {
    console.error("Failed to load product catalog:", err);
    return [];
  }
}

const PRODUCT_CATALOG = loadProductCatalog();

function normalizeText(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function safeJsonParse(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

function uniqueByUrl(products) {
  const seen = new Set();
  return products.filter((p) => {
    const key = p.url || `${p.brand}-${p.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreProduct(product, { step, concerns, skinType, hydrationLevel, overallHealth }) {
  let score = 0;

  const productSteps = normalizeArray(product.routineStep || product.step).map(normalizeText);
  const productConcerns = normalizeArray(product.concerns).map(normalizeText);
  const productSkinTypes = normalizeArray(product.skinTypes).map(normalizeText);
  const productBenefits = normalizeArray(product.benefits).map(normalizeText);
  const heroIngredients = normalizeArray(product.heroIngredients).map(normalizeText);

  const targetStep = normalizeText(step);
  const targetSkinType = normalizeText(skinType);
  const targetConcerns = normalizeArray(concerns).map(normalizeText);
  const hydration = normalizeText(hydrationLevel);
  const health = normalizeText(overallHealth);

  if (productSteps.includes(targetStep)) score += 8;

  if (targetSkinType && productSkinTypes.includes(targetSkinType)) {
    score += 5;
  }

  for (const concern of targetConcerns) {
    if (productConcerns.includes(concern)) score += 4;
  }

  if (targetConcerns.includes("redness") || targetConcerns.includes("sensitivity")) {
    if (productBenefits.includes("soothing")) score += 3;
    if (product.sensitiveSafe === true) score += 3;
    if (product.barrierSupport === true) score += 2;
  }

  if (targetConcerns.includes("dehydration") || targetConcerns.includes("dryness")) {
    if (product.hydrating === true) score += 3;
    if (productBenefits.includes("hydrating")) score += 2;
    if (product.barrierSupport === true) score += 2;
  }

  if (targetConcerns.includes("acne")) {
    if (product.acneSafe === true) score += 3;
    if (productBenefits.includes("anti-acne")) score += 2;
  }

  if (
    targetConcerns.includes("dark-spots") ||
    targetConcerns.includes("hyperpigmentation") ||
    targetConcerns.includes("dullness")
  ) {
    if (product.brightening === true) score += 3;
    if (productBenefits.includes("brightening")) score += 2;
  }

  if (targetConcerns.includes("pores") || targetConcerns.includes("oiliness")) {
    if (productBenefits.includes("pore care")) score += 2;
    if (productBenefits.includes("oil balance")) score += 2;
  }

  if (hydration.includes("optimal")) {
    if (productBenefits.includes("hydrating")) score += 1;
  } else {
    if (product.hydrating === true) score += 2;
  }

  if (health.includes("healthy")) {
    if (heroIngredients.length > 0) score += 1;
  }

  if (product.fragranceFree === true) score += 1;
  if (product.lowIrritation === true) score += 1;

  if (!product.url) score -= 100;

  return score;
}

function matchProducts({ step, concerns, skinType, hydrationLevel, overallHealth, limit = 3 }) {
  const targetStep = normalizeText(step);
  const targetConcerns = normalizeArray(concerns).map(normalizeText);
  const targetSkinType = normalizeText(skinType);

  let candidates = PRODUCT_CATALOG.filter((product) => {
    const steps = normalizeArray(product.routineStep || product.step).map(normalizeText);
    if (!steps.includes(targetStep)) return false;
    if (!product.url) return false;
    return true;
  });

  const strictSkinType = candidates.filter((product) => {
    const skinTypes = normalizeArray(product.skinTypes).map(normalizeText);
    return skinTypes.length === 0 || skinTypes.includes(targetSkinType);
  });

  if (strictSkinType.length > 0) {
    candidates = strictSkinType;
  }

  const scored = candidates
    .map((product) => ({
      ...product,
      _score: scoreProduct(product, {
        step,
        concerns: targetConcerns,
        skinType,
        hydrationLevel,
        overallHealth,
      }),
    }))
    .sort((a, b) => b._score - a._score);

  return uniqueByUrl(scored).slice(0, limit).map((p) => ({
    brand: p.brand || "",
    name: p.name || p.fullName || "",
    why: p.whyItFits || "",
    url: p.url || "",
    step: normalizeArray(p.routineStep || p.step)[0] || step,
    routineStep: normalizeArray(p.routineStep || p.step)[0] || step,
    price: p.price || "",
    layeringNotes: p.layeringNotes || "",
    doNotCombineWith: p.doNotCombineWith || [],
    pairsWellWith: p.pairsWellWith || [],
    consultationTags: p.consultationTags || [],
  }));
}

function buildProductResults(routine, analysis) {
  const usedUrls = new Set();

  return routine.map((item) => {
    const matched = matchProducts({
      step: item.name || item.type || item.stepType || "",
      concerns: analysis.concerns || [],
      skinType: analysis.skinType || "",
      hydrationLevel: analysis.hydrationLevel || "",
      overallHealth: analysis.overallHealth || "",
      limit: 4,
    }).filter((p) => {
      if (!p.url) return false;
      if (usedUrls.has(p.url)) return false;
      return true;
    });

    const selected = [];
    for (const p of matched) {
      if (selected.length >= 2) break;
      usedUrls.add(p.url);
      selected.push(p);
    }

    return {
      step: item.step,
      name: item.name,
      why: item.why,
      products: selected,
    };
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const { imageBase64 } = body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    if (!PRODUCT_CATALOG.length) {
      return res.status(500).json({
        error: "Product catalog is missing or failed to load.",
        debug: {
          catalogUrl: CATALOG_URL.href,
          catalogPath: CATALOG_PATH,
          cwd: process.cwd(),
          catalogExists: fs.existsSync(CATALOG_PATH),
        },
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");

    const payload = {
      model: "gpt-4o-mini",
      max_tokens: 1400,
      messages: [
        {
          role: "system",
          content: `
You are an expert Korean skincare consultant for a retail skincare store.

You are analyzing a face photo for cosmetic skincare guidance only.
Do not diagnose medical conditions.
Return ONLY valid JSON.
Do not recommend specific brands or products.
Do not include URLs.
Only provide skin analysis and routine step guidance.

Use this exact JSON shape:

{
  "skinType": "",
  "hydrationLevel": "",
  "textureScore": "",
  "overallHealth": "",
  "concerns": [],
  "analysisText": "",
  "skinScore": {
    "hydration": 0,
    "texture": 0,
    "clarity": 0,
    "barrier": 0,
    "glassSkinScore": 0
  },
  "routine": [
    { "step": 1, "name": "cleanser", "why": "" },
    { "step": 2, "name": "toner", "why": "" },
    { "step": 3, "name": "serum", "why": "" },
    { "step": 4, "name": "moisturizer", "why": "" },
    { "step": 5, "name": "sunscreen", "why": "" }
  ],
  "proTips": []
}

Rules:
- Allowed step names: cleanser, toner, essence, serum, ampoule, moisturizer, sunscreen, mask, eye-cream, spot-treatment, exfoliant
- Include sunscreen only if it makes sense for daytime use
- Keep concerns to the most relevant 2-5 items
- Scores must be integers from 0 to 100
- analysisText should be 2-4 sentences
          `.trim(),
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
Analyze this face photo and return the JSON exactly as requested.

Guidance:
- Evaluate likely skin type
- Estimate hydration, texture, clarity, barrier strength
- Identify the most likely cosmetic concerns such as redness, dehydration, acne, pores, dullness, texture, sensitivity, dark-spots
- Build a simple personalized skincare routine by step only
- Do not recommend specific products
              `.trim(),
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${cleanBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    };

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const openaiData = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("OpenAI API error:", openaiData);
      return res.status(500).json({
        error: "AI analysis failed.",
        details: openaiData?.error?.message || "Unknown OpenAI error",
      });
    }

    const aiText = openaiData?.choices?.[0]?.message?.content || "";
    const parsed = safeJsonParse(aiText);

    if (!parsed) {
      return res.status(500).json({
        error: "AI returned invalid JSON.",
        raw: aiText,
      });
    }

    const normalizedRoutine = Array.isArray(parsed.routine) && parsed.routine.length
      ? parsed.routine
      : [
          { step: 1, name: "cleanser", why: "Cleanse gently without stripping." },
          { step: 2, name: "toner", why: "Support hydration and prep skin." },
          { step: 3, name: "serum", why: "Target the main visible concerns." },
          { step: 4, name: "moisturizer", why: "Seal in hydration and support the barrier." },
          { step: 5, name: "sunscreen", why: "Protect skin daily from UV exposure." },
        ];

    const analysis = {
      skinType: parsed.skinType || "",
      hydrationLevel: parsed.hydrationLevel || "",
      textureScore: parsed.textureScore || "",
      overallHealth: parsed.overallHealth || "",
      concerns: normalizeArray(parsed.concerns),
      analysisText: parsed.analysisText || "",
      skinScore: {
        hydration: Number(parsed?.skinScore?.hydration || 0),
        texture: Number(parsed?.skinScore?.texture || 0),
        clarity: Number(parsed?.skinScore?.clarity || 0),
        barrier: Number(parsed?.skinScore?.barrier || 0),
        glassSkinScore: Number(parsed?.skinScore?.glassSkinScore || 0),
      },
      proTips: normalizeArray(parsed.proTips),
    };

    const routine = normalizedRoutine
      .map((item, index) => ({
        step: Number(item.step || index + 1),
        name: String(item.name || "").trim().toLowerCase(),
        why: String(item.why || "").trim(),
      }))
      .filter((item) => item.name);

    const routineWithProducts = buildProductResults(routine, analysis);

    const flatProducts = uniqueByUrl(
      routineWithProducts.flatMap((step) => step.products || [])
    );

    return res.status(200).json({
      ...analysis,
      routine: routineWithProducts,
      products: flatProducts,
      disclaimer:
        "This AI skin consultation provides cosmetic skincare guidance only and is not a medical diagnosis.",
    });
  } catch (err) {
    console.error("Skin analysis error:", err);

    return res.status(500).json({
      error: "Something went wrong. Please try again.",
    });
  }
}
