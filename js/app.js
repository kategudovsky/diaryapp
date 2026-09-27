(() => {
  const { cover, mascot, star } = window.Covers;

  const TYPES = {
    film:   { label: 'Фильмы',  forms: ['фильм', 'фильма', 'фильмов'],    code: 'FILM', c: '#FF5B37', fi: '#FFF6E8', m: '#FFD23F', verb: 'Смотрю', unit: null,    grid: 'rgba(255,246,232,.16)' },
    series: { label: 'Сериалы', forms: ['сериал', 'сериала', 'сериалов'], code: 'SER',  c: '#FF9ACB', fi: '#2B1810', m: '#FF5B37', verb: 'Смотрю', unit: 'серий', grid: 'rgba(43,24,16,.08)' },
    book:   { label: 'Книги',   forms: ['книга', 'книги', 'книг'],        code: 'BOOK', c: '#1E5A3A', fi: '#FFF6E8', m: '#FF9ACB', verb: 'Читаю',  unit: 'стр.',  grid: 'rgba(255,246,232,.1)' },
    game:   { label: 'Игры',    forms: ['игра', 'игры', 'игр'],           code: 'GAME', c: '#C9F04B', fi: '#2B1810', m: '#8B5CF6', verb: 'Играю',  unit: '%',     grid: 'rgba(43,24,16,.08)' },
  };
  const ORDER = ['film', 'series', 'book', 'game'];
  const STATUS = {
    want:     { label: 'Хочу',      c: '#FFD23F' },
    progress: { label: null,        c: '#86B6F2' },
    done:     { label: 'Завершено', c: '#C7B4F7' },
    dropped:  { label: 'Брошено',   c: '#FFB59A' },
  };
  const STATUS_ORDER = ['want', 'progress', 'done', 'dropped'];
  const TAG_COLORS = ['#C9F04B', '#FF9ACB', '#C7B4F7', '#FFD23F', '#86B6F2', '#FFB59A'];
  const YEAR = new Date().getFullYear();
  const KEY = 'kartoteka:v1';

  // ---------- состояние ----------
  let items = load();
  const view = { status: 'all', q: '', sort: 'added' };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* хранилище недоступно — работаем на стартовых данных */ }
    return structuredClone(window.SEED);
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* ничего */ }
  }

  // ---------- утилиты ----------
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plural = (n, [one, few, many]) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  };
  const count = (n, forms) => `${n} ${plural(n, forms)}`;
  const statusLabel = (s, type) => (s === 'progress' ? TYPES[type].verb : STATUS[s].label);
  const code = (it) => `${TYPES[it.type].code}_${String(it.num).padStart(3, '0')}`;
  const byId = (id) => items.find((i) => i.id === id);
  const ofType = (type) => items.filter((i) => i.type === type);
  const pct = (it) => (it.progress && it.progress.total ? Math.min(100, Math.round((it.progress.cur / it.progress.total) * 100)) : 0);
  const typeVars = (type) => `--c:${TYPES[type].c};--fi:${TYPES[type].fi};--m:${TYPES[type].m}`;
  const doneThisYear = (list) => list.filter((i) => i.status === 'done' && i.finished && i.finished.startsWith(String(YEAR))).length;
  const fmtRating = (list) => {
    const rated = list.filter((i) => i.rating);
    if (!rated.length) return null;
    return (rated.reduce((s, i) => s + i.rating, 0) / rated.length).toFixed(1).replace('.', ',');
  };
  const progressText = (it) => {
    const u = TYPES[it.type].unit;
    if (!u || !it.progress) return '';
    return u === '%' ? `${it.progress.cur}%` : `${it.progress.cur} из ${it.progress.total} ${u}`;
  };

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('is-on'), 2400);
  }

  // ---------- роутинг ----------
  function route() {
    const m = location.hash.match(/^#\/(film|series|book|game)$/);
    return m ? m[1] : null;
  }

  function render() {
    const type = route();
    document.body.dataset.view = type ? 'collection' : 'home';
    if (type) {
      document.body.style.setProperty('--page', TYPES[type].c);
      document.body.style.setProperty('--grid', TYPES[type].grid);
      renderCollection(type);
    } else {
      document.body.style.removeProperty('--page');
      document.body.style.removeProperty('--grid');
      renderHome();
    }
  }

  // ---------- главная: папки ----------
  function renderHome() {
    const inProgress = items.filter((i) => i.status === 'progress').slice(0, 4);
    const tabTops = [36, 170, 304, 438];

    const title = `
      <article class="folder folder--title" style="--c:#FFF1DD;--fi:#2B1810;z-index:10">
        <div class="folder-tab" aria-hidden="true"><small>FILE_00 //</small>архив</div>
        <div class="folder-body title-sheet">
          <div class="mono">FILE_00 // личный архив · ${YEAR}</div>
          <h1>Моя<br>картотека</h1>
          <p class="lead">Всё, что посмотрено, прочитано и пройдено — разложено по папкам.</p>
          <div class="mascot-row">
            ${ORDER.map((t, i) => `<a href="#/${t}" class="mascot-link" style="--d:${i * 0.15}s" aria-label="${TYPES[t].label}">${mascot(t, TYPES[t].c, { wave: i === 2 })}</a>`).join('')}
            <span class="hand-note" aria-hidden="true">выбирай папку →</span>
          </div>
          <section class="now">
            <h3>Сейчас в процессе</h3>
            <ul>
              ${inProgress.map((it) => `
                <li><button class="now-item" data-open="${it.id}" type="button">
                  <span class="now-thumb">${cover(it, { text: false })}</span>
                  <span class="now-text"><b>${esc(it.title)}</b><small>${TYPES[it.type].verb.toLowerCase()} · ${esc(progressText(it) || it.creator)}</small>
                  ${it.progress ? `<span class="bar"><span style="width:${pct(it)}%"></span></span>` : ''}</span>
                </button></li>`).join('')}
            </ul>
          </section>
          <div class="stats">
            <span class="sticker" style="--s:#C9F04B">${items.length} всего</span>
            <span class="sticker" style="--s:#FF9ACB">${doneThisYear(items)} завершено в ${YEAR}</span>
            <span class="sticker" style="--s:#FFD23F">${items.filter((i) => i.status === 'want').length} в планах</span>
          </div>
        </div>
      </article>`;

    const folders = ORDER.map((type, i) => {
      const T = TYPES[type];
      const list = ofType(type).sort((a, b) => b.added - a.added);
      const prog = list.filter((x) => x.status === 'progress').length;
      return `
      <article class="folder" data-type="${type}" style="${typeVars(type)};--tab-top:${tabTops[i]}px;z-index:${9 - i}">
        <a class="folder-tab" href="#/${type}"><small>${T.code}_0${i + 1} //</small>${T.label}</a>
        <a class="folder-body" href="#/${type}" aria-label="Открыть папку «${T.label}»">
          <h2 class="folder-vtitle">${T.label.toLowerCase()}</h2>
          <div class="folder-main">
            <div class="mono">${T.code}_0${i + 1} // ${count(list.length, T.forms)}</div>
            <div class="folder-peek">
              ${list.slice(0, 9).map((it, k) => `<span class="mini-cover" style="--rot:${(k % 3 - 1) * 2.5}deg">${cover(it)}</span>`).join('')}
            </div>
            <div class="folder-foot">
              <span>${prog ? `${prog} — ${T.verb.toLowerCase()}` : 'ничего в процессе'}</span>
              <span class="open">открыть →</span>
            </div>
          </div>
          <span class="folder-mascot">${mascot(type, T.m)}</span>
        </a>
      </article>`;
    }).join('');

    $('#app').innerHTML = `<section class="shelf" aria-label="Папки коллекций">${title}${folders}</section>`;
  }

  // ---------- коллекция ----------
  function renderCollection(type) {
    const T = TYPES[type];
    const list = ofType(type);
    const avg = fmtRating(list);

    $('#app').innerHTML = `
      <section class="coll" style="${typeVars(type)}">
        <div class="coll-head">
          <a class="back" href="#/">← все папки</a>
          <div class="coll-hero">
            <div>
              <div class="mono">${T.code}_0${ORDER.indexOf(type) + 1} // папка</div>
              <h1>${T.label}</h1>
              <p class="coll-sub">${count(list.length, T.forms)} · ${doneThisYear(list)} завершено в ${YEAR}${avg ? ` · средняя оценка ${avg}` : ''}</p>
            </div>
            <div class="coll-mascot">
              ${mascot(type, T.m, { wave: true })}
              <svg class="doodle" viewBox="0 0 60 60" aria-hidden="true">${window.Covers.sparkle(30, 30, 26, 'currentColor')}</svg>
            </div>
          </div>
          <div class="coll-tools">
            <label class="field-inline">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>
              <input id="coll-search" type="search" placeholder="Искать в папке" value="${esc(view.q)}" aria-label="Искать в папке">
            </label>
            <label class="select">
              <span class="sr">Сортировка</span>
              <select id="coll-sort">
                <option value="added" ${view.sort === 'added' ? 'selected' : ''}>Сначала новые</option>
                <option value="rating" ${view.sort === 'rating' ? 'selected' : ''}>По оценке</option>
                <option value="title" ${view.sort === 'title' ? 'selected' : ''}>По названию</option>
                <option value="year" ${view.sort === 'year' ? 'selected' : ''}>По году</option>
              </select>
            </label>
            <button class="btn" data-action="add" data-type="${type}" type="button"><span aria-hidden="true">+</span> В папку</button>
          </div>
        </div>
        <nav class="status-tabs" id="status-tabs" aria-label="Статус"></nav>
        <div class="sheet"><div class="grid" id="grid"></div></div>
      </section>
      <nav class="side-tabs" aria-label="Другие папки">
        ${ORDER.filter((t) => t !== type).map((t) => `<a class="side-tab" href="#/${t}" style="${typeVars(t)}">${TYPES[t].label}</a>`).join('')}
      </nav>`;

    $('#coll-search').addEventListener('input', (e) => { view.q = e.target.value; updateGrid(type); });
    $('#coll-sort').addEventListener('change', (e) => { view.sort = e.target.value; updateGrid(type); });
    updateGrid(type);
  }

  function updateGrid(type) {
    const all = ofType(type);
    const q = view.q.trim().toLowerCase();
    const tabs = [['all', 'Все', '#FFF6E8'], ...STATUS_ORDER.map((s) => [s, statusLabel(s, type), STATUS[s].c])];
    $('#status-tabs').innerHTML = tabs.map(([key, label, c], i) => {
      const n = key === 'all' ? all.length : all.filter((x) => x.status === key).length;
      const on = view.status === key;
      return `<button type="button" class="stab ${on ? 'is-active' : ''}" data-status="${key}" style="--sc:${c};z-index:${on ? 6 : 5 - i}" aria-pressed="${on}">${esc(label)}<span class="count">${n}</span></button>`;
    }).join('');

    let list = all.filter((x) => (view.status === 'all' || x.status === view.status) &&
      (!q || [x.title, x.creator, x.genre, ...(x.tags || [])].join(' ').toLowerCase().includes(q)));
    const sorters = {
      added: (a, b) => b.added - a.added,
      rating: (a, b) => b.rating - a.rating,
      title: (a, b) => a.title.localeCompare(b.title, 'ru'),
      year: (a, b) => b.year - a.year,
    };
    list.sort(sorters[view.sort]);

    $('#grid').innerHTML = list.length
      ? list.map(card).join('')
      : `<div class="empty">${mascot(type, TYPES[type].m)}<p>Здесь пока пусто</p><button class="btn" data-action="add" data-type="${type}" type="button">+ Положить первое</button></div>`;
  }

  function card(it) {
    const S = STATUS[it.status];
    return `
      <button class="card" data-open="${it.id}" type="button">
        <span class="cover">${cover(it)}<span class="status-pill" style="--sc:${S.c}">${esc(statusLabel(it.status, it.type))}</span></span>
        <span class="card-meta">
          <span class="card-code">${code(it)}</span>
          <h3>${esc(it.title)}</h3>
          <span class="sub">${esc(it.creator)} · ${it.year}</span>
          ${it.status === 'progress' && it.progress ? `<span class="bar"><span style="width:${pct(it)}%"></span></span><span class="sub">${progressText(it)}</span>` : ''}
          ${it.rating ? `<span class="stars-mini" aria-label="Оценка ${it.rating} из 5">${[1, 2, 3, 4, 5].map((n) => star(n <= it.rating, 15)).join('')}</span>` : ''}
        </span>
      </button>`;
  }

  // ---------- модальные окна ----------
  function openModal(html, type) {
    const root = $('#modal-root');
    root.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-backdrop" data-close></div>
        <article class="sheet-card" style="${typeVars(type)}">${html}</article>
      </div>`;
    document.body.classList.add('has-modal');
    const focusable = root.querySelector('[autofocus]') || root.querySelector('button, input');
    focusable && focusable.focus({ preventScroll: true });
  }
  function closeModal() {
    $('#modal-root').innerHTML = '';
    document.body.classList.remove('has-modal');
  }

  function openDetail(id) {
    const it = byId(id);
    if (!it) return;
    const T = TYPES[it.type];
    const unit = T.unit;
    const tagsHtml = (it.tags || []).map((t, i) => `<span class="tag" style="--tc:${TAG_COLORS[i % TAG_COLORS.length]}">${esc(t)}<button type="button" data-untag="${i}" aria-label="Убрать тег ${esc(t)}">×</button></span>`).join('');

    openModal(`
      <div class="sheet-tab">${code(it)} // ${T.label.toLowerCase()}</div>
      <button class="close" data-close type="button" aria-label="Закрыть">×</button>
      <div class="sheet-inner detail" data-id="${it.id}">
        <div class="detail-cover">${cover(it)}</div>
        <div class="detail-info">
          <div class="chips" role="group" aria-label="Статус">
            ${STATUS_ORDER.map((s) => `<button type="button" class="chip ${it.status === s ? 'is-on' : ''}" data-set-status="${s}" style="--sc:${STATUS[s].c}" aria-pressed="${it.status === s}">${esc(statusLabel(s, it.type))}</button>`).join('')}
          </div>
          <h2>${esc(it.title)}</h2>
          <p class="detail-sub">${esc(it.creator)} · ${it.year} · ${esc(it.genre)}</p>

          <div class="detail-grid">
            <div class="field">
              <span class="label">Оценка</span>
              <div class="stars" role="radiogroup" aria-label="Оценка">
                ${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-rate="${n}" role="radio" aria-checked="${it.rating === n}" aria-label="${n} из 5">${star(n <= it.rating, 30)}</button>`).join('')}
              </div>
            </div>
            ${unit && it.progress ? `
            <div class="field">
              <span class="label">Прогресс</span>
              <div class="progress-edit">
                <button type="button" class="round" data-step="-1" aria-label="Меньше">−</button>
                <input type="number" min="0" max="${it.progress.total}" value="${it.progress.cur}" data-progress aria-label="Сколько пройдено">
                <span>${unit === '%' ? '%' : `из <input type="number" min="1" value="${it.progress.total}" data-total aria-label="Всего"> ${unit}`}</span>
                <button type="button" class="round" data-step="1" aria-label="Больше">+</button>
              </div>
              <span class="bar bar--big"><span style="width:${pct(it)}%"></span></span>
            </div>` : ''}
            <div class="field">
              <span class="label">Начато</span>
              <input type="date" value="${it.started || ''}" data-date="started">
            </div>
            <div class="field">
              <span class="label">Завершено</span>
              <input type="date" value="${it.finished || ''}" data-date="finished">
            </div>
          </div>

          <div class="field">
            <span class="label">Теги</span>
            <div class="tags">${tagsHtml}<input class="tag-input" placeholder="+ тег" data-tag-input aria-label="Добавить тег"></div>
          </div>

          <div class="field">
            <span class="label">Заметки</span>
            <textarea class="notes" data-notes rows="4" placeholder="Что запомнилось?">${esc(it.notes)}</textarea>
          </div>

          <button type="button" class="link-danger" data-delete>Удалить из картотеки</button>
        </div>
      </div>`, it.type);
  }

  function refreshDetail(id) {
    const scroll = $('.modal')?.scrollTop || 0;
    openDetail(id);
    $('.modal').scrollTop = scroll;
    render();
  }

  function openAdd(type = route() || 'film') {
    openModal(`
      <div class="sheet-tab">NEW // новая карточка</div>
      <button class="close" data-close type="button" aria-label="Закрыть">×</button>
      <form class="sheet-inner add-form" id="add-form">
        <div class="add-head">
          <h2>Положить в папку</h2>
          <span class="hand-note">что-то новенькое!</span>
        </div>
        <div class="chips type-chips" role="radiogroup" aria-label="Папка">
          ${ORDER.map((t) => `<label class="chip chip--type" style="${typeVars(t)}"><input type="radio" name="type" value="${t}" ${t === type ? 'checked' : ''}>${TYPES[t].label}</label>`).join('')}
        </div>
        <label class="field field--wide"><span class="label">Название</span><input name="title" required autofocus placeholder="Например, «Амели»"></label>
        <label class="field"><span class="label" data-creator-label>${creatorLabel(type)}</span><input name="creator" placeholder="Кто сделал"></label>
        <label class="field"><span class="label">Год</span><input name="year" type="number" min="1800" max="2100" value="${YEAR}"></label>
        <label class="field"><span class="label">Жанр</span><input name="genre" placeholder="драма, RPG, роман…"></label>
        <label class="field" data-total-field ${TYPES[type].unit && TYPES[type].unit !== '%' ? '' : 'hidden'}><span class="label" data-total-label>Всего ${TYPES[type].unit || ''}</span><input name="total" type="number" min="1" placeholder="10"></label>
        <div class="field field--wide">
          <span class="label">Статус</span>
          <div class="chips" role="radiogroup" aria-label="Статус">
            ${STATUS_ORDER.map((s, i) => `<label class="chip" style="--sc:${STATUS[s].c}"><input type="radio" name="status" value="${s}" ${i === 0 ? 'checked' : ''}><span data-status-label="${s}">${esc(statusLabel(s, type))}</span></label>`).join('')}
          </div>
        </div>
        <div class="add-actions field--wide">
          <button class="btn btn--big" type="submit">Положить в папку →</button>
        </div>
      </form>`, type);

    const form = $('#add-form');
    form.addEventListener('change', (e) => {
      if (e.target.name !== 'type') return;
      const t = e.target.value;
      $('.sheet-card').setAttribute('style', typeVars(t));
      $('[data-creator-label]').textContent = creatorLabel(t);
      const u = TYPES[t].unit;
      $('[data-total-field]').hidden = !(u && u !== '%');
      $('[data-total-label]').textContent = `Всего ${u || ''}`;
      form.querySelectorAll('[data-status-label]').forEach((el) => { el.textContent = statusLabel(el.dataset.statusLabel, t); });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      const t = d.type;
      const num = Math.max(0, ...ofType(t).map((i) => i.num)) + 1;
      const unit = TYPES[t].unit;
      const total = unit === '%' ? 100 : Number(d.total) || null;
      const it = {
        id: `${t}-${Date.now()}`, num, type: t,
        title: d.title.trim(), creator: d.creator.trim() || '—', year: Number(d.year) || YEAR,
        genre: d.genre.trim() || 'без жанра', status: d.status, rating: 0,
        progress: unit && total ? { cur: d.status === 'done' ? total : 0, total } : null,
        started: d.status === 'progress' ? new Date().toISOString().slice(0, 10) : null,
        finished: d.status === 'done' ? new Date().toISOString().slice(0, 10) : null,
        tags: [], notes: '', added: Date.now(),
      };
      items.push(it);
      save();
      closeModal();
      if (route() !== t) location.hash = `#/${t}`; else render();
      toast(`Положено в папку «${TYPES[t].label}»`);
    });
  }

  const creatorLabel = (t) => ({ film: 'Режиссёр', series: 'Создатели', book: 'Автор', game: 'Студия' }[t]);

  // ---------- события ----------
  document.addEventListener('click', (e) => {
    const t = e.target;
    const open = t.closest('[data-open]');
    if (open) { hideResults(); openDetail(open.dataset.open); return; }
    if (t.closest('[data-action="add"]')) { openAdd(t.closest('[data-action="add"]').dataset.type); return; }
    if (t.closest('[data-close]')) { closeModal(); return; }

    const tab = t.closest('[data-status]');
    if (tab && route()) { view.status = tab.dataset.status; updateGrid(route()); return; }

    const detail = t.closest('.detail');
    if (!detail) { if (!t.closest('.search')) hideResults(); return; }
    const it = byId(detail.dataset.id);

    const st = t.closest('[data-set-status]');
    if (st) {
      it.status = st.dataset.setStatus;
      const today = new Date().toISOString().slice(0, 10);
      if (it.status === 'done') {
        it.finished = it.finished || today;
        if (it.progress) it.progress.cur = it.progress.total;
      }
      if (it.status === 'progress') it.started = it.started || today;
      save(); refreshDetail(it.id); return;
    }
    const rate = t.closest('[data-rate]');
    if (rate) { const n = Number(rate.dataset.rate); it.rating = it.rating === n ? 0 : n; save(); refreshDetail(it.id); return; }
    const step = t.closest('[data-step]');
    if (step) {
      it.progress.cur = Math.max(0, Math.min(it.progress.total, it.progress.cur + Number(step.dataset.step)));
      save(); refreshDetail(it.id); return;
    }
    const untag = t.closest('[data-untag]');
    if (untag) { it.tags.splice(Number(untag.dataset.untag), 1); save(); refreshDetail(it.id); return; }
    if (t.closest('[data-delete]')) {
      if (!confirm(`Удалить «${it.title}» из картотеки?`)) return;
      items = items.filter((x) => x.id !== it.id);
      save(); closeModal(); render(); toast('Карточка удалена');
    }
  });

  document.addEventListener('change', (e) => {
    const detail = e.target.closest('.detail');
    if (!detail) return;
    const it = byId(detail.dataset.id);
    const el = e.target;
    if (el.matches('[data-progress]')) it.progress.cur = Math.max(0, Math.min(it.progress.total, Number(el.value) || 0));
    else if (el.matches('[data-total]')) it.progress.total = Math.max(1, Number(el.value) || 1);
    else if (el.matches('[data-date]')) it[el.dataset.date] = el.value || null;
    else if (el.matches('[data-notes]')) it.notes = el.value;
    else return;
    save();
    if (!el.matches('[data-notes]')) refreshDetail(it.id); else render();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if ($('.modal')) closeModal(); hideResults(); }
    if (e.key === 'Enter' && e.target.matches('[data-tag-input]')) {
      e.preventDefault();
      const v = e.target.value.trim();
      if (!v) return;
      const it = byId(e.target.closest('.detail').dataset.id);
      it.tags = [...(it.tags || []), v];
      save(); refreshDetail(it.id);
      $('[data-tag-input]').focus();
    }
    if (e.key === 'Enter' && e.target.id === 'global-search') {
      const first = $('#search-results [data-open]');
      if (first) first.click();
    }
  });

  // ---------- глобальный поиск ----------
  const gs = $('#global-search');
  const results = $('#search-results');
  function hideResults() { results.hidden = true; }
  gs.addEventListener('input', () => {
    const q = gs.value.trim().toLowerCase();
    if (!q) return hideResults();
    const found = items.filter((i) => [i.title, i.creator, ...(i.tags || [])].join(' ').toLowerCase().includes(q)).slice(0, 7);
    results.innerHTML = found.length
      ? found.map((it) => `<button type="button" class="result" data-open="${it.id}">
          <span class="now-thumb">${cover(it, { text: false })}</span>
          <span class="now-text"><b>${esc(it.title)}</b><small>${esc(it.creator)} · ${it.year}</small></span>
          <span class="result-type" style="${typeVars(it.type)}">${TYPES[it.type].label}</span>
        </button>`).join('')
      : `<p class="result-empty">Ничего не нашлось</p>`;
    results.hidden = false;
  });

  window.addEventListener('hashchange', () => {
    view.status = 'all'; view.q = ''; view.sort = 'added';
    closeModal();
    window.scrollTo(0, 0);
    render();
  });

  render();
})();
