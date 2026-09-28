// Генеративные «открытки»-обложки в стиле плоских иллюстраций: формы, мордочки, яркие пары цветов.
// Одинаковое название всегда даёт одинаковую обложку.
window.Diary = window.Diary || {};

Diary.covers = (() => {
  const INK = '#1C1B3A';

  // Палитра: голубой #DAF5F9, синий #6077D4, жёлтый #FFE066, малиновый #EC1864, сиреневый #B79CF2.
  // Обложки намеренно остались насыщенными, хотя страницы посветлели: карточки —
  // это то немногое, что должно бить в глаза на светлом фоне.
  const C = { cyan: '#DAF5F9', blue: '#6077D4', sun: '#FFE066', berry: '#EC1864', lilac: '#B79CF2', white: '#FFFFFF' };
  const PALETTES = [
    { bg: C.lilac,  main: C.berry, acc: C.blue,  text: C.berry },
    { bg: C.blue,  main: C.sun,  acc: C.lilac,  text: C.white },
    { bg: C.cyan,  main: C.blue,  acc: C.berry, text: C.blue },
    { bg: C.berry, main: C.lilac,  acc: C.sun,  text: C.white },
    { bg: C.sun,  main: C.blue,  acc: C.white, text: INK },
    { bg: C.white, main: C.berry, acc: C.cyan,  text: C.berry },
    { bg: C.blue,  main: C.cyan,  acc: C.berry, text: C.white },
    { bg: C.lilac,  main: C.blue,  acc: C.sun,  text: INK },
    { bg: C.cyan,  main: C.sun,  acc: C.berry, text: INK },
    { bg: C.berry, main: C.sun,  acc: C.cyan,  text: C.white },
    { bg: C.sun,  main: C.berry, acc: C.lilac,  text: INK },
    { bg: C.white, main: C.blue,  acc: C.lilac,  text: C.blue },
  ];

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const f = (n) => Math.round(n * 10) / 10;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // --- формы ---
  const shape = {
    burst(cx, cy, r, c, n = 8, rot = 0) {
      const pts = [];
      for (let i = 0; i < n * 2; i++) {
        const a = -Math.PI / 2 + rot + (i * Math.PI) / n;
        const rr = i % 2 ? r * 0.55 : r;
        pts.push(`${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="${c}" stroke="${c}" stroke-width="${f(r * 0.2)}" stroke-linejoin="round"/>`;
    },
    flower(cx, cy, r, c, n = 5, center = null, rot = 0) {
      let s = '';
      for (let i = 0; i < n; i++) {
        const a = rot + (i * 2 * Math.PI) / n - Math.PI / 2;
        s += `<circle cx="${f(cx + Math.cos(a) * r * 0.52)}" cy="${f(cy + Math.sin(a) * r * 0.52)}" r="${f(r * 0.48)}" fill="${c}"/>`;
      }
      s += `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.55)}" fill="${c}"/>`;
      if (center) s += `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.24)}" fill="${center}"/>`;
      return s;
    },
    heart(cx, cy, r, c) {
      return `<path transform="translate(${f(cx)} ${f(cy)}) scale(${f(r)})" d="M0 .9C-.35 .62-1 .2-1-.28-1-.66-.72-.95-.38-.95-.18-.95-.05-.84 0-.7.05-.84.18-.95.38-.95.72-.95 1-.66 1-.28 1 .2.35.62 0 .9Z" fill="${c}"/>`;
    },
    sparkle(cx, cy, r, c) {
      return `<path transform="translate(${f(cx)} ${f(cy)}) scale(${f(r)})" d="M0-1Q.14-.14 1 0Q.14.14 0 1Q-.14.14-1 0Q-.14-.14 0-1Z" fill="${c}"/>`;
    },
    ring(cx, cy, r, c) {
      return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.86)}" fill="none" stroke="${c}" stroke-width="${f(r * 0.28)}"/>`;
    },
    cherry(cx, cy, r, c, leaf = '#FFE066') {
      const a = [cx - r * 0.5, cy + r * 0.25], b = [cx + r * 0.55, cy + r * 0.5];
      const top = [cx + r * 0.25, cy - r * 1.0];
      return `<path d="M${f(a[0])} ${f(a[1] - r * 0.4)}Q${f(cx - r * 0.2)} ${f(cy - r * 0.6)} ${f(top[0])} ${f(top[1])}M${f(b[0])} ${f(b[1] - r * 0.4)}Q${f(cx + r * 0.6)} ${f(cy - r * 0.3)} ${f(top[0])} ${f(top[1])}" stroke="${INK}" stroke-width="${f(r * 0.07)}" fill="none" stroke-linecap="round"/>
        <ellipse cx="${f(top[0] + r * 0.28)}" cy="${f(top[1] + r * 0.05)}" rx="${f(r * 0.3)}" ry="${f(r * 0.13)}" transform="rotate(-25 ${f(top[0] + r * 0.28)} ${f(top[1] + r * 0.05)})" fill="${leaf}"/>
        <circle cx="${f(a[0])}" cy="${f(a[1])}" r="${f(r * 0.48)}" fill="${c}"/>
        <circle cx="${f(b[0])}" cy="${f(b[1])}" r="${f(r * 0.42)}" fill="${c}"/>`;
    },
    squiggle(x, y, w, c, amp = 40, sw = 26) {
      const seg = w / 3;
      return `<path d="M${f(x)} ${f(y)}q${f(seg / 2)} ${-amp} ${f(seg)} 0t${f(seg)} 0t${f(seg)} 0" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`;
    },
    arch(x, y, w, h, c) {
      const r = w / 2;
      return `<path d="M${f(x)} ${f(y + h)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h)}Z" fill="${c}"/>`;
    },
    // колючая звезда с острыми лучами
    spiky(cx, cy, r, c, n = 12, inner = 0.5, rot = 0) {
      const pts = [];
      for (let i = 0; i < n * 2; i++) {
        const a = -Math.PI / 2 + rot + (i * Math.PI) / n;
        const rr = i % 2 ? r * inner : r;
        pts.push(`${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="${c}"/>`;
    },
    // звёздочка-астериск из четырёх перекладин
    asterisk(cx, cy, r, c, rot = 0) {
      const w = r * 0.42;
      return [0, 45, 90, 135].map((a) =>
        `<rect x="${f(cx - w / 2)}" y="${f(cy - r)}" width="${f(w)}" height="${f(r * 2)}" rx="${f(w * 0.12)}" fill="${c}" transform="rotate(${f(a + rot)} ${f(cx)} ${f(cy)})"/>`).join('');
    },
    // стопка «камешков»
    pebbles(cx, cy, r, c) {
      return `<ellipse cx="${f(cx)}" cy="${f(cy - r * 0.62)}" rx="${f(r * 0.78)}" ry="${f(r * 0.3)}" fill="${c}"/>
        <ellipse cx="${f(cx + r * 0.06)}" cy="${f(cy)}" rx="${f(r * 0.98)}" ry="${f(r * 0.28)}" fill="${c}"/>
        <ellipse cx="${f(cx - r * 0.04)}" cy="${f(cy + r * 0.64)}" rx="${f(r * 0.88)}" ry="${f(r * 0.34)}" fill="${c}"/>`;
    },
    mountain(c) {
      return `<polygon points="-20,430 40,250 90,285 140,190 200,260 250,220 330,330 330,430" fill="${c}" stroke="${c}" stroke-width="24" stroke-linejoin="round"/>`;
    },
  };

  // --- композиции ---
  const templates = [
    // большая звезда-взрыв в углу + маленькие звёздочки
    (p, R) => shape.burst(230, 70, 120, p.main, 7, R() * 0.5) +
      shape.burst(50, 250, 24, p.main, 6) + shape.sparkle(260, 230, 12, p.acc) + shape.sparkle(40, 60, 9, p.acc),
    // два цветка, срезанные краями
    (p, R) => shape.flower(250, 40, 140, p.main, 5, null, R()) + shape.flower(10, 300, 70, p.acc, 5, null, R()),
    // облако-цветок с мордочкой по центру
    (p, R) => shape.flower(150, 120, 120, p.main, 6, null, R()) +
      shape.flower(40, 300, 26, p.acc, 5, p.main) + shape.flower(270, 260, 20, p.acc, 5, p.main),
    // вишенки
    (p) => shape.cherry(215, 110, 90, p.main, p.acc) + shape.cherry(60, 300, 34, p.main, p.acc),
    // сердца
    (p) => shape.heart(150, 60, 120, p.acc) + shape.heart(150, 70, 60, p.main) + shape.heart(285, 300, 55, p.main),
    // арка и горы
    (p) => shape.arch(10, 30, 280, 420, p.acc) + shape.mountain(p.main) + shape.sparkle(250, 70, 14, p.bg),
    // волна-змейка
    (p, R) => shape.squiggle(-30, 150, 360, p.main, 70 + R() * 30, 30) + shape.sparkle(240, 50, 20, p.acc) + shape.sparkle(60, 250, 12, p.acc),
    // плитки с фигурами (как паттерн)
    (p) => {
      const cells = [[0, 0], [150, 0], [0, 140], [150, 140]];
      const kinds = ['flower', 'sparkle', 'ring', 'burst'];
      return cells.map(([x, y], i) => {
        const fill = i % 3 === 0 ? p.acc : p.bg;
        const c = i % 3 === 0 ? p.main : p.main;
        const k = kinds[i];
        const inner = k === 'flower' ? shape.flower(x + 75, y + 70, 52, c, 5, fill)
          : k === 'sparkle' ? shape.sparkle(x + 75, y + 70, 56, c)
          : k === 'ring' ? shape.ring(x + 75, y + 70, 50, c)
          : shape.burst(x + 75, y + 70, 48, c, 6);
        return `<rect x="${x}" y="${y}" width="150" height="140" fill="${fill}"/>` + inner;
      }).join('');
    },
    // круги-апельсины
    (p) => [[70, 60], [150, 30], [230, 80], [110, 140], [210, 170]].map(([x, y], i) =>
      `<circle cx="${x}" cy="${y}" r="${48 - i * 3}" fill="${i % 2 ? p.acc : p.main}"/>`).join(''),
    // кольцо и цветок
    (p, R) => shape.ring(220, 90, 110, p.main) + shape.flower(70, 70, 60, p.acc, 5, p.main, R()),
    // большой астериск
    (p, R) => shape.asterisk(200, 120, 120, p.main, R() * 20) + shape.sparkle(50, 250, 16, p.acc),
    // колючая звезда и искры
    (p, R) => shape.spiky(110, 120, 130, p.main, 14, 0.62, R()) + shape.sparkle(250, 280, 22, p.acc) + shape.sparkle(270, 40, 12, p.acc),
    // камешки
    (p) => shape.pebbles(170, 140, 150, p.main) + shape.sparkle(60, 50, 14, p.acc),
  ];

  const MOUNTAIN_TEMPLATE = 5;

  function wrap(title, max = 13) {
    const words = String(title).split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
      if (!cur) cur = w;
      else if ((cur + ' ' + w).length <= max) cur += ' ' + w;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    if (lines.length > 4) { lines.length = 4; lines[3] = lines[3].replace(/.{0,2}$/, '…'); }
    return lines;
  }

  const cache = new Map();

  // ---- Стандартный дизайн: лист тёплой бумаги со спокойным узором ----
  // Узор — тонкие линии цвета текста в верхней части, внизу номер-разделитель
  // и название заглавными. Узор, как и в ярком дизайне, выбирается по названию.
  const S_INK = '#23201C';
  const S_PAPER = '#FBF8F4';
  const PATTERNS = [
    // горизонтальные линии
    () => Array.from({ length: 13 }, (_, i) => `<line x1="0" y1="${18 + i * 18}" x2="300" y2="${18 + i * 18}"/>`).join(''),
    // сетка точек
    () => { let s = ''; for (let y = 20; y < 250; y += 20) for (let x = 20; x < 300; x += 20) s += `<circle cx="${x}" cy="${y}" r="1.6" fill="${S_INK}" stroke="none"/>`; return s; },
    // концентрические круги из угла
    () => Array.from({ length: 12 }, (_, i) => `<circle cx="300" cy="0" r="${24 + i * 22}"/>`).join(''),
    // диагональная штриховка
    () => Array.from({ length: 30 }, (_, i) => `<line x1="${-260 + i * 20}" y1="260" x2="${i * 20}" y2="0"/>`).join(''),
    // волны
    () => Array.from({ length: 11 }, (_, i) => { const y = 22 + i * 21; return `<path d="M-10 ${y} q 25 -10 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0"/>`; }).join(''),
    // ряд арок
    () => { let s = ''; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = 18 + c * 70, y = 26 + r * 76; s += `<path d="M${x} ${y + 60} V${y + 26} a 26 26 0 0 1 52 0 V${y + 60}"/>`; } return s; },
    // клетка из крестиков
    () => { let s = ''; for (let y = 24; y < 250; y += 28) for (let x = 24; x < 300; x += 28) s += `<path d="M${x - 5} ${y}h10M${x} ${y - 5}v10"/>`; return s; },
    // вложенные прямоугольники
    () => Array.from({ length: 8 }, (_, i) => `<rect x="${20 + i * 14}" y="${18 + i * 12}" width="${260 - i * 28}" height="${220 - i * 24}" rx="${Math.max(2, 14 - i * 2)}"/>`).join(''),
  ];

  function coverStandard(item, text) {
    const key = `std|${item.category}|${item.title}|${text}`;
    if (cache.has(key)) return cache.get(key);
    const h = hash(item.category + item.title);
    const pattern = PATTERNS[h % PATTERNS.length]();
    const num = String(h % 100).padStart(2, '0');
    const lines = wrap(item.title, 13).map((l) => l.toUpperCase());
    const y0 = 392 - (lines.length - 1) * 29;
    const cut = y0 - 44;
    const clip = 'p' + h.toString(36);
    const t = text ? `<text x="26" y="${y0}" fill="${S_INK}" font-family="Onest, sans-serif" font-weight="400" font-size="25" letter-spacing="-0.3">${lines.map((l, i) => `<tspan x="26" dy="${i ? 29 : 0}">${esc(l)}</tspan>`).join('')}</text>` : '';
    const svg = `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(item.title)}">` +
      `<defs><clipPath id="${clip}"><rect x="0" y="0" width="300" height="${text ? cut - 16 : 420}"/></clipPath></defs>` +
      `<rect width="300" height="420" fill="${S_PAPER}"/>` +
      `<g clip-path="url(#${clip})" fill="none" stroke="${S_INK}" stroke-opacity=".22" stroke-width="1.2">${pattern}</g>` +
      (text ? `<line x1="26" y1="${cut}" x2="274" y2="${cut}" stroke="${S_INK}" stroke-opacity=".3"/>` +
        `<text x="274" y="${cut - 10}" text-anchor="end" fill="#8A8178" font-family="JetBrains Mono, monospace" font-size="14">${num}.</text>` : '') +
      t + `</svg>`;
    cache.set(key, svg);
    return svg;
  }

  function cover(item, { text = true } = {}) {
    if (Diary.design && Diary.design.isStandard()) return coverStandard(item, text);
    const key = `${item.category}|${item.title}|${text}`;
    if (cache.has(key)) return cache.get(key);
    const h = hash(item.category + item.title);
    const R = rng(h);
    const p = PALETTES[h % PALETTES.length];
    const tplIndex = Math.floor(R() * templates.length);
    let body = templates[tplIndex](p, R);
    // У «арки с горами» название ложится на гору — берём цвет фона, чтобы не слилось.
    const textColor = tplIndex === MOUNTAIN_TEMPLATE ? p.bg : p.text;
    if (text) {
      const lines = wrap(item.title);
      const long = lines.some((l) => l.length > 10) || lines.length > 2;
      const fs = long ? 27 : 33;
      const lh = fs * 1.02;
      const y0 = 392 - (lines.length - 1) * lh;
      body += `<text x="22" y="${f(y0)}" fill="${textColor}" font-family="Onest, sans-serif" font-weight="800" font-size="${fs}" letter-spacing="-1.2">${lines.map((l, i) => `<tspan x="22" dy="${i ? f(lh) : 0}">${esc(l)}</tspan>`).join('')}</text>`;
    }
    const svg = `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(item.title)}"><rect width="300" height="420" fill="${p.bg}"/>${body}</svg>`;
    cache.set(key, svg);
    return svg;
  }

  // Фигуры-символы папок и разделов вместо персонажей.
  const FIGURES = {
    movie: (c) => shape.spiky(60, 60, 56, c, 12, 0.5),
    game: (c) => shape.asterisk(60, 60, 54, c),
    book: (c) => shape.flower(60, 60, 58, c, 6),
    series: (c) => shape.sparkle(60, 60, 58, c),
    collections: (c) => shape.pebbles(60, 60, 54, c),
    trash: (c) => shape.ring(60, 60, 56, c),
  };

  // Стандартный дизайн: те же фигуры, но одним тонким контуром без заливки.
  // Нарисованы отдельно, а не обводкой цветных: у цветка и астериска проступили
  // бы внутренние линии наложенных частей.
  const OUTLINE = {
    movie: () => { const pts = []; for (let i = 0; i < 24; i++) { const a = -Math.PI / 2 + i * Math.PI / 12, rr = i % 2 ? 28 : 56; pts.push(`${f(60 + Math.cos(a) * rr)},${f(60 + Math.sin(a) * rr)}`); } return `<polygon points="${pts.join(' ')}" stroke-linejoin="round"/>`; },
    game: () => [0, 45, 90, 135].map((a) => `<line x1="60" y1="8" x2="60" y2="112" transform="rotate(${a} 60 60)"/>`).join('') + '<circle cx="60" cy="60" r="10"/>',
    book: () => { const pts = []; for (let i = 0; i <= 180; i++) { const a = i / 180 * Math.PI * 2, rr = 42 + 14 * Math.cos(6 * a); pts.push(`${f(60 + Math.cos(a) * rr)},${f(60 + Math.sin(a) * rr)}`); } return `<polygon points="${pts.join(' ')}"/><circle cx="60" cy="60" r="12"/>`; },
    series: () => '<path d="M60 4Q66 54 116 60Q66 66 60 116Q54 66 4 60Q54 54 60 4Z" stroke-linejoin="round"/>',
    collections: () => '<ellipse cx="60" cy="27" rx="42" ry="16"/><ellipse cx="63" cy="60" rx="53" ry="15"/><ellipse cx="58" cy="94" rx="47" ry="18"/>',
    trash: () => '<circle cx="60" cy="60" r="50"/><circle cx="60" cy="60" r="34"/>',
  };

  function figure(kind, color) {
    if (Diary.design && Diary.design.isStandard()) {
      return `<svg class="fig-outline" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="none" stroke="#23201C" stroke-width="1.2" vector-effect="non-scaling-stroke">${(OUTLINE[kind] || OUTLINE.movie)()}</g></svg>`;
    }
    return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${(FIGURES[kind] || FIGURES.movie)(color)}</svg>`;
  }

  return { cover, figure, sparkle: shape.sparkle };
})();
