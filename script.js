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
const INITIAL_HASH = BOOK_WAS_CLOSED >= 0 ? "" : (window.location.hash || LAST_SAVED_HASH || "");

(function welcomeIntro() {
    const intro = document.getElementById("welcomeIntro");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
        if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
        return;
    }

    document.body.classList.add("intro-active");

    let isDark = false;
    try { isDark = localStorage.getItem("cantoral-theme") === "dark"; } catch(e) {}

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

    function firePhase2() {
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

    if (!isDark) {
        const SUNSETS = [
            [[0,"#5b6aa8"],[0.34,"#c98aad"],[0.60,"#ff9d7a"],[0.82,"#ffb057"],[1,"#ffcf7a"]], 
            [[0,"#6d6fae"],[0.34,"#d68f9e"],[0.60,"#ff9b6a"],[0.82,"#ff9f52"],[1,"#ffc266"]], 
            [[0,"#7a5f9c"],[0.34,"#e0899f"],[0.60,"#ff8f72"],[0.82,"#ff9a4f"],[1,"#ffbe6b"]], 
            [[0,"#4f6bb0"],[0.34,"#b98bb6"],[0.60,"#f79a86"],[0.82,"#ffab5e"],[1,"#ffd089"]], 
            [[0,"#8a6bab"],[0.34,"#e79aa0"],[0.60,"#ffa878"],[0.82,"#ffbc63"],[1,"#ffdc8e"]], 
            [[0,"#63709f"],[0.34,"#cf95a4"],[0.60,"#ff9a72"],[0.82,"#ff8f45"],[1,"#ffb35c"]], 
            [[0,"#7e6aa2"],[0.34,"#d98fae"],[0.60,"#ff9e88"],[0.82,"#ffab5a"],[1,"#ffc978"]], 
            [[0,"#93739e"],[0.34,"#e6a08c"],[0.60,"#ffab6f"],[0.82,"#ffb85c"],[1,"#ffd583"]], 
            [[0,"#586bad"],[0.34,"#c58ea8"],[0.60,"#ff9f7c"],[0.82,"#ffae5c"],[1,"#ffcf82"]], 
            [[0,"#6f5f9e"],[0.34,"#d287a1"],[0.60,"#f89a84"],[0.82,"#ff9d55"],[1,"#ffc06f"]], 
            [[0,"#8f6db4"],[0.34,"#eb9fab"],[0.60,"#ffaa82"],[0.82,"#ffbe70"],[1,"#ffd98a"]], 
            [[0,"#4a6ea8"],[0.34,"#b58aa8"],[0.60,"#f2977f"],[0.82,"#ff9a52"],[1,"#ffbf6d"]], 
            [[0,"#7a2f5e"],[0.34,"#c0335a"],[0.60,"#ff5a3c"],[0.82,"#ff7e2e"],[1,"#ffb347"]], 
            [[0,"#2b2a5e"],[0.34,"#4a3a7a"],[0.60,"#7d4a86"],[0.82,"#b5567a"],[1,"#e8825e"]], 
            [[0,"#8ea6d8"],[0.34,"#d9a7cf"],[0.60,"#ffc3c0"],[0.82,"#ffd9b0"],[1,"#fff0cf"]], 
            [[0,"#3f6d7a"],[0.34,"#5f9a8c"],[0.60,"#9fbf7e"],[0.82,"#e8c56b"],[1,"#ffd98a"]]  
        ];
        const BCOLORS = ["#ff8a3c","#5aa0ff","#ffd24a","#ff7bbf","#7be0c0","#b98cff","#ff6b6b","#a8e06c"];

        const hasHash = window.location.hash && window.location.hash.length > 1;
        const bookClosed = !hasHash;
        const DUR = bookClosed ? 3000 : 1800;

        document.querySelectorAll(".wi-sky-stars,.wi-trail,.wi-lead-star").forEach(el => el.style.display = "none");
        document.getElementById("wiLightCanvas")?.remove();   

        const titleEl = document.getElementById("wiLightTitle");
        const W = intro.clientWidth || window.innerWidth;
        const H = intro.clientHeight || window.innerHeight;
        const rnd = (a, b) => a + Math.random() * (b - a);
        const pick = a => a[Math.floor(Math.random() * a.length)];

        const sunset = SUNSETS[Math.floor(Math.random() * SUNSETS.length)];
        intro.style.background = "linear-gradient(to bottom," +
            sunset.map(([p, c]) => c + " " + Math.round(p * 100) + "%").join(",") + ")";

        let css = ".wi-bfly{position:absolute;left:50%;top:50%;opacity:0;will-change:transform,opacity}" +
            ".wi-bfly svg{display:block;width:100%;height:100%;transform-origin:50% 50%;" +
            "animation:covFlap .18s ease-in-out infinite alternate}" +
            ".wi-petal{position:absolute;top:0;border-radius:50% 0 50% 50%;opacity:0;will-change:transform,opacity}";
        let bodyHTML = "";

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

        if (titleEl) {
            titleEl.style.display = "block";
            titleEl.style.willChange = "transform, opacity";
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
            if (titleEl.decode) titleEl.decode().catch(() => {});   
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

        let done = false;
        function finish() { if (done) return; done = true; firePhase2(); }
        const finishTimer = setTimeout(finish, DUR);
        function skipAnim() { clearTimeout(finishTimer); finish(); }
        intro.addEventListener("click", skipAnim, { once: true });
        intro.addEventListener("touchstart", skipAnim, { once: true, passive: true });

    } else {
        document.getElementById("wiLightCanvas")?.remove();
        document.getElementById("wiLightTitle")?.remove();

        setTimeout(() => firePhase2(), 1800);
    }

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

function makeBackCoverPaper() {
    const PETAL = "M0 0 C -18 -24 -21 -60 -6 -84 C 0 -93 12 -93 18 -81 C 30 -48 21 -18 0 0 Z";
    const FG = [
        ["#ffcf3f", "#fff0b0", "#fffdf3", "#ffffff"],
        ["#ff9e00", "#ffd633", "#ffe97a", "#fff3a8"],
        ["#ffd23f", "#ffc6c2", "#f58fb0", "#e85f93"],
        ["#ffc63f", "#e87aa0", "#c43c77", "#97134f"],
        ["#ffd23f", "#ffb060", "#ff8a3c", "#f4632a"]
    ];
    const g = FG[Math.floor(Math.random() * FG.length)];
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
function wrapSongNum(html) {
    return html.replace(/^(\s*)(\d+\.)/, '$1<span class="song-num" role="button" tabindex="0" aria-label="Mostrar u ocultar el subrayado de los títulos">$2</span>');
}

function footerHtml(pageNum, noZoom) {
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

const VPAGE_GROUP = {};    
const SONG_TO_PAPER = {};  
let indexBuilt = false;    
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
        VPAGE_GROUP[c.paperId] = group;             
        for (const cc of group) SONG_TO_PAPER[cc.id] = c.paperId;   
        allHTML += makePaperShell(c.paperId);       
    }

    const sectionsWithSongs = new Set(DATA.cantos.map(c => c.section));
    for (const sec of DATA.sections) {
        if (sectionsWithSongs.has(sec.key)) continue;
        const sepTitle = SEPARATOR_TITLES[sec.key] || sec.label.toUpperCase();
        allHTML += makePaper("sep_" + sec.key, makeDecorSep(sepTitle, sec.key));
    }

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

try { if (localStorage.getItem("cantoral-title-underline") === "0") document.body.classList.add("titles-no-underline"); } catch (e) {}

generatePages();

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

const SONG_SLUGS = new Map();
const SONG_CONT = new Map(); 
for (const c of DATA.cantos) {
    if (c.layout === "continuation") {
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


const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const book = document.querySelector("#book");
const themeToggle = document.querySelector("#themeToggle");
const papers = Array.from(document.querySelectorAll(".paper"));

let currentLocation = 1;
let maxLocation = papers.length;
const pageTurnDuration = 1050;

papers.forEach((paper, index) => {
    paper.style.zIndex = papers.length - index;
});

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

    if (face.classList.contains("contraportada")) return "contraportada";

    if (face.classList.contains("dedication-page")) return "dedicatoria";

    if (face.classList.contains("plumeria-page")) return "plumeriarubra";

    const songTitle = face.querySelector(".song-title");
    if (songTitle) {
        const num = songTitle.dataset.song;
        const slug = SONG_SLUGS.get(num) || "";
        return num + slug;
    }

    if (face.querySelector(".page-content-wrap")) {
        const num = SONG_CONT.get(paper.id);
        if (num) return num + (SONG_SLUGS.get(num) || "") + "p2";
    }

    const sectionTitle = face.querySelector("[data-section]");
    if (sectionTitle) {
        return sectionTitle.dataset.section;
    }

    const decorPage = face.querySelector(".decor-section-page");
    if (decorPage) return "indice";

    const indexPage = face.querySelector(".index-page");
    if (indexPage) {
        const idxPages = Array.from(document.querySelectorAll(".index-page"));
        const idx = idxPages.indexOf(indexPage);
        return idx >= 0 ? "indice-" + (idx + 1) : "indice";
    }

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

    if (hash.startsWith("canto-")) {
        const songNum = hash.replace("canto-", "");
        const loc = locationOfSong(songNum);
        if (loc !== null) return loc;
    }

    const songHashMatch = hash.match(/^(\d+)([a-z].*)$/);
    if (songHashMatch) {
        const songNum = songHashMatch[1];
        const rest = songHashMatch[2];
        const isP2 = rest.endsWith("p2");
        const loc = locationOfSong(songNum);
        if (loc !== null) return isP2 ? loc + 1 : loc;
    }

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
        try {
            localStorage.setItem("cantoral-last-hash", hash);
        } catch (e) {}
    }
}

const VIRTUAL_BUFFER = 6;

function makePaperShell(id) {
    return `<div class="paper vpage" id="${id}"><div class="front"></div><div class="back blank-page"></div></div>`;
}
function mountVPage(p) {
    if (!p || !p.classList.contains("vpage") || p.dataset.vmounted) return;
    const f = p.querySelector(":scope > .front");
    if (f && !f.firstChild) f.innerHTML = buildSongPage(VPAGE_GROUP[p.id] || []);
    p.dataset.vmounted = "1";
    delete p.dataset.fitted;   
}
function unmountVPage(p) {
    if (!p || !p.classList.contains("vpage") || !p.dataset.vmounted) return;
    const f = p.querySelector(":scope > .front");
    if (f) f.innerHTML = "";
    delete p.dataset.vmounted;
    delete p.dataset.fitted;
}
let fontsReady = false;
let coverDrawnDone = false; 
function updatePaperVisibility() {
    const center = currentLocation - 1;
    for (let i = 0; i < papers.length; i++) {
        const visible = i >= center - VIRTUAL_BUFFER && i <= center + VIRTUAL_BUFFER;
        papers[i].style.display = visible ? "" : "none";
        papers[i].classList.toggle("near", i >= center - 1 && i <= center + 1);
        papers[i].classList.toggle("onstage", i === center);
        if (visible) mountVPage(papers[i]); else unmountVPage(papers[i]);
        if (visible && fontsReady && !papers[i].dataset.fitted) fitPaper(papers[i]);
    }
    if (!coverDrawnDone) {
        const cp = document.getElementById("pCoverFront");
        if (cp && !cp.classList.contains("near")) {
            const cf = cp.querySelector(".front.cover-page");
            if (cf) { cf.classList.add("cover-drawn"); coverDrawnDone = true; }
        }
    }
    document.body.classList.toggle("book-at-back", currentLocation >= maxLocation);
    updateHashFromLocation();
    updateFontControlsVisibility();
    if (window.__syncRibbons) window.__syncRibbons();
    if (window.__tourMaybeStart) window.__tourMaybeStart();   
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    requestAnimationFrame(() => {
        try { updatePaperVisibility(); } catch (e) {}
        const bookEl = document.getElementById("book");
        if (bookEl) {
            bookEl.style.display = "none";
            void bookEl.offsetHeight;   
            bookEl.style.display = "";
        }
    });
});

function updateFontControlsVisibility() {
    const fc = document.getElementById("fontControls");
    if (!fc) return;
    const paper = papers[currentLocation - 1];
    const face = paper ? paper.querySelector(":scope > .front") : null;
    const isSongFace = !!(face && face.querySelector(".page-content-wrap"));
    fc.classList.toggle("hidden", !isSongFace);
    const fpBtn = document.getElementById("fontPickerBtn");
    if (fpBtn) fpBtn.classList.toggle("hidden", !isSongFace);
    if (!isSongFace) {
        const fp = document.getElementById("fontPicker");
        if (fp) fp.classList.add("hidden");
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
    // iOS Safari: `.container` es 100dvh, pero en la 1a carga (barra de URL sin asentar)
    // clientHeight reporta un alto que no coincide con lo VISIBLE -> el libro se escala mal
    // (chico, con negro abajo) hasta recargar. `visualViewport.height` da el area visible
    // REAL en todo momento; se prefiere cuando existe.
    const vv = window.visualViewport;
    return {
        width: (vv && vv.width) || root.clientWidth || window.innerWidth,
        height: (vv && vv.height) || root.clientHeight || window.innerHeight,
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
// FIX iOS Safari: en la 1a carga la barra de URL aun no se asienta, asi que la
// medicion del viewport sale distinta del area real y el libro se escala mal (chico,
// choca con la barra) hasta recargar. iOS NO dispara "resize" fiable al mostrar/ocultar
// la barra, pero SI reporta el area visible por visualViewport; escuchamos ahi y
// re-aplicamos unas veces tras load para atrapar el asentamiento inicial.
if (window.visualViewport) {
    let vvTimer = null;
    const onVV = () => {
        applyScale();
        clearTimeout(vvTimer);
        vvTimer = window.setTimeout(refitVisible, 200);
    };
    window.visualViewport.addEventListener("resize", onVV);
    window.visualViewport.addEventListener("scroll", onVV);
}
window.addEventListener("load", () => {
    requestAnimationFrame(() => { applyScale(); refitVisible(); });
    setTimeout(() => { applyScale(); refitVisible(); }, 300);
    setTimeout(() => { applyScale(); refitVisible(); }, 800);
});

function setTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    themeToggle.setAttribute("aria-label", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
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
let FINAL_FLIP_MS = 0;
function currentFlipDuration() {
    if (FINAL_FLIP_MS) return FINAL_FLIP_MS;
    if (window.__BURST_FLIP_OVERRIDE) return window.__BURST_FLIP_OVERRIDE;
    return Math.max(MIN_FLIP_MS, Math.round(BASE_FLIP_MS / speedMultiplier(currentLocation)));
}
function currentStepDelay() {
    return Math.max(MIN_STEP_MS, Math.round(BASE_STEP_MS / speedMultiplier(currentLocation)));
}

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
    void body.offsetWidth;              
    body.classList.add("book-closing");
    closeFxTimer = window.setTimeout(() => { closeFxTimer = null; body.classList.remove("book-closing"); }, 1700);
    if (book.animate) {
        const b = book.style.transform || "";
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
    try { if (navigator.vibrate) window.setTimeout(() => navigator.vibrate([14, 36, 22]), 900); } catch (e) {}
}

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
    if (document.body.classList.contains("tour-on")) return;   
    if (document.body.classList.contains("font-slider-open")) return;
    if (currentLocation >= maxLocation) return;
    if (window.__closeRibbons) window.__closeRibbons();
    if (currentLocation === 1) {
        openBook();
        if (window.__killIntroFx) window.__killIntroFx();
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
    if (document.body.classList.contains("tour-on")) return;   
    if (document.body.classList.contains("font-slider-open")) return;
    if (currentLocation <= 1) return;
    if (currentLocation >= maxLocation) {
        if (!isAnimating) { resistClosedBook(); return; }
        cancelBookCloseFx();   
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

(function restoreInitialLocation(){
    const saved = INITIAL_HASH;
    if (!saved) return;
    const loc = getLocationForHash(saved);
    if (loc > 1 && loc <= maxLocation) {
        currentLocation = loc;
        for (let i = 0; i < papers.length; i++) {
            const flipped = (i + 1) < currentLocation;
            papers[i].classList.toggle("flipped", flipped);
            papers[i].style.zIndex = flipped ? (i + 1) : (papers.length - i);
        }
        if (window.__killIntroFx) window.__killIntroFx();
    }
})();

loadTheme();
applyScale();
updatePaperVisibility();

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
    const MAX = 3;   
    const STAIR_ANGLE = 10;                    
    let slots = [null, null, null];   
    let lastSlot = -1;                
    let isOpen = false;
    let paintMode = false;            

    const PALETTE = [
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
        const seen = {};
        for (let i = 0; i < MAX; i++) {
            const s = slots[i];
            if (s && s.hash) {
                if (seen[s.hash]) slots[i] = null;
                else seen[s.hash] = true;
            }
        }
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

    function currentLabel() {
        const paper = papers[currentLocation - 1];
        const face = paper ? paper.querySelector(":scope > .front") : null;
        const n = face ? face.querySelector(".footer-line-2") : null;
        const txt = n ? n.textContent.trim() : "";
        return txt || String(currentLocation);
    }

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
        const hereHash = atCover ? null : getHashForLocation(currentLocation);
        const alreadyHere = !!(hereHash && slots.some(s => s && s.hash === hereHash));
        const free = alreadyHere ? -1 : firstFree();
        const top = free >= 0 ? free : firstPinned();
        let visCount = 0;
        let stack = 0;
        let rank = 0;   
        for (let i = 0; i < MAX; i++) {
            const r = ribs[i];
            const pinned = !!slots[i];
            const on = paintMode ? true
                : (atCover ? pinned : (pinned || (i === free && (isOpen || pinnedCount() === 0))));
            if (on) visCount++;
            r.classList.toggle("show", on);
            r.classList.toggle("pinned", pinned);
            r.classList.toggle("free", on && !pinned);
            const isHere = (pinned && hereHash && slots[i].hash === hereHash) || (atCover && pinned);
            r.classList.toggle("here", isHere);
            if (!on) continue;
            r.style.setProperty("--i", String(i));
            if (pinned) r.style.setProperty("--rank", String(rank++));
            r.style.setProperty("--off", String(i === top ? 0 : ++stack));
            r.style.zIndex = String(i === top ? 30 : 20 - i);
            const num = r.querySelector(".rib-num");
            if (num) {
                if (pinned) {
                    let t = (slots[i].full || slots[i].label || "");
                    t = t.replace(/^\s*\d+\s*[.\-)]\s*/, "");   
                    t = t.replace(/[.\s]+$/, "");                
                    const MAXLEN = 16;
                    if (t.length > MAXLEN) t = t.slice(0, MAXLEN).trim() + "…";
                    num.textContent = t || slots[i].id || "";
                } else {
                    num.textContent = "+";
                }
            }
            const tip = r.querySelector(".rib-tip");
            if (tip) tip.textContent = (pinned && slots[i].id) ? slots[i].id : "";
            r.setAttribute("aria-label", pinned
                ? "Ir a la página " + slots[i].label
                : "Fijar listón en esta página");
        }
        layer.style.setProperty("--n", String(visCount));
        if (closeBtn) closeBtn.classList.toggle("hidden", pinnedCount() === 0);
        if (paintBtn) paintBtn.classList.toggle("hidden", !(isOpen || paintMode));

        const bookEl = document.getElementById("book");
        if (bookEl) {
            const gap = window.innerHeight - bookEl.getBoundingClientRect().bottom;
            const n = Math.max(1, pinnedCount());
            const d0 = Math.max(12, Math.min(16, gap * 0.28)); 
            const dLast = Math.max(d0, gap - 8);               
            let step = n > 1 ? (dLast - d0) / (n - 1) : 18;
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
        if (slots.some((s, j) => s && s.hash === hash && j !== i)) return;
        const info = currentSongInfo();
        slots[i] = { hash: hash, label: currentLabel(), full: info.full, id: info.id };
        lastSlot = i;
        save();
        render();
        const r = ribs[i];
        r.classList.add("pinning");
        window.setTimeout(() => r.classList.remove("pinning"), 520);
        window.setTimeout(() => setOpen(false), 900);
    }

    function unpin(i) {
        slots[i] = null;
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

    window.__closeRibbons = function () { if (isOpen) setOpen(false); };

    window.addEventListener("resize", () => { if (window.__syncRibbons) window.__syncRibbons(); });

    window.__syncRibbons = function () {
        const atCover = currentLocation <= 1;
        layer.classList.toggle("at-cover", atCover);
        layer.classList.toggle("hidden", atCover && pinnedCount() === 0);
        hit.classList.toggle("hidden", atCover);
        if (atCover && isOpen) setOpen(false);
        render();
    };

    window.__ribbonConsumeClosed = function () {
        try { localStorage.removeItem(CLOSED_KEY); } catch (e) {}
    };

    loadColors();
    applyColors();
    load();
    render();
    setOpen(false);

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

function setLite(on, persist) {
    document.body.classList.toggle("lite", !!on);
    const b = document.getElementById("liteBtn");
    if (b) {
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.classList.toggle("is-active", !!on);
        b.textContent = on ? "⚡" : "🐢";
        b.setAttribute("aria-label", on ? "Volver a versión con animaciones" : "Modo ligero (apagar animaciones)");
        b.setAttribute("title", on ? "Volver a versión con animaciones" : "Modo ligero (apagar animaciones)");
    }
    if (persist) { try { localStorage.setItem("cantoral-lite", on ? "1" : "0"); } catch (e) {} }
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
        if (document.body.classList.contains("lite")) { setLite(false, true); return; }
        if (modal) openModal(); else setLite(true, true);
    });
    if (modal) {
        document.getElementById("liteCancelBtn")?.addEventListener("click", (e) => { e.stopPropagation(); closeModal(); });
        document.getElementById("liteConfirmBtn")?.addEventListener("click", (e) => { e.stopPropagation(); setLite(true, true); closeModal(); });
        modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    }
})();

(function wireInstall() {
    const fab = document.getElementById("installBtn");
    if (!fab) return;
    const iosModal = document.getElementById("iosInstallModal");

    const standalone = window.matchMedia("(display-mode: standalone)").matches
        || window.navigator.standalone === true;
    if (standalone) return; 

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    let deferred = null;

    function reveal() {
        const intro = document.getElementById("welcomeIntro");
        if (intro && intro.offsetParent !== null &&
            getComputedStyle(intro).display !== "none") {
            setTimeout(reveal, 600);
            return;
        }
        fab.hidden = false;
    }

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferred = e;
        reveal();
    });
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
        openIos();
    });

    document.getElementById("iosInstallCloseBtn")
        ?.addEventListener("click", (e) => { e.stopPropagation(); closeIos(); });
    iosModal?.addEventListener("click", (e) => { if (e.target === iosModal) closeIos(); });

    window.addEventListener("appinstalled", () => { fab.hidden = true; deferred = null; });
})();

nextBtn.addEventListener("click", goNextPage);
prevBtn.addEventListener("click", goPrevPage);

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") goNextPage();
    else if (e.key === "ArrowLeft") goPrevPage();
    else if (e.key === "Escape") closeSearch();
});


const searchBtn     = document.querySelector("#searchBtn");
const searchOverlay = document.querySelector("#searchOverlay");
const searchInput   = document.querySelector("#searchInput");
const searchClear   = document.querySelector("#searchClear");
const searchResults = document.querySelector("#searchResults");


const SECTION_BY_KEY = new Map(
    DATA.sections.map(sec => [sec.key, {
        label: sec.label,
        aliases: SECTION_ALIASES[sec.key] || [sec.key],
        from: sec.songRange[0],
        to: sec.songRange[1]
    }])
);

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

function phon(s) {
    let t = norm(s);
    if (!t) return "";
    t = t
        .replace(/ph/g, "f")
        .replace(/qu/g, "k")           
        .replace(/gu([ei])/g, "g$1")   
        .replace(/g([ei])/g, "j$1")    
        .replace(/c([ei])/g, "s$1")    
        .replace(/[cqk]/g, "k")        
        .replace(/z/g, "s")            
        .replace(/v/g, "b")            
        .replace(/w/g, "b")
        .replace(/ll/g, "y")           
        .replace(/h/g, "")             
        .replace(/x/g, "s")
        .replace(/(.)\1+/g, "$1")      
        .replace(/s\b/g, "");          
    return t.trim();
}

function fuzzyMatch(a, b) {
    a = norm(a); b = norm(b);
    if (!a || !b) return false;
    if (a === b) return true;
    const shortest = Math.min(a.length, b.length);
    if (shortest >= 3 && (b.startsWith(a) || a.startsWith(b))) return true;
    if (shortest >= 4 && (b.includes(a) || a.includes(b))) return true;

    const pa = phon(a), pb = phon(b);
    if (pa && pa === pb) return true;                       

    const longest = Math.max(a.length, b.length);
    const threshold = longest <= 4 ? 1 : longest <= 7 ? 2 : longest <= 11 ? 3 : 4;
    if (levenshtein(a, b) <= threshold) return true;
    if (pa && pb && levenshtein(pa, pb) <= threshold) return true;
    return false;
}

function fuzzyPhrase(a, b) {
    const pa = phon(a), pb = phon(b);
    if (!pa || !pb) return false;
    if (pa === pb || pb.includes(pa)) return true;
    const longest = Math.max(pa.length, pb.length);
    return levenshtein(pa, pb) <= Math.min(5, Math.max(2, Math.floor(longest * 0.25)));
}

function scoreEntry(entry, qNorm, qWords, qPhon, qWordsPhon) {
    let score = 0;
    const { titleN, lyricsN, titleP, lyricsP, titleWords, lyricWords, titleWordsP, lyricWordsP } = entry;
    const section = entry.section;
    const sectionN = section ? norm(section.label) : "";
    const sectionAliases = section ? section.aliases : [];

    if (sectionN && qNorm.includes(sectionN)) score += 20;
    for (const alias of sectionAliases) { if (qNorm.includes(alias)) { score += 18; break; } }
    if (titleN.includes(qNorm))  score += 12;
    else if (qPhon && titleP.includes(qPhon)) score += 9;      
    else if (qWords.length > 1 && fuzzyPhrase(qNorm, titleN)) score += 8;
    if (lyricsN.includes(qNorm)) score += 8;
    else if (qPhon && lyricsP.includes(qPhon)) score += 6;     

    for (let i = 0; i < qWords.length; i++) {
        const word = qWords[i];
        if (word.length < 3) continue;
        const wp = qWordsPhon[i];

        if (sectionN.includes(word)) score += 6;
        for (const alias of sectionAliases) { if (alias.includes(word) || word.includes(alias)) { score += 5; break; } }
        for (const alias of sectionAliases) { if (fuzzyMatch(word, alias)) { score += 4; break; } }

        if (titleN.includes(word)) score += 4;
        else if (wp && titleWordsP.some(tw => tw === wp)) score += 3;          
        else if (titleWords.some(tw => fuzzyMatch(word, tw))) score += 3;      

        if (lyricsN.includes(word)) score += 2;
        else if (wp && lyricWordsP.some(lw => lw === wp)) score += 1.5;
        else if (lyricWords.some(lw => fuzzyMatch(word, lw))) score += 1;
    }
    return score;
}

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
        const section = getSectionForSong(songNum, c.section);
        const lyrics = lyricsArr.join(" ");
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

let CORPUS = null;
function ensureCorpus() { if (!CORPUS) CORPUS = buildCorpus(); return CORPUS; }
(window.requestIdleCallback || (cb => setTimeout(cb, 1)))(ensureCorpus, { timeout: 3000 });

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
    ensureCorpus();                          
    renderResults(localSearch(q), false);
    searchTimeout = window.setTimeout(() => aiSearch(q), 600);
});


function indexLocation() {
    ensureIndexBuilt();   
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
    if (document.body.classList.contains("tour-on")) return;   
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

const backToStart = document.getElementById("backToStart");
if (backToStart) backToStart.addEventListener("click", (e) => {
    e.stopPropagation();
    cancelBookCloseFx();   
    goToPage(1);
});

document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".guide-btn");
    if (!b) return;
    e.stopPropagation();
    if (window.__openGuide) window.__openGuide(b);
});

(function wireGuide() {
    const m = document.getElementById("guideModal");
    if (!m) return;
    const pop = m.querySelector(".guide-pop");
    const close = () => { m.classList.remove("show"); m.setAttribute("aria-hidden", "true"); };
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
        e.stopPropagation();                              
        const h = getHand() === "zurdo" ? "diestro" : "zurdo";
        try { localStorage.setItem(HAND_KEY, h); } catch (er) {}
        applyHand(h);
    });
    applyHand(getHand());
    window.__openGuide = (btn) => {
        if (pop && btn && btn.getBoundingClientRect) {
            const r = btn.getBoundingClientRect();
            pop.style.right = Math.max(4, Math.round(window.innerWidth - r.left)) + "px";
            pop.style.bottom = Math.max(4, Math.round(window.innerHeight - r.top + 4)) + "px";
        }
        m.classList.add("show");
        m.setAttribute("aria-hidden", "false");
    };
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
    const pid = SONG_TO_PAPER[songNumber];
    if (pid) {
        const p = document.getElementById(pid);
        if (p) { const i = papers.indexOf(p); if (i >= 0) return i + 1; }
    }
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
    const measure = targets[0];
    { const frag = document.createDocumentFragment(); for (const it of items) frag.appendChild(it); measure.appendChild(frag); }
    const availH = measure.clientHeight;   
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
                prev.removeChild(last);
                current.appendChild(last);
                used = last.offsetHeight + 8;   
            } else {
                used = 0;
            }
        }
        current.appendChild(item);   
        used += adv;
    }
    indexPapers.forEach((p, i) => { if (p) p.style.display = savedDisplay[i]; });
}

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
        if (idx < currentLocation - 1) currentLocation--;
    }
    maxLocation = papers.length;   
    papers.forEach((p, i) => { p.style.zIndex = papers.length - i; });
    setPagesState();
    updatePaperVisibility();
    refitVisible();
}
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

let __tapMoved = false, __tapX = 0, __tapY = 0;
document.addEventListener("touchstart", (e) => {
    const t = e.touches && e.touches[0];
    if (t) { __tapX = t.clientX; __tapY = t.clientY; __tapMoved = false; }
}, { passive: true });
document.addEventListener("touchmove", (e) => {
    const t = e.touches && e.touches[0];
    if (t && (Math.abs(t.clientX - __tapX) > 10 || Math.abs(t.clientY - __tapY) > 10)) __tapMoved = true;
}, { passive: true });

function applyVariant(page, variant) {
    if (!page || !variant) return;
    page.dataset.activeVariant = variant;
    page.querySelectorAll(".variant-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.variant === variant);
    });
}
document.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest(".variant-btn");
    if (!btn) return;
    e.preventDefault();
    applyVariant(btn.closest("[data-active-variant]"), btn.dataset.variant);
});
document.addEventListener("touchend", (e) => {
    if (!e.changedTouches || !e.changedTouches.length) return;
    const btns = document.querySelectorAll("[data-active-variant] .variant-btn");
    if (!btns.length) return;
    const tp = e.changedTouches[0], x = tp.clientX, y = tp.clientY;
    let best = null, bestD = Infinity;
    btns.forEach((b) => {
        const r = b.getBoundingClientRect();
        if (r.width < 2) return;                        
        const dx = Math.max(r.left - x, 0, x - r.right);
        const dy = Math.max(r.top - y, 0, y - r.bottom);
        const d = Math.hypot(dx, dy);
        if (d < bestD) { bestD = d; best = b; }
    });
    if (!best || bestD > 14) return;                    
    e.preventDefault();
    applyVariant(best.closest("[data-active-variant]"), best.dataset.variant);
}, { passive: false });

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
}
function closeMenu() {
    clearTimeout(menuCloseTimer);
    topControls.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
    closeShareCloud();          
}
function toggleMenu() {
    if (topControls.classList.contains("menu-open")) closeMenu();
    else openMenu();
}
if (menuBtn && topControls) {
    menuBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
    document.addEventListener("pointerdown", (e) => {
        if (document.body.classList.contains("tour-on")) return;
        if (topControls.classList.contains("menu-open") && !topControls.contains(e.target)) closeMenu();
    });
    document.querySelector("#indexBtn")?.addEventListener("click", () => closeMenu());
    document.querySelector("#dictBtn")?.addEventListener("click", () => closeMenu());
    document.querySelector("#searchBtn")?.addEventListener("click", () => closeMenu());
}

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
document.querySelector("#qrClose")?.addEventListener("click", closeQR);
qrModal?.addEventListener("click", (e) => { if (e.target === qrModal) closeQR(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && qrModal?.classList.contains("show")) closeQR(); });

(function setupSwipe() {
    const SWIPE_MIN_X = 60;
    const SWIPE_MAX_Y = 45;
    const SWIPE_RATIO = 1.7;
    const SWIPE_MAX_MS = 600;
    let startX = 0, startY = 0, startT = 0, tracking = false, cancelled = false;
    document.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) { tracking = false; return; }
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

(function setupStarfield() {
    const root = document.getElementById("starfield");
    if (!root) return;
    const bandTop = root.querySelector(".sf-top");
    const bandBottom = root.querySelector(".sf-bottom");
    if (!bandTop || !bandBottom) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let active = false, shootTimer = null, built = false, rsTimer = null;

    function shadows(n, w, P, near) {
        const out = [];
        for (let i = 0; i < n; i++) {
            const x = Math.round(Math.random() * w);
            const y = Math.round(Math.random() * P);
            const z = Math.random();                                     
            const spread = (near ? 0.3 + z * 0.9 : z * 0.6).toFixed(2);  
            const glow = near && Math.random() < 0.10;                   
            const blur = glow ? (2 + Math.random() * 2.5).toFixed(1) : "0";
            const a = (near ? 0.6 + z * 0.4 : 0.32 + z * 0.42).toFixed(2);
            const col = glow ? "rgba(200,222,255," + a + ")" : "rgba(255,255,255," + a + ")";
            out.push(x + "px " + y + "px " + blur + "px " + spread + "px " + col);
            out.push(x + "px " + (y - P) + "px " + blur + "px " + spread + "px " + col);
        }
        return out.join(",");
    }

    function buildBand(el) {
        const B = Math.max(el.clientHeight, 1);
        if (el._sfH === B && el.querySelector(".sf-layer")) return;
        el._sfH = B;
        el.querySelectorAll(".sf-layer").forEach(n => n.remove());
        const w = Math.max(el.clientWidth, window.innerWidth);
        if (B < 8) return;                 
        const P = Math.max(B, 240);        
        const nFar = Math.min(210, Math.max(12, Math.round(w * P * 0.00028)));
        const nNear = Math.min(120, Math.max(6, Math.round(w * P * 0.00016)));

        const far = document.createElement("div");
        far.className = "sf-layer";
        far.style.setProperty("--tile", P + "px");
        far.style.boxShadow = shadows(nFar, w, P, false);
        far.style.animationDuration = (reduce ? "0s" : "170s") + ",4s";  

        const near = document.createElement("div");
        near.className = "sf-layer sf-near";
        near.style.setProperty("--tile", P + "px");
        near.style.boxShadow = shadows(nNear, w, P, true);
        near.style.animationDuration = (reduce ? "0s" : "115s") + ",3s";
        near.style.animationDelay = "0s,-1.3s";

        el.appendChild(far);
        el.appendChild(near);
    }

    function layout() {
        const bookEl = document.getElementById("book");
        const vh = window.innerHeight;
        let topH = Math.round(vh * 0.15), botStart = Math.round(vh * 0.83); 
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

    function spawnShoot(band) {
        const bw = band.clientWidth, bh = band.clientHeight;
        if (bh < 14) return;
        const dir = Math.random() < 0.5 ? 1 : -1;                  
        const dist = 220 + Math.random() * 170;                   
        const angle = (6 + Math.random() * 11) * Math.PI / 180;   
        const dx = dir * dist, dy = dist * Math.tan(angle);       
        const deg = Math.atan2(dy, dx) * 180 / Math.PI;           
        const startX = dir > 0 ? Math.random() * bw * 0.35 : bw * 0.65 + Math.random() * bw * 0.35;
        const startY = 3 + Math.random() * Math.max(2, bh * 0.35);
        const s = document.createElement("div");
        s.className = "sf-shoot";
        s.style.left = startX + "px";
        s.style.top = startY + "px";
        band.appendChild(s);
        const dur = 680 + Math.random() * 380;                    
        s.animate([
            { transform: "translate(0,0) rotate(" + deg + "deg)", opacity: 0, offset: 0 },
            { opacity: 1, offset: 0.1 },
            { opacity: 1, offset: 0.8 },
            { transform: "translate(" + dx + "px," + dy + "px) rotate(" + deg + "deg)", opacity: 0, offset: 1 }
        ], { duration: dur, easing: "linear" }).onfinish = () => s.remove();   
    }
    function scheduleShoot() {
        clearTimeout(shootTimer);
        if (!active || reduce) return;
        const gap = 3200 + Math.random() * 5800;
        shootTimer = setTimeout(() => {
            if (!active || document.hidden) return;
            const useBottom = bandBottom.clientHeight >= 20 && Math.random() < 0.4;
            spawnShoot(useBottom ? bandBottom : bandTop);
            scheduleShoot();
        }, gap);
    }

    function start() {
        active = true;
        root.style.opacity = "1";
        if (!built) layout();
        root.classList.add("sf-run");   
        scheduleShoot();
        setTimeout(() => { if (active) layout(); }, 400);
    }
    function stop() {
        active = false;
        root.style.opacity = "0";
        root.classList.remove("sf-run");  
        clearTimeout(shootTimer); shootTimer = null;
    }

    window.addEventListener("resize", () => { if (!active) return; clearTimeout(rsTimer); rsTimer = setTimeout(layout, 180); });
    window.addEventListener("orientationchange", () => { if (!active) return; setTimeout(layout, 220); });
    document.addEventListener("visibilitychange", () => {
        if (!active) return;
        if (document.hidden) clearTimeout(shootTimer);
        else scheduleShoot();
    });

    window.__starfield = {
        update(isDark) {
            if (isDark && !document.body.classList.contains("gestures-on")) start();
            else stop();
        },
        relayout() { if (active) layout(); }
    };
    if (document.body.classList.contains("dark-mode")) start();
})();

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
    const __bookEl = document.getElementById("book");
    document.addEventListener("touchend", (e) => {
        if (__tapMoved) return;
        const stage = document.querySelector(".paper.onstage .page-content-wrap");
        if (!stage) return;
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
        if (!target) return;                          
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
    enhance(document.body);

    function preloadDiagrams() {
        CHORD_LIBRARY.forEach((url) => {
            loadSvg(encodeURI(url).replace(/#/g, "%23")).catch(() => {});
        });
    }
    if ("requestIdleCallback" in window) requestIdleCallback(preloadDiagrams, { timeout: 4000 });
    else setTimeout(preloadDiagrams, 2500);
})();

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

(function setupPlumeriaScenes(){
    const SUNSETS = [
        "linear-gradient(180deg, #5b6aa8 0%, #c98aad 34%, #ff9d7a 60%, #ffb057 82%, #ffcf7a 100%)", 
        "linear-gradient(180deg, #6d6fae 0%, #d68f9e 34%, #ff9b6a 60%, #ff9f52 82%, #ffc266 100%)", 
        "linear-gradient(180deg, #7a5f9c 0%, #e0899f 34%, #ff8f72 60%, #ff9a4f 82%, #ffbe6b 100%)", 
        "linear-gradient(180deg, #4f6bb0 0%, #b98bb6 34%, #f79a86 60%, #ffab5e 82%, #ffd089 100%)", 
        "linear-gradient(180deg, #8a6bab 0%, #e79aa0 34%, #ffa878 60%, #ffbc63 82%, #ffdc8e 100%)", 
        "linear-gradient(180deg, #63709f 0%, #cf95a4 34%, #ff9a72 60%, #ff8f45 82%, #ffb35c 100%)", 
        "linear-gradient(180deg, #7e6aa2 0%, #d98fae 34%, #ff9e88 60%, #ffab5a 82%, #ffc978 100%)", 
        "linear-gradient(180deg, #93739e 0%, #e6a08c 34%, #ffab6f 60%, #ffb85c 82%, #ffd583 100%)", 
        "linear-gradient(180deg, #586bad 0%, #c58ea8 34%, #ff9f7c 60%, #ffae5c 82%, #ffcf82 100%)", 
        "linear-gradient(180deg, #6f5f9e 0%, #d287a1 34%, #f89a84 60%, #ff9d55 82%, #ffc06f 100%)", 
        "linear-gradient(180deg, #8f6db4 0%, #eb9fab 34%, #ffaa82 60%, #ffbe70 82%, #ffd98a 100%)", 
        "linear-gradient(180deg, #4a6ea8 0%, #b58aa8 34%, #f2977f 60%, #ff9a52 82%, #ffbf6d 100%)", 
        "linear-gradient(180deg, #7a2f5e 0%, #c0335a 34%, #ff5a3c 60%, #ff7e2e 82%, #ffb347 100%)", 
        "linear-gradient(180deg, #2b2a5e 0%, #4a3a7a 34%, #7d4a86 60%, #b5567a 82%, #e8825e 100%)", 
        "linear-gradient(180deg, #8ea6d8 0%, #d9a7cf 34%, #ffc3c0 60%, #ffd9b0 82%, #fff0cf 100%)", 
        "linear-gradient(180deg, #3f6d7a 0%, #5f9a8c 34%, #9fbf7e 60%, #e8c56b 82%, #ffd98a 100%)"  
    ];
    const isRainyDay = Math.random() < 0.10;
    const sunsetBg = SUNSETS[Math.floor(Math.random() * SUNSETS.length)];
    try { 
        sessionStorage.removeItem("plumeria-rainy");
        sessionStorage.removeItem("plumeria-sunset-idx");
    } catch(e) {}

function setupPlumeria(cfg){
    const stage = cfg.stage;
    const sky   = cfg.sky;
    const page  = cfg.page;
    const paper = cfg.paper || null;
    const overlay = cfg.overlay || null; 
    const SID   = cfg.id || "";     
    if (!stage) return;
    const sceneVisible = () => overlay
        ? overlay.classList.contains("show")
        : (!paper || (paper.style.display !== "none" && paper.classList.contains("near")));
    let resumeFireflies = () => {}; 

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
    if(overlay)for(let x=-1050;x<-12;x+=r(30,48))groundBack.push(grassBlade(x,top+r(-4,9),r(20,46),r(-11,11),Math.random()<0.5?"gBlade":"gBlade2"));
    for(let x=-12;x<1015;x+=r(14,24))groundBack.push(grassBlade(x,top+r(-4,9),r(20,46),r(-11,11),Math.random()<0.5?"gBlade":"gBlade2"));
    if(overlay)for(let x=1015;x<2050;x+=r(30,48))groundBack.push(grassBlade(x,top+r(-4,9),r(20,46),r(-11,11),Math.random()<0.5?"gBlade":"gBlade2"));
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
    svgMarkup=`<svg viewBox="0 0 1000 1300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Árbol de flor de mayo">${defs}<g class="groundg" id="groundBack">${groundBack.join("")}</g><g id="sway"><g id="branchLayer">${branchParts.join("")}</g><g id="canopySway"><g class="leaf-canopy">${backLeaves.join("")}</g><g class="flower-canopy">${flowerParts.join("")}</g><g class="leaf-canopy">${frontLeaves.join("")}</g></g>${nestMarkup}</g><g class="groundg" id="groundFront">${groundFront.join("")}</g></svg>`;
    if (SID) {
        const defIds = ["bark","gLeafB","gLeafM","gLeafF","gW","gY","gP","gM","gR","gO","gS","gPe","gL","gC","gF","center","gGrass","gBlade","gBlade2","gBush","gBushHi"];
        defIds.forEach(id => {
            svgMarkup = svgMarkup.split(`id="${id}"`).join(`id="${SID}_${id}"`)
                                 .split(`url(#${id})`).join(`url(#${SID}_${id})`);
        });
    }
    }
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
        const _wrap=sky.parentNode;
        moonEl.style.top=(2+Math.random()*22).toFixed(1)+"%";
        moonEl.style.left=(4+Math.random()*74).toFixed(1)+"%";
        moonEl.style.right="auto";
        _wrap.appendChild(moonEl);
    }
    buildMoon();
    (function buildMountains(){
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
const fireflyColors=[];
const cGreenYellow=["#a8ff44","#c6ff3a","#d4ff5a","#e8ff6a","#bfff30","#dcff50"];
const cOrangeRed=["#ff8a3c","#ff6030","#ff4f2a","#ffae57","#f46a32","#ff7742"];
const cWhite=["#ffffff","#fff8e8","#faf4ff","#fffdf0"];
for(let i=0;i<50;i++) fireflyColors.push(Math.random()<0.50?pick(cGreenYellow):Math.random()<0.636?pick(cOrangeRed):pick(cWhite));
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
        vx:r(-5,5), vy:r(-4,4),
        lit:true,
        litTimer:r(1.5,4),
        darkDurations:[1,2,2.5],
        darkIdx:ri(0,2),
        phase:r(0,10),
        op:0,        
        sz
    });
}
let lastFireflyTime=0,ffRunning=false;
function tickFireflies(ts){
    if(!document.body.classList.contains("dark-mode") || !sceneVisible() || sky.offsetParent===null
       || document.body.classList.contains("gestures-on")){   
        lastFireflyTime=0; ffRunning=false; return;
    }
    if(document.body.classList.contains("flipping")){
        lastFireflyTime=0; requestAnimationFrame(tickFireflies); return;
    }
    if(lastFireflyTime && (ts - lastFireflyTime) < 33){ requestAnimationFrame(tickFireflies); return; }
    if(!lastFireflyTime) lastFireflyTime=ts;
    const dt=Math.min((ts-lastFireflyTime)/1000,0.1);
    lastFireflyTime=ts;
    for(const f of fireflies){
        f.phase+=dt;
        f.vx+=r(-8,8)*dt; f.vy+=r(-6,6)*dt;
        const friction=Math.pow(0.85,dt);
        f.vx*=friction; f.vy*=friction;
        const speed=Math.hypot(f.vx,f.vy);
        const maxSpd=10;
        if(speed>maxSpd){f.vx*=maxSpd/speed;f.vy*=maxSpd/speed;}
        f.x+=f.vx*dt; f.y+=f.vy*dt;
        if(f.x<-12) f.vx+=r(12,20)*dt;
        else if(f.x>112) f.vx-=r(12,20)*dt;
        if(f.y<20) f.vy+=r(10,16)*dt;
        else if(f.y>105) f.vy-=r(10,16)*dt;
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
        const targetOp=f.lit?r(0.7,1.0):0;
        const newOp=f.op+(targetOp-f.op)*Math.min(1,dt*3.5);
        f.op=newOp;
        f.el.style.opacity=newOp.toFixed(3);
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
const ffObserver=new MutationObserver(()=>{
    if(document.body.classList.contains("dark-mode")) startFireflies();
});
ffObserver.observe(document.body,{attributes:true,attributeFilter:["class"]});
if(document.body.classList.contains("dark-mode")) startFireflies();}
    let svgCache="",crittersBuilt=false,rasterCache="",rasterizing=false,nestBirdsOverlay="";
    function buildOnce(){if(svgCache)return;build();svgCache=svgMarkup;}
    function buildCrittersOnce(){if(crittersBuilt)return;crittersBuilt=true;buildCritters();}
    function rasterize(cb){
        if(rasterCache){cb(rasterCache);return;}
        if(!svgCache)buildOnce();
        const svg=svgCache
            .replace("<svg ", '<svg width="1000" height="1300" ')
            .replace('<g class="nest-birds">', '<g class="nest-birds" style="display:none">');
        const img=new Image();
        img.onload=function(){
            try{
                // Samsung/Android: textura mas chica = menos teselado del compositor.
                // Antes 2x en DPR>1 daba ~1840x2392; bajamos a 1.5x (~1380x1794).
                const S=0.92, scale=(window.devicePixelRatio||1)>1?1.5:1.25;
                const W=Math.round(1000*S), H=Math.round(1300*S);
                const c=document.createElement("canvas"); c.width=W*scale; c.height=H*scale;
                const ctx=c.getContext("2d"); ctx.scale(scale,scale); ctx.drawImage(img,0,0,W,H);
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
                if(page)page.classList.add("plumeria-grown"); 
            }else{
                console.log("[treebmp] raster FAIL (queda SVG)");
            }
        });
    }
    function unmountSvg(){mountToken++;stage.innerHTML="";}
    const idle=window.requestIdleCallback||(cb=>setTimeout(cb,1));
    if(overlay){
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
        const paperOn=()=>!paper||(paper.style.display!=="none"&&paper.classList.contains("near"));
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
                if(d){resumeFireflies();scheduleGrown();} 
                if(d===last)return;
                last=d;
                if(!d)unmountSvg();
                else requestAnimationFrame(mountSvg);
            });
            mo.observe(paper,{attributes:true,attributeFilter:["style","class"]});
        }
    }
} 

    setupPlumeria({
        stage: document.getElementById("plumeriaStage"),
        sky:   document.getElementById("plumeriaSky"),
        page:  document.querySelector("#pPlumeria .plumeria-page"),
        paper: document.getElementById("pPlumeria"),
        id:    ""   
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


    window.addEventListener("hashchange", () => {
        const targetLoc = getLocationForHash(window.location.hash);
        if (targetLoc !== currentLocation) {
            goToPage(targetLoc);
        }
    });

    const gestureBtn = document.querySelector("#gestureBtn");
    const gestureModal = document.querySelector("#gestureModal");
    const gmStep1 = document.querySelector("#gmStep1");
    const gmStep2 = document.querySelector("#gmStep2");
    const gestureNextBtn = document.querySelector("#gestureNextBtn");   
    const gestureBackBtn = document.querySelector("#gestureBackBtn");   
    const gestureStartBtn = document.querySelector("#gestureStartBtn"); 
    const gestureCancelBtn = document.querySelector("#gestureCancelBtn");

    let gestureActive = false;
    let videoStream = null;
    let videoElement = null;
    let handsInstance = null;
    let animationFrameId = null;
    let processingFrame = false;

    let handHistory = [];        
    let pointHistory = [];       
    let lastPageTime = 0, lastScrollTime = 0, lastZoomTime = 0;
    let lastPageDir = 0;         
    let lastScrollDir = 0;       
    let pinchActive = false, pinchRef = 0, pinchDir = 0;
    const PINCH_STEP = 0.35;     
    const PINCH_ENTER = 0.60;

    const SWIPE_MIN = 0.18;        
    const SWIPE_CROSS_MAX = 0.14;  
    const SWIPE_TIME_LIMIT = 900;
    const PAGE_COOLDOWN = 1200;    
    const PAGE_REVERSE_LOCK = 1800; 
    const SCROLL_MIN = 0.09;       
    const SCROLL_COOLDOWN = 550;   
    const SCROLL_REVERSE_LOCK = 900; 
    const ZOOM_COOLDOWN = 350;

    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function fingersUp(lm) {
        const w = lm[0];
        const up = (tip, pip) => dist(lm[tip], w) > dist(lm[pip], w) * 1.05;
        return { index: up(8, 6), middle: up(12, 10), ring: up(16, 14), pinky: up(20, 18) };
    }

    function classifyPose(lm, f) {
        if (f.index && f.middle && f.ring && f.pinky) return "palm";
        if (f.ring || f.pinky) return "none";
        const handSize = dist(lm[0], lm[9]) || 0.0001;
        const pinchRatio = dist(lm[4], lm[8]) / handSize;   
        if (pinchActive) return "pinch";
        if (pinchRatio < PINCH_ENTER) return "pinch";
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

    function gestureScroll(dir) {   
        const paper = papers[currentLocation - 1];
        const wrap = paper && paper.querySelector(".page-content-wrap, .dict-content");
        if (!wrap) return false;
        const amount = Math.max(120, wrap.clientHeight * 0.7) * dir;
        wrap.scrollTo({ top: wrap.scrollTop + amount, behavior: "smooth" });
        return true;
    }

    function handleNavSwipe(lm, now) {
        const pt = lm[9];
        const x = pt.x, y = pt.y;
        handHistory = handHistory.filter(h => now - h.time < SWIPE_TIME_LIMIT);
        handHistory.push({ x, y, time: now });
        if (handHistory.length < 2) return;
        for (const h of handHistory) {
            const dx = x - h.x, dy = y - h.y;
            const adx = Math.abs(dx), ady = Math.abs(dy);
            if (adx > SWIPE_MIN && ady < SWIPE_CROSS_MAX && adx > ady) {
                if (now - lastPageTime < PAGE_COOLDOWN) return;
                const dir = dx > 0 ? 1 : -1;
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

    function handlePointScroll(lm, now) {
        const pt = lm[8];                                   
        const x = pt.x, y = pt.y;
        pointHistory = pointHistory.filter(h => now - h.time < SWIPE_TIME_LIMIT);
        pointHistory.push({ x, y, time: now });
        if (pointHistory.length < 2) return;
        for (const h of pointHistory) {
            const dx = x - h.x, dy = y - h.y;
            const adx = Math.abs(dx), ady = Math.abs(dy);
            if (ady > SCROLL_MIN && adx < SWIPE_CROSS_MAX && ady > adx) {
                if (now - lastScrollTime < SCROLL_COOLDOWN) return;
                const dir = dy < 0 ? 1 : -1;   
                if (dir !== lastScrollDir && now - lastScrollTime < SCROLL_REVERSE_LOCK) {
                    pointHistory = [];
                    return;
                }
                pointHistory = []; lastScrollTime = now; lastScrollDir = dir;
                if (dir > 0) { showScrollFeedback("down"); gestureScroll(1); }
                else { showScrollFeedback("up"); gestureScroll(-1); }
                return;
            }
        }
    }

    function resetPinch() { pinchActive = false; pinchDir = 0; }

    function handlePinchZoom(lm, now) {
        const handSize = dist(lm[0], lm[9]) || 0.0001;
        const ratio = dist(lm[4], lm[8]) / handSize;
        if (!pinchActive) { pinchActive = true; pinchRef = ratio; pinchDir = 0; return; }

        if (pinchDir === 0) {                          
            const d0 = ratio - pinchRef;
            if (Math.abs(d0) < PINCH_STEP) return;
            pinchDir = d0 > 0 ? 1 : -1;
        }
        const signed = pinchDir * (ratio - pinchRef);  
        if (signed >= PINCH_STEP) {
            if (now - lastZoomTime >= ZOOM_COOLDOWN) {  
                lastZoomTime = now;
                if (pinchDir > 0) { if (window.__cantoralZoom && window.__cantoralZoom(1)) showZoomFeedback("in"); }
                else { if (window.__cantoralZoom && window.__cantoralZoom(-1)) showZoomFeedback("out"); }
                pinchRef = ratio;
            }
        } else if (signed < 0) {
            pinchRef = ratio;                          
        }
    }

    function processHandLandmarks(landmarks) {
        const now = Date.now();
        const f = fingersUp(landmarks);
        const pose = classifyPose(landmarks, f);

        if (pose !== "palm") handHistory = [];
        if (pose !== "point") pointHistory = [];
        if (pose !== "pinch") resetPinch();

        switch (pose) {
            case "palm":                       
                handleNavSwipe(landmarks, now);
                break;
            case "point":                      
                handlePointScroll(landmarks, now);
                break;
            case "pinch":                      
                handlePinchZoom(landmarks, now);
                break;
        }
    }

    function onHandResults(results) {
        const detected = !!(results && results.multiHandLandmarks && results.multiHandLandmarks.length > 0);
        const pc = document.getElementById("gesturePreview");
        if (pc) pc.classList.toggle("hand-detected", detected);
        if (detected) {
            processHandLandmarks(results.multiHandLandmarks[0]);
        } else {
            handHistory = []; pointHistory = []; resetPinch();
        }
    }

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
        if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast("La cámara necesita HTTPS 🔒");
            gestureBtn.classList.remove("active");
            gestureActive = false;
            return;
        }

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
            videoStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user", 
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
                    modelComplexity: 0, 
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
            document.body.classList.add("gestures-on");
            if (window.__starfield) window.__starfield.update(false);
            showToast("Control gestual activo ✋. Pasa tu mano.");
            lastDetectTs = 0;          
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
        showGestureStep(1);            
        gestureModal.classList.add("show");
        gestureModal.setAttribute("aria-hidden", "false");
    }
    function closeGestureModal() {
        gestureModal.classList.remove("show");
        gestureModal.setAttribute("aria-hidden", "true");
    }

    if (gestureBtn) {
        gestureBtn.addEventListener("click", () => {
            showToast("Gestos próximamente ✋", { key: "gestos", duration: 1600 });
        });
    }
    if (gestureNextBtn) gestureNextBtn.addEventListener("click", () => showGestureStep(2));
    if (gestureBackBtn) gestureBackBtn.addEventListener("click", () => showGestureStep(1));
    if (gestureStartBtn) gestureStartBtn.addEventListener("click", () => {
        closeGestureModal();
        turnOnGestures();
    });
    if (gestureCancelBtn) gestureCancelBtn.addEventListener("click", closeGestureModal);

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

(function setupScreenGates() {
    function isMobileDevice() {
        var shortSide = Math.min(window.innerWidth, window.innerHeight);
        var touch = (navigator.maxTouchPoints || 0) > 0
            || window.matchMedia("(any-pointer: coarse)").matches;
        return shortSide <= 900 || touch;
    }


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

    function checkAll() {
        checkOrientation();
        checkDesktopGate();
    }

    checkAll();
    window.addEventListener("resize", checkAll);
    window.addEventListener("orientationchange", function () { setTimeout(checkAll, 120); });
})();

(function initFontScale() {
    const STORAGE_KEY = "cantoral-font-scale";
    const MIN = 0.90;
    const MAX = 1.35;   
    const STEP = 0.05;
    const EPS  = 0.001;

    const widget  = document.getElementById("fontControls");   
    const svg     = document.getElementById("zoomSlider");
    const btnDown = document.getElementById("fontDown");
    const btnUp   = document.getElementById("fontUp");
    const hit     = document.getElementById("fontTrack");   
    const thumb   = document.getElementById("fontThumb");
    const fill    = document.getElementById("fontFill");    
    if (!widget || !svg || !btnDown || !btnUp || !hit || !thumb || !fill) return;

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

    window.__cantoralZoom = function (dir) {
        const prev = scale;
        scale = Math.min(MAX, Math.max(MIN, +(scale + dir * STEP).toFixed(2)));
        if (Math.abs(scale - prev) < EPS) return false;
        apply();
        return true;
    };

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
        document.body.classList.add("font-slider-open");   
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

    window.__closeFontSlider = close;

    const overlayAA = document.getElementById("overlayAA");
    if (overlayAA) {
        overlayAA.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isOpen()) close(); else open();
        });
    }

    document.addEventListener("click", (e) => {
        const t = e.target.closest && e.target.closest(".zoom-toggle");
        if (!t) return;
        e.preventDefault();
        e.stopPropagation();
        if (isOpen()) close(); else open();
    });

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

    function beginDrag(clientX) {
        dragging = true;
        widget.classList.add("dragging");
        scale = scaleFromClientX(clientX);
        apply();
    }

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

    function insideWidget(el) {
        return widget.contains(el) || (el.closest && el.closest(".zoom-toggle"));
    }

    widget.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: false });
    widget.addEventListener("touchmove", (e) => {
        e.stopPropagation();
        if (dragging && e.touches.length) {
            e.preventDefault();
            scale = scaleFromClientX(e.touches[0].clientX);
            apply();
        }
    }, { passive: false });

    document.addEventListener("touchstart", (e) => {
        if (!isOpen()) return;
        if (insideWidget(e.target)) return;
        e.preventDefault();
        close();
    }, { passive: false });

    document.addEventListener("click", (e) => {
        if (!isOpen()) return;
        if (insideWidget(e.target)) return;
        e.stopPropagation();
        close();
    }, true);

    apply();
})();

(function initTextStyles() {
    const TOGGLES = [
        { id: "styleBold",   cls: "song-bold",   key: "cantoral-style-bold" },
        { id: "styleItalic", cls: "song-italic", key: "cantoral-style-italic" },
    ];

    TOGGLES.forEach(t => {
        const btn = document.getElementById(t.id);
        if (!btn) return;

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

(function initTitleUnderlineToggle() {
    const KEY = "cantoral-title-underline";
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

(function initManualScroll() {
    let target = null;      
    let hasWrap = false;    
    let inBook = false;     
    let startX = 0, startY = 0, startScroll = 0;
    let axis = null;        

    document.addEventListener("touchstart", (e) => {
        target = null; hasWrap = false; inBook = false; axis = null;
        if (e.touches.length !== 1) return;
        if (!(e.target.closest && e.target.closest(".paper"))) return;
        inBook = true;
        const wrap = e.target.closest(".page-content-wrap, .dict-content, .index-content, .search-results");
        hasWrap = !!wrap;                 
        if (wrap && wrap.scrollHeight > wrap.clientHeight) {
            target = wrap;
            startScroll = wrap.scrollTop;
        }
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
        if (!inBook || e.touches.length !== 1) return;
        if (!hasWrap) return;
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if (!axis) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;   
            axis = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
        }
        if (axis === "h") return;            
        if (Math.abs(dy) < 8) return;        
        e.preventDefault();
        if (target) target.scrollTop = startScroll - dy;
    }, { passive: false });

    const clear = () => { target = null; hasWrap = false; inBook = false; axis = null; };
    document.addEventListener("touchend", clear, { passive: true });
    document.addEventListener("touchcancel", clear, { passive: true });
})();

(function initWheelScroll() {
    document.addEventListener("wheel", (e) => {
        if (e.ctrlKey) return;                         
        if (!e.target.closest || !e.target.closest(".paper")) return;  
        let wrap = e.target.closest(".page-content-wrap, .dict-content, .index-content");
        if (!wrap || wrap.scrollHeight <= wrap.clientHeight) {
            const paper = papers[currentLocation - 1];
            wrap = paper && paper.querySelector(".page-content-wrap, .dict-content, .index-content");
        }
        if (!wrap || wrap.scrollHeight <= wrap.clientHeight) return;   
        const factor = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? wrap.clientHeight : 1);
        wrap.scrollTop += e.deltaY * factor;
        e.preventDefault();
    }, { passive: false });
})();

(function disablePinchZoom() {
    ["gesturestart", "gesturechange", "gestureend"].forEach(name => {
        document.addEventListener(name, e => e.preventDefault(), { passive: false });
    });

    document.addEventListener("touchmove", e => {
        if (e.touches && e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    document.addEventListener("wheel", e => {
        if (e.ctrlKey) e.preventDefault();
    }, { passive: false });

    let lastTap = 0;
    document.addEventListener("touchend", e => {
        const now = Date.now();
        if (now - lastTap < 300 && e.touches.length === 0) {
            e.preventDefault();
        }
        lastTap = now;
    }, { passive: false });
})();




(function initFontPicker() {
    const STORAGE_KEY = "cantoral-font";
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
        if (!SYSTEM_FONTS.has(saved)) ensureGoogleFonts();
    }

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
        root.setProperty("--chord-font", HAND_FONTS.has(f.name) ? CHORD_FALLBACK : f.family);
        localStorage.setItem(STORAGE_KEY, f.name);
        picker.querySelectorAll(".font-picker-option").forEach((o, i) => {
            o.classList.toggle("active", i === idx);
        });
    }

    function isOpen()    { return !picker.classList.contains("hidden"); }

    function positionPicker() {
        const tc = document.getElementById("topControls");
        if (!tc) return;
        const tcr = tc.getBoundingClientRect();
        const br = btn.getBoundingClientRect();
        const pw = picker.offsetWidth;                 
        const btnCenter = br.left + br.width / 2;
        let rightPx = tcr.right - (btnCenter + pw / 2);
        rightPx = Math.max(4, Math.round(rightPx));    
        picker.style.right = rightPx + "px";
    }

    function openPicker() {
        ensureGoogleFonts();   
        positionPicker();
        picker.classList.remove("hidden");
        btn.classList.add("fp-open");      
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

    window.addEventListener("resize", () => { if (isOpen()) positionPicker(); });

    function isOutside(target) { return !picker.contains(target) && target !== btn; }

    document.addEventListener("click", (e) => {
        if (isOpen() && isOutside(e.target)) closePicker();
    });
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

    function renderEgg(txt) {
        const blocks = txt.split(/\n{2,}/)
            .map((b) => b.replace(/\s*\n\s*/g, " ").trim())
            .filter(Boolean);
        eggText.innerHTML = "";
        blocks.forEach((b, i) => {
            const p = document.createElement("p");
            p.className = "egg-p";
            if (i === 0) p.classList.add("egg-title");                 
            else if (/^["“«]/.test(b)) p.classList.add("egg-quote");   
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

(function initLiturgicalCover() {
    const LIT_COLORS = {
        verde:     ["#aab69f", "#97a78c", "#879979"], 
        moradoAdv: ["#cebfd9", "#bfaccd", "#ac93be"], 
        morado:    ["#ad9cba", "#9c87ab", "#886f9b"], 
        blanco:    ["#fcfcfb", "#f3f2f0", "#e5e4e1"], 
        rojo:      ["#c47468", "#b45549", "#9d3f38"], 
    };
    const TIME_SIL = {
        ordinario:   null,
        adviento:    "assets/siluetaAdviento.svg?v=4",
        navidad:     "assets/siluetaNavidad.svg?v=4",
        cuaresma:    "assets/siluetaCuaresma.svg?v=4",
        pascua:      "assets/siluetaPascua.svg?v=4",
        pentecostes: "assets/siluetaPentecostes.svg?v=9",
    };
    const TIME_COLOR = {
        ordinario: "verde", adviento: "moradoAdv", navidad: "blanco",
        cuaresma: "morado", pascua: "blanco", pentecostes: "rojo",
    };
    const TIME_NAME = {
        ordinario: "Ordinario", adviento: "Adviento", navidad: "Navidad",
        cuaresma: "Cuaresma", pascua: "Pascua", pentecostes: "Pentecostés",
    };
    const OVR_KEY = "cantoral-liturgy-override"; 
    let advTestWeek = null; 

    function easter(y) { 
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
    function adventStartTs(Y) { 
        const xmas = Date.UTC(Y, 11, 25);
        const dow = new Date(xmas).getUTCDay();        
        const delta = dow === 0 ? 7 : dow;             
        return xmas - (delta + 21) * DAY;              
    }
    function adventStart(Y) { return ymd(adventStartTs(Y)); }
    function baptismLord(Y) { 
        const epi = Date.UTC(Y, 0, 6);
        const dow = new Date(epi).getUTCDay();
        const add = dow === 0 ? 1 : (7 - dow) % 7;
        return off(epi, add);
    }

    function computeSeason(Y, M, D) {
        const today = Y * 10000 + M * 100 + D;
        const advN = adventStart(Y);
        if (today >= advN) {
            if (today <= Y * 10000 + 1224) return { time: "adviento", color: "moradoAdv" };
            return { time: "navidad", color: "blanco" };               
        }
        const E = easter(Y);
        const bap = baptismLord(Y);
        const ash = off(E, -46), palm = off(E, -7), gf = off(E, -2),
              east = ymd(E), pent = off(E, 49);
        if (today <= bap) return { time: "navidad", color: "blanco" };  
        if (today < ash) return { time: "ordinario", color: "verde" };  
        if (today === palm) return { time: "cuaresma", color: "rojo" }; 
        if (today === gf) return { time: "cuaresma", color: "rojo" };   
        if (today < east) return { time: "cuaresma", color: "morado" }; 
        if (today < pent) return { time: "pascua", color: "blanco" };   
        if (today === pent) return { time: "pentecostes", color: "rojo" };
        return { time: "ordinario", color: "verde" };                   
    }

    function adventWeek(Y, M, D) {
        const t = Date.UTC(Y, M - 1, D);
        const s1 = adventStartTs(Y);
        if (t < s1 || t > Date.UTC(Y, 11, 24)) return 0;
        return Math.max(1, Math.min(4, Math.floor((t - s1) / (7 * DAY)) + 1));
    }

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

    const coverPage = document.querySelector(".cover-page");
    const coverLiturgy = document.getElementById("coverLiturgy");
    const svgCache = {};
    let curSil = "__init__";
    async function setSilhouette(time, week) {
        [...document.body.classList].forEach((c) => {
            if (c.indexOf("lit-") === 0) document.body.classList.remove(c);
        });
        document.body.classList.add("lit-" + time);

        const src = TIME_SIL[time];
        if (!src) {                                   
            if (coverLiturgy) coverLiturgy.innerHTML = "";
            if (coverPage) coverPage.classList.remove("has-liturgy");
            curSil = "ordinario";
            return;
        }
        if (coverPage) coverPage.classList.add("has-liturgy");
        if (curSil !== time) {                        
            let txt = svgCache[src];
            if (txt == null) {
                try { txt = await fetch(src).then((r) => r.text()); svgCache[src] = txt; }
                catch (e) { return; }
            }
            if (coverLiturgy) coverLiturgy.innerHTML = txt;
            curSil = time;
        }
        if (time === "adviento" && coverLiturgy) {
            const wk = (advTestWeek != null) ? advTestWeek : week; 
            coverLiturgy.querySelectorAll(".flame").forEach((f) => {
                f.classList.toggle("on", (+f.dataset.week) <= wk);
            });
        }
    }

    function getOverride() { try { return localStorage.getItem(OVR_KEY) || "auto"; } catch (e) { return "auto"; } }
    function setOverride(v) { try { v === "auto" ? localStorage.removeItem(OVR_KEY) : localStorage.setItem(OVR_KEY, v); } catch (e) {} }

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
            week = adventWeek(t.Y, t.M, t.D) || 4;
        }
        apply(color);
        setSilhouette(time, week);
        syncTest(ovr, time, color);
    }

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

    const candleBtn = document.getElementById("candleTest");
    const candleNum = document.getElementById("candleTestNum");
    if (candleBtn) {
        candleBtn.addEventListener("click", () => {
            advTestWeek = (advTestWeek % 4) + 1; 
            if (candleNum) candleNum.textContent = advTestWeek;
            const flames = document.querySelectorAll("#coverLiturgy .flame");
            if (getOverride() !== "adviento" || !flames.length) {
                setOverride("adviento");
                refresh();
            } else {
                flames.forEach((f) => f.classList.toggle("on", (+f.dataset.week) <= advTestWeek));
            }
        });
    }

    refresh();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
    setInterval(refresh, 3600000); 
})();


(function setupBackCoverButterflies() {
    var back = document.querySelector("#pCoverBack .front.contraportada");
    if (!back) {
        if ((setupBackCoverButterflies._tries = (setupBackCoverButterflies._tries || 0) + 1) < 120)
            requestAnimationFrame(setupBackCoverButterflies);
        return;
    }

    var N      = 12;    
    var LIFE   = 18;    
    var TURNS  = 3;     
    var RADIUS = 175;   
    var RISE   = 535;   
    var DRIFT  = 360;   

    var TONES = [
        ["#fbf9f2", "#818f74"],
        ["#f4efe1", "#78866b"],
        ["#e8e6d8", "#6f7d63"],
        ["#fdfcf7", "#8b9880"]
    ];

    var r = function (a, b) { return a + Math.random() * (b - a); };
    var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };

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

    var ORB = (LIFE / TURNS).toFixed(2);
    var html = "";

    for (var i = 0; i < N; i++) {
        var rx   = Math.round(RADIUS * r(0.9, 1.1));
        var ry   = Math.round(rx * r(0.28, 0.33));      
        var rise = -Math.round(RISE * r(0.94, 1.06));
        var dx   = Math.round(DRIFT * r(0.9, 1.1));
        var sz   = Math.round(r(33, 47));
        var del  = -(i * (LIFE / N) + r(0, 0.3)).toFixed(2);   
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

    var glow = '<div class="cp-glow" aria-hidden="true"><i></i></div>';

    back.insertAdjacentHTML("beforeend", glow);

    var sky = document.createElement("div");
    sky.className = "cp-sky";
    sky.setAttribute("aria-hidden", "true");
    sky.innerHTML = html;
    back.appendChild(sky);

    var FF_N = 18;
    var FF_COLS = ["#a6c93f", "#bcd24a", "#e0a62e", "#efb43e", "#93c23a"];
    var ffHtml = "";
    for (var j = 0; j < FF_N; j++) {
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

    window.replayBackCover = function () {
        var nodes = back.querySelectorAll(".cp-sky, .cp-sky *, .cp-glow i");
        for (var k = 0; k < nodes.length; k++) {
            if (!nodes[k].getAnimations) return;
            nodes[k].getAnimations().forEach(function (a) { a.cancel(); a.play(); });
        }
    };
})();

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