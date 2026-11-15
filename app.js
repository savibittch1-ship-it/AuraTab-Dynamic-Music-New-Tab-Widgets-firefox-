const PRESET_WALLPAPERS = [
  { id: 'preset-1', name: 'Deep Nebula', type: 'gradient', value: 'radial-gradient(circle at 20% 20%, #3a1c71 0%, #161829 55%, #090a10 100%)' },
  { id: 'preset-2', name: 'Cyber Dusk', type: 'gradient', value: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
  { id: 'preset-3', name: 'Emerald Aurora', type: 'gradient', value: 'radial-gradient(circle at 80% 10%, #134e5e 0%, #0b1622 70%)' },
  { id: 'preset-4', name: 'Nordic Mountains', type: 'image', value: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80' },
  { id: 'preset-5', name: 'Tokyo Night Rain', type: 'image', value: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1920&q=80' },
  { id: 'preset-6', name: 'Minimal Forest', type: 'image', value: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80' }
];

const DEFAULT_VOCAB = [
  { word: '木漏れ日 (Komorebi)', trans: '[комореби]', meaning: 'Солнечный свет, пробивающийся сквозь листья деревьев' },
  { word: 'Serendipity', trans: '[ˌser.ənˈdɪp.ə.ti]', meaning: 'Интуитивная прозорливость, счастливая случайная находка' },
  { word: '改善 (Kaizen)', trans: '[кайдзен]', meaning: 'Философия непрерывного постепенного совершенствования' }
];

const DEFAULT_STATE = {
  theme: {
    accent: '#7c5cff',
    dynamicAccent: true,
    cardOpacity: 12,
    cardRadius: 26,
    font: "'Plus Jakarta Sans', system-ui, sans-serif",
    bgBlur: 0,
    bgDim: 35,
    parallax: true,
    ytmAsMainBg: true,
    wallpaperId: 'preset-1',
    rotation: 'off',
    lastRotationDate: ''
  },
  widgetsOrder: ['clock', 'search', 'ytm', 'speeddial', 'todo', 'counter', 'timer', 'weather', 'habits', 'crypto', 'vocab'],
  widgetsConfig: {
    clock:     { enabled: true, title: 'Часы', size: 'size-banner', minimized: false, is24h: true, showSec: true, userName: 'Создатель' },
    search:    { enabled: true, title: 'Поиск', size: 'size-banner', minimized: false, engine: 'google' },
    ytm:       { enabled: true, title: 'YouTube Music', size: 'size-medium', minimized: false },
    speeddial: { enabled: true, title: 'Быстрые закладки', size: 'size-medium', minimized: false },
    todo:      { enabled: true, title: 'Задачи и заметки', size: 'size-medium', minimized: false },
    counter:   { enabled: false, title: 'Мульти-Счётчик', size: 'size-medium', minimized: false },
    timer:     { enabled: false, title: 'Таймер & Pomodoro', size: 'size-medium', minimized: false },
    weather:   { enabled: false, title: 'Погода', size: 'size-compact', minimized: false, city: 'Киев', lat: 50.45, lon: 30.52 },
    habits:    { enabled: false, title: 'Трекер Привычек', size: 'size-compact', minimized: false },
    crypto:    { enabled: false, title: 'Курсы Валют', size: 'size-compact', minimized: false },
    vocab:     { enabled: false, title: 'Слово Дня', size: 'size-compact', minimized: false }
  },
  counters: [
    { id: 'c1', name: 'Выпито воды (мл)', count: 750, step: 250, target: 2000, color: '#38bdf8' },
    { id: 'c2', name: 'Фокус-сессии', count: 3, step: 1, target: 6, color: '#a855f7' }
  ],
  bookmarks: [
    { title: 'YouTube', url: 'https://www.youtube.com' },
    { title: 'GitHub', url: 'https://github.com' },
    { title: 'YT Music', url: 'https://music.youtube.com' },
    { title: 'Gemini', url: 'https://gemini.google.com' },
    { title: 'Gmail', url: 'https://mail.google.com' },
    { title: 'Reddit', url: 'https://www.reddit.com' }
  ],
  todos: [
    { id: 't1', text: 'Настроить рабочее пространство AuraTab', done: true }
  ],
  notes: '',
  habits: [
    { id: 'h1', name: 'Чтение 30 мин', days: {} },
    { id: 'h2', name: 'Тренировка', days: {} }
  ],
  vocabList: DEFAULT_VOCAB,
  vocabIndex: 0,
  lastYtmTrack: {
    title: '',
    artist: '',
    cover: '',
    extractedAccent: '',
    trackUrl: 'https://music.youtube.com',
    currentTime: 0,
    progress: 0,
    autoResumeOnStart: true
  }
};

let state = structuredClone(DEFAULT_STATE);
let activeYtmCoverUrl = '';
let currentExtractedColor = '';

// --- ИЗВЛЕЧЕНИЕ ДОМИНИРУЮЩЕГО ЦВЕТА ИЗ ОБЛОЖКИ YOUTUBE MUSIC ---
function extractColorFromCover(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl || imageUrl.startsWith('data:image/svg')) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 24;
        canvas.height = 24;
        ctx.drawImage(img, 0, 0, 24, 24);
        const data = ctx.getImageData(0, 0, 24, 24).data;

        let rSum = 0, gSum = 0, bSum = 0, weightSum = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          const weight = 1 + sat * 4;
          rSum += r * weight;
          gSum += g * weight;
          bSum += b * weight;
          weightSum += weight;
        }

        let r = Math.round(rSum / weightSum);
        let g = Math.round(gSum / weightSum);
        let b = Math.round(bSum / weightSum);

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < 75) {
          const boost = 75 - lum;
          r = Math.min(255, Math.round(r + boost));
          g = Math.min(255, Math.round(g + boost));
          b = Math.min(255, Math.round(b + boost));
        }

        const isLight = (0.299 * r + 0.587 * g + 0.114 * b) > 165;
        resolve({
          rgb: `${r}, ${g}, ${b}`,
          hex: `rgb(${r}, ${g}, ${b})`,
          textColor: isLight ? '#0f172a' : '#ffffff'
        });
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

function applyAccentColorVariables(colorObj) {
  const root = document.documentElement;
  if (state.theme.dynamicAccent && colorObj) {
    root.style.setProperty('--accent', colorObj.hex);
    root.style.setProperty('--accent-text', colorObj.textColor);
    root.style.setProperty('--accent-glow', `rgba(${colorObj.rgb}, 0.42)`);
    root.style.setProperty('--accent-border', `rgba(${colorObj.rgb}, 0.36)`);
  } else {
    const base = state.theme.accent || '#7c5cff';
    root.style.setProperty('--accent', base);
    root.style.setProperty('--accent-text', '#ffffff');
    root.style.setProperty('--accent-glow', base + '55');
    root.style.setProperty('--accent-border', base + '4d');
  }
}

const Storage = {
  async load() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['auratab_state'], (res) => {
          if (res.auratab_state) {
            state = { ...structuredClone(DEFAULT_STATE), ...res.auratab_state };
            state.theme = { ...DEFAULT_STATE.theme, ...state.theme };
            state.widgetsConfig = { ...DEFAULT_STATE.widgetsConfig, ...state.widgetsConfig };
            state.lastYtmTrack = { ...DEFAULT_STATE.lastYtmTrack, ...state.lastYtmTrack };
          }
          resolve(state);
        });
      } else {
        const raw = localStorage.getItem('auratab_state');
        if (raw) state = { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) };
        resolve(state);
      }
    });
  },
  save() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ auratab_state: state });
    } else {
      localStorage.setItem('auratab_state', JSON.stringify(state));
    }
  }
};

const WallpaperDB = {
  db: null,
  init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('AuraTabWallpapersDB', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('wallpapers')) db.createObjectStore('wallpapers', { keyPath: 'id' });
      };
      req.onsuccess = (e) => { this.db = e.target.result; resolve(); };
      req.onerror = (e) => reject(e);
    });
  },
  async addWallpaper(file) {
    const id = 'custom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const isVideo = file.type.startsWith('video/');
    const item = { id, name: file.name, type: isVideo ? 'video' : 'image', blob: file, createdAt: Date.now() };
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('wallpapers', 'readwrite');
      tx.objectStore('wallpapers').put(item);
      tx.oncomplete = () => resolve(item);
      tx.onerror = (e) => reject(e);
    });
  },
  async getAll() {
    return new Promise((resolve) => {
      if (!this.db) return resolve([]);
      const tx = this.db.transaction('wallpapers', 'readonly');
      const req = tx.objectStore('wallpapers').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  },
  async delete(id) {
    return new Promise((resolve) => {
      const tx = this.db.transaction('wallpapers', 'readwrite');
      tx.objectStore('wallpapers').delete(id);
      tx.oncomplete = () => resolve();
    });
  }
};

function playSoftChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 1.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 1.45);
    });
  } catch (e) {}
}

let currentObjectURL = null;
let renderedBgCss = '';
let renderedIsYtm = false;
let crossfadeTimer = null;

function setBackgroundWithCrossfade(bgCssValue, isYtmCover) {
  const backLayer = document.getElementById('wallpaper-image-back');
  const frontLayer = document.getElementById('wallpaper-image');
  if (!frontLayer || !backLayer) return;

  if (renderedBgCss === bgCssValue && renderedIsYtm === isYtmCover) return;

  clearTimeout(crossfadeTimer);

  if (renderedBgCss) {
    backLayer.style.backgroundImage = renderedBgCss;
    backLayer.classList.toggle('ytm-bg-active', renderedIsYtm);
  }

  frontLayer.classList.add('crossfade-prepare');
  frontLayer.style.backgroundImage = bgCssValue;
  frontLayer.classList.toggle('ytm-bg-active', isYtmCover);

  void frontLayer.offsetWidth;
  frontLayer.classList.remove('crossfade-prepare');

  renderedBgCss = bgCssValue;
  renderedIsYtm = isYtmCover;

  crossfadeTimer = setTimeout(() => {
    backLayer.style.backgroundImage = bgCssValue;
    backLayer.classList.toggle('ytm-bg-active', isYtmCover);
  }, 1650);
}

async function applyThemeAndWallpaper(checkRotation = false) {
  const t = state.theme;
  const root = document.documentElement;
  root.style.setProperty('--card-bg-opacity', (t.cardOpacity / 100).toFixed(2));
  root.style.setProperty('--card-radius', t.cardRadius + 'px');
  root.style.setProperty('--font-main', t.font);
  root.style.setProperty('--bg-blur', t.bgBlur + 'px');
  root.style.setProperty('--bg-dim', (t.bgDim / 100).toFixed(2));

  applyAccentColorVariables(currentExtractedColor);

  const videoLayer = document.getElementById('wallpaper-video');

  if (t.ytmAsMainBg && activeYtmCoverUrl) {
    videoLayer.pause();
    videoLayer.style.display = 'none';
    setBackgroundWithCrossfade(`url("${activeYtmCoverUrl}")`, true);
    return;
  }

  const customWallpapers = await WallpaperDB.getAll();
  const allWallpapers = [...PRESET_WALLPAPERS, ...customWallpapers];

  if (checkRotation && allWallpapers.length > 1) {
    const today = new Date().toISOString().slice(0, 10);
    if (t.rotation === 'newtab' || (t.rotation === 'daily' && t.lastRotationDate !== today)) {
      const pool = customWallpapers.length > 0 ? customWallpapers : allWallpapers;
      t.wallpaperId = pool[Math.floor(Math.random() * pool.length)].id;
      t.lastRotationDate = today;
      Storage.save();
    }
  }

  const activeWp = allWallpapers.find(w => w.id === t.wallpaperId) || PRESET_WALLPAPERS[0];

  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL);
    currentObjectURL = null;
  }

  if (activeWp.type === 'video' && activeWp.blob) {
    currentObjectURL = URL.createObjectURL(activeWp.blob);
    videoLayer.src = currentObjectURL;
    videoLayer.style.display = 'block';
  } else if (activeWp.type === 'image') {
    videoLayer.pause();
    videoLayer.style.display = 'none';
    const url = activeWp.blob ? (currentObjectURL = URL.createObjectURL(activeWp.blob)) : activeWp.value;
    setBackgroundWithCrossfade(`url("${url}")`, false);
  } else {
    videoLayer.pause();
    videoLayer.style.display = 'none';
    setBackgroundWithCrossfade(activeWp.value, false);
  }
}

window.addEventListener('mousemove', (e) => {
  const container = document.getElementById('wallpaper-container');
  if (!state.theme.parallax) {
    container.style.transform = 'translate3d(0, 0, 0)';
    return;
  }
  const x = (e.clientX / window.innerWidth - 0.5) * -18;
  const y = (e.clientY / window.innerHeight - 0.5) * -18;
  container.style.transform = `translate3d(${x}px, ${y}px, 0)`;
});

// ============================================================================
// BENTO GRID И ПЕРЕТАСКИВАНИЕ КАРТОЧЕК
// ============================================================================

function renderGrid() {
  const grid = document.getElementById('bento-grid');
  grid.innerHTML = '';

  state.widgetsOrder.forEach((widgetId) => {
    const cfg = state.widgetsConfig[widgetId];
    if (!cfg || !cfg.enabled) return;

    const card = document.createElement('section');
    card.className = `widget-card ${cfg.size} ${cfg.minimized ? 'minimized' : ''}`;
    card.dataset.widgetId = widgetId;
    card.draggable = document.body.classList.contains('edit-mode');

    card.innerHTML = `
      <div class="widget-header">
        <div class="widget-title"><span>${cfg.title}</span></div>
        <div class="widget-controls">
          <button class="ctrl-btn btn-resize" title="Изменить размер">⤢</button>
          <button class="ctrl-btn btn-minimize" title="Свернуть/Развернуть">${cfg.minimized ? '+' : '−'}</button>
          <button class="ctrl-btn btn-hide" title="Скрыть виджет">&times;</button>
        </div>
      </div>
      <div class="widget-body" id="body-${widgetId}"></div>
    `;

    card.querySelector('.btn-resize').addEventListener('click', () => cycleWidgetSize(widgetId));
    card.querySelector('.btn-minimize').addEventListener('click', () => {
      cfg.minimized = !cfg.minimized;
      Storage.save();
      renderGrid();
    });
    card.querySelector('.btn-hide').addEventListener('click', () => {
      cfg.enabled = false;
      Storage.save();
      renderGrid();
      renderSettingsToggles();
    });

    setupCardDragAndDrop(card, widgetId);
    grid.appendChild(card);

    const bodyEl = card.querySelector(`#body-${widgetId}`);
    if (WidgetRenderers[widgetId]) WidgetRenderers[widgetId](bodyEl, cfg);
  });
}

function cycleWidgetSize(widgetId) {
  const sizes = ['size-compact', 'size-medium', 'size-wide', 'size-banner'];
  const cfg = state.widgetsConfig[widgetId];
  cfg.size = sizes[(sizes.indexOf(cfg.size) + 1) % sizes.length];
  Storage.save();
  renderGrid();
}

let draggedWidgetId = null;
function setupCardDragAndDrop(card, widgetId) {
  card.addEventListener('dragstart', (e) => {
    if (!document.body.classList.contains('edit-mode')) { e.preventDefault(); return; }
    draggedWidgetId = widgetId;
    card.classList.add('dragging');
  });
  card.addEventListener('dragend', () => { card.classList.remove('dragging'); draggedWidgetId = null; });
  card.addEventListener('dragover', (e) => { if (document.body.classList.contains('edit-mode')) e.preventDefault(); });
  card.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!draggedWidgetId || draggedWidgetId === widgetId) return;
    const fromIdx = state.widgetsOrder.indexOf(draggedWidgetId);
    const toIdx = state.widgetsOrder.indexOf(widgetId);
    if (fromIdx > -1 && toIdx > -1) {
      state.widgetsOrder.splice(fromIdx, 1);
      state.widgetsOrder.splice(toIdx, 0, draggedWidgetId);
      Storage.save();
      renderGrid();
    }
  });
}

// ============================================================================
// ВИДЖЕТЫ
// ============================================================================

let clockInterval = null;
let timerInterval = null;
let ytmInterval = null;

const TimerRuntime = {
  mode: 'countdown',
  running: false,
  totalSec: 1500,
  remainingSec: 1500,
  elapsedSec: 0,
  laps: []
};

const WidgetRenderers = {
  // 1. ЧАСЫ И ПРИВЕТСТВИЕ
  clock(container, cfg) {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <div class="clock-Display" id="clock-time">00:00</div>
          <div class="clock-date" id="clock-date"></div>
        </div>
        <div style="text-align:right;">
          <div class="clock-greeting" id="clock-greeting"></div>
        </div>
      </div>
    `;

    const updateClock = () => {
      const timeEl = container.querySelector('#clock-time');
      if (!timeEl) return;
      const now = new Date();
      let h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');

      const greetPhase = h < 6 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
      container.querySelector('#clock-greeting').textContent = `${greetPhase}, ${cfg.userName}`;

      let suffix = '';
      if (!cfg.is24h) {
        suffix = h >= 12 ? ' PM' : ' AM';
        h = h % 12 || 12;
      }
      timeEl.textContent = `${String(h).padStart(2, '0')}:${m}${cfg.showSec ? ':' + s : ''}${suffix}`;
      container.querySelector('#clock-date').textContent = new Intl.DateTimeFormat('ru-RU', {
        weekday: 'long', day: 'numeric', month: 'long'
      }).format(now);
    };

    updateClock();
    clearInterval(clockInterval);
    clockInterval = setInterval(updateClock, 1000);
  },

  // 2. УМНЫЙ ПОИСК
  search(container, cfg) {
    const engines = {
      google:    { name: 'Google',  placeholder: 'Поиск в Google...',              url: 'https://www.google.com/search?q=' },
      youtube:   { name: 'YouTube', placeholder: 'Поиск видео на YouTube...',      url: 'https://www.youtube.com/results?search_query=' },
      translate: { name: 'Перевод', placeholder: 'Перевести текст на русский...',  url: 'https://translate.google.com/?sl=auto&tl=ru&text=' },
      gemini:    { name: 'Gemini',  placeholder: 'Спросить у Gemini...',           url: 'https://gemini.google.com/app?q=' }
    };

    if (!engines[cfg.engine]) cfg.engine = 'google';

    container.innerHTML = `
      <div class="search-wrapper">
        <div class="search-modes">
          ${Object.entries(engines).map(([key, item]) => `
            <button class="search-mode-btn ${cfg.engine === key ? 'active' : ''}" data-engine="${key}">${item.name}</button>
          `).join('')}
        </div>
        <input type="text" class="search-input" id="search-input" placeholder="${engines[cfg.engine].placeholder}" autocomplete="off">
      </div>
    `;

    const input = container.querySelector('#search-input');

    container.querySelectorAll('.search-mode-btn').forEach(btn => {
      btn.onclick = () => {
        cfg.engine = btn.dataset.engine;
        Storage.save();
        container.querySelectorAll('.search-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        input.placeholder = engines[cfg.engine].placeholder;
        input.focus();
      };
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        window.location.href = engines[cfg.engine].url + encodeURIComponent(input.value.trim());
      }
    });
  },

  // 3. YOUTUBE MUSIC (Плавный кроссфейд после начала звука или 10 сек)
  ytm(container) {
    const card = container.closest('.widget-card');
    let backdrop = card.querySelector('.ytm-card-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'ytm-card-backdrop';
      card.prepend(backdrop);
    }

    const FALLBACK_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%232c1e54'/%3E%3Cstop offset='100%25' stop-color='%23121420'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='80' fill='url(%23g)'/%3E%3Ccircle cx='40' cy='40' r='18' fill='%237c5cff' fill-opacity='0.25'/%3E%3Cpath d='M35 30l16 10-16 10z' fill='%23fff'/%3E%3C/svg%3E";

    const saved = state.lastYtmTrack || {};
    const formatSec = (s) => `${Math.floor((s || 0) / 60)}:${String(Math.floor((s || 0) % 60)).padStart(2, '0')}`;

    container.innerHTML = `
      <div class="ytm-player" id="ytm-box">
        <img class="ytm-cover" id="ytm-cover" src="${saved.cover || FALLBACK_COVER}" alt="">
        <div class="ytm-info">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="ytm-title" id="ytm-title">${saved.title || 'YouTube Music'}</span>
            <div class="equalizer" id="ytm-eq">
              <div class="eq-bar"></div><div class="eq-bar"></div><div class="eq-bar"></div>
            </div>
          </div>
          <div class="ytm-artist" id="ytm-artist">${saved.artist ? `${saved.artist} • пауза на ${formatSec(saved.currentTime)}` : 'Нажмите Play для запуска'}</div>
          <div class="progress-track" style="margin-top:9px;">
            <div class="progress-fill" id="ytm-progress" style="width:${saved.progress || 0}%"></div>
          </div>
          <div class="ytm-controls">
            <button class="ytm-btn" id="ytm-prev" title="Предыдущий трек">⏮</button>
            <button class="ytm-btn primary" id="ytm-toggle" title="Воспроизвести / Пауза">⏯</button>
            <button class="ytm-btn" id="ytm-next" title="Следующий трек">⏭</button>
            <button class="btn-mini" id="ytm-open" style="margin-left:auto;">Открыть ↗</button>
          </div>
        </div>
      </div>
    `;

    if (saved.cover) {
      backdrop.style.backgroundImage = `url("${saved.cover}")`;
      backdrop.classList.add('has-cover');
    }

    let autoBootAttempted = false;
    let appliedCoverUrl = saved.cover || '';
    let pendingCoverUrl = '';
    let pendingSince = 0;

    const commitCoverTransition = (coverUrl) => {
      if (!coverUrl || appliedCoverUrl === coverUrl) return;
      appliedCoverUrl = coverUrl;
      pendingCoverUrl = '';
      pendingSince = 0;

      const preloader = new Image();
      preloader.crossOrigin = 'Anonymous';
      preloader.onload = async () => {
        backdrop.style.backgroundImage = `url("${coverUrl}")`;
        backdrop.classList.add('has-cover');

        activeYtmCoverUrl = coverUrl;
        const extracted = await extractColorFromCover(coverUrl);
        if (extracted) {
          currentExtractedColor = extracted;
          state.lastYtmTrack.extractedAccent = extracted;
          Storage.save();
        }
        await applyThemeAndWallpaper();
      };
      preloader.onerror = () => {
        activeYtmCoverUrl = coverUrl;
        applyThemeAndWallpaper();
      };
      preloader.src = coverUrl;
    };

    const handleCoverUpdate = (coverUrl, isPlaying) => {
      if (!coverUrl) return;
      container.querySelector('#ytm-cover').src = coverUrl;

      if (coverUrl === appliedCoverUrl) {
        pendingCoverUrl = '';
        pendingSince = 0;
        return;
      }

      if (pendingCoverUrl !== coverUrl) {
        pendingCoverUrl = coverUrl;
        pendingSince = Date.now();
      }

      const waitedMs = Date.now() - pendingSince;
      if (isPlaying || waitedMs >= 10000) {
        commitCoverTransition(coverUrl);
      }
    };

    const updateUI = (res) => {
      const titleEl = container.querySelector('#ytm-title');
      if (!titleEl) return;

      if (!res || !res.connected) {
        container.querySelector('#ytm-box').classList.remove('playing');
        const mem = state.lastYtmTrack || {};
        if (mem.title) {
          titleEl.textContent = mem.title;
          container.querySelector('#ytm-artist').textContent = `${mem.artist} • пауза на ${formatSec(mem.currentTime)}`;
        } else {
          titleEl.textContent = 'YouTube Music готов';
          container.querySelector('#ytm-artist').textContent = 'Нажмите ⏯ для запуска в фоне';
        }

        if (!autoBootAttempted && mem.autoResumeOnStart !== false && mem.title) {
          autoBootAttempted = true;
          sendCommand('BOOT_SAVED');
        }
        return;
      }

      if (res.title) {
        titleEl.textContent = res.title;
        container.querySelector('#ytm-artist').textContent = res.artist || 'YouTube Music';

        state.lastYtmTrack = {
          ...state.lastYtmTrack,
          title: res.title,
          artist: res.artist || '',
          cover: res.cover || state.lastYtmTrack?.cover || '',
          trackUrl: res.trackUrl || state.lastYtmTrack?.trackUrl || 'https://music.youtube.com',
          currentTime: res.currentTime || 0,
          progress: res.progress || 0
        };
        Storage.save();
      }

      const coverToShow = res.cover || state.lastYtmTrack?.cover;
      if (coverToShow) handleCoverUpdate(coverToShow, !!res.isPlaying);

      container.querySelector('#ytm-progress').style.width = `${res.progress || 0}%`;
      container.querySelector('#ytm-box').classList.toggle('playing', !!res.isPlaying);
    };

    const pollYTM = () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'YTM_GET_STATUS' }, updateUI);
      }
    };

    const sendCommand = (action) => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'YTM_COMMAND',
          action,
          savedTrack: state.lastYtmTrack
        }, updateUI);
      } else {
        window.open('https://music.youtube.com', '_blank');
      }
    };

    container.querySelector('#ytm-prev').onclick = () => sendCommand('PREV');
    container.querySelector('#ytm-toggle').onclick = () => sendCommand('OPEN_OR_TOGGLE');
    container.querySelector('#ytm-next').onclick = () => sendCommand('NEXT');
    container.querySelector('#ytm-open').onclick = () => window.open(state.lastYtmTrack?.trackUrl || 'https://music.youtube.com', '_blank');

    pollYTM();
    clearInterval(ytmInterval);
    ytmInterval = setInterval(pollYTM, 1000);
  },

  // 4. БЫСТРЫЕ ЗАКЛАДКИ
  speeddial(container) {
    let draggedBmIdx = null;

    const drawBookmarks = () => {
      container.innerHTML = `<div class="speed-dial-grid" id="dial-grid"></div>`;
      const grid = container.querySelector('#dial-grid');

      state.bookmarks.forEach((bm, idx) => {
        let domain = 'google.com';
        try { domain = new URL(bm.url).hostname; } catch (e) {}
        const favicon = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(domain)}`;

        const a = document.createElement('a');
        a.className = 'dial-item';
        a.href = bm.url;
        a.draggable = true;
        a.innerHTML = `
          <span class="dial-remove" title="Удалить">&times;</span>
          <img src="${favicon}" alt="${bm.title}">
          <span style="max-width:68px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${bm.title}</span>
        `;

        a.querySelector('.dial-remove').addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          state.bookmarks.splice(idx, 1);
          Storage.save();
          drawBookmarks();
        });

        a.addEventListener('dragstart', (e) => {
          e.stopPropagation();
          draggedBmIdx = idx;
          a.classList.add('bm-dragging');
        });
        a.addEventListener('dragend', () => {
          a.classList.remove('bm-dragging');
          draggedBmIdx = null;
        });
        a.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
        a.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (draggedBmIdx === null || draggedBmIdx === idx) return;
          const [moved] = state.bookmarks.splice(draggedBmIdx, 1);
          state.bookmarks.splice(idx, 0, moved);
          Storage.save();
          drawBookmarks();
        });

        grid.appendChild(a);
      });

      const addTile = document.createElement('button');
      addTile.className = 'dial-item dial-add-tile';
      addTile.innerHTML = `<span style="font-size:20px; line-height:1;">+</span><span>Добавить</span>`;
      addTile.onclick = () => {
        const title = prompt('Название сайта (например: Twitch):');
        if (!title) return;
        let url = prompt('Ссылка (например: twitch.tv):');
        if (!url) return;
        if (!url.startsWith('http')) url = 'https://' + url.trim();
        state.bookmarks.push({ title: title.trim(), url });
        Storage.save();
        drawBookmarks();
      };
      grid.appendChild(addTile);
    };

    drawBookmarks();
  },

  // 5. ЗАДАЧИ И ЗАМЕТКИ
  todo(container) {
    let activeTab = 'notes';

    const draw = () => {
      container.innerHTML = `
        <div class="segmented-control">
          <button class="seg-btn ${activeTab === 'notes' ? 'active' : ''}" id="tab-notes">Заметки</button>
          <button class="seg-btn ${activeTab === 'todo' ? 'active' : ''}" id="tab-todo">Задачи (${state.todos.filter(t => !t.done).length})</button>
        </div>
        <div id="notes-pane" class="notes-wrapper ${activeTab === 'notes' ? '' : 'hidden'}">
          <textarea class="notes-area" id="notes-area" placeholder="Запишите мысль, идею или ссылку...">${state.notes || ''}</textarea>
          <div class="notes-footer">
            <span id="notes-status">Сохранено</span>
            <span id="notes-count">${(state.notes || '').length} симв.</span>
          </div>
        </div>
        <div id="todo-pane" class="${activeTab === 'todo' ? '' : 'hidden'}">
          <div class="todo-list" id="todo-list"></div>
          <div style="display:flex; gap:6px; margin-top:8px;">
            <input type="text" id="todo-input" class="input-text" placeholder="Новая задача..." style="flex:1;">
            <button class="btn-mini" id="todo-add">+</button>
          </div>
        </div>
      `;

      container.querySelector('#tab-notes').onclick = () => { activeTab = 'notes'; draw(); };
      container.querySelector('#tab-todo').onclick = () => { activeTab = 'todo'; draw(); };

      const notesArea = container.querySelector('#notes-area');
      const countEl = container.querySelector('#notes-count');
      notesArea.addEventListener('input', () => {
        state.notes = notesArea.value;
        countEl.textContent = `${state.notes.length} симв.`;
        Storage.save();
      });

      const listEl = container.querySelector('#todo-list');
      state.todos.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = `todo-item ${item.done ? 'done' : ''}`;
        div.innerHTML = `
          <input type="checkbox" ${item.done ? 'checked' : ''}>
          <span style="flex:1;">${item.text}</span>
          <button class="btn-mini" style="padding:2px 6px; border:none; background:transparent;">&times;</button>
        `;
        div.querySelector('input').onchange = () => { item.done = !item.done; Storage.save(); draw(); };
        div.querySelector('button').onclick = () => { state.todos.splice(idx, 1); Storage.save(); draw(); };
        listEl.appendChild(div);
      });

      const addTodo = () => {
        const inp = container.querySelector('#todo-input');
        if (!inp.value.trim()) return;
        state.todos.push({ id: 't-' + Date.now(), text: inp.value.trim(), done: false });
        Storage.save();
        draw();
      };
      container.querySelector('#todo-add').onclick = addTodo;
      container.querySelector('#todo-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });
    };

    draw();
  },

  // 6. МУЛЬТИ-СЧЁТЧИК
  counter(container) {
    const renderCounters = () => {
      container.innerHTML = `
        <div class="counters-list" id="counters-list"></div>
        <div style="margin-top:10px; display:flex; gap:6px;">
          <input type="text" id="new-counter-name" class="input-text" placeholder="Новый счётчик..." style="flex:1;">
          <input type="number" id="new-counter-target" class="input-text" placeholder="Цель" style="width:65px;" value="10">
          <button class="btn-mini" id="btn-add-counter">+</button>
        </div>
      `;

      const listEl = container.querySelector('#counters-list');
      state.counters.forEach((item, idx) => {
        const pct = item.target > 0 ? Math.min(100, Math.round((item.count / item.target) * 100)) : 0;
        const row = document.createElement('div');
        row.className = 'counter-item';
        row.style.borderLeftColor = item.color || 'var(--accent)';
        row.innerHTML = `
          <div class="counter-top">
            <span class="counter-name">${item.name}</span>
            <span class="counter-value">${item.count} <small style="font-size:11px; color:var(--text-secondary)">/ ${item.target}</small></span>
          </div>
          <div class="progress-track" style="margin-top:6px;">
            <div class="progress-fill" style="width:${pct}%; background:${item.color || 'var(--accent)'}"></div>
          </div>
          <div class="counter-actions">
            <button class="btn-mini" data-act="dec">-1</button>
            <button class="btn-mini" data-act="inc">+1</button>
            <button class="btn-mini" data-act="step">+${item.step}</button>
            <button class="btn-mini" data-act="setstep">Шаг</button>
            <button class="btn-mini" data-act="reset">0</button>
            <button class="btn-mini" data-act="del" style="margin-left:auto; color:#ff8080;">&times;</button>
          </div>
        `;
        const modify = (delta, reset = false) => {
          item.count = reset ? 0 : Math.max(0, item.count + delta);
          Storage.save();
          renderCounters();
        };
        row.querySelector('[data-act="dec"]').onclick = () => modify(-1);
        row.querySelector('[data-act="inc"]').onclick = () => modify(1);
        row.querySelector('[data-act="step"]').onclick = () => modify(item.step);
        row.querySelector('[data-act="reset"]').onclick = () => modify(0, true);
        row.querySelector('[data-act="setstep"]').onclick = () => {
          const val = parseInt(prompt('Шаг прибавления:', item.step), 10);
          if (!isNaN(val) && val > 0) { item.step = val; Storage.save(); renderCounters(); }
        };
        row.querySelector('[data-act="del"]').onclick = () => { state.counters.splice(idx, 1); Storage.save(); renderCounters(); };
        listEl.appendChild(row);
      });

      container.querySelector('#btn-add-counter').onclick = () => {
        const name = container.querySelector('#new-counter-name').value.trim();
        if (!name) return;
        const colors = ['#38bdf8', '#a855f7', '#22c55e', '#f97316'];
        state.counters.push({
          id: 'c-' + Date.now(),
          name,
          count: 0,
          step: 1,
          target: parseInt(container.querySelector('#new-counter-target').value, 10) || 10,
          color: colors[state.counters.length % colors.length]
        });
        Storage.save();
        renderCounters();
      };
    };
    renderCounters();
  },

  // 7. ТАЙМЕР И ПОМОДОРО
  timer(container) {
    const formatTime = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
    const drawTimer = () => {
      const circumference = 276;
      const progressPct = TimerRuntime.mode === 'stopwatch'
        ? (TimerRuntime.elapsedSec % 60) / 60
        : (TimerRuntime.totalSec > 0 ? TimerRuntime.remainingSec / TimerRuntime.totalSec : 0);
      const displaySec = TimerRuntime.mode === 'stopwatch' ? TimerRuntime.elapsedSec : TimerRuntime.remainingSec;
      const dashOffset = circumference - progressPct * circumference;

      container.innerHTML = `
        <div class="segmented-control">
          <button class="seg-btn ${TimerRuntime.mode === 'countdown' ? 'active' : ''}" data-mode="countdown">Таймер</button>
          <button class="seg-btn ${TimerRuntime.mode === 'pomodoro' ? 'active' : ''}" data-mode="pomodoro">Pomodoro</button>
          <button class="seg-btn ${TimerRuntime.mode === 'stopwatch' ? 'active' : ''}" data-mode="stopwatch">Секундомер</button>
        </div>
        <div class="timer-center">
          <div class="svg-ring-wrap">
            <svg class="svg-ring">
              <circle class="ring-bg" cx="52" cy="52" r="44"></circle>
              <circle class="ring-progress" cx="52" cy="52" r="44" style="stroke-dashoffset:${dashOffset}"></circle>
            </svg>
            <div class="timer-readout">${formatTime(displaySec)}</div>
          </div>
          <div class="timer-side-controls">
            <div style="display:flex; gap:6px;">
              <button class="btn-primary" id="btn-timer-start" style="flex:1;">${TimerRuntime.running ? 'Пауза' : 'Старт'}</button>
              <button class="btn-secondary" id="btn-timer-reset">Сброс</button>
            </div>
            <div style="display:flex; gap:4px; flex-wrap:wrap;">
              <button class="btn-mini" data-preset="300">5м</button>
              <button class="btn-mini" data-preset="900">15м</button>
              <button class="btn-mini" data-preset="1500">25м</button>
              <button class="btn-mini" data-preset="2700">45м</button>
            </div>
          </div>
        </div>
      `;

      container.querySelectorAll('.seg-btn').forEach(btn => {
        btn.onclick = () => {
          TimerRuntime.running = false;
          TimerRuntime.mode = btn.dataset.mode;
          TimerRuntime.elapsedSec = 0;
          TimerRuntime.totalSec = 1500;
          TimerRuntime.remainingSec = 1500;
          drawTimer();
        };
      });
      container.querySelector('#btn-timer-start').onclick = () => { TimerRuntime.running = !TimerRuntime.running; drawTimer(); };
      container.querySelector('#btn-timer-reset').onclick = () => {
        TimerRuntime.running = false;
        TimerRuntime.remainingSec = TimerRuntime.totalSec;
        TimerRuntime.elapsedSec = 0;
        drawTimer();
      };
      container.querySelectorAll('[data-preset]').forEach(b => {
        b.onclick = () => {
          const sec = parseInt(b.dataset.preset, 10);
          TimerRuntime.running = false;
          TimerRuntime.totalSec = sec;
          TimerRuntime.remainingSec = sec;
          drawTimer();
        };
      });
    };

    drawTimer();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!TimerRuntime.running) return;
      if (TimerRuntime.mode === 'stopwatch') {
        TimerRuntime.elapsedSec++;
      } else if (TimerRuntime.remainingSec > 0) {
        TimerRuntime.remainingSec--;
      } else {
        TimerRuntime.running = false;
        playSoftChime();
      }
      if (document.getElementById('body-timer')) drawTimer();
    }, 1000);
  },

  // 8. ПОГОДА
  weather(container, cfg) {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${cfg.lat}&longitude=${cfg.lon}&current=temperature_2m,apparent_temperature,wind_speed_10m&timezone=auto`)
      .then(r => r.json())
      .then(data => {
        const cur = data.current;
        container.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-family:var(--font-display); font-size:28px; font-weight:700;">${Math.round(cur.temperature_2m)}°C</div>
              <div style="font-size:12px; color:var(--text-secondary);">Ощущается как ${Math.round(cur.apparent_temperature)}°C</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:600; font-size:14px;">${cfg.city}</div>
              <button class="btn-mini" id="btn-change-city" style="margin-top:6px;">Город</button>
            </div>
          </div>
        `;
        container.querySelector('#btn-change-city').onclick = () => {
          const newCity = prompt('Введите город:', cfg.city);
          if (!newCity) return;
          fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(newCity)}&count=1&language=ru`)
            .then(r => r.json())
            .then(geo => {
              if (geo.results && geo.results[0]) {
                cfg.city = geo.results[0].name;
                cfg.lat = geo.results[0].latitude;
                cfg.lon = geo.results[0].longitude;
                Storage.save();
                WidgetRenderers.weather(container, cfg);
              }
            });
        };
      });
  },

  // 9. ТРЕКЕР ПРИВЫЧЕК
  habits(container) {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    const drawHabits = () => {
      container.innerHTML = '';
      state.habits.forEach(h => {
        const row = document.createElement('div');
        row.className = 'habit-row';
        row.innerHTML = `<span style="font-size:12px;">${h.name}</span><div class="habit-cells"></div>`;
        const cells = row.querySelector('.habit-cells');
        last7Days.forEach(dateKey => {
          const cell = document.createElement('div');
          cell.className = `habit-cell ${h.days[dateKey] ? 'done' : ''}`;
          cell.onclick = () => { h.days[dateKey] = !h.days[dateKey]; Storage.save(); drawHabits(); };
          cells.appendChild(cell);
        });
        container.appendChild(row);
      });
    };
    drawHabits();
  },

  // 10. КРИПТА И КУРСЫ
  crypto(container) {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,the-open-network,ethereum&vs_currencies=usd')
      .then(r => r.json())
      .then(data => {
        container.innerHTML = `
          <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;"><span>Bitcoin</span><strong>$${(data.bitcoin?.usd || 0).toLocaleString()}</strong></div>
          <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;"><span>Ethereum</span><strong>$${(data.ethereum?.usd || 0).toLocaleString()}</strong></div>
          <div style="display:flex; justify-content:space-between; font-size:13px;"><span>Toncoin</span><strong>$${data['the-open-network']?.usd || '—'}</strong></div>
        `;
      });
  },

  // 11. СЛОВО ДНЯ
  vocab(container) {
    const drawWord = () => {
      const list = state.vocabList || DEFAULT_VOCAB;
      const item = list[state.vocabIndex % list.length];
      container.innerHTML = `
        <div style="font-size:16px; font-weight:700; color:var(--accent);">${item.word}</div>
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">${item.trans || ''}</div>
        <div style="font-size:12px; color:var(--text-secondary);">${item.meaning}</div>
        <button class="btn-mini" id="btn-next-word" style="margin-top:8px; align-self:flex-start;">Дальше →</button>
      `;
      container.querySelector('#btn-next-word').onclick = () => {
        state.vocabIndex = (state.vocabIndex + 1) % list.length;
        Storage.save();
        drawWord();
      };
    };
    drawWord();
  }
};

// ============================================================================
// МИНИАТЮРНОЕ КОМАНДНОЕ МЕНЮ (ALT + K / CTRL + K) И НАСТРОЙКИ
// ============================================================================

function renderSettingsToggles() {
  const container = document.getElementById('widget-toggles');
  container.innerHTML = '';
  Object.entries(state.widgetsConfig).forEach(([id, cfg]) => {
    const btn = document.createElement('button');
    btn.className = `toggle-pill ${cfg.enabled ? 'active' : ''}`;
    btn.textContent = cfg.title;
    btn.onclick = () => { cfg.enabled = !cfg.enabled; Storage.save(); renderSettingsToggles(); renderGrid(); };
    container.appendChild(btn);
  });
}

async function renderWallpaperManager() {
  const presetBox = document.getElementById('preset-wallpapers');
  presetBox.innerHTML = '';
  PRESET_WALLPAPERS.forEach(wp => {
    const div = document.createElement('div');
    div.className = `preset-thumb ${state.theme.wallpaperId === wp.id ? 'active' : ''}`;
    div.style.backgroundImage = wp.type === 'image' ? `url("${wp.value}")` : wp.value;
    div.onclick = () => { state.theme.wallpaperId = wp.id; Storage.save(); applyThemeAndWallpaper(); renderWallpaperManager(); };
    presetBox.appendChild(div);
  });

  const customList = document.getElementById('custom-wallpapers-list');
  customList.innerHTML = '';
  const customFiles = await WallpaperDB.getAll();
  customFiles.forEach(file => {
    const pill = document.createElement('div');
    pill.className = 'chip';
    pill.innerHTML = `<span>${file.type === 'video' ? '🎬' : '🖼'} ${file.name.slice(0, 14)}</span> <strong data-del="${file.id}" style="color:#ff8080;">&times;</strong>`;
    pill.onclick = (e) => {
      if (e.target.dataset.del) { WallpaperDB.delete(file.id).then(() => renderWallpaperManager()); return; }
      state.theme.wallpaperId = file.id;
      Storage.save();
      applyThemeAndWallpaper();
      renderWallpaperManager();
    };
    customList.appendChild(pill);
  });
}

function initSettingsBindings() {
  const drawer = document.getElementById('settings-drawer');
  const quickDockBackdrop = document.getElementById('quick-dock-backdrop');
  const editBar = document.getElementById('edit-mode-bar');

  const dockZenBtn = document.getElementById('dock-zen');
  const dockGridBtn = document.getElementById('dock-grid');
  const dockCustomizeBtn = document.getElementById('dock-customize');
  const statusZen = document.getElementById('status-zen');
  const statusGrid = document.getElementById('status-grid');

  const syncDockStates = () => {
    const isZen = document.body.classList.contains('zen-mode');
    const isEdit = document.body.classList.contains('edit-mode');
    dockZenBtn.classList.toggle('active', isZen);
    statusZen.textContent = isZen ? 'Вкл' : 'Выкл';
    dockGridBtn.classList.toggle('active', isEdit);
    statusGrid.textContent = isEdit ? 'Вкл' : 'Выкл';
    editBar.classList.toggle('hidden', !isEdit);
  };

  const toggleQuickDock = (forceState) => {
    const shouldOpen = typeof forceState === 'boolean' ? forceState : quickDockBackdrop.classList.contains('hidden');
    syncDockStates();
    quickDockBackdrop.classList.toggle('hidden', !shouldOpen);
  };

  quickDockBackdrop.addEventListener('click', (e) => {
    if (e.target === quickDockBackdrop) toggleQuickDock(false);
  });

  dockZenBtn.onclick = () => {
    document.body.classList.toggle('zen-mode');
    syncDockStates();
    toggleQuickDock(false);
  };

  dockGridBtn.onclick = () => {
    document.body.classList.toggle('edit-mode');
    syncDockStates();
    renderGrid();
    toggleQuickDock(false);
  };

  document.getElementById('btn-exit-edit').onclick = () => {
    document.body.classList.remove('edit-mode');
    syncDockStates();
    renderGrid();
  };

  dockCustomizeBtn.onclick = () => {
    toggleQuickDock(false);
    drawer.classList.add('open');
  };

  document.getElementById('btn-close-settings').onclick = () => drawer.classList.remove('open');

  window.addEventListener('keydown', (e) => {
    const isShortcut = (e.altKey || e.ctrlKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'л');
    if (isShortcut) {
      e.preventDefault();
      drawer.classList.remove('open');
      toggleQuickDock();
      return;
    }

    if (e.key === 'Escape') {
      if (!quickDockBackdrop.classList.contains('hidden')) {
        toggleQuickDock(false);
      } else if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
      } else if (document.body.classList.contains('edit-mode')) {
        document.body.classList.remove('edit-mode');
        syncDockStates();
        renderGrid();
      }
    }
  });

  document.getElementById('wallpaper-upload').addEventListener('change', async (e) => {
    for (const file of Array.from(e.target.files || [])) {
      const saved = await WallpaperDB.addWallpaper(file);
      state.theme.wallpaperId = saved.id;
    }
    Storage.save();
    await applyThemeAndWallpaper();
    await renderWallpaperManager();
  });

  const dynChk = document.getElementById('chk-dynamic-accent');
  dynChk.checked = state.theme.dynamicAccent !== false;
  dynChk.onchange = () => {
    state.theme.dynamicAccent = dynChk.checked;
    Storage.save();
    applyAccentColorVariables(currentExtractedColor);
  };

  const chk24h = document.getElementById('chk-clock-24h');
  chk24h.checked = state.widgetsConfig.clock.is24h;
  chk24h.onchange = () => { state.widgetsConfig.clock.is24h = chk24h.checked; Storage.save(); renderGrid(); };

  const chkSec = document.getElementById('chk-clock-sec');
  chkSec.checked = state.widgetsConfig.clock.showSec;
  chkSec.onchange = () => { state.widgetsConfig.clock.showSec = chkSec.checked; Storage.save(); renderGrid(); };

  const bindControl = (id, key, valLabelId, unit = '', isNumber = true) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = state.theme[key];
    if (valLabelId) document.getElementById(valLabelId).textContent = state.theme[key] + unit;
    el.addEventListener('input', () => {
      state.theme[key] = isNumber ? Number(el.value) : el.value;
      if (valLabelId) document.getElementById(valLabelId).textContent = state.theme[key] + unit;
      Storage.save();
      applyThemeAndWallpaper();
    });
  };

  bindControl('range-bg-blur', 'bgBlur', 'val-bg-blur', 'px');
  bindControl('range-bg-dim', 'bgDim', 'val-bg-dim', '%');
  bindControl('range-card-opacity', 'cardOpacity', 'val-card-opacity', '%');
  bindControl('range-card-radius', 'cardRadius', 'val-card-radius', 'px');
  bindControl('color-accent', 'accent', null, '', false);
  bindControl('select-font', 'font', null, '', false);
  bindControl('wallpaper-rotation', 'rotation', null, '', false);

  const parallaxChk = document.getElementById('chk-parallax');
  parallaxChk.checked = state.theme.parallax;
  parallaxChk.onchange = () => { state.theme.parallax = parallaxChk.checked; Storage.save(); };

  document.getElementById('btn-export-config').onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `auratab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  document.getElementById('input-import-config').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state = { ...structuredClone(DEFAULT_STATE), ...JSON.parse(reader.result) };
        Storage.save();
        applyThemeAndWallpaper();
        renderSettingsToggles();
        renderGrid();
      } catch (err) { alert('Ошибка чтения JSON.'); }
    };
    reader.readAsText(file);
  };

  document.getElementById('btn-reset-all').onclick = () => {
    if (confirm('Сбросить все настройки?')) { state = structuredClone(DEFAULT_STATE); Storage.save(); location.reload(); }
  };
}

(async function bootstrap() {
  await WallpaperDB.init();
  await Storage.load();
  if (state.lastYtmTrack && state.lastYtmTrack.cover) {
    activeYtmCoverUrl = state.lastYtmTrack.cover;
    if (state.lastYtmTrack.extractedAccent) {
      currentExtractedColor = state.lastYtmTrack.extractedAccent;
    }
  }
  await applyThemeAndWallpaper(true);
  renderSettingsToggles();
  await renderWallpaperManager();
  initSettingsBindings();
  renderGrid();
})();