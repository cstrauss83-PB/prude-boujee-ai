(function () {
  const API_URL = "https://prudeandboujee-chris-projects-773af4c9.vercel.app/api/skin-analysis";
  const CONTAINER_ID = "skin-ai-widget";

  function injectStyles() {
    if (document.getElementById("skin-ai-widget-styles")) return;

    const style = document.createElement("style");
    style.id = "skin-ai-widget-styles";
    style.textContent = `
      .pb-skin-widget {
        font-family: Arial, sans-serif;
        max-width: 820px;
        margin: 0 auto;
        border: 1px solid #e8e8e8;
        border-radius: 16px;
        padding: 20px;
        background: #fff;
        box-sizing: border-box;
      }

      .pb-skin-widget h2,
      .pb-skin-widget h3,
      .pb-skin-widget h4 {
        margin: 0 0 12px;
      }

      .pb-skin-widget p {
        margin: 0 0 12px;
        line-height: 1.5;
      }

      .pb-row {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }

      .pb-col {
        flex: 1 1 260px;
      }

      .pb-upload-box {
        border: 2px dashed #d8d8d8;
        border-radius: 14px;
        padding: 18px;
        text-align: center;
        background: #fafafa;
      }

      .pb-upload-box input[type="file"] {
        margin-top: 10px;
      }

      .pb-preview {
        margin-top: 12px;
        max-width: 100%;
        border-radius: 12px;
        display: none;
      }

      .pb-btn {
        display: inline-block;
        background: #111;
        color: #fff;
        border: 0;
        border-radius: 10px;
        padding: 12px 18px;
        cursor: pointer;
        font-size: 14px;
      }

      .pb-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .pb-muted {
        color: #666;
        font-size: 13px;
      }

      .pb-error {
        color: #b42318;
        background: #fef3f2;
        border: 1px solid #fecdca;
        padding: 12px;
        border-radius: 10px;
        margin-top: 14px;
      }

      .pb-loading {
        margin-top: 14px;
        padding: 12px;
        border-radius: 10px;
        background: #f7f7f7;
      }

      .pb-results {
        margin-top: 24px;
      }

      .pb-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }

      .pb-card {
        border: 1px solid #ececec;
        border-radius: 14px;
        padding: 14px;
        background: #fff;
      }

      .pb-pill-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }

      .pb-pill {
        display: inline-block;
        padding: 6px 10px;
        border-radius: 999px;
        background: #f4f4f5;
        font-size: 12px;
      }

      .pb-score-box {
        display: flex;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
        margin-bottom: 18px;
      }

      .pb-score-circle {
        width: 110px;
        height: 110px;
        border-radius: 999px;
        border: 8px solid #111;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        font-weight: 700;
      }

      .pb-score-circle span:first-child {
        font-size: 28px;
        line-height: 1;
      }

      .pb-score-circle span:last-child {
        font-size: 11px;
        color: #666;
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .pb-bars {
        flex: 1 1 280px;
      }

      .pb-bar {
        margin-bottom: 10px;
      }

      .pb-bar-label {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        margin-bottom: 4px;
      }

      .pb-bar-track {
        height: 10px;
        background: #efefef;
        border-radius: 999px;
        overflow: hidden;
      }

      .pb-bar-fill {
        height: 100%;
        background: #111;
        border-radius: 999px;
      }

      .pb-routine-step {
        margin-bottom: 14px;
      }

      .pb-products {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
        margin-top: 10px;
      }

      .pb-product-card {
        border: 1px solid #ececec;
        border-radius: 14px;
        padding: 14px;
        background: #fff;
      }

      .pb-product-card a {
        color: #111;
        text-decoration: none;
        font-weight: 700;
      }

      .pb-product-card a:hover {
        text-decoration: underline;
      }

      .pb-section {
        margin-top: 22px;
      }

      .pb-list {
        margin: 0;
        padding-left: 18px;
      }

      .pb-list li {
        margin-bottom: 8px;
      }

      .pb-disclaimer {
        margin-top: 20px;
        font-size: 12px;
        color: #666;
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
        <h2>AI Skin Consultation</h2>
        <p class="pb-muted">Upload a clear face photo to receive your Glass Skin Score, skin analysis, personalized routine, and product picks from Prude & Boujee.</p>

        <div class="pb-row">
          <div class="pb-col">
            <div class="pb-upload-box">
              <div><strong>Upload a face photo</strong></div>
              <input id="pb-file-input" type="file" accept="image/*" />
              <img id="pb-preview" class="pb-preview" alt="Preview" />
            </div>
          </div>

          <div class="pb-col">
            <div style="display:flex; flex-direction:column; gap:10px; justify-content:center; height:100%;">
              <button id="pb-analyze-btn" class="pb-btn" disabled>Analyze My Skin</button>
              <div class="pb-muted">Best results: front-facing photo, natural lighting, minimal filters, no sunglasses.</div>
            </div>
          </div>
        </div>

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
    setStatus(`<div class="pb-error">${message}</div>`);
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

          const base64 = canvas.toDataURL("image/jpeg", quality);
          resolve(base64);
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

  function renderScoreBars(score = {}) {
    const bars = [
      ["Hydration", Number(score.hydration || 0)],
      ["Texture", Number(score.texture || 0)],
      ["Clarity", Number(score.clarity || 0)],
      ["Barrier", Number(score.barrier || 0)],
    ];

    return `
      <div class="pb-score-box">
        <div class="pb-score-circle">
          <span>${Number(score.glassSkinScore || 0)}</span>
          <span>Glass Skin Score</span>
        </div>

        <div class="pb-bars">
          ${bars
            .map(
              ([label, val]) => `
                <div class="pb-bar">
                  <div class="pb-bar-label">
                    <span>${escapeHtml(label)}</span>
                    <span>${val}</span>
                  </div>
                  <div class="pb-bar-track">
                    <div class="pb-bar-fill" style="width:${Math.max(0, Math.min(100, val))}%"></div>
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
        <h3>Personalized Routine</h3>
        ${routine
          .map((step) => {
            const stepProducts = Array.isArray(step.products) ? step.products : [];

            return `
              <div class="pb-card pb-routine-step">
                <h4>Step ${escapeHtml(step.step)}: ${escapeHtml(step.name)}</h4>
                <p>${escapeHtml(step.why || "")}</p>

                ${
                  stepProducts.length
                    ? `
                    <div class="pb-products">
                      ${stepProducts
                        .map(
                          (product) => `
                            <div class="pb-product-card">
                              <div style="font-size:12px; color:#666; margin-bottom:4px;">
                                ${escapeHtml(product.brand || "")}
                              </div>
                              <div style="margin-bottom:8px;">
                                <a href="${escapeHtml(product.url || "#")}" target="_blank" rel="noopener noreferrer">
                                  ${escapeHtml(product.name || "")}
                                </a>
                              </div>
                              ${
                                product.why
                                  ? `<div class="pb-muted">${escapeHtml(product.why)}</div>`
                                  : ""
                              }
                            </div>
                          `
                        )
                        .join("")}
                    </div>
                  `
                    : `<div class="pb-muted">No matching products found for this step.</div>`
                }
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderTopProducts(products = []) {
    if (!Array.isArray(products) || !products.length) return "";

    return `
      <div class="pb-section">
        <h3>Top Product Picks</h3>
        <div class="pb-products">
          ${products
            .map(
              (product) => `
                <div class="pb-product-card">
                  <div style="font-size:12px; color:#666; margin-bottom:4px;">
                    ${escapeHtml(product.brand || "")}
                  </div>
                  <div style="margin-bottom:8px;">
                    <a href="${escapeHtml(product.url || "#")}" target="_blank" rel="noopener noreferrer">
                      ${escapeHtml(product.name || "")}
                    </a>
                  </div>
                  ${
                    product.why
                      ? `<div class="pb-muted">${escapeHtml(product.why)}</div>`
                      : ""
                  }
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderResults(data) {
    const resultsEl = document.getElementById("pb-results");

    const concerns = Array.isArray(data.concerns) ? data.concerns : [];
    const proTips = Array.isArray(data.proTips) ? data.proTips : [];
    const products = Array.isArray(data.products) ? data.products : [];
    const routine = Array.isArray(data.routine) ? data.routine : [];

    resultsEl.innerHTML = `
      <div class="pb-section">
        <h3>Your Skin Analysis</h3>

        ${renderScoreBars(data.skinScore || {})}

        <div class="pb-grid">
          <div class="pb-card">
            <strong>Skin Type</strong>
            <p>${escapeHtml(data.skinType || "—")}</p>
          </div>
          <div class="pb-card">
            <strong>Hydration</strong>
            <p>${escapeHtml(data.hydrationLevel || "—")}</p>
          </div>
          <div class="pb-card">
            <strong>Texture</strong>
            <p>${escapeHtml(data.textureScore || "—")}</p>
          </div>
          <div class="pb-card">
            <strong>Overall Health</strong>
            <p>${escapeHtml(data.overallHealth || "—")}</p>
          </div>
        </div>

        ${
          concerns.length
            ? `
            <div class="pb-section">
              <h4>Top Concerns</h4>
              <div class="pb-pill-wrap">
                ${concerns.map((c) => `<span class="pb-pill">${escapeHtml(c)}</span>`).join("")}
              </div>
            </div>
          `
            : ""
        }

        ${
          data.analysisText
            ? `
            <div class="pb-section">
              <h4>What We Noticed</h4>
              <p>${escapeHtml(data.analysisText)}</p>
            </div>
          `
            : ""
        }
      </div>

      ${renderRoutine(routine)}

      ${renderTopProducts(products)}

      ${
        proTips.length
          ? `
          <div class="pb-section">
            <h3>Pro Tips</h3>
            <ul class="pb-list">
              ${proTips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}
            </ul>
          </div>
        `
          : ""
      }

      ${
        data.disclaimer
          ? `<div class="pb-disclaimer">${escapeHtml(data.disclaimer)}</div>`
          : ""
      }
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
    setLoading("Analyzing your skin and matching products from the store...");

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
    if (!container) {
      console.warn(`Skin AI widget container #${CONTAINER_ID} not found.`);
      return;
    }

    createWidgetMarkup(container);

    const fileInput = document.getElementById("pb-file-input");
    const analyzeBtn = document.getElementById("pb-analyze-btn");

    fileInput.addEventListener("change", handleFileChange);
    analyzeBtn.addEventListener("click", handleAnalyze);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
