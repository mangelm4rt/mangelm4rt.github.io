const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const book = document.querySelector("#book");
const themeToggle = document.querySelector("#themeToggle");
const papers = Array.from(document.querySelectorAll(".paper"));

let currentLocation = 1;
const maxLocation = papers.length + 1;
const pageTurnDuration = 1050;

papers.forEach((paper, index) => {
    paper.style.zIndex = papers.length - index;
});

// === Virtualizacion de hojas (clave para iOS / WebKit) ===
// iOS revienta si mantiene las 72 hojas en una escena 3D (preserve-3d) a la vez.
// Renderizamos solo una ventana alrededor de la pagina actual; el resto se saca
// del render con display:none. Asi WebKit maneja ~13 hojas en vez de 72.
const VIRTUAL_BUFFER = 6;
let fontsReady = false;
function updatePaperVisibility() {
    const center = currentLocation - 1; // indice de la hoja actual
    for (let i = 0; i < papers.length; i++) {
        const visible = i >= center - VIRTUAL_BUFFER && i <= center + VIRTUAL_BUFFER;
        papers[i].style.display = visible ? "" : "none";
        if (visible && fontsReady && !papers[i].dataset.fitted) fitPaper(papers[i]);
    }
}

// === Ajuste de seguridad de la fuente ===
// Con la letra mas grande, algun canto denso podria pasarse del borde. Esta
// funcion mide cada hoja en su espacio real y, SOLO si se desborda (alto o
// ancho), la reduce lo justo para que no se corte. Nunca agranda. Se aplica
// cuando la hoja se hace visible (no se puede medir una hoja en display:none).
function vMargin(el) {
    const s = getComputedStyle(el);
    return parseFloat(s.marginTop || 0) + parseFloat(s.marginBottom || 0);
}
function fitPaper(paper) {
    const face = paper.querySelector(".front");
    if (!face) return;
    const content = face.querySelector(".song-page, .song-sheet, .song-two, .lyrics");
    if (!content) return;
    content.style.transformOrigin = "top center";
    content.style.transform = "none"; // reset para medir natural
    const cs = getComputedStyle(face);
    let availH = face.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const header = face.querySelector(".header");
    const footer = face.querySelector(".footer");
    if (header) availH -= header.offsetHeight + vMargin(header);
    if (footer) availH -= footer.offsetHeight + vMargin(footer);
    const boxW = content.clientWidth;   // ancho propio del bloque
    const fullW = content.scrollWidth;  // ancho real (lineas largas)
    const fullH = content.scrollHeight; // alto real del contenido
    if (!boxW || !fullW || !fullH || availH <= 0) return; // oculto / sin layout
    const scale = Math.min(1, boxW / fullW, availH / fullH);
    content.style.transform = scale < 0.995 ? "scale(" + scale.toFixed(4) + ")" : "none";
    paper.dataset.fitted = "1";
}
function refitVisible() {
    papers.forEach((p) => {
        if (p.style.display !== "none") { delete p.dataset.fitted; fitPaper(p); }
    });
}

// --- Escala responsiva con 3 modos ---
// 1) Desktop / móvil horizontal: libro abierto (dos páginas)
// 2) Móvil vertical: una sola página a la vez
function isSinglePageMode() {
    // Una sola pagina en moviles y tablets, en CUALQUIER orientacion.
    // CLAVE: el lado MAS CORTO de la pantalla. En un telefono ese lado siempre
    // es pequeno (este vertical u horizontal ~430px); en un monitor de PC es
    // grande (~1080px). Esto NO depende de detectar "tactil" (que puede fallar
    // en iPad o segun la orientacion) ni de la orientacion: es a prueba de fallos.
    const shortSide = Math.min(window.innerWidth, window.innerHeight);
    const touch = (navigator.maxTouchPoints || 0) > 0
        || window.matchMedia("(any-pointer: coarse)").matches;
    return shortSide <= 900 || touch;
}

function getViewportSize() {
    const root = document.querySelector(".container") || document.documentElement;
    return {
        width: root.clientWidth || window.innerWidth,
        height: root.clientHeight || window.innerHeight,
    };
}

function getBookMetrics() {
    const styles = window.getComputedStyle(book);
    return {
        pageW: parseFloat(styles.width) || 500,
        bookH: parseFloat(styles.height) || 650,
    };
}

function getScaleOpen() {
    const viewport = getViewportSize();
    const { pageW, bookH } = getBookMetrics();
    const scaleW = (viewport.width * 0.95) / pageW;
    const scaleH = (viewport.height * 0.90) / bookH;
    return Math.min(1, scaleW, scaleH);
}

function getScaleSingle() {
    const viewport = getViewportSize();
    const { pageW, bookH } = getBookMetrics();
    const reservedBottom = 48;
    const usableHeight = Math.max(viewport.height - reservedBottom, viewport.height * 0.82);
    const scaleW = (viewport.width * 0.995) / pageW;
    const scaleH = (usableHeight * 0.995) / bookH;
    return Math.min(scaleW, scaleH);
}

function applyScale() {
    if (isSinglePageMode()) {
        applyScaleSingle();
    } else {
        applyScaleOpen();
    }
}

const container = document.querySelector(".container");

function applyScaleOpen() {
    const s = getScaleOpen();
    const { pageW } = getBookMetrics();
    document.body.classList.remove("single-page");
    const isOpen = currentLocation > 1 && currentLocation <= papers.length;
    const isEnd  = currentLocation > papers.length;
    if (isOpen) {
        book.style.transform = `translateX(50%) translateZ(0) scale(${s})`;
        // Al escalar, el centro del libro abierto se corre 250*(1-s)px a la
        // derecha. Compensamos moviendo el container esa cantidad a la izquierda
        // para que el libro abierto quede centrado en cualquier pantalla.
        container.style.transform = `translateX(-${(pageW / 2) * (1 - s)}px)`;
    } else if (isEnd) {
        book.style.transform = `translateX(100%) translateZ(0) scale(${s})`;
        container.style.transform = `translateX(-${pageW * (1 - s)}px)`;
    } else {
        book.style.transform = `translateX(0%) translateZ(0) scale(${s})`;
        container.style.transform = "translateX(0)";
    }
}

// En móvil vertical mostramos solo una página centrada.
// El .book mide 500px (una página). Con translateX(0) el flex del
// container lo centra perfecto, y las páginas volteadas (que giran
// sobre el lomo izquierdo) muestran su contenido al voltear.
function applyScaleSingle() {
    const s = getScaleSingle();
    document.body.classList.add("single-page");
    container.style.transform = "translateX(0)";
    book.style.transform = `translateX(0%) translateZ(0) scale(${s})`;
}

let refitTimer = null;
window.addEventListener('resize', () => {
    applyScale();
    clearTimeout(refitTimer);
    refitTimer = window.setTimeout(refitVisible, 200);
});
window.addEventListener('orientationchange', () => setTimeout(() => { applyScale(); refitVisible(); }, 160));
// Detector de giro a prueba de fallos: matchMedia avisa de forma confiable
// cuando cambia la orientacion, asi re-aplicamos el modo (una pagina) al girar.
try {
    window.matchMedia("(orientation: landscape)").addEventListener("change", () => {
        applyScale();
        refitVisible();
    });
} catch (e) { /* navegadores viejos: ya cubierto por resize/orientationchange */ }
// -------------------------

function setTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    themeToggle.setAttribute(
        "aria-label",
        isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
    );

    try {
        localStorage.setItem("cantoral-theme", isDark ? "dark" : "light");
    } catch {
        // Si el navegador bloquea el guardado, el botón sigue funcionando.
    }
}

function loadTheme() {
    try {
        setTheme(localStorage.getItem("cantoral-theme") === "dark");
    } catch {
        setTheme(false);
    }
}

let turnSeq = 0;
function animatePaper(paper, restingZ) {
    paper.classList.add("turning");
    // Durante el giro la hoja va ENCIMA de todo para que la animacion siempre
    // se vea (antes quedaba tapada por el monton y no se notaba en las primeras
    // ~30 paginas). La mas reciente queda arriba; al terminar baja a su z de reposo.
    paper.style.zIndex = papers.length + 100 + (++turnSeq);
    window.setTimeout(() => {
        paper.classList.remove("turning");
        paper.style.zIndex = restingZ;
    }, pageTurnDuration);
}

function openBook() {
    if (isSinglePageMode()) { applyScaleSingle(); return; }
    const s = getScaleOpen();
    const { pageW } = getBookMetrics();
    book.style.transform = `translateX(50%) translateZ(0) scale(${s})`;
    container.style.transform = `translateX(-${(pageW / 2) * (1 - s)}px)`;
}

function closeBook(isAtBeginning) {
    if (isSinglePageMode()) { applyScaleSingle(); return; }
    const s = getScaleOpen();
    const { pageW } = getBookMetrics();
    if (isAtBeginning) {
        book.style.transform = `translateX(0%) translateZ(0) scale(${s})`;
        container.style.transform = "translateX(0)";
    } else {
        book.style.transform = `translateX(100%) translateZ(0) scale(${s})`;
        container.style.transform = `translateX(-${pageW * (1 - s)}px)`;
    }
}

function goNextPage() {
    if (currentLocation >= maxLocation) return;

    if (currentLocation === 1) {
        openBook();
    }

    const paper = papers[currentLocation - 1];
    paper.classList.add("flipped");
    animatePaper(paper, currentLocation);

    if (currentLocation === papers.length) {
        closeBook(false);
    }

    currentLocation++;
    updatePaperVisibility();
}

function goPrevPage() {
    if (currentLocation <= 1) return;

    currentLocation--;

    if (currentLocation === 1) {
        closeBook(true);
    } else {
        openBook();
    }

    const paper = papers[currentLocation - 1];
    paper.classList.remove("flipped");
    animatePaper(paper, papers.length + 2 - currentLocation);
    updatePaperVisibility();
}

loadTheme();
applyScale(); // aplica la escala inicial
updatePaperVisibility(); // render inicial solo de las hojas cercanas

// Cuando carguen las fuentes, ajustar (encoger si hace falta) las hojas visibles.
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    fontsReady = true;
    papers.forEach((p) => { if (p.style.display !== "none" && !p.dataset.fitted) fitPaper(p); });
});
themeToggle.addEventListener("click", () => {
    setTheme(!document.body.classList.contains("dark-mode"));
});
nextBtn.addEventListener("click", goNextPage);
prevBtn.addEventListener("click", goPrevPage);

// === Navegación con flechas del teclado ===
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
        goNextPage();
    } else if (e.key === "ArrowLeft") {
        goPrevPage();
    } else if (e.key === "Escape") {
        closeSearch();
    }
});

// === Búsqueda inteligente con IA ===
const searchBtn     = document.querySelector("#searchBtn");
const searchOverlay = document.querySelector("#searchOverlay");
const searchInput   = document.querySelector("#searchInput");
const searchClear   = document.querySelector("#searchClear");
const searchResults = document.querySelector("#searchResults");

// ── Mapa de secciones por rango de número de canto ──
// Actualiza los rangos cada vez que agregues nuevas secciones.
const SECTION_MAP = [
    { label: "Entrada — Tiempo Ordinario", aliases: ["ordinario","tiempo ordinario","entrada ordinario"], from: 1,  to: 24  },
    { label: "Entrada — Adviento",         aliases: ["adviento","entrada adviento"],                    from: 25, to: 30  },
    { label: "Entrada — Navidad",          aliases: ["navidad","entrada navidad"],                      from: 31, to: 35  },
    { label: "Entrada — Cuaresma",         aliases: ["cuaresma","entrada cuaresma"],                    from: 36, to: 40  },
    { label: "Entrada — Pascua",           aliases: ["pascua","entrada pascua"],                        from: 41, to: 44  },
    { label: "Kirie Eleison",              aliases: ["kirie","kyrie","kirie eleison","kyrie eleison","kirie eleyson","kyrie eleyson","señor ten piedad"], from: 45, to: 60  },
    { label: "Gloria",                     aliases: ["gloria","gloria a dios","gloria al señor"],        from: 61, to: 66  },
    { label: "Aleluya",                    aliases: ["aleluya","alleluya","alleluia","aleluia","halleluya"], from: 67, to: 999 },
];

function getSectionForSong(songNum) {
    const n = parseInt(songNum, 10);
    if (isNaN(n)) return null;
    return SECTION_MAP.find(s => n >= s.from && n <= s.to) || null;
}

// ── Normalizar texto: sin acentos, minúsculas, sin puntuación extra ──
function norm(str) {
    return (str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// ── Distancia de Levenshtein (fuzzy) ──
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i-1] === b[j-1]
                ? dp[i-1][j-1]
                : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
}

// ── ¿Dos palabras son fuzzy-similares? (tolera 1-2 errores según longitud) ──
function fuzzyMatch(a, b) {
    a = norm(a); b = norm(b);
    if (a === b) return true;
    if (b.includes(a) || a.includes(b)) return true;
    const threshold = a.length <= 4 ? 1 : a.length <= 7 ? 2 : 3;
    return levenshtein(a, b) <= threshold;
}

// ── Score de coincidencia de una query contra una entrada del corpus ──
function scoreEntry(entry, qNorm, qWords) {
    let score = 0;
    const titleN  = norm(entry.titleText);
    const lyricsN = norm(entry.lyrics);
    const section = entry.section;
    const sectionN = section ? norm(section.label) : "";
    const sectionAliases = section ? section.aliases : [];

    // — Coincidencia exacta de sección (mayor peso) —
    if (sectionN && qNorm.includes(sectionN)) score += 20;
    for (const alias of sectionAliases) {
        if (qNorm.includes(alias)) { score += 18; break; }
    }

    // — Coincidencia exacta en título y letra —
    if (titleN.includes(qNorm))  score += 12;
    if (lyricsN.includes(qNorm)) score += 8;

    // — Por cada palabra del query —
    for (const word of qWords) {
        if (word.length < 3) continue;

        // Exacta en sección
        if (sectionN.includes(word)) score += 6;
        for (const alias of sectionAliases) {
            if (alias.includes(word) || word.includes(alias)) { score += 5; break; }
        }

        // Exacta en título/letra
        if (titleN.includes(word))  score += 4;
        if (lyricsN.includes(word)) score += 2;

        // Fuzzy en sección
        for (const alias of sectionAliases) {
            if (fuzzyMatch(word, alias)) { score += 4; break; }
        }
        // Fuzzy en palabras del título
        for (const tw of titleN.split(" ")) {
            if (tw.length > 2 && fuzzyMatch(word, tw)) { score += 3; break; }
        }
        // Fuzzy en palabras de la letra
        for (const lw of lyricsN.split(" ")) {
            if (lw.length > 3 && fuzzyMatch(word, lw)) { score += 1; break; }
        }
    }
    return score;
}

// ── Construir corpus desde el DOM ──
function buildCorpus() {
    const corpus = [];
    document.querySelectorAll(".song-title[data-song]").forEach((titleEl) => {
        const songNum   = titleEl.dataset.song;
        const titleText = titleEl.textContent.trim();
        const face      = titleEl.closest(".front, .back");
        const lyrics    = [];
        if (face) {
            face.querySelectorAll(".lyric-row, .plain-block p, .short-grid .lyric-row").forEach((el) => {
                const t = el.textContent.trim();
                if (t) lyrics.push(t);
            });
        }
        let pageNum = "";
        if (face) {
            const paper  = face.closest(".paper");
            const footer = paper ? paper.querySelector(".page-num") : null;
            pageNum = footer ? footer.textContent.trim() : "";
        }
        const section = getSectionForSong(songNum);
        corpus.push({ songNum, titleText, lyrics: lyrics.join(" "), pageNum, section });
    });
    return corpus;
}

const CORPUS = buildCorpus();

// ── Búsqueda local ──
function localSearch(q) {
    const qNorm  = norm(q);
    const qWords = qNorm.split(" ").filter(w => w.length >= 2);
    return CORPUS
        .map(entry => {
            const score   = scoreEntry(entry, qNorm, qWords);
            // Snippet donde aparece la query en la letra
            let snippet = "";
            const lyricsN = norm(entry.lyrics);
            const idx = lyricsN.indexOf(qNorm);
            if (idx >= 0) {
                const start = Math.max(0, idx - 15);
                snippet = "..." + entry.lyrics.substring(start, start + 80) + "...";
            } else if (entry.section) {
                snippet = entry.section.label;
            }
            return { ...entry, score, snippet };
        })
        .filter(e => e.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
}

// ── Búsqueda con IA ──
async function aiSearch(q) {
    const corpusText = CORPUS.map(c =>
        `[${c.songNum}] (${c.section ? c.section.label : "sin sección"}) ${c.titleText}: ${c.lyrics.substring(0, 150)}`
    ).join("\n");

    const prompt = `Eres asistente de un cantoral católico. El usuario busca: "${q}"

Corpus de cantos (número, sección, título, letra parcial):
${corpusText}

Instrucciones:
- Busca por letra, título Y sección (ej: "Kirie Eleyson F" = sección Kirie Eleison, canto F)
- Acepta variaciones ortográficas: Eleyson=Eleison, Kyrie=Kirie
- Devuelve SOLO JSON válido sin markdown:
{"results":[{"songNum":"N","reason":"frase relevante máx 60 chars"}]}
Máximo 5 resultados. Sin coincidencias: {"results":[]}`;

    try {
        searchResults.innerHTML = `<div class="search-thinking">✨ Buscando...</div>`;
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 500,
                messages: [{ role: "user", content: prompt }]
            })
        });
        const data  = await resp.json();
        const text  = data.content.map(i => i.text || "").join("");
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        if (!parsed.results?.length) { renderResults(localSearch(q), false); return; }
        const enriched = parsed.results
            .map(r => {
                const entry = CORPUS.find(c => c.songNum === String(r.songNum));
                return entry ? { ...entry, snippet: r.reason, score: 10 } : null;
            })
            .filter(Boolean);
        renderResults(enriched, true);
    } catch {
        renderResults(localSearch(q), false);
    }
}

// ── Render de resultados ──
function renderResults(hits, fromAI) {
    if (!hits.length) {
        searchResults.innerHTML = `<div class="search-thinking">Sin resultados 🎵</div>`;
        return;
    }
    searchResults.innerHTML = hits.map(h => `
        <div class="search-result-item" data-song="${h.songNum}">
            <div class="search-result-title">${h.titleText}</div>
            ${h.section ? `<div class="search-result-page" style="color:var(--chord);opacity:1;font-weight:600">${h.section.label}</div>` : ""}
            ${h.snippet && h.snippet !== (h.section?.label || "") ? `<div class="search-result-snippet">${h.snippet}</div>` : ""}
            <div class="search-result-page">Página ${h.pageNum}</div>
        </div>
    `).join("") + (fromAI ? `<div class="search-thinking" style="border-top:1px solid var(--header-line);padding:6px 14px;font-size:0.65rem">✨ resultado IA</div>` : "");
    searchResults.querySelectorAll(".search-result-item").forEach(item => {
        item.addEventListener("click", () => { goToSong(item.dataset.song); closeSearch(); });
    });
}

// ── Controles UI ──
function openSearch()  { searchOverlay.classList.add("active"); searchInput.focus(); }
function closeSearch() { searchOverlay.classList.remove("active"); searchInput.value = ""; searchResults.innerHTML = ""; }

searchBtn.addEventListener("click", () =>
    searchOverlay.classList.contains("active") ? closeSearch() : openSearch()
);
searchClear.addEventListener("click", closeSearch);
searchOverlay.addEventListener("click", e => e.stopPropagation());

let searchTimeout = null;
searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    const q = searchInput.value.trim();
    if (!q) { searchResults.innerHTML = ""; return; }
    renderResults(localSearch(q), false);
    searchTimeout = window.setTimeout(() => aiSearch(q), 600);
});

// === Navegación animada hacia una página específica ===
// El índice está en currentLocation = 4 (se recorrió +1 al agregar la pasta).
const INDEX_LOCATION = 4;
const stepDelay = 230;
let isAnimating = false;

function goToPage(target) {
    if (isAnimating) return;
    target = Math.max(1, Math.min(maxLocation, target));
    if (target === currentLocation) return;

    isAnimating = true;
    const forward = target > currentLocation;
    const stepFn = forward ? goNextPage : goPrevPage;

    const step = () => {
        if (currentLocation === target) {
            isAnimating = false;
            return;
        }
        stepFn();
        window.setTimeout(step, stepDelay);
    };
    step();
}

// === Botón de índice fijo (barra superior) ===
const indexBtn = document.querySelector("#indexBtn");
if (indexBtn) {
    indexBtn.addEventListener("click", () => goToPage(INDEX_LOCATION));
}

// === Resolver dinámicamente la posición de un canto/sección ===
// Esto es lo que permite escalar a 354+ cantos: el JS calcula el
// currentLocation cada vez consultando el DOM en vivo, así que insertar,
// mover o reordenar hojas no rompe nada — mientras cada canto tenga su
// data-song y cada sección su data-section.

function locationOfFace(face) {
    const paper = face.closest(".paper");
    if (!paper) return null;
    const paperIndex = papers.indexOf(paper); // 0-indexed
    if (paperIndex < 0) return null;
    const isFront = face.classList.contains("front");
    // Front del paper #K (1-indexed) → cl = K  | Back → cl = K+1
    return paperIndex + 1 + (isFront ? 0 : 1);
}

function locationOfSong(songNumber) {
    const title = document.querySelector(`.song-title[data-song="${songNumber}"]`);
    if (!title) return null;
    const face = title.closest(".front, .back");
    return face ? locationOfFace(face) : null;
}

function locationOfSection(sectionName) {
    const el = document.querySelector(`[data-section="${sectionName}"]`);
    if (!el) return null;
    const face = el.closest(".front, .back");
    return face ? locationOfFace(face) : null;
}

function goToSong(songNumber) {
    const target = locationOfSong(songNumber);
    if (target !== null) goToPage(target);
}

function goToSection(sectionName) {
    const target = locationOfSection(sectionName);
    if (target !== null) goToPage(target);
}

// === Listeners para los enlaces del índice ===
function attachIndexLinks() {
    document.querySelectorAll(".index-entry").forEach((entry) => {
        entry.addEventListener("click", (e) => {
            e.preventDefault();
            const songTarget = entry.dataset.songTarget;
            if (songTarget) {
                goToSong(songTarget);
                return;
            }
            // Fallback al esquema viejo si alguna entrada conserva data-target
            const target = parseInt(entry.dataset.target, 10);
            if (!isNaN(target)) goToPage(target);
        });
    });
}

attachIndexLinks();

// === Menu unico de controles (tema / indice / busqueda) ===
// Un solo boton transparente en la esquina. Se abre al tocarlo y se oculta
// solo cuando dejas de interactuar (inactividad, salir con el cursor, o tocar
// fuera) para no distraer la lectura.
const topControls = document.querySelector("#topControls");
const menuBtn = document.querySelector("#menuBtn");
let menuCloseTimer = null;

function scheduleMenuClose(delay = 3000) {
    clearTimeout(menuCloseTimer);
    menuCloseTimer = window.setTimeout(closeMenu, delay);
}

function openMenu() {
    topControls.classList.add("menu-open");
    menuBtn.setAttribute("aria-expanded", "true");
    scheduleMenuClose();
}

function closeMenu() {
    clearTimeout(menuCloseTimer);
    topControls.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
    if (topControls.classList.contains("menu-open")) closeMenu();
    else openMenu();
}

if (menuBtn && topControls) {
    menuBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });

    // Mientras se interactua dentro del menu, se mantiene abierto
    topControls.addEventListener("pointerdown", () => {
        if (topControls.classList.contains("menu-open")) scheduleMenuClose();
    });
    topControls.addEventListener("mousemove", () => {
        if (topControls.classList.contains("menu-open")) scheduleMenuClose();
    });
    // Escritorio: al salir el cursor del area, cerrar pronto
    topControls.addEventListener("mouseleave", () => {
        if (topControls.classList.contains("menu-open")) scheduleMenuClose(600);
    });

    // Tocar / hacer clic fuera del menu lo cierra de inmediato
    document.addEventListener("pointerdown", (e) => {
        if (topControls.classList.contains("menu-open") && !topControls.contains(e.target)) {
            closeMenu();
        }
    });

    // Elegir indice o abrir busqueda cierra el menu (la busqueda tiene su overlay)
    document.querySelector("#indexBtn")?.addEventListener("click", () => closeMenu());
    document.querySelector("#searchBtn")?.addEventListener("click", () => closeMenu());
}

// === Navegacion por deslizamiento (swipe) ===
// Deslizar de DERECHA a IZQUIERDA = avanzar pagina.
// Deslizar de IZQUIERDA a DERECHA = retroceder pagina.
// Ignora: multitouch (pinch para zoom), gestos mas verticales que horizontales
// (scroll), y cuando la busqueda esta abierta.
(function setupSwipe() {
    const SWIPE_MIN = 50; // distancia horizontal minima (px) para contar como swipe
    let startX = 0, startY = 0, tracking = false;

    document.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) { tracking = false; return; } // pinch -> ignorar
        // si el toque empieza en el menu o en la busqueda, no es swipe de lectura
        if (e.target.closest && e.target.closest("#topControls, #searchOverlay")) {
            tracking = false; return;
        }
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        tracking = true;
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
        if (e.touches.length > 1) tracking = false; // se convirtio en pinch
    }, { passive: true });

    document.addEventListener("touchend", (e) => {
        if (!tracking) return;
        tracking = false;
        if (typeof searchOverlay !== "undefined" && searchOverlay
            && searchOverlay.classList.contains("active")) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) < SWIPE_MIN) return;          // movimiento muy corto
        if (Math.abs(dx) <= Math.abs(dy)) return;       // mas vertical que horizontal
        if (dx < 0) goNextPage();                       // derecha -> izquierda: avanzar
        else goPrevPage();                              // izquierda -> derecha: retroceder
    }, { passive: true });
})();
