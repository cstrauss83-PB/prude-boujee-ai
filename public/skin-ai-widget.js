(function () {
  const API_URL = "/api/skin-analysis";
  const CONTAINER_ID = "skin-ai-widget";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function createWidgetMarkup(container) {
    container.innerHTML = `
      <div class="pb-skin-widget">
        <input id="pb-file-input" type="file" accept="image/*" />
        <button id="pb-analyze-btn">Analyse My Skin</button>
        <div id="pb-status"></div>
        <div id="pb-results"></div>
      </div>
    `;
  }

  function setStatus(msg) {
    document.getElementById("pb-status").innerHTML = msg || "";
  }

  function normalizeArray(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return String(v).split(",").map(x=>x.trim()).filter(Boolean);
  }

  function renderRoutine(routine = []) {
    if (!Array.isArray(routine) || !routine.length) return "";

    return `
      <div class="pb-section">
        <h3>Your Routine</h3>
        ${routine.map((step,index)=>`
          <div class="pb-routine-item">
            <div>
              <strong>${index+1}. ${escapeHtml(step.name)}</strong>
              <div>${escapeHtml(step.why || "")}</div>
            </div>

            <div class="pb-products">
              ${(step.products || []).map(product => `
                <div class="pb-product-card">

                  <div><strong>${escapeHtml(product.brand || "")}</strong></div>

                  <div>${escapeHtml(product.name || "")}</div>

                  <div>${escapeHtml(product.why || "")}</div>

                  <div>
                    <a
                      href="${escapeHtml(product.url || "#")}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Review Item
                    </a>
                  </div>

                </div>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderResults(data) {
    const routine = Array.isArray(data.routine) ? data.routine : [];

    document.getElementById("pb-results").innerHTML = `
      <div>
        <h3>Skin Type: ${escapeHtml(data.skinType || "")}</h3>
        <p>${escapeHtml(data.analysisText || "")}</p>
      </div>

      ${renderRoutine(routine)}
    `;
  }

  async function handleAnalyze() {
    const fileInput = document.getElementById("pb-file-input");
    const file = fileInput.files?.[0];

    if (!file) {
      setStatus("Please upload a photo.");
      return;
    }

    setStatus("Analyzing...");

    const reader = new FileReader();

    reader.onload = async function (e) {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: e.target.result })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Analysis failed");

        setStatus("");
        renderResults(data);

      } catch (err) {
        setStatus("Analysis failed: " + err.message);
      }
    };

    reader.readAsDataURL(file);
  }

  function init() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    createWidgetMarkup(container);

    document
      .getElementById("pb-analyze-btn")
      .addEventListener("click", handleAnalyze);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();