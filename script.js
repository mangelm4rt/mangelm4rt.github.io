// Hash con el que se ABRIÓ la app. Hay que capturarlo aquí: en cuanto corre
// updatePaperVisibility() la URL se reescribe con la página actual, así que más
// abajo ya no se puede distinguir "enlace directo" de "arranque normal".
//
// Refrescar o volver a entrar NO cambia nada: el navegador recuerda el hash y te
// deja donde ibas. El ritual del listón lo dispara SÓLO el botón "cerrar libro",
// que deja esta marca; entonces se arranca en la pasta aunque la URL traiga hash.
// ── MODO LIGERO (lite): apaga animaciones/decorativos para equipos muy modestos.
// Se aplica ANTES del intro para que ni se monte la animación de bienvenida.
// Init: usa localStorage; si no hay preferencia guardada, hereda `prefers-reduced-motion`.
(function initLiteEarly() {
    try {
        const stored = localStorage.getItem("cantoral-lite");
        const on = stored === null
            ? (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            : stored === "1";
        if (on && document.body) document.body.classList.add("lite");
    } catch (e) {}
})();

let BOOK_WAS_CLOSED = -1;
let LAST_SAVED_HASH = "";
try {
    const v = localStorage.getItem("cantoral-closed");
    if (v !== null && v !== "") BOOK_WAS_CLOSED = parseInt(v, 10);
    LAST_SAVED_HASH = localStorage.getItem("cantoral-last-hash") || "";
} catch (e) {}
// Prioridad al abrir la app:
//   1) se cerró el libro con el botón del listón → pasta + ritual
//   2) hash en la URL (refresh, enlace directo) → salto instantáneo
//   3) auto-guardado de la última página → salto instantáneo (como antes de los
//      listones; es lo que rige mientras el usuario no fije ninguno)
//   4) nada → pasta
const INITIAL_HASH = BOOK_WAS_CLOSED >= 0 ? "" : (window.location.hash || LAST_SAVED_HASH || "");

// ═══════════════════════════════════════════════════════════════════
// Bienvenida (intro). Dark = estrella cayendo con picos sobre cielo
// estrellado (1.8s CSS). Light = mariposas saliendo del centro +
// título SVG sobre atardecer aleatorio (3s canvas).
// Después dispara cover-animate + FX sobre el libro real.
// ═══════════════════════════════════════════════════════════════════
(function welcomeIntro() {
    const intro = document.getElementById("welcomeIntro");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
        if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
        return;
    }

    // Mientras el overlay de bienvenida cubre TODO el viewport, el libro que
    // quedó montado detrás (en refresh sobre una página profunda) sigue
    // animando su escena decorativa (árbol Plumeria + mariposas de .page-sky) y
    // le roba frame budget al canvas del intro → stutter justo al emerger las
    // mariposas del centro. Pausamos lo decorativo mientras no se ve; firePhase2
    // quita la clase al revelar el libro y reanudan sin que se note.
    document.body.classList.add("intro-active");

    let isDark = false;
    try { isDark = localStorage.getItem("cantoral-theme") === "dark"; } catch(e) {}

    // Paleta pensada para CONTRASTAR sobre las 5 pastas litúrgicas (verde salvia,
    // lavanda, morado, perla clara, terracota). Ningún color contrasta con las 5,
    // pero el set es saturado y variado (magenta y azul son casi universales;
    // sin pasteles que se pierden en la perla, sin verdes/morados que se funden
    // con su propia pasta) → en cualquier fondo siempre resaltan varias.
    const BUTTERFLY_COLORS = [
        "#e8402f","#ff5a1f","#ff7a18","#ff9500","#f4b400","#ffd21e",
        "#c3e021","#3fd45f","#06d6a0","#12b5c9","#1f7be0","#3b5bff",
        "#8e2fd6","#c026d3","#e6197d","#ff4d94"
    ];
    const FLOWER_GRADS = [
        ["#ffcf3f","#fff0b0","#fffdf3","#ffffff"],
        ["#ff9e00","#ffd633","#ffe97a","#fff3a8"],
        ["#ffd23f","#ffc6c2","#f58fb0","#e85f93"],
        ["#ffc63f","#e87aa0","#c43c77","#97134f"],
        ["#ffd23f","#ffb060","#ff8a3c","#f4632a"]
    ];
    const PETAL_PATH = "M0 0 C -18 -24 -21 -60 -6 -84 C 0 -93 12 -93 18 -81 C 30 -48 21 -18 0 0 Z";

    // ─── Mariposas sobre el título REAL ───────────────────────────
    function seedCoverButterflies() {
        const bCont = document.getElementById("coverButterflies");
        if (!bCont) return;
        const items = [];
        for (let i = 0; i < 8; i++) items.push("cb-small");
        for (let i = 0; i < 12; i++) items.push(Math.random() < 0.55 ? "cb-medium" : "cb-large");
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        const REVEAL_START = 400, REVEAL_DUR = 3400;
        const frag = document.createDocumentFragment();
        items.forEach((size, i) => {
            const color = BUTTERFLY_COLORS[Math.floor(Math.random() * BUTTERFLY_COLORS.length)];
            const div = document.createElement("div");
            div.className = "cover-butterfly " + size;
            div.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12 C 8 4, 2 4, 2 9 C 2 14, 8 14, 12 12 Z" fill="${color}" opacity="1"/>
                <path d="M12 12 C 16 4, 22 4, 22 9 C 22 14, 16 14, 12 12 Z" fill="${color}" opacity="1"/>
                <path d="M12 12 C 8 15, 4 17, 5 20 C 6 22, 10 20, 12 14 Z" fill="${color}" opacity="0.88"/>
                <path d="M12 12 C 16 15, 20 17, 19 20 C 18 22, 14 20, 12 14 Z" fill="${color}" opacity="0.88"/>
                <ellipse cx="12" cy="12" rx="0.9" ry="4" fill="#2a1810"/>
            </svg>`;
            const delay = REVEAL_START + (i / items.length) * (REVEAL_DUR * 0.75) + (Math.random() * 120 - 60);
            const dur = 2200 + Math.random() * 900;
            div.style.top = (10 + Math.random() * 60) + "%";
            div.style.animation = `covFlyAcross ${dur}ms ease-in-out ${delay}ms forwards`;
            const svg = div.querySelector("svg");
            if (svg) svg.style.animationDuration = (0.14 + Math.random() * 0.12) + "s";
            frag.appendChild(div);
        });
        bCont.appendChild(frag);
    }

    // ─── Flores plumeria sobre libro ──────────────────────────────
    function seedCoverFlowers() {
        const fCont = document.getElementById("coverFlowers");
        if (!fCont) return;
        const positions = [
            ["8%",  45, "covFallA", 6.0, 4.5],
            ["22%", 65, "covFallB", 6.5, 4.8],
            ["40%", 50, "covFallA", 5.8, 5.1],
            ["58%", 60, "covFallB", 6.2, 4.7],
            ["72%", 42, "covFallA", 5.5, 5.0],
            ["86%", 55, "covFallB", 6.4, 4.9],
            ["30%", 38, "covFallA", 5.7, 5.6],
            ["66%", 40, "covFallB", 6.0, 5.9],
            ["14%", 48, "covFallB", 6.1, 5.3],
            ["48%", 42, "covFallA", 5.9, 5.5],
            ["78%", 58, "covFallB", 6.3, 5.2],
            ["94%", 44, "covFallA", 5.6, 5.7]
        ];
        const frag = document.createDocumentFragment();
        positions.forEach(([left, size, keyframe, dur, delay], i) => {
            const gradIdx = Math.floor(Math.random() * FLOWER_GRADS.length);
            const g = FLOWER_GRADS[gradIdx];
            const gid = "covFG" + i + "_" + gradIdx;
            const cid = "covFC" + i + "_" + gradIdx;
            let petals = "";
            for (let k = 0; k < 5; k++) {
                petals += `<path d="${PETAL_PATH}" fill="url(#${gid})" transform="rotate(${k * 72})"/>`;
            }
            const div = document.createElement("div");
            div.className = "cover-flower";
            div.style.left = left;
            div.style.width = size + "px";
            div.style.height = size + "px";
            div.style.animation = `${keyframe} ${dur}s ease-in ${delay}s forwards`;
            div.innerHTML = `<svg viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="${gid}" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0" stop-color="${g[0]}"/>
                        <stop offset="0.3" stop-color="${g[1]}"/>
                        <stop offset="0.62" stop-color="${g[2]}"/>
                        <stop offset="1" stop-color="${g[3]}"/>
                    </linearGradient>
                    <radialGradient id="${cid}">
                        <stop offset="0" stop-color="#fff0a0"/>
                        <stop offset="1" stop-color="#f6a821"/>
                    </radialGradient>
                </defs>
                ${petals}
                <circle r="10" fill="url(#${cid})"/>
            </svg>`;
            frag.appendChild(div);
        });
        // ── +10 PÉTALOS sueltos cayendo junto a las flores (antes de la silueta) ──
        const petalPos = [
            ["6%",  20, "covFallA", 5.6, 3.8], ["18%", 24, "covFallB", 6.1, 4.2],
            ["34%", 18, "covFallB", 5.4, 4.6], ["46%", 22, "covFallA", 5.9, 3.4],
            ["60%", 20, "covFallB", 6.2, 5.0], ["70%", 26, "covFallA", 5.7, 4.4],
            ["82%", 19, "covFallB", 5.5, 3.9], ["90%", 23, "covFallA", 6.0, 4.8],
            ["26%", 21, "covFallA", 5.8, 5.3], ["54%", 17, "covFallB", 6.3, 4.0]
        ];
        petalPos.forEach(([left, size, keyframe, dur, delay], i) => {
            const g = FLOWER_GRADS[Math.floor(Math.random() * FLOWER_GRADS.length)];
            const gid = "covPG" + i;
            const div = document.createElement("div");
            div.className = "cover-flower cover-petal";
            div.style.left = left;
            div.style.width = size + "px";
            div.style.height = Math.round(size * 1.45) + "px";
            div.style.animation = `${keyframe} ${dur}s ease-in ${delay}s forwards`;
            div.innerHTML = `<svg viewBox="-30 -100 70 105" xmlns="http://www.w3.org/2000/svg">
                <defs><linearGradient id="${gid}" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0" stop-color="${g[0]}"/><stop offset="0.5" stop-color="${g[1]}"/><stop offset="1" stop-color="${g[2]}"/>
                </linearGradient></defs>
                <path d="${PETAL_PATH}" fill="url(#${gid})"/></svg>`;
            frag.appendChild(div);
        });
        fCont.appendChild(frag);
    }

    // ─── Dispara las FX post-intro sobre el libro real ────────────
    function firePhase2() {
        // El libro se revela: reanudar sus animaciones decorativas (estaban
        // pausadas mientras el overlay las tapaba, ver body.intro-active arriba).
        document.body.classList.remove("intro-active");
        if (intro) intro.classList.add("wi-hide");
        if (window.__coverAnimateOnIntroEnd) {
            window.__coverAnimateOnIntroEnd();
            window.__coverAnimateOnIntroEnd = null;
        }
        seedCoverButterflies();
        seedCoverFlowers();
        setTimeout(() => intro && intro.parentNode && intro.parentNode.removeChild(intro), 950);
    }

    // ═══════════════════════════════════════════════════════════════
    // MODO CLARO: canvas con mariposas saliendo del centro + título
    // ═══════════════════════════════════════════════════════════════
    if (!isDark) {
        // Atardeceres realistas: cielo más frío arriba (cénit) que se calienta hacia
        // el horizonte (abajo), terminando en un resplandor cálido — NUNCA en blanco.
        // Cada paleta cubre 0→1 con 5 paradas [cénit, alto, medio, bajo, horizonte].
        const SUNSETS = [
            [[0,"#5b6aa8"],[0.34,"#c98aad"],[0.60,"#ff9d7a"],[0.82,"#ffb057"],[1,"#ffcf7a"]], // coral-oro
            [[0,"#6d6fae"],[0.34,"#d68f9e"],[0.60,"#ff9b6a"],[0.82,"#ff9f52"],[1,"#ffc266"]], // rosa-ámbar
            [[0,"#7a5f9c"],[0.34,"#e0899f"],[0.60,"#ff8f72"],[0.82,"#ff9a4f"],[1,"#ffbe6b"]], // magenta-fuego
            [[0,"#4f6bb0"],[0.34,"#b98bb6"],[0.60,"#f79a86"],[0.82,"#ffab5e"],[1,"#ffd089"]], // violeta-durazno
            [[0,"#8a6bab"],[0.34,"#e79aa0"],[0.60,"#ffa878"],[0.82,"#ffbc63"],[1,"#ffdc8e"]], // lavanda-melocotón
            [[0,"#63709f"],[0.34,"#cf95a4"],[0.60,"#ff9a72"],[0.82,"#ff8f45"],[1,"#ffb35c"]], // azul-naranja
            [[0,"#7e6aa2"],[0.34,"#d98fae"],[0.60,"#ff9e88"],[0.82,"#ffab5a"],[1,"#ffc978"]], // ciruela-coral
            [[0,"#93739e"],[0.34,"#e6a08c"],[0.60,"#ffab6f"],[0.82,"#ffb85c"],[1,"#ffd583"]], // hora dorada
            [[0,"#586bad"],[0.34,"#c58ea8"],[0.60,"#ff9f7c"],[0.82,"#ffae5c"],[1,"#ffcf82"]], // índigo-rosa cálido
            [[0,"#6f5f9e"],[0.34,"#d287a1"],[0.60,"#f89a84"],[0.82,"#ff9d55"],[1,"#ffc06f"]], // púrpura-brasa
            [[0,"#8f6db4"],[0.34,"#eb9fab"],[0.60,"#ffaa82"],[0.82,"#ffbe70"],[1,"#ffd98a"]], // orquídea-ámbar
            [[0,"#4a6ea8"],[0.34,"#b58aa8"],[0.60,"#f2977f"],[0.82,"#ff9a52"],[1,"#ffbf6d"]], // crepúsculo azul
            // ── Atardeceres con MÁS carácter (2026-07-20): claramente distintos
            //    de los 12 anteriores para que el sorteo aleatorio se note. ──
            [[0,"#7a2f5e"],[0.34,"#c0335a"],[0.60,"#ff5a3c"],[0.82,"#ff7e2e"],[1,"#ffb347"]], // 🔥 fuego
            [[0,"#2b2a5e"],[0.34,"#4a3a7a"],[0.60,"#7d4a86"],[0.82,"#b5567a"],[1,"#e8825e"]], // 🌌 crepúsculo profundo
            [[0,"#8ea6d8"],[0.34,"#d9a7cf"],[0.60,"#ffc3c0"],[0.82,"#ffd9b0"],[1,"#fff0cf"]], // 🌸 pastel rosado
            [[0,"#3f6d7a"],[0.34,"#5f9a8c"],[0.60,"#9fbf7e"],[0.82,"#e8c56b"],[1,"#ffd98a"]]  // 🟢 verde-teal
        ];
        const BCOLORS = ["#ff8a3c","#5aa0ff","#ffd24a","#ff7bbf","#7be0c0","#b98cff","#ff6b6b","#a8e06c"];

        const hasHash = window.location.hash && window.location.hash.length > 1;
        const bookClosed = !hasHash;
        // Refresh desde una página del libro: 1800 ms, igual que el intro del
        // modo oscuro. La portada cerrada conserva su animación más larga.
        const DUR = bookClosed ? 3000 : 1800;

        // ═══ Intro claro 100% CSS/compositor ═══════════════════════════════
        // Antes esto era un canvas con requestAnimationFrame en el HILO PRINCIPAL,
        // que competía con la construcción del libro al cargar (insertar cientos
        // de páginas) → tirones al emerger las mariposas/título. Ahora mariposas
        // y título animan por @keyframes (solo transform/opacity → capa GPU), así
        // que siguen fluidos aunque el hilo principal esté ocupado, igual que la
        // estrella del modo oscuro.
        document.querySelectorAll(".wi-sky-stars,.wi-trail,.wi-lead-star").forEach(el => el.style.display = "none");
        document.getElementById("wiLightCanvas")?.remove();   // el canvas ya no se usa

        const titleEl = document.getElementById("wiLightTitle");
        const W = intro.clientWidth || window.innerWidth;
        const H = intro.clientHeight || window.innerHeight;
        const rnd = (a, b) => a + Math.random() * (b - a);
        const pick = a => a[Math.floor(Math.random() * a.length)];

        // Fondo atardecer como gradiente CSS estático (el compositor lo pinta una vez).
        const sunset = SUNSETS[Math.floor(Math.random() * SUNSETS.length)];
        intro.style.background = "linear-gradient(to bottom," +
            sunset.map(([p, c]) => c + " " + Math.round(p * 100) + "%").join(",") + ")";

        // @keyframes generados + nodos; todo dentro del overlay para que se
        // elimine junto con él (firePhase2 → removeChild).
        let css = ".wi-bfly{position:absolute;left:50%;top:50%;opacity:0;will-change:transform,opacity}" +
            ".wi-bfly svg{display:block;width:100%;height:100%;transform-origin:50% 50%;" +
            "animation:covFlap .18s ease-in-out infinite alternate}" +
            ".wi-petal{position:absolute;top:0;border-radius:50% 0 50% 50%;opacity:0;will-change:transform,opacity}";
        let bodyHTML = "";

        // ── Mariposas emergiendo del centro ──
        const numB = bookClosed ? 40 : 30;
        for (let i = 0; i < numB; i++) {
            const ang = Math.random() * Math.PI * 2;
            const dist = 300 + Math.random() * Math.max(W, H) * 0.45;
            const tx = Math.round(Math.cos(ang) * dist), ty = Math.round(Math.sin(ang) * dist);
            const mx = Math.round(tx * 0.5 + rnd(-30, 30)), my = Math.round(ty * 0.5 + rnd(-24, 24));
            const ex = Math.round(tx * 1.12), ey = Math.round(ty * 1.12);
            const sz = Math.round(rnd(14, 26));
            const col = pick(BCOLORS);
            const flap = rnd(0.14, 0.24).toFixed(2);
            const nm = "wiB" + i;
            // Emergen del centro (scale .35), se dispersan hasta ~65% y salen
            // desvaneciéndose. Solo transform+opacity → animación compositada.
            css += "@keyframes " + nm + "{" +
                "0%{opacity:0;transform:translate(0,0) scale(.35)}" +
                "6%{opacity:1}" +
                "45%{transform:translate(" + mx + "px," + my + "px) scale(1)}" +
                "65%{opacity:1;transform:translate(" + tx + "px," + ty + "px) scale(1)}" +
                "80%{opacity:1}" +
                "100%{opacity:0;transform:translate(" + ex + "px," + ey + "px) scale(1)}}";
            bodyHTML += "<div class='wi-bfly' style='width:" + sz + "px;height:" + sz + "px;" +
                "margin-left:" + (-sz / 2) + "px;margin-top:" + (-sz / 2) + "px;" +
                "animation:" + nm + " " + DUR + "ms cubic-bezier(.16,.62,.3,1) forwards'>" +
                "<svg viewBox='0 0 24 24' style='animation-duration:" + flap + "s'>" +
                "<path d='M12 12 C 8 4, 2 4, 2 9 C 2 14, 8 14, 12 12 Z' fill='" + col + "' opacity='.92'/>" +
                "<path d='M12 12 C 16 4, 22 4, 22 9 C 22 14, 16 14, 12 12 Z' fill='" + col + "' opacity='.92'/>" +
                "<path d='M12 12 C 8 15, 4 17, 5 20 C 6 22, 10 20, 12 14 Z' fill='" + col + "' opacity='.78'/>" +
                "<path d='M12 12 C 16 15, 20 17, 19 20 C 18 22, 14 20, 12 14 Z' fill='" + col + "' opacity='.78'/>" +
                "<ellipse cx='12' cy='12' rx='.9' ry='4' fill='#2a1810'/></svg></div>";
        }

        // ── Pétalos cayendo: SIEMPRE en el intro (portada o refresh en cualquier
        //    canto/página) — el overlay del intro va encima de todo. En refresh
        //    profundo el intro dura menos (1800ms), así que ahí acortamos el delay
        //    para que se alcancen a ver cayendo dentro de la ventana corta.
        {
            const petalMaxDelay = bookClosed ? 2.5 : 0.6;
            for (let i = 0; i < 12; i++) {
                const left = Math.round(rnd(0, 100)), sz = Math.round(rnd(7, 13));
                const fdur = rnd(4.5, 7).toFixed(1), delay = rnd(0, petalMaxDelay).toFixed(1);
                const drift = Math.round(rnd(-45, 45)), pink = Math.random() > 0.5;
                const nm = "wiP" + i;
                css += "@keyframes " + nm + "{" +
                    "0%{opacity:0;transform:translate(0,-14vh) rotate(0deg)}" +
                    "12%{opacity:.65}" +
                    "88%{opacity:.65}" +
                    "100%{opacity:0;transform:translate(" + drift + "px,112vh) rotate(360deg)}}";
                bodyHTML += "<div class='wi-petal' style='left:" + left + "%;width:" + sz + "px;height:" + sz + "px;" +
                    "background:" + (pink ? "#ffccc6" : "#fff3d0") + ";" +
                    "animation:" + nm + " " + fdur + "s linear " + delay + "s infinite'></div>";
            }
        }

        // ── Título (SVG pesado): capa propia + pre-decode; anima por CSS ──
        if (titleEl) {
            titleEl.style.display = "block";
            titleEl.style.willChange = "transform, opacity";
            // Rasterizar el SVG a alta resolución en un bitmap y usarlo como
            // fuente del <img>: la capa GPU (will-change) a veces rasteriza a 1×
            // y el título salía algo suave. Con una fuente de ~2.5× el ancho de
            // display, CSS la reduce a su tamaño → textura con píxeles de sobra,
            // título bien nítido. Cae con gracia al SVG original si algo falla.
            const dispW = (intro.clientWidth || window.innerWidth) * 0.55;
            const rw = Math.max(600, Math.round(dispW * 2.5));
            const rh = Math.round(rw / (507 / 353));
            fetch("assets/titulopasta.svg").then(res => res.text()).then(txt => {
                const sized = txt.replace(/<svg\b([^>]*)>/, (m, a) =>
                    "<svg" + a.replace(/\s(width|height)="[^\"]*"/g, "") + ` width="${rw}" height="${rh}">`);
                const url = URL.createObjectURL(new Blob([sized], { type: "image/svg+xml" }));
                const im = new Image();
                im.onload = () => {
                    const oc = document.createElement("canvas");
                    oc.width = rw; oc.height = rh;
                    oc.getContext("2d").drawImage(im, 0, 0, rw, rh);
                    oc.toBlob(b => {
                        if (b) titleEl.src = URL.createObjectURL(b);
                        URL.revokeObjectURL(url);
                    }, "image/png");
                };
                im.onerror = () => URL.revokeObjectURL(url);
                im.src = url;
            }).catch(() => {});
            if (titleEl.decode) titleEl.decode().catch(() => {});   // pre-rasteriza antes de que el hilo se ocupe
            css += "@keyframes wiTitle{" +
                "0%,18%{opacity:0;transform:translate(-50%,-50%) scale(.92)}" +
                "30%{opacity:1;transform:translate(-50%,-50%) scale(1)}" +
                "82%{opacity:1;transform:translate(-50%,-50%) scale(1)}" +
                "100%{opacity:0;transform:translate(-50%,-50%) scale(1.05)}}";
            titleEl.style.animation = "wiTitle " + DUR + "ms ease-out forwards";
        }

        const styleEl = document.createElement("style");
        styleEl.textContent = css;
        const fx = document.createElement("div");
        fx.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:1";
        fx.innerHTML = bodyHTML;
        intro.appendChild(styleEl);
        intro.appendChild(fx);

        // Fin por temporizador (no hay rAF): al cumplir DUR, o al tocar para saltar.
        let done = false;
        function finish() { if (done) return; done = true; firePhase2(); }
        const finishTimer = setTimeout(finish, DUR);
        function skipAnim() { clearTimeout(finishTimer); finish(); }
        intro.addEventListener("click", skipAnim, { once: true });
        intro.addEventListener("touchstart", skipAnim, { once: true, passive: true });

    } else {
        // ═══════════════════════════════════════════════════════════
        // MODO OSCURO: estrella con picos (CSS puro, 1.8s)
        // ═══════════════════════════════════════════════════════════
        document.getElementById("wiLightCanvas")?.remove();
        document.getElementById("wiLightTitle")?.remove();

        setTimeout(() => firePhase2(), 1800);
    }

    // ─── Fase 3: estrella de la mañana ────────────────────────────
    const phase3delay = isDark ? 15800 : 17000;
    setTimeout(() => {
        if (document.body.classList.contains("intro-fx-off")) return;
        const ms = document.getElementById("morningStar");
        if (ms) ms.classList.add("on");
    }, phase3delay);

})();

window.__killIntroFx = function() {
    if (document.body.classList.contains("intro-fx-off")) return;
    document.body.classList.add("intro-fx-off");
    ["coverFlowers","coverButterflies"].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
    });
};

(async function () {
// ═══════════════════════════════════════════════════════════════════
// FASE 1 — Cargar JSON y generar todas las páginas del libro
// ═══════════════════════════════════════════════════════════════════
// cache:"no-cache" → el navegador REVALIDA cantos.json contra el servidor en cada
// carga (304 si no cambió, fresco si sí). Sin esto, una edición del contenido
// podía quedar atrapada en la caché HTTP del navegador y no llegar al usuario.
const DATA = await fetch("cantos.json", { cache: "no-cache" }).then(r => r.json());

const SECTION_ALIASES = {
    ordinario:    ["ordinario","tiempo ordinario","entrada ordinario","entrada"],
    adviento:     ["adviento","entrada adviento"],
    entradanavidad:  ["entrada navidad"],
    entradacuaresma: ["entrada cuaresma"],
    pascua:       ["pascua","entrada pascua"],
    kirie:        ["kirie","kyrie","kirie eleison","kyrie eleison","kirie eleyson","kyrie eleyson","señor ten piedad"],
    gloria:       ["gloria","gloria a dios","gloria al señor"],
    aleluya:      ["aleluya","alleluya","alleluia","aleluia","halleluya"],
    honor:        ["honor","honor y gloria","honor gloria"],
    dones:        ["presentacion","presentacion de dones","dones","ofertorio","ofrendas","ofrenda"],
    santo:        ["santo","sanctus"],
    cordero:      ["cordero","cordero de dios","agnus dei","agnus"],
    padrenuestro: ["padre nuestro","padrenuestro","pater noster"],
    comunion:     ["comunion","comunión"],
    marianos:     ["mariano","marianos","maria","virgen","virgen maria","madre","ave maria"],
    adoracion:    ["adoracion","adoración","adorar","alabanza"],
    espiritusanto: ["espiritu santo","espíritu santo","espiritu","espíritu","espiritusanto","paraclito","paráclito","ven espiritu santo","ven espíritu santo"],
    procesion:    ["procesion","procesión","procesional","procesionales"],
    navidad:      ["navidad","villancico","villancicos","navidad villancicos"],
    cuaresma:     ["cuaresma","cuaresmal","cuaresmales"],
    varios:       ["varios","vario","varias"],
    animacion:    ["animacion","animación","animar","animadores"],
    mananitas:    ["mananitas","mañanitas","mananita","mañanita"],
    creditos:     ["creditos","créditos","credito","crédito","autores","autor","reconocimiento"],
};

const SECTION_MAP = DATA.sections.map(sec => ({
    label: sec.label,
    aliases: SECTION_ALIASES[sec.key] || [sec.key],
    from: sec.songRange[0],
    to: sec.songRange[1]
}));


function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const SEPARATOR_TITLES = {
    ordinario:    "ENTRADA - ORDINARIO",
    adviento:     "ENTRADA - ADVIENTO",
    entradanavidad:  "ENTRADA - NAVIDAD",
    entradacuaresma: "ENTRADA - CUARESMA",
    pascua:       "ENTRADA - PASCUA",
    kirie:        "KIRIE ELEISON",
    gloria:       "GLORIA",
    aleluya:      "ALELUYA",
    honor:        "HONOR Y GLORIA",
    dones:        "PRESENTACIÓN DE DONES",
    santo:        "SANTO",
    cordero:      "CORDERO",
    padrenuestro: "PADRE NUESTRO",
    comunion:     "COMUNIÓN",
    marianos:     "MARIANOS",
    vocacionales:  "VOCACIONALES",
    adoracion:     "ADORACIÓN",
    espiritusanto: "ESPÍRITU SANTO",
    procesion:     "PROCESIÓN",
    navidad:       "NAVIDAD",
    cuaresma:      "CUARESMA",
    varios:        "VARIOS",
    animacion:     "ANIMACIÓN",
    mananitas:     "MAÑANITAS",
    creditos:      "CRÉDITOS",
};

// ═══════════════════════════════════════════════════════════════════
// Acordes ANCLADOS a la sílaba (fuente variable). Convierte un "pair"
// (dos filas alineadas por columnas monoespaciadas) en una "line" con
// segmentos: cada acorde queda anclado al INICIO del trozo de letra que le
// toca. Como el ancla es estructural (hijo del glifo), el acorde se mantiene
// sobre la sílaba exacta con CUALQUIER fuente, tamaño, negrita o cursiva, y
// sigue a su sílaba aunque la línea haga wrap. La conversión es fiable porque
// el ORIGEN es monoespaciado: la columna de arranque del acorde ES el índice
// de carácter de la letra debajo.
// ═══════════════════════════════════════════════════════════════════
function pairToLine(pair) {
    const chordStr = pair.chord || "";
    const lyric = pair.lyric || "";
    const chords = [];
    const re = /\S+/g;
    let m;
    while ((m = re.exec(chordStr)) !== null) chords.push({ col: m.index, chord: m[0] });

    const segments = [];
    if (chords.length === 0) {
        segments.push({ text: lyric });
        return { type: "line", segments, variant: pair.variant };
    }
    // Rellena con espacios cuando la letra se acaba antes que los acordes, para que
    // cada tramo conserve el ANCHO de columna del renglón de acordes. Sin esto, un
    // acorde cuyo tramo de letra queda vacío o más corto que su nombre se encima con
    // el acorde siguiente (típico al final del verso: "Em F G", "AG DAG", "D F#m Bm").
    const pad = (text, width) => (text.length < width ? text + " ".repeat(width - text.length) : text);
    if (chords[0].col > 0) segments.push({ text: pad(lyric.slice(0, chords[0].col), chords[0].col) });
    for (let i = 0; i < chords.length; i++) {
        const start = chords[i].col;
        const end = i + 1 < chords.length ? chords[i + 1].col : Math.max(lyric.length, start);
        let text = lyric.slice(start, end);
        if (i + 1 < chords.length) text = pad(text, end - start);
        segments.push({ chord: chords[i].chord, text });
    }
    return { type: "line", segments, variant: pair.variant };
}
function anchorizeContent(items) {
    return items.map(it => {
        if (it.type === "pair") return pairToLine(it);
        if (it.type === "block" && Array.isArray(it.content)) {
            return { ...it, content: anchorizeContent(it.content) };
        }
        return it;
    });
}

function renderContent(items) {
    let h = "";
    for (const it of items) {
        switch (it.type) {
            case "pair": {
                const vc = it.variant ? " variant-only" : "";
                const va = it.variant ? ` data-variant="${esc(it.variant)}"` : "";
                h += `<div class="pair${vc}"${va}><div class="chord-row">${esc(it.chord)}</div><div class="lyric-row">${esc(it.lyric)}</div></div>`;
                break;
            }
            case "line": {
                const vc = it.variant ? " variant-only" : "";
                const va = it.variant ? ` data-variant="${esc(it.variant)}"` : "";
                const hasChord = it.segments.some(s => s.chord);
                h += `<div class="cline${hasChord ? " has-chord" : ""}${vc}"${va}>`;
                for (const seg of it.segments) {
                    if (seg.chord) {
                        const t = seg.text.length ? esc(seg.text) : "&nbsp;";
                        h += `<span class="cseg"><span class="cchord chord">${esc(seg.chord)}</span>${t}</span>`;
                    } else {
                        h += `<span class="cseg">${esc(seg.text)}</span>`;
                    }
                }
                h += `</div>`;
                break;
            }
            case "space":
                h += '<div class="song-space"></div>';
                break;
            case "paragraph":
                h += `<p>${esc(it.text).replace(/\n/g, "<br>")}</p>`;
                break;
            case "block":
                h += '<div class="plain-block">' + renderContent(it.content) + "</div>";
                break;
            case "extra":
                h += '<div class="extra-lyrics">';
                for (const p of it.paragraphs) h += `<p>${esc(p).replace(/\n/g, "<br>")}</p>`;
                h += "</div>";
                break;
            case "note": {
                const nc = it.classes ? ` ${it.classes}` : "";
                h += `<div class="note${nc}">${esc(it.text)}</div>`;
                break;
            }
        }
    }
    return h;
}

function makePaper(id, frontHTML) {
    return `<div class="paper" id="${id}"><div class="front">${frontHTML}</div><div class="back blank-page"></div></div>`;
}

// Contraportada (última hoja): al llegar al final el libro se cierra (translateX)
// y esta cara trasera de pasta queda a la vista. Muestra sello de plumeria +
// texto de cierre (lo pone el user) + QR de cantoralmayo.com + año, con fundido
// suave (clase body.book-at-back). La correa "Volver al inicio" regresa a la
// portada con el libro cerrado.
function makeBackCoverPaper() {
    // Sello = la PLUMERIA REAL del árbol: mismo PETAL_PATH + gradiente de FLOWER_GRADS
    // (frangipani amarillo→rosa, índice 2) + centro cálido, igual que seedCoverFlowers.
    const PETAL = "M0 0 C -18 -24 -21 -60 -6 -84 C 0 -93 12 -93 18 -81 C 30 -48 21 -18 0 0 Z";
    // Tono ALEATORIO por carga (los mismos 5 gradientes que el árbol, FLOWER_GRADS).
    const FG = [
        ["#ffcf3f", "#fff0b0", "#fffdf3", "#ffffff"],
        ["#ff9e00", "#ffd633", "#ffe97a", "#fff3a8"],
        ["#ffd23f", "#ffc6c2", "#f58fb0", "#e85f93"],
        ["#ffc63f", "#e87aa0", "#c43c77", "#97134f"],
        ["#ffd23f", "#ffb060", "#ff8a3c", "#f4632a"]
    ];
    const g = FG[Math.floor(Math.random() * FG.length)];
    // DEBOSS: la flor se ve PRENSADA en la piel (sombra interior arriba + luz
    // interior abajo, con la luz desde arriba) + desaturada para compartir el
    // material de la pasta. La sombra de CONTACTO (pegada) va en el CSS de .bc-seal.
    const petalsHtml = [0, 72, 144, 216, 288].map(a => `<path d="${PETAL}" fill="url(#bcSealG)" transform="rotate(${a})"/>`).join("");
    const seal = `<svg class="bc-seal" viewBox="-100 -100 200 200" aria-hidden="true">`
        + `<defs>`
        +   `<linearGradient id="bcSealG" x1="0" y1="1" x2="0" y2="0">`
        +     `<stop offset="0" stop-color="${g[0]}"/><stop offset="0.3" stop-color="${g[1]}"/>`
        +     `<stop offset="0.62" stop-color="${g[2]}"/><stop offset="1" stop-color="${g[3]}"/>`
        +   `</linearGradient>`
        +   `<radialGradient id="bcSealC"><stop offset="0" stop-color="#fff0a0"/><stop offset="1" stop-color="#f6a821"/></radialGradient>`
        +   `<filter id="bcDeboss" x="-40%" y="-40%" width="180%" height="180%">`
        +     `<feColorMatrix type="saturate" values="0.72" result="desat"/>`
        +     `<feComponentTransfer in="SourceAlpha" result="inv"><feFuncA type="table" tableValues="1 0"/></feComponentTransfer>`
        +     `<feGaussianBlur in="inv" stdDeviation="1.3" result="invb"/>`
        +     `<feOffset in="invb" dx="0" dy="-1.8" result="invo"/>`
        +     `<feFlood flood-color="#1c1206" flood-opacity="0.62" result="dc"/>`
        +     `<feComposite in="dc" in2="invo" operator="in" result="dcx"/>`
        +     `<feComposite in="dcx" in2="SourceAlpha" operator="in" result="ishadow"/>`
        +     `<feComponentTransfer in="SourceAlpha" result="inv2"><feFuncA type="table" tableValues="1 0"/></feComponentTransfer>`
        +     `<feGaussianBlur in="inv2" stdDeviation="1.1" result="inv2b"/>`
        +     `<feOffset in="inv2b" dx="0" dy="1.6" result="inv2o"/>`
        +     `<feFlood flood-color="#ffffff" flood-opacity="0.46" result="lc"/>`
        +     `<feComposite in="lc" in2="inv2o" operator="in" result="lcx"/>`
        +     `<feComposite in="lcx" in2="SourceAlpha" operator="in" result="ilight"/>`
        +     `<feMerge><feMergeNode in="desat"/><feMergeNode in="ishadow"/><feMergeNode in="ilight"/></feMerge>`
        +   `</filter>`
        + `</defs>`
        + `<g filter="url(#bcDeboss)">${petalsHtml}<circle r="10" fill="url(#bcSealC)"/></g>`
        + `</svg>`;
    // La contraportada va en la cara FRONTAL (es la última parada del libro; en
    // móvil single-page queda a pantalla completa). La trasera queda de pasta lisa.
    // Correa "Volver al inicio" = banda de piel horizontal ARRIBA, mismo estilo y
    // posición que la correa de CIERRE (.rib-close). QR/URL/año abajo.
    // Mariposas de PAPEL en ESPIRAL (animadas): las inyecta el módulo
    // setupBackCoverButterflies() del final de script.js en ESTA cara
    // (.contraportada), detrás del contenido. Reemplazaron a las repujadas estáticas.
    return `<div class="paper" id="pCoverBack">`
        + `<div class="front cover-page contraportada">`
        +   `<div class="bc-spine" aria-hidden="true"></div>`
        +   `<div class="bc-block" aria-hidden="true"></div>`
        +   `<button class="bc-strap" id="backToStart" type="button" aria-label="Volver al inicio del cantoral">`
        +     `<svg class="bc-strap-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5 L6 12 L13 19 M6 12 H19" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        +     `<span class="bc-strap-label">Volver al inicio</span>`
        +   `</button>`
        +   `<div class="bc-content">`
        +     `<div class="bc-top">`
        +       seal
        +       `<p class="bc-blurb" id="bcBlurb" data-placeholder="1">“A Jesús por María…”</p>`
        +     `</div>`
        +     `<div class="bc-bottom">`
        +       `<div class="bc-qr"><img src="assets/qr_cantoralmayo.svg?v=2" alt="Código QR de cantoralmayo.com" width="150" height="150"><span class="bc-qr-url">cantoralmayo.com</span></div>`
        +       `<div class="bc-year">MMXXVI</div>`
        +     `</div>`
        +   `</div>`
        +   `<div class="bc-shade" aria-hidden="true"></div>`
        + `</div>`
        + `<div class="back cover-page cover-inside"></div>`
        + `</div>`;
}

function makeDecorSep(title, sectionKey, isLong) {
    const cls = isLong ? "decor-section-title decor-section-title-long" : "decor-section-title";
    const attr = sectionKey ? ` data-section="${sectionKey}"` : "";
    return `<div class="decor-section-page"><div class="decor-section-content"><div class="${cls}"${attr}>${esc(title)}</div><img class="decor-section-leaves" src="assets/hojasdis.png" alt=""></div></div>`;
}

function makeIndexPage() {
    return '<div class="index-page"><div class="header">Índice</div><div class="index-content"></div></div>';
}

function makeDictPage(idx) {
    return `<div class="dict-page"><div class="header">Diccionario de Acordes para Guitarra</div><div class="dict-content" data-dict="${idx}"></div>${guideBtnHtml()}</div>`;
}

function makeSongTitle(canto) {
    if (!canto.title) return "";
    let t = esc(canto.title);
    if (canto.variants) {
        const btns = canto.variants.keys.map(k =>
            `<a class="variant-btn${k === canto.variants.active ? " active" : ""}" data-variant="${esc(k)}">${esc(k)}</a>`
        ).join("/");
        const plainTitle = t.replace(/\(.*$/, "").trim();
        t = `${wrapSongNum(plainTitle)} (${btns})`;
    } else {
        t = wrapSongNum(t);
    }
    return `<div class="song-title" data-song="${esc(canto.id)}">${t}</div>`;
}
// Envuelve el "N." inicial del título en un span clicable. Al tocarlo se alterna
// el subrayado de TODOS los títulos del libro (ver initTitleUnderlineToggle).
function wrapSongNum(html) {
    return html.replace(/^(\s*)(\d+\.)/, '$1<span class="song-num" role="button" tabindex="0" aria-label="Mostrar u ocultar el subrayado de los títulos">$2</span>');
}

// Pie de página de cada canto: número de página + botón de zoom.
// El botón vive DENTRO del papel (como el número de página) para que
// voltee junto con la hoja al pasar página y no parezca que flota.
function footerHtml(pageNum, noZoom) {
    // La "aA" vive en el PIE (dentro del papel) para que gire con la hoja al pasar
    // página y no parezca que flota. Es la aA visible en estado CERRADO; al abrir se
    // oculta y su gemela idéntica del overlay (#overlayAA) la reemplaza dentro de la
    // píldora (misma posición y glifo A+A, transición imperceptible).
    // noZoom: páginas "limpias" (p. ej. CRÉDITOS) que no llevan el botón de zoom
    // "Aa" ni sus controles; sólo conservan el número de página.
    const zoomBtn = noZoom ? "" :
        `<button class="zoom-toggle" type="button" aria-label="Ajustar tamaño de letra" aria-expanded="false">`
        + `<span class="aa-glyph"><span class="zoom-toggle-a small">A</span><span class="zoom-toggle-a big">A</span></span>`
        + `</button>`;
    return `<div class="footer">`
        + `<div class="footer-line-2">${esc(pageNum)}</div>`
        + `<div class="footer-line-1"></div>`
        + guideBtnHtml()
        + zoomBtn
        + `</div>`;
}

// Botón "Guía de Acordes": ícono plano ENCIMA del número de página (mismo rincón,
// vuela con la hoja). Aparece solo en cantos (este pie) y en el diccionario.
function guideBtnHtml() {
    return `<button class="guide-btn" type="button" aria-label="Guía de acordes" title="Guía de acordes">`
        + `<svg viewBox="0 0 880 512" aria-hidden="true"><use href="#guideIcon"/></svg></button>`;
}

function buildSongPage(cantos) {
    if (cantos.length === 0) return "";
    const first = cantos[0];

    if (first.layout === "short-grid") {
        let grid = '<div class="short-grid">';
        for (const c of cantos) {
            const pos = c.position || "";
            const cls = c.classes && c.classes.length ? " " + c.classes.join(" ") : "";
            grid += `<div class="short-song ${pos}${cls}">`;
            grid += makeSongTitle(c);
            grid += renderContent(anchorizeContent(c.content));
            grid += "</div>";
        }
        grid += "</div>";
        const pageNum = first.pageNum;
        return `<div class="header">${esc(first.sectionLabel)}</div><div class="page-content-wrap">${grid}</div>${footerHtml(pageNum)}`;
    }

    if (cantos.length > 1 && first.layout === "shared") {
        let html = `<div class="header">${esc(first.sectionLabel)}</div><div class="page-content-wrap">`;
        for (const c of cantos) {
            const extra = c.classes.length ? " " + c.classes.join(" ") : "";
            const av = c.variants ? ` data-active-variant="${esc(c.variants.active)}"` : "";
            html += `<div class="${c.layout === "shared" ? "song-page" : c.layout}${extra}"${av}>`;
            html += makeSongTitle(c);
            html += renderContent(anchorizeContent(c.content));
            html += "</div>";
        }
        html += `</div>${footerHtml(first.pageNum)}`;
        return html;
    }

    const c = first;
    const layout = c.layout === "continuation" ? "song-page" : c.layout;
    // Página SIN TÍTULO (continuaciones de cantos de 2+ páginas y el caso especial
    // del canto 137, cuya 2ª hoja es song-page sin título): marca para que el CSS le
    // dé un padding-top y el primer acorde anclado no quede cortado bajo el encabezado
    // (los acordes se posicionan por encima de la letra con bottom:100%). Se basa en la
    // ausencia de título, no en el layout, para cubrir cualquier hoja sin título.
    const contCls = !c.title ? " is-continuation" : "";
    const extra = c.classes.length ? " " + c.classes.join(" ") : "";
    const av = c.variants ? ` data-active-variant="${esc(c.variants.active)}"` : "";
    let html = `<div class="header">${esc(c.sectionLabel)}</div>`;
    html += `<div class="page-content-wrap">`;
    html += `<div class="${layout}${extra}${contCls}"${av}>`;
    html += makeSongTitle(c);
    html += renderContent(anchorizeContent(c.content));
    html += "</div>";
    html += `</div>`;
    html += footerHtml(c.pageNum, c.section === "creditos");
    return html;
}

const VPAGE_GROUP = {};    // POC ventana: paperId -> group (cantos de esa hoja), para construir lazy
const SONG_TO_PAPER = {};  // POC ventana: id de canto -> paperId (resolver saltos SIN leer el DOM del contenido, que puede estar desmontado)
let indexBuilt = false;    // OPT arranque: el índice se arma diferido (ensureIndexBuilt); declarado arriba para evitar zona muerta
function generatePages() {
    const book = document.getElementById("book");
    let allHTML = "";

    allHTML += makePaper("m2", makeDecorSep("ÍNDICE"));
    const indexIds = ["m3", "m4", "pIndex3", "pIndex4", "pIndex5", "pIndex6", "pIndex7", "pIndex8", "pIndex9", "pIndex10", "pIndex11"];
    for (const id of indexIds) allHTML += makePaper(id, makeIndexPage());

    allHTML += makePaper("pDictSep", makeDecorSep("DICCIONARIO DE ACORDES PARA GUITARRA", "diccionario", true));
    for (let i = 0; i < 2; i++) allHTML += makePaper("pDict" + (i + 1), makeDictPage(i));

    const grouped = new Map();
    for (const c of DATA.cantos) {
        const key = c.paperId;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(c);
    }

    let curSection = null;
    const seenPapers = new Set();

    for (const c of DATA.cantos) {
        if (seenPapers.has(c.paperId)) continue;
        seenPapers.add(c.paperId);

        if (c.section !== curSection && c.layout !== "continuation") {
            curSection = c.section;
            const sepTitle = SEPARATOR_TITLES[curSection] || curSection.toUpperCase();
            allHTML += makePaper("sep_" + curSection, makeDecorSep(sepTitle, curSection));
        }

        const group = grouped.get(c.paperId);
        VPAGE_GROUP[c.paperId] = group;             // POC: contenido lazy por ventana
        for (const cc of group) SONG_TO_PAPER[cc.id] = c.paperId;   // mapa canto->cáscara para saltos
        allHTML += makePaperShell(c.paperId);       // cáscara vacía (se llena al entrar al buffer)
    }

    // Secciones ya declaradas pero aún sin cantos: se muestra su página
    // divisora al final (en el orden de DATA.sections). Cuando se agreguen
    // cantos a la sección, el bucle de arriba genera el separador y esta
    // sección deja de estar "vacía", así que no se duplica.
    const sectionsWithSongs = new Set(DATA.cantos.map(c => c.section));
    for (const sec of DATA.sections) {
        if (sectionsWithSongs.has(sec.key)) continue;
        const sepTitle = SEPARATOR_TITLES[sec.key] || sec.label.toUpperCase();
        allHTML += makePaper("sep_" + sec.key, makeDecorSep(sepTitle, sec.key));
    }

    // Contraportada: SIEMPRE la última hoja del libro (después de todo canto/sección).
    allHTML += makeBackCoverPaper();

    book.insertAdjacentHTML("beforeend", allHTML);
}

function populateIndexTemplate() {
    const tpl = document.getElementById("indexSource");
    if (!tpl) return;
    let html = "";
    for (const entry of DATA.index) {
        if (entry.type === "section") {
            html += `<div class="index-section-label">${esc(entry.label)}</div>`;
        } else {
            const cls = entry.isDict ? "index-entry index-entry-dict" : "index-entry";
            const target = entry.songTarget
                ? ` data-song-target="${esc(entry.songTarget)}"`
                : entry.sectionTarget
                    ? ` data-section-target="${esc(entry.sectionTarget)}"`
                    : "";
            html += `<a class="${cls}"${target}><span class="index-name">${esc(entry.name)}</span><span class="index-dots"></span><span class="index-num">${entry.pageNum}</span></a>`;
        }
    }
    tpl.innerHTML = html;
}

// Preferencia de subrayado de títulos: aplicar ANTES de renderizar para evitar
// parpadeo (el toggle vive en initTitleUnderlineToggle, más abajo).
try { if (localStorage.getItem("cantoral-title-underline") === "0") document.body.classList.add("titles-no-underline"); } catch (e) {}

generatePages();
// OPT arranque: populateIndexTemplate + buildIndex + collapse se difieren (ver
// ensureIndexBuilt más abajo) para sacar del arranque el armado del índice (~292
// entradas + medición de overflow). Se arma en idle o al abrir el índice.

// Dispara la animación de la pasta (título + silueta) una vez que termine la intro de bienvenida.
// Si la intro sigue viva, se registra el callback; si ya terminó o no existe, dispara al momento.
function triggerCoverAnimate() {
    const coverFront = document.querySelector("#pCoverFront .front.cover-page");
    if (coverFront) coverFront.classList.add("cover-animate");
}
const intro = document.getElementById("welcomeIntro");
if (intro && !intro.classList.contains("wi-hide")) {
    window.__coverAnimateOnIntroEnd = triggerCoverAnimate;
} else {
    requestAnimationFrame(triggerCoverAnimate);
}

// Mapa de song ID → slug para hashes legibles
const SONG_SLUGS = new Map();
const SONG_CONT = new Map(); // paperId de continuación → song ID padre
for (const c of DATA.cantos) {
    if (c.layout === "continuation") {
        // Buscar el canto anterior con el mismo id para vincular
        for (let j = DATA.cantos.indexOf(c) - 1; j >= 0; j--) {
            if (DATA.cantos[j].id === c.id || DATA.cantos[j].layout !== "continuation") {
                SONG_CONT.set(c.paperId, String(DATA.cantos[j].id));
                break;
            }
        }
        continue;
    }
    if (!c.title || SONG_SLUGS.has(String(c.id))) continue;
    const clean = c.title.replace(/^\d+[a-z]?\.\s*/i, "").replace(/\s*\(.*$/, "").replace(/\.$/, "").trim();
    const slug = clean.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
    SONG_SLUGS.set(String(c.id), slug);
}

// ═══════════════════════════════════════════════════════════════════
// FASE 2 — Inicialización del libro (lógica original adaptada)
// ═══════════════════════════════════════════════════════════════════

const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const book = document.querySelector("#book");
const themeToggle = document.querySelector("#themeToggle");
const papers = Array.from(document.querySelectorAll(".paper"));

let currentLocation = 1;
// maxLocation es `let` porque el índice es RESPONSIVE: buildIndex reparte las
// entradas por overflow según la altura de pantalla, así que en pantallas altas
// (p.ej. iPhone) puede sobrar la última hoja de índice en blanco. Tras construir
// el índice, collapseEmptyIndexPages() saca del array esas hojas vacías y aquí
// se recalcula el total. Ver collapseEmptyIndexPages().
// La contraportada (pCoverBack) es la ÚLTIMA hoja real y la parada TERMINAL del
// libro (antes había un estado "cerrado" extra en papers.length+1; ahora ese
// destino ES la contraportada, que se ve a pantalla completa en móvil).
let maxLocation = papers.length;
const pageTurnDuration = 1050;

papers.forEach((paper, index) => {
    paper.style.zIndex = papers.length - index;
});

// Ubicación (1-index) del primer paper cuya cara frontal contiene el selector.
// Sirve para no hardcodear posiciones que se corren al añadir páginas al frente
// (dedicatoria, plumeria, índice).
function locOfPaperWith(selector) {
    for (let i = 0; i < papers.length; i++) {
        if (papers[i].querySelector(selector)) return i + 1;
    }
    return null;
}

function getHashForLocation(loc) {
    if (loc === 1) return "cantoralmayo";
    if (loc === 2) return "portada";
    if (loc > papers.length) return "contraportada";

    const paper = papers[loc - 1];
    if (!paper) return "";

    const face = paper.querySelector(".front");
    if (!face) return "";

    // Contraportada (última hoja)
    if (face.classList.contains("contraportada")) return "contraportada";

    // Dedicatoria / descripción
    if (face.classList.contains("dedication-page")) return "dedicatoria";

    // Plumeria page
    if (face.classList.contains("plumeria-page")) return "plumeriarubra";

    // Song pages
    const songTitle = face.querySelector(".song-title");
    if (songTitle) {
        const num = songTitle.dataset.song;
        const slug = SONG_SLUGS.get(num) || "";
        return num + slug;
    }

    // Continuation pages (page-content-wrap without song-title). OPT ventana: el canto
    // padre se resuelve por DATOS (SONG_CONT: paperId de continuación → id del canto),
    // no escaneando el DOM (el título del padre puede estar desmontado fuera del buffer).
    if (face.querySelector(".page-content-wrap")) {
        const num = SONG_CONT.get(paper.id);
        if (num) return num + (SONG_SLUGS.get(num) || "") + "p2";
    }

    // Section separators (use section name directly)
    const sectionTitle = face.querySelector("[data-section]");
    if (sectionTitle) {
        return sectionTitle.dataset.section;
    }

    // Section separator without data-section (e.g. ÍNDICE separator)
    const decorPage = face.querySelector(".decor-section-page");
    if (decorPage) return "indice";

    // Index pages
    const indexPage = face.querySelector(".index-page");
    if (indexPage) {
        const idxPages = Array.from(document.querySelectorAll(".index-page"));
        const idx = idxPages.indexOf(indexPage);
        return idx >= 0 ? "indice-" + (idx + 1) : "indice";
    }

    // Dictionary pages
    const dictPage = face.querySelector(".dict-page");
    if (dictPage) {
        const dictPages = Array.from(document.querySelectorAll(".dict-page"));
        const idx = dictPages.indexOf(dictPage);
        return idx >= 0 ? "diccionario-" + (idx + 1) : "diccionario";
    }

    return "pagina-" + loc;
}

function getLocationForHash(hash) {
    if (!hash) return 1;
    hash = hash.replace(/^#/, "").toLowerCase();
    
    if (hash === "cantoralmayo") return 1;
    if (hash === "portada") return 2;
    if (hash === "portada-imagen") return 2;
    if (hash === "dedicatoria") return locOfPaperWith(".dedication-page") || 3;
    if (hash === "plumeriarubra" || hash === "arbol") return locOfPaperWith(".plumeria-page") || 3;
    if (hash === "contraportada") return maxLocation;

    // Legacy canto-N format
    if (hash.startsWith("canto-")) {
        const songNum = hash.replace("canto-", "");
        const loc = locationOfSong(songNum);
        if (loc !== null) return loc;
    }

    // New slug format: #Ntituloslug or #Ntituloslugp2
    const songHashMatch = hash.match(/^(\d+)([a-z].*)$/);
    if (songHashMatch) {
        const songNum = songHashMatch[1];
        const rest = songHashMatch[2];
        const isP2 = rest.endsWith("p2");
        const loc = locationOfSong(songNum);
        if (loc !== null) return isP2 ? loc + 1 : loc;
    }

    // Section names directly (e.g. #ordinario, #kirie, #gloria)
    // Also keep legacy seccion- prefix working
    if (hash.startsWith("seccion-")) {
        const secName = hash.replace("seccion-", "");
        const loc = locationOfSection(secName);
        if (loc !== null) return loc;
    }
    {
        const loc = locationOfSection(hash);
        if (loc !== null) return loc;
    }
    
    if (hash.startsWith("indice-")) {
        const idxNum = parseInt(hash.replace("indice-", ""), 10);
        if (!isNaN(idxNum)) {
            const idxPages = Array.from(document.querySelectorAll(".index-page"));
            if (idxPages[idxNum - 1]) {
                const face = idxPages[idxNum - 1].closest(".front, .back");
                if (face) return locationOfFace(face);
            }
        }
    }
    if (hash === "indice") {
        return 4;
    }
    
    if (hash.startsWith("diccionario-")) {
        const dictNum = parseInt(hash.replace("diccionario-", ""), 10);
        if (!isNaN(dictNum)) {
            const dictPages = Array.from(document.querySelectorAll(".dict-page"));
            if (dictPages[dictNum - 1]) {
                const face = dictPages[dictNum - 1].closest(".front, .back");
                if (face) return locationOfFace(face);
            }
        }
    }
    if (hash.startsWith("diccionario")) {
        const loc = locationOfSection("diccionario");
        if (loc !== null) return loc;
    }
    
    if (hash.startsWith("pagina-")) {
        const pNum = parseInt(hash.replace("pagina-", ""), 10);
        if (!isNaN(pNum)) return Math.max(1, Math.min(maxLocation, pNum));
    }
    
    return 1;
}

function updateHashFromLocation() {
    const hash = getHashForLocation(currentLocation);
    if (hash) {
        if (window.location.hash !== "#" + hash) {
            history.replaceState(null, null, "#" + hash);
        }
        // Auto-guardado de la última página. Sigue vivo para quien no usa
        // listones: al reabrir se vuelve a esa página sin ceremonia. Cuando el
        // usuario cierra el libro con el botón del listón, la marca
        // "cantoral-closed" tiene prioridad sobre esto (ver INITIAL_HASH).
        try {
            localStorage.setItem("cantoral-last-hash", hash);
        } catch (e) {}
    }
}

const VIRTUAL_BUFFER = 6;

// ── POC virtualización por VENTANA (solo EriTest) ─────────────────────────
// Las páginas de CANTO se inyectan como cáscaras vacías (.vpage) y su contenido
// (texto+acordes) se ARMA y monta al vuelo SOLO cuando la hoja entra en el buffer,
// y se vacía al salir. Ahorra el parseo/layout de ~300 páginas al arrancar y baja
// mucho la memoria (solo ~9 páginas con contenido a la vez). Los índices/diccionario/
// separadores se quedan completos (son pocos y el salto al índice los necesita listos).
function makePaperShell(id) {
    return `<div class="paper vpage" id="${id}"><div class="front"></div><div class="back blank-page"></div></div>`;
}
function mountVPage(p) {
    if (!p || !p.classList.contains("vpage") || p.dataset.vmounted) return;
    const f = p.querySelector(":scope > .front");
    if (f && !f.firstChild) f.innerHTML = buildSongPage(VPAGE_GROUP[p.id] || []);
    p.dataset.vmounted = "1";
    delete p.dataset.fitted;   // re-ajustar al remontar
}
function unmountVPage(p) {
    if (!p || !p.classList.contains("vpage") || !p.dataset.vmounted) return;
    const f = p.querySelector(":scope > .front");
    if (f) f.innerHTML = "";
    delete p.dataset.vmounted;
    delete p.dataset.fitted;
}
let fontsReady = false;
let coverDrawnDone = false; // pasta ya fijada en su estado final (.cover-drawn)
function updatePaperVisibility() {
    const center = currentLocation - 1;
    for (let i = 0; i < papers.length; i++) {
        const visible = i >= center - VIRTUAL_BUFFER && i <= center + VIRTUAL_BUFFER;
        papers[i].style.display = visible ? "" : "none";
        // Solo la hoja actual y sus vecinas (.near) mantienen sus animaciones
        // decorativas corriendo; el CSS detiene el resto del buffer (que está
        // con display:"" pero tapado por otras hojas).
        papers[i].classList.toggle("near", i >= center - 1 && i <= center + 1);
        // .onstage = SOLO la hoja realmente visible. Las vecinas .near (±1) quedan
        // montadas pero se les congelan los decorativos (Q2); se reanudan durante
        // el volteo. .near se mantiene para tener el DOM/fit listos.
        papers[i].classList.toggle("onstage", i === center);
        // POC ventana: monta el contenido de canto al entrar al buffer, lo vacía al salir.
        if (visible) mountVPage(papers[i]); else unmountVPage(papers[i]);
        if (visible && fontsReady && !papers[i].dataset.fitted) fitPaper(papers[i]);
    }
    // La primera vez que la pasta deja de estar cerca, fijamos su estado FINAL
    // (.cover-drawn): si después vuelve de display:none (buffer virtual), las
    // animaciones one-shot no se reinician desde cero y el arte aparece completo.
    if (!coverDrawnDone) {
        const cp = document.getElementById("pCoverFront");
        if (cp && !cp.classList.contains("near")) {
            const cf = cp.querySelector(".front.cover-page");
            if (cf) { cf.classList.add("cover-drawn"); coverDrawnDone = true; }
        }
    }
    // Contraportada a la vista (libro cerrado al final) → dispara el fundido suave
    // del contenido de cierre (sello + texto + QR + año) vía CSS.
    document.body.classList.toggle("book-at-back", currentLocation >= maxLocation);
    updateHashFromLocation();
    updateFontControlsVisibility();
    if (window.__syncRibbons) window.__syncRibbons();
    if (window.__tourMaybeStart) window.__tourMaybeStart();   // tour 1-vez al llegar al 1er canto
}

// FIX Android (segundo plano): al volver de background, el compositor puede
// DESCARTAR las capas GPU de las hojas (transform/preserve-3d) y no re-pintar el
// fondo opaco de la hoja actual → la hoja siguiente se transparenta y dos cantos
// aparecen SUPERPUESTOS. Refrescar o voltear ya lo corregía (fuerza repaint); aquí
// lo hacemos AUTOMÁTICO al reanudar: re-asentamos el estado de las hojas y forzamos
// un reflow del libro. El display none→"" se lee en el MISMO frame (offsetHeight),
// así que re-compone las capas sin llegar a pintar el estado oculto (sin parpadeo).
document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    requestAnimationFrame(() => {
        try { updatePaperVisibility(); } catch (e) {}
        const bookEl = document.getElementById("book");
        if (bookEl) {
            bookEl.style.display = "none";
            void bookEl.offsetHeight;   // reflow síncrono
            bookEl.style.display = "";
        }
    });
});

function updateFontControlsVisibility() {
    const fc = document.getElementById("fontControls");
    if (!fc) return;
    const paper = papers[currentLocation - 1];
    const face = paper ? paper.querySelector(":scope > .front") : null;
    // Todos los layouts de canto (song-page, shared, short-grid, song-two, lyrics,
    // continuation) usan .page-content-wrap como contenedor. Los diccionarios usan
    // .dict-content, el índice usa .index-content y los separadores no tienen wrap.
    const isSongFace = !!(face && face.querySelector(".page-content-wrap"));
    fc.classList.toggle("hidden", !isSongFace);
    const fpBtn = document.getElementById("fontPickerBtn");
    if (fpBtn) fpBtn.classList.toggle("hidden", !isSongFace);
    if (!isSongFace) {
        const fp = document.getElementById("fontPicker");
        if (fp) fp.classList.add("hidden");
        // Colapsa el slider de zoom si estaba abierto al abandonar el canto.
        if (window.__closeFontSlider) window.__closeFontSlider();
    }
}

function vMargin(el) {
    const s = getComputedStyle(el);
    return parseFloat(s.marginTop || 0) + parseFloat(s.marginBottom || 0);
}
function fitPaper(paper) {
    const face = paper.querySelector(".front");
    if (!face) return;
    const content = face.querySelector(".page-content-wrap, .dict-content");
    if (!content) return;
    content.style.transformOrigin = "top center";
    content.style.transform = "none";
    const cs = getComputedStyle(face);
    let availH = face.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const header = face.querySelector(".header");
    if (header) availH -= header.offsetHeight + vMargin(header);
    const boxW = content.clientWidth;
    const fullW = content.scrollWidth;
    const fullH = content.scrollHeight;
    if (!boxW || !fullW || !fullH || availH <= 0) return;
    // Los cantos (.page-content-wrap) tienen overflow-y:auto: si el texto excede
    // el alto disponible se hace scroll manteniendo la fuente a su tamaño real.
    // Por eso solo se escala para corregir desbordes de ANCHO (líneas de acordes
    // muy largas), nunca de alto. El diccionario (.dict-content) tiene
    // overflow:hidden, así que ahí sí se ajusta también en alto para no cortar nada.
    const scrolls = content.classList.contains("page-content-wrap");
    const scale = scrolls
        ? Math.min(1, boxW / fullW)
        : Math.min(1, boxW / fullW, availH / fullH);
    content.style.transform = scale < 0.995 ? "scale(" + scale.toFixed(4) + ")" : "none";
    paper.dataset.fitted = "1";
}
function refitVisible() {
    papers.forEach((p) => {
        if (p.style.display !== "none") { delete p.dataset.fitted; fitPaper(p); }
    });
}

function isSinglePageMode() {
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
    const reservedTop = 56;
    const reservedBottom = 50;
    const usableHeight = Math.max(viewport.height - reservedTop - reservedBottom, viewport.height * 0.70);
    const scaleW = (viewport.width * 0.995) / pageW;
    const scaleH = (usableHeight * 0.995) / bookH;
    return Math.min(scaleW, scaleH);
}

function applyScale() {
    if (isSinglePageMode()) applyScaleSingle();
    else applyScaleOpen();
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
        container.style.transform = `translateX(-${(pageW / 2) * (1 - s)}px)`;
    } else if (isEnd) {
        book.style.transform = `translateX(100%) translateZ(0) scale(${s})`;
        container.style.transform = `translateX(-${pageW * (1 - s)}px)`;
    } else {
        book.style.transform = `translateX(0%) translateZ(0) scale(${s})`;
        container.style.transform = "translateX(0)";
    }
}

function applyScaleSingle() {
    const s = getScaleSingle();
    document.body.classList.add("single-page");
    container.style.transform = "translateX(0)";
    book.style.transform = `translateX(0%) translateZ(0) scale(${s})`;
}

let refitTimer = null;
window.addEventListener("resize", () => {
    applyScale();
    clearTimeout(refitTimer);
    refitTimer = window.setTimeout(refitVisible, 200);
});
window.addEventListener("orientationchange", () => setTimeout(() => { applyScale(); refitVisible(); }, 160));
try {
    window.matchMedia("(orientation: landscape)").addEventListener("change", () => {
        applyScale(); refitVisible();
    });
} catch (e) {}

function setTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    themeToggle.setAttribute("aria-label", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    // Con el control gestual ACTIVO todo lo ambiental está sacrificado a
    // propósito: cambiar de tema NO debe reactivar el cielo (antes pasar a modo
    // oscuro con gestos encendidos volvía a pintar y animar el starfield, justo
    // lo que se había apagado para dedicar recursos a la cámara + MediaPipe).
    // Al apagar los gestos, turnOffGestures() lo restaura según el tema real.
    if (window.__starfield && !document.body.classList.contains("gestures-on")) {
        window.__starfield.update(isDark);
    }
    try { localStorage.setItem("cantoral-theme", isDark ? "dark" : "light"); } catch {}
}

function loadTheme() {
    try { setTheme(localStorage.getItem("cantoral-theme") === "dark"); } catch { setTheme(false); }
}

let turnSeq = 0;
const BASE_FLIP_MS = 1800;
const BASE_STEP_MS = 300;
const MIN_FLIP_MS = 600;
const MIN_STEP_MS = 80;
function speedMultiplier(location) {
    const bucket = Math.floor((Math.max(1, location) - 1) / 25);
    return 1 + bucket * 0.2;
}
// Volteo forzado de la ÚLTIMA hoja: gira más despacio (peso del cierre del libro).
// Lo pone goNextPage justo antes de animatePaper y lo limpia enseguida.
let FINAL_FLIP_MS = 0;
function currentFlipDuration() {
    if (FINAL_FLIP_MS) return FINAL_FLIP_MS;
    if (window.__BURST_FLIP_OVERRIDE) return window.__BURST_FLIP_OVERRIDE;
    return Math.max(MIN_FLIP_MS, Math.round(BASE_FLIP_MS / speedMultiplier(currentLocation)));
}
function currentStepDelay() {
    return Math.max(MIN_STEP_MS, Math.round(BASE_STEP_MS / speedMultiplier(currentLocation)));
}

// body.flipping pausa las animaciones decorativas (árbol/mariposas) mientras
// alguna hoja gira. Se deriva del DOM (¿queda alguna .turning?) en vez de un
// contador, para no desincronizarse cuando un re-volteo cancela el timer.
function syncFlippingClass() {
    document.body.classList.toggle("flipping", !!document.querySelector(".paper.turning"));
}

function animatePaper(paper, restingZ) {
    if (paper._flipTimer) clearTimeout(paper._flipTimer);
    paper.classList.add("turning");
    syncFlippingClass();
    paper.style.zIndex = papers.length + 100 + (++turnSeq);
    const dur = currentFlipDuration();
    paper.style.transitionDuration = dur + "ms";
    const front = paper.querySelector(":scope > .front");
    const back  = paper.querySelector(":scope > .back");
    if (front) front.style.transitionDuration = dur + "ms";
    if (back)  back.style.transitionDuration  = dur + "ms";
    paper._flipTimer = window.setTimeout(() => {
        paper._flipTimer = null;
        paper.classList.remove("turning");
        paper.style.zIndex = restingZ;
        paper.style.transitionDuration = "";
        if (front) front.style.transitionDuration = "";
        if (back)  back.style.transitionDuration  = "";
        syncFlippingClass();
    }, dur);
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

// ── CIERRE DEL LIBRO — gesto al llegar a la contraportada ──────────────────
// El libro entero se abate sobre el lomo hasta quedar plano y ASIENTA con un
// rebote corto (Web Animations sobre .book, porque su transform es inline y lo
// reescribe applyScale; con fill:"none" el inline manda otra vez al terminar).
let closeFxTimer = null;
let bookCloseAnim = null;
function cancelBookCloseFx() {
    if (closeFxTimer) { clearTimeout(closeFxTimer); closeFxTimer = null; }
    if (bookCloseAnim) { try { bookCloseAnim.cancel(); } catch (e) {} bookCloseAnim = null; }
    document.body.classList.remove("book-closing");
    const lastLeaf = document.querySelector(".paper.closing-leaf");
    if (lastLeaf) lastLeaf.classList.remove("closing-leaf");
}
function playBookCloseFx() {
    const body = document.body;
    if (body.classList.contains("lite")) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (closeFxTimer) { clearTimeout(closeFxTimer); closeFxTimer = null; }
    body.classList.remove("book-closing");
    void body.offsetWidth;              // reinicia si se vuelve a llegar
    body.classList.add("book-closing");
    closeFxTimer = window.setTimeout(() => { closeFxTimer = null; body.classList.remove("book-closing"); }, 1700);
    if (book.animate) {
        const b = book.style.transform || "";
        // rotateY entre translateX(∓50%) para girar sobre el LOMO (borde izq), no
        // sobre el centro: la pasta se abate y queda plana.
        const f = (ry, y, rx, sc) => ({
            transform: `perspective(1500px) ${b} translateX(-50%) rotateY(${ry}deg) translateX(50%)`
                + ` translateY(${y}px) rotateX(${rx}deg) scale(${sc})`
        });
        try {
            if (bookCloseAnim) bookCloseAnim.cancel();
            bookCloseAnim = book.animate([
                Object.assign(f(-7.5, -13, 3, 1.026), { offset: 0,    easing: "cubic-bezier(.34,.02,.28,1)" }),
                Object.assign(f(0, 0, 0.6, 1.004),    { offset: 0.78, easing: "cubic-bezier(.3,.7,.4,1)" }),
                Object.assign(f(0.9, 5, -0.7, 0.99),  { offset: 0.87, easing: "cubic-bezier(.3,.1,.4,1)" }),
                Object.assign(f(0, 0, 0, 1),          { offset: 1 })
            ], { duration: 1250, fill: "none" });
            bookCloseAnim.onfinish = () => { bookCloseAnim = null; };
        } catch (e) { bookCloseAnim = null; }
    }
    // El golpe también se siente (solo con movimiento pleno; ya salimos arriba en
    // lite/reduced-motion). Dos toques cortos al asentar.
    try { if (navigator.vibrate) window.setTimeout(() => navigator.vibrate([14, 36, 22]), 900); } catch (e) {}
}

// El libro CERRADO no se hojea hacia atrás: al intentarlo, "resiste" (shake corto)
// y la correa "Volver al inicio" pulsa señalando la única salida. Un toast una-vez
// lo explica. Menú/índice/búsqueda/listones siguen vivos (eso es "reabrir", no hojear).
let __closedHintShown = false;
function resistClosedBook() {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && book && book.animate) {
        const b = book.style.transform || "";
        try {
            book.animate([
                { transform: `${b} translateX(0px)`,  offset: 0 },
                { transform: `${b} translateX(-7px)`, offset: 0.2 },
                { transform: `${b} translateX(6px)`,  offset: 0.45 },
                { transform: `${b} translateX(-4px)`, offset: 0.7 },
                { transform: `${b} translateX(0px)`,  offset: 1 }
            ], { duration: 360, easing: "ease-in-out", fill: "none" });
        } catch (e) {}
    }
    const strap = document.getElementById("backToStart");
    if (strap && !reduce) { strap.classList.remove("pulse"); void strap.offsetWidth; strap.classList.add("pulse"); }
    try {
        if (!__closedHintShown && localStorage.getItem("cantoral-closed-hint") !== "1") {
            __closedHintShown = true;
            localStorage.setItem("cantoral-closed-hint", "1");
            showToast("📕 El libro está cerrado. Toca “Volver al inicio”.");
        }
    } catch (e) {}
    try { if (!reduce && navigator.vibrate) navigator.vibrate(18); } catch (e) {}
}

function goNextPage() {
    if (document.body.classList.contains("tour-on")) return;   // durante el tour no se cambia de página
    if (document.body.classList.contains("font-slider-open")) return;
    if (currentLocation >= maxLocation) return;
    if (window.__closeRibbons) window.__closeRibbons();
    if (currentLocation === 1) {
        openBook();
        // Primer avance desde la portada: mata FX de bienvenida para siempre
        if (window.__killIntroFx) window.__killIntroFx();
        // Reanudar en el listón: la portada y su intro se ven completas y es el
        // PRIMER avance el que lleva a la página marcada, no a la página 2.
        const resume = window.__ribbonResume;
        window.__ribbonResume = null;
        if (window.__ribbonConsumeClosed) window.__ribbonConsumeClosed();
        if (resume) {
            const first = papers[0];
            first.classList.add("flipped");
            animatePaper(first, 1);
            currentLocation = 2;
            updatePaperVisibility();
            window.setTimeout(() => goToPage(resume), 900);
            return;
        }
    }
    const paper = papers[currentLocation - 1];
    // Última hoja del libro: gira más despacio y con otra curva (peso del cierre),
    // y el libro entero hace el gesto de cerrarse. En reduced-motion/lite: volteo
    // normal (sin peso ni gesto) → 100% calmado.
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const closing = currentLocation + 1 >= maxLocation
        && !document.body.classList.contains("lite") && !reduce;
    if (closing) { FINAL_FLIP_MS = 980; paper.classList.add("closing-leaf"); }
    paper.classList.add("flipped");
    animatePaper(paper, currentLocation);
    FINAL_FLIP_MS = 0;
    currentLocation++;
    updatePaperVisibility();
    if (currentLocation >= maxLocation) playBookCloseFx();
}

function goPrevPage() {
    if (document.body.classList.contains("tour-on")) return;   // durante el tour no se cambia de página
    if (document.body.classList.contains("font-slider-open")) return;
    if (currentLocation <= 1) return;
    // Libro CERRADO (contraportada): NO se hojea hacia atrás. Solo la correa
    // "Volver al inicio" sale (goToPage → burst → isAnimating=true, no se bloquea).
    if (currentLocation >= maxLocation) {
        if (!isAnimating) { resistClosedBook(); return; }
        cancelBookCloseFx();   // salida programática (correa): reabrir
    }
    if (window.__closeRibbons) window.__closeRibbons();
    currentLocation--;
    if (currentLocation === 1) closeBook(true);
    else openBook();
    const paper = papers[currentLocation - 1];
    paper.classList.remove("flipped");
    animatePaper(paper, papers.length + 2 - currentLocation);
    updatePaperVisibility();
}

// Restaurar la página guardada ANTES de aplicar visibilidad/escala.
// Si lo hacemos después, updatePaperVisibility() sobrescribiría la URL
// (con #portada) porque currentLocation aún vale 1 en ese momento.
(function restoreInitialLocation(){
    // Sólo enlaces directos (#canto-123). La página "donde me quedé" ya no se
    // restaura de golpe: la marca el listón y el salto ocurre al primer avance.
    const saved = INITIAL_HASH;
    if (!saved) return;
    const loc = getLocationForHash(saved);
    if (loc > 1 && loc <= maxLocation) {
        currentLocation = loc;
        // Aplicar estado flipped a las páginas anteriores, sin animación
        for (let i = 0; i < papers.length; i++) {
            const flipped = (i + 1) < currentLocation;
            papers[i].classList.toggle("flipped", flipped);
            papers[i].style.zIndex = flipped ? (i + 1) : (papers.length - i);
        }
        // Si iniciamos después de la portada, apagamos los efectos de intro de inmediato para no gastar recursos
        if (window.__killIntroFx) window.__killIntroFx();
    }
})();

loadTheme();
applyScale();
updatePaperVisibility();

// ═══════════════════════════════════════════════════════════════════
// LISTONES (separadores de página) — sustituyen al auto-guardado
// ═══════════════════════════════════════════════════════════════════
// Modelo: 3 ranuras. Siempre asoma UNA cinta libre (hasta llenar las 3), así
// el usuario no tiene que "agregar listón" con un botón: fija uno y sale el
// siguiente. Colapsado sólo se ve un fragmento; al tocarlo caen los listones
// fijados sobre la hoja para volver a su página. Sin ventanas de texto.
(function initRibbons() {
    const layer = document.getElementById("ribbonLayer");
    const hit = document.getElementById("ribbonHit");
    if (!layer || !hit) return;

    const ribs = Array.from(layer.querySelectorAll(".rib"));
    const closeBtn = document.getElementById("ribbonClose");
    const paintBtn = document.getElementById("ribbonPaint");
    const paletteEl = document.getElementById("ribbonPalette");
    const KEY = "cantoral-ribbons";
    const COLOR_KEY = "cantoral-ribbon-colors";
    const CLOSED_KEY = "cantoral-closed";
    const MAX = 3;   // listones: 3 (antes 5), a pedido
    // Escalera de las colas: ángulo de bajada de la diagonal (paso horizontal fijo
    // a 38px en CSS, igual que los listones abiertos).
    const STAIR_ANGLE = 10;                    // grados de la diagonal izq→der
    let slots = [null, null, null];   // { hash, label } — 3 ranuras
    let lastSlot = -1;                // último listón fijado/usado → reanudación
    let isOpen = false;
    let paintMode = false;            // modo "elegir color" (botón 🎨)

    // ── Colores de los listones (20 tonos mate, familia de la pasta salvia) ──
    // Cada color es UN tono base; brillo (arriba), sombra (abajo) e hilo de costura
    // se derivan en HSL para no guardar 4 valores por ranura.
    const PALETTE = [
        // 20 colores salvia base (original). Se redujo de 35 a 20 a pedido.
        "#9aa890", "#909a78", "#84a094", "#79a0a0", "#849ab2",
        "#7c8aa4", "#9e98bb", "#a897b9", "#a189a0", "#b498a7",
        "#c7a2a8", "#c89b8e", "#bd8b81", "#b4907c", "#c1a98c",
        "#bba874", "#b6a271", "#a8a079", "#96a0a3", "#a89a8e"
    ];
    const DEFAULT_COLORS = ["#9aa890", "#c89b8e", "#a897b9", "#849ab2", "#bba874"];
    let colors = DEFAULT_COLORS.slice();

    function hex2hsl(h) {
        h = h.replace("#", "");
        const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        let hh, s, l = (mx + mn) / 2;
        if (mx === mn) { hh = s = 0; }
        else {
            const d = mx - mn;
            s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
            switch (mx) { case r: hh = (g - b) / d + (g < b ? 6 : 0); break; case g: hh = (b - r) / d + 2; break; default: hh = (r - g) / d + 4; }
            hh /= 6;
        }
        return [hh * 360, s * 100, l * 100];
    }
    function hsl2hex(h, s, l) {
        h /= 360; s /= 100; l /= 100; let r, g, b;
        if (s === 0) { r = g = b = l; }
        else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
            const f = (t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
            r = f(h + 1 / 3); g = f(h); b = f(h - 1 / 3);
        }
        const x = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0");
        return "#" + x(r) + x(g) + x(b);
    }
    function derive(base) {
        const [h, s, l] = hex2hsl(base);
        return {
            c: base,
            hi: hsl2hex(h, Math.min(s + 4, 100), Math.min(l + 8, 92)),
            lo: hsl2hex(h, Math.min(s + 6, 100), Math.max(l - 12, 8)),
            th: hsl2hex(h, Math.max(s - 14, 4), Math.max(l - 22, 10))
        };
    }
    function loadColors() {
        try {
            const raw = JSON.parse(localStorage.getItem(COLOR_KEY) || "null");
            if (Array.isArray(raw)) for (let i = 0; i < MAX; i++) if (raw[i]) colors[i] = raw[i];
        } catch (e) {}
    }
    function saveColors() {
        try { localStorage.setItem(COLOR_KEY, JSON.stringify(colors)); } catch (e) {}
    }
    // Pinta cada listón con su color base + los 3 derivados (inline → gana al CSS).
    function applyColors() {
        ribs.forEach((r, i) => {
            const d = derive(colors[i] || DEFAULT_COLORS[i] || "#9aa890");
            r.style.setProperty("--rib-c", d.c);
            r.style.setProperty("--rib-hi", d.hi);
            r.style.setProperty("--rib-lo", d.lo);
            r.style.setProperty("--rib-thread", d.th);
        });
    }

    function load() {
        try {
            const raw = JSON.parse(localStorage.getItem(KEY) || "null");
            if (raw && Array.isArray(raw.slots)) {
                for (let i = 0; i < MAX; i++) slots[i] = raw.slots[i] || null;
                if (typeof raw.last === "number") lastSlot = raw.last;
            }
        } catch (e) {}
        // Una sola marca por página: si por datos viejos quedaron dos listones en
        // la misma hoja, se descarta el duplicado y se compactan las ranuras.
        const seen = {};
        for (let i = 0; i < MAX; i++) {
            const s = slots[i];
            if (s && s.hash) {
                if (seen[s.hash]) slots[i] = null;
                else seen[s.hash] = true;
            }
        }
        // Ranuras POSICIONALES: cada slot conserva su color/lugar; NO se compactan
        // al quitar uno (quitar el rojo deja su hueco libre y no recorre los demás).
        if (lastSlot >= 0 && !slots[lastSlot]) lastSlot = firstPinned();
    }
    function save() {
        try {
            localStorage.setItem(KEY, JSON.stringify({ slots: slots, last: lastSlot }));
        } catch (e) {}
    }

    function pinnedCount() { return slots.filter(Boolean).length; }
    function firstFree() {
        for (let i = 0; i < MAX; i++) if (!slots[i]) return i;
        return -1;
    }
    function firstPinned() {
        for (let i = 0; i < MAX; i++) if (slots[i]) return i;
        return -1;
    }

    // Etiqueta = el número de página impreso en el pie de la hoja actual.
    function currentLabel() {
        const paper = papers[currentLocation - 1];
        const face = paper ? paper.querySelector(":scope > .front") : null;
        const n = face ? face.querySelector(".footer-line-2") : null;
        const txt = n ? n.textContent.trim() : "";
        return txt || String(currentLocation);
    }

    // Datos del canto de la hoja actual para escribir en el listón:
    //   full = título completo ("172. MADRE ERES TERNURA.") a lo largo de la cinta
    //   id   = "C" + número de canto ("C172") para la punta que cuelga
    // Las páginas de continuación heredan el título del canto anterior; las que no
    // son de canto (secciones/índice) caen al número impreso, sin id.
    function currentSongInfo() {
        const paper = papers[currentLocation - 1];
        const face = paper ? paper.querySelector(":scope > .front") : null;
        let title = face ? face.querySelector(".song-title") : null;
        if (!title && face && face.querySelector(".page-content-wrap")) {
            const idx = papers.indexOf(paper);
            for (let i = idx - 1; i >= 0; i--) {
                const t = papers[i].querySelector(".front .song-title");
                if (t) { title = t; break; }
            }
            // OPT ventana: si el canto padre está DESMONTADO (fuera del buffer), resolver
            // por datos (SONG_CONT + DATA.cantos) para no perder la etiqueta del canto.
            if (!title) {
                const num = SONG_CONT.get(paper.id);
                if (num) {
                    const c = DATA.cantos.find(x => String(x.id) === num);
                    if (c) return { full: (c.title || "").replace(/\s+/g, " ").trim(), id: "C" + num };
                }
            }
        }
        if (title) {
            const full = title.textContent.replace(/\s+/g, " ").trim();
            const id = title.dataset.song ? "C" + title.dataset.song : "";
            return { full: full, id: id };
        }
        return { full: currentLabel(), id: "" };
    }

    function render() {
        const atCover = currentLocation <= 1;
        // Hash de la hoja abierta: el listón puesto AQUÍ se queda colgando.
        const hereHash = atCover ? null : getHashForLocation(currentLocation);
        // UN solo listón por página: si esta hoja ya tiene uno, NO se ofrece el
        // listón libre (+) para que no se pueda marcar dos veces la misma página.
        const alreadyHere = !!(hereHash && slots.some(s => s && s.hash === hereHash));
        const free = alreadyHere ? -1 : firstFree();
        // Colapsado el fragmento visible es el listón LIBRE; cuando ya no queda
        // ninguno, es el color del PRIMER listón fijado (lo pidió así el boceto).
        const top = free >= 0 ? free : firstPinned();
        // Cada slot es POSICIONAL: se muestra si está fijado (en su lugar/color) o
        // si es el ÚNICO hueco libre ofrecido como "+". En la pasta sólo cuelgan
        // los fijados.
        let visCount = 0;
        let stack = 0;
        let rank = 0;   // orden ENTRE los fijados (para el escalonado de colas)
        for (let i = 0; i < MAX; i++) {
            const r = ribs[i];
            const pinned = !!slots[i];
            // En modo pintar se muestran los 5 (aunque estén libres) para poder
            // elegir su color. Fuera de pintar: los fijados siempre; el "+" libre
            // sólo con el panel abierto (colgando no se ofrece agregar).
            // El "+" libre asoma con el panel abierto; además, si NO queda ningún
            // listón fijado, se mantiene asomando aun con el panel cerrado para que
            // el usuario siga viendo que hay listones disponibles (la zona touch ya
            // está ahí; sin este peek quedaría invisible pero activa = confuso).
            const on = paintMode ? true
                : (atCover ? pinned : (pinned || (i === free && (isOpen || pinnedCount() === 0))));
            if (on) visCount++;
            r.classList.toggle("show", on);
            r.classList.toggle("pinned", pinned);
            r.classList.toggle("free", on && !pinned);
            // .here = cuelga de arriba abajo cruzando por detrás de la hoja.
            const isHere = (pinned && hereHash && slots[i].hash === hereHash) || (atCover && pinned);
            r.classList.toggle("here", isHere);
            if (!on) continue;
            r.style.setProperty("--i", String(i));
            // Cola escalonada por RANGO entre fijados (no por índice de slot): así,
            // aunque el hueco libre esté en medio, las puntas caen ordenadas y la
            // última sigue cabiendo en pantalla.
            if (pinned) r.style.setProperty("--rank", String(rank++));
            // Encimados: el visible al frente, los demás asomando apenas detrás.
            r.style.setProperty("--off", String(i === top ? 0 : ++stack));
            r.style.zIndex = String(i === top ? 30 : 20 - i);
            // Cada listón fijado lleva su título ABREVIADO a lo largo (el id ya va
            // en la punta, así que quitamos el "NN." del inicio y recortamos para
            // que no se apriete ni choque con la X); el libre muestra "+".
            const num = r.querySelector(".rib-num");
            if (num) {
                if (pinned) {
                    let t = (slots[i].full || slots[i].label || "");
                    t = t.replace(/^\s*\d+\s*[.\-)]\s*/, "");   // quita "19. " (id va en la punta)
                    t = t.replace(/[.\s]+$/, "");                // quita punto/espacios finales
                    const MAXLEN = 16;
                    if (t.length > MAXLEN) t = t.slice(0, MAXLEN).trim() + "…";
                    num.textContent = t || slots[i].id || "";
                } else {
                    num.textContent = "+";
                }
            }
            // Punta que cuelga: el id ("C172"). CSS sólo lo muestra en .here.
            const tip = r.querySelector(".rib-tip");
            if (tip) tip.textContent = (pinned && slots[i].id) ? slots[i].id : "";
            r.setAttribute("aria-label", pinned
                ? "Ir a la página " + slots[i].label
                : "Fijar listón en esta página");
        }
        // Cuántas cintas hay desplegadas: coloca el botón de cerrar a su derecha.
        layer.style.setProperty("--n", String(visCount));
        if (closeBtn) closeBtn.classList.toggle("hidden", pinnedCount() === 0);
        // 🎨 sólo con el panel desplegado (o pintando).
        if (paintBtn) paintBtn.classList.toggle("hidden", !(isOpen || paintMode));

        // Colas adaptables al hueco REAL bajo el libro:
        //   - El de DELANTE (slot0) asoma un mínimo fijo para que su id despeje el
        //     borde del libro (no quede oculto).
        //   - El resto se escalona con un paso que se ajusta para que la punta del
        //     ÚLTIMO (3º incluido) siga cabiendo en pantalla.
        // La cola i cuelga extra_i = --rbase + i·--rstep. id_i queda ≈ extra_i-26
        // px bajo el libro (el id va 13px sobre la punta, y la punta 13px bajo el
        // borde del libro).
        const bookEl = document.getElementById("book");
        if (bookEl) {
            const gap = window.innerHeight - bookEl.getBoundingClientRect().bottom;
            const n = Math.max(1, pinnedCount());
            const d0 = Math.max(12, Math.min(16, gap * 0.28)); // asomo del primero
            const dLast = Math.max(d0, gap - 8);               // el último, casi al borde
            let step = n > 1 ? (dLast - d0) / (n - 1) : 18;
            // El paso HORIZONTAL es fijo (38px, igual que abiertos); la escalera la
            // da la altura de la cola. Se apunta a ~STAIR_ANGLE° (38·tanθ) y se acota
            // para que siempre quepan las 5 puntas en el hueco bajo el libro.
            const ideal = 30 * Math.tan(STAIR_ANGLE * Math.PI / 180);
            step = Math.max(6, Math.min(step, ideal, 16));
            layer.style.setProperty("--rbase", (26 + d0).toFixed(1) + "px");
            layer.style.setProperty("--rstep", step.toFixed(1) + "px");
        }
    }

    function setOpen(v) {
        isOpen = v;
        layer.classList.toggle("open", v);
        layer.setAttribute("aria-hidden", v ? "false" : "true");
        hit.setAttribute("aria-expanded", v ? "true" : "false");
        ribs.forEach(r => r.tabIndex = v ? 0 : -1);
        if (!v && paintMode) setPaint(false);
        render();
    }

    // ── Modo pintar (botón 🎨) + paleta de colores por listón ──
    function buildPalette() {
        if (!paletteEl || paletteEl.childElementCount) return;
        PALETTE.forEach((hex) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "rib-swatch";
            b.dataset.hex = hex;
            b.style.background = hex;
            b.setAttribute("aria-label", "Color " + hex);
            b.addEventListener("click", (e) => {
                e.stopPropagation();
                if (paintTarget < 0) return;
                colors[paintTarget] = hex;
                applyColors();
                saveColors();
                markSwatch();
                closePalette();
            });
            paletteEl.appendChild(b);
        });
    }
    let paintTarget = -1;
    function markSwatch() {
        if (!paletteEl) return;
        const cur = paintTarget >= 0 ? colors[paintTarget] : null;
        paletteEl.querySelectorAll(".rib-swatch").forEach(s =>
            s.classList.toggle("sel", s.dataset.hex === cur));
    }
    function openPalette(i) {
        if (!paletteEl) return;
        buildPalette();
        paintTarget = i;
        markSwatch();
        // Ancla la paleta bajo el listón elegido.
        paletteEl.style.setProperty("--px", (26 + i * 38) + "px");
        paletteEl.classList.add("open");
    }
    function closePalette() {
        paintTarget = -1;
        if (paletteEl) paletteEl.classList.remove("open");
    }
    function setPaint(v) {
        paintMode = v;
        layer.classList.toggle("painting", v);
        if (paintBtn) paintBtn.setAttribute("aria-pressed", v ? "true" : "false");
        if (!v) closePalette();
        render();
    }

    function pin(i) {
        const hash = getHashForLocation(currentLocation);
        if (!hash) return;
        // Un listón por página: si ya hay uno en esta hoja, no duplicar.
        if (slots.some((s, j) => s && s.hash === hash && j !== i)) return;
        const info = currentSongInfo();
        slots[i] = { hash: hash, label: currentLabel(), full: info.full, id: info.id };
        lastSlot = i;
        save();
        render();
        const r = ribs[i];
        r.classList.add("pinning");
        window.setTimeout(() => r.classList.remove("pinning"), 520);
        // Se cierra solo: el listón queda puesto y la vista vuelve limpia.
        window.setTimeout(() => setOpen(false), 900);
    }

    function unpin(i) {
        slots[i] = null;
        // Ranuras POSICIONALES: el hueco se queda en su sitio (no se recorren los
        // demás listones), así conservan color y página los que siguen fijados.
        if (lastSlot === i) lastSlot = firstPinned();
        save();
        render();
        if (pinnedCount() === 0) setOpen(false);
    }

    hit.addEventListener("click", (e) => {
        e.stopPropagation();
        setOpen(!isOpen);
    });

    ribs.forEach((r, i) => {
        r.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!isOpen) { setOpen(true); return; }
            // Modo pintar: tocar un listón abre su paleta (no fija ni navega).
            if (paintMode) { openPalette(i); return; }
            if (slots[i]) {
                const loc = getLocationForHash(slots[i].hash);
                lastSlot = i;
                save();
                setOpen(false);
                if (loc > 0 && loc !== currentLocation) goToPage(loc);
            } else {
                pin(i);
            }
        });
        const x = r.querySelector(".rib-x");
        if (x) x.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            unpin(i);
        });
    });

    // "Cerrar libro": el ritual. Refrescar o volver a entrar deja al usuario
    // donde iba (el navegador recuerda el hash), así que la vuelta a la pasta la
    // decide ÉL con este botón. Deja la marca, limpia el hash y devuelve el libro
    // a la portada volteando hojas.
    function closeBook() {
        const active = (lastSlot >= 0 && slots[lastSlot]) ? lastSlot : firstPinned();
        if (active < 0) return;
        try { localStorage.setItem(CLOSED_KEY, String(active)); } catch (e) {}
        try {
            history.replaceState(null, null, window.location.pathname + window.location.search);
        } catch (e) {}
        setOpen(false);
        goToPage(1);
    }
    if (closeBtn) closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeBook();
    });

    if (paintBtn) paintBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!isOpen) setOpen(true);
        setPaint(!paintMode);
    });

    document.addEventListener("click", (e) => {
        if (isOpen && !layer.contains(e.target) && e.target !== hit) setOpen(false);
    });

    // Colapsar los listones desde fuera (p. ej. al cambiar de página con swipe o
    // teclado, que no disparan el click de arriba).
    window.__closeRibbons = function () { if (isOpen) setOpen(false); };

    // Al cambiar tamaño/orientación cambia el hueco bajo el libro: recalcular
    // --tail para que las puntas sigan cabiendo.
    window.addEventListener("resize", () => { if (window.__syncRibbons) window.__syncRibbons(); });

    // En la pasta no hay página que marcar: se va el botón de toque y el listón
    // libre, pero los fijados se quedan colgando del libro cerrado.
    window.__syncRibbons = function () {
        const atCover = currentLocation <= 1;
        layer.classList.toggle("at-cover", atCover);
        layer.classList.toggle("hidden", atCover && pinnedCount() === 0);
        hit.classList.toggle("hidden", atCover);
        if (atCover && isOpen) setOpen(false);
        render();
    };

    // Se consume la marca de "libro cerrado" en el primer avance (no al cargar:
    // si el usuario refresca sin abrir, el ritual sigue en pie).
    window.__ribbonConsumeClosed = function () {
        try { localStorage.removeItem(CLOSED_KEY); } catch (e) {}
    };

    loadColors();
    applyColors();
    load();
    render();
    setOpen(false);

    // Reanudación diferida: SÓLO tras cerrar el libro con el botón. Arranca en la
    // pasta con todas sus animaciones y goNextPage() consume esta marca en el
    // primer avance para caer en la página del listón. En cualquier otro caso
    // manda el hash / el auto-guardado y no hay ceremonia.
    const resumeSlot = BOOK_WAS_CLOSED;
    if (resumeSlot >= 0 && slots[resumeSlot]) {
        const loc = getLocationForHash(slots[resumeSlot].hash);
        if (loc > 1 && loc <= maxLocation) window.__ribbonResume = loc;
    }
    window.__syncRibbons();
})();

(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    fontsReady = true;
    papers.forEach((p) => { if (p.style.display !== "none" && !p.dataset.fitted) fitPaper(p); });
});
themeToggle.addEventListener("click", () => {
    setTheme(!document.body.classList.contains("dark-mode"));
});

// ── Modo LIGERO: toggle + persistencia. La clase body.lite hace el resto por CSS
// (apaga animaciones/transiciones y oculta decorativos). Aquí además detenemos los
// decorativos manejados por JS (starfield) y refrescamos su estado.
function setLite(on, persist) {
    document.body.classList.toggle("lite", !!on);
    const b = document.getElementById("liteBtn");
    if (b) {
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.classList.toggle("is-active", !!on);
        // La MISMA perla cambia de emoji según la acción disponible:
        // lite OFF → 🐢 (activar ligero) · lite ON → ⚡ (volver a normal con animaciones).
        b.textContent = on ? "⚡" : "🐢";
        b.setAttribute("aria-label", on ? "Volver a versión con animaciones" : "Modo ligero (apagar animaciones)");
        b.setAttribute("title", on ? "Volver a versión con animaciones" : "Modo ligero (apagar animaciones)");
    }
    if (persist) { try { localStorage.setItem("cantoral-lite", on ? "1" : "0"); } catch (e) {} }
    // Starfield (WAAPI/JS): apagar en lite; reanudar según tema al salir.
    try { if (window.__starfield) window.__starfield.update(!on && document.body.classList.contains("dark-mode")); } catch (e) {}
}
(function wireLite() {
    const b = document.getElementById("liteBtn");
    if (!b) return;
    const on = document.body.classList.contains("lite");
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.classList.toggle("is-active", on);
    b.textContent = on ? "⚡" : "🐢";
    b.setAttribute("aria-label", on ? "Volver a versión con animaciones" : "Modo ligero (apagar animaciones)");
    b.setAttribute("title", on ? "Volver a versión con animaciones" : "Modo ligero (apagar animaciones)");

    const modal = document.getElementById("liteModal");
    const closeModal = () => { if (modal) { modal.classList.remove("show"); modal.setAttribute("aria-hidden", "true"); } };
    const openModal = () => { if (modal) { modal.classList.add("show"); modal.setAttribute("aria-hidden", "false"); } };

    b.addEventListener("click", (e) => {
        e.stopPropagation();
        // Apagar = directo. Encender = mostrar aviso de qué hace la función.
        if (document.body.classList.contains("lite")) { setLite(false, true); return; }
        if (modal) openModal(); else setLite(true, true);
    });
    if (modal) {
        document.getElementById("liteCancelBtn")?.addEventListener("click", (e) => { e.stopPropagation(); closeModal(); });
        document.getElementById("liteConfirmBtn")?.addEventListener("click", (e) => { e.stopPropagation(); setLite(true, true); closeModal(); });
        modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    }
})();

// ═══════════════════════════════════════════════════════════════════
// INSTALAR como app (PWA) — FAB consciente de plataforma
//   · Android/escritorio: capturamos `beforeinstallprompt` y disparamos el
//     instalador NATIVO con nuestro botón (mejor conversión que el mini-infobar).
//   · iOS/Safari: NO existe ese evento → mostramos el FAB igual y al tocarlo
//     abrimos los pasos ilustrados (Compartir → Añadir a inicio).
//   · Ya instalado (standalone) o tras instalar: el FAB se OCULTA.
//   El FAB es la reentrada permanente: no ocupa lugar en la hamburguesa.
// ═══════════════════════════════════════════════════════════════════
(function wireInstall() {
    const fab = document.getElementById("installBtn");
    if (!fab) return;
    const iosModal = document.getElementById("iosInstallModal");

    const standalone = window.matchMedia("(display-mode: standalone)").matches
        || window.navigator.standalone === true;
    if (standalone) return; // ya vive como app → nunca mostrar el FAB

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    let deferred = null;

    // Revela el FAB, pero NO encima del intro de bienvenida (espera a que se vaya).
    function reveal() {
        const intro = document.getElementById("welcomeIntro");
        if (intro && intro.offsetParent !== null &&
            getComputedStyle(intro).display !== "none") {
            setTimeout(reveal, 600);
            return;
        }
        fab.hidden = false;
    }

    // Android/escritorio: el navegador avisa cuándo es instalable.
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferred = e;
        reveal();
    });
    // iOS no dispara el evento → lo mostramos igual (tras el intro).
    if (isIOS) setTimeout(reveal, 3800);

    const openIos = () => {
        if (!iosModal) return;
        iosModal.classList.add("show");
        iosModal.setAttribute("aria-hidden", "false");
    };
    const closeIos = () => {
        if (!iosModal) return;
        iosModal.classList.remove("show");
        iosModal.setAttribute("aria-hidden", "true");
    };

    fab.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (deferred) {
            deferred.prompt();
            let outcome = "dismissed";
            try { ({ outcome } = await deferred.userChoice); } catch (_) {}
            deferred = null;
            if (outcome === "accepted") fab.hidden = true;
            return;
        }
        if (isIOS) { openIos(); return; }
        // Fallback (navegador sin prompt y no-iOS): también mostramos los pasos.
        openIos();
    });

    document.getElementById("iosInstallCloseBtn")
        ?.addEventListener("click", (e) => { e.stopPropagation(); closeIos(); });
    iosModal?.addEventListener("click", (e) => { if (e.target === iosModal) closeIos(); });

    // Si se instala, ocúltalo y descarta el prompt guardado.
    window.addEventListener("appinstalled", () => { fab.hidden = true; deferred = null; });
})();

nextBtn.addEventListener("click", goNextPage);
prevBtn.addEventListener("click", goPrevPage);

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") goNextPage();
    else if (e.key === "ArrowLeft") goPrevPage();
    else if (e.key === "Escape") closeSearch();
});

// ═══════════════════════════════════════════════════════════════════
// Búsqueda — corpus construido desde JSON, no desde el DOM
// ═══════════════════════════════════════════════════════════════════

const searchBtn     = document.querySelector("#searchBtn");
const searchOverlay = document.querySelector("#searchOverlay");
const searchInput   = document.querySelector("#searchInput");
const searchClear   = document.querySelector("#searchClear");
const searchResults = document.querySelector("#searchResults");


// Sección por KEY (para cantos cuyo id no es numérico, p. ej. "cred1" de la
// sección CRÉDITOS): SECTION_MAP se indexa por rango numérico de nº de canto,
// así que parseInt("cred1") = NaN dejaba esas páginas SIN sección en la búsqueda.
const SECTION_BY_KEY = new Map(
    DATA.sections.map(sec => [sec.key, {
        label: sec.label,
        aliases: SECTION_ALIASES[sec.key] || [sec.key],
        from: sec.songRange[0],
        to: sec.songRange[1]
    }])
);

// sectionKey (opcional) tiene prioridad: resuelve cualquier id, numérico o no.
function getSectionForSong(songNum, sectionKey) {
    if (sectionKey && SECTION_BY_KEY.has(sectionKey)) return SECTION_BY_KEY.get(sectionKey);
    const n = parseInt(songNum, 10);
    if (isNaN(n)) return null;
    return SECTION_MAP.find(s => n >= s.from && n <= s.to) || null;
}

function norm(str) {
    return (str || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
}

// ═══════════════════════════════════════════════════════════════════
// TOLERANCIA ORTOGRÁFICA (español)
// Clave FONÉTICA: reduce a un mismo código las letras que en español suenan
// igual, para que el buscador encuentre el canto aunque se escriba "mal":
//   b=v      (vendito → bendito, alavado → alabado)
//   c/z/s    (corason → corazón, sielo → cielo)
//   ll/y     (yamado → llamado, alleluya → aleluya)
//   h muda   (haleluya → aleluya, oy → hoy)
//   g(e,i)=j (jesus/gesus, virgen/virjen)
//   qu/k/c   (kiere → quiere, kirie → quirie)
//   x=s, w=b, ph=f, dobles → simple, -s final (plural) fuera
// Se aplica SOBRE texto ya pasado por norm() (minúsculas, sin acentos).
// ═══════════════════════════════════════════════════════════════════
function phon(s) {
    let t = norm(s);
    if (!t) return "";
    t = t
        .replace(/ph/g, "f")
        .replace(/qu/g, "k")           // quiere → kiere
        .replace(/gu([ei])/g, "g$1")   // guerra → gerra (la u es muda)
        .replace(/g([ei])/g, "j$1")    // gente → jente, virgen → virjen
        .replace(/c([ei])/g, "s$1")    // cielo → sielo
        .replace(/[cqk]/g, "k")        // casa → kasa
        .replace(/z/g, "s")            // corazon → korason
        .replace(/v/g, "b")            // vendito → bendito
        .replace(/w/g, "b")
        .replace(/ll/g, "y")           // llamado → yamado
        .replace(/h/g, "")             // haleluya → aleluya
        .replace(/x/g, "s")
        .replace(/(.)\1+/g, "$1")      // dobles: rr→r, ss→s, nn→n
        .replace(/s\b/g, "");          // plural final: cantos → kanto
    return t.trim();
}

// Igualdad tolerante entre DOS PALABRAS. Combina:
//   1) igualdad exacta / prefijo (para autocompletar mientras se teclea)
//   2) igualdad FONÉTICA (errores de b/v, s/c/z, ll/y, h…)
//   3) distancia de edición (letras cambiadas, faltantes o sobrantes),
//      también sobre la forma fonética, con umbral según el largo.
function fuzzyMatch(a, b) {
    a = norm(a); b = norm(b);
    if (!a || !b) return false;
    if (a === b) return true;
    // Prefijo: sólo si la parte escrita ya es significativa (≥3), para que
    // "os" no coincida con medio cantoral.
    const shortest = Math.min(a.length, b.length);
    if (shortest >= 3 && (b.startsWith(a) || a.startsWith(b))) return true;
    if (shortest >= 4 && (b.includes(a) || a.includes(b))) return true;

    const pa = phon(a), pb = phon(b);
    if (pa && pa === pb) return true;                       // suenan igual

    // Umbral por la palabra MÁS LARGA: palabras largas admiten más erratas.
    const longest = Math.max(a.length, b.length);
    const threshold = longest <= 4 ? 1 : longest <= 7 ? 2 : longest <= 11 ? 3 : 4;
    if (levenshtein(a, b) <= threshold) return true;
    // Erratas + confusión fonética a la vez (p. ej. "alelluia" vs "aleluya").
    if (pa && pb && levenshtein(pa, pb) <= threshold) return true;
    return false;
}

// Igualdad tolerante para FRASES completas (varias palabras): compara la
// forma fonética de toda la cadena, permitiendo más erratas por ser larga.
function fuzzyPhrase(a, b) {
    const pa = phon(a), pb = phon(b);
    if (!pa || !pb) return false;
    if (pa === pb || pb.includes(pa)) return true;
    const longest = Math.max(pa.length, pb.length);
    return levenshtein(pa, pb) <= Math.min(5, Math.max(2, Math.floor(longest * 0.25)));
}

// Puntúa un canto contra la consulta. Cada señal existe en DOS niveles:
// exacto (más puntos) y TOLERANTE — fonético o con erratas (algo menos), de
// modo que escribir "alavado", "corason" o "haleluya" sigue encontrando el canto.
function scoreEntry(entry, qNorm, qWords, qPhon, qWordsPhon) {
    let score = 0;
    const { titleN, lyricsN, titleP, lyricsP, titleWords, lyricWords, titleWordsP, lyricWordsP } = entry;
    const section = entry.section;
    const sectionN = section ? norm(section.label) : "";
    const sectionAliases = section ? section.aliases : [];

    // ── Frase completa ──
    if (sectionN && qNorm.includes(sectionN)) score += 20;
    for (const alias of sectionAliases) { if (qNorm.includes(alias)) { score += 18; break; } }
    if (titleN.includes(qNorm))  score += 12;
    else if (qPhon && titleP.includes(qPhon)) score += 9;      // título "mal escrito"
    else if (qWords.length > 1 && fuzzyPhrase(qNorm, titleN)) score += 8;
    if (lyricsN.includes(qNorm)) score += 8;
    else if (qPhon && lyricsP.includes(qPhon)) score += 6;     // verso "mal escrito"

    // ── Palabra por palabra ──
    for (let i = 0; i < qWords.length; i++) {
        const word = qWords[i];
        if (word.length < 3) continue;
        const wp = qWordsPhon[i];

        if (sectionN.includes(word)) score += 6;
        for (const alias of sectionAliases) { if (alias.includes(word) || word.includes(alias)) { score += 5; break; } }
        for (const alias of sectionAliases) { if (fuzzyMatch(word, alias)) { score += 4; break; } }

        if (titleN.includes(word)) score += 4;
        else if (wp && titleWordsP.some(tw => tw === wp)) score += 3;          // suena igual
        else if (titleWords.some(tw => fuzzyMatch(word, tw))) score += 3;      // errata

        if (lyricsN.includes(word)) score += 2;
        else if (wp && lyricWordsP.some(lw => lw === wp)) score += 1.5;
        else if (lyricWords.some(lw => fuzzyMatch(word, lw))) score += 1;
    }
    return score;
}

// Corpus construido desde JSON en vez de recorrer el DOM
function buildCorpus() {
    const corpus = [];
    for (const c of DATA.cantos) {
        if (c.layout === "continuation") continue;
        const songNum = c.id;
        const titleText = c.title;
        const lyricsArr = [];
        function extractLyrics(items) {
            for (const it of items) {
                if (it.type === "pair" && it.lyric) lyricsArr.push(it.lyric);
                if (it.type === "paragraph" && it.text) lyricsArr.push(it.text);
                if (it.type === "block" && it.content) extractLyrics(it.content);
                if (it.type === "extra" && it.paragraphs) it.paragraphs.forEach(p => lyricsArr.push(p));
            }
        }
        extractLyrics(c.content);
        // c.section resuelve también los ids NO numéricos (p. ej. "cred1" de CRÉDITOS).
        const section = getSectionForSong(songNum, c.section);
        const lyrics = lyricsArr.join(" ");
        // Formas normalizada y FONÉTICA precalculadas UNA vez por canto. Antes se
        // recalculaba norm() de toda la letra en cada pulsación de tecla y por cada
        // canto del corpus; ahora la búsqueda tolerante no cuesta más que la anterior.
        const titleN  = norm(titleText);
        const lyricsN = norm(lyrics);
        corpus.push({
            songNum, titleText, lyrics, pageNum: c.pageNum, section,
            titleN, lyricsN,
            titleP:  phon(titleText),
            lyricsP: phon(lyrics),
            titleWords:  titleN.split(" ").filter(w => w.length > 2),
            lyricWords:  [...new Set(lyricsN.split(" ").filter(w => w.length > 3))],
            titleWordsP: [...new Set(titleN.split(" ").filter(w => w.length > 2).map(phon))],
            lyricWordsP: [...new Set(lyricsN.split(" ").filter(w => w.length > 3).map(phon))],
        });
    }
    return corpus;
}

// OPT arranque: el corpus de búsqueda NO se arma al cargar (era CPU en el arranque).
// Se construye en idle o a la primera búsqueda (ensureCorpus), lo que ocurra antes.
let CORPUS = null;
function ensureCorpus() { if (!CORPUS) CORPUS = buildCorpus(); return CORPUS; }
(window.requestIdleCallback || (cb => setTimeout(cb, 1)))(ensureCorpus, { timeout: 3000 });

// Detecta consultas numéricas. Devuelve { num, explicitPage } o null.
// - "220"        -> { num:"220", explicitPage:false }  (busca por nº de canto Y página)
// - "pagina 50"  -> { num:"50",  explicitPage:true  }  (solo página)
// - "220 amor"   -> null                               (texto normal)
function parseNumberQuery(qNorm) {
    const numMatch = qNorm.match(/\d+[a-z]?/);
    if (!numMatch) return null;
    const num = numMatch[0];
    const rest = qNorm.replace(num, " ").trim();
    if (!rest) return { num, explicitPage: false };
    const pageAliases = ["p", "pg", "pag", "pags", "pagina", "paginas", "pgina"];
    const words = rest.split(/\s+/).filter(Boolean);
    const allPageWords = words.every(w =>
        pageAliases.includes(w) || (w.length >= 3 && fuzzyMatch(w, "pagina"))
    );
    return allPageWords ? { num, explicitPage: true } : null;
}

function localSearch(q) {
    const qNorm = norm(q);
    const numQ = parseNumberQuery(qNorm);
    if (numQ) {
        const { num, explicitPage } = numQ;
        // Si el usuario escribió "página N" solo buscamos por página.
        // Para un número suelto priorizamos el nº de canto (lo que ve en el título)
        // y luego la página física, sin duplicar cantos.
        const sn = e => String(e.songNum);
        const pg = e => String(e.pageNum);
        const buckets = explicitPage
            ? [
                CORPUS.filter(e => pg(e) === num),
                CORPUS.filter(e => pg(e) !== num && pg(e).startsWith(num)),
              ]
            : [
                CORPUS.filter(e => sn(e) === num),
                CORPUS.filter(e => pg(e) === num),
                CORPUS.filter(e => sn(e) !== num && sn(e).startsWith(num)),
                CORPUS.filter(e => pg(e) !== num && pg(e).startsWith(num)),
              ];
        const seen = new Set();
        const out = [];
        for (const bucket of buckets) {
            for (const e of bucket) {
                if (seen.has(e.songNum)) continue;
                seen.add(e.songNum);
                out.push({ ...e, score: 100, snippet: e.section ? e.section.label : "" });
            }
        }
        return out.slice(0, 8);
    }
    const qWords = qNorm.split(" ").filter(w => w.length >= 2);
    const qPhon = phon(qNorm);
    const qWordsPhon = qWords.map(phon);
    return CORPUS
        .map(entry => {
            const score = scoreEntry(entry, qNorm, qWords, qPhon, qWordsPhon);
            let snippet = "";
            const lyricsN = entry.lyricsN;
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

async function aiSearch(q) {
    const corpusText = CORPUS.map(c =>
        `[${c.songNum}] (${c.section ? c.section.label : "sin sección"}) ${c.titleText}: ${c.lyrics.substring(0, 150)}`
    ).join("\n");
    const prompt = `Eres asistente de un cantoral católico. El usuario busca: "${q}"\n\nCorpus de cantos (número, sección, título, letra parcial):\n${corpusText}\n\nInstrucciones:\n- Busca por letra, título Y sección (ej: "Kirie Eleyson F" = sección Kirie Eleison, canto F)\n- Acepta variaciones ortográficas: Eleyson=Eleison, Kyrie=Kirie\n- Devuelve SOLO JSON válido sin markdown:\n{"results":[{"songNum":"N","reason":"frase relevante máx 60 chars"}]}\nMáximo 5 resultados. Sin coincidencias: {"results":[]}`;
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
        const data = await resp.json();
        const text = data.content.map(i => i.text || "").join("");
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        if (!parsed.results?.length) { renderResults(localSearch(q), false); return; }
        const enriched = parsed.results
            .map(r => { const entry = CORPUS.find(c => c.songNum === String(r.songNum)); return entry ? { ...entry, snippet: r.reason, score: 10 } : null; })
            .filter(Boolean);
        renderResults(enriched, true);
    } catch { renderResults(localSearch(q), false); }
}

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

function openSearch()  { searchOverlay.classList.add("active"); document.body.classList.add("searching"); searchInput.focus(); }
function closeSearch() { searchOverlay.classList.remove("active"); document.body.classList.remove("searching"); searchInput.value = ""; searchResults.innerHTML = ""; searchInput.blur(); }

// La barra de búsqueda permanece ABIERTA hasta que el usuario toque FUERA de
// ella (cualquier parte de la pantalla) o el botón (×). Antes se cerraba sola a
// los 3.5 s de inactividad; ese autocierre se quitó a pedido del usuario.
// pointerdown (no click) para reaccionar al primer contacto; se ignoran los
// toques dentro del overlay (caja/resultados/×) y sobre el botón de búsqueda.
document.addEventListener("pointerdown", (e) => {
    if (!searchOverlay.classList.contains("active")) return;
    if (!e.target.closest) return;
    if (e.target.closest("#searchOverlay") || e.target.closest("#searchBtn")) return;
    closeSearch();
});

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
    ensureCorpus();                          // OPT: arma el corpus a la primera búsqueda si idle no lo hizo
    renderResults(localSearch(q), false);
    searchTimeout = window.setTimeout(() => aiSearch(q), 600);
});

// ═══════════════════════════════════════════════════════════════════
// Navegación a páginas específicas
// ═══════════════════════════════════════════════════════════════════

// Dinámico: la posición del índice se corre si se añaden páginas al frente
// (p. ej. la dedicatoria). Apunta al separador ÍNDICE, o a la 1ª página de índice.
function indexLocation() {
    ensureIndexBuilt();   // OPT: arma+colapsa el índice antes de calcular su posición
    return locOfPaperWith(".decor-section-page") ||
           locOfPaperWith(".index-page") || 5;
}
const INSTANT_THRESHOLD = 8;
const BURST_PAGES = 10;
const BURST_STEP_MS = 200;
const BURST_FLIP_MS = 700;
let isAnimating = false;

function setPagesState() {
    for (let i = 0; i < papers.length; i++) {
        const shouldBeFlipped = (i + 1) < currentLocation;
        papers[i].classList.toggle("flipped", shouldBeFlipped);
        papers[i].style.zIndex = shouldBeFlipped ? (i + 1) : (papers.length - i);
    }
}

function silentJumpTo(loc) {
    const styleKill = document.createElement("style");
    styleKill.id = "__jump_kill_transitions";
    styleKill.textContent = ".paper, .paper > .front, .paper > .back { transition: none !important; }";
    document.head.appendChild(styleKill);
    currentLocation = loc;
    setPagesState();
    updatePaperVisibility();
    if (isSinglePageMode()) applyScaleSingle();
    else applyScaleOpen();
    void document.body.offsetHeight;
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const s = document.getElementById("__jump_kill_transitions");
                if (s) s.remove();
                resolve();
            });
        });
    });
}

function goToPage(target) {
    if (document.body.classList.contains("tour-on")) return;   // durante el tour no se navega
    if (isAnimating) return;
    target = Math.max(1, Math.min(maxLocation, target));
    if (target === currentLocation) return;
    const distance = Math.abs(target - currentLocation);
    const forward = target > currentLocation;
    const stepFn = forward ? goNextPage : goPrevPage;
    if (distance > INSTANT_THRESHOLD) {
        isAnimating = true;
        const burstStart = forward ? target - BURST_PAGES : target + BURST_PAGES;
        const clamped = Math.max(1, Math.min(maxLocation, burstStart));
        silentJumpTo(clamped).then(() => {
            const prevFlip = window.__BURST_FLIP_OVERRIDE;
            window.__BURST_FLIP_OVERRIDE = BURST_FLIP_MS;
            const step = () => {
                if (currentLocation === target) { window.__BURST_FLIP_OVERRIDE = prevFlip; isAnimating = false; return; }
                stepFn();
                window.setTimeout(step, BURST_STEP_MS);
            };
            step();
        });
        return;
    }
    isAnimating = true;
    const step = () => {
        if (currentLocation === target) { isAnimating = false; return; }
        stepFn();
        window.setTimeout(step, currentStepDelay());
    };
    step();
}

const indexBtn = document.querySelector("#indexBtn");
if (indexBtn) indexBtn.addEventListener("click", () => goToPage(indexLocation()));
const dictBtn = document.querySelector("#dictBtn");
if (dictBtn) dictBtn.addEventListener("click", () => goToSection("diccionario"));

// Contraportada: la correa "Volver al inicio" cierra el viaje → regresa a la
// portada inicial (loc 1, libro cerrado). Vive en la cara trasera de pCoverBack,
// que solo recibe toques cuando está volteada (final del libro).
const backToStart = document.getElementById("backToStart");
if (backToStart) backToStart.addEventListener("click", (e) => {
    e.stopPropagation();
    cancelBookCloseFx();   // salir del estado cerrado limpio antes del viaje al inicio
    goToPage(1);
});

// Botón "Guía de Acordes" (ícono guitarra, en el pie de cada canto y en el
// diccionario). Delegado porque los botones se generan por página. Abre la guía
// (el wiring de la lámina/overlay se conecta aparte vía window.__openGuide).
document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".guide-btn");
    if (!b) return;
    e.stopPropagation();
    if (window.__openGuide) window.__openGuide(b);
});

// Overlay de la lámina "Guía Para Acordes".
(function wireGuide() {
    const m = document.getElementById("guideModal");
    if (!m) return;
    const pop = m.querySelector(".guide-pop");
    const close = () => { m.classList.remove("show"); m.setAttribute("aria-hidden", "true"); };
    // ── Toggle diestro/zurdo de la lámina. El zurdo trastea con la DERECHA, así que
    //    su guía muestra la mano derecha. La preferencia se recuerda. ──
    const sheet = m.querySelector(".guide-sheet");
    const flip = document.getElementById("guideFlip");
    const HAND_KEY = "cantoral-guia-mano";
    const SRC = { diestro: "assets/guia_acordes.svg?v=2", zurdo: "assets/guia_acordes_zurdo.svg?v=1" };
    const ALT = {
        diestro: "Guía para acordes: mano izquierda con dedos numerados 1 a 4 y símbolos ◯ cuerda al aire, ✕ no tocar, barra cejilla",
        zurdo: "Guía para acordes (zurdos): mano derecha con dedos numerados 1 a 4 y símbolos ◯ cuerda al aire, ✕ no tocar, barra cejilla"
    };
    const getHand = () => { try { return localStorage.getItem(HAND_KEY) === "zurdo" ? "zurdo" : "diestro"; } catch (e) { return "diestro"; } };
    const applyHand = (h) => {
        if (sheet) { sheet.src = SRC[h]; sheet.alt = ALT[h]; }
        if (flip) {
            const next = h === "zurdo" ? "diestros (mano izquierda)" : "zurdos (mano derecha)";
            flip.title = "Cambiar para " + next;
            flip.setAttribute("aria-label", "Cambiar para " + next);
            flip.classList.toggle("is-zurdo", h === "zurdo");
        }
    };
    if (flip) flip.addEventListener("click", (e) => {
        e.stopPropagation();                              // no cerrar el modal
        const h = getHand() === "zurdo" ? "diestro" : "zurdo";
        try { localStorage.setItem(HAND_KEY, h); } catch (er) {}
        applyHand(h);
    });
    applyHand(getHand());
    window.__openGuide = (btn) => {
        // Coloca la esquina inferior-derecha del popup JUSTO sobre el ícono real
        // (que está dentro del papel, NO en el borde de la pantalla), y crece
        // desde ahí hacia arriba-izquierda.
        if (pop && btn && btn.getBoundingClientRect) {
            const r = btn.getBoundingClientRect();
            // Esquina derecha del popup = borde IZQUIERDO del ícono (donde INICIA
            // la guitarra) → queda un poco más a la izquierda, sin pegarse al borde.
            pop.style.right = Math.max(4, Math.round(window.innerWidth - r.left)) + "px";
            pop.style.bottom = Math.max(4, Math.round(window.innerHeight - r.top + 4)) + "px";
        }
        m.classList.add("show");
        m.setAttribute("aria-hidden", "false");
    };
    // Sin botón ✕: cierra tocando CUALQUIER parte (backdrop o la propia lámina).
    m.addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && m.classList.contains("show")) close(); });
})();

function locationOfFace(face) {
    const paper = face.closest(".paper");
    if (!paper) return null;
    const paperIndex = papers.indexOf(paper);
    if (paperIndex < 0) return null;
    const isFront = face.classList.contains("front");
    return paperIndex + 1 + (isFront ? 0 : 1);
}

function locationOfSong(songNumber) {
    // POC ventana: resolver por la CÁSCARA (siempre en el DOM), no por el contenido
    // (que puede estar desmontado). El canto vive en el FRONT de su paperId.
    const pid = SONG_TO_PAPER[songNumber];
    if (pid) {
        const p = document.getElementById(pid);
        if (p) { const i = papers.indexOf(p); if (i >= 0) return i + 1; }
    }
    // Fallback (páginas no virtualizadas o por si acaso): buscar el título montado.
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

function attachIndexLinks() {
    document.querySelectorAll(".index-entry").forEach((entry) => {
        entry.addEventListener("click", (e) => {
            e.preventDefault();
            const sectionTarget = entry.dataset.sectionTarget;
            if (sectionTarget) { goToSection(sectionTarget); return; }
            const songTarget = entry.dataset.songTarget;
            if (songTarget) { goToSong(songTarget); return; }
            const target = parseInt(entry.dataset.target, 10);
            if (!isNaN(target)) goToPage(target);
        });
    });
}

function buildIndex() {
    const tpl = document.getElementById("indexSource");
    const targets = Array.from(document.querySelectorAll(".index-page .index-content"));
    if (!tpl || !targets.length) return;
    const indexPapers = targets.map(t => t.closest(".paper"));
    const savedDisplay = indexPapers.map(p => p ? p.style.display : "");
    indexPapers.forEach(p => { if (p) p.style.display = ""; });
    targets.forEach(t => { t.innerHTML = ""; });
    const items = Array.from(tpl.content.children).map(n => n.cloneNode(true));
    if (!items.length) {
        indexPapers.forEach((p, i) => { if (p) p.style.display = savedDisplay[i]; });
        return;
    }
    // ── Sin layout thrashing: MEDIR EN LOTE, luego repartir por matemática ──────
    // Antes: append + leer scrollHeight por CADA item (~400 reflows síncronos en un
    // bucle read-after-write = layout thrashing). Ahora: se ponen TODOS los items en
    // la 1ª hoja, se fuerza UN SOLO reflow y se leen sus posiciones (offsetTop) EN
    // LOTE — sin escrituras intercaladas, así solo la 1ª lectura provoca reflow y el
    // resto sale de caché. Con esas alturas REALES (delta de offsetTop = alto ocupado,
    // incluye márgenes y redondeo) se reparte por suma. Es EXACTO y se mide en el
    // MISMO instante que el layout → misma garantía que el método por overflow: nunca
    // recorta relativo a su propio clientHeight, sin importar el estado de layout.
    const measure = targets[0];
    { const frag = document.createDocumentFragment(); for (const it of items) frag.appendChild(it); measure.appendChild(frag); }
    const availH = measure.clientHeight;   // mismo instante que las lecturas de offsetTop
    const advance = items.map((it, i) =>
        ((i + 1 < items.length) ? items[i + 1].offsetTop : measure.scrollHeight) - it.offsetTop);

    let pageIdx = 0, current = targets[0], used = 0;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const adv = advance[i];
        if (used > 0 && used + adv > availH && pageIdx < targets.length - 1) {
            pageIdx++;
            current = targets[pageIdx];
            const prev = targets[pageIdx - 1];
            const last = prev.lastElementChild;
            if (last && last.classList.contains("index-section-label")
                && item.classList && item.classList.contains("index-entry")) {
                // Rótulo huérfano al pie de la hoja previa → bájalo a ésta (será el 1º).
                prev.removeChild(last);
                current.appendChild(last);
                used = last.offsetHeight + 8;   // conservador (alto + márgenes ~) → no recorta
            } else {
                used = 0;
            }
        }
        current.appendChild(item);   // mueve el item de `measure` a la hoja destino
        used += adv;
    }
    indexPapers.forEach((p, i) => { if (p) p.style.display = savedDisplay[i]; });
}

// (buildIndex ya NO se llama aquí de inmediato — ver ensureIndexBuilt.)
// El nº de hojas de índice necesarias depende de la altura de pantalla (buildIndex
// fluye por overflow). En pantallas altas caben todas las entradas en menos hojas y
// la(s) última(s) del bloque quedan EN BLANCO. Aquí sacamos esas hojas vacías del
// flujo (del array `papers` y de la navegación) para que no aparezca una página en
// blanco al final del índice. No se tocan las que sí tienen entradas.
function collapseEmptyIndexPages() {
    const emptyPapers = Array.from(document.querySelectorAll(".index-page .index-content"))
        .filter(c => c.childElementCount === 0)
        .map(c => c.closest(".paper"))
        .filter(Boolean);
    if (!emptyPapers.length) return;
    for (const paper of emptyPapers) {
        const idx = papers.indexOf(paper);
        if (idx === -1) continue;
        papers.splice(idx, 1);
        paper.style.display = "none";
        paper.classList.remove("near");
        // Si la hoja retirada estaba ANTES de la posición actual, currentLocation
        // debe bajar 1 para seguir apuntando a la misma página (location es 1-based).
        if (idx < currentLocation - 1) currentLocation--;
    }
    maxLocation = papers.length;   // contraportada = parada terminal (ver arriba)
    // Reasignar zIndex y refrescar visibilidad con el array ya compactado.
    papers.forEach((p, i) => { p.style.zIndex = papers.length - i; });
    setPagesState();
    updatePaperVisibility();
    refitVisible();
}
// OPT arranque: arma el índice (plantilla + distribución + colapso de vacías) UNA vez,
// en idle o a demanda (al abrir el índice / resolver un hash de índice), lo que ocurra
// antes. Saca del arranque el trabajo del índice. collapse muta `papers`, así que se
// hace ANTES de que el usuario pueda navegar al índice (idle es casi inmediato).
function ensureIndexBuilt() {
    if (indexBuilt) return;
    indexBuilt = true;
    populateIndexTemplate();
    buildIndex();
    collapseEmptyIndexPages();
    attachIndexLinks();
}
(window.requestIdleCallback || (cb => setTimeout(cb, 1)))(ensureIndexBuilt, { timeout: 2500 });
window.__TEST_collapse = collapseEmptyIndexPages;
window.__TEST_nav = () => ({ papersLen: papers.length, maxLocation, currentLocation });

// Tap vs scroll: un touchend tras un deslizamiento NO cuenta como toque (para el
// fix por coordenadas de los acordes en iOS con zoom).
let __tapMoved = false, __tapX = 0, __tapY = 0;
document.addEventListener("touchstart", (e) => {
    const t = e.touches && e.touches[0];
    if (t) { __tapX = t.clientX; __tapY = t.clientY; __tapMoved = false; }
}, { passive: true });
document.addEventListener("touchmove", (e) => {
    const t = e.touches && e.touches[0];
    if (t && (Math.abs(t.clientX - __tapX) > 10 || Math.abs(t.clientY - __tapY) > 10)) __tapMoved = true;
}, { passive: true });

// === Botones de variante ===
function applyVariant(page, variant) {
    if (!page || !variant) return;
    page.dataset.activeVariant = variant;
    page.querySelectorAll(".variant-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.variant === variant);
    });
}
// Escritorio (mouse): click normal. `[data-active-variant]` (no `.song-page`) para
// cubrir cualquier layout con variante (lyrics/short-grid/song-two/shared).
document.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest(".variant-btn");
    if (!btn) return;
    e.preventDefault();
    applyVariant(btn.closest("[data-active-variant]"), btn.dataset.variant);
});
// FIX iOS + ZOOM: con zoom, fitPaper aplica transform:scale al contenido; en iOS
// Safari el hit-test de click/closest() sobre contenido transformado FALLA y el
// cambio de versión no responde. Detección por COORDENADAS en touchend (rect real
// en pantalla, post-transform). Toma el selector más cercano al toque (≤14px),
// ignorando páginas fuera de vista (rect vacío).
document.addEventListener("touchend", (e) => {
    if (!e.changedTouches || !e.changedTouches.length) return;
    const btns = document.querySelectorAll("[data-active-variant] .variant-btn");
    if (!btns.length) return;
    const tp = e.changedTouches[0], x = tp.clientX, y = tp.clientY;
    let best = null, bestD = Infinity;
    btns.forEach((b) => {
        const r = b.getBoundingClientRect();
        if (r.width < 2) return;                        // hoja fuera de vista (buffer)
        const dx = Math.max(r.left - x, 0, x - r.right);
        const dy = Math.max(r.top - y, 0, y - r.bottom);
        const d = Math.hypot(dx, dy);
        if (d < bestD) { bestD = d; best = b; }
    });
    if (!best || bestD > 14) return;                    // el toque no fue en un selector
    e.preventDefault();
    applyVariant(best.closest("[data-active-variant]"), best.dataset.variant);
}, { passive: false });

// === Menú ===
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
    // Sin auto-cierre: el menú PERSISTE hasta que el usuario toque cualquier
    // otra parte de la pantalla (listener document pointerdown de abajo) o una acción.
}
function closeMenu() {
    clearTimeout(menuCloseTimer);
    topControls.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
    closeShareCloud();          // al cerrar el menú, colapsa también la nube Compartir
}
function toggleMenu() {
    if (topControls.classList.contains("menu-open")) closeMenu();
    else openMenu();
}
if (menuBtn && topControls) {
    menuBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
    document.addEventListener("pointerdown", (e) => {
        // Durante el TOUR el menú lo controla el tour (lo abre para señalar perlas);
        // no dejar que un toque en el cartel/catch lo cierre y colapse las perlas.
        if (document.body.classList.contains("tour-on")) return;
        if (topControls.classList.contains("menu-open") && !topControls.contains(e.target)) closeMenu();
    });
    document.querySelector("#indexBtn")?.addEventListener("click", () => closeMenu());
    document.querySelector("#dictBtn")?.addEventListener("click", () => closeMenu());
    document.querySelector("#searchBtn")?.addEventListener("click", () => closeMenu());
}

// === Compartir (nube que sale de la perla) ===
const SHARE_URL = "https://cantoralmayo.com";
const SHARE_TEXT = "Cantoral Mayo 🎶 " + SHARE_URL;
const shareWidget = document.querySelector("#shareWidget");
const shareBtn = document.querySelector("#shareBtn");
const shareToastEl = document.querySelector("#shareToast");
const qrModal = document.querySelector("#qrModal");

let shareToastTimer = null;
function shareToast(msg) {
    if (!shareToastEl) return;
    shareToastEl.textContent = msg;
    shareToastEl.classList.add("show");
    clearTimeout(shareToastTimer);
    shareToastTimer = window.setTimeout(() => shareToastEl.classList.remove("show"), 2000);
}
// hoisted: closeMenu() la llama al colapsar el menú
function closeShareCloud() {
    if (shareWidget) shareWidget.classList.remove("open");
    if (shareBtn) shareBtn.setAttribute("aria-expanded", "false");
}
function openQR() { qrModal?.classList.add("show"); qrModal?.setAttribute("aria-hidden", "false"); }
function closeQR() { qrModal?.classList.remove("show"); qrModal?.setAttribute("aria-hidden", "true"); }

function copyLink() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(SHARE_URL).then(() => shareToast("Enlace copiado ✓")).catch(() => shareToast(SHARE_URL));
    } else {
        shareToast(SHARE_URL);
    }
}

if (shareWidget && shareBtn) {
    shareBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = shareWidget.classList.toggle("open");
        shareBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Acciones de la nube (delegadas)
    shareWidget.querySelector("#shareCloud")?.addEventListener("click", (e) => {
        const dot = e.target.closest(".share-dot");
        if (!dot) return;
        e.stopPropagation();
        const net = dot.dataset.net;
        if (net === "wa") {
            window.open("https://wa.me/?text=" + encodeURIComponent(SHARE_TEXT), "_blank", "noopener");
        } else if (net === "fb") {
            window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(SHARE_URL), "_blank", "noopener");
        } else if (net === "ig") {
            // Instagram no tiene intent web de enlace: usa Web Share nativa o copia.
            if (navigator.share) {
                navigator.share({ title: "Cantoral Mayo", text: "Cantoral Mayo 🎶", url: SHARE_URL }).catch(() => {});
            } else {
                copyLink();
                shareToast("Enlace copiado — pégalo en tu historia de Instagram");
            }
        } else if (net === "link") {
            copyLink();
        } else if (net === "qr") {
            openQR();
        }
    });
}
// Cierre del modal QR (botón, fondo, Escape)
document.querySelector("#qrClose")?.addEventListener("click", closeQR);
qrModal?.addEventListener("click", (e) => { if (e.target === qrModal) closeQR(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && qrModal?.classList.contains("show")) closeQR(); });

// === Swipe ===
(function setupSwipe() {
    const SWIPE_MIN_X = 60;
    const SWIPE_MAX_Y = 45;
    const SWIPE_RATIO = 1.7;
    const SWIPE_MAX_MS = 600;
    let startX = 0, startY = 0, startT = 0, tracking = false, cancelled = false;
    document.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) { tracking = false; return; }
        // Con el slider de zoom abierto no se cambia de página; el toque solo lo colapsa.
        if (document.body.classList.contains("font-slider-open")) { tracking = false; return; }
        if (e.target.closest && e.target.closest("#topControls, #searchOverlay, #fontControls")) {
            tracking = false; return;
        }
        const t = e.touches[0];
        startX = t.clientX; startY = t.clientY; startT = Date.now();
        tracking = true; cancelled = false;
    }, { passive: true });
    document.addEventListener("touchmove", (e) => {
        if (!tracking) return;
        if (e.touches.length > 1) { tracking = false; return; }
        const t = e.touches[0];
        const dy = Math.abs(t.clientY - startY);
        if (dy > SWIPE_MAX_Y) cancelled = true;
    }, { passive: true });
    document.addEventListener("touchend", (e) => {
        if (!tracking) return; tracking = false;
        if (cancelled) return;
        if (typeof searchOverlay !== "undefined" && searchOverlay && searchOverlay.classList.contains("active")) return;
        if (Date.now() - startT > SWIPE_MAX_MS) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - startX, dy = t.clientY - startY;
        const absX = Math.abs(dx), absY = Math.abs(dy);
        if (absX < SWIPE_MIN_X) return;
        if (absY > SWIPE_MAX_Y) return;
        if (absX < absY * SWIPE_RATIO) return;
        if (dx < 0) goNextPage(); else goPrevPage();
    }, { passive: true });
})();

// === Cielo nocturno (CSS/compositor, SOLO en las bandas visibles) ===
// Antes era un <canvas> con requestAnimationFrame que repintaba TODA la pantalla
// ~25fps en el hilo principal, incluido el ~⅔ tapado por la página del libro.
// Ahora: estrellas por box-shadow que hacen scroll sin costura (transform → GPU)
// dentro de dos bandas colocadas arriba/abajo del libro (según su rect real).
(function setupStarfield() {
    const root = document.getElementById("starfield");
    if (!root) return;
    const bandTop = root.querySelector(".sf-top");
    const bandBottom = root.querySelector(".sf-bottom");
    if (!bandTop || !bandBottom) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let active = false, shootTimer = null, built = false, rsTimer = null;

    // Lista de box-shadow: cada estrella con TAMAÑO (spread) y BRILLO variados, y
    // ~10% con halo (blur) como las del canvas → menos "artificial". Repartidas en
    // un PERIODO fijo P y DUPLICADAS a -P para que el scroll (translateY 0→P) sea un
    // bucle sin costura. Desacoplar P del alto de la banda evita "pares"/repeticiones
    // en bandas finas.
    function shadows(n, w, P, near) {
        const out = [];
        for (let i = 0; i < n; i++) {
            const x = Math.round(Math.random() * w);
            const y = Math.round(Math.random() * P);
            const z = Math.random();                                     // profundidad
            const spread = (near ? 0.3 + z * 0.9 : z * 0.6).toFixed(2);  // tamaño variable
            const glow = near && Math.random() < 0.10;                   // halo ocasional
            const blur = glow ? (2 + Math.random() * 2.5).toFixed(1) : "0";
            const a = (near ? 0.6 + z * 0.4 : 0.32 + z * 0.42).toFixed(2);
            const col = glow ? "rgba(200,222,255," + a + ")" : "rgba(255,255,255," + a + ")";
            out.push(x + "px " + y + "px " + blur + "px " + spread + "px " + col);
            out.push(x + "px " + (y - P) + "px " + blur + "px " + spread + "px " + col);
        }
        return out.join(",");
    }

    // 2 capas por banda (parallax): lejana (tenue) + cercana (brillante, algún halo).
    // Deriva MUY lenta: en una banda fina, una deriva marcada se leía como "caída".
    function buildBand(el) {
        const B = Math.max(el.clientHeight, 1);
        // Si el alto no cambió, NO regeneramos (evita re-barajar en relayouts).
        if (el._sfH === B && el.querySelector(".sf-layer")) return;
        el._sfH = B;
        el.querySelectorAll(".sf-layer").forEach(n => n.remove());
        const w = Math.max(el.clientWidth, window.innerWidth);
        if (B < 8) return;                 // banda demasiado fina: sin estrellas
        const P = Math.max(B, 240);        // periodo de scroll (desacoplado del alto)
        const nFar = Math.min(210, Math.max(12, Math.round(w * P * 0.00028)));
        const nNear = Math.min(120, Math.max(6, Math.round(w * P * 0.00016)));

        const far = document.createElement("div");
        far.className = "sf-layer";
        far.style.setProperty("--tile", P + "px");
        far.style.boxShadow = shadows(nFar, w, P, false);
        far.style.animationDuration = (reduce ? "0s" : "170s") + ",4s";  // deriva casi imperceptible

        const near = document.createElement("div");
        near.className = "sf-layer sf-near";
        near.style.setProperty("--tile", P + "px");
        near.style.boxShadow = shadows(nNear, w, P, true);
        near.style.animationDuration = (reduce ? "0s" : "115s") + ",3s";
        near.style.animationDelay = "0s,-1.3s";

        el.appendChild(far);
        el.appendChild(near);
    }

    // Coloca las bandas por encima/por debajo del rectángulo REAL del libro.
    function layout() {
        const bookEl = document.getElementById("book");
        const vh = window.innerHeight;
        let topH = Math.round(vh * 0.15), botStart = Math.round(vh * 0.83); // respaldo
        if (bookEl) {
            const r = bookEl.getBoundingClientRect();
            if (r.height > 40 && r.width > 40) {
                topH = Math.max(0, Math.round(r.top));
                botStart = Math.min(vh, Math.round(r.bottom));
            }
        }
        bandTop.style.top = "0px";
        bandTop.style.height = topH + "px";
        bandBottom.style.top = botStart + "px";
        bandBottom.style.height = Math.max(0, vh - botStart) + "px";
        buildBand(bandTop);
        buildBand(bandBottom);
        built = true;
    }

    // Estrella fugaz: <div> con WAAPI (transform/opacity → compositor), dirección
    // ALEATORIA (izq o der) y cola alineada por la rotación del propio elemento
    // (así la estela siempre queda DETRÁS, sin importar el sentido).
    function spawnShoot(band) {
        const bw = band.clientWidth, bh = band.clientHeight;
        if (bh < 14) return;
        const dir = Math.random() < 0.5 ? 1 : -1;                  // izq o der
        const dist = 220 + Math.random() * 170;                   // trazo largo
        const angle = (6 + Math.random() * 11) * Math.PI / 180;   // 6–17° = casi horizontal
        const dx = dir * dist, dy = dist * Math.tan(angle);       // poca caída
        const deg = Math.atan2(dy, dx) * 180 / Math.PI;           // ángulo real del trazo
        const startX = dir > 0 ? Math.random() * bw * 0.35 : bw * 0.65 + Math.random() * bw * 0.35;
        const startY = 3 + Math.random() * Math.max(2, bh * 0.35);
        const s = document.createElement("div");
        s.className = "sf-shoot";
        s.style.left = startX + "px";
        s.style.top = startY + "px";
        band.appendChild(s);
        const dur = 680 + Math.random() * 380;                    // rápida
        s.animate([
            { transform: "translate(0,0) rotate(" + deg + "deg)", opacity: 0, offset: 0 },
            { opacity: 1, offset: 0.1 },
            { opacity: 1, offset: 0.8 },
            { transform: "translate(" + dx + "px," + dy + "px) rotate(" + deg + "deg)", opacity: 0, offset: 1 }
        ], { duration: dur, easing: "linear" }).onfinish = () => s.remove();   // velocidad constante (sin desacelerar)
    }
    function scheduleShoot() {
        clearTimeout(shootTimer);
        if (!active || reduce) return;
        const gap = 3200 + Math.random() * 5800;
        shootTimer = setTimeout(() => {
            if (!active || document.hidden) return;
            // Nace en la banda de arriba (más visible) o en la de abajo.
            const useBottom = bandBottom.clientHeight >= 20 && Math.random() < 0.4;
            spawnShoot(useBottom ? bandBottom : bandTop);
            scheduleShoot();
        }, gap);
    }

    function start() {
        active = true;
        root.style.opacity = "1";
        if (!built) layout();
        root.classList.add("sf-run");   // reanuda drift/twinkle
        scheduleShoot();
        // Recolocar cuando la geometría del libro ya está asentada (escala/fuentes).
        setTimeout(() => { if (active) layout(); }, 400);
    }
    function stop() {
        active = false;
        root.style.opacity = "0";
        root.classList.remove("sf-run");  // pausa las animaciones CSS
        clearTimeout(shootTimer); shootTimer = null;
    }

    window.addEventListener("resize", () => { if (!active) return; clearTimeout(rsTimer); rsTimer = setTimeout(layout, 180); });
    window.addEventListener("orientationchange", () => { if (!active) return; setTimeout(layout, 220); });
    document.addEventListener("visibilitychange", () => {
        if (!active) return;
        if (document.hidden) clearTimeout(shootTimer);
        else scheduleShoot();
    });

    // La app puede pedir recolocar las bandas si cambia la geometría del libro.
    // update(): el cielo NUNCA arranca con los gestos activos (recursos dedicados a
    // la cámara). Blindaje además de la comprobación en setTheme, por si otro punto
    // del código lo invoca. turnOffGestures() vuelve a llamarlo para restaurarlo.
    window.__starfield = {
        update(isDark) {
            if (isDark && !document.body.classList.contains("gestures-on")) start();
            else stop();
        },
        relayout() { if (active) layout(); }
    };
    if (document.body.classList.contains("dark-mode")) start();
})();

// === Acordes interactivos ===
(function setupChords() {
    const CHORD_LIBRARY = new Map([
        ["A","assets/chords/A.svg"],["A7","assets/chords/A7.svg"],["A9","assets/chords/A9.svg"],
        ["Ab","assets/chords/Ab.svg"],["Am","assets/chords/Am.svg"],["Asus","assets/chords/Asus.svg"],
        ["B","assets/chords/B.svg"],["B7","assets/chords/B7.svg"],["B♭","assets/chords/B♭.svg"],["Bb","assets/chords/B♭.svg"],["Bm","assets/chords/Bm.svg"],
        ["C","assets/chords/C.svg"],["C7","assets/chords/C7.svg"],["C#7","assets/chords/C#7.svg"],["C#m","assets/chords/C#m.svg"],["Cm","assets/chords/Cm.svg"],
        ["D","assets/chords/D.svg"],["D7","assets/chords/D7.svg"],["D9","assets/chords/D9.svg"],["Db","assets/chords/Db.svg"],["Dm","assets/chords/Dm.svg"],["Dm7","assets/chords/Dm7.svg"],
        ["E","assets/chords/E.svg"],["E7","assets/chords/E7.svg"],["Eb","assets/chords/Eb.svg"],["Em","assets/chords/Em.svg"],["Em7","assets/chords/Em7.svg"],
        ["F","assets/chords/F.svg"],["F#","assets/chords/F#.svg"],["F#7","assets/chords/F#7.svg"],["F#m","assets/chords/F#m.svg"],["F#m7","assets/chords/F#m7.svg"],["Fm","assets/chords/Fm.svg"],["Fm7","assets/chords/Fm7.svg"],
        ["G","assets/chords/G.svg"],["G7","assets/chords/G7.svg"],["G#","assets/chords/G#.svg"],["G#7","assets/chords/G#7.svg"],["G#m","assets/chords/G#m.svg"],["Gm","assets/chords/Gm.svg"],["Gsus4","assets/chords/Gsus4.svg"],
        ["E♭","assets/chords/Eb.svg"],["A♭","assets/chords/Ab.svg"],["D♭","assets/chords/Db.svg"],
    ]);
    const CHORD_RE = /^[A-G][#b♭♯]?(?:maj7|maj|min|sus2|sus4|sus|dim7|dim|aug|add\d+|m)?\d*(?:\/[A-G][#b♭♯]?)?/;
    const WORD_BLACKLIST = new Set(["DE"]);
    function escC(s) { return s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
    function chordSpan(name) {
        const has = CHORD_LIBRARY.has(name);
        return '<span class="chord-ix' + (has ? " has-diagram" : "") + '" data-chord="' + escC(name) + '">' + escC(name) + "</span>";
    }
    function parseChordOnly(s) { const m = CHORD_RE.exec(s); return (m && m[0] === s) ? chordSpan(s) : null; }
    function parseToken(tok) {
        if (WORD_BLACKLIST.has(tok)) return null;
        let i = 0, out = "", any = false;
        while (i < tok.length) {
            const c = tok[i];
            if (c === "(") {
                const close = tok.indexOf(")", i);
                if (close === -1) return null;
                const inner = tok.slice(i + 1, close);
                const parsed = parseChordOnly(inner);
                if (parsed) { out += "(" + parsed + ")"; any = true; } else out += "(" + escC(inner) + ")";
                i = close + 1; continue;
            }
            const m = CHORD_RE.exec(tok.slice(i));
            if (m && m[0]) { out += chordSpan(m[0]); any = true; i += m[0].length; continue; }
            return null;
        }
        return any ? out : null;
    }
    function enhanceRow(row) {
        if (row.dataset.ix) return;
        const text = row.textContent;
        let out = "", i = 0;
        while (i < text.length) {
            const c = text[i];
            if (c === " " || c === "\t" || c === " ") { out += c; i++; continue; }
            let j = i;
            while (j < text.length && text[j] !== " " && text[j] !== "\t" && text[j] !== " ") j++;
            const token = text.slice(i, j);
            const parsed = parseToken(token);
            out += (parsed !== null) ? parsed : escC(token);
            i = j;
        }
        row.innerHTML = out; row.dataset.ix = "1";
    }
    function enhanceSpan(span) {
        if (span.dataset.ix) return;
        const name = span.textContent.trim();
        // Un .cchord anclado puede traer acordes PEGADOS (ej. "D7G", "A7Dm") por venir
        // sin espacio en los datos. parseToken los divide en varios .chord-ix clicables
        // (recorriendo con CHORD_RE), y quedan INLINE dentro del mismo .cchord: misma
        // columna anclada sobre la letra → la alineación no cambia. Así cada acorde del
        // grupo es clicable sin tener que separar el texto (que sí desplazaría el anclaje).
        const parsed = parseToken(name);
        if (parsed !== null) {
            span.innerHTML = parsed;
        } else {
            span.dataset.chord = name; span.classList.add("chord-ix");
            if (CHORD_LIBRARY.has(name)) span.classList.add("has-diagram");
        }
        span.dataset.ix = "1";
    }
    function enhance(root) {
        if (!root || root.nodeType !== 1) return;
        root.querySelectorAll(".chord-row:not([data-ix])").forEach(enhanceRow);
        root.querySelectorAll(".note.chord-color:not([data-ix])").forEach(enhanceRow);
        root.querySelectorAll("span.chord:not([data-ix])").forEach(enhanceSpan);
    }
    const pop = document.createElement("div");
    pop.id = "chordPop"; pop.className = "chord-pop"; pop.hidden = true;
    document.body.appendChild(pop);
    const svgCache = new Map();
    let showToken = 0;
    async function loadSvg(url) {
        if (svgCache.has(url)) return svgCache.get(url);
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) throw new Error("no se pudo cargar " + url);
        const txt = await res.text(); svgCache.set(url, txt); return txt;
    }
    function showChordPop(el) {
        const name = el.dataset.chord;
        const url = CHORD_LIBRARY.get(name);
        if (!url) return;
        const safeUrl = encodeURI(url).replace(/#/g, "%23");
        pop.hidden = false;
        const token = ++showToken;
        loadSvg(safeUrl).then((svgText) => {
            if (token !== showToken) return;
            pop.innerHTML = svgText;
            const svg = pop.querySelector("svg");
            if (svg) { svg.removeAttribute("width"); svg.removeAttribute("height"); svg.classList.add("chord-font"); }
            positionPop(el);
        }).catch(() => {
            if (token !== showToken) return;
            pop.innerHTML = "";
            const img = document.createElement("img"); img.alt = "";
            img.onload = () => { if (token === showToken) positionPop(el); };
            img.src = safeUrl; pop.appendChild(img); positionPop(el);
        });
    }
    function hideChordPop() { if (!pop.hidden) pop.hidden = true; }
    function positionPop(el) {
        const r = el.getBoundingClientRect();
        const vw = window.innerWidth, vh = window.innerHeight, margin = 8;
        const pw = pop.offsetWidth, ph = pop.offsetHeight;
        let left = r.left + r.width / 2 - pw / 2;
        left = Math.max(margin, Math.min(left, vw - pw - margin));
        let top = r.bottom + margin;
        if (top + ph > vh - margin) top = r.top - ph - margin;
        if (top < margin) top = margin;
        pop.style.left = left + "px"; pop.style.top = top + "px";
    }
    document.addEventListener("click", (e) => {
        const chord = e.target.closest && e.target.closest(".chord-ix.has-diagram");
        if (chord) { e.preventDefault(); e.stopPropagation(); showChordPop(chord); return; }
        if (!pop.hidden && !(e.target.closest && e.target.closest("#chordPop"))) hideChordPop();
    }, true);
    // FIX iOS + ZOOM: con zoom, fitPaper aplica transform:scale al contenido y el
    // hit-test del toque en iOS se DESVÍA (más a la orilla, más error) → los acordes
    // de la derecha no responden. Detección por COORDENADAS (getBoundingClientRect =
    // posición REAL en pantalla, inmune al error). CLAVE anti-falsos-positivos:
    //   • SOLO actúa si el contenido está TRANSFORMADO (zoom real); sin transform el
    //     click normal ya funciona y este handler NO interfiere.
    //   • solo la HOJA visible (.onstage), ancho EXACTO del acorde (no invade vecinos),
    //   • guard anti-scroll (__tapMoved). Si no cae en un acorde, no hace NADA.
    const __bookEl = document.getElementById("book");
    document.addEventListener("touchend", (e) => {
        if (__tapMoved) return;
        const stage = document.querySelector(".paper.onstage .page-content-wrap");
        if (!stage) return;
        // Activa si HAY transform que desvíe el hit-test de iOS: puede estar en el
        // wrap (fitPaper por ancho) O en el .book (móvil single-page se escala con
        // transform-origin top center → el click normal falla arriba). Sin ninguno
        // (escritorio sin zoom) el click normal ya sirve y no interferimos.
        const wrapT = getComputedStyle(stage).transform !== "none";
        const bookT = __bookEl && getComputedStyle(__bookEl).transform !== "none";
        if (!wrapT && !bookT) return;
        const tp = e.changedTouches && e.changedTouches[0];
        if (!tp) return;
        const x = tp.clientX, y = tp.clientY;
        let target = null;
        const chords = stage.querySelectorAll(".chord-ix.has-diagram");
        for (let i = 0; i < chords.length; i++) {
            const c = chords[i], r = c.getBoundingClientRect();
            if (r.width < 1) continue;
            const fs = parseFloat(getComputedStyle(c).fontSize) || 14;
            if (x >= r.left && x <= r.right && y >= r.top - 0.55 * fs && y <= r.bottom + 0.3 * fs) { target = c; break; }
        }
        if (!target) return;                          // no fue un acorde: no abrir/cerrar nada
        e.preventDefault(); e.stopPropagation();
        showChordPop(target);
    }, { passive: false, capture: true });
    window.addEventListener("scroll", hideChordPop, true);
    window.addEventListener("resize", hideChordPop);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideChordPop(); });
    const bookEl = document.getElementById("book") || document.body;
    const obs = new MutationObserver((muts) => {
        let changed = false;
        for (const m of muts) { m.addedNodes.forEach((n) => { if (n.nodeType === 1) { enhance(n); changed = true; } }); if (m.removedNodes.length) changed = true; }
        if (changed) hideChordPop();
    });
    obs.observe(bookEl, { childList: true, subtree: true });
    enhance(document.body);///Faltaba.body///

    // Precalienta la caché en memoria de los diagramas durante el tiempo muerto, para
    // que el PRIMER toque de cualquier acorde abra el popup al instante (sin fetch/parse).
    // Usa la misma URL codificada (#->%23) que showChordPop, así comparten entrada de caché.
    function preloadDiagrams() {
        CHORD_LIBRARY.forEach((url) => {
            loadSvg(encodeURI(url).replace(/#/g, "%23")).catch(() => {});
        });
    }
    if ("requestIdleCallback" in window) requestIdleCallback(preloadDiagrams, { timeout: 4000 });
    else setTimeout(preloadDiagrams, 2500);
})();

// === Diccionario de Acordes ===
(function setupChordDictionary() {
    const DICT = [
        { rep: "A", es: "La Mayor" },{ rep: "A7", es: "La séptima" },{ rep: "A9", es: "La novena" },
        { rep: "Ab", es: "La bemol Mayor" },{ rep: "Am", es: "La menor" },{ rep: "Asus", es: "La suspendida" },
        { rep: "B", es: "Si Mayor" },{ rep: "B7", es: "Si séptima" },{ rep: "B♭", es: "Si bemol Mayor" },{ rep: "Bm", es: "Si menor" },
        { rep: "C", es: "Do Mayor" },{ rep: "C7", es: "Do séptima" },{ rep: "C#7", es: "Do sostenido séptima" },{ rep: "C#m", es: "Do sostenido menor" },{ rep: "Cm", es: "Do menor" },
        { rep: "D", es: "Re Mayor" },{ rep: "D7", es: "Re séptima" },{ rep: "Db", es: "Re bemol Mayor" },{ rep: "Dm", es: "Re menor" },{ rep: "Dm7", es: "Re menor séptima" },
        { rep: "E", es: "Mi Mayor" },{ rep: "E7", es: "Mi séptima" },{ rep: "Eb", es: "Mi bemol Mayor" },{ rep: "Em", es: "Mi menor" },{ rep: "Em7", es: "Mi menor séptima" },
        { rep: "F", es: "Fa Mayor" },{ rep: "F#", es: "Fa sostenido Mayor" },{ rep: "F#7", es: "Fa sostenido séptima" },{ rep: "F#m", es: "Fa sostenido menor" },{ rep: "F#m7", es: "Fa sostenido menor séptima" },{ rep: "Fm", es: "Fa menor" },{ rep: "Fm7", es: "Fa menor séptima" },
        { rep: "G", es: "Sol Mayor" },{ rep: "G7", es: "Sol séptima" },{ rep: "G#", es: "Sol sostenido Mayor" },{ rep: "G#7", es: "Sol sostenido séptima" },{ rep: "G#m", es: "Sol sostenido menor" },{ rep: "Gm", es: "Sol menor" },{ rep: "Gsus4", es: "Sol suspendida cuarta" },
    ];
    function escD(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
    function buildDictionary() {
        const pages = Array.from(document.querySelectorAll(".dict-content"));
        if (!pages.length) return;
        const per = Math.ceil(DICT.length / pages.length);
        pages.forEach((ct, idx) => {
            const slice = DICT.slice(idx * per, (idx + 1) * per);
            if (!slice.length) { ct.innerHTML = ""; return; }
            let rows = "";
            for (const c of slice) {
                const cn = escD(c.rep);
                rows += "<tr>" +
                    '<td class="dict-name">' + escD(c.es) + "</td>" +
                    '<td class="dict-rep font-sans"><span class="chord-ix has-diagram" data-chord="' + cn + '" role="button" tabindex="0" aria-label="Ver diagrama del acorde ' + cn + '">' + cn + "</span></td>" +
                    "</tr>";
            }
            ct.innerHTML = '<table class="dict-table"><thead><tr><th>Acorde</th><th>Representación</th></tr></thead><tbody>' + rows + "</tbody></table>";
        });
    }
    buildDictionary();
})();

// === Plumeria (escenas: main paper, orientation overlay, desktop gate) ===
(function setupPlumeriaScenes(){
    // ── Estado compartido: clima aleatorio persistido en sessionStorage ──
    // Mismas 12 paletas de atardecer REALISTA del intro (welcomeIntro): cénit
    // FRÍO arriba (azul/violeta/índigo) que se calienta hacia el horizonte
    // (coral→oro abajo). Antes aquí había paletas pastel más cálidas que
    // terminaban en crema; el usuario las cambió por éstas por sus tonos fríos.
    // 5 paradas [cénit, alto, medio, bajo, horizonte] → 0/34/60/82/100%.
    const SUNSETS = [
        "linear-gradient(180deg, #5b6aa8 0%, #c98aad 34%, #ff9d7a 60%, #ffb057 82%, #ffcf7a 100%)", // coral-oro
        "linear-gradient(180deg, #6d6fae 0%, #d68f9e 34%, #ff9b6a 60%, #ff9f52 82%, #ffc266 100%)", // rosa-ámbar
        "linear-gradient(180deg, #7a5f9c 0%, #e0899f 34%, #ff8f72 60%, #ff9a4f 82%, #ffbe6b 100%)", // magenta-fuego
        "linear-gradient(180deg, #4f6bb0 0%, #b98bb6 34%, #f79a86 60%, #ffab5e 82%, #ffd089 100%)", // violeta-durazno
        "linear-gradient(180deg, #8a6bab 0%, #e79aa0 34%, #ffa878 60%, #ffbc63 82%, #ffdc8e 100%)", // lavanda-melocotón
        "linear-gradient(180deg, #63709f 0%, #cf95a4 34%, #ff9a72 60%, #ff8f45 82%, #ffb35c 100%)", // azul-naranja
        "linear-gradient(180deg, #7e6aa2 0%, #d98fae 34%, #ff9e88 60%, #ffab5a 82%, #ffc978 100%)", // ciruela-coral
        "linear-gradient(180deg, #93739e 0%, #e6a08c 34%, #ffab6f 60%, #ffb85c 82%, #ffd583 100%)", // hora dorada
        "linear-gradient(180deg, #586bad 0%, #c58ea8 34%, #ff9f7c 60%, #ffae5c 82%, #ffcf82 100%)", // índigo-rosa cálido
        "linear-gradient(180deg, #6f5f9e 0%, #d287a1 34%, #f89a84 60%, #ff9d55 82%, #ffc06f 100%)", // púrpura-brasa
        "linear-gradient(180deg, #8f6db4 0%, #eb9fab 34%, #ffaa82 60%, #ffbe70 82%, #ffd98a 100%)", // orquídea-ámbar
        "linear-gradient(180deg, #4a6ea8 0%, #b58aa8 34%, #f2977f 60%, #ff9a52 82%, #ffbf6d 100%)", // crepúsculo azul
        // ── Atardeceres con MÁS carácter (2026-07-20): mismos que se agregaron al
        //    intro (welcomeIntro), para que ambas escenas sigan idénticas. ──
        "linear-gradient(180deg, #7a2f5e 0%, #c0335a 34%, #ff5a3c 60%, #ff7e2e 82%, #ffb347 100%)", // 🔥 fuego
        "linear-gradient(180deg, #2b2a5e 0%, #4a3a7a 34%, #7d4a86 60%, #b5567a 82%, #e8825e 100%)", // 🌌 crepúsculo profundo
        "linear-gradient(180deg, #8ea6d8 0%, #d9a7cf 34%, #ffc3c0 60%, #ffd9b0 82%, #fff0cf 100%)", // 🌸 pastel rosado
        "linear-gradient(180deg, #3f6d7a 0%, #5f9a8c 34%, #9fbf7e 60%, #e8c56b 82%, #ffd98a 100%)"  // 🟢 verde-teal
    ];
    // Sorteo NUEVO en cada carga (antes se persistía en sessionStorage, pero
    // Safari iOS restaura la sesión al reabrir el navegador y el atardecer se
    // quedaba clavado en el mismo para siempre). Dentro de una misma carga las
    // 3 escenas (libro, overlay orientación, gate escritorio) comparten estas
    // variables de módulo, así que siguen viéndose idénticas entre sí.
    const isRainyDay = Math.random() < 0.10;
    const sunsetBg = SUNSETS[Math.floor(Math.random() * SUNSETS.length)];
    try { // limpiar llaves viejas para que no confundan en el futuro
        sessionStorage.removeItem("plumeria-rainy");
        sessionStorage.removeItem("plumeria-sunset-idx");
    } catch(e) {}

// === setupPlumeria (un target = un stage/sky/page) ===
function setupPlumeria(cfg){
    const stage = cfg.stage;
    const sky   = cfg.sky;
    const page  = cfg.page;
    const paper = cfg.paper || null;
    const overlay = cfg.overlay || null; // overlay (orientación/gate): escena visible sólo con .show
    const SID   = cfg.id || "";     // sufijo único por escena (evita colisión de IDs)
    if (!stage) return;
    // Visibilidad real de la escena: overlay mostrado, o hoja del libro
    // en pantalla y cercana a la vista (.near la pone updatePaperVisibility).
    const sceneVisible = () => overlay
        ? overlay.classList.contains("show")
        : (!paper || (paper.style.display !== "none" && paper.classList.contains("near")));
    let resumeFireflies = () => {}; // la define buildCritters (si hay luciérnagas)

    if (page) {
        if (isRainyDay) {
            page.classList.add("plumeria-rainy");
            page.style.background = "";
        } else {
            page.style.background = sunsetBg;
        }
    }
    const r=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(r(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)], nrm=(x,y)=>{const l=Math.hypot(x,y)||1;return{x:x/l,y:y/l};};
    const branchParts=[],backLeaves=[],flowerParts=[],frontLeaves=[],groundBack=[],groundFront=[];
    let tips=[];
    const PETAL="M0 0 C -6 -8 -7 -20 -2 -28 C 0 -31 4 -31 6 -27 C 10 -16 7 -6 0 0 Z";
    function branchPath(x0,y0,cx,cy,x1,y1,w0,w1){const d0=nrm(cx-x0,cy-y0),d1=nrm(x1-cx,y1-cy),p0={x:-d0.y,y:d0.x},p1={x:-d1.y,y:d1.x},pa=nrm(p0.x+p1.x,p0.y+p1.y),wm=(w0+w1)/2;return`M ${x0+p0.x*w0/2} ${y0+p0.y*w0/2} Q ${cx+pa.x*wm/2} ${cy+pa.y*wm/2} ${x1+p1.x*w1/2} ${y1+p1.y*w1/2} Q ${x1+d1.x*w1*0.4} ${y1+d1.y*w1*0.4} ${x1-p1.x*w1/2} ${y1-p1.y*w1/2} Q ${cx-pa.x*wm/2} ${cy-pa.y*wm/2} ${x0-p0.x*w0/2} ${y0-p0.y*w0/2} Z`;}
    function drawBranch(x0,y0,cx,cy,x1,y1,w0,w1){branchParts.push(`<path d="${branchPath(x0,y0,cx,cy,x1,y1,w0,w1)}" fill="url(#bark)" stroke="#221208" stroke-width=".6" stroke-opacity=".4"/>`);branchParts.push(`<path d="M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}" fill="none" stroke="#9a7650" stroke-width="${Math.max(1,w1*0.28)}" stroke-linecap="round" stroke-opacity=".3"/>`);}
    function grow(x,y,ang,len,w,depth){const rad=ang*Math.PI/180,dx=Math.sin(rad),dy=-Math.cos(rad),x1=x+dx*len,y1=y+dy*len,curve=r(-0.15,0.15),cx=x+dx*len*0.5+(-dy)*curve*len,cy=y+dy*len*0.5+(dx)*curve*len;drawBranch(x,y,cx,cy,x1,y1,w,w*0.7);if(depth<=0||len<48){tips.push({x:x1,y:y1});return;}const n=depth>=3?2:(Math.random()<0.45?3:2),spread=r(20,36);for(let i=0;i<n;i++){const a=ang+(i-(n-1)/2)*spread+r(-7,7);grow(x1,y1,a,len*r(0.66,0.8),w*r(0.6,0.74),depth-1);}if(Math.random()<0.45)tips.push({x:x1,y:y1});}
    function leafStr(x,y,ang,L,grad,delay,fdur,fdel,op){const W=L*r(0.2,0.26),bend=r(-7,7),still=(!overlay&&Math.random()<0.65)?" still":"",d=`M0 0 C ${-W} ${-L*0.22} ${-W*0.85} ${-L*0.72} ${bend} ${-L} C ${W*0.85} ${-L*0.72} ${W} ${-L*0.22} 0 0 Z`,mid=`M0 0 L ${bend*0.6} ${-L*0.95}`;return`<g class="leafg" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})" opacity="${op}"><g class="leaf-pop${still}" style="animation-delay:${delay}s,${fdel}s;animation-duration:.7s,${fdur}s"><path d="${d}" fill="url(#${grad})"/><path d="${mid}" fill="none" stroke="rgba(190,240,180,.4)" stroke-width="${Math.max(.6,W*0.06).toFixed(2)}"/></g></g>`;}
    function flowerStr(ox,oy,sc,rot,col,delay){let pets="";for(let i=0;i<5;i++)pets+=`<path class="petal" d="${PETAL}" transform="rotate(${i*72})" fill="url(#${col})"/>`;return`<g transform="translate(${ox.toFixed(1)} ${oy.toFixed(1)}) scale(${sc}) rotate(${rot})"><g class="flower-pop" style="animation-delay:${delay}s">${pets}<circle r="2.6" fill="url(#center)"/></g></g>`;}
    function budStr(ox,oy,sc,rot,col,delay){return`<g transform="translate(${ox.toFixed(1)} ${oy.toFixed(1)}) scale(${sc}) rotate(${rot})"><g class="flower-pop" style="animation-delay:${delay}s"><path d="M0 0 C -3 -4 -3 -12 0 -16 C 3 -12 3 -4 0 0 Z" fill="url(#${col})"/></g></g>`;}
    function ellipsePt(cx,cy,rx,ry){const a=r(0,Math.PI*2),rad=Math.sqrt(Math.random());return{x:cx+Math.cos(a)*rx*rad,y:cy+Math.sin(a)*ry*rad};}
    function grassBlade(x,baseY,h,lean,grad){const still=(!overlay&&Math.random()<0.55)?" still":"",d=`M -1.8 0 Q ${(lean*0.5).toFixed(1)} ${(-h*0.6).toFixed(1)} ${lean.toFixed(1)} ${(-h).toFixed(1)} Q ${(lean*0.5).toFixed(1)} ${(-h*0.6).toFixed(1)} 1.8 0 Z`;return`<g transform="translate(${x.toFixed(1)} ${baseY.toFixed(1)})"><g class="blade${still}" style="animation-delay:${r(0,.8).toFixed(2)}s,${r(0,3).toFixed(2)}s;animation-duration:.6s,${r(2.4,4).toFixed(1)}s"><path d="${d}" fill="url(#${grad})"/></g></g>`;}
    function miniFlower(x,y,s,color){let p="";for(let i=0;i<5;i++){const a=i*72*Math.PI/180;p+=`<circle cx="${(Math.cos(a)*2.3*s).toFixed(1)}" cy="${(Math.sin(a)*2.3*s).toFixed(1)}" r="${(1.8*s).toFixed(1)}" fill="${color}"/>`;}return`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${p}<circle r="${(1.2*s).toFixed(1)}" fill="#ffe27a"/></g>`;}
    function bush(cx,baseY,w,h,flowering){let s=`<g class="bushg" transform="translate(${cx.toFixed(1)} ${baseY.toFixed(1)})"><g class="bush" style="animation-delay:${r(0,.9).toFixed(2)}s,${r(0,3).toFixed(2)}s;animation-duration:.8s,${r(3.5,5.5).toFixed(1)}s">`;s+=`<ellipse cx="0" cy="0" rx="${(w*0.95).toFixed(1)}" ry="${(h*0.5).toFixed(1)}" fill="url(#gBush)"/>`;const lobes=ri(3,5);for(let i=0;i<lobes;i++){const ex=r(-w*0.45,w*0.45),ew=r(w*0.42,w*0.66),eh=r(h*0.6,h);s+=`<ellipse cx="${ex.toFixed(1)}" cy="${(-eh*0.5).toFixed(1)}" rx="${ew.toFixed(1)}" ry="${eh.toFixed(1)}" fill="url(#gBush)"/>`;}s+=`<ellipse cx="${(-w*0.15).toFixed(1)}" cy="${(-h*0.55).toFixed(1)}" rx="${(w*0.5).toFixed(1)}" ry="${(h*0.4).toFixed(1)}" fill="url(#gBushHi)" opacity=".55"/>`;if(flowering){const bcols=["#ff6fae","#ffd23f","#ffffff","#ff5a4d","#ff9e3c","#b277e0","#5ab0ff"];const nf=ri(7,13);for(let k=0;k<nf;k++)s+=miniFlower(r(-w*0.78,w*0.78),-r(h*0.1,h*1.05),r(0.8,1.35),pick(bcols));}s+="</g></g>";return s;}
    function buildGround(baseX,baseY){const top=1196;let d=`M -1100 1305 L -1100 ${top}`;const segs=12;for(let i=0;i<=segs;i++){const x=Math.round(-30+(1060/segs)*i),y=Math.round(top+Math.sin(i*1.7)*6-r(0,7));d+=` L ${x} ${y}`;}d+=` L 2100 ${top} L 2100 1305 Z`;groundBack.push(`<path d="${d}" fill="url(#gGrass)"/>`);
    // Los laterales fuera del viewBox (x<-12 y x>1015) SOLO se ven en los
    // overlays anchos (orientación en landscape / gate escritorio). En la hoja
    // del libro (portrait, "meet" ajusta por ancho) eran césped y arbustos
    // INVISIBLES pero animando cada frame — no se generan.
    if(overlay)for(let x=-1050;x<-12;x+=r(30,48))groundBack.push(grassBlade(x,top+r(-4,9),r(20,46),r(-11,11),Math.random()<0.5?"gBlade":"gBlade2"));
    for(let x=-12;x<1015;x+=r(14,24))groundBack.push(grassBlade(x,top+r(-4,9),r(20,46),r(-11,11),Math.random()<0.5?"gBlade":"gBlade2"));
    if(overlay)for(let x=1015;x<2050;x+=r(30,48))groundBack.push(grassBlade(x,top+r(-4,9),r(20,46),r(-11,11),Math.random()<0.5?"gBlade":"gBlade2"));
    // Arbustos: en el libro solo dentro del viewBox y en la cantidad que en
    // promedio caía visible antes (~40% de 7-12), para conservar el aspecto.
    const nB=overlay?ri(7,12):ri(3,5);for(let i=0;i<nB;i++){const bx=overlay?r(-900,1900):r(-60,1060);if(Math.abs(bx-baseX)<70)continue;groundBack.push(bush(bx,top+r(2,20),r(55,112),r(40,82),Math.random()<0.58));}for(let i=0;i<14;i++){const x=baseX+r(-95,95);groundFront.push(grassBlade(x,baseY+r(-8,8),r(24,58),r(-12,12),Math.random()<0.5?"gBlade":"gBlade2"));}}
    let svgMarkup="";
    function build(){const baseX=500,baseY=1255,forkX=500,forkY=940;buildGround(baseX,baseY);drawBranch(baseX,baseY,baseX+r(-12,12),(baseY+forkY)/2,forkX,forkY,96,70);const limbs=Math.random()<0.5?2:3,angs=limbs===2?[-26,24]:[-32,-2,28];angs.forEach(a=>grow(forkX,forkY,a+r(-4,4),r(235,290),r(46,56),4));grow(forkX-10,forkY+40,-58,r(150,190),34,3);grow(forkX+10,forkY+40,56,r(150,190),34,3);const cx=500,cy=560,rx=415,ry=350,greensBack=["gLeafB","gLeafM"],greensFront=["gLeafF","gLeafM"];for(let i=0;i<60;i++){const p=ellipsePt(cx,cy,rx,ry),out=Math.atan2(p.y-cy,p.x-cx)*180/Math.PI+90+r(-32,32);backLeaves.push(leafStr(p.x,p.y,out,r(72,118),pick(greensBack),(1.2+r(0,1.3)).toFixed(2),r(4.5,7).toFixed(1),r(0,4).toFixed(1),0.95));}for(let i=0;i<30;i++){const a=r(0,Math.PI*2),rad=r(0.82,1.04),px=cx+Math.cos(a)*rx*rad,py=cy+Math.sin(a)*ry*rad,out=a*180/Math.PI+90+r(-28,28);backLeaves.push(leafStr(px,py,out,r(70,108),pick(greensBack),(1.2+r(0,1.3)).toFixed(2),r(4.5,7).toFixed(1),r(0,4).toFixed(1),0.95));}
    const cols=["gW","gY","gP","gM","gR","gO","gS","gPe","gL","gC","gF"],pts=[];const COLS=6,ROWS=5,stepX=rx*2/COLS,stepY=ry*2/ROWS;for(let i=0;i<COLS;i++)for(let j=0;j<ROWS;j++){const px=cx-rx+stepX*(i+0.5)+r(-stepX*0.5,stepX*0.5),py=cy-ry+stepY*(j+0.5)+r(-stepY*0.5,stepY*0.5),nx=(px-cx)/rx,ny=(py-cy)/ry;if(nx*nx+ny*ny>1.08)continue;if(Math.random()<0.85)pts.push({x:px,y:py});}tips.forEach(t=>{const nx=(t.x-cx)/rx,ny=(t.y-cy)/ry;if(nx*nx+ny*ny<1.25&&Math.random()<0.35)pts.push({x:t.x,y:t.y});});pts.forEach(p=>{const bicolor=Math.random()<0.32,cA=pick(cols),cB=bicolor?pick(cols):cA,n=ri(3,5);let g=`<g class="flowerg" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">`;for(let k=0;k<n;k++)g+=flowerStr(r(-28,28),r(-24,24),r(0.5,0.82).toFixed(2),ri(0,72),(k%2&&bicolor)?cB:cA,(2.0+r(0,1.8)).toFixed(2));if(Math.random()<0.5)g+=budStr(r(-30,30),r(-26,26),r(0.6,0.9).toFixed(2),ri(0,360),cA,(2.0+r(0,1.8)).toFixed(2));g+="</g>";flowerParts.push(g);});
    for(let i=0;i<16;i++){const a=r(0,Math.PI*2),rad=r(0.3,1.02),p={x:cx+Math.cos(a)*rx*rad,y:cy+20+Math.sin(a)*ry*rad},out=Math.atan2(p.y-cy,p.x-cx)*180/Math.PI+90+r(-30,30);frontLeaves.push(leafStr(p.x,p.y,out,r(80,122),pick(greensFront),(1.4+r(0,1.3)).toFixed(2),r(4.5,7).toFixed(1),r(0,4).toFixed(1),1));}
    let nestMarkup="";
    const nestCands=tips.filter(t=>t.y<880&&t.y>560&&Math.abs(t.x-500)>60);
    if(nestCands.length){const nt=pick(nestCands),nx=nt.x.toFixed(1),ny=nt.y.toFixed(1);
    nestMarkup=`<g class="plumeria-nest" transform="translate(${nx} ${ny}) scale(1.45)"><path d="M-22 2 Q-24 -5 -16 -9 Q-8 -13 0 -14 Q8 -13 16 -9 Q24 -5 22 2 Q14 6 0 7 Q-14 6 -22 2Z" fill="#8B6914" stroke="#5a3e0a" stroke-width=".8"/><path d="M-24 0 Q-16 -13 -6 -10" fill="none" stroke="#6b4d1a" stroke-width="1.8" stroke-linecap="round"/><path d="M-12 -11 Q2 -17 16 -10" fill="none" stroke="#7a5c2a" stroke-width="1.4" stroke-linecap="round"/><path d="M8 -12 Q22 -15 26 -1" fill="none" stroke="#6b4d1a" stroke-width="1.6" stroke-linecap="round"/><path d="M-18 -2 Q-10 -7 4 -11" fill="none" stroke="#8a6c2a" stroke-width="1" stroke-linecap="round"/><ellipse cx="0" cy="-1" rx="13" ry="7" fill="#5a3e0a" opacity=".35"/><g class="nest-birds"><g transform="translate(-8 -16)"><ellipse cx="0" cy="0" rx="7" ry="5" fill="#5a4030"/><circle cx="5.5" cy="-3.5" r="3.6" fill="#5a4030"/><path d="M8.5 -3.5 L12 -2.5" fill="none" stroke="#e89520" stroke-width="1.4" stroke-linecap="round"/><circle cx="6.5" cy="-4.5" r="1" fill="#222"/><path d="M-2 -1 Q0 -4.5 4.5 -2" fill="none" stroke="#4a3020" stroke-width=".7"/></g><g transform="translate(8 -15) scale(-1,1)"><ellipse cx="0" cy="0" rx="6.5" ry="4.5" fill="#6a5040"/><circle cx="5" cy="-3" r="3.2" fill="#6a5040"/><path d="M7.5 -3 L11 -2" fill="none" stroke="#e89520" stroke-width="1.3" stroke-linecap="round"/><circle cx="6" cy="-4" r=".9" fill="#222"/><path d="M-1.5 -.5 Q.5 -4 4 -1.5" fill="none" stroke="#5a4030" stroke-width=".6"/></g></g></g>`;var _bm=nestMarkup.match(/<g class="nest-birds">([\s\S]*)<\/g><\/g>$/);nestBirdsOverlay=_bm?('<svg class="nest-birds-live" viewBox="0 0 1000 1300" preserveAspectRatio="xMidYMax meet"><g transform="translate('+nx+' '+ny+') scale(1.45)">'+_bm[1]+'</g></svg>'):"";}
    const defs=`<defs><linearGradient id="bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#37261a"/><stop offset=".5" stop-color="#6b4d31"/><stop offset="1" stop-color="#2c1d12"/></linearGradient><linearGradient id="gLeafB" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#0b3414"/><stop offset="1" stop-color="#1b6224"/></linearGradient><linearGradient id="gLeafM" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#114d1c"/><stop offset="1" stop-color="#2a8a36"/></linearGradient><linearGradient id="gLeafF" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#176c23"/><stop offset="1" stop-color="#3cab48"/></linearGradient><linearGradient id="gW" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffcf3f"/><stop offset=".2" stop-color="#fff0b0"/><stop offset=".55" stop-color="#fffdf3"/><stop offset="1" stop-color="#ffffff"/></linearGradient><linearGradient id="gY" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff9e00"/><stop offset=".28" stop-color="#ffd633"/><stop offset=".62" stop-color="#ffe97a"/><stop offset="1" stop-color="#fff3a8"/></linearGradient><linearGradient id="gP" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd23f"/><stop offset=".3" stop-color="#ffc6c2"/><stop offset=".62" stop-color="#f58fb0"/><stop offset="1" stop-color="#e85f93"/></linearGradient><linearGradient id="gM" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffc63f"/><stop offset=".3" stop-color="#e87aa0"/><stop offset=".62" stop-color="#c43c77"/><stop offset="1" stop-color="#97134f"/></linearGradient><linearGradient id="gR" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffbf33"/><stop offset=".3" stop-color="#f06a3a"/><stop offset=".62" stop-color="#d8392a"/><stop offset="1" stop-color="#ad1c1c"/></linearGradient><linearGradient id="gO" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd23f"/><stop offset=".3" stop-color="#ffb060"/><stop offset=".62" stop-color="#ff8a3c"/><stop offset="1" stop-color="#f4632a"/></linearGradient><linearGradient id="gS" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd84f"/><stop offset=".3" stop-color="#ffc39a"/><stop offset=".62" stop-color="#ff9e74"/><stop offset="1" stop-color="#f47e52"/></linearGradient><linearGradient id="gPe" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe45a"/><stop offset=".3" stop-color="#ffd9a0"/><stop offset=".62" stop-color="#ffb784"/><stop offset="1" stop-color="#ff9d6e"/></linearGradient><linearGradient id="gL" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe07a"/><stop offset=".3" stop-color="#f0d2e8"/><stop offset=".62" stop-color="#c79bd6"/><stop offset="1" stop-color="#9d6fc4"/></linearGradient><linearGradient id="gC" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd23f"/><stop offset=".3" stop-color="#ff9e72"/><stop offset=".62" stop-color="#fa6f5a"/><stop offset="1" stop-color="#e8463f"/></linearGradient><linearGradient id="gF" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd84f"/><stop offset=".3" stop-color="#ffb4d0"/><stop offset=".62" stop-color="#f570a8"/><stop offset="1" stop-color="#d62f7e"/></linearGradient><radialGradient id="center"><stop offset="0" stop-color="#fff0a0"/><stop offset="1" stop-color="#f6a821"/></radialGradient><linearGradient id="gGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa83f"/><stop offset=".5" stop-color="#418a30"/><stop offset="1" stop-color="#2a6420"/></linearGradient><linearGradient id="gBlade" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3c8c2b"/><stop offset="1" stop-color="#74c64e"/></linearGradient><linearGradient id="gBlade2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#327a26"/><stop offset="1" stop-color="#5db441"/></linearGradient><radialGradient id="gBush" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#5cab40"/><stop offset="1" stop-color="#2c6a22"/></radialGradient><radialGradient id="gBushHi" cx=".4" cy=".3" r=".7"><stop offset="0" stop-color="#9bd873"/><stop offset="1" stop-color="#9bd873" stop-opacity="0"/></radialGradient></defs>`;
    // PERF: back/front leaves van cada uno en UN solo <g class="leaf-canopy">
    // (antes cada hoja individual llevaba su propia <g class="leafg">, ~106 en la
    // escena del libro). El filtro CSS de modo oscuro/lluvia se aplicaba POR HOJA
    // (106 rasterizaciones separadas) dentro del grupo que #canopySway rota cada
    // 7s sin parar → ese era el cuello de botella real del lag del árbol. Al
    // agrupar, el filtro pasa a ser 1-2 operaciones en vez de ~106, mismo
    // resultado visual (mismo filtro, mismos píxeles). Las flores van en su
    // propio <g class="flower-canopy"> por la misma razón (se usa solo en
    // lluvia, que también filtraba cada flor por separado). El orden se
    // preserva (hojas atrás → flores → hojas al frente) para no alterar la
    // profundidad visual.
    svgMarkup=`<svg viewBox="0 0 1000 1300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Árbol de flor de mayo">${defs}<g class="groundg" id="groundBack">${groundBack.join("")}</g><g id="sway"><g id="branchLayer">${branchParts.join("")}</g><g id="canopySway"><g class="leaf-canopy">${backLeaves.join("")}</g><g class="flower-canopy">${flowerParts.join("")}</g><g class="leaf-canopy">${frontLeaves.join("")}</g></g>${nestMarkup}</g><g class="groundg" id="groundFront">${groundFront.join("")}</g></svg>`;
    // Prefijo único por escena para IDs de <defs> (evita colisiones entre múltiples árboles en el mismo documento)
    if (SID) {
        const defIds = ["bark","gLeafB","gLeafM","gLeafF","gW","gY","gP","gM","gR","gO","gS","gPe","gL","gC","gF","center","gGrass","gBlade","gBlade2","gBush","gBushHi"];
        defIds.forEach(id => {
            svgMarkup = svgMarkup.split(`id="${id}"`).join(`id="${SID}_${id}"`)
                                 .split(`url(#${id})`).join(`url(#${SID}_${id})`);
        });
    }
    /* el montaje al stage lo decide mountSvg() según visibilidad */}
    function buildCritters(){if(!sky)return;let css="",html="";const bCols=[["#ff8a3c","#bd4f18"],["#5aa0ff","#2b5fcc"],["#ffd24a","#cf9314"],["#ff7bbf","#b83d80"],["#f4f4f4","#c9c9c9"],["#7be0c0","#2da683"],["#b98cff","#6c43c0"]];const nB=isRainyDay ? 0 : (2+ri(0,1));for(let i=0;i<nB;i++){const dir=Math.random()<0.5?1:-1,x0=dir>0?-14:114,x1=dir>0?114:-14,dx=x1-x0,yv=[r(30,90),r(26,92),r(34,86),r(26,92),r(30,90)].map(v=>Math.round(v)),n="plmbf"+SID+i;css+=`@keyframes ${n}{0%{transform:translate(${x0}cqw,${yv[0]}cqh)}25%{transform:translate(${Math.round(x0+dx*0.25)}cqw,${yv[1]}cqh)}50%{transform:translate(${Math.round(x0+dx*0.5)}cqw,${yv[2]}cqh)}75%{transform:translate(${Math.round(x0+dx*0.75)}cqw,${yv[3]}cqh)}100%{transform:translate(${x1}cqw,${yv[4]}cqh)}}`;const dur=r(11,19).toFixed(1),del=(-r(0,19)).toFixed(1),sc=r(0.7,1.15).toFixed(2),fl=r(.14,.24).toFixed(2),[c,e]=pick(bCols);const wings=`<svg class="bwings" width="26" height="22" viewBox="-13 -11 26 22" style="animation-duration:${fl}s"><path d="M0 -2 C -11 -13 -16 -3 -8 2 C -14 7 -5 11 0 4 Z" fill="${c}" stroke="${e}" stroke-width=".6"/><path d="M0 -2 C 11 -13 16 -3 8 2 C 14 7 5 11 0 4 Z" fill="${c}" stroke="${e}" stroke-width=".6"/><ellipse rx="1" ry="5.5" fill="#33240f"/></svg>`;html+=`<div class="butterfly" style="animation:${n} ${dur}s linear ${del}s infinite"><div class="bsize" style="transform:scale(${sc}) scaleX(${dir})">${wings}</div></div>`;}
    if(!isRainyDay){const bDir=Math.random()<0.5?1:-1,bx0=bDir>0?-12:112,bx1=bDir>0?112:-12,bdx=bx1-bx0,by0=r(2,10),byOff=[r(-2,4),r(-3,3),r(-2,4),r(-2,3)],bN=`birdFly${SID}`;const crossT=r(22,34),gapT=r(10,15),bDur=(crossT+gapT).toFixed(1);const Kf=(crossT/parseFloat(bDur))*100,kp=f=>(Kf*f).toFixed(1);css+=`@keyframes ${bN}{0%{transform:translate(${bx0}cqw,${by0.toFixed(1)}cqh)}${kp(0.25)}%{transform:translate(${(bx0+bdx*0.25).toFixed(0)}cqw,${(by0+byOff[0]).toFixed(1)}cqh)}${kp(0.5)}%{transform:translate(${(bx0+bdx*0.5).toFixed(0)}cqw,${(by0+byOff[1]).toFixed(1)}cqh)}${kp(0.75)}%{transform:translate(${(bx0+bdx*0.75).toFixed(0)}cqw,${(by0+byOff[2]).toFixed(1)}cqh)}${kp(1)}%{transform:translate(${bx1}cqw,${(by0+byOff[3]).toFixed(1)}cqh)}100%{transform:translate(${bx1}cqw,${(by0+byOff[3]).toFixed(1)}cqh)}}`;const bDel=(-r(0,parseFloat(bDur))).toFixed(1);const bSil="M23.5,56.5L27,55C30,48 35,49 38,51C34,38 30,28 25,23Q31,27 33,32L37,25Q39,30 40,35L45,29Q46,34 47,39L51,35Q50,42 51,47C61,37 72,29 82,24Q77,31 72,37L76,40Q71,44 67,47L71,51Q66,54 62,56L65,60Q60,62 57,63C59,70 63,75 67,78L71,79 66,81 69,84 64,85 65,88 60,89 60,91 54,83C42,87 29,75 25.5,61Q24,58 23.5,56.5Z";const bSvg1=`<svg class="fb-svg" viewBox="18 18 70 78" width="28" height="31" style="--flap:${r(0.7,1.0).toFixed(2)}s"><path d="${bSil}" fill="#2a1f15"/></svg>`;const bSvg2=`<svg class="fb-svg" viewBox="18 18 70 78" width="22" height="24" style="--flap:${r(0.75,1.05).toFixed(2)}s"><path d="${bSil}" fill="#3a2f22"/></svg>`;html+=`<div class="plumeria-flying-bird" style="animation:${bN} ${bDur}s linear ${bDel}s infinite"><div style="position:relative;transform:scaleX(${-bDir})">${bSvg1}<div style="position:absolute;top:18px;left:16px">${bSvg2}</div></div></div>`;}
    const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
    sky.innerHTML=html;

    function buildMoon() {
        const lp = 2551443;
        const now = new Date();
        const newMoonRef = new Date(1970, 0, 7, 20, 35, 0);
        const phase = ((now.getTime() - newMoonRef.getTime()) / 1000) % lp;
        const age = (phase / (24 * 3600));
        const pct = (1 - Math.cos((age * Math.PI) / 14.765)) / 2 * 100;
        const waxing = age < 14.765;
        let isSouthern = false;
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
            const southRegions = [
                "santiago", "buenos_aires", "montevideo", "asuncion", "la_paz", "lima",
                "quito", "bogota", "sao_paulo", "rio_de_janeiro", "johannesburg", "nairobi",
                "dar_es_salaam", "luanda", "harare", "sydney", "melbourne", "brisbane",
                "adelaide", "perth", "hobart", "auckland", "wellington", "fiji", "tahiti"
            ];
            const lowerTz = tz.toLowerCase();
            isSouthern = southRegions.some(region => lowerTz.indexOf(region) >= 0);
        } catch(e) {}
        const r = 9;
        let d = "";
        if (pct < 1) {
            d = "";
        } else if (pct > 99) {
            d = `M 0,-${r} A ${r},${r} 0 1,1 0,${r} A ${r},${r} 0 1,1 0,-${r}`;
        } else {
            let k = (pct / 50) - 1;
            const rx = Math.abs(r * k);
            if (waxing) {
                const sweep = pct > 50 ? 1 : 0;
                d = `M 0,-${r} A ${r},${r} 0 0,1 0,${r} A ${rx},${r} 0 0,${sweep} 0,-${r}`;
            } else {
                const sweep = pct > 50 ? 1 : 0;
                d = `M 0,${r} A ${r},${r} 0 0,1 0,-${r} A ${rx},${r} 0 0,${sweep} 0,${r}`;
            }
        }
        const rotation = isSouthern ? 180 : 0;
        const moonEl = document.createElement("div");
        moonEl.className = "plumeria-moon";
        moonEl.style.transform = `rotate(${rotation}deg)`;
        const moonGlowId = "plumeriaMoonGlow" + SID;
        const moonClipId = "moonLightClip" + SID;
        moonEl.innerHTML = `<svg viewBox="-15 -15 30 30" width="100%" height="100%">
            <defs>
                <radialGradient id="${moonGlowId}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="rgba(255,254,240,0.35)" />
                    <stop offset="60%" stop-color="rgba(255,254,240,0.12)" />
                    <stop offset="100%" stop-color="rgba(255,254,240,0)" />
                </radialGradient>
                ${d ? `<clipPath id="${moonClipId}"><path d="${d}" /></clipPath>` : ""}
            </defs>
            <circle r="14" fill="url(#${moonGlowId})" />
            <!-- Disco base OPACO: la parte no iluminada de la luna también tapa
                 las estrellas (antes era rgba .06 y la textura de estrellas del
                 fondo se veía PASAR a través del disco oscuro). Tono apenas más
                 claro que el cielo = luz cenicienta (earthshine). -->
            <circle r="9" fill="#1c202a" />
            <circle r="9" fill="rgba(255,255,255,0.06)" />
            ${d ? `<path d="${d}" fill="#fffef0" />` : ""}
            ${d ? `<g clip-path="url(#${moonClipId})">
                <circle cx="-3" cy="-2" r="1.8" fill="#e7e2d3" opacity="0.85" />
                <circle cx="-1" cy="4" r="1.2" fill="#e7e2d3" opacity="0.85" />
                <circle cx="4" cy="1" r="1.5" fill="#e7e2d3" opacity="0.85" />
                <circle cx="2" cy="-4" r="1.0" fill="#e7e2d3" opacity="0.85" />
                <circle cx="-4" cy="2" r="0.8" fill="#e0dacb" opacity="0.8" />
                <circle cx="3" cy="4" r="0.7" fill="#e0dacb" opacity="0.8" />
            </g>` : ""}
        </svg>`;
        // Luna: posición ALEATORIA en el tercio superior; va a la capa z2 del wrap
        // (entre el fondo y el árbol) para que asome DETRÁS de la copa de forma natural.
        const _wrap=sky.parentNode;
        moonEl.style.top=(2+Math.random()*22).toFixed(1)+"%";
        moonEl.style.left=(4+Math.random()*74).toFixed(1)+"%";
        moonEl.style.right="auto";
        _wrap.appendChild(moonEl);
    }
    buildMoon();
    (function buildMountains(){
        // 2 cordilleras ESTÁTICAS detrás del árbol (capa z2, entre cielo y árbol).
        // Silueta semitransparente = se TIÑE con el cielo del día (cualquier
        // atardecer o la noche) sin lógica de color. Mismo viewBox que el árbol →
        // la base cae en el horizonte del pasto (y≈1196). Sin animación = costo ~0.
        const w=sky.parentNode, m=document.createElement("div");
        m.className="plumeria-mountains";
        m.setAttribute("aria-hidden","true");
        m.innerHTML='<svg viewBox="0 0 1000 1300" preserveAspectRatio="xMidYMax meet">'
            +'<path d="M -60 1310 L -60 1196 L 40 1105 L 90 1102 L 170 1150 L 250 1060 L 300 1058 L 380 1130 L 470 1092 L 505 1090 L 590 1140 L 680 1072 L 720 1074 L 800 1125 L 890 1088 L 980 1112 L 1060 1092 L 1060 1310 Z" fill="rgba(28,34,58,0.24)"/>'
            +'<path d="M -60 1310 L -60 1196 L 70 1150 L 115 1148 L 210 1178 L 330 1136 L 375 1134 L 480 1170 L 610 1142 L 655 1144 L 760 1175 L 880 1150 L 990 1168 L 1060 1152 L 1060 1310 Z" fill="rgba(18,24,44,0.40)"/></svg>';
        w.appendChild(m);
    })();

    function buildClouds() {
        const wrap = sky.parentNode;
        if (!wrap) return;

        // Si hoy llueve, agregamos la clase y creamos la lluvia de fondo
        if (isRainyDay) {
            if (page) page.classList.add("plumeria-rainy");

            const rainBack = document.createElement("div");
            rainBack.className = "plumeria-rain-back";
            wrap.insertBefore(rainBack, stage);
        }

        const skyBg = document.createElement("div");
        skyBg.className = "plumeria-sky-bg";
        wrap.insertBefore(skyBg, stage);

        const nC = 3 + ri(0, 2);
        let css = "";
        for (let i = 0; i < nC; i++) {
            const cloudEl = document.createElement("div");
            cloudEl.className = "plumeria-cloud";
            const top = r(5, 32);
            const scale = r(0.55, 1.25);
            const dur = r(130, 260);
            const delay = -r(0, dur);
            const animName = `cloudDrift${SID}${i}`;
            css += `@keyframes ${animName} {
                0% { transform: translateX(-160px) scale(${scale.toFixed(2)}); }
                100% { transform: translateX(110vw) scale(${scale.toFixed(2)}); }
            }`;
            cloudEl.style.top = `${top.toFixed(1)}%`;
            cloudEl.style.left = "0px";
            cloudEl.style.animation = `${animName} ${dur.toFixed(1)}s linear ${delay.toFixed(1)}s infinite`;
            const parts = [
                { w: 50, h: 50, x: 0, y: 15 },
                { w: 70, h: 70, x: 30, y: 0 },
                { w: 55, h: 55, x: 75, y: 10 },
                { w: 45, h: 45, x: 105, y: 20 }
            ];
            let partsHTML = "";
            parts.forEach((p, idx) => {
                const rw = p.w * r(0.85, 1.15);
                const rh = p.h * r(0.85, 1.15);
                const rx = p.x + r(-5, 5);
                const ry = p.y + r(-3, 3);
                partsHTML += `<div class="cloud-part" style="width:${rw.toFixed(1)}px;height:${rh.toFixed(1)}px;left:${rx.toFixed(1)}px;top:${ry.toFixed(1)}px;"></div>`;
            });
            cloudEl.innerHTML = partsHTML;
            skyBg.appendChild(cloudEl);
        }

        // Agregar lluvia frontal en el primer plano
        if (isRainyDay) {
            const rainFront = document.createElement("div");
            rainFront.className = "plumeria-rain-front";
            wrap.appendChild(rainFront);
        }

        const st = document.createElement("style");
        st.textContent = css;
        document.head.appendChild(st);
    }
    buildClouds();
    // Luciérnagas realistas — movimiento errático con JS, apagones reales
const fireflyColors=[];
// 50% verde/amarillo, 35% naranja/rojo, 15% blanco
const cGreenYellow=["#a8ff44","#c6ff3a","#d4ff5a","#e8ff6a","#bfff30","#dcff50"];
const cOrangeRed=["#ff8a3c","#ff6030","#ff4f2a","#ffae57","#f46a32","#ff7742"];
const cWhite=["#ffffff","#fff8e8","#faf4ff","#fffdf0"];
for(let i=0;i<50;i++) fireflyColors.push(Math.random()<0.50?pick(cGreenYellow):Math.random()<0.636?pick(cOrangeRed):pick(cWhite));
// PERF: menos luciérnagas en la escena del LIBRO que en los overlays anchos
// (orientación/gate), mismo criterio que ya se aplica a hojas/césped/arbustos
// en buildGround() — el libro es la escena que se ve la mayor parte del tiempo.
const nF=isRainyDay ? (1+ri(0,1)) : (overlay ? (8+ri(0,3)) : (5+ri(0,2)));
const fireflies=[];
for(let i=0;i<nF;i++){
    const col=pick(fireflyColors);
    const sz=r(6,13);
    const el=document.createElement("div");
    el.className="firefly";
    el.style.width=sz+"px";
    el.style.height=sz+"px";
    const core=col==="#ffffff"||col.startsWith("#fff")?"rgba(255,255,255,0.95)":col;
    el.style.background=`radial-gradient(circle, #fffef2 0%, ${core} 30%, ${col}88 55%, transparent 78%)`;
    el.style.boxShadow=`0 0 ${Math.round(sz*0.8)}px ${Math.round(sz*0.4)}px ${col}66`;
    sky.appendChild(el);
    fireflies.push({
        el,
        x:r(5,95), y:r(30,95),
        // Velocidad en %/segundo
        vx:r(-5,5), vy:r(-4,4),
        lit:true,
        litTimer:r(1.5,4),
        darkDurations:[1,2,2.5],
        darkIdx:ri(0,2),
        phase:r(0,10),
        op:0,        // opacidad actual guardada en JS (evita leerla del DOM cada frame)
        sz
    });
}
let lastFireflyTime=0,ffRunning=false;
function tickFireflies(ts){
    // Parar si la escena no se ve (overlay oculto, hoja lejana o volteada) o
    // no es modo oscuro. ffRunning evita bucles rAF duplicados: antes el
    // observer re-lanzaba un bucle NUEVO con cada cambio de clase del body.
    if(!document.body.classList.contains("dark-mode") || !sceneVisible() || sky.offsetParent===null
       || document.body.classList.contains("gestures-on")){   // gestos activos: liberar recursos
        lastFireflyTime=0; ffRunning=false; return;
    }
    // Con una hoja girando (body.flipping) se congelan sin trabajar el frame;
    // el bucle sigue vivo y reanudan solos al terminar el volteo.
    if(document.body.classList.contains("flipping")){
        lastFireflyTime=0; requestAnimationFrame(tickFireflies); return;
    }
    // Tope ~30fps: se mueven lento y errático, imperceptible vs 60fps, y baja a
    // la mitad el trabajo por frame (física + escrituras de estilo + recomposición).
    if(lastFireflyTime && (ts - lastFireflyTime) < 33){ requestAnimationFrame(tickFireflies); return; }
    if(!lastFireflyTime) lastFireflyTime=ts;
    const dt=Math.min((ts-lastFireflyTime)/1000,0.1);
    lastFireflyTime=ts;
    for(const f of fireflies){
        f.phase+=dt;
        // Cambio de dirección suave (%/s² — aceleración aleatoria)
        f.vx+=r(-8,8)*dt; f.vy+=r(-6,6)*dt;
        // Fricción ligera independiente del framerate (pierde ~15% de velocidad por segundo)
        const friction=Math.pow(0.85,dt);
        f.vx*=friction; f.vy*=friction;
        // Tope de velocidad (~10 %/s — vuelo suave pero perceptible)
        const speed=Math.hypot(f.vx,f.vy);
        const maxSpd=10;
        if(speed>maxSpd){f.vx*=maxSpd/speed;f.vy*=maxSpd/speed;}
        // Posición (Euler): x += v * dt
        f.x+=f.vx*dt; f.y+=f.vy*dt;
        // Pueden salir y volver a entrar (empujón suave hacia el centro)
        if(f.x<-12) f.vx+=r(12,20)*dt;
        else if(f.x>112) f.vx-=r(12,20)*dt;
        if(f.y<20) f.vy+=r(10,16)*dt;
        else if(f.y>105) f.vy-=r(10,16)*dt;
        // Ciclo encendido/apagado
        f.litTimer-=dt;
        if(f.litTimer<=0){
            if(f.lit){
                f.lit=false;
                f.litTimer=f.darkDurations[f.darkIdx];
                f.darkIdx=(f.darkIdx+1)%f.darkDurations.length;
            } else {
                f.lit=true;
                f.litTimer=r(1.5,4.5);
            }
        }
        // Opacidad: transición suave al encender/apagar (guardada en f.op, sin leer del DOM)
        const targetOp=f.lit?r(0.7,1.0):0;
        const newOp=f.op+(targetOp-f.op)*Math.min(1,dt*3.5);
        f.op=newOp;
        f.el.style.opacity=newOp.toFixed(3);
        // PERF: transform (cqw/cqh) en vez de left/top. left/top fuerza LAYOUT del
        // navegador en cada frame (8-11 luciérnagas × 60fps); transform es solo
        // compositor/GPU, igual que ya usan las mariposas de esta misma escena.
        f.el.style.transform="translate("+f.x.toFixed(2)+"cqw,"+f.y.toFixed(2)+"cqh)";
    }
    requestAnimationFrame(tickFireflies);
}
function startFireflies(){
    if(ffRunning) return;
    ffRunning=true; lastFireflyTime=0;
    requestAnimationFrame(tickFireflies);
}
resumeFireflies=startFireflies;
// Arrancar/detener con dark mode (el propio tick se detiene solo al ocultarse)
const ffObserver=new MutationObserver(()=>{
    if(document.body.classList.contains("dark-mode")) startFireflies();
});
ffObserver.observe(document.body,{attributes:true,attributeFilter:["class"]});
if(document.body.classList.contains("dark-mode")) startFireflies();}
    let svgCache="",crittersBuilt=false,rasterCache="",rasterizing=false,nestBirdsOverlay="";
    function buildOnce(){if(svgCache)return;build();svgCache=svgMarkup;}
    function buildCrittersOnce(){if(crittersBuilt)return;crittersBuilt=true;buildCritters();}
    // PRUEBA (técnica 1): rasterizar el árbol ESTÁTICO a PNG una vez. Rotar/animar
    // una sola imagen (composite GPU) es mucho más barato que animar ~800 formas SVG
    // vivas (que en oscuro obligaban a apagar el vaivén por re-rasterizado por frame).
    function rasterize(cb){
        if(rasterCache){cb(rasterCache);return;}
        if(!svgCache)buildOnce();
        // El CSS externo (p.ej. `.nest-birds{display:none}` de día) NO llega al SVG
        // rasterizado, así que las aves del nido quedarían horneadas SIEMPRE visibles
        // (= 4 aves de día). Inyectamos display:none inline al nido para el bitmap.
        // NOTA: con esto el nido queda vacío también de noche/lluvia (limitación del
        // bitmap); si se quiere el nido nocturno habría que montarlo como overlay vivo.
        const svg=svgCache
            .replace("<svg ", '<svg width="1000" height="1300" ')
            .replace('<g class="nest-birds">', '<g class="nest-birds" style="display:none">');
        const img=new Image();
        img.onload=function(){
            try{
                const S=0.92, scale=(window.devicePixelRatio||1)>1?2:1.5;
                const W=Math.round(1000*S), H=Math.round(1300*S);
                const c=document.createElement("canvas"); c.width=W*scale; c.height=H*scale;
                const ctx=c.getContext("2d"); ctx.scale(scale,scale); ctx.drawImage(img,0,0,W,H);
                // WebP (mucho más liviano que PNG, ~1/8) con fallback a PNG.
                let out=c.toDataURL("image/webp",0.86);
                if(!out || out.indexOf("data:image/webp")!==0) out=c.toDataURL("image/png");
                rasterCache=out;
            }catch(e){ rasterCache=""; }
            cb(rasterCache);
        };
        img.onerror=function(){ cb(""); };
        img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
    }
    let mountToken=0;
    function mountSvg(){
        if(!svgCache)buildOnce();
        const tok=++mountToken;
        // Si ya tenemos el PNG, monta el bitmap directo; si no, monta el SVG (para que
        // el árbol se vea YA) y cámbialo a bitmap cuando el raster esté listo.
        if(rasterCache){
            stage.innerHTML='<div class="tree-bmp-grow"><div class="tree-bmp-sway"><img class="tree-bmp" src="'+rasterCache+'" alt="" draggable="false">'+nestBirdsOverlay+'</div></div>';
            return;
        }
        stage.innerHTML=svgCache;
        rasterize(function(png){
            if(tok!==mountToken)return;
            if(png){
                console.log("[treebmp] raster OK len="+png.length);
                stage.innerHTML='<div class="tree-bmp-grow"><div class="tree-bmp-sway"><img class="tree-bmp" src="'+png+'" alt="" draggable="false">'+nestBirdsOverlay+'</div></div>';
                if(page)page.classList.add("plumeria-grown"); // ya no hay entrada SVG que congelar
            }else{
                console.log("[treebmp] raster FAIL (queda SVG)");
            }
        });
    }
    function unmountSvg(){mountToken++;stage.innerHTML="";}
    const idle=window.requestIdleCallback||(cb=>setTimeout(cb,1));
    if(overlay){
        // Escenas de overlay (orientación / gate escritorio): NO construir nada
        // al arranque — antes se montaban completas al idle y, como el overlay
        // se oculta con visibility:hidden, sus cientos de animaciones corrían
        // de fondo SIEMPRE. Se construyen la primera vez que aparece .show.
        let shown=overlay.classList.contains("show");
        const showScene=()=>{buildOnce();buildCrittersOnce();mountSvg();resumeFireflies();};
        const mo=new MutationObserver(()=>{
            const s=overlay.classList.contains("show");
            if(s===shown)return;
            shown=s;
            if(s)showScene(); else unmountSvg();
        });
        mo.observe(overlay,{attributes:true,attributeFilter:["class"]});
        if(shown)showScene();
    } else {
        // Hoja del libro: construir en idle, pero montar SOLO cuando la hoja esté
        // cerca de la vista (.near), y DESMONTAR al alejarse. Mantener los ~800-1000
        // nodos SVG permanentes en el DOM se probó y salió caro (memoria + trabajo
        // de layout al voltear), así que el desmontaje se conserva.
        // Lo que evita que el árbol "renazca desde 0" al volver NO es dejarlo
        // montado, sino la clase .plumeria-grown (abajo): vive en .plumeria-page,
        // que nunca se desmonta, así que al re-montar el SVG las animaciones de
        // entrada (growTree/leafIn/bloom/sprout) ya están desactivadas por CSS y
        // el árbol aparece completo al instante.
        const paperOn=()=>!paper||(paper.style.display!=="none"&&paper.classList.contains("near"));
        // Congela el árbol en su estado final ~6.5s tras verse por primera vez
        // (crecimiento ya terminado). Ver .plumeria-grown en CSS.
        let grownTimer=null;
        const scheduleGrown=()=>{
            if(grownTimer||!page||page.classList.contains("plumeria-grown"))return;
            grownTimer=setTimeout(()=>{if(page)page.classList.add("plumeria-grown");},6500);
        };
        idle(()=>{buildOnce();buildCrittersOnce();if(paperOn()){mountSvg();resumeFireflies();scheduleGrown();}});
        if(paper){
            let last=paperOn();
            const mo=new MutationObserver(()=>{
                const d=paperOn();
                if(d){resumeFireflies();scheduleGrown();} // idempotente: re-arranca al des-voltear/acercarse
                if(d===last)return;
                last=d;
                if(!d)unmountSvg();
                else requestAnimationFrame(mountSvg);
            });
            mo.observe(paper,{attributes:true,attributeFilter:["style","class"]});
        }
    }
} // === fin setupPlumeria (una escena) ===

    // ── Invocar para las 3 escenas: página del libro + overlay orientación + gate escritorio ──
    setupPlumeria({
        stage: document.getElementById("plumeriaStage"),
        sky:   document.getElementById("plumeriaSky"),
        page:  document.querySelector("#pPlumeria .plumeria-page"),
        paper: document.getElementById("pPlumeria"),
        id:    ""   // sin sufijo → conserva IDs originales para no romper nada existente
    });
    setupPlumeria({
        stage: document.getElementById("orientationStage"),
        sky:   document.getElementById("orientationSky"),
        page:  document.querySelector("#orientationOverlay .plumeria-page"),
        paper: null,
        overlay: document.getElementById("orientationOverlay"),
        id:    "or"
    });
    setupPlumeria({
        stage: document.getElementById("desktopGateStage"),
        sky:   document.getElementById("desktopGateSky"),
        page:  document.querySelector("#desktopGate .plumeria-page"),
        paper: null,
        overlay: document.getElementById("desktopGate"),
        id:    "dg"
    });
})();

// === Mariposas en páginas especiales ===
(function setupPageButterflies(){
    var r=function(a,b){return a+Math.random()*(b-a);};var ri=function(a,b){return Math.floor(r(a,b+1));};var pick=function(a){return a[Math.floor(Math.random()*a.length)];};
    var WINGS=[{vb:"-17 -14 34 26",L:"M0 -2 C -11 -13 -16 -3 -8 2 C -14 7 -5 11 0 4 Z",R:"M0 -2 C 11 -13 16 -3 8 2 C 14 7 5 11 0 4 Z"},{vb:"-18 -17 36 27",L:"M0 -2 C -8 -16 -17 -8 -10 0 C -13 5 -4 9 0 4 Z",R:"M0 -2 C 8 -16 17 -8 10 0 C 13 5 4 9 0 4 Z"},{vb:"-18 -10 36 24",L:"M0 -1 C -13 -9 -17 0 -10 4 C -14 10 -4 13 0 5 Z",R:"M0 -1 C 13 -9 17 0 10 4 C 14 10 4 13 0 5 Z"},{vb:"-12 -10 24 19",L:"M0 -1 C -8 -9 -11 -2 -7 2 C -9 6 -3 8 0 3 Z",R:"M0 -1 C 8 -9 11 -2 7 2 C 9 6 3 8 0 3 Z"}];
    var COLORS=[["#ff8a3c","#bd4f18"],["#5aa0ff","#2b5fcc"],["#ffd24a","#cf9314"],["#ff7bbf","#b83d80"],["#7be0c0","#2da683"],["#b98cff","#6c43c0"],["#ff6b6b","#c23636"],["#a8e06c","#5fa030"],["#ffb347","#d48806"],["#7ecfff","#3a8fcf"],["#ff9ecf","#cc5a94"],["#c4b5fd","#7c5cbf"]];
    var pages=document.querySelectorAll(".image-page, .decor-section-page, .index-page, .dict-page");
    if(!pages.length)return;
    var css="",gid=0;
    pages.forEach(function(front){var sky=document.createElement("div");sky.className="page-sky";front.appendChild(sky);var count=ri(2,5);var html="";for(var i=0;i<count;i++){var id=gid++;var dir=Math.random()<0.5?1:-1;var x0=dir>0?-14:114,x1=dir>0?114:-14;var dx=x1-x0;var yv=[r(15,85),r(10,90),r(15,85),r(10,90),r(15,85)].map(function(v){return Math.round(v);});var n="pgbf"+id;css+="@keyframes "+n+"{0%{transform:translate("+x0+"cqw,"+yv[0]+"cqh)}25%{transform:translate("+Math.round(x0+dx*0.25)+"cqw,"+yv[1]+"cqh)}50%{transform:translate("+Math.round(x0+dx*0.5)+"cqw,"+yv[2]+"cqh)}75%{transform:translate("+Math.round(x0+dx*0.75)+"cqw,"+yv[3]+"cqh)}100%{transform:translate("+x1+"cqw,"+yv[4]+"cqh)}}";var dur=r(12,22).toFixed(1);var del=(-r(0,22)).toFixed(1);var sc=r(0.55,1.2).toFixed(2);var fl=r(0.14,0.26).toFixed(2);var col=pick(COLORS),c=col[0],e=col[1];var w=pick(WINGS);var svg='<svg class="bwings" width="28" height="24" viewBox="'+w.vb+'" style="animation-duration:'+fl+'s"><path d="'+w.L+'" fill="'+c+'" stroke="'+e+'" stroke-width=".6"/><path d="'+w.R+'" fill="'+c+'" stroke="'+e+'" stroke-width=".6"/><ellipse rx="1" ry="5.5" fill="#33240f"/></svg>';html+='<div class="butterfly" style="animation:'+n+" "+dur+"s linear "+del+'s infinite"><div class="bsize" style="transform:scale('+sc+") scaleX("+dir+')">'+svg+"</div></div>";}sky.innerHTML=html;});
    var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
})();

    // (La restauración de la página guardada ocurre arriba, en restoreInitialLocation,
    // ANTES del primer updatePaperVisibility para que no sobrescriba el hash.)

    // Escuchar cambios de hash para navegar con botones del navegador
    window.addEventListener("hashchange", () => {
        const targetLoc = getLocationForHash(window.location.hash);
        if (targetLoc !== currentLocation) {
            goToPage(targetLoc);
        }
    });

    // ═══════════════════════════════════════════════════════════════════
    // FASE 3 — Control Gestual con MediaPipe
    // ═══════════════════════════════════════════════════════════════════
    const gestureBtn = document.querySelector("#gestureBtn");
    const gestureModal = document.querySelector("#gestureModal");
    const gmStep1 = document.querySelector("#gmStep1");
    const gmStep2 = document.querySelector("#gmStep2");
    const gestureNextBtn = document.querySelector("#gestureNextBtn");   // paso 1 → guía
    const gestureBackBtn = document.querySelector("#gestureBackBtn");   // guía → paso 1
    const gestureStartBtn = document.querySelector("#gestureStartBtn"); // guía → activar
    const gestureCancelBtn = document.querySelector("#gestureCancelBtn");

    let gestureActive = false;
    let videoStream = null;
    let videoElement = null;
    let handsInstance = null;
    let animationFrameId = null;
    let processingFrame = false;

    // ── Estado de gestos ──────────────────────────────────────────────
    // Una FORMA DE MANO por acción (ver classifyPose):
    //   🖐️ palma → página (←/→) · 👉 índice tumbado → scroll (↑/↓)
    //   👍/👎 pulgar → zoom (+/−) · ☝️ índice vertical → 🤫 (oculto)
    let handHistory = [];        // posiciones de la palma abierta (swipe de página)
    let pointHistory = [];       // posiciones del índice tumbado (swipe de scroll)
    let lastPageTime = 0, lastScrollTime = 0, lastZoomTime = 0;
    let lastPageDir = 0;         // dirección del último cambio de página (bloqueo de reversa)
    let lastScrollDir = 0;       // dirección del último scroll (bloqueo de reversa)
    // Sesión de PELLIZCO (zoom). Una vez abierta se mantiene aunque los dedos se
    // separen (eso ES el zoom +); solo termina al abrir la mano o bajarla.
    // Dirección LATCHEADA + referencia móvil: dentro de un mismo pellizco se zoomea
    // en un solo sentido (relajar no revierte) y se puede "bombear"
    // (separar → juntar → separar) para encadenar pasos sin soltar.
    let pinchActive = false, pinchRef = 0, pinchDir = 0;
    const PINCH_STEP = 0.35;     // avance de apertura (normalizada) por paso de zoom
    // Entrar al pellizco exige yemas CLARAMENTE juntas (evita falsos positivos con
    // el índice señalando, donde el pulgar recogido queda lejos de la punta).
    const PINCH_ENTER = 0.60;

    const SWIPE_MIN = 0.18;        // desplazamiento mínimo del swipe (coord. normalizada)
    const SWIPE_CROSS_MAX = 0.14;  // máximo en el eje perpendicular (mantener el trazo recto)
    const SWIPE_TIME_LIMIT = 900;
    const PAGE_COOLDOWN = 1200;    // evita doble cambio de página accidental
    const PAGE_REVERSE_LOCK = 1800; // ventana en la que NO se acepta la dirección contraria
    const SCROLL_MIN = 0.09;       // recorrido del índice para desplazar (menor que el de página)
    const SCROLL_COOLDOWN = 550;   // permite scrollear encadenado
    const SCROLL_REVERSE_LOCK = 900; // ventana en la que NO se acepta scroll contrario
    const ZOOM_COOLDOWN = 350;

    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    // Dedo extendido: su punta está más lejos de la muñeca que su articulación media (PIP).
    function fingersUp(lm) {
        const w = lm[0];
        const up = (tip, pip) => dist(lm[tip], w) > dist(lm[pip], w) * 1.05;
        return { index: up(8, 6), middle: up(12, 10), ring: up(16, 14), pinky: up(20, 18) };
    }

    // Clasificador de POSE. Cada acción tiene una FORMA DE MANO distinta, sin zonas
    // grises: así el analizador no puede confundir un gesto con otro.
    //   palm  → 4 dedos extendidos ............... SOLO cambiar de página (←/→)
    //   point → solo índice, TUMBADO ............. SOLO scroll (↑/↓)
    //   thumb → 4 dedos cerrados + pulgar fuera .. SOLO zoom (arriba +, abajo −)
    //   shh   → solo índice, VERTICAL ............ easter egg (sostenido)
    // El zoom pasó de pinza (🤏) a pulgar (👍/👎) a propósito: la pinza se mide por
    // la separación de dos YEMAS (pocos píxeles a distancia de tripié, landmarks
    // ruidosos) y geométricamente es casi idéntica a un índice tumbado, así que se
    // pisaban entre sí. El pulgar se detecta por la FORMA GLOBAL de la mano, que
    // ninguna otra pose comparte, y la dirección es explícita (no inferida).
    function classifyPose(lm, f) {
        // 1) PALMA (4 dedos extendidos) → cambiar de página.
        if (f.index && f.middle && f.ring && f.pinky) return "palm";
        // 2) Anular o meñique fuera ⇒ no es pellizco ni índice señalando. Este filtro
        //    es la principal defensa contra falsos pellizcos: una mano a medio abrir
        //    (típica al rasguear o al mover el brazo) queda descartada aquí.
        if (f.ring || f.pinky) return "none";
        const handSize = dist(lm[0], lm[9]) || 0.0001;
        const pinchRatio = dist(lm[4], lm[8]) / handSize;   // apertura pulgar↔índice
        // 3) Sesión de pellizco viva manda: al separar los dedos (zoom +) la apertura
        //    crece y saldría de la pose, pero seguimos en el MISMO gesto hasta soltar.
        if (pinchActive) return "pinch";
        // 4) PELLIZCO: yemas de pulgar e índice juntas. NO se exige que el índice esté
        //    "extendido": al pellizcar se curva hacia el pulgar y fingersUp() lo da por
        //    recogido (la punta se acerca a la muñeca) — condicionarlo a f.index hacía
        //    el pellizco literalmente indetectable. Solo cuenta la cercanía de yemas.
        if (pinchRatio < PINCH_ENTER) return "pinch";
        // 5) ÍNDICE señalando (pulgar recogido ⇒ apertura grande) y TUMBADO → scroll.
        if (f.index && !f.middle) {
            const dx = Math.abs(lm[8].x - lm[5].x);
            const dy = Math.abs(lm[5].y - lm[8].y);
            if (dx > dy) return "point";
        }
        return "none";
    }

    function showToast(message, opts) {
        opts = opts || {};
        const dur = opts.duration || 2500;
        let container = document.getElementById("toastContainer");
        if (!container) {
            container = document.createElement("div");
            container.id = "toastContainer";
            document.body.appendChild(container);
        }
        // Feedback de REPETICIÓN RÁPIDA (zoom/scroll por gestos): con `key` se reusa
        // UN solo toast — actualiza texto y reinicia su timer — para que NO se apilen
        // sobre la letra del canto (antes 4+ toasts de 2.5s trepaban y tapaban).
        let toast = opts.key ? container.querySelector('.toast-message[data-key="' + opts.key + '"]') : null;
        if (toast) {
            clearTimeout(toast.__hideT); clearTimeout(toast.__rmT);
            toast.innerText = message;
            toast.classList.add("show");
        } else {
            toast = document.createElement("div");
            toast.className = "toast-message";
            if (opts.key) toast.dataset.key = opts.key;
            toast.innerText = message;
            container.appendChild(toast);
            setTimeout(() => toast.classList.add("show"), 10);
        }
        toast.__hideT = setTimeout(() => {
            toast.classList.remove("show");
            toast.__rmT = setTimeout(() => toast.remove(), 300);
        }, dur);
    }

    function showGestureFeedback(direction) {
        if (direction === "next") {
            const btn = document.querySelector("#nextBtn");
            if (btn) {
                btn.classList.add("gesture-pulse");
                setTimeout(() => btn.classList.remove("gesture-pulse"), 600);
            }
            showToast("Siguiente página ➡️");
        } else {
            const btn = document.querySelector("#prevBtn");
            if (btn) {
                btn.classList.add("gesture-pulse");
                setTimeout(() => btn.classList.remove("gesture-pulse"), 600);
            }
            showToast("Página anterior ⬅️");
        }
    }

    function showScrollFeedback(dir) {
        showToast(dir === "down" ? "Desplazando ⬇️" : "Desplazando ⬆️", { key: "scroll", duration: 1100 });
    }
    function showZoomFeedback(dir) {
        showToast(dir === "in" ? "Zoom + 🔍" : "Zoom − 🔍", { key: "zoom", duration: 1100 });
    }

    // Desplaza el contenido del canto visible (mismo scrollTop que usa el touch).
    function gestureScroll(dir) {   // dir: +1 hacia abajo, -1 hacia arriba
        const paper = papers[currentLocation - 1];
        const wrap = paper && paper.querySelector(".page-content-wrap, .dict-content");
        if (!wrap) return false;
        const amount = Math.max(120, wrap.clientHeight * 0.7) * dir;
        wrap.scrollTo({ top: wrap.scrollTop + amount, behavior: "smooth" });
        return true;
    }

    // PALMA ABIERTA: deslizar ←/→ para cambiar de página. Usa el MCP del dedo medio
    // (landmark 9) como centro estable de la palma. El movimiento vertical se
    // IGNORA aquí (el scroll tiene su propia pose: índice horizontal).
    function handleNavSwipe(lm, now) {
        const pt = lm[9];
        const x = pt.x, y = pt.y;
        handHistory = handHistory.filter(h => now - h.time < SWIPE_TIME_LIMIT);
        handHistory.push({ x, y, time: now });
        if (handHistory.length < 2) return;
        for (const h of handHistory) {
            const dx = x - h.x, dy = y - h.y;
            const adx = Math.abs(dx), ady = Math.abs(dy);
            // Horizontal → página (webcam espejada: mano der→izq física ⇒ dx>0)
            if (adx > SWIPE_MIN && ady < SWIPE_CROSS_MAX && adx > ady) {
                if (now - lastPageTime < PAGE_COOLDOWN) return;
                const dir = dx > 0 ? 1 : -1;
                // Bloqueo de REVERSA: tras cambiar de página, la mano tiene que
                // volver a su sitio y ese trayecto se leía como swipe contrario
                // (avanzabas una y regresabas). Durante PAGE_REVERSE_LOCK solo se
                // acepta la MISMA dirección (para encadenar varias páginas); la
                // contraria se ignora y además se descarta el historial para que
                // el trayecto de retorno no quede acumulado.
                if (dir !== lastPageDir && now - lastPageTime < PAGE_REVERSE_LOCK) {
                    handHistory = [];
                    return;
                }
                handHistory = []; lastPageTime = now; lastPageDir = dir;
                if (dir > 0) { showGestureFeedback("next"); goNextPage(); }
                else { showGestureFeedback("prev"); goPrevPage(); }
                return;
            }
        }
    }

    // ÍNDICE HORIZONTAL (apuntando de lado): deslizar ↑/↓ para desplazar el canto.
    // Pose propia y exclusiva → ya no compite con el cambio de página.
    function handlePointScroll(lm, now) {
        const pt = lm[8];                                   // punta del índice
        const x = pt.x, y = pt.y;
        pointHistory = pointHistory.filter(h => now - h.time < SWIPE_TIME_LIMIT);
        pointHistory.push({ x, y, time: now });
        if (pointHistory.length < 2) return;
        for (const h of pointHistory) {
            const dx = x - h.x, dy = y - h.y;
            const adx = Math.abs(dx), ady = Math.abs(dy);
            // SCROLL_MIN < SWIPE_MIN: el scroll se hace con la punta del índice y
            // exigía un recorrido tan largo (18% del encuadre) que había que barrer
            // casi toda la altura visible, y devolver la mano arriba era incómodo.
            if (ady > SCROLL_MIN && adx < SWIPE_CROSS_MAX && ady > adx) {
                if (now - lastScrollTime < SCROLL_COOLDOWN) return;
                const dir = dy < 0 ? 1 : -1;   // +1 = contenido hacia abajo
                // Bloqueo de REVERSA (igual que en las páginas): tras desplazar, el
                // trayecto de VOLVER la mano a su sitio se leía como scroll contrario
                // y deshacía el avance. Durante la ventana solo se acepta la misma
                // dirección; repetir el gesto encadena el desplazamiento.
                if (dir !== lastScrollDir && now - lastScrollTime < SCROLL_REVERSE_LOCK) {
                    pointHistory = [];
                    return;
                }
                pointHistory = []; lastScrollTime = now; lastScrollDir = dir;
                // Estilo táctil: subir la mano revela lo de abajo (imagen no
                // espejada en Y ⇒ subir la mano da dy<0).
                if (dir > 0) { showScrollFeedback("down"); gestureScroll(1); }
                else { showScrollFeedback("up"); gestureScroll(-1); }
                return;
            }
        }
    }

    // Fin de la sesión de pellizco (al abrir/bajar la mano): re-arma para el próximo,
    // que podrá ir en cualquier sentido.
    function resetPinch() { pinchActive = false; pinchDir = 0; }

    // PELLIZCO 🤏 → zoom. Separar = +, juntar = −. La apertura se normaliza por el
    // tamaño de la mano (igual de cerca que a distancia de tripié). La dirección se
    // LATCHEA con el primer movimiento claro y la referencia se re-ancla en cada
    // paso: así relajar los dedos nunca revierte el zoom recién hecho, y se puede
    // bombear (separar → juntar → separar) para encadenar pasos sin soltar.
    function handlePinchZoom(lm, now) {
        const handSize = dist(lm[0], lm[9]) || 0.0001;
        const ratio = dist(lm[4], lm[8]) / handSize;
        if (!pinchActive) { pinchActive = true; pinchRef = ratio; pinchDir = 0; return; }

        if (pinchDir === 0) {                          // fijar dirección con el 1er movimiento claro
            const d0 = ratio - pinchRef;
            // Aquí NO se arrastra pinchRef: si se hacía, la referencia perseguía a los
            // dedos mientras se juntaban y el delta negativo nunca acumulaba el paso
            // → el ZOOM − no disparaba jamás. El arrastre solo aplica ya latcheado.
            if (Math.abs(d0) < PINCH_STEP) return;
            pinchDir = d0 > 0 ? 1 : -1;
        }
        const signed = pinchDir * (ratio - pinchRef);  // avance en la dirección latcheada
        if (signed >= PINCH_STEP) {
            if (now - lastZoomTime >= ZOOM_COOLDOWN) {  // dispara un paso y re-ancla aquí
                lastZoomTime = now;
                if (pinchDir > 0) { if (window.__cantoralZoom && window.__cantoralZoom(1)) showZoomFeedback("in"); }
                else { if (window.__cantoralZoom && window.__cantoralZoom(-1)) showZoomFeedback("out"); }
                pinchRef = ratio;
            }
        } else if (signed < 0) {
            pinchRef = ratio;                          // retrocede: arrastra la referencia (bombeo), no revierte
        }
    }

    // Despachador: UNA pose = UNA acción (ver classifyPose). Al salir de una pose se
    // limpia su historial para que el trayecto de "volver la mano" no se acumule.
    function processHandLandmarks(landmarks) {
        const now = Date.now();
        const f = fingersUp(landmarks);
        const pose = classifyPose(landmarks, f);

        if (pose !== "palm") handHistory = [];
        if (pose !== "point") pointHistory = [];
        if (pose !== "pinch") resetPinch();

        switch (pose) {
            case "palm":                       // 🖐️ 4 dedos → cambiar de página
                handleNavSwipe(landmarks, now);
                break;
            case "point":                      // 👉 índice tumbado → scroll
                handlePointScroll(landmarks, now);
                break;
            case "pinch":                      // 🤏 pellizco → zoom
                handlePinchZoom(landmarks, now);
                break;
        }
    }

    function onHandResults(results) {
        const detected = !!(results && results.multiHandLandmarks && results.multiHandLandmarks.length > 0);
        // Feedback visual: el borde de la vista previa se pone verde cuando detecta una mano.
        const pc = document.getElementById("gesturePreview");
        if (pc) pc.classList.toggle("hand-detected", detected);
        if (detected) {
            processHandLandmarks(results.multiHandLandmarks[0]);
        } else {
            // Sin mano en cuadro (mano baja): soltar todas las sesiones.
            handHistory = []; pointHistory = []; resetPinch();
        }
    }

    // ── Sampling rate de la IA ────────────────────────────────────────────────
    // El vídeo puede ir a 30-60 fps, pero NO hace falta pasar cada fotograma por el
    // modelo: antes se inferían ~30-60 veces por segundo (solo limitado por que no
    // se solaparan inferencias), y ahí se iba la mayor parte de la CPU/GPU (y el
    // calor). Analizar ~7 veces por segundo basta de sobra para estos gestos y
    // recorta drásticamente el consumo.
    // Por qué 140 ms y no 200: página y scroll son SWIPES y necesitan varias
    // muestras a lo largo del trayecto. Con la ventana de 900 ms (SWIPE_TIME_LIMIT)
    // quedan ~6 muestras, suficiente para medir dirección sin que el gesto se
    // sienta perezoso. A 200 ms bajaría a ~4 y los swipes rápidos se perderían.
    const DETECT_INTERVAL = 140;
    let lastDetectTs = 0;

    async function runDetectionLoop() {
        if (!gestureActive || !videoElement || processingFrame) return;
        const now = performance.now();
        if (videoElement.readyState >= 2 && (now - lastDetectTs) >= DETECT_INTERVAL) {
            lastDetectTs = now;
            processingFrame = true;
            try {
                if (handsInstance) {
                    await handsInstance.send({ image: videoElement });
                }
            } catch (err) {
                console.error("Error procesando frame:", err);
            }
            processingFrame = false;
        }
        if (gestureActive) {
            animationFrameId = requestAnimationFrame(runDetectionLoop);
        }
    }

    // Carga PEREZOSA de MediaPipe Hands: sólo se inyecta el script del CDN la
    // primera vez que se activan los gestos (antes se cargaba en cada arranque,
    // penalizando el inicio y fallando offline por ser recurso externo).
    let mediaPipePromise = null;
    function loadMediaPipe() {
        if (window.Hands) return Promise.resolve();
        if (mediaPipePromise) return mediaPipePromise;
        mediaPipePromise = new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
            s.crossOrigin = "anonymous";
            s.onload = () => resolve();
            s.onerror = () => { mediaPipePromise = null; reject(new Error("no se pudo cargar MediaPipe")); };
            document.head.appendChild(s);
        });
        return mediaPipePromise;
    }

    // Mensaje CORTO en español según el tipo de error de cámara (el navegador da
    // err.message largo y en inglés, que no cabe bien en el toast).
    function cameraErrorMessage(err) {
        switch (err && err.name) {
            case "NotAllowedError":
            case "SecurityError":        return "Permiso de cámara denegado 🚫";
            case "NotFoundError":
            case "DevicesNotFoundError": return "No se encontró ninguna cámara 📷";
            case "NotReadableError":
            case "TrackStartError":      return "La cámara está en uso por otra app 📷";
            case "OverconstrainedError": return "La cámara no cumple los requisitos 📷";
            default:                     return "No se pudo abrir la cámara 📷";
        }
    }

    async function turnOnGestures() {
        // iOS/Safari: la cámara SOLO está disponible en contexto seguro (https:// o localhost).
        // Por http:// o file:// navigator.mediaDevices es undefined y nada funciona.
        if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast("La cámara necesita HTTPS 🔒");
            gestureBtn.classList.remove("active");
            gestureActive = false;
            return;
        }

        // Cargar MediaPipe bajo demanda (requiere internet la primera vez).
        try {
            await loadMediaPipe();
        } catch (e) {
            showToast("Sin internet para cargar el detector 📶");
            gestureBtn.classList.remove("active");
            gestureActive = false;
            return;
        }
        if (!window.Hands) {
            showToast("Sin internet para cargar el detector 📶");
            gestureBtn.classList.remove("active");
            gestureActive = false;
            return;
        }

        try {
            // Calidad mínima de cámara y framerate limitado para evitar sobrecalentamiento del dispositivo
            videoStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user", // Cámara frontal (selfie). Sin esto iOS puede abrir la trasera y nunca "ve" tu mano.
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                    frameRate: { ideal: 10, max: 15 }
                }
            });
        } catch (err) {
            console.error("Error al acceder a la cámara:", err);
            showToast(cameraErrorMessage(err));
            gestureBtn.classList.remove("active");
            gestureActive = false;
            return;
        }

        if (!handsInstance) {
            try {
                handsInstance = new Hands({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
                });
                handsInstance.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 0, // Modelo ultra-ligero para evitar calentamiento de dispositivos
                    minDetectionConfidence: 0.55,
                    minTrackingConfidence: 0.55
                });
                handsInstance.onResults(onHandResults);
            } catch (err) {
                console.error("Error al instanciar MediaPipe Hands:", err);
                showToast("No se pudo iniciar el detector 📷");
                turnOffGestures();
                return;
            }
        }

        // Crear contenedor de vista previa en el DOM (iOS Safari requiere que esté en el DOM para actualizar frames)
        let previewContainer = document.getElementById("gesturePreview");
        if (!previewContainer) {
            previewContainer = document.createElement("div");
            previewContainer.id = "gesturePreview";
            previewContainer.className = "gesture-preview-container";
            document.body.appendChild(previewContainer);
        } else {
            previewContainer.innerHTML = "";
        }

        videoElement = document.createElement("video");
        videoElement.className = "gesture-hidden-video";
        videoElement.setAttribute("autoplay", "");
        videoElement.setAttribute("playsinline", "");
        videoElement.setAttribute("webkit-playsinline", "");
        videoElement.setAttribute("muted", "");
        videoElement.playsInline = true;
        videoElement.webkitPlaysInline = true;
        videoElement.muted = true;
        videoElement.srcObject = videoStream;
        previewContainer.appendChild(videoElement);

        try {
            await videoElement.play();
            previewContainer.classList.add("show");
            gestureActive = true;
            gestureBtn.classList.add("active");
            // Sacrificar TODO lo ambiental para dedicar recursos a la detección:
            // la clase pausa las animaciones @keyframes (CSS) y aquí detenemos los
            // bucles JS (starfield; las luciérnagas se paran solas por su condición).
            document.body.classList.add("gestures-on");
            if (window.__starfield) window.__starfield.update(false);
            showToast("Control gestual activo ✋. Pasa tu mano.");
            lastDetectTs = 0;          // primera inferencia sin esperar el intervalo
            runDetectionLoop();
        } catch (err) {
            console.error("Error al reproducir video:", err);
            showToast("No se pudo iniciar la cámara 📷");
            turnOffGestures();
        }
    }

    function turnOffGestures(silent) {
        gestureActive = false;
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
        }

        if (videoElement) {
            videoElement.pause();
            videoElement.srcObject = null;
            videoElement.remove();
            videoElement = null;
        }

        const previewContainer = document.getElementById("gesturePreview");
        if (previewContainer) {
            previewContainer.classList.remove("show");
            setTimeout(() => {
                if (!gestureActive && previewContainer) {
                    previewContainer.remove();
                }
            }, 300);
        }

        gestureBtn.classList.remove("active");
        // Reanudar lo ambiental: quitar la clase reactiva las animaciones CSS y,
        // por el ffObserver, reinicia las luciérnagas si toca; el starfield se
        // restaura según el tema actual.
        document.body.classList.remove("gestures-on");
        if (window.__starfield) window.__starfield.update(document.body.classList.contains("dark-mode"));
        handHistory = [];
        processingFrame = false;
        if (!silent) showToast("Cámara apagada y recursos liberados 🚫");
    }

    function showGestureStep(n) {
        if (gmStep1) gmStep1.hidden = (n !== 1);
        if (gmStep2) gmStep2.hidden = (n !== 2);
    }
    function openGestureModal() {
        showGestureStep(1);            // siempre abre en el aviso
        gestureModal.classList.add("show");
        gestureModal.setAttribute("aria-hidden", "false");
    }
    function closeGestureModal() {
        gestureModal.classList.remove("show");
        gestureModal.setAttribute("aria-hidden", "true");
    }

    if (gestureBtn) {
        // Gestos DESHABILITADOS en esta versión: la perla queda visible pero SIN acción
        // (no abre cámara ni el modal); solo muestra un aviso pequeño.
        gestureBtn.addEventListener("click", () => {
            showToast("Gestos próximamente ✋", { key: "gestos", duration: 1600 });
        });
    }
    // Paso 1 → guía de gestos
    if (gestureNextBtn) gestureNextBtn.addEventListener("click", () => showGestureStep(2));
    // Guía → volver al aviso
    if (gestureBackBtn) gestureBackBtn.addEventListener("click", () => showGestureStep(1));
    // Guía → activar cámara
    if (gestureStartBtn) gestureStartBtn.addEventListener("click", () => {
        closeGestureModal();
        turnOnGestures();
    });
    // Cancelar (paso 1)
    if (gestureCancelBtn) gestureCancelBtn.addEventListener("click", closeGestureModal);

    // Segundo plano (cambiar de app / bloquear el teléfono / minimizar): APAGAR la
    // cámara. La clase 'gestures-on' pausa las animaciones pero NO apaga la cámara,
    // que seguiría encendida (luz verde) gastando batería y sin privacidad. Aquí
    // llamamos turnOffGestures() (silencioso) que para los tracks + libera recursos
    // limpio. NO auto-reanudamos: track.stop() es IRREVERSIBLE (re-encender exige un
    // getUserMedia nuevo), así que el usuario re-toca ✋ al volver. Avisamos al
    // REGRESAR (un toast durante el ocultado no se vería).
    let gesturesAutoOff = false;
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            if (gestureActive) { gesturesAutoOff = true; turnOffGestures(true); }
        } else if (gesturesAutoOff) {
            gesturesAutoOff = false;
            showToast("Cámara apagada al salir 🚫. Toca ✋ para reactivar.");
        }
    });

})();

// ═══════════════════════════════════════════════════════════════════
// BLOQUEO DE ORIENTACIÓN HORIZONTAL + GATE DE ESCRITORIO
// Módulo independiente: no modifica ninguna variable del IIFE principal.
// ═══════════════════════════════════════════════════════════════════
(function setupScreenGates() {
    function isMobileDevice() {
        var shortSide = Math.min(window.innerWidth, window.innerHeight);
        var touch = (navigator.maxTouchPoints || 0) > 0
            || window.matchMedia("(any-pointer: coarse)").matches;
        return shortSide <= 900 || touch;
    }

    // Los targets #orientationStage/#desktopGateStage se pueblan por
    // setupPlumeriaScene (más abajo) — misma escena completa que #pPlumeria.

    // ── Control de orientación ──
    var orientOverlay = document.getElementById("orientationOverlay");

    function checkOrientation() {
        if (!orientOverlay) return;
        var mobile = isMobileDevice();
        var landscape = window.innerWidth > window.innerHeight;
        if (mobile && landscape) {
            orientOverlay.classList.add("show");
            orientOverlay.setAttribute("aria-hidden", "false");
        } else {
            orientOverlay.classList.remove("show");
            orientOverlay.setAttribute("aria-hidden", "true");
        }
    }

    // ── Gate de escritorio (bloqueo permanente en pantallas grandes) ──
    var desktopGate = document.getElementById("desktopGate");

    function checkDesktopGate() {
        if (!desktopGate) return;
        var mobile = isMobileDevice();
        if (!mobile) {
            desktopGate.classList.add("show");
            desktopGate.setAttribute("aria-hidden", "false");
        } else {
            desktopGate.classList.remove("show");
            desktopGate.setAttribute("aria-hidden", "true");
        }
    }

    // ── Verificar al cargar y al cambiar tamaño/orientación ──
    function checkAll() {
        checkOrientation();
        checkDesktopGate();
    }

    checkAll();
    window.addEventListener("resize", checkAll);
    window.addEventListener("orientationchange", function () { setTimeout(checkAll, 120); });
})();

// ═══════════════════════════════════════════════════════════════════
// Escala de fuente para el contenido de los cantos (A- / A+)
// La escala afecta solo a .song-page vía var(--font-scale). El overflow
// de .page-content-wrap está en hidden para que el texto no se salga del
// papel al aumentar el tamaño.
// ═══════════════════════════════════════════════════════════════════
(function initFontScale() {
    const STORAGE_KEY = "cantoral-font-scale";
    const MIN = 0.90;
    const MAX = 1.35;   // +2 escalas (antes 1.25): con acordes anclados ya no hay desborde
    const STEP = 0.05;
    const EPS  = 0.001;

    const widget  = document.getElementById("fontControls");   // panel deslizante (overlay global)
    const svg     = document.getElementById("zoomSlider");
    const btnDown = document.getElementById("fontDown");
    const btnUp   = document.getElementById("fontUp");
    const hit     = document.getElementById("fontTrack");   // línea táctil ancha
    const thumb   = document.getElementById("fontThumb");
    const fill    = document.getElementById("fontFill");    // línea de progreso
    // El botón "Aa" (.zoom-toggle) se renderiza dentro del pie de cada canto,
    // así que hay uno por página y se gestiona por delegación.
    if (!widget || !svg || !btnDown || !btnUp || !hit || !thumb || !fill) return;

    // Geometría del track en unidades del viewBox (0 0 220 40)
    const TRACK_X0 = 45, TRACK_X1 = 175, TRACK_W = TRACK_X1 - TRACK_X0;

    function readStored() {
        const raw = localStorage.getItem(STORAGE_KEY);
        const val = parseFloat(raw);
        if (!isFinite(val)) return 1;
        return Math.min(MAX, Math.max(MIN, val));
    }

    let scale = readStored();

    function pct() { return (scale - MIN) / (MAX - MIN); }

    function updateUI() {
        const x = (TRACK_X0 + pct() * TRACK_W).toFixed(2);
        thumb.setAttribute("cx", x);
        fill.setAttribute("x2", x);
        btnDown.classList.toggle("zs-disabled", scale <= MIN + EPS);
        btnUp.classList.toggle("zs-disabled", scale >= MAX - EPS);
    }

    let initialized = false;

    function apply() {
        document.documentElement.style.setProperty("--font-scale", scale.toFixed(2));
        updateUI();
        try { localStorage.setItem(STORAGE_KEY, scale.toFixed(2)); } catch (e) {}
        if (initialized) {
            document.querySelectorAll(".page-content-wrap").forEach(el => {
                el.style.transform = "none";
            });
        }
        initialized = true;
    }

    // Un paso de zoom para el control por gestos (pinch). dir: +1 aumenta, -1 reduce.
    // Devuelve true si hubo cambio (para dar feedback solo cuando aplica).
    window.__cantoralZoom = function (dir) {
        const prev = scale;
        scale = Math.min(MAX, Math.max(MIN, +(scale + dir * STEP).toFixed(2)));
        if (Math.abs(scale - prev) < EPS) return false;
        apply();
        return true;
    };

    // clientX -> escala, usando la matriz de pantalla del SVG (robusto ante
    // cualquier escalado/letterboxing del viewBox).
    function scaleFromClientX(clientX) {
        const ctm = svg.getScreenCTM();
        if (!ctm) return scale;
        const pt = svg.createSVGPoint();
        pt.x = clientX; pt.y = 20;
        const p = pt.matrixTransform(ctm.inverse());
        const ratio = Math.max(0, Math.min(1, (p.x - TRACK_X0) / TRACK_W));
        const raw = MIN + ratio * (MAX - MIN);
        return Math.min(MAX, Math.max(MIN, Math.round(raw / STEP) * STEP));
    }

    // ── Apertura / colapso del slider ──
    // Permanece ABIERTO hasta que el usuario toque FUERA (o el botón "Aa" de
    // nuevo). Antes se auto-colapsaba a los 2.5s de inactividad (IDLE_MS); ese
    // comportamiento se quitó a pedido del usuario, mismo criterio que la caja
    // de búsqueda.
    let dragging = false;

    function isOpen()    { return widget.classList.contains("open"); }

    function setToggleAria(expanded) {
        document.querySelectorAll(".zoom-toggle").forEach(t =>
            t.setAttribute("aria-expanded", expanded ? "true" : "false"));
        const oa = document.getElementById("overlayAA");
        if (oa) oa.setAttribute("aria-expanded", expanded ? "true" : "false");
    }

    function open() {
        if (isOpen()) return;
        widget.classList.add("open");
        document.body.classList.add("font-slider-open");   // bloquea cambio de página
        setToggleAria(true);
    }

    function close() {
        dragging = false;
        widget.classList.remove("dragging");
        if (!isOpen()) return;
        widget.classList.remove("open");
        document.body.classList.remove("font-slider-open");
        setToggleAria(false);
    }

    // Expuesto para que updateFontControlsVisibility lo cierre al salir del canto.
    window.__closeFontSlider = close;

    // "aA" ÚNICA del overlay: es el botón origen. Abre estando cerrado y colapsa
    // todo (desde ella) estando abierto.
    const overlayAA = document.getElementById("overlayAA");
    if (overlayAA) {
        overlayAA.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isOpen()) close(); else open();
        });
    }

    // Los botones "Aa" viven en el pie de cada canto: delegación en document.
    document.addEventListener("click", (e) => {
        const t = e.target.closest && e.target.closest(".zoom-toggle");
        if (!t) return;
        e.preventDefault();
        e.stopPropagation();
        if (isOpen()) close(); else open();
    });

    // Botones − / +
    btnDown.addEventListener("click", (e) => {
        e.stopPropagation();
        if (scale > MIN + EPS) {
            scale = Math.max(MIN, Math.round((scale - STEP) * 100) / 100);
            apply();
        }
    });
    btnUp.addEventListener("click", (e) => {
        e.stopPropagation();
        if (scale < MAX - EPS) {
            scale = Math.min(MAX, Math.round((scale + STEP) * 100) / 100);
            apply();
        }
    });

    // ── Arrastre (track + bolita) ──
    function beginDrag(clientX) {
        dragging = true;
        widget.classList.add("dragging");
        scale = scaleFromClientX(clientX);
        apply();
    }

    // Touch
    function onTrackTouchStart(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.touches.length) beginDrag(e.touches[0].clientX);
    }
    hit.addEventListener("touchstart", onTrackTouchStart, { passive: false });
    thumb.addEventListener("touchstart", onTrackTouchStart, { passive: false });

    document.addEventListener("touchmove", (e) => {
        if (!dragging) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.touches.length) { scale = scaleFromClientX(e.touches[0].clientX); apply(); }
    }, { passive: false });

    function endTouchDrag() {
        if (!dragging) return;
        dragging = false;
        widget.classList.remove("dragging");
    }
    document.addEventListener("touchend", endTouchDrag);
    document.addEventListener("touchcancel", endTouchDrag);

    // Ratón
    function onTrackMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        beginDrag(e.clientX);
    }
    hit.addEventListener("mousedown", onTrackMouseDown);
    thumb.addEventListener("mousedown", onTrackMouseDown);

    document.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        scale = scaleFromClientX(e.clientX);
        apply();
    });
    document.addEventListener("mouseup", () => {
        if (!dragging) return;
        dragging = false;
        widget.classList.remove("dragging");
    });

    // El panel (widget) y los botones "Aa" del pie cuentan como "dentro".
    function insideWidget(el) {
        return widget.contains(el) || (el.closest && el.closest(".zoom-toggle"));
    }

    // Evita que el touch dentro del widget escale a swipe/scroll de página.
    widget.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: false });
    // El widget CORTA la propagación del touchmove; por eso el arrastre del slider
    // debe resolverse AQUÍ. Si dependiera solo del handler en document, ese
    // stopPropagation lo mataría y el zoom "avanzaría una escala y se detendría".
    widget.addEventListener("touchmove", (e) => {
        e.stopPropagation();
        if (dragging && e.touches.length) {
            e.preventDefault();
            scale = scaleFromClientX(e.touches[0].clientX);
            apply();
        }
    }, { passive: false });

    // Estando abierto: tocar FUERA lo colapsa (tocar dentro no hace nada especial,
    // ya no hay temporizador que reiniciar). Se anula el gesto (preventDefault)
    // para que ese mismo toque no dispare el clic sintético de una flecha de
    // navegación. Se registra DESPUÉS de setupSwipe, cuya guardia ya descarta el
    // swipe cuando .font-slider-open está presente.
    document.addEventListener("touchstart", (e) => {
        if (!isOpen()) return;
        if (insideWidget(e.target)) return;
        e.preventDefault();
        close();
    }, { passive: false });

    // Desktop: captura el clic exterior para tragárselo (no dispara el control
    // que haya debajo, p. ej. las flechas de navegación) y colapsar.
    document.addEventListener("click", (e) => {
        if (!isOpen()) return;
        if (insideWidget(e.target)) return;
        e.stopPropagation();
        close();
    }, true);

    apply();
})();

// ═══════════════════════════════════════════════════════════════════
// Control radial de estilo: brazos negrita / cursiva / subrayado
// alrededor del botón "Aa" (el zoom es el brazo superior). Cada botón
// alterna una clase persistente en <body> y se refleja en localStorage.
// ═══════════════════════════════════════════════════════════════════
(function initTextStyles() {
    const TOGGLES = [
        { id: "styleBold",   cls: "song-bold",   key: "cantoral-style-bold" },
        { id: "styleItalic", cls: "song-italic", key: "cantoral-style-italic" },
    ];

    TOGGLES.forEach(t => {
        const btn = document.getElementById(t.id);
        if (!btn) return;

        // Estado inicial desde localStorage.
        let on = false;
        try { on = localStorage.getItem(t.key) === "1"; } catch (e) {}
        document.body.classList.toggle(t.cls, on);
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            on = !document.body.classList.contains(t.cls);
            document.body.classList.toggle(t.cls, on);
            btn.classList.toggle("is-active", on);
            btn.setAttribute("aria-pressed", on ? "true" : "false");
            try { localStorage.setItem(t.key, on ? "1" : "0"); } catch (err) {}
        });
    });
})();

// ═══════════════════════════════════════════════════════════════════
// Toggle del subrayado de TÍTULOS: al tocar el NÚMERO del canto (.song-num,
// en cualquier página) se alterna el subrayado de todos los títulos del libro.
// Estado persistente en localStorage; por defecto los títulos van subrayados.
// ═══════════════════════════════════════════════════════════════════
(function initTitleUnderlineToggle() {
    const KEY = "cantoral-title-underline";
    // El estado inicial ya se aplicó antes de render; aquí solo el listener.
    document.addEventListener("click", (e) => {
        const num = e.target.closest && e.target.closest(".song-num");
        if (!num) return;
        e.preventDefault();
        e.stopPropagation();
        const noUnderline = !document.body.classList.contains("titles-no-underline");
        document.body.classList.toggle("titles-no-underline", noUnderline);
        try { localStorage.setItem(KEY, noUnderline ? "0" : "1"); } catch (err) {}
    }, true);
})();

// ═══════════════════════════════════════════════════════════════════
// Scroll manual con touch para .page-content-wrap
// El transform-style: preserve-3d de .paper rompe el touch scroll nativo
// en varios móviles (iOS Safari y algunos Android). Implementamos scroll
// manual capturando touch events y ajustando scrollTop directamente.
// ═══════════════════════════════════════════════════════════════════
(function initManualScroll() {
    let target = null;      // contenedor que SÍ desborda (o null si el canto cabe)
    let hasWrap = false;    // el toque está sobre una página de CONTENIDO (canto/dicc/índice)
    let inBook = false;     // el gesto empezó dentro del libro (.paper)
    let startX = 0, startY = 0, startScroll = 0;
    let axis = null;        // 'v' | 'h' — se decide en el primer movimiento

    document.addEventListener("touchstart", (e) => {
        target = null; hasWrap = false; inBook = false; axis = null;
        if (e.touches.length !== 1) return;
        // Solo dentro del libro; fuera (menú, búsqueda, modales) no tocamos nada.
        if (!(e.target.closest && e.target.closest(".paper"))) return;
        inBook = true;
        const wrap = e.target.closest(".page-content-wrap, .dict-content, .index-content, .search-results");
        hasWrap = !!wrap;                 // páginas de texto tienen contenedor; la plumeria NO
        if (wrap && wrap.scrollHeight > wrap.clientHeight) {
            target = wrap;
            startScroll = wrap.scrollTop;
        }
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
        if (!inBook || e.touches.length !== 1) return;
        // Páginas SIN contenedor de texto (plumeria/portada): NO interceptamos —
        // así los toques (con leve desliz) conservan su click. Clave para el easter
        // egg (luna/tronco) y para no cancelar taps en blancos pequeños.
        if (!hasWrap) return;
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if (!axis) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;   // aún sin dirección
            axis = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
        }
        if (axis === "h") return;            // horizontal → lo maneja el swipe de página
        if (Math.abs(dy) < 8) return;        // tap con micro-desliz: no cancelar el click
        // Vertical real en página de texto: CANCELAR el pan nativo del documento (en
        // iOS el overflow:hidden del body no basta y arrastraba el libro entero, aun
        // cuando el canto no desborda). Si hay scroll, lo movemos.
        e.preventDefault();
        if (target) target.scrollTop = startScroll - dy;
    }, { passive: false });

    const clear = () => { target = null; hasWrap = false; inBook = false; axis = null; };
    document.addEventListener("touchend", clear, { passive: true });
    document.addEventListener("touchcancel", clear, { passive: true });
})();

// ═══════════════════════════════════════════════════════════════════
// Scroll con la RUEDA del mouse. El contenedor del canto (.page-content-wrap)
// vive dentro de un contexto transform-style: preserve-3d, que en varios
// equipos/versiones de Chrome rompe el scroll nativo por rueda: el teclado
// (flechas, tras dar clic) y el táctil manual sí mueven el texto, pero la
// rueda no hace nada. Se maneja la rueda a mano sobre el canto/índice/dicc.
// visible, igual que initManualScroll hace con el táctil.
// ═══════════════════════════════════════════════════════════════════
(function initWheelScroll() {
    document.addEventListener("wheel", (e) => {
        if (e.ctrlKey) return;                         // Ctrl+rueda = zoom, se maneja aparte
        if (!e.target.closest || !e.target.closest(".paper")) return;  // solo dentro de la página
        // Contenedor bajo el cursor; si el hit-test 3D falla o no desborda,
        // caer al contenedor de la página actual.
        let wrap = e.target.closest(".page-content-wrap, .dict-content, .index-content");
        if (!wrap || wrap.scrollHeight <= wrap.clientHeight) {
            const paper = papers[currentLocation - 1];
            wrap = paper && paper.querySelector(".page-content-wrap, .dict-content, .index-content");
        }
        if (!wrap || wrap.scrollHeight <= wrap.clientHeight) return;   // nada que scrollear
        // deltaMode: 0=pixeles, 1=lineas, 2=paginas
        const factor = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? wrap.clientHeight : 1);
        wrap.scrollTop += e.deltaY * factor;
        e.preventDefault();
    }, { passive: false });
})();

// ═══════════════════════════════════════════════════════════════════
// Desactivar zoom por gestos (pinch, doble-tap, Ctrl+rueda)
// El meta viewport (maximum-scale=1, user-scalable=no) bloquea el zoom
// en Chrome/Firefox, pero iOS Safari lo ignora — hay que interceptar
// los eventos "clicgesture*" y multi-touch para bloquearlo ahí también.
// Se mantiene intacto el swipe de un solo dedo para pasar página.
// ═══════════════════════════════════════════════════════════════════
(function disablePinchZoom() {
    // iOS Safari: eventos no estándar de gesto (pinch)
    ["gesturestart", "gesturechange", "gestureend"].forEach(name => {
        document.addEventListener(name, e => e.preventDefault(), { passive: false });
    });

    // Multi-touch: cancelar solo cuando hay 2+ dedos; el swipe de un dedo queda intacto
    document.addEventListener("touchmove", e => {
        if (e.touches && e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    // Desktop: Ctrl+rueda del mouse (o pinch en trackpad, que se emite como Ctrl+wheel)
    document.addEventListener("wheel", e => {
        if (e.ctrlKey) e.preventDefault();
    }, { passive: false });

    // Doble-tap zoom en iOS: detectar dos taps rapidos y cancelar el segundo
    let lastTap = 0;
    document.addEventListener("touchend", e => {
        const now = Date.now();
        if (now - lastTap < 300 && e.touches.length === 0) {
            e.preventDefault();
        }
        lastTap = now;
    }, { passive: false });
})();

// ── Selector de fuente para cantos ──



(function initFontPicker() {
    const STORAGE_KEY = "cantoral-font";
    // Con los acordes ANCLADOS a la sílaba, el picker puede ofrecer fuentes
    // PROPORCIONALES sin desalinear. Se mezclan monoespaciadas y proporcionales
    // (serif, sans, manuscrita). Georgia/Sans son de sistema (sin red).
    const FONTS = [
        { label: "Orig.", name: "Courier New", family: '"Courier New", Courier, monospace' },
        { label: "Patrick", name: "Patrick Hand", family: '"Patrick Hand", "Segoe Script", cursive' },
        { label: "Indie", name: "Indie Flower", family: '"Indie Flower", cursive' },
        { label: "Architect", name: "Architects Daughter", family: '"Architects Daughter", cursive' },
        { label: "A", name: "Roboto Mono", family: '"Roboto Mono", monospace' },
        { label: "B", name: "Space Mono", family: '"Space Mono", monospace' },
        { label: "C", name: "Courier Prime", family: '"Courier Prime", monospace' },
        { label: "D", name: "Ubuntu Mono", family: '"Ubuntu Mono", monospace' },
        { label: "E", name: "PT Mono", family: '"PT Mono", monospace' },
        { label: "Serif", name: "Georgia", family: 'Georgia, "Times New Roman", serif' },
        { label: "Sans", name: "System Sans", family: '"Segoe UI", Roboto, Arial, sans-serif' },
        { label: "Merri", name: "Merriweather", family: '"Merriweather", Georgia, serif' },
        { label: "Lora", name: "Lora", family: '"Lora", Georgia, serif' },
        { label: "Lato", name: "Lato", family: '"Lato", "Segoe UI", sans-serif' },
        { label: "Mano", name: "Caveat", family: '"Caveat", "Segoe Script", cursive' },
        // ── Más variedad (2026-07-14): proporcionales serif/sans + manuscritas ──
        { label: "Garamond", name: "EB Garamond", family: '"EB Garamond", Georgia, serif' },
        { label: "PT Serif", name: "PT Serif", family: '"PT Serif", Georgia, serif' },
        { label: "Bitter", name: "Bitter", family: '"Bitter", Georgia, serif' },
        { label: "Domine", name: "Domine", family: '"Domine", Georgia, serif' },
        { label: "Playfair", name: "Playfair Display", family: '"Playfair Display", Georgia, serif' },
        { label: "Zilla", name: "Zilla Slab", family: '"Zilla Slab", Georgia, serif' },
        { label: "Crimson", name: "Crimson Text", family: '"Crimson Text", Georgia, serif' },
        { label: "Nunito", name: "Nunito", family: '"Nunito", "Segoe UI", sans-serif' },
        { label: "Poppins", name: "Poppins", family: '"Poppins", "Segoe UI", sans-serif' },
        { label: "Work", name: "Work Sans", family: '"Work Sans", "Segoe UI", sans-serif' },
        { label: "Quick", name: "Quicksand", family: '"Quicksand", "Segoe UI", sans-serif' },
        { label: "Josefin", name: "Josefin Sans", family: '"Josefin Sans", "Segoe UI", sans-serif' },
        { label: "Rubik", name: "Rubik", family: '"Rubik", "Segoe UI", sans-serif' },
        { label: "Shadows", name: "Shadows Into Light", family: '"Shadows Into Light", cursive' },
        { label: "Kalam", name: "Kalam", family: '"Kalam", cursive' },
        { label: "Dancing", name: "Dancing Script", family: '"Dancing Script", cursive' },
        { label: "Amatic", name: "Amatic SC", family: '"Amatic SC", cursive' },
    ];

    const picker = document.getElementById("fontPicker");
    const btn = document.getElementById("fontPickerBtn");
    if (!picker || !btn) return;

    // ── Carga DIFERIDA de Google Fonts ──────────────────────────────────
    // La fuente por defecto (Courier New) y "Serif"/"Sans" son de SISTEMA, así que
    // al arrancar no se pide nada a Google (arranque más rápido). La hoja con todas
    // las familias se inyecta sólo al abrir el selector, o al arrancar si había una
    // fuente Google guardada. display=swap => el texto se ve con la de sistema y
    // "salta" a la elegida al terminar de bajar.
    const SYSTEM_FONTS = new Set(["Courier New", "Georgia", "System Sans"]);
    const GF_URL = "https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Architects+Daughter&family=Bitter:ital,wght@0,400;0,700;1,400&family=Caveat:wght@400;700&family=Courier+Prime:wght@400;700&family=Crimson+Text:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@400;700&family=Domine:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Indie+Flower&family=Josefin+Sans:ital,wght@0,400;0,700;1,400&family=Kalam:wght@400;700&family=Lato:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Nunito:ital,wght@0,400;0,700;1,400&family=PT+Mono&family=PT+Serif:ital,wght@0,400;0,700;1,400&family=Patrick+Hand&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poppins:ital,wght@0,400;0,700;1,400&family=Quicksand:wght@400;700&family=Roboto+Mono:wght@400;700&family=Rubik:ital,wght@0,400;0,700;1,400&family=Shadows+Into+Light&family=Space+Mono:wght@400;700&family=Ubuntu+Mono:wght@400;700&family=Work+Sans:ital,wght@0,400;0,700;1,400&family=Zilla+Slab:ital,wght@0,400;0,700;1,400&display=swap";
    let gfInjected = false;
    function ensureGoogleFonts() {
        if (gfInjected) return;
        gfInjected = true;
        const l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = GF_URL;
        document.head.appendChild(l);
    }

    let current = 0;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
        const idx = FONTS.findIndex(f => f.name === saved);
        if (idx >= 0) current = idx;
        // Si la fuente guardada es de Google, cargarla ya para que se aplique bien.
        if (!SYSTEM_FONTS.has(saved)) ensureGoogleFonts();
    }

    // Fuentes manuscritas/decorativas: los NOMBRES de acorde caen a un mono limpio
    // (legibilidad); las demás (serif/sans/mono) sí se aplican también a los acordes.
    const HAND_FONTS = new Set([
        "Caveat", "Patrick Hand", "Shadows Into Light", "Kalam",
        "Dancing Script", "Amatic SC", "Indie Flower", "Architects Daughter",
    ]);
    const CHORD_FALLBACK = '"Roboto Mono", "Courier New", monospace';

    function applyFont(idx) {
        current = idx;
        const f = FONTS[idx];
        const root = document.documentElement.style;
        root.setProperty("--song-font", f.family);
        // Título y letra usan --song-font; los acordes usan --chord-font, que sigue
        // la fuente elegida salvo si es manuscrita (ahí cae al mono legible).
        root.setProperty("--chord-font", HAND_FONTS.has(f.name) ? CHORD_FALLBACK : f.family);
        localStorage.setItem(STORAGE_KEY, f.name);
        picker.querySelectorAll(".font-picker-option").forEach((o, i) => {
            o.classList.toggle("active", i === idx);
        });
    }

    // ── Apertura / colapso del selector ──
    // Permanece ABIERTO hasta que el usuario toque FUERA (o el botón "F" de
    // nuevo). Antes se auto-colapsaba a los 2.5s de inactividad; se quitó a
    // pedido del usuario, mismo criterio que la caja de búsqueda y el slider
    // de tamaño de letra.
    function isOpen()    { return !picker.classList.contains("hidden"); }

    // Centra el picker justo debajo del botón "F" (antes quedaba bajo el botón
    // de menú, pegado al borde derecho de la pantalla).
    function positionPicker() {
        const tc = document.getElementById("topControls");
        if (!tc) return;
        const tcr = tc.getBoundingClientRect();
        const br = btn.getBoundingClientRect();
        const pw = picker.offsetWidth;                 // el picker está en layout aunque esté hidden
        const btnCenter = br.left + br.width / 2;
        let rightPx = tcr.right - (btnCenter + pw / 2);
        rightPx = Math.max(4, Math.round(rightPx));    // sin desbordar el borde derecho
        picker.style.right = rightPx + "px";
    }

    function openPicker() {
        ensureGoogleFonts();   // al abrir el selector, traer las familias para las vistas previas
        positionPicker();
        picker.classList.remove("hidden");
        btn.classList.add("fp-open");      // marca la cuenta "F" como accionada (color litúrgico)
        btn.setAttribute("aria-expanded", "true");
    }

    function closePicker() {
        picker.classList.add("hidden");
        btn.classList.remove("fp-open");
        btn.setAttribute("aria-expanded", "false");
    }

    FONTS.forEach((f, i) => {
        const opt = document.createElement("button");
        opt.type = "button";
        opt.className = "font-picker-option" + (i === current ? " active" : "");
        // Vista previa: la palabra "MAYO" escrita con la fuente de esa opción.
        opt.textContent = "MAYO";
        opt.title = f.label;
        opt.setAttribute("aria-label", "Fuente " + f.label);
        opt.style.fontFamily = f.family;
        opt.addEventListener("click", () => {
            applyFont(i);
            closePicker();
        });
        picker.appendChild(opt);
    });

    applyFont(current);

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isOpen()) closePicker(); else openPicker();
    });

    // Reposicionar si cambia el tamaño/orientación mientras está abierto.
    window.addEventListener("resize", () => { if (isOpen()) positionPicker(); });

    function isOutside(target) { return !picker.contains(target) && target !== btn; }

    document.addEventListener("click", (e) => {
        if (isOpen() && isOutside(e.target)) closePicker();
    });
    // Móvil: touchstart además de click, mismo criterio que los otros widgets
    // colapsables (más fiable que depender solo del click sintético).
    document.addEventListener("touchstart", (e) => {
        if (isOpen() && isOutside(e.target)) closePicker();
    }, { passive: true });
})();

(function initEasterEgg() {
    const EGG_B64 = "RWwgY29yYXrDs24gZGUgbWF5bwoKU2kgaGFzIGRlc2N1YmllcnRvIGVzdGUgcmluY8OzbiwgcXVpZXJvIGNvbXBhcnRpciBjb250aWdvIGxhIHZlcmRhZGVyYSBlc2VuY2lhIGRlIGVzdGEgb2JyYS4gClRvZG8gZXN0ZSBlc2Z1ZXJ6byBlc3TDoSBkZWRpY2FkbyBhbCBCdWVuIERpb3MgeSBhIGxhIFNhbnTDrXNpbWEgVmlyZ2VuIE1hcsOtYSwgTWFkcmUgZGUgRGlvcyB5IG1hZHJlIG51ZXN0cmEuCgoiRGlzZcOxYXIgcGFyYSBlbCBTZcOxb3IgZXMgZW50cmVnYXIgZWwgYWxtYSBlbiBjYWRhIHRyYXpvIHkgZGV0YWxsZSwKdHJhbnNmb3JtYW5kbyBlbCB0cmFiYWpvIGVuIHVuIGFjdG8gZ2VudWlubyBkZSBhbW9yIHkgYWRvcmFjacOzbi4iCgpBZ3JhZGV6Y28gaW5maW5pdGFtZW50ZSBhbCBTZcOxb3IgcG9yIGRhcm1lIGxhIGluc3BpcmFjacOzbiB5IGxhIHBlcnNldmVyYW5jaWEgcGFyYSBubyByZW5kaXJtZSBoYXN0YSB0ZXJtaW5hciBlc3RlIGhlcm1vc28gcHJveWVjdG8sCnkgcG9yIGxhIGlubWVuc2EgZ3JhY2lhIGRlIGRhcm1lIHVuYSBmYW1pbGlhIHF1ZSBtZSBxdWllcmUgeSBtZSBzb3N0aWVuZS4KCkRveSBncmFjaWFzIGVzcGVjaWFsZXMgYWwgQnVlbiBEaW9zIHBvciBsYSBiZW5kaWNpw7NuIGRlIHZvbHZlciBhIGNydXphciBtaSBjYW1pbm8gY29uIEFiaTsgZWxsYSBlcywgc2luIGR1ZGEsIHVuYSBiZW5kaWNpw7NuIGVuIG1pIHZpZGEuCkEgdGksIEFiaSwgdGUgZGVkaWNvIGVzdGUgZXNwYWNpbyBjb24gcHJvZnVuZGEgZ3JhdGl0dWQ6IGhhcyBzaWRvIHVuYSBncmFuIGluc3BpcmFjacOzbiBwYXJhIG3DrSBwb3IgbG8gbWFyYXZpbGxvc2EgcXVlIGVyZXMKeSBwb3IgdG9kbyBsbyBidWVubyBxdWUgaGFzIHRyYcOtZG8gYSBtaXMgZMOtYXMuIExhIHBhbGV0YSBkZSBjb2xvcmVzLCBsYSBsdW5hLCBsYXMgZXN0cmVsbGFzLCBsYXMgZmxvcmVzIHkgbG9zIGFuaW1hbGl0b3MKcXVlIGFkb3JuYW4gZXN0YXMgcMOhZ2luYXMgeWEgc2FiZXMgcXVlIG5vIHNvbiBjYXN1YWxpZGFkOyBzb24gcmVmbGVqbyBkZSBlc2EgaGVybW9zYSBjcmVhY2nDs24gZGUgRGlvcyBxdWUgdGFudG8gdGUgZ3VzdGEuCkdyYWNpYXMgcG9yIGhhYmVyIHBlZGlkbyAidW4gcG9jbyBkZSBjYWbDqSIgYSBtaSBtYW3DoS4gCgpGaW5hbG1lbnRlLCBlc3RlIGNhbnRvcmFsIGZ1ZSBzb8OxYWRvIHkgZGlzZcOxYWRvIHBhcmEgdXN0ZWRlcywgZWwgcHVlYmxvIGRlIERpb3MuIE1pIG1heW9yIGRlc2VvIGVzIHF1ZSBzdSB1c28gZsOhY2lsIGUgaW50dWl0aXZvCnNlYSB1bmEgaGVycmFtaWVudGEgcXVlIGF5dWRlIGEgYWxjYW56YXIgYSBtw6FzIHBlcnNvbmFzLCBwYXJhIHF1ZSBqdW50b3MgcG9kYW1vcyBnbG9yaWZpY2FyIGEgRGlvcyBtZWRpYW50ZSBlbCBjYW50by4=";
    const PHRASE = "y todo por un poco de cafe";
    const WINDOW_MS = 90000;

    const eggPage = document.getElementById("eggPage");
    const eggText = document.getElementById("eggText");
    const eggClose = document.getElementById("eggClose");
    const search = document.getElementById("searchInput");
    if (!eggPage) return;

    let step = 0;
    let timer = null;

    function reset() { step = 0; if (timer) { clearTimeout(timer); timer = null; } }
    function arm() { if (timer) clearTimeout(timer); timer = setTimeout(reset, WINDOW_MS); }
    function isDark() { return document.body.classList.contains("dark-mode"); }
    function decode(b) { try { return decodeURIComponent(escape(atob(b))); } catch (e) { return ""; } }
    function norm(s) {
        return (s || "").toLowerCase().normalize("NFD")
            .replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
    }

    // Renderiza el texto por PÁRRAFOS: la línea en blanco separa párrafos; los
    // saltos "suaves" dentro de un párrafo se colapsan a espacio para que el
    // texto fluya y justifique limpio (no cortado a media frase).
    function renderEgg(txt) {
        const blocks = txt.split(/\n{2,}/)
            .map((b) => b.replace(/\s*\n\s*/g, " ").trim())
            .filter(Boolean);
        eggText.innerHTML = "";
        blocks.forEach((b, i) => {
            const p = document.createElement("p");
            p.className = "egg-p";
            if (i === 0) p.classList.add("egg-title");                 // "El corazón de mayo"
            else if (/^["“«]/.test(b)) p.classList.add("egg-quote");   // cita
            p.textContent = b;
            eggText.appendChild(p);
        });
    }

    function reveal() {
        renderEgg(decode(EGG_B64));
        try { if (typeof closeSearch === "function") closeSearch(); } catch (e) {}
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        eggPage.classList.add("show");
        eggPage.setAttribute("aria-hidden", "false");
    }
    function hide() {
        eggPage.classList.remove("show");
        eggPage.setAttribute("aria-hidden", "true");
    }

    function eggZoneAt(x, y) {
        const pl = document.getElementById("pPlumeria");
        if (!pl) return null;
        const pr = pl.getBoundingClientRect();
        if (pr.width < 40 || pr.height < 40) return null;
        const inRect = (el) => {
            if (!el) return false;
            const r = el.getBoundingClientRect();
            return r.width > 8 && r.height > 8 &&
                   x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        };
        if (inRect(pl.querySelector(".egg-trunk-hit"))) return "trunk";
        if (inRect(pl.querySelector(".plumeria-moon"))) return "moon";
        return null;
    }
    function eggAdvance(zone) {
        if (zone === "trunk") { if (step === 0 || step === 1) { step++; arm(); } return; }
        if (zone === "moon")  { if (step === 2) { step = 3; arm(); } else reset(); return; }
    }
    let lastEggTouch = 0;
    document.addEventListener("touchend", (e) => {
        if (!isDark()) { if (step) reset(); return; }
        if (!e.changedTouches || e.changedTouches.length !== 1) return;
        const t = e.changedTouches[0];
        const zone = eggZoneAt(t.clientX, t.clientY);
        if (zone) { lastEggTouch = Date.now(); eggAdvance(zone); }
    }, { passive: true });
    document.addEventListener("click", (e) => {
        if (Date.now() - lastEggTouch < 600) return;
        if (!isDark()) { if (step) reset(); return; }
        const zone = eggZoneAt(e.clientX, e.clientY);
        if (zone) eggAdvance(zone);
    });

    if (search) search.addEventListener("input", () => {
        if (step !== 3) return;
        if (norm(search.value) === PHRASE) { reveal(); reset(); }
    });

    if (eggClose) eggClose.addEventListener("click", hide);
    eggPage.addEventListener("click", (e) => { if (e.target === eggPage) hide(); });
})();

/* ─────────────────────────────────────────────────────────────────────────
   PASTA LITÚRGICA — color de la portada según el tiempo litúrgico romano.
   Automático para siempre (Opción B): la Pascua se calcula con el algoritmo
   de Computus; de ella se derivan Ceniza, Cuaresma, Triduo, Pascua y
   Pentecostés. El Adviento se ata a la Navidad (25-dic). Sin rosa. Rojo en
   días sueltos: Domingo de Ramos, Viernes Santo y Pentecostés.

   Colores = misma "piel mate" del verde salvia de producción (placeholders;
   se afinan con la amiga). Cada color son sus 3 paradas [luz, base, sombra]
   que alimentan las vars --cover-1/2/3 del degradado de .cover-page.
   ───────────────────────────────────────────────────────────────────────── */
(function initLiturgicalCover() {
    // Colores de pasta por clave (luz, base, sombra) = vars --cover-1/2/3.
    const LIT_COLORS = {
        verde:     ["#aab69f", "#97a78c", "#879979"], // Tiempo Ordinario
        moradoAdv: ["#cebfd9", "#bfaccd", "#ac93be"], // Adviento (morado SUAVE)
        morado:    ["#ad9cba", "#9c87ab", "#886f9b"], // Cuaresma
        blanco:    ["#fcfcfb", "#f3f2f0", "#e5e4e1"], // Navidad y Pascua (perla)
        rojo:      ["#c47468", "#b45549", "#9d3f38"], // Ramos / V.Santo / Pentecostés (terracota intenso mate)
    };
    // Silueta por tiempo (Ordinario = Virgen inline, sin inyección).
    const TIME_SIL = {
        ordinario:   null,
        adviento:    "assets/siluetaAdviento.svg?v=4",
        navidad:     "assets/siluetaNavidad.svg?v=4",
        cuaresma:    "assets/siluetaCuaresma.svg?v=4",
        pascua:      "assets/siluetaPascua.svg?v=4",
        pentecostes: "assets/siluetaPentecostes.svg?v=9",
    };
    // Color base por tiempo (para el modo de PRUEBA forzado; el AUTO usa el color
    // del día, que sí distingue los rojos de Ramos/V.Santo/Pentecostés).
    const TIME_COLOR = {
        ordinario: "verde", adviento: "moradoAdv", navidad: "blanco",
        cuaresma: "morado", pascua: "blanco", pentecostes: "rojo",
    };
    const TIME_NAME = {
        ordinario: "Ordinario", adviento: "Adviento", navidad: "Navidad",
        cuaresma: "Cuaresma", pascua: "Pascua", pentecostes: "Pentecostés",
    };
    const OVR_KEY = "cantoral-liturgy-override"; // 'auto' | <tiempo>; SOLO prueba
    let advTestWeek = null; // TEST: semana de Adviento forzada por el botón de vela (null = semana real). PURGAR al publicar.

    // — Fechas (todo en UTC para no pelear con horario de verano) —
    function easter(y) { // Meeus/Jones/Butcher (gregoriano)
        const a = y % 19, b = Math.floor(y / 100), c = y % 100,
              d = Math.floor(b / 4), e = b % 4,
              f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
              h = (19 * a + b - d - g + 15) % 30,
              i = Math.floor(c / 4), k = c % 4,
              l = (32 + 2 * e + 2 * i - h - k) % 7,
              m = Math.floor((a + 11 * h + 22 * l) / 451),
              month = Math.floor((h + l - 7 * m + 114) / 31),
              day = ((h + l - 7 * m + 114) % 31) + 1;
        return Date.UTC(y, month - 1, day);
    }
    const DAY = 86400000;
    function ymd(t) { const dt = new Date(t); return dt.getUTCFullYear() * 10000 + (dt.getUTCMonth() + 1) * 100 + dt.getUTCDate(); }
    function off(t, n) { return ymd(t + n * DAY); }
    function adventStartTs(Y) { // 1er Domingo de Adviento (timestamp UTC)
        const xmas = Date.UTC(Y, 11, 25);
        const dow = new Date(xmas).getUTCDay();        // 0=domingo
        const delta = dow === 0 ? 7 : dow;             // Domingo antes de Navidad
        return xmas - (delta + 21) * DAY;              // 3 domingos antes de ése
    }
    function adventStart(Y) { return ymd(adventStartTs(Y)); }
    function baptismLord(Y) { // Bautismo del Señor = domingo tras Epifanía (6-ene)
        const epi = Date.UTC(Y, 0, 6);
        const dow = new Date(epi).getUTCDay();
        const add = dow === 0 ? 1 : (7 - dow) % 7;
        return off(epi, add);
    }

    // Tiempo litúrgico + color del día para (Y,M,D). El color distingue los
    // rojos de días sueltos (Ramos, Viernes Santo, Pentecostés); el tiempo es el
    // de la temporada (para la silueta).
    function computeSeason(Y, M, D) {
        const today = Y * 10000 + M * 100 + D;
        const advN = adventStart(Y);
        if (today >= advN) {
            if (today <= Y * 10000 + 1224) return { time: "adviento", color: "moradoAdv" };
            return { time: "navidad", color: "blanco" };               // Navidad (25–31 dic)
        }
        const E = easter(Y);
        const bap = baptismLord(Y);
        const ash = off(E, -46), palm = off(E, -7), gf = off(E, -2),
              east = ymd(E), pent = off(E, 49);
        if (today <= bap) return { time: "navidad", color: "blanco" };  // hasta Bautismo
        if (today < ash) return { time: "ordinario", color: "verde" };  // Ordinario I
        if (today === palm) return { time: "cuaresma", color: "rojo" }; // Ramos (pasta roja)
        if (today === gf) return { time: "cuaresma", color: "rojo" };   // Viernes Santo
        if (today < east) return { time: "cuaresma", color: "morado" }; // Cuaresma
        if (today < pent) return { time: "pascua", color: "blanco" };   // Pascua
        if (today === pent) return { time: "pentecostes", color: "rojo" };
        return { time: "ordinario", color: "verde" };                   // Ordinario II
    }

    // Semana de Adviento (1-4) de una fecha; 0 si no es Adviento.
    function adventWeek(Y, M, D) {
        const t = Date.UTC(Y, M - 1, D);
        const s1 = adventStartTs(Y);
        if (t < s1 || t > Date.UTC(Y, 11, 24)) return 0;
        return Math.max(1, Math.min(4, Math.floor((t - s1) / (7 * DAY)) + 1));
    }

    // Fecha de hoy en la zona de México (independiente de la del dispositivo).
    function todayMX() {
        try {
            const s = new Intl.DateTimeFormat("en-CA", {
                timeZone: "America/Mexico_City",
                year: "numeric", month: "2-digit", day: "2-digit",
            }).format(new Date());
            const [Y, M, D] = s.split("-").map(Number);
            return { Y, M, D };
        } catch (e) {
            const n = new Date();
            return { Y: n.getFullYear(), M: n.getMonth() + 1, D: n.getDate() };
        }
    }
    function apply(colorKey) {
        const c = LIT_COLORS[colorKey] || LIT_COLORS.verde;
        const r = document.documentElement.style;
        r.setProperty("--cover-1", c[0]);
        r.setProperty("--cover-2", c[1]);
        r.setProperty("--cover-3", c[2]);
        return c;
    }

    // — Silueta de la pasta por tiempo (inyecta la escena y oculta la Virgen) —
    const coverPage = document.querySelector(".cover-page");
    const coverLiturgy = document.getElementById("coverLiturgy");
    const svgCache = {};
    let curSil = "__init__";
    async function setSilhouette(time, week) {
        // Clase del body por tiempo (para reglas como ocultar la estrella de la
        // esquina en Navidad).
        [...document.body.classList].forEach((c) => {
            if (c.indexOf("lit-") === 0) document.body.classList.remove(c);
        });
        document.body.classList.add("lit-" + time);

        const src = TIME_SIL[time];
        if (!src) {                                   // Ordinario → Virgen inline
            if (coverLiturgy) coverLiturgy.innerHTML = "";
            if (coverPage) coverPage.classList.remove("has-liturgy");
            curSil = "ordinario";
            return;
        }
        if (coverPage) coverPage.classList.add("has-liturgy");
        if (curSil !== time) {                        // inyectar sólo si cambió
            let txt = svgCache[src];
            if (txt == null) {
                try { txt = await fetch(src).then((r) => r.text()); svgCache[src] = txt; }
                catch (e) { return; }
            }
            if (coverLiturgy) coverLiturgy.innerHTML = txt;
            curSil = time;
        }
        // Adviento: encender las velas hasta la semana (acumulativo).
        if (time === "adviento" && coverLiturgy) {
            const wk = (advTestWeek != null) ? advTestWeek : week; // TEST: botón vela pisa la semana; PURGAR advTestWeek al publicar
            coverLiturgy.querySelectorAll(".flame").forEach((f) => {
                f.classList.toggle("on", (+f.dataset.week) <= wk);
            });
        }
    }

    function getOverride() { try { return localStorage.getItem(OVR_KEY) || "auto"; } catch (e) { return "auto"; } }
    function setOverride(v) { try { v === "auto" ? localStorage.removeItem(OVR_KEY) : localStorage.setItem(OVR_KEY, v); } catch (e) {} }

    // Aplica tiempo+color efectivos (forzado por la prueba, o el automático).
    function refresh() {
        const ovr = getOverride();
        const t = todayMX();
        let time, color, week;
        if (ovr === "auto") {
            const s = computeSeason(t.Y, t.M, t.D);
            time = s.time; color = s.color;
            week = adventWeek(t.Y, t.M, t.D);
        } else {
            time = TIME_SIL.hasOwnProperty(ovr) ? ovr : "ordinario";
            color = TIME_COLOR[time];
            // Forzado: si hoy no es Adviento, muestra las 4 velas encendidas.
            week = adventWeek(t.Y, t.M, t.D) || 4;
        }
        apply(color);
        setSilhouette(time, week);
        syncTest(ovr, time, color);
    }

    // ── Control de PRUEBA (Opción C, TEMPORAL) — visible abajo-centro.
    //    Cicla Auto → Ordinario → Adviento → Navidad → Cuaresma → Pascua →
    //    Pentecostés → Auto. QUITAR antes de publicar (este wiring + el bloque
    //    HTML #litTest + su CSS .lit-test).
    const CYCLE = ["auto", "ordinario", "adviento", "navidad", "cuaresma", "pascua", "pentecostes"];
    const testBtn = document.getElementById("litTest");
    const testLabel = document.getElementById("litTestLabel");
    const testDot = document.getElementById("litTestDot");
    function syncTest(ovr, time, color) {
        if (testLabel) testLabel.textContent = (ovr === "auto" ? "Auto · " : "") + TIME_NAME[time];
        if (testDot) testDot.style.background = (LIT_COLORS[color] || LIT_COLORS.verde)[1];
    }
    if (testBtn) {
        testBtn.addEventListener("click", () => {
            const cur = getOverride();
            const next = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length];
            setOverride(next);
            refresh();
        });
    }

    // TEST: botón de vela — enciende una vela de Adviento por toque (1→2→3→4→1).
    // PURGAR junto con #litTest al publicar (este bloque + el HTML #candleTest +
    // la var advTestWeek + la línea `wk` en setSilhouette).
    const candleBtn = document.getElementById("candleTest");
    const candleNum = document.getElementById("candleTestNum");
    if (candleBtn) {
        candleBtn.addEventListener("click", () => {
            advTestWeek = (advTestWeek % 4) + 1; // null→1, luego 2,3,4,1…
            if (candleNum) candleNum.textContent = advTestWeek;
            const flames = document.querySelectorAll("#coverLiturgy .flame");
            if (getOverride() !== "adviento" || !flames.length) {
                // Fuerza Adviento; setSilhouette encenderá las velas según advTestWeek.
                setOverride("adviento");
                refresh();
            } else {
                // Adviento ya visible: solo re-enciende (sin re-dibujar).
                flames.forEach((f) => f.classList.toggle("on", (+f.dataset.week) <= advTestWeek));
            }
        });
    }

    refresh();
    // Recalcular al volver a la pestaña / de madrugada (por si cruza medianoche).
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
    setInterval(refresh, 3600000); // cada hora
})();


// ═══════════════════════════════════════════════════════════════════════════
// CONTRAPORTADA — ESPIRAL DIAGONAL DE MARIPOSAS DE PAPEL
// Pegar al FINAL de script.js (fuera de cualquier función; es un IIFE, corre solo).
// Necesita el bloque de mariposas-contraportada.css.
//
// Monta la escena en el DORSO de la ÚLTIMA hoja del libro (la contraportada:
// document.querySelectorAll(".paper") → la última → su ".back").
// ═══════════════════════════════════════════════════════════════════════════
(function setupBackCoverButterflies() {
    // Adaptado al cantoral: la contraportada vive en la cara FRONTAL de #pCoverBack
    // (.contraportada), no en el .back. Inyectamos la espiral ahi, DETRAS del
    // contenido (cp-sky z-index:1 < .bc-content z-index:2). Solo en la contraportada.
    var back = document.querySelector("#pCoverBack .front.contraportada");
    if (!back) {
        // El libro puede no estar armado todavía cuando corre este módulo (orden de
        // ejecución). Reintenta en el próximo frame hasta que exista la contraportada
        // (tope ~120 frames para no colgar si algún build no la tuviera).
        if ((setupBackCoverButterflies._tries = (setupBackCoverButterflies._tries || 0) + 1) < 120)
            requestAnimationFrame(setupBackCoverButterflies);
        return;
    }

    // ── Ajustes ──────────────────────────────────────────────────────────
    var N      = 12;    // cuántas mariposas
    var LIFE   = 18;    // s: del centro hasta desvanecerse arriba (más lento)
    var TURNS  = 3;     // vueltas que da mientras sube
    var RADIUS = 175;   // px: radio del giro con el embudo abierto (más ancho)
    var RISE   = 535;   // px: cuánto sube (abarca la diagonal completa)
    var DRIFT  = 360;   // px: cuánto se corre a la DERECHA (la diagonal más amplia).
                        //     Negativo = diagonal hacia la izquierda.

    // Sin color: alas de PAPEL, los mismos blancos del libro (--page-bg #fbf9f2)
    // con el filo y las nervaduras en gris salvia. [tono, filo]
    var TONES = [
        ["#fbf9f2", "#818f74"],
        ["#f4efe1", "#78866b"],
        ["#e8e6d8", "#6f7d63"],
        ["#fdfcf7", "#8b9880"]
    ];

    var r = function (a, b) { return a + Math.random() * (b - a); };
    var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };

    // ── Un ALA (lado derecho). El izquierdo es el mismo trazo espejeado con
    //    scale(-1,1): ala anterior puntiaguda + ala posterior redondeada, filo
    //    oscuro, sombreado hacia la base, nervaduras y motas del margen. ──
    var WING =
        '<path d="M100 82 C 128 60 166 42 188 34 C 194 32 197 36 196 44 C 194 62 180 84 156 100 C 140 110 112 108 100 96 Z" fill="var(--w1)" stroke="var(--w2)" stroke-width="5.5" stroke-linejoin="round"/>' +
        '<path d="M100 100 C 126 98 152 110 163 126 C 172 140 166 160 146 168 C 128 175 107 166 100 142 Z" fill="var(--w1)" stroke="var(--w2)" stroke-width="5.5" stroke-linejoin="round"/>' +
        '<path d="M100 82 C 128 60 166 42 188 34 C 194 32 197 36 196 44 C 194 62 180 84 156 100 C 140 110 112 108 100 96 Z" fill="var(--w2)" opacity=".2" transform="translate(100 90) scale(.52) translate(-100 -90)"/>' +
        '<path d="M100 100 C 126 98 152 110 163 126 C 172 140 166 160 146 168 C 128 175 107 166 100 142 Z" fill="var(--w2)" opacity=".2" transform="translate(100 108) scale(.52) translate(-100 -108)"/>' +
        '<g fill="none" stroke="var(--w2)" stroke-width="2.6" stroke-linecap="round" opacity=".42">' +
            '<path d="M103 88 L 184 45"/><path d="M103 92 L 190 56"/><path d="M103 96 L 176 74"/>' +
            '<path d="M102 99 L 158 95"/><path d="M102 102 L 138 105"/><path d="M102 110 L 156 120"/>' +
            '<path d="M102 118 L 160 140"/><path d="M101 126 L 148 161"/><path d="M100 134 L 128 166"/>' +
        '</g>' +
        '<g fill="var(--w2)" opacity=".34">' +
            '<circle cx="189" cy="48" r="2.9"/><circle cx="190" cy="58" r="2.7"/><circle cx="181" cy="72" r="2.9"/>' +
            '<circle cx="167" cy="88" r="2.9"/><circle cx="150" cy="100" r="2.6"/><circle cx="159" cy="130" r="2.7"/>' +
            '<circle cx="161" cy="146" r="2.7"/><circle cx="150" cy="160" r="2.7"/><circle cx="132" cy="166" r="2.5"/>' +
        '</g>';

    // Cuerpo: abdomen, tórax, cabeza y antenas con maza (va encima de las alas;
    // con preserve-3d el ala que se acerca pasa por delante sola).
    var BODY =
        '<svg viewBox="0 0 200 200">' +
            '<path d="M100 158 C 94.5 138 94.5 110 100 90 C 105.5 110 105.5 138 100 158 Z" fill="#2b1c11"/>' +
            '<ellipse cx="100" cy="92" rx="8.4" ry="14" fill="#3b2717"/>' +
            '<circle cx="100" cy="75" r="6.8" fill="#2b1c11"/>' +
            '<g fill="none" stroke="#2b1c11" stroke-width="2.8" stroke-linecap="round">' +
                '<path d="M96 70 C 88 56 78 44 68 37"/><path d="M104 70 C 112 56 122 44 132 37"/>' +
            '</g>' +
            '<circle cx="67" cy="36" r="3.3" fill="#2b1c11"/><circle cx="133" cy="36" r="3.3" fill="#2b1c11"/>' +
        '</svg>';

    // Para que se LEA la espiral y no un enjambre: todas recorren la MISMA hélice
    // (mismo periodo de giro y misma duración de ascenso) y sólo se reparten el
    // desfase; el jitter de radio/tamaño/aleteo las vuelve orgánicas.
    var ORB = (LIFE / TURNS).toFixed(2);
    var html = "";

    for (var i = 0; i < N; i++) {
        var rx   = Math.round(RADIUS * r(0.9, 1.1));
        var ry   = Math.round(rx * r(0.28, 0.33));      // achatado = espiral en perspectiva
        var rise = -Math.round(RISE * r(0.94, 1.06));
        var dx   = Math.round(DRIFT * r(0.9, 1.1));
        var sz   = Math.round(r(33, 47));
        var del  = -(i * (LIFE / N) + r(0, 0.3)).toFixed(2);   // reparto a lo largo de la hélice
        var flap = r(0.16, 0.27).toFixed(2);
        var tone = pick(TONES);

        html += '<div class="cp-bf" style="' +
                    "--rx:" + rx + "px;--ry:" + ry + "px;--rise:" + rise + "px;--dx:" + dx + "px;" +
                    "--sz:" + sz + "px;--dur:" + LIFE + "s;--orb:" + ORB + "s;--del:" + del + "s;" +
                    "--flap:" + flap + "s;--w1:" + tone[0] + ";--w2:" + tone[1] +
                '">' +
                    '<div class="cp-rise"><div class="cp-orbit"><div class="cp-body">' +
                        '<div class="cp-wing cp-wing-l"><svg viewBox="0 0 200 200">' +
                            '<g transform="translate(200,0) scale(-1,1)">' + WING + '</g></svg></div>' +
                        '<div class="cp-wing cp-wing-r"><svg viewBox="0 0 200 200">' +
                            '<g>' + WING + '</g></svg></div>' +
                        BODY +
                    '</div></div></div>' +
                '</div>';
    }

    // Resplandor del que nace la espiral (quita esta línea si no lo quieres).
    var glow = '<div class="cp-glow" aria-hidden="true"><i></i></div>';

    back.insertAdjacentHTML("beforeend", glow);

    var sky = document.createElement("div");
    sky.className = "cp-sky";
    sky.setAttribute("aria-hidden", "true");
    sky.innerHTML = html;
    back.appendChild(sky);

    // ── LUCIÉRNAGAS (SOLO modo oscuro): en la contraportada nocturna reemplazan a
    //    las mariposas de papel (su blanco de hoja desentona de noche). Técnica
    //    BARATA a propósito: ~14 puntitos, cada uno con glow por box-shadow y
    //    animación 100% CSS (deriva translate + parpadeo opacity) — SIN rAF, todo
    //    en el compositor. Mostrar/ocultar/pausar lo maneja el CSS (body.dark-mode
    //    + los mismos gates de .cp-sky). Coherente con las luciérnagas del árbol. ──
    var FF_N = 18;
    var FF_COLS = ["#a6c93f", "#bcd24a", "#e0a62e", "#efb43e", "#93c23a"];
    var ffHtml = "";
    for (var j = 0; j < FF_N; j++) {
        // Esparcidas por TODA la contraportada (no solo la mitad baja): se ve más bonito.
        ffHtml += '<i class="cp-ff" style="'
            + "left:" + Math.round(r(5, 95)) + "%;top:" + Math.round(r(6, 94)) + "%;"
            + "--sz:" + r(3, 5.4).toFixed(1) + "px;"
            + "--tx:" + Math.round(r(-22, 22)) + "px;--ty:" + Math.round(r(-16, 16)) + "px;"
            + "--dd:" + r(6, 11).toFixed(1) + "s;--ddl:" + (-r(0, 6)).toFixed(2) + "s;"
            + "--bd:" + r(3.4, 5.6).toFixed(2) + "s;--bdl:" + (-r(0, 5)).toFixed(2) + "s;"
            + "--c:" + pick(FF_COLS)
            + '"></i>';
    }
    var ffSky = document.createElement("div");
    ffSky.className = "cp-ff-sky";
    ffSky.setAttribute("aria-hidden", "true");
    ffSky.innerHTML = ffHtml;
    back.appendChild(ffSky);

    // Volver a ver el cierre (opcional): reinicia todas las animaciones de la
    // escena. Llámalo cuando el lector llegue a la contraportada.
    window.replayBackCover = function () {
        var nodes = back.querySelectorAll(".cp-sky, .cp-sky *, .cp-glow i");
        for (var k = 0; k < nodes.length; k++) {
            if (!nodes[k].getAnimations) return;
            nodes[k].getAnimations().forEach(function (a) { a.cancel(); a.play(); });
        }
    };
})();

// ═══ TOUR / TUTORIAL — luciérnaga guía, 1-vez, repetible desde 🪲 del menú ═════
// NO es el típico tour de flechas: una luciérnaga vuela y se posa (spotlight) sobre
// cada control REAL con un cartelito manuscrito muy breve. Se dispara UNA vez tras
// llegar al primer canto (window.__tourMaybeStart desde updatePaperVisibility) y se
// repite desde la perla 🪲. En lite/reduced-motion la luciérnaga no vuela (estática).
(function initTour() {
    var DONE_KEY = "cantoral-tour-done";
    var idx = 0, root = null, hole = null, ff = null, card = null, stops = [];
    var armed = true;
    var BUG = '<img class="t-bug" src="assets/luciernaga.png?v=1" alt="luciérnaga">';

    function q(sel) { try { return document.querySelector(sel); } catch (e) { return null; } }

    function buildStops() {
        return [
            { center: true, title: "¡Hola! " + BUG, text: "Soy tu guía. Te enseño el cantoral en 20 segundos." },
            { sel: "#menuBtn", title: "El menú", text: "Ábrelo para ver todas las opciones (las perlas).", openMenu: true },
            { sel: "#searchBtn", title: "Buscar", text: "Halla un canto por número o por nombre." },
            { sel: "#fontPickerBtn", title: "Tipo de letra", text: "Cambia el estilo de la fuente a tu gusto." },
            { sel: "#themeToggle", title: "Claro u oscuro", text: "Cambia el ambiente del libro cuando quieras.", openMenu: true },
            { sel: "#indexBtn", title: "Índice", text: "Salta a cualquier canto o sección desde la lista.", openMenu: true },
            { sel: "#gestureBtn", title: "Gestos ✋", text: "También puedes pasar hoja con gestos.", openMenu: true },
            { sel: "#liteBtn", title: "Modo ligero 🐢", text: "Para equipos modestos: apaga lo pesado, deja lo esencial.", openMenu: true },
            { sel: ".paper.onstage .zoom-toggle", title: "Tamaño de letra", text: "Toca la «aA» para hacer más o menos zoom a la letra del canto." },
            { sel: ".paper.onstage .chord-ix.has-diagram", title: "Acordes", text: "Toca un acorde y verás cómo se hace." },
            { sel: ".paper.onstage .guide-btn", title: "Guía de acordes", text: "Abre la lámina para aprender a colocar los dedos." },
            { sel: "#ribbonHit", title: "Listones", text: "Tócalos y guarda tu página. Vuelve a tocarlo para regresar a ella. ¡Fija hasta 5 listones!" },
            { center: true, title: "Cambiar de página", text: "Desliza ⟵ ⟶ para avanzar o regresar." },
            { sel: "#installBtn", title: "Llévalo contigo 📲", text: "Instálalo como app. Repite este tour desde " + BUG + " en el menú.", last: true }
        ];
    }

    function ensureDom() {
        if (root) return;
        root = document.createElement("div");
        root.id = "tourRoot";
        root.innerHTML =
            '<button id="tourCatch" type="button" aria-label="Continuar"></button>' +
            '<div id="tourHole" aria-hidden="true"></div>' +
            '<div id="tourFirefly" aria-hidden="true"></div>' +
            '<div id="tourCard" role="dialog" aria-live="polite">' +
                '<div class="t-title"></div><div class="t-text"></div>' +
                '<div class="t-row"><div class="t-dots"></div>' +
                '<div class="t-btns">' +
                    '<button class="t-skip" type="button">Saltar</button>' +
                    '<button class="t-next" type="button">Siguiente</button>' +
                '</div></div>' +
            '</div>';
        document.body.appendChild(root);
        hole = root.querySelector("#tourHole");
        ff = root.querySelector("#tourFirefly");
        card = root.querySelector("#tourCard");
        root.querySelector("#tourCatch").addEventListener("click", next);
        root.querySelector(".t-next").addEventListener("click", next);
        root.querySelector(".t-skip").addEventListener("click", end);
    }

    function closeMenuIfOpened() {
        var tc = document.getElementById("topControls");
        if (tc && tc.__tourOpened) { tc.classList.remove("menu-open"); tc.__tourOpened = false; }
    }

    function moveFirefly(x, y) {
        x = Math.max(10, Math.min(window.innerWidth - 10, x));
        y = Math.max(10, Math.min(window.innerHeight - 10, y));
        ff.style.left = x + "px"; ff.style.top = y + "px";
    }
    function centerHole() {
        var cx = window.innerWidth / 2, cy = window.innerHeight * 0.42;
        hole.style.left = cx + "px"; hole.style.top = cy + "px";
        hole.style.width = "0px"; hole.style.height = "0px";
        moveFirefly(cx, cy - 44);
    }
    // El cartel va SIEMPRE fijo y centrado (no persigue al control): así no choca con
    // la luciérnaga ni con la luz del spotlight, y da sensación estable. La luciérnaga
    // es la que se mueve y acompaña/ilumina cada control. Se coloca un pelín ABAJO del
    // centro para despejar la zona alta (top-bar, perlas superiores).
    function positionCard() {
        var cw = card.offsetWidth, ch = card.offsetHeight;
        var vw = window.innerWidth, vh = window.innerHeight;
        card.style.left = Math.round((vw - cw) / 2) + "px";
        card.style.top = Math.round(vh * 0.56 - ch / 2) + "px";
    }

    function place(stop) {
        var body = document.body;
        var tc = document.getElementById("topControls");
        if (stop.openMenu && tc && !tc.classList.contains("menu-open")) {
            tc.classList.add("menu-open"); tc.__tourOpened = true;
        } else if (!stop.openMenu) {
            closeMenuIfOpened();
        }
        var target = stop.center ? null : q(stop.sel);
        var r = target ? target.getBoundingClientRect() : null;
        var visible = !!(r && r.width > 2 && r.height > 2);
        if (stop.center || !visible) {
            body.classList.add("tour-center");
            centerHole();
        } else {
            body.classList.remove("tour-center");
            var pad = 8;
            var x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad);
            var w = Math.min(window.innerWidth - 8, r.width + pad * 2);
            var h = r.height + pad * 2;
            hole.style.left = x + "px"; hole.style.top = y + "px";
            hole.style.width = w + "px"; hole.style.height = h + "px";
            // La luciérnaga se POSA junto al control iluminado, del lado que da hacia
            // el CENTRO (nunca al borde, donde se cortaba), como si lo iluminara con el
            // abdomen. El cartel va fijo al centro, así que no chocan.
            var cxc = x + w / 2;
            var ffx = (cxc > window.innerWidth / 2) ? (x - 10) : (x + w + 10);
            moveFirefly(ffx, y + h / 2);
        }
        card.querySelector(".t-title").innerHTML = stop.title;
        card.querySelector(".t-text").innerHTML = stop.text;
        var dots = card.querySelector(".t-dots"); dots.innerHTML = "";
        for (var i = 0; i < stops.length; i++) {
            var d = document.createElement("span");
            d.className = "t-dot" + (i === idx ? " on" : "");
            dots.appendChild(d);
        }
        card.querySelector(".t-next").textContent = stop.last ? "Listo" : "Siguiente";
        positionCard();
    }

    function show(i) { idx = i; place(stops[i]); }
    function next() { if (idx + 1 >= stops.length) { end(); return; } show(idx + 1); }
    function end() {
        closeMenuIfOpened();
        document.body.classList.remove("tour-on", "tour-center");
        try { localStorage.setItem(DONE_KEY, "1"); } catch (e) {}
    }
    function start(force) {
        if (document.body.classList.contains("tour-on")) return;
        try { if (!force && localStorage.getItem(DONE_KEY)) return; } catch (e) {}
        ensureDom();
        stops = buildStops();
        document.body.classList.add("tour-on");
        show(0);
    }
    window.__startTour = start;

    // Reentrada: perla 🪲 al final del menú.
    var menu = document.getElementById("menuItems");
    if (menu && !document.getElementById("tourBtn")) {
        var b = document.createElement("button");
        b.className = "index-btn"; b.id = "tourBtn"; b.type = "button";
        b.title = "Ver el tutorial"; b.setAttribute("aria-label", "Ver el tutorial");
        b.innerHTML = '<img class="t-bug-ico" src="assets/luciernaga.png?v=1" alt="Tutorial">';
        menu.appendChild(b);
        b.addEventListener("click", function () {
            var tc = document.getElementById("topControls");
            if (tc) tc.classList.remove("menu-open");
            setTimeout(function () { start(true); }, 260);
        });
    }

    // Disparo 1-vez: al llegar al PRIMER canto (tras la plumeria).
    window.__tourMaybeStart = function () {
        if (!armed) return;
        try { if (localStorage.getItem(DONE_KEY)) { armed = false; return; } } catch (e) {}
        if (document.body.classList.contains("intro-active")) return;
        var onstage = document.querySelector(".paper.onstage");
        if (!onstage) return;
        var isSong = onstage.querySelector(".page-content-wrap .cline, .page-content-wrap .lyrics, .page-content-wrap .song-line, .page-content-wrap .short-song");
        if (!isSong) return;
        armed = false;
        setTimeout(function () { start(false); }, 700);
    };

    window.addEventListener("resize", function () {
        if (document.body.classList.contains("tour-on") && stops.length) place(stops[idx]);
    });
})();
