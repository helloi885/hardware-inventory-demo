(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ComponentVaultTheme = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'component-vault-theme';
  const MODE_STORAGE_KEY = 'component-vault-theme-mode';
  const DEFAULT_THEME = 'classic';

  const THEMES = [
    {
      id: 'classic',
      name: '经典绿',
      description: '元件仓默认配色，清爽护眼',
      mode: 'light',
      themeColor: '#f4f6f5',
      swatch: ['#f4f6f5', '#ffffff', '#168a62', '#17201d']
    },
    {
      id: 'dark',
      name: '深空黑',
      description: '低光环境下长时间使用',
      mode: 'dark',
      themeColor: '#0f1412',
      swatch: ['#0f1412', '#171d1a', '#3ecf93', '#0b100e']
    },
    {
      id: 'midnight',
      name: '午夜蓝',
      description: '深蓝背景，冷静专注',
      mode: 'dark',
      themeColor: '#0b1220',
      swatch: ['#0b1220', '#121b2e', '#5b9cf0', '#080e18']
    },
    {
      id: 'violet',
      name: '暗夜紫',
      description: '紫调暗色，夜间不刺眼',
      mode: 'dark',
      themeColor: '#130f1d',
      swatch: ['#130f1d', '#1c162b', '#b79cf5', '#0e0a16']
    },
    {
      id: 'graphite',
      name: '石墨灰',
      description: '中性灰，适合办公',
      mode: 'dark',
      themeColor: '#111214',
      swatch: ['#111214', '#1a1c1f', '#5ec49a', '#0c0d0f']
    },
    {
      id: 'forest',
      name: '森林绿',
      description: '自然绿意，浅色主题',
      mode: 'light',
      themeColor: '#eef5ef',
      swatch: ['#eef5ef', '#ffffff', '#1f8a5b', '#10261a']
    },
    {
      id: 'ocean',
      name: '海洋蓝',
      description: '清爽蓝白，通透',
      mode: 'light',
      themeColor: '#eef4fa',
      swatch: ['#eef4fa', '#ffffff', '#2b72c0', '#0d2236']
    },
    {
      id: 'sunset',
      name: '日落橙',
      description: '暖橙色调，醒目',
      mode: 'light',
      themeColor: '#fdf3ea',
      swatch: ['#fdf3ea', '#ffffff', '#c46b12', '#2a1710']
    },
    {
      id: 'sakura',
      name: '樱花粉',
      description: '柔和粉调，轻盈',
      mode: 'light',
      themeColor: '#fdf2f5',
      swatch: ['#fdf2f5', '#ffffff', '#c94a62', '#2b1620']
    },
    {
      id: 'snow',
      name: '雪白',
      description: '高对比纯白，清晰',
      mode: 'light',
      themeColor: '#f7f8fa',
      swatch: ['#f7f8fa', '#ffffff', '#2a6fbd', '#1b1f26']
    },
    {
      id: 'cyber',
      name: '赛博青',
      description: '霓虹青，科技感',
      mode: 'dark',
      themeColor: '#071416',
      swatch: ['#071416', '#0d1f22', '#2ee6b0', '#041012']
    },
    {
      id: 'vintage',
      name: '复古棕',
      description: '暖棕暗色，复古质感',
      mode: 'dark',
      themeColor: '#1a1310',
      swatch: ['#1a1310', '#241a16', '#e0a95a', '#120c0a']
    }
  ];

  const THEME_MAP = new Map(THEMES.map(theme => [theme.id, theme]));

  function normalizeThemeId(value) {
    const id = String(value || '').trim().toLowerCase();
    return THEME_MAP.has(id) ? id : DEFAULT_THEME;
  }

  function getTheme(value) {
    return THEME_MAP.get(normalizeThemeId(value));
  }

  function readStoredTheme() {
    try {
      return normalizeThemeId(localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return DEFAULT_THEME;
    }
  }

  function applyTheme(value, options = {}) {
    const theme = getTheme(value);
    if (typeof document === 'undefined') return theme;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme.id);
    root.setAttribute('data-theme-mode', theme.mode);
    root.style.colorScheme = theme.mode;
    if (options.persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, theme.id);
        localStorage.setItem(MODE_STORAGE_KEY, theme.mode);
      } catch (error) {}
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.themeColor || '#f4f6f5');
    const current = document.getElementById('themeCurrent');
    if (current) current.textContent = `当前：${theme.name}`;
    const button = document.getElementById('themeButton');
    if (button) {
      button.title = `切换主题（当前：${theme.name}）`;
      button.setAttribute('aria-label', `切换主题，当前：${theme.name}`);
    }
    updateActiveCard(theme.id);
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('component-vault-theme-change', { detail: { id: theme.id, mode: theme.mode } }));
      } catch (error) {}
    }
    return theme;
  }

  function renderThemeGrid() {
    const grid = typeof document === 'undefined' ? null : document.getElementById('themeGrid');
    if (!grid) return;
    const active = readStoredTheme();
    grid.innerHTML = THEMES.map(theme => `
      <button type="button" class="theme-card${theme.id === active ? ' active' : ''}" data-theme-id="${theme.id}" role="radio" aria-checked="${theme.id === active ? 'true' : 'false'}" aria-label="${theme.name}：${theme.description}">
        <span class="theme-swatch" aria-hidden="true">${theme.swatch.map(color => `<i style="background:${color}"></i>`).join('')}</span>
        <span class="theme-card-copy"><strong>${theme.name}</strong><small>${theme.description}</small></span>
        <span class="theme-check" aria-hidden="true"><i data-lucide="check"></i></span>
      </button>
    `).join('');
    if (typeof window !== 'undefined' && window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
  }

  function updateActiveCard(id) {
    const grid = typeof document === 'undefined' ? null : document.getElementById('themeGrid');
    if (!grid) return;
    grid.querySelectorAll('.theme-card').forEach(card => {
      const active = card.dataset.themeId === id;
      card.classList.toggle('active', active);
      card.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }

  function init() {
    const button = document.getElementById('themeButton');
    const modal = document.getElementById('themeModal');
    const grid = document.getElementById('themeGrid');
    if (!button || !modal || !grid) return;
    renderThemeGrid();
    applyTheme(readStoredTheme(), { persist: false });
    button.addEventListener('click', () => {
      renderThemeGrid();
      updateActiveCard(readStoredTheme());
      if (typeof modal.showModal === 'function') modal.showModal();
    });
    modal.querySelectorAll('.close-modal').forEach(closeButton => {
      closeButton.addEventListener('click', () => modal.close());
    });
    modal.addEventListener('click', event => {
      if (event.target === modal) modal.close();
    });
    grid.addEventListener('click', event => {
      const card = event.target.closest('[data-theme-id]');
      if (!card) return;
      applyTheme(card.dataset.themeId);
    });
    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY) applyTheme(event.newValue, { persist: false });
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
  }

  return {
    STORAGE_KEY,
    MODE_STORAGE_KEY,
    DEFAULT_THEME,
    THEMES,
    normalizeThemeId,
    getTheme,
    readStoredTheme,
    applyTheme,
    renderThemeGrid,
    updateActiveCard,
    init
  };
});
