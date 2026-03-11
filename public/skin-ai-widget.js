(function () {
  const API_URL = "/api/skin-analysis";
  const CONTAINER_ID = "skin-ai-widget";

  function injectStyles() {
    if (document.getElementById("skin-ai-widget-styles")) return;

    const style = document.createElement("style");
    style.id = "skin-ai-widget-styles";
    style.textContent = `
      .pb-skin-widget {
        font-family: Georgia, "Times New Roman", serif;
        max-width: 980px;
        margin: 0 auto;
        background: #f6f2ed;
        color: #3a2118;
        box-sizing: border-box;
      }

      .pb-skin-widget h2,
      .pb-skin-widget h3,
      .pb-skin-widget h4,
      .pb-skin-widget h5 {
        margin: 0 0 12px;
        font-weight: 500;
      }

      .pb-skin-widget p {
        margin: 0 0 12px;
        line-height: 1.55;
      }

      .pb-upload-box {
        border: 1px solid #e4b7a7;
        border-radius: 0;
        padding: 28px 18px;
        text-align: center;
        background: #f6f2ed;
      }

      .pb-upload-box input[type="file"] {
        margin-top: 10px;
      }

      .pb-preview {
        margin: 16px auto 0;
        width: 240px;
        height: 240px;
        object-fit: cover;
        border-radius: 999px;
        border: 8px solid #f0cbbd;
        display: none;
      }

      .pb-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #3b1709;
        color: #fff !important;
        border: 0;
        padding: 10px 16px;
        min-height: 42px;
        text-decoration: none !important;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        font-family: Arial, sans-serif;
        font-size: 13px;
        cursor: pointer;
        box-sizing: border-box;
      }

      .pb-btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .pb-muted {
        color: #b28f7f;
        font-family: Arial, sans-serif;
        font-size: 13px;
      }

      .pb-error {
        color: #cc7d65;
        border: 1px solid #e4b7a7;
        background: rgba(255,255,255,0.4);
        padding: 8px 10px;
        margin-top: 0;
        font-family: Arial, sans-serif;
      }

      .pb-loading {
        margin-top: 12px;
        padding: 10px 12px;
        border: 1px solid #e4b7a7;
        color: #3a2118;
        background: rgba(255,255,255,0.4);
        font-family: Arial, sans-serif;
      }

      .pb-results {
        margin-top: 0;
      }

      .pb-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }

      .pb-metric-card {
        border: 1px solid #e4b7a7;
        padding: 6px 8px 2px;
        text-align: center;
      }

      .pb-metric-label {
        color: #b79a62;
        font-family: Arial, sans-serif;
        font-size: 12px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .pb-metric-value {
        font-size: 20px;
      }

      .pb-analysis-box {
        border: 1px solid #efe1d8;
        border-top: 0;
        padding: 10px 0 0;
        font-size: 18px;
        font-style: italic;
      }

      .pb-pill-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }

      .pb-pill {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 999px;
        background: #f3e6df;
        color: #cc7d65;
        font-family: Arial, sans-serif;
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .pb-section {
        margin-top: 18px;
      }

      .pb-section-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 10px;
      }

      .pb-section-title h3 {
        white-space: nowrap;
        font-size: 26px;
      }

      .pb-line {
        height: 1px;
        width: 100%;
        background: #e4b7a7;
      }

      .pb-routine-item {
        display: grid;
        grid-template-columns: 52px 1fr;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid #efe1d8;
      }

      .pb-routine-number {
        font-size: 24px;
        color: #e4b7a7;
      }

      .pb-routine-name {
        font-family: Arial, sans-serif;
        font-weight: 700;
        font-size: 16px;
        text-transform: lowercase;
        color: #3a2118;
      }

      .pb-routine-why {
        font-family: Arial, sans-serif;
        font-size: 15px;
        color: #b28f7f;
        margin-top: 4px;
      }

      .pb-score-box {
        margin: 14px 0 6px;
      }

      .pb-score-title {
        font-family: Arial, sans-serif;
        font-size: 12px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #b79a62;
        margin-bottom: 8px;
      }

      .pb-bars {
        display: grid;
        gap: 10px;
      }

      .pb-bar-label {
        display: flex;
        justify-content: space-between;
        font-family: Arial, sans-serif;
        font-size: 13px;
        margin-bottom: 4px;
      }

      .pb-bar-track {
        height: 8px;
        background: #eadfd8;
        overflow: hidden;
      }

      .pb-bar-fill {
        height: 100%;
        background: #3b1709;
      }

      .pb-products {
        display: grid;
        gap: 10px;
      }

      .pb-product-card {
        border: 1px solid #e4b7a7;
        padding: 8px 10px 12px;
      }

      .pb-product-brand {
        color: #b79a62;
        font-family: Arial, sans-serif;
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        margin-bottom: 2px;
      }

      .pb-product-title {
        color: #3a2118 !important;
        text-decoration: none;
        font-size: 18px;
      }

      .pb-product-title:hover {
        text-decoration: underline;
      }

      .pb-product-why {
        margin-top: 4px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        color: #b28f7f;
      }

      .pb-product-notes {
        margin: 8px 0 0;
        padding-left: 18px;
        font-family: Arial, sans-serif;
        font-size: 13px;
        color: #8e7366;
      }

      .pb-product-notes li {
        margin-bottom: 4px;
      }

      .pb-product-actions {
        margin-top: 10px;
      }

      .pb-disclaimer {
        margin-top: 14px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        color: #b28f7f;
      }

      @media (max-width: 700px) {
        .pb-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getContainer() {
    return document.getElementById(CONTAINER_ID);
  }

  function createWidgetMarkup(container) {
    container.innerHTML = `
      <div class="pb-skin-widget">
        <div class="pb-upload-box">
          <div class="pb-muted" style="margin-bottom:10px;">Upload a clear, well-lit selfie for your personalised Korean skincare analysis</div>
          <input id="pb-file-input" type="file" accept="image/*" />
          <img id="pb-preview" class="pb-preview" alt="Preview" />
        </div>

        <button id="pb-analyze-btn" class="pb-btn" style="width:100%; margin-top:12px;" disabled>Analyse My Skin</button>

        <div id="pb-status"></div>
        <div id="pb-results" class="pb-results"></div>
      </div>
    `;
  }

  function setStatus(html) {
    const el = document.getElementById("pb-status");
    el.innerHTML = html || "";
  }

  function setLoading(message) {
    setStatus(`<div class="pb-loading">${message || "Analyzing image..."}</div>`);
  }

  function setError(message) {
    setStatus(`<div class="pb-error">Analysis failed: ${escapeHtml(message)}</div>`);
  }

  function clearStatus() {
    setStatus("");
  }

  function resizeImageToBase64(file, maxSize = 800, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = function (e) {
        const img = new Image();

        img.onload = function () {
          let { width, height } = img;

          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height >= width && height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", quality));
        };

        img.onerror = reject;
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return String(value)
      .split(/[|,]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  function renderScoreBars(score = {}) {
    const bars = [
      ["Glass Skin Score", Number(score.glassSkinScore || 0)],
      ["Hydration", Number(score.hydration || 0)],
      ["Texture", Number(score.texture || 0)],
      ["Clarity", Number(score.clarity || 0)],
      ["Barrier", Number(score.barrier || 0)],
    ].filter(([, value]) => value > 0);

    if (!bars.length) return "";

    return `
      <div class="pb-score-box">
        <div class="pb-score-title">Score Breakdown</div>
        <div class="pb-bars">
          ${bars
            .map(
              ([label, value]) => `
                <div>
                  <div class="pb-bar-label">
                    <span>${escapeHtml(label)}</span>
                    <span>${value}</span>
                  </div>
                  <div class="pb-bar-track">
                    <div class="pb-bar-fill" style="width:${Math.max(0, Math.min(100, value))}%"></div>
                  </div>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderRoutine(routine = []) {
    if (!Array.isArray(routine) || !routine.length) return "";

    return `
      <div class="pb-section">
        <div class="pb-section-title">
          <h3>Your Routine</h3>
          <div class="pb-line"></div>
        </div>
        ${routine
          .map(
            (step, index) => `
              <div class="pb-routine-item">
                <div class="pb-routine-number">${escapeHtml(step.step || index + 1)}</div>
                <div>
                  <div class="pb-routine-name">${escapeHtml(step.name || "")}</div>
                  <div class="pb-routine-why">${escapeHtml(step.why || "")}</div>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderProductCard(product) {
    const notes = [];
    const layeringNotes = product.layeringNotes || "";
    const pairsWellWith = normalizeArray(product.pairsWellWith);
    const doNotCombineWith = normalizeArray(product.doNotCombineWith);

    if (layeringNotes) notes.push(`<li><strong>Layering:</strong> ${escapeHtml(layeringNotes)}</li>`);
    if (pairsWellWith.length) notes.push(`<li><strong>Pairs well with:</strong> ${escapeHtml(pairsWellWith.slice(0, 3).join(", "))}</li>`);
    if (doNotCombineWith.length) notes.push(`<li><strong>Avoid with:</strong> ${escapeHtml(doNotCombineWith.slice(0, 3).join(", "))}</li>`);

    return `
      <div class="pb-product-card">
        <div class="pb-product-brand">${escapeHtml(product.brand || "")}</div>
        <a class="pb-product-title" href="${escapeHtml(product.url || "#")}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(product.name || "Recommended Product")}
        </a>
        ${product.why ? `<div class="pb-product-why">${escapeHtml(product.why)}</div>` : ""}
        ${notes.length ? `<ul class="pb-product-notes">${notes.join("")}</ul>` : ""}
        <div class="pb-product-actions">
          <a class="pb-btn" href="${escapeHtml(product.url || "#")}" target="_blank" rel="noopener noreferrer">Review Item</a>
        </div>
      </div>
    `;
  }

  function renderProducts(products = []) {
    if (!Array.isArray(products) || !products.length) return "";

    return `
      <div class="pb-section">
        <div class="pb-section-title">
          <h3>Product Picks</h3>
          <div class="pb-line"></div>
        </div>
        <div class="pb-products">
          ${products.map((product) => renderProductCard(product)).join("")}
        </div>
      </div>
    `;
  }

  function renderResults(data) {
    const resultsEl = document.getElementById("pb-results");
    const concerns = normalizeArray(data.concerns);
    const routine = Array.isArray(data.routine) ? data.routine : [];
    const products = Array.isArray(data.products) ? data.products : [];
    const score = data.skinScore || {};

    resultsEl.innerHTML = `
      <div class="pb-section" style="margin-top:0;">
        <div class="pb-grid">
          <div class="pb-metric-card">
            <div class="pb-metric-label">Skin Type</div>
            <div class="pb-metric-value">${escapeHtml(data.skinType || "—")}</div>
          </div>
          <div class="pb-metric-card">
            <div class="pb-metric-label">Hydration</div>
            <div class="pb-metric-value">${escapeHtml(data.hydrationLevel || "—")}</div>
          </div>
          <div class="pb-metric-card">
            <div class="pb-metric-label">Texture</div>
            <div class="pb-metric-value">${escapeHtml(data.textureScore || "—")}</div>
          </div>
          <div class="pb-metric-card">
            <div class="pb-metric-label">Overall</div>
            <div class="pb-metric-value">${escapeHtml(data.overallHealth || "—")}</div>
          </div>
        </div>

        <div class="pb-analysis-box">
          <p>${escapeHtml(data.analysisText || "")}</p>
        </div>

        ${concerns.length ? `<div class="pb-pill-wrap">${concerns.map((c) => `<span class="pb-pill">${escapeHtml(c)}</span>`).join("")}</div>` : ""}

        ${renderScoreBars(score)}
      </div>

      ${renderRoutine(routine)}
      ${renderProducts(products)}

      <div class="pb-disclaimer">${escapeHtml(data.disclaimer || "For informational purposes only. Not a substitute for professional dermatological advice.")}</div>
    `;
  }

  async function handleAnalyze() {
    const fileInput = document.getElementById("pb-file-input");
    const analyzeBtn = document.getElementById("pb-analyze-btn");
    const resultsEl = document.getElementById("pb-results");

    if (!fileInput.files || !fileInput.files[0]) {
      setError("Please upload a photo first.");
      return;
    }

    analyzeBtn.disabled = true;
    resultsEl.innerHTML = "";
    setLoading("Analyzing your skin...");

    try {
      const file = fileInput.files[0];
      const imageBase64 = await resizeImageToBase64(file, 800, 0.82);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to analyze the image.");
      }

      clearStatus();
      renderResults(data);
    } catch (err) {
      console.error("Skin AI error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      analyzeBtn.disabled = false;
    }
  }

  function handleFileChange(event) {
    const file = event.target.files && event.target.files[0];
    const preview = document.getElementById("pb-preview");
    const analyzeBtn = document.getElementById("pb-analyze-btn");
    const resultsEl = document.getElementById("pb-results");

    resultsEl.innerHTML = "";
    clearStatus();

    if (!file) {
      preview.style.display = "none";
      preview.src = "";
      analyzeBtn.disabled = true;
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = "block";
      analyzeBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  function init() {
    injectStyles();
    const container = getContainer();
    if (!container) return;

    createWidgetMarkup(container);

    document.getElementById("pb-file-input").addEventListener("change", handleFileChange);
    document.getElementById("pb-analyze-btn").addEventListener("click", handleAnalyze);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();