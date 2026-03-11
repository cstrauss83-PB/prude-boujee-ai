import fs from "fs";
import path from "path";

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

const CATALOG_PATH = path.join(process.cwd(), "data", "products.catalog.json");

let PRODUCT_CATALOG = [];
try {
  const raw = fs.readFileSync(CATALOG_PATH, "utf8");
  PRODUCT_CATALOG = JSON.parse(raw);
  console.log(`Loaded product catalog: ${PRODUCT_CATALOG.length} products`);
} catch (err) {
  console.error("Failed to load product catalog:", err);
  PRODUCT_CATALOG = [];
}

const VALID_STEPS = new Set([
  "cleanser",
  "toner",
  "essence",
  "serum",
  "ampoule",
  "moisturizer",
  "sunscreen",
  "mask",
  "eye-cream",
  "spot-treatment",
  "exfoliant",
]);

function clamp(value, min = 0, max = 100) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

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
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
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

function getStepAliases(product) {
  const primary = normalizeText(product.routineStep);
  const legacy = normalizeArray(product.step).map(normalizeText);
  return uniqueStrings([primary, ...legacy]);
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeConcernAliases(values) {
  return uniqueStrings(
    normalizeArray(values).map((v) => {
      const t = normalizeText(v);
      if (["dark spots", "dark-spots", "pigmentation"].includes(t)) return "dark-spots";
      if (["hyperpigmentation", "post-acne marks", "post acne marks"].includes(t)) return "hyperpigmentation";
      if (["oil", "oily", "sebum"].includes(t)) return "oiliness";
      if (["sensitive", "reactive"].includes(t)) return "sensitivity";
      if (["barrier", "barrier damage", "skin barrier"].includes(t)) return "barrier-support";
      return t;
    })
  );
}

function inferLeaveOnType(stepName) {
  const step = normalizeText(stepName);
  if (["cleanser", "mask", "exfoliant"].includes(step)) return "rinse-off";
  return "leave-on";
}

function inferRoutineRole(stepName) {
  const step = normalizeText(stepName);
  if (["cleanser", "moisturizer", "sunscreen"].includes(step)) return "core";
  if (["serum", "ampoule", "exfoliant", "spot-treatment", "mask"].includes(step)) return "treatment";
  return "support";
}

function computeGlassSkinScore(skinScore = {}) {
  const hydration = clamp(skinScore.hydration);
  const texture = clamp(skinScore.texture);
  const clarity = clamp(skinScore.clarity);
  const barrier = clamp(skinScore.barrier);
  const tone = clamp(skinScore.tone ?? skinScore.clarity);

  return Math.round(
    hydration * 0.3 +
      texture * 0.2 +
      clarity * 0.2 +
      barrier * 0.2 +
      tone * 0.1
  );
}

function getNumericScore(product, field, fallback = 0) {
  const value = Number(product?.[field]);
  return Number.isFinite(value) ? value : fallback;
}

function scoreProduct(product, context) {
  const {
    step,
    concerns,
    skinType,
    hydrationLevel,
    sensitivityLevel,
    routineActives = [],
  } = context;

  let score = 0;

  const productSteps = getStepAliases(product);
  const productConcerns = normalizeConcernAliases(product.concerns);
  const productSkinTypes = normalizeArray(product.skinTypes).map(normalizeText);
  const productBenefits = normalizeArray(product.benefits).map(normalizeText);
  const productIngredients = normalizeArray(product.heroIngredients).map(normalizeText);
  const productFlags = normalizeConcernAliases(product.consultationTags || []);

  const targetStep = normalizeText(step);
  const targetSkinType = normalizeText(skinType);
  const targetConcerns = normalizeConcernAliases(concerns);
  const hydration = normalizeText(hydrationLevel);
  const sensitivity = normalizeText(sensitivityLevel);

  if (productSteps.includes(targetStep)) score += 15;
  if (targetSkinType && productSkinTypes.includes(targetSkinType)) score += 10;
  if (productSkinTypes.length === 0) score += 2;

  for (const concern of targetConcerns) {
    if (productConcerns.includes(concern)) score += 8;
    if (productBenefits.includes(concern)) score += 3;
    if (productFlags.includes(concern)) score += 2;
  }

  if (targetConcerns.includes("dehydration") || targetConcerns.includes("dryness")) {
    score += getNumericScore(product, "hydrationScore") / 8;
    if (product.hydrating === true) score += 6;
    if (product.barrierSupport === true) score += 4;
  }

  if (targetConcerns.includes("barrier-support") || targetConcerns.includes("sensitivity") || sensitivity === "high") {
    score += getNumericScore(product, "barrierSafeScore") / 8;
    score += getNumericScore(product, "sensitiveSkinScore") / 10;
    if (product.sensitiveSafe === true) score += 6;
    if (product.fragranceFree === true) score += 4;
    if (product.lowIrritation === true) score += 4;
  }

  if (targetConcerns.includes("acne") || targetConcerns.includes("pores") || targetConcerns.includes("oiliness")) {
    score += getNumericScore(product, "acneCompatibilityScore") / 8;
    score -= getNumericScore(product, "comedogenicRiskScore") * 3;
    if (product.acneSafe === true) score += 6;
    if (productBenefits.includes("anti-acne")) score += 4;
    if (productBenefits.includes("pore care")) score += 4;
    if (productBenefits.includes("oil balance")) score += 4;
  }

  if (targetConcerns.includes("dark-spots") || targetConcerns.includes("hyperpigmentation") || targetConcerns.includes("dullness")) {
    score += getNumericScore(product, "brighteningScore") / 8;
    if (product.brightening === true) score += 6;
    if (productBenefits.includes("brightening")) score += 4;
  }

  if (targetConcerns.includes("texture")) {
    score += getNumericScore(product, "exfoliationIntensity") <= 2 ? 3 : 1;
    if (productBenefits.includes("texture smoothing")) score += 4;
  }

  if (hydration === "low" || hydration === "very low") {
    score += getNumericScore(product, "hydrationScore") / 10;
  }

  score -= getNumericScore(product, "irritationRiskScore") * 2;

  const retinoidType = normalizeText(product.retinoidType);
  const exfoliantType = normalizeText(product.exfoliantType);
  const vitaminCType = normalizeText(product.vitaminCType);

  if (routineActives.includes("retinoid") && retinoidType) score -= 8;
  if (routineActives.includes("exfoliant") && exfoliantType) score -= 6;
  if (routineActives.includes("vitamin-c") && vitaminCType && exfoliantType) score -= 5;

  if (inferLeaveOnType(targetStep) === "leave-on" && productIngredients.length > 0) score += 1;
  if (!product.url) score -= 100;

  return Math.round(score);
}

function buildLayeringNotes(stepName, product) {
  const step = normalizeText(stepName);
  const notes = [];

  if (["serum", "ampoule", "essence"].includes(step)) {
    notes.push("Apply after cleansing/toner and before moisturizer.");
  }
  if (step === "moisturizer") {
    notes.push("Use after treatment steps to seal in hydration.");
  }
  if (step === "sunscreen") {
    notes.push("Use as the final AM step and reapply through the day.");
  }
  if (product.requiresSunscreen === true) {
    notes.push("Pair with daily sunscreen.");
  }

  return notes.join(" ");
}

function buildDoNotCombineWith(product) {
  const flags = [];
  if (normalizeText(product.retinoidType)) flags.push("same-routine exfoliant", "same-routine extra retinoid");
  if (normalizeText(product.exfoliantType)) flags.push("same-routine strong retinoid");
  if (normalizeText(product.vitaminCType) && normalizeText(product.exfoliantType)) flags.push("same-routine additional exfoliant");
  return uniqueStrings(flags);
}

function buildPairsWellWith(stepName, product) {
  const pairs = [];
  const step = normalizeText(stepName);
  if (["cleanser", "toner"].includes(step)) pairs.push("hydrating serum", "barrier moisturizer");
  if (["serum", "ampoule", "essence"].includes(step)) pairs.push("barrier moisturizer", "daily sunscreen");
  if (product.barrierSupport === true) pairs.push("gentle cleanser");
  if (product.hydrating === true) pairs.push("ceramide moisturizer");
  return uniqueStrings(pairs);
}

function matchProducts({ step, concerns, skinType, hydrationLevel, sensitivityLevel, limit = 3, routineActives = [] }) {
  const targetStep = normalizeText(step);
  const targetConcerns = normalizeConcernAliases(concerns);
  const targetSkinType = normalizeText(skinType);

  let candidates = PRODUCT_CATALOG.filter((product) => {
    const steps = getStepAliases(product);
    return steps.includes(targetStep) && !!product.url;
  });

  const strictSkinType = candidates.filter((product) => {
    const skinTypes = normalizeArray(product.skinTypes).map(normalizeText);
    return skinTypes.length === 0 || skinTypes.includes(targetSkinType);
  });
  if (strictSkinType.length > 0) candidates = strictSkinType;

  return uniqueByUrl(
    candidates
      .map((product) => ({
        ...product,
        _score: scoreProduct(product, {
          step,
          concerns: targetConcerns,
          skinType,
          hydrationLevel,
          sensitivityLevel,
          routineActives,
        }),
      }))
      .sort((a, b) => b._score - a._score)
  )
    .slice(0, limit)
    .map((p) => ({
      brand: p.brand || "",
      name: p.name || p.fullName || "",
      why: p.whyItFits || "",
      whyNotIdeal: p.whyNotIdeal || "",
      url: p.url || "",
      step: normalizeText(p.routineStep || getStepAliases(p)[0] || step),
      routineStep: normalizeText(p.routineStep || getStepAliases(p)[0] || step),
      leaveOnType: p.leaveOnType || inferLeaveOnType(step),
      routineRole: p.routineRole || inferRoutineRole(step),
      layeringNotes: p.layeringNotes || buildLayeringNotes(step, p),
      doNotCombineWith: normalizeArray(p.doNotCombineWith).length ? normalizeArray(p.doNotCombineWith) : buildDoNotCombineWith(p),
      pairsWellWith: normalizeArray(p.pairsWellWith).length ? normalizeArray(p.pairsWellWith) : buildPairsWellWith(step, p),
      activeStrength: p.activeStrength || {},
      scores: {
        total: p._score,
        hydration: getNumericScore(p, "hydrationScore"),
        barrierSafe: getNumericScore(p, "barrierSafeScore"),
        acneCompatibility: getNumericScore(p, "acneCompatibilityScore"),
        brightening: getNumericScore(p, "brighteningScore"),
        irritationRisk: getNumericScore(p, "irritationRiskScore"),
        comedogenicRisk: getNumericScore(p, "comedogenicRiskScore"),
      },
    }))
  );
}

function collectRoutineActives(products) {
  const flags = new Set();
  for (const p of products) {
    if (normalizeText(p.retinoidType)) flags.add("retinoid");
    if (normalizeText(p.exfoliantType)) flags.add("exfoliant");
    if (normalizeText(p.vitaminCType)) flags.add("vitamin-c");
  }
  return [...flags];
}

function buildProductResults(routine, analysis) {
  const usedUrls = new Set();
  const chosenCatalogProducts = [];

  return routine.map((item) => {
    const matched = matchProducts({
      step: item.name || "",
      concerns: analysis.concerns || [],
      skinType: analysis.skinType || "",
      hydrationLevel: analysis.hydrationLevel || "",
      sensitivityLevel: analysis.sensitivityLevel || "",
      routineActives: collectRoutineActives(chosenCatalogProducts),
      limit: 3,
    }).filter((p) => p.url && !usedUrls.has(p.url));

    const selected = [];
    for (const p of matched) {
      if (selected.length >= 3) break;
      usedUrls.add(p.url);
      selected.push(p);
      chosenCatalogProducts.push(p);
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
      return res.status(500).json({ error: "Product catalog is missing or failed to load." });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");

    const payload = {
      model: "gpt-4o-mini",
      max_tokens: 1600,
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
  "sensitivityLevel": "",
  "concerns": [],
  "analysisText": "",
  "skinScore": {
    "hydration": 0,
    "texture": 0,
    "clarity": 0,
    "barrier": 0,
    "tone": 0,
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
- Allowed skinType values: dry, oily, combination, normal, sensitive
- Allowed hydrationLevel values: very low, low, medium, high, optimal
- Allowed sensitivityLevel values: low, medium, high
- Allowed concerns: acne, redness, pores, dehydration, dryness, texture, dullness, sensitivity, dark-spots, hyperpigmentation, oiliness, barrier-support
- Allowed step names: cleanser, toner, essence, serum, ampoule, moisturizer, sunscreen, mask, eye-cream, spot-treatment, exfoliant
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
- Estimate hydration, texture, clarity, barrier strength, and tone
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
      return res.status(500).json({ error: "AI returned invalid JSON.", raw: aiText });
    }

    const routine = (Array.isArray(parsed.routine) ? parsed.routine : [])
      .map((item, index) => ({
        step: Number(item?.step || index + 1),
        name: normalizeText(item?.name || ""),
        why: String(item?.why || "").trim(),
      }))
      .filter((item) => VALID_STEPS.has(item.name));

    const fallbackRoutine = [
      { step: 1, name: "cleanser", why: "Cleanse gently without stripping." },
      { step: 2, name: "toner", why: "Support hydration and prep skin." },
      { step: 3, name: "serum", why: "Target the main visible concerns." },
      { step: 4, name: "moisturizer", why: "Seal in hydration and support the barrier." },
      { step: 5, name: "sunscreen", why: "Protect skin daily from UV exposure." },
    ];

    const normalizedSkinScore = {
      hydration: clamp(parsed?.skinScore?.hydration),
      texture: clamp(parsed?.skinScore?.texture),
      clarity: clamp(parsed?.skinScore?.clarity),
      barrier: clamp(parsed?.skinScore?.barrier),
      tone: clamp(parsed?.skinScore?.tone ?? parsed?.skinScore?.clarity),
      glassSkinScore: 0,
    };
    normalizedSkinScore.glassSkinScore = computeGlassSkinScore(normalizedSkinScore);

    const analysis = {
      skinType: normalizeText(parsed.skinType || ""),
      hydrationLevel: normalizeText(parsed.hydrationLevel || "medium"),
      textureScore: parsed.textureScore || "",
      overallHealth: normalizeText(parsed.overallHealth || ""),
      sensitivityLevel: normalizeText(parsed.sensitivityLevel || "medium"),
      concerns: normalizeConcernAliases(parsed.concerns),
      analysisText: String(parsed.analysisText || "").trim(),
      skinScore: normalizedSkinScore,
      proTips: normalizeArray(parsed.proTips),
    };

    const routineWithProducts = buildProductResults(routine.length ? routine : fallbackRoutine, analysis);
    const flatProducts = uniqueByUrl(routineWithProducts.flatMap((step) => step.products || []));

    return res.status(200).json({
      ...analysis,
      routine: routineWithProducts,
      products: flatProducts,
      disclaimer: "This AI skin consultation provides cosmetic skincare guidance only and is not a medical diagnosis.",
    });
  } catch (err) {
    console.error("Skin analysis error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
