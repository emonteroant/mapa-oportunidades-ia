// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = "https://ecwqlqlhutiwlmmdvpoa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjd3FscWxodXRpd2xtbWR2cG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2OTY3MzQsImV4cCI6MjEwOTI3MjczNH0.hy4EtGf4hOiXj_jEyJnuplUkixU9rbiPIDefFMSS9iA";

// Inicializar cliente oficial de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado local de la aplicación
let opportunities = [];
let localLikedIds = new Set(JSON.parse(localStorage.getItem("user_liked_opportunities") || "[]"));

// Elementos del DOM
const grid = document.getElementById("opportunitiesGrid");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const resultsCount = document.getElementById("resultsCount");
const totalCountEl = document.getElementById("totalCount");
const citiesCountEl = document.getElementById("citiesCount");
const countriesCountEl = document.getElementById("countriesCount");
const toast = document.getElementById("toast");

// Modal y Formulario
const publishModal = document.getElementById("publishModal");
const btnOpenModal = document.getElementById("btnOpenModal");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancelModal = document.getElementById("btnCancelModal");
const publishForm = document.getElementById("publishForm");
const btnSubmitForm = document.getElementById("btnSubmitForm");
const submitText = document.getElementById("submitText");
const submitSpinner = document.getElementById("submitSpinner");

// Filtros
const filterSearch = document.getElementById("filterSearch");
const filterCountry = document.getElementById("filterCountry");
const filterCity = document.getElementById("filterCity");
const filterCategory = document.getElementById("filterCategory");
const filterPotential = document.getElementById("filterPotential");
const btnResetFilters = document.getElementById("btnResetFilters");
const btnRefresh = document.getElementById("btnRefresh");

// ==========================================
// FUNCIONES DE CARGA Y RENDERIZADO
// ==========================================

/**
 * Carga todas las oportunidades desde la base de datos de Supabase
 */
async function loadOpportunities() {
  try {
    setLoading(true);

    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al consultar Supabase:", error);
      showToast("Error al cargar las oportunidades desde Supabase", "error");
      return;
    }

    opportunities = data || [];
    updateFilterDropdowns();
    renderFilteredOpportunities();
    updateStatistics();
  } catch (err) {
    console.error("Error inesperado:", err);
    showToast("Error de conexión con el servidor", "error");
  } finally {
    setLoading(false);
  }
}

/**
 * Renderiza la lista filtrada de oportunidades
 */
function renderFilteredOpportunities() {
  const searchTerm = filterSearch.value.trim().toLowerCase();
  const selectedCountry = filterCountry.value;
  const selectedCity = filterCity.value;
  const selectedCategory = filterCategory.value;
  const selectedPotential = filterPotential.value;

  const filtered = opportunities.filter((op) => {
    if (selectedCountry && op.country !== selectedCountry) return false;
    if (selectedCity && op.city !== selectedCity) return false;
    if (selectedCategory && op.category !== selectedCategory) return false;
    if (selectedPotential && op.potential !== selectedPotential) return false;

    if (searchTerm) {
      const matchName = (op.name || "").toLowerCase().includes(searchTerm);
      const matchProblem = (op.problem || "").toLowerCase().includes(searchTerm);
      const matchSolution = (op.ai_solution || "").toLowerCase().includes(searchTerm);
      const matchCity = (op.city || "").toLowerCase().includes(searchTerm);
      const matchCountry = (op.country || "").toLowerCase().includes(searchTerm);
      if (!matchName && !matchProblem && !matchSolution && !matchCity && !matchCountry) {
        return false;
      }
    }

    return true;
  });

  resultsCount.textContent = `${filtered.length} oportunidad${filtered.length === 1 ? "" : "es"} encontrada${filtered.length === 1 ? "" : "s"}`;

  if (filtered.length === 0) {
    grid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  grid.innerHTML = filtered.map(createOpportunityCardHtml).join("");

  // Añadir eventos a los botones de like
  grid.querySelectorAll(".btn-like").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      handleLike(id);
    });
  });
}

/**
 * Genera el HTML de una tarjeta de oportunidad
 */
function createOpportunityCardHtml(op) {
  const isLiked = localLikedIds.has(String(op.id));
  const potentialClass = (op.potential || "medio").toLowerCase();
  const dateFormatted = formatDate(op.created_at);

  return `
    <article class="card" id="card-${op.id}">
      <div>
        <div class="card-top">
          <div class="badges-row">
            <span class="badge badge-cat">${escapeHtml(op.category || "General")}</span>
            <span class="badge badge-potential-${potentialClass}">Potencial ${escapeHtml(op.potential || "Medio")}</span>
          </div>
        </div>

        <h3 class="card-title">${escapeHtml(op.name)}</h3>
        <div class="card-location">
          <span>📍</span>
          <span><strong>${escapeHtml(op.city)}</strong>, ${escapeHtml(op.country)}</span>
        </div>

        <div class="card-section">
          <div class="card-section-label">Problema Detectado</div>
          <p class="card-section-text">${escapeHtml(op.problem)}</p>
        </div>

        <div class="ai-solution-box">
          <div class="ai-solution-label">
            <span>✨</span> Solución con IA
          </div>
          <p class="ai-solution-text">${escapeHtml(op.ai_solution)}</p>
        </div>
      </div>

      <div class="card-footer">
        <span class="card-date">${dateFormatted}</span>
        <button class="btn-like ${isLiked ? 'liked' : ''}" data-id="${op.id}" title="Apoyar esta oportunidad">
          <span>❤️</span>
          <span class="like-count" id="like-count-${op.id}">${op.likes || 0}</span>
        </button>
      </div>
    </article>
  `;
}

/**
 * Actualiza los dropdowns de país y ciudad según los datos actuales
 */
function updateFilterDropdowns() {
  const currentCountry = filterCountry.value;
  const currentCity = filterCity.value;

  const countries = [...new Set(opportunities.map((o) => o.country).filter(Boolean))].sort();
  const cities = [...new Set(opportunities.map((o) => o.city).filter(Boolean))].sort();

  filterCountry.innerHTML = `<option value="">Todos los países (${countries.length})</option>` +
    countries.map((c) => `<option value="${escapeHtml(c)}" ${c === currentCountry ? 'selected' : ''}>${escapeHtml(c)}</option>`).join("");

  filterCity.innerHTML = `<option value="">Todas las ciudades (${cities.length})</option>` +
    cities.map((c) => `<option value="${escapeHtml(c)}" ${c === currentCity ? 'selected' : ''}>${escapeHtml(c)}</option>`).join("");
}

/**
 * Actualiza las tarjetas numéricas de estadísticas
 */
function updateStatistics() {
  totalCountEl.textContent = opportunities.length;
  const uniqueCities = new Set(opportunities.map((o) => (o.city || "").trim().toLowerCase()).filter(Boolean));
  citiesCountEl.textContent = uniqueCities.size;
  const uniqueCountries = new Set(opportunities.map((o) => (o.country || "").trim().toLowerCase()).filter(Boolean));
  countriesCountEl.textContent = uniqueCountries.size;
}

// ==========================================
// ACCIONES: PUBLICAR Y DAR LIKE EN SUPABASE
// ==========================================

/**
 * Publica una nueva oportunidad en Supabase
 */
publishForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("opName").value.trim();
  const city = document.getElementById("opCity").value.trim();
  const country = document.getElementById("opCountry").value.trim();
  const category = document.getElementById("opCategory").value;
  const potential = document.getElementById("opPotential").value;
  const problem = document.getElementById("opProblem").value.trim();
  const aiSolution = document.getElementById("opSolution").value.trim();

  if (!name || !city || !country || !problem || !aiSolution || !category || !potential) {
    showToast("Por favor completa todos los campos requeridos.", "error");
    return;
  }

  try {
    setFormSubmitting(true);

    const newOpportunity = {
      name,
      city,
      country,
      category,
      potential,
      problem,
      ai_solution: aiSolution,
      likes: 0
    };

    const { data, error } = await supabase
      .from("opportunities")
      .insert([newOpportunity])
      .select();

    if (error) {
      console.error("Error al insertar en Supabase:", error);
      showToast("Error al guardar en Supabase: " + error.message, "error");
      return;
    }

    showToast("¡Oportunidad publicada en Supabase con éxito!", "success");
    publishForm.reset();
    closePublishModal();

    // Recargar la lista completa desde Supabase para garantizar sincronización global
    await loadOpportunities();
  } catch (err) {
    console.error("Error inesperado al publicar:", err);
    showToast("Error de conexión al publicar.", "error");
  } finally {
    setFormSubmitting(false);
  }
});

/**
 * Gestiona el incremento de likes en Supabase
 */
async function handleLike(id) {
  const numericId = Number(id);
  const targetOp = opportunities.find((o) => o.id === numericId);
  if (!targetOp) return;

  const likeBtn = document.querySelector(`.btn-like[data-id="${id}"]`);
  const likeCountEl = document.getElementById(`like-count-${id}`);

  // Actualización optimista en la interfaz
  const previousLikes = targetOp.likes || 0;
  const newLikes = previousLikes + 1;
  targetOp.likes = newLikes;
  if (likeCountEl) likeCountEl.textContent = newLikes;
  if (likeBtn) likeBtn.classList.add("liked");

  // Registrar localmente para resaltar
  localLikedIds.add(String(id));
  localStorage.setItem("user_liked_opportunities", JSON.stringify([...localLikedIds]));

  try {
    // Intentar invocar función atómica RPC primero
    const { data, error } = await supabase.rpc("increment_likes", { row_id: numericId });

    if (error) {
      console.warn("RPC falló, usando actualización directa en tabla:", error);
      // Fallback a UPDATE directo
      const { updateError } = await supabase
        .from("opportunities")
        .update({ likes: newLikes })
        .eq("id", numericId);

      if (updateError) throw updateError;
    } else if (typeof data === "number") {
      targetOp.likes = data;
      if (likeCountEl) likeCountEl.textContent = data;
    }

    showToast("¡Like registrado en Supabase!", "success");
  } catch (err) {
    console.error("Error al actualizar like en Supabase:", err);
    // Revertir en caso de fallo
    targetOp.likes = previousLikes;
    if (likeCountEl) likeCountEl.textContent = previousLikes;
    showToast("No se pudo actualizar el like en Supabase", "error");
  }
}

// ==========================================
// GESTIÓN DEL MODAL Y EVENTOS
// ==========================================

function openPublishModal() {
  publishModal.classList.remove("hidden");
  document.getElementById("opName").focus();
}

function closePublishModal() {
  publishModal.classList.add("hidden");
}

window.openPublishModal = openPublishModal;

btnOpenModal.addEventListener("click", openPublishModal);
btnCloseModal.addEventListener("click", closePublishModal);
btnCancelModal.addEventListener("click", closePublishModal);

publishModal.addEventListener("click", (e) => {
  if (e.target === publishModal) closePublishModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !publishModal.classList.contains("hidden")) {
    closePublishModal();
  }
});

// Eventos de filtros
[filterSearch, filterCountry, filterCity, filterCategory, filterPotential].forEach((el) => {
  el.addEventListener("input", renderFilteredOpportunities);
  el.addEventListener("change", renderFilteredOpportunities);
});

btnResetFilters.addEventListener("click", () => {
  filterSearch.value = "";
  filterCountry.value = "";
  filterCity.value = "";
  filterCategory.value = "";
  filterPotential.value = "";
  renderFilteredOpportunities();
});

btnRefresh.addEventListener("click", () => {
  loadOpportunities();
  showToast("Datos sincronizados con Supabase", "success");
});

// ==========================================
// UTILIDADES
// ==========================================

function setLoading(isLoading) {
  if (isLoading) {
    loadingState.classList.remove("hidden");
    grid.classList.add("hidden");
    emptyState.classList.add("hidden");
  } else {
    loadingState.classList.add("hidden");
    grid.classList.remove("hidden");
  }
}

function setFormSubmitting(isSubmitting) {
  btnSubmitForm.disabled = isSubmitting;
  if (isSubmitting) {
    submitText.textContent = "Guardando...";
    submitSpinner.classList.remove("hidden");
  } else {
    submitText.textContent = "Publicar en Supabase";
    submitSpinner.classList.add("hidden");
  }
}

function showToast(message, type = "info") {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3500);
}

function formatDate(dateStr) {
  if (!dateStr) return "Reciente";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Iniciar carga al abrir la app
document.addEventListener("DOMContentLoaded", () => {
  loadOpportunities();

  // Escuchar cambios en tiempo real desde Supabase si la suscripción está disponible
  try {
    supabase
      .channel("public:opportunities")
      .on("postgres_changes", { event: "*", schema: "public", table: "opportunities" }, (payload) => {
        console.log("Cambio detectado en Supabase en tiempo real:", payload);
        loadOpportunities();
      })
      .subscribe();
  } catch (e) {
    console.log("Suscripción en tiempo real opcional omitida:", e);
  }
});
