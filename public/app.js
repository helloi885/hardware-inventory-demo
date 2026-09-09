(() => {
  'use strict';

  const STORAGE_KEY = 'component-vault-demo-data-v1';
  const CATEGORY_COLORS = ['#168a62', '#3377b8', '#c77917', '#7358ac', '#7c938a', '#c84e4e'];
  const titleMap = {
    storage: ['实物位置', '3D 器件收纳'],
    overview: ['工作台', '库存总览'],
    inventory: ['物料管理', '元件明细'],
    transactions: ['库存流水', '出入库记录'],
    projects: ['板卡领料', '板卡 / BOM'],
    solder: ['焊接对料', 'Gerber 对料']
  };

  const lcscApiBase = String(window.LCSC_LOOKUP?.apiBase || '').replace(/\/$/, '');
  let syncStatus = 'local';
  let syncMessage = '本地演示模式 · 数据只保存在当前浏览器';

  const demoData = {
    components: [
      { id: 'cmp-001', name: 'STM32F334C8T6', code: 'C8734', category: 'MCU', brand: 'ST', package: 'LQFP-48', specs: 'Cortex-M4 · 72MHz · 128KB Flash', location: 'A-01-03', quantity: 18, min: 5, supplier: '立创商城', notes: '主控平台首选', updatedAt: '2026-07-12T01:38:00+08:00' },
      { id: 'cmp-002', name: 'EG1192S', code: 'C49307690', category: 'DC-DC 电源', brand: 'EG（屹晶微）', package: 'ESOP-8', specs: '降压型 10V~100V · 3A · 110kHz', location: 'B-02-01', quantity: 30, min: 8, supplier: '立创商城', notes: '', updatedAt: '2026-07-12T01:12:00+08:00' },
      { id: 'cmp-003', name: 'AP63356DV-7', code: 'C2157973', category: 'DC-DC 电源', brand: 'DIODES', package: 'VDFN3020-13', specs: '降压型 3.8V~32V · 3.5A', location: 'B-02-02', quantity: 20, min: 6, supplier: '立创商城', notes: '', updatedAt: '2026-07-11T18:20:00+08:00' },
      { id: 'cmp-004', name: 'SX1308', code: 'C78162', category: 'DC-DC 电源', brand: 'SX（硕芯科技）', package: 'SOT-23-6', specs: '升压型 2V~24V · 2A · 1.2MHz', location: 'B-02-03', quantity: 4, min: 10, supplier: '立创商城', notes: '库存偏低', updatedAt: '2026-07-11T16:42:00+08:00' },
      { id: 'cmp-005', name: 'CH340N', code: 'C506813', category: '接口芯片', brand: 'WCH（沁恒）', package: 'SOP-8', specs: 'USB 转串口 · 3.3V/5V', location: 'A-03-01', quantity: 25, min: 8, supplier: '立创商城', notes: '', updatedAt: '2026-07-10T20:05:00+08:00' },
      { id: 'cmp-006', name: 'INA240A1PWR', code: 'C191104', category: '模拟芯片', brand: 'TI', package: 'TSSOP-8', specs: '电流检测 · 20V/V · -4V~80V', location: 'C-01-04', quantity: 3, min: 5, supplier: '立创商城', notes: '电机电流采样', updatedAt: '2026-07-10T17:30:00+08:00' },
      { id: 'cmp-007', name: 'UCC21520DWR', code: 'C192067', category: '栅极驱动', brand: 'TI', package: 'SOIC-16W', specs: '双通道隔离驱动 · 4A/6A', location: 'C-02-01', quantity: 12, min: 4, supplier: '立创商城', notes: '', updatedAt: '2026-07-09T14:15:00+08:00' },
      { id: 'cmp-008', name: 'DRV8313RHHR', code: 'C92458', category: '电机驱动', brand: 'TI', package: 'VQFN-36', specs: '三路半桥 · 2.5A · 8V~60V', location: 'C-02-02', quantity: 0, min: 3, supplier: '立创商城', notes: '待采购', updatedAt: '2026-07-09T10:08:00+08:00' },
      { id: 'cmp-009', name: 'CH224K', code: 'C970725', category: '接口芯片', brand: 'WCH（沁恒）', package: 'ESSOP-10', specs: 'USB PD 受电协议 · 5V~20V', location: 'A-03-02', quantity: 16, min: 5, supplier: '立创商城', notes: '', updatedAt: '2026-07-08T19:20:00+08:00' },
      { id: 'cmp-010', name: 'TPD4E05U06DQAR', code: 'C138714', category: '保护器件', brand: 'TI', package: 'USON-10', specs: '4 通道 ESD · 5.5V · 0.5pF', location: 'D-01-01', quantity: 42, min: 15, supplier: '立创商城', notes: '', updatedAt: '2026-07-08T13:54:00+08:00' },
      { id: 'cmp-011', name: '100nF ±10% 50V', code: 'C14663', category: '电容', brand: '三星电机', package: '0603', specs: 'X7R · 100nF · ±10% · 50V', location: 'E-01-02', quantity: 86, min: 50, supplier: '立创商城', notes: '通用去耦', updatedAt: '2026-07-07T21:32:00+08:00' },
      { id: 'cmp-012', name: '10kΩ ±1%', code: 'C25804', category: '电阻', brand: '厚声', package: '0603', specs: '10kΩ · ±1% · 100mW', location: 'E-02-01', quantity: 120, min: 50, supplier: '立创商城', notes: '通用阻值', updatedAt: '2026-07-07T18:10:00+08:00' }
    ],
    transactions: [
      { id: 'txn-001', componentId: 'cmp-001', type: 'in', quantity: 10, note: '采购到货', createdAt: '2026-07-12T01:38:00+08:00' },
      { id: 'txn-002', componentId: 'cmp-004', type: 'out', quantity: 6, note: '升压模块打样', createdAt: '2026-07-11T16:42:00+08:00' },
      { id: 'txn-003', componentId: 'cmp-006', type: 'out', quantity: 2, note: '电流采样板', createdAt: '2026-07-10T17:30:00+08:00' },
      { id: 'txn-004', componentId: 'cmp-005', type: 'in', quantity: 20, note: '采购补充', createdAt: '2026-07-10T20:05:00+08:00' },
      { id: 'txn-005', componentId: 'cmp-008', type: 'out', quantity: 3, note: '无刷电机驱动板', createdAt: '2026-07-09T10:08:00+08:00' },
      { id: 'txn-006', componentId: 'cmp-010', type: 'in', quantity: 30, note: '常用料补货', createdAt: '2026-07-08T13:54:00+08:00' }
    ],
    boardProjects: [],
    lastSavedAt: new Date().toISOString()
  };

  const CURRENT_SEED_VERSION = 'demo-v2';
  const initialData = { ...demoData, favorites: [], boardProjects: [], seedVersion: CURRENT_SEED_VERSION };

  let state = loadLocalState();
  let currentView = 'overview';
  let adjustMode = 'in';
  let transactionFilter = 'all';
  let scanStream = null;
  let scanTimer = null;
  let scanBusy = false;
  let scanStartedAt = 0;
  let barcodeDetector = null;
  let scanReturnToComponent = false;
  let resumeScanAfterSave = false;
  let batchMode = 'in';
  let lastScan = { fingerprint: '', at: 0 };
  let lastDecodedScan = null;
  let pendingBomDraft = null;
  let lastBomSession = null;
  let solderMatchMode = false;
  let solderState = { archive: null, zipBytes: null, zipName: '', savedId: '', pnp: [], bomLines: [], bomName: '', bomOrigin: 'none', rejectSessionBom: false, selectedLineId: '', marked: [], mode: 'both' };
  let solderLayoutObserver = null;
  let savedSolderBoards = [];
  let bomBoardCountTimer = null;
  const bomSearchTimers = new WeakMap();
  const selectedComponentIds = new Set();
  let scannerBuffer = '';
  let scannerLastKeyAt = 0;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function localStorageKey() {
    return STORAGE_KEY;
  }

  function normalizeKey(value) {
    return String(value || '').trim().toLocaleLowerCase('zh-CN');
  }

  function inferStorageLayout(data) {
    if (data?.storageLayout === 'example') return 'example';
    return 'full';
  }

  function migrateState(saved) {
    const next = clone(saved);
    next.favorites = Array.isArray(next.favorites)
      ? next.favorites.filter(id => next.components.some(item => item.id === id))
      : [];
    next.boardProjects = Array.isArray(next.boardProjects) ? clone(next.boardProjects) : [];
    next.storage3d = next.storage3d && typeof next.storage3d === 'object' ? clone(next.storage3d) : {};
    next.storageBoxes = Array.isArray(next.storageBoxes) ? clone(next.storageBoxes) : [];
    next.storageLayout = inferStorageLayout(next);
    return next;
  }

  function isValidState(value) {
    return value && Array.isArray(value.components) && Array.isArray(value.transactions);
  }

  function emptyCloudState() {
    return clone(initialData);
  }

  function loadLocalState() {
    try {
      const raw = localStorage.getItem(localStorageKey());
      const saved = JSON.parse(raw);
      if (isValidState(saved)) return migrateState(saved);
    } catch (error) {
      console.warn('无法读取本地库存数据，已使用空仓库。', error);
    }
    return emptyCloudState();
  }

  function persistLocal() {
    localStorage.setItem(localStorageKey(), JSON.stringify(state));
  }

  function setSyncStatus(status, message) {
    syncStatus = status;
    syncMessage = message;
    updateSyncUi();
  }

  function updateSyncUi() {
    const title = $('#syncTitle');
    const detail = $('#lastSaved');
    const statusBox = $('#sidebarStatus');
    if (!title || !detail || !statusBox) return;

    title.textContent = '本地演示模式';
    detail.textContent = syncMessage || relativeTime(state.lastSavedAt);
    statusBox.dataset.sync = 'local';
  }

  function saveState() {
    state.storageLayout = inferStorageLayout(state);
    state.lastSavedAt = new Date().toISOString();
    persistLocal();
    renderAll();
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function currentActor() {
    return '本机演示';
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('zh-CN').format(Number(value) || 0);
  }

  function formatDate(value, withTime = false) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return new Intl.DateTimeFormat('zh-CN', withTime
      ? { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }
      : { year: 'numeric', month: '2-digit', day: '2-digit' }
    ).format(date);
  }

  function relativeTime(value) {
    const elapsed = Date.now() - new Date(value).getTime();
    if (elapsed < 60000) return '刚刚更新';
    if (elapsed < 3600000) return `${Math.max(1, Math.floor(elapsed / 60000))} 分钟前更新`;
    if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)} 小时前更新`;
    return `${formatDate(value)} 更新`;
  }

  function categories() {
    return [...new Set(state.components.map(item => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }

  function componentById(id) {
    return state.components.find(component => component.id === id);
  }

  function stockState(component) {
    if (component.quantity <= 0) return { key: 'zero', label: '缺货' };
    if (component.quantity <= component.min) return { key: 'low', label: '库存偏低' };
    return { key: 'normal', label: '库存正常' };
  }

  function componentInitial(component) {
    const text = component.category || component.name || 'IC';
    return text.replace(/[^A-Za-z0-9\u4e00-\u9fa5]/g, '').slice(0, 2).toUpperCase();
  }

  function switchView(view) {
    if (!titleMap[view]) return;
    currentView = view;
    $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    $$('.view').forEach(panel => panel.classList.toggle('active', panel.dataset.viewPanel === view));
    $('#pageEyebrow').textContent = titleMap[view][0];
    $('#pageTitle').textContent = titleMap[view][1];
    if (view === 'inventory') renderInventory();
    if (view === 'transactions') renderTransactions();
    if (view === 'projects') renderProjects();
    if (view === 'solder') enterSolderView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function isFavorite(id) {
    return Array.isArray(state.favorites) && state.favorites.includes(id);
  }

  function ensureFavorites() {
    if (!Array.isArray(state.favorites)) state.favorites = [];
  }

  function toggleFavorite(id) {
    ensureFavorites();
    const index = state.favorites.indexOf(id);
    if (index >= 0) {
      state.favorites.splice(index, 1);
      showToast('已取消收藏');
    } else {
      state.favorites.unshift(id);
      showToast('已加入收藏夹');
    }
    saveState();
  }

  function lowStockItems() {
    return state.components
      .filter(item => item.quantity <= item.min)
      .sort((a, b) => (a.quantity / Math.max(1, a.min)) - (b.quantity / Math.max(1, b.min)));
  }

  function restockNeed(item) {
    return Math.max(0, Number(item.min) - Number(item.quantity));
  }

  function isSameLocalDay(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    return date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth()
      && date.getDate() === now.getDate();
  }

  function openInventoryWithFilter({ stock = 'all', location = 'all', search = '', category = 'all' } = {}) {
    $('#inventorySearch').value = search;
    $('#categoryFilter').value = category;
    $('#stockFilter').value = stock;
    if ($('#locationFilter')) $('#locationFilter').value = location;
    switchView('inventory');
    renderInventory();
  }

  function handleStatJump(type) {
    if (type === 'low') {
      openInventoryWithFilter({ stock: 'low' });
      return;
    }
    if (type === 'no-location') {
      openInventoryWithFilter({ location: 'none' });
      return;
    }
    openInventoryWithFilter();
  }

  function renderWelcome() {
    const lowItems = lowStockItems();
    const noLocation = state.components.filter(item => !String(item.location || '').trim()).length;
    const todayTx = state.transactions.filter(item => isSameLocalDay(item.createdAt));
    const todayIn = todayTx.filter(item => item.type === 'in').reduce((sum, item) => sum + Number(item.quantity), 0);
    const todayOut = todayTx.filter(item => item.type === 'out').reduce((sum, item) => sum + Number(item.quantity), 0);
    const health = state.components.length
      ? Math.max(0, Math.round((1 - lowItems.length / state.components.length) * 100))
      : 100;

    const hour = new Date().getHours();
    const greeting = hour < 6 ? '夜深了' : hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好';
    let title = `${greeting}，仓库状态良好`;
    let hint = '点击上方统计卡片可跳转明细；收藏常用料，补货清单一键导出。';
    if (lowItems.length) {
      title = `${greeting}，有 ${lowItems.length} 种料需要补货`;
      hint = '优先处理库存预警；未分配库位的元件建议尽快贴标签上架。';
    } else if (noLocation) {
      title = `${greeting}，还有 ${noLocation} 种料未分配库位`;
      hint = '点击「已用库位」卡片可筛选未上架元件，方便整理货架。';
    }

    if ($('#welcomeTitle')) $('#welcomeTitle').textContent = title;
    if ($('#welcomeHint')) $('#welcomeHint').textContent = hint;
    if ($('#welcomeEyebrow')) $('#welcomeEyebrow').textContent = formatDate(new Date().toISOString());
    if ($('#todayIn')) $('#todayIn').textContent = formatNumber(todayIn);
    if ($('#todayOut')) $('#todayOut').textContent = formatNumber(todayOut);
    if ($('#healthScore')) $('#healthScore').textContent = `${health}%`;
  }

  function renderStats() {
    const totalQuantity = state.components.reduce((sum, item) => sum + Number(item.quantity), 0);
    const lowItems = lowStockItems();
    const locations = new Set(state.components.map(item => item.location).filter(Boolean));
    const noLocation = state.components.filter(item => !String(item.location || '').trim()).length;
    $('#statTypes').textContent = formatNumber(state.components.length);
    $('#statQuantity').textContent = formatNumber(totalQuantity);
    $('#statLow').textContent = formatNumber(lowItems.length);
    $('#statLocations').textContent = formatNumber(locations.size);
    $('#statTypesNote').textContent = `${categories().length} 个分类 · 点击查看`;
    if ($('#statLocationNote')) {
      $('#statLocationNote').textContent = noLocation
        ? `${noLocation} 种未分配 · 点击查看`
        : '全部已上架 · 点击查看';
    }
    $('#navItemCount').textContent = state.components.length;
    refreshNavTitles();
    $('#lowCountBadge').textContent = `${lowItems.length} 项`;
    $('#notificationDot').hidden = lowItems.length === 0;
    renderWelcome();
    updateSyncUi();
    $('#lastSaved').textContent = relativeTime(state.lastSavedAt);
  }

  function renderCategoryChart() {
    const totals = new Map();
    state.components.forEach(item => totals.set(item.category || '未分类', (totals.get(item.category || '未分类') || 0) + Number(item.quantity)));
    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((sum, item) => sum + item[1], 0);
    const top = sorted.slice(0, 5);
    if (sorted.length > 5) top.push(['其他', sorted.slice(5).reduce((sum, item) => sum + item[1], 0)]);

    let cursor = 0;
    const stops = top.map((entry, index) => {
      const start = cursor;
      cursor += total ? (entry[1] / total) * 100 : 0;
      return `${CATEGORY_COLORS[index % CATEGORY_COLORS.length]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    });
    $('#categoryDonut').style.background = total ? `conic-gradient(${stops.join(',')})` : '#e8ecea';
    $('#donutTotal').textContent = formatNumber(total);
    $('#categoryLegend').innerHTML = top.map((entry, index) => {
      const isOther = entry[0] === '其他';
      return `
      <button type="button" class="legend-row ${isOther ? 'is-static' : ''}" data-category-jump="${isOther ? '' : escapeHtml(entry[0])}" ${isOther ? 'disabled' : ''}>
        <span class="legend-dot" style="background:${CATEGORY_COLORS[index % CATEGORY_COLORS.length]}"></span>
        <span>${escapeHtml(entry[0])}</span>
        <strong>${total ? Math.round(entry[1] / total * 100) : 0}%</strong>
      </button>`;
    }).join('');
  }

  function renderRecentActivity() {
    const transactions = [...state.transactions]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    $('#recentActivity').innerHTML = transactions.length ? transactions.map(transaction => {
      const component = componentById(transaction.componentId);
      const name = component?.name || transaction.componentName || '已删除元件';
      const canOpen = Boolean(component);
      return `
        <button type="button" class="activity-row ${canOpen ? '' : 'is-static'}" data-activity-id="${canOpen ? component.id : ''}" ${canOpen ? '' : 'disabled'}>
          <span class="activity-icon ${transaction.type}"><i data-lucide="${transaction.type === 'in' ? 'arrow-down-left' : 'arrow-up-right'}"></i></span>
          <div class="activity-info"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(transaction.note || (transaction.type === 'in' ? '元件入库' : '元件出库'))}</small></div>
          <div class="activity-qty"><strong class="${transaction.type === 'in' ? 'positive' : 'negative'}">${transaction.type === 'in' ? '+' : '-'}${transaction.quantity}</strong><small>${formatDate(transaction.createdAt, true)}</small></div>
        </button>`;
    }).join('') : '<div class="empty-mini">暂无出入库记录</div>';
  }

  function renderLowStock() {
    const lowItems = lowStockItems().slice(0, 5);
    $('#lowStockList').innerHTML = lowItems.length ? lowItems.map(item => {
      const percent = Math.min(100, Math.round(item.quantity / Math.max(1, item.min) * 100));
      const need = restockNeed(item);
      return `
        <button type="button" class="low-row" data-low-id="${item.id}">
          <div class="low-info"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.location || '未分配库位')} · 预警 ${item.min}${need ? ` · 建议补 ${need}` : ''}</small></div>
          <div class="stock-bar"><span style="width:${percent}%"></span></div>
          <span class="low-qty">${item.quantity}</span>
        </button>`;
    }).join('') : '<div class="empty-mini">库存状态良好，暂无预警</div>';
  }

  function renderFavorites() {
    ensureFavorites();
    const items = state.favorites
      .map(id => componentById(id))
      .filter(Boolean)
      .slice(0, 6);
    if ($('#favoriteCountBadge')) $('#favoriteCountBadge').textContent = `${state.favorites.filter(id => componentById(id)).length} 项`;
    if (!$('#favoritesList')) return;
    $('#favoritesList').innerHTML = items.length ? items.map(item => {
      const status = stockState(item);
      return `
        <div class="favorite-row">
          <button type="button" class="favorite-main" data-favorite-open="${item.id}">
            <span class="part-avatar compact">${escapeHtml(componentInitial(item))}</span>
            <div class="low-info"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.location || '未分配库位')} · 库存 ${item.quantity}</small></div>
            <span class="stock-status ${status.key}">${status.label}</span>
          </button>
          <button type="button" class="row-action" data-action="adjust" data-id="${item.id}" title="出入库"><i data-lucide="arrow-left-right"></i></button>
        </div>`;
    }).join('') : '<div class="empty-mini">在元件明细里点星标，收藏常用料</div>';
  }

  function renderInsights() {
    if (!$('#insightList')) return;
    const lowItems = lowStockItems();
    const noLocation = state.components.filter(item => !String(item.location || '').trim());
    const zeroItems = state.components.filter(item => Number(item.quantity) <= 0);
    const topCategory = (() => {
      const map = new Map();
      state.components.forEach(item => map.set(item.category || '未分类', (map.get(item.category || '未分类') || 0) + 1));
      return [...map.entries()].sort((a, b) => b[1] - a[1])[0];
    })();
    const cards = [
      {
        icon: 'triangle-alert',
        title: lowItems.length ? `${lowItems.length} 种低库存` : '暂无低库存',
        desc: lowItems.length ? `最急：${lowItems[0].name}（剩 ${lowItems[0].quantity}）` : '库存水位健康',
        action: lowItems.length ? 'view-low' : ''
      },
      {
        icon: 'map-pin',
        title: noLocation.length ? `${noLocation.length} 种未分配库位` : '库位已全部标注',
        desc: noLocation.length ? '点击可筛选未上架元件' : '货架信息完整',
        action: noLocation.length ? 'view-location' : ''
      },
      {
        icon: 'package-x',
        title: zeroItems.length ? `${zeroItems.length} 种已缺货` : '没有缺货元件',
        desc: zeroItems.length ? `例如 ${zeroItems[0].name}` : '可安心领料',
        action: zeroItems.length ? 'view-zero' : ''
      },
      {
        icon: 'pie-chart',
        title: topCategory ? `主分类：${topCategory[0]}` : '暂无分类数据',
        desc: topCategory ? `共 ${topCategory[1]} 种元件` : '添加元件后自动统计',
        action: topCategory ? 'view-category' : '',
        category: topCategory?.[0] || ''
      }
    ];
    $('#insightList').innerHTML = cards.map(card => `
      <button type="button" class="insight-card ${card.action ? '' : 'is-static'}" data-insight="${card.action}" data-category="${escapeHtml(card.category || '')}" ${card.action ? '' : 'disabled'}>
        <span class="insight-icon"><i data-lucide="${card.icon}"></i></span>
        <div><strong>${escapeHtml(card.title)}</strong><small>${escapeHtml(card.desc)}</small></div>
        ${card.action ? '<i data-lucide="chevron-right"></i>' : ''}
      </button>`).join('');
  }

  function renderFilters() {
    const current = $('#categoryFilter').value || 'all';
    const options = categories();
    $('#categoryFilter').innerHTML = '<option value="all">全部分类</option>' + options.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
    $('#categoryFilter').value = options.includes(current) ? current : 'all';
    $('#categorySuggestions').innerHTML = options.map(category => `<option value="${escapeHtml(category)}"></option>`).join('');
  }

  function filteredComponents() {
    const search = $('#inventorySearch').value.trim().toLocaleLowerCase('zh-CN');
    const category = $('#categoryFilter').value;
    const stock = $('#stockFilter').value;
    const location = $('#locationFilter')?.value || 'all';
    return [...state.components]
      .filter(item => {
        const haystack = [item.name, item.code, item.category, item.brand, item.package, item.specs, item.location, item.supplier, item.notes].join(' ').toLocaleLowerCase('zh-CN');
        const stockKey = stockState(item).key;
        const stockMatches = stock === 'all' || stockKey === stock || (stock === 'low' && (stockKey === 'low' || stockKey === 'zero'));
        const hasLocation = Boolean(String(item.location || '').trim());
        const locationMatches = location === 'all'
          || (location === 'assigned' && hasLocation)
          || (location === 'none' && !hasLocation);
        return (!search || haystack.includes(search))
          && (category === 'all' || item.category === category)
          && stockMatches
          && locationMatches;
      })
      .sort((a, b) => {
        const favA = isFavorite(a.id) ? 1 : 0;
        const favB = isFavorite(b.id) ? 1 : 0;
        if (favA !== favB) return favB - favA;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
  }

  function renderInventory() {
    renderFilters();
    const items = filteredComponents();
    $('#inventoryResultCount').textContent = `共 ${items.length} 种元件`;
    $('#inventoryEmpty').hidden = items.length > 0;
    $('#inventoryTableBody').innerHTML = items.map(item => {
      const status = stockState(item);
      const favored = isFavorite(item.id);
      return `
        <tr>
          <td><input class="row-selector" type="checkbox" data-select-id="${item.id}" aria-label="选择 ${escapeHtml(item.name)}" ${selectedComponentIds.has(item.id) ? 'checked' : ''}></td>
          <td><div class="part-cell"><span class="part-avatar">${escapeHtml(componentInitial(item))}</span><div class="part-info"><span class="part-name">${escapeHtml(item.name)}</span><span class="part-code">${escapeHtml(item.code || item.brand || '暂无编号')}</span></div></div></td>
          <td><span class="category-chip">${escapeHtml(item.category || '未分类')}</span><span class="param-text" title="${escapeHtml(item.specs)}">${escapeHtml(item.specs || '暂无参数')}</span></td>
          <td class="stock-cell"><strong>${item.quantity}</strong> <small>pcs</small><span class="stock-status ${status.key}">${status.label}</span></td>
          <td class="subtle-cell">${escapeHtml(item.package || '--')}<small>${escapeHtml(item.brand || '')}</small></td>
          <td class="subtle-cell">${escapeHtml(item.location || '未分配')}</td>
          <td class="subtle-cell">${formatDate(item.updatedAt)}</td>
          <td><div class="row-actions">
            <button class="row-action ${favored ? 'is-favorite' : ''}" data-action="favorite" data-id="${item.id}" title="${favored ? '取消收藏' : '收藏'}" aria-label="${favored ? '取消收藏' : '收藏'} ${escapeHtml(item.name)}"><i data-lucide="star"></i></button>
            <button class="row-action" data-action="adjust" data-id="${item.id}" title="出入库" aria-label="${escapeHtml(item.name)} 出入库"><i data-lucide="arrow-left-right"></i></button>
            <button class="row-action" data-action="edit" data-id="${item.id}" title="编辑" aria-label="编辑 ${escapeHtml(item.name)}"><i data-lucide="pencil"></i></button>
          </div></td>
        </tr>`;
    }).join('');

    $('#mobileInventoryList').innerHTML = items.map(item => {
      const status = stockState(item);
      const favored = isFavorite(item.id);
      return `
        <article class="mobile-part-card">
          <label class="mobile-select"><input class="row-selector" type="checkbox" data-select-id="${item.id}" ${selectedComponentIds.has(item.id) ? 'checked' : ''}>选择此元件</label>
          <div class="mobile-card-top">
            <span class="part-avatar">${escapeHtml(componentInitial(item))}</span>
            <div class="part-info"><span class="part-name">${escapeHtml(item.name)}</span><span class="part-code">${escapeHtml(item.code || item.brand || '暂无编号')}</span></div>
            <div class="mobile-stock"><strong>${item.quantity}</strong><span>库存 / pcs</span></div>
          </div>
          <div class="mobile-tags"><span>${escapeHtml(item.category || '未分类')}</span><span>${escapeHtml(item.package || '无封装')}</span><span>${escapeHtml(item.location || '未分配库位')}</span><span class="stock-status ${status.key}">${status.label}</span></div>
          <div class="mobile-card-actions">
            <button class="button secondary" data-action="adjust" data-id="${item.id}"><i data-lucide="arrow-left-right"></i>出入库</button>
            <button class="icon-button ${favored ? 'is-favorite' : ''}" data-action="favorite" data-id="${item.id}" aria-label="${favored ? '取消收藏' : '收藏'}"><i data-lucide="star"></i></button>
            <button class="icon-button" data-action="edit" data-id="${item.id}" aria-label="编辑 ${escapeHtml(item.name)}"><i data-lucide="pencil"></i></button>
          </div>
        </article>`;
    }).join('');
    updateBatchToolbar(items);
    refreshIcons();
  }

  function updateBatchToolbar(filtered = filteredComponents()) {
    [...selectedComponentIds].forEach(id => { if (!componentById(id)) selectedComponentIds.delete(id); });
    const count = selectedComponentIds.size;
    $('#selectedCount').textContent = `已选 ${count} 项`;
    $('#clearSelectionButton').disabled = count === 0;
    $('#batchInButton').disabled = count === 0;
    $('#batchOutButton').disabled = count === 0;
    const visibleIds = filtered.map(item => item.id);
    $('#selectAllFiltered').checked = visibleIds.length > 0 && visibleIds.every(id => selectedComponentIds.has(id));
    $('#selectAllFiltered').indeterminate = visibleIds.some(id => selectedComponentIds.has(id)) && !$('#selectAllFiltered').checked;
  }

  function toggleSelection(id, checked) {
    if (checked) selectedComponentIds.add(id);
    else selectedComponentIds.delete(id);
    renderInventory();
  }

  function openBatchModal(mode) {
    const items = [...selectedComponentIds].map(componentById).filter(Boolean);
    if (!items.length) return;
    batchMode = mode;
    $('#batchForm').reset();
    $('#batchQuantity').value = 1;
    $('#batchError').textContent = '';
    $('#batchModalTitle').textContent = `批量${mode === 'in' ? '入库' : '出库'}`;
    $('#batchSubmit').innerHTML = `<i data-lucide="check"></i>确认批量${mode === 'in' ? '入库' : '出库'}`;
    $('#batchSummary').innerHTML = items.map(item => `<span>${escapeHtml(item.name)} · 当前 ${item.quantity} pcs</span>`).join('');
    $('#batchModal').showModal();
    refreshIcons();
  }

  function submitBatch(event) {
    event.preventDefault();
    const items = [...selectedComponentIds].map(componentById).filter(Boolean);
    const quantity = Math.max(1, Number($('#batchQuantity').value) || 0);
    if (!items.length) return;
    const insufficient = batchMode === 'out' ? items.filter(item => item.quantity < quantity) : [];
    if (insufficient.length) {
      $('#batchError').textContent = `整批未执行：${insufficient.map(item => `${item.name} 仅 ${item.quantity}`).join('、')}`;
      return;
    }
    const now = new Date().toISOString();
    const batchId = uid('batch');
    const note = $('#batchNote').value.trim() || `批量${batchMode === 'in' ? '入库' : '出库'}`;
    items.forEach(component => {
      component.quantity += batchMode === 'in' ? quantity : -quantity;
      component.updatedAt = now;
      state.transactions.push({ id: uid('txn'), batchId, componentId: component.id, type: batchMode, quantity, note, actor: currentActor(), createdAt: now });
    });
    $('#batchModal').close();
    selectedComponentIds.clear();
    saveState();
    showToast(`已完成 ${items.length} 种元件批量${batchMode === 'in' ? '入库' : '出库'}`);
  }

  function renderTransactions() {
    const list = [...state.transactions]
      .filter(transaction => transactionFilter === 'all' || transaction.type === transactionFilter)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const inbound = state.transactions.filter(item => item.type === 'in').reduce((sum, item) => sum + Number(item.quantity), 0);
    const outbound = state.transactions.filter(item => item.type === 'out').reduce((sum, item) => sum + Number(item.quantity), 0);
    $('#totalInbound').textContent = formatNumber(inbound);
    $('#totalOutbound').textContent = formatNumber(outbound);
    $('#transactionCount').textContent = state.transactions.length;
    $('#transactionList').innerHTML = list.length ? list.map(transaction => {
      const component = componentById(transaction.componentId);
      const name = component?.name || transaction.componentName || '已删除元件';
      const category = component?.category || transaction.componentCategory || '未分类';
      return `
        <div class="transaction-row">
          <span class="transaction-kind ${transaction.type}"><i data-lucide="${transaction.type === 'in' ? 'arrow-down-left' : 'arrow-up-right'}"></i></span>
          <div class="transaction-part"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(component?.code || '')}</small></div>
          <span class="transaction-category">${escapeHtml(category)}</span>
          <strong class="transaction-amount ${transaction.type}">${transaction.type === 'in' ? '+' : '-'}${transaction.quantity}</strong>
          <div class="transaction-note"><span>${escapeHtml(transaction.note || (transaction.type === 'in' ? '元件入库' : '元件出库'))}</span></div>
          <div class="transaction-date"><span>${formatDate(transaction.createdAt, true)}</span><small>${escapeHtml(transaction.actor || '历史操作')}</small></div>
        </div>`;
    }).join('') : '<div class="empty-mini">当前筛选下没有记录</div>';
    refreshIcons();
  }

  function renderAdjustOptions(selectedId = '') {
    const options = [...state.components].sort((a, b) => a.name.localeCompare(b.name)).map(item => `<option value="${item.id}">${escapeHtml(item.name)} · 库存 ${item.quantity}</option>`).join('');
    $('#adjustComponent').innerHTML = options || '<option value="">暂无元件</option>';
    if (selectedId && componentById(selectedId)) $('#adjustComponent').value = selectedId;
    updateStockPreview();
  }

  function renderAll() {
    ensureFavorites();
    if (!Array.isArray(state.boardProjects)) state.boardProjects = [];
    renderStats();
    renderCategoryChart();
    renderRecentActivity();
    renderLowStock();
    renderFavorites();
    renderInsights();
    renderInventory();
    renderTransactions();
    renderProjects();
    refreshIcons();
  }

  function bomStatusLabel(status) {
    return ({ available: '库存可用', shortage: '库存不足', missing: '库存没有', manual: '需人工确认', skipped: '不贴装' })[status] || '待匹配';
  }

  function renderProjects() {
    const projects = Array.isArray(state.boardProjects) ? [...state.boardProjects] : [];
    const deducted = projects.reduce((sum, project) => sum + Number(project.summary?.deductedQuantity || 0), 0);
    const unresolved = projects.reduce((sum, project) => sum + Number(project.summary?.unresolved || 0), 0);
    $('#navProjectCount').textContent = projects.length;
    refreshNavTitles();
    $('#projectCount').textContent = projects.length;
    $('#projectDeductedTotal').textContent = formatNumber(deducted);
    $('#projectUnresolvedTotal').textContent = formatNumber(unresolved);
    $('#bomProjectList').innerHTML = projects.length ? projects
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(project => `
        <article class="bom-project-card">
          <span class="bom-project-icon"><i data-lucide="circuit-board"></i></span>
          <div class="bom-project-main">
            <strong>${escapeHtml(project.name)}</strong>
            <small>${escapeHtml(project.sourceFile || 'BOM 文件')} · ${project.boardCount || 1} 块 · ${formatDate(project.createdAt, true)}</small>
          </div>
          <div class="bom-project-metric"><span>已领料</span><strong>${formatNumber(project.summary?.deductedQuantity || 0)}</strong></div>
          <div class="bom-project-metric ${Number(project.summary?.unresolved || 0) ? 'warn' : ''}"><span>未解决</span><strong>${formatNumber(project.summary?.unresolved || 0)}</strong></div>
          <span class="bom-project-actor">${escapeHtml(project.actor || '本机操作')}</span>
        </article>`).join('')
      : '<div class="empty-mini bom-empty">还没有板卡记录。导入一份 BOM 后，会在这里保留当时的匹配和领料快照。</div>';
    refreshIcons();
  }

  function detectBomHeaderRow(rows) {
    let best = { index: 0, score: -1 };
    rows.slice(0, 12).forEach((row, index) => {
      const map = window.BomManager.mapHeaders(Array.isArray(row) ? row : []);
      const score = Object.keys(map).length + (map.designator != null ? 2 : 0) + (map.manufacturerPart != null ? 2 : 0);
      if (score > best.score) best = { index, score };
    });
    return best.index;
  }

  function parseBomBuffer(buffer, filename = '') {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const isZip = bytes.length > 1 && bytes[0] === 0x50 && bytes[1] === 0x4b;
    let rows;
    if (isZip || /\.xlsx?$/i.test(filename)) {
      if (!window.XLSX) throw new Error('Excel 解析组件未加载，请刷新页面后重试');
      const workbook = window.XLSX.read(bytes, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error('文件中没有工作表');
      rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false });
    } else {
      rows = window.PickPlaceManager.parseDelimitedRows(bytes);
    }
    const headerRowIndex = detectBomHeaderRow(rows);
    return window.BomManager.parseRows(rows, { headerRowIndex, boardCount: 1 });
  }

  function rememberBomSession(parsed, sourceFile, sheetName = '') {
    lastBomSession = {
      name: String(sourceFile || '').replace(/\.(xlsx?|csv|tsv)$/i, ''),
      sourceFile,
      sheetName,
      boardCount: 1,
      sourceLines: parsed.lines,
      lines: window.BomManager.matchLines(parsed.lines, state.components)
    };
    return lastBomSession;
  }

  async function importBomFile(file) {
    if (!file) return;
    $('#bomError').textContent = '';
    try {
      const parsed = parseBomBuffer(await file.arrayBuffer(), file.name);
      pendingBomDraft = rememberBomSession(parsed, file.name, parsed.sheetName || '');
      $('#bomProjectName').value = pendingBomDraft.name;
      $('#bomBoardCount').value = '1';
      renderBomDraft();
      $('#bomModal').showModal();
    } catch (error) {
      showToast(error.message || 'BOM 读取失败', 'error');
    } finally {
      $('#bomFileInput').value = '';
    }
  }

  function setSolderStatus(message) {
    const status = $('#solderStatus');
    if (status) status.textContent = message;
  }

  function applySolderBom(session, reason, origin = 'session') {
    solderState.bomLines = (session?.lines || []).map(line => ({ ...line }));
    solderState.bomName = session?.sourceFile || session?.name || (solderState.bomLines.length ? 'BOM' : '');
    solderState.bomOrigin = origin;
    if (solderState.bomLines.length) solderState.rejectSessionBom = false;
    solderState.selectedLineId = '';
    solderState.marked = [];
    fillSolderBoardName();
    renderSolderBom();
    renderGerberMarks();
    if (reason) setSolderStatus(reason);
  }

  function fillSolderBoardName(force = false) {
    const input = $('#solderBoardName');
    if (!input) return;
    if (!force && input.value.trim()) return;
    const source = solderState.bomName || solderState.zipName || '';
    input.value = source.replace(/\.(zip|xlsx?|csv|tsv)$/i, '');
  }

  function paintSavedSolderBoards() {
    const root = $('#solderSavedList');
    if (!root) return;
    const query = ($('#solderSavedSearch')?.value || '').trim().toLocaleLowerCase('zh-CN');
    const boards = savedSolderBoards.filter(board => !query || String(board.name || '').toLocaleLowerCase('zh-CN').includes(query));
    if ($('#solderSavedCount')) $('#solderSavedCount').textContent = `${savedSolderBoards.length} 块`;
    root.innerHTML = boards.length ? boards.map(board => `
      <div class="solder-saved-card ${board.id === solderState.savedId ? 'active' : ''}">
        <button type="button" class="solder-open-board" data-solder-open="${escapeHtml(board.id)}" title="${escapeHtml(board.name)}">
          <strong>${escapeHtml(board.name)}</strong>
          <small>${board.bomCount} 项 BOM · ${formatDate(board.savedAt, true)}</small>
        </button>
        <button type="button" class="icon-button" data-solder-delete="${escapeHtml(board.id)}" title="删除" aria-label="删除已保存板卡"><i data-lucide="trash-2"></i></button>
      </div>`).join('') : `<span class="solder-saved-empty">${savedSolderBoards.length ? '没有匹配的板卡名称' : '还没有已保存板卡。打开 Gerber 后点「保存当前板卡」。'}</span>`;
    refreshIcons();
  }

  async function renderSavedSolderBoards() {
    const root = $('#solderSavedList');
    if (!root || !window.SolderBoardStore) return;
    try {
      savedSolderBoards = await window.SolderBoardStore.list();
      paintSavedSolderBoards();
    } catch (error) {
      savedSolderBoards = [];
      if ($('#solderSavedCount')) $('#solderSavedCount').textContent = '0 块';
      root.innerHTML = `<span class="solder-saved-empty">${escapeHtml(error.message || '无法读取已保存板卡')}</span>`;
    }
  }

  async function saveCurrentSolderBoard() {
    if (!solderState.zipBytes) {
      showToast('请先打开 Gerber ZIP，再保存板卡', 'error');
      return;
    }
    try {
      const summary = await window.SolderBoardStore.put({
        id: solderState.savedId || '',
        name: $('#solderBoardName')?.value.trim() || solderState.bomName || solderState.zipName,
        zipName: solderState.zipName,
        zipBytes: solderState.zipBytes,
        bomName: solderState.bomName,
        bomLines: solderState.bomLines,
        pnp: solderState.pnp
      });
      solderState.savedId = summary.id;
      await renderSavedSolderBoards();
      showToast(`已保存「${summary.name}」，下次可直接打开`);
      setSolderStatus(`已保存「${summary.name}」。下次进入焊接对料，点这条记录即可继续。`);
    } catch (error) {
      showToast(error.message || '保存失败。文件可能太大，本机空间不足。', 'error');
    }
  }

  async function loadSavedSolderBoard(id) {
    try {
      setSolderStatus('正在打开已保存板卡…');
      const record = await window.SolderBoardStore.get(id);
      const archive = await window.GerberSession.openArchive(record.zipBytes, {
        JSZip: window.JSZip,
        pcbStackup: window.pcbStackup
      });
      solderState.archive = archive;
      solderState.zipBytes = record.zipBytes;
      solderState.zipName = record.zipName;
      solderState.savedId = record.id;
      solderState.pnp = record.pnp || [];
      solderState.marked = [];
      applySolderBom({ lines: record.bomLines, sourceFile: record.bomName, name: record.name }, '', 'saved');
      const nameInput = $('#solderBoardName');
      if (nameInput) nameInput.value = record.name;
      renderGerberBoards();
      await renderSavedSolderBoards();
      const pads = solderState.pnp.reduce((sum, item) => sum + (item.pads?.length || 0), 0);
      setSolderStatus(`已打开保存的「${record.name}」：${record.bomLines?.length || 0} 项 BOM${pads ? `，${pads} 个焊盘` : ''}。点击左侧器件即可点亮。`);
    } catch (error) {
      showToast(error.message || '打开已保存板卡失败', 'error');
      setSolderStatus(error.message || '打开已保存板卡失败');
    }
  }

  async function deleteSavedSolderBoard(id) {
    if (!window.confirm('删除这条已保存板卡？库存数据不会受影响。')) return;
    try {
      await window.SolderBoardStore.remove(id);
      if (solderState.savedId === id) solderState.savedId = '';
      await renderSavedSolderBoards();
      showToast('已删除保存的板卡');
    } catch (error) {
      showToast(error.message || '删除失败', 'error');
    }
  }

  function enterSolderView() {
    if (!solderState.archive && !solderState.bomLines.length && lastBomSession?.lines?.length && !solderState.rejectSessionBom) {
      applySolderBom(lastBomSession, `已带入刚才导入的 BOM：${lastBomSession.sourceFile}`, 'session');
    } else {
      renderSolderBom();
    }
    fillSolderBoardName();
    renderSavedSolderBoards();
    updateSolderLayout();
    if (!solderLayoutObserver && typeof ResizeObserver === 'function' && $('#gerberStage')) {
      solderLayoutObserver = new ResizeObserver(() => updateSolderLayout());
      solderLayoutObserver.observe($('#gerberStage'));
    }
    refreshIcons();
  }

  function updateSolderLayout() {
    const stage = $('#gerberStage');
    if (!stage) return;
    const wide = stage.clientWidth >= stage.clientHeight * 1.15;
    stage.dataset.layout = wide ? 'row' : 'column';
    stage.dataset.mode = solderState.mode;
  }

  function renderSolderBom() {
    const list = $('#solderBomList');
    if (!list) return;
    const query = ($('#solderBomSearch')?.value || '').trim().toLocaleLowerCase('zh-CN');
    const lines = solderState.bomLines.filter(line => {
      if (!query) return true;
      return [line.displayName, line.comment, line.designator, line.manufacturerPart, line.footprint]
        .some(value => String(value || '').toLocaleLowerCase('zh-CN').includes(query));
    });
    $('#solderBomTitle').textContent = solderState.bomName || '尚未加载';
    $('#solderBomCount').textContent = `${lines.length} 项`;
    updateSolderClearButtons();
    list.innerHTML = lines.length ? lines.map(line => {
      const identity = line.displayName || line.manufacturerPart || line.comment || line.designator || '未命名';
      const marked = solderState.selectedLineId === line.id;
      return `<button type="button" class="solder-bom-row ${marked ? 'active' : ''}" data-solder-line="${escapeHtml(line.id)}">
        <strong>${escapeHtml(identity)}</strong>
        <small>${escapeHtml(line.designator || '无位号')} · ${escapeHtml(line.footprint || '无封装')} · ${escapeHtml(line.comment || '')}</small>
      </button>`;
    }).join('') : `<div class="empty-mini">还没有 BOM。请先在「板卡 / BOM」导入，或打开带 BOM 的 Gerber ZIP。</div>`;
  }

  function renderGerberBoards() {
    const panel = $('.solder-board-panel');
    const archive = solderState.archive;
    panel?.classList.toggle('has-board', Boolean(archive));
    const gerberTitle = $('#solderGerberTitle');
    if (gerberTitle) gerberTitle.textContent = archive ? (solderState.zipName || '已打开 Gerber') : '尚未打开';
    $('#gerberTopBoard').innerHTML = archive ? archive.topSvg : '';
    $('#gerberBottomBoard').innerHTML = archive ? archive.bottomSvg : '';
    renderGerberMarks();
    updateSolderLayout();
    updateSolderClearButtons();
  }

  function updateSolderClearButtons() {
    const hasBom = Boolean(solderState.bomLines.length);
    const hasGerber = Boolean(solderState.archive);
    const hasPnp = Boolean(solderState.pnp.length);
    const clearBom = $('#clearSolderBomButton');
    const clearGerber = $('#clearSolderGerberButton');
    const clearAll = $('#clearSolderSessionButton');
    if (clearBom) clearBom.disabled = !hasBom;
    if (clearGerber) clearGerber.disabled = !hasGerber;
    if (clearAll) clearAll.disabled = !hasBom && !hasGerber && !hasPnp;
  }

  function clearSolderBom(silent = false) {
    if (!solderState.bomLines.length) return;
    if (!silent && !window.confirm('清除当前 BOM？右侧 Gerber 还在，可以再点「加载 BOM」。')) return;
    solderState.rejectSessionBom = true;
    applySolderBom({ lines: [], sourceFile: '', name: '' }, silent ? '' : '已清除 BOM。导错了就重新点「加载 BOM」。', 'none');
  }

  function clearSolderGerber(silent = false) {
    if (!solderState.archive && !solderState.zipBytes && !solderState.pnp.length) return;
    if (!silent && !window.confirm('关闭当前 Gerber？左侧 BOM 还在，可以再点「打开 Gerber ZIP」。')) return;
    solderState.archive = null;
    solderState.zipBytes = null;
    solderState.zipName = '';
    solderState.savedId = '';
    solderState.pnp = [];
    solderState.marked = [];
    solderState.selectedLineId = '';
    renderGerberBoards();
    renderSolderBom();
    if (!silent) setSolderStatus('已关闭 Gerber。导错了就重新打开 ZIP。');
  }

  function clearSolderSession() {
    if (!solderState.archive && !solderState.bomLines.length && !solderState.pnp.length) return;
    if (!window.confirm('清空当前导入的 BOM、Gerber 和坐标？已保存的板卡不会删。')) return;
    solderState.rejectSessionBom = true;
    applySolderBom({ lines: [], sourceFile: '', name: '' }, '', 'none');
    clearSolderGerber(true);
    const nameInput = $('#solderBoardName');
    if (nameInput) nameInput.value = '';
    setSolderStatus('已清空当前导入。可以重新打开 Gerber ZIP 和加载 BOM。');
    showToast('已清空当前 BOM 和 Gerber');
  }

  function renderGerberMarks() {
    ['top', 'bottom'].forEach(pane => {
      const svg = pane === 'top' ? $('#gerberTopMarks') : $('#gerberBottomMarks');
      const stackup = pane === 'top' ? solderState.archive?.top : solderState.archive?.bottom;
      if (!svg) return;
      if (!stackup || !solderState.marked.length) {
        svg.innerHTML = '';
        svg.removeAttribute('viewBox');
        return;
      }
      const viewBox = stackup.viewBox || window.GerberSession.parseViewBox(stackup.svg);
      svg.setAttribute('viewBox', viewBox.join(' '));
      const inner = solderState.marked.map(record => {
        const layerPads = (record.pads || []).filter(pad => {
          const layer = pad.layer || record.layer;
          if (pane === 'bottom') return layer === 'B';
          return layer !== 'B';
        });
        if (layerPads.length) {
          return layerPads.map(pad => window.GerberSession.padMarkup(pad, pane, stackup)).join('');
        }
        const onThisPane = pane === 'bottom' ? record.layer === 'B' : record.layer !== 'B';
        if (!onThisPane) return '';
        const point = window.GerberSession.mapRecordToSvg(record, pane, stackup);
        return `<circle class="gerber-pad" cx="${point.x}" cy="${point.y}" r="500"></circle>`;
      }).join('');
      svg.innerHTML = window.GerberSession.wrapOverlayMarkup(inner, stackup, pane);
    });
  }

  function revealSolderLayer(records) {
    const layers = new Set();
    (records || []).forEach(record => {
      if (record.layer === 'B') layers.add('B');
      else if (record.layer) layers.add('T');
      (record.pads || []).forEach(pad => layers.add(pad.layer === 'B' ? 'B' : 'T'));
    });
    if (!layers.size) return;
    if (layers.size > 1) solderState.mode = 'both';
    else solderState.mode = layers.has('B') ? 'bottom' : 'top';
    $$('#solderLayerMode button').forEach(button => button.classList.toggle('active', button.dataset.solderMode === solderState.mode));
    updateSolderLayout();
  }

  function markSolderLine(line) {
    solderState.selectedLineId = line?.id || '';
    const designators = line?.designators?.length ? line.designators : window.BomManager.splitDesignators(line?.designator || '');
    solderState.marked = window.PickPlaceManager.searchByDesignators(solderState.pnp, designators);
    renderSolderBom();
    revealSolderLayer(solderState.marked);
    renderGerberMarks();
    if (!solderState.archive) {
      setSolderStatus('已选中 BOM 行。先打开 Gerber ZIP，才能在板上点亮焊盘。');
      return;
    }
    if (!solderState.pnp.length) {
      setSolderStatus('Gerber 已打开，但压缩包里没有坐标/飞针文件。请点「加载坐标」，或使用立创导出的完整 Gerber ZIP。');
      return;
    }
    if (!solderState.marked.length) {
      setSolderStatus(`找不到 ${designators.join(', ') || '该行位号'} 的焊盘。`);
      return;
    }
    const padCount = solderState.marked.reduce((sum, item) => sum + (item.pads?.length || 0), 0);
    const layers = [...new Set(solderState.marked.map(item => item.layer === 'B' ? '底层' : '顶层'))].join(' / ');
    const names = solderState.marked.map(item => item.designator).join(', ');
    setSolderStatus(padCount
      ? `已点亮 ${names} 的 ${padCount} 个焊盘（${layers}）`
      : `已标记 ${names}（${layers}）。当前坐标没有焊盘尺寸，已用器件中心表示。`);
  }

  async function openGerberZipFile(file) {
    if (!file) return;
    try {
      setSolderStatus(`正在解析 ${file.name}…`);
      const zipBytes = await file.arrayBuffer();
      const archive = await window.GerberSession.openArchive(zipBytes, {
        JSZip: window.JSZip,
        pcbStackup: window.pcbStackup
      });
      solderState.archive = archive;
      solderState.zipBytes = zipBytes;
      solderState.zipName = file.name;
      solderState.savedId = '';
      solderState.pnp = [];
      solderState.marked = [];
      solderState.selectedLineId = '';
      const notes = [];
      if (archive.probeEntry) {
        const parsed = window.PickPlaceManager.parseCoordinates(archive.probeEntry.content, archive.probeEntry.name);
        solderState.pnp = parsed.records;
        const pads = parsed.records.reduce((sum, item) => sum + (item.pads?.length || 0), 0);
        notes.push(`飞针焊盘 ${parsed.records.length} 个器件 / ${pads} 个焊盘`);
      } else if (archive.pnpEntry) {
        solderState.pnp = window.PickPlaceManager.parseText(archive.pnpEntry.content).records;
        notes.push(`坐标 ${solderState.pnp.length} 条`);
      } else {
        notes.push('压缩包内没有坐标/飞针文件，可点「加载坐标」');
      }
      if (archive.bomEntry) {
        const parsed = parseBomBuffer(archive.bomEntry.content, archive.bomEntry.name);
        applySolderBom(rememberBomSession(parsed, archive.bomEntry.name), '', 'zip');
        notes.push(`BOM ${solderState.bomLines.length} 项`);
      } else if (solderState.bomOrigin === 'manual' && solderState.bomLines.length) {
        notes.push('已保留你手动加载的 BOM');
        renderSolderBom();
      } else {
        applySolderBom({ lines: [], sourceFile: '', name: '' }, '', 'none');
        notes.push('压缩包内没有 BOM，请点「加载 BOM」');
      }
      fillSolderBoardName(true);
      renderGerberBoards();
      setSolderStatus(`已打开 ${file.name}，${archive.layerCount} 个 Gerber 层${notes.length ? '；' + notes.join('，') : ''}。点击左侧器件即可点亮对应焊盘。`);
    } catch (error) {
      showToast(error.message || 'Gerber 打开失败', 'error');
      setSolderStatus(error.message || 'Gerber 打开失败');
    } finally {
      $('#gerberZipInput').value = '';
    }
  }

  async function loadSolderBomFile(file) {
    if (!file) return;
    try {
      const parsed = parseBomBuffer(await file.arrayBuffer(), file.name);
      applySolderBom(rememberBomSession(parsed, file.name), `已加载 BOM：${file.name}，共 ${parsed.lines.length} 项`, 'manual');
    } catch (error) {
      showToast(error.message || 'BOM 加载失败', 'error');
    } finally {
      $('#solderBomInput').value = '';
    }
  }

  async function loadSolderPnpFile(file) {
    if (!file) return;
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      let parsed;
      if (/\.json$/i.test(file.name) || (buffer[0] === 0x7b)) {
        parsed = window.PickPlaceManager.parseCoordinates(buffer, file.name);
      } else if (/\.xlsx?$/i.test(file.name) || (buffer[0] === 0x50 && buffer[1] === 0x4b)) {
        const workbook = window.XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        parsed = window.PickPlaceManager.parseRows(window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false }));
      } else {
        parsed = window.PickPlaceManager.parseCoordinates(buffer, file.name);
      }
      solderState.pnp = parsed.records;
      const pads = parsed.records.reduce((sum, item) => sum + (item.pads?.length || 0), 0);
      setSolderStatus(`已加载坐标 ${file.name}：${parsed.records.length} 个器件${pads ? ` / ${pads} 个焊盘` : ''}（顶 ${parsed.layerCounts.T || 0} / 底 ${parsed.layerCounts.B || 0}）`);
      updateSolderClearButtons();
      if (solderState.selectedLineId) {
        const line = solderState.bomLines.find(item => item.id === solderState.selectedLineId);
        if (line) markSolderLine(line);
      }
    } catch (error) {
      showToast(error.message || '坐标文件读取失败', 'error');
    } finally {
      $('#solderPnpInput').value = '';
    }
  }

  function matchSolderScan(rawValue) {
    const decoded = window.InventoryQr?.decode(rawValue) || { code: rawValue, model: rawValue, raw: rawValue };
    const needles = [decoded.code, decoded.model, rawValue].map(value => normalizeKey(value)).filter(Boolean);
    const line = solderState.bomLines.find(item => needles.some(needle => [
      item.manufacturerPart, item.supplierPart, item.comment, item.displayName, item.name
    ].some(value => normalizeKey(value) && (normalizeKey(value) === needle || normalizeKey(value).includes(needle)))));
    closeModal($('#scanModal'));
    solderMatchMode = false;
    if (!line) {
      showToast('扫到的料号不在当前 BOM 里', 'error');
      return;
    }
    markSolderLine(line);
    const row = document.querySelector(`[data-solder-line="${line.id}"]`);
    row?.scrollIntoView({ block: 'nearest' });
    showToast(`已匹配 ${line.displayName || line.comment || line.designator}`);
  }

  function componentOptions(selectedId = '', query = '') {
    const matches = window.BomManager.filterComponents(state.components, query);
    const selected = componentById(selectedId);
    const visible = selected && !matches.some(component => component.id === selected.id) ? [selected, ...matches] : matches;
    return `<option value="">不使用库存 / 待采购</option>${[...visible]
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
      .map(component => `<option value="${component.id}" ${component.id === selectedId ? 'selected' : ''}>${escapeHtml(component.name)}${component.code ? ` · ${escapeHtml(component.code)}` : ''} · 库存 ${component.quantity}</option>`).join('')}`;
  }

  function bomCandidateCount(query) {
    return window.BomManager.filterComponents(state.components, query).length;
  }

  function bomSearchResults(query, selectedId = '', needsConfirmation = false) {
    if (!String(query || '').trim()) return '';
    const matches = window.BomManager.filterComponents(state.components, query);
    if (!matches.length) return '<div class="bom-candidate-empty">没有匹配的库存元件，请换型号、C 编号、分类或封装搜索。</div>';
    const limit = 30;
    const cards = matches.slice(0, limit).map(component => {
      const selected = component.id === selectedId;
      const confirmed = selected && !needsConfirmation;
      const stockKey = Number(component.quantity) <= 0 ? 'zero' : (Number(component.quantity) <= Number(component.min) ? 'low' : 'normal');
      const stockText = stockKey === 'zero' ? '缺货' : `库存 ${component.quantity}`;
      return `<button type="button" class="bom-candidate-card ${confirmed ? 'selected' : ''} ${selected && needsConfirmation ? 'suggested' : ''}" data-bom-pick="${escapeHtml(component.id)}" role="option" aria-selected="${confirmed}">
        <span class="bom-candidate-top"><strong>${escapeHtml(component.name || '未命名元件')}</strong><b class="stock-${stockKey}">${stockText}</b></span>
        <span class="bom-candidate-code">${escapeHtml(component.code || '无物料编号')}</span>
        <span class="bom-candidate-tags"><i>${escapeHtml(component.category || '未分类')}</i><i>${escapeHtml(component.package || '无封装')}</i></span>
        <span class="bom-candidate-specs">${escapeHtml(component.specs || '暂无参数信息')}</span>
        <span class="bom-candidate-footer"><i data-lucide="map-pin"></i>${escapeHtml(component.location || '未分配库位')}<em>${selected && needsConfirmation ? '匹配到，点击确认' : (selected ? '已选择' : '点击选择')}</em></span>
      </button>`;
    }).join('');
    const more = matches.length > limit ? `<div class="bom-candidate-more">当前显示前 ${limit} 项，请继续输入关键字缩小范围。</div>` : '';
    return `<div class="bom-candidate-list" role="listbox" aria-label="库存搜索结果">${cards}${more}</div>`;
  }

  function renderBomDraft() {
    if (!pendingBomDraft) return;
    const summary = window.BomManager.summarize(pendingBomDraft.lines);
    $('#bomPreviewSummary').innerHTML = `
      <span><b>${summary.total}</b> BOM 行</span>
      <span class="ok"><b>${summary.available}</b> 库存可用</span>
      <span class="warn"><b>${summary.shortage}</b> 库存不足</span>
      <span class="danger"><b>${summary.missing}</b> 库存没有</span>
      <span class="manual"><b>${summary.manual}</b> 需确认</span>
      ${summary.skipped ? `<span class="skipped"><b>${summary.skipped}</b> 不贴装</span>` : ''}`;
    $('#bomSelectedTotal').textContent = summary.selected ? `已选择 ${summary.selected} 行参与领料` : '尚未选择库存元件';
    $('#bomLineList').innerHTML = pendingBomDraft.lines.map(line => {
      const component = componentById(line.componentId);
      const identity = line.displayName || line.manufacturerPart || line.supplierPart || line.comment || `第 ${line.sourceRow} 行`;
      const searchQuery = line.searchQuery ?? (line.passive?.display || '');
      return `<article class="bom-line-card status-${line.status}" data-bom-line="${line.id}">
        <label class="bom-use-check" title="是否从库存领料"><input type="checkbox" data-bom-select ${line.selected ? 'checked' : ''} ${line.status !== 'available' ? 'disabled' : ''}><span></span></label>
        <div class="bom-line-info">
          <div><strong>${escapeHtml(identity)}</strong><span class="bom-status ${line.status}">${bomStatusLabel(line.status)}</span></div>
          <small>${escapeHtml(line.comment || '无参数')} · ${escapeHtml(line.designator || '无位号')} · ${escapeHtml(line.footprint || '无封装')}</small>
          <em>${escapeHtml(line.matchReason || '')}</em>
        </div>
        <div class="bom-line-control"><span>库存元件</span><label class="bom-component-search"><i data-lucide="search"></i><input type="search" data-bom-search value="${escapeHtml(searchQuery)}" placeholder="搜索型号、编号、分类、封装"><small data-bom-match-count>${bomCandidateCount(searchQuery)} 项</small></label><div data-bom-search-results>${bomSearchResults(searchQuery, component?.id || '', line.quantityNeedsReview)}</div><select data-bom-component aria-label="库存元件备用下拉选择">${componentOptions(component?.id || '', searchQuery)}</select></div>
        <label class="bom-line-control qty ${line.quantityNeedsReview ? 'needs-review' : ''}"><span>${line.quantityNeedsReview ? '领用数量（请确认）' : '领用数量'}</span><input data-bom-quantity type="number" min="1" step="1" value="${line.requiredQuantity}"></label>
        <div class="bom-stock-now"><span>现有库存</span><strong>${component ? component.quantity : '--'}</strong></div>
      </article>`;
    }).join('');
    refreshIcons();
  }

  function updateBomBoardCount() {
    if (!pendingBomDraft) return;
    const boardCount = Math.max(1, Math.floor(Number($('#bomBoardCount').value) || 1));
    $('#bomBoardCount').value = boardCount;
    pendingBomDraft.boardCount = boardCount;
    pendingBomDraft.sourceLines = pendingBomDraft.sourceLines.map(line => ({ ...line, requiredQuantity: line.unitQuantity * boardCount }));
    pendingBomDraft.lines = window.BomManager.matchLines(pendingBomDraft.sourceLines, state.components);
    renderBomDraft();
  }

  function updateBomLineFromControls(card) {
    if (!pendingBomDraft || !card) return;
    const index = pendingBomDraft.lines.findIndex(line => line.id === card.dataset.bomLine);
    if (index < 0) return;
    const component = componentById($('[data-bom-component]', card).value);
    const quantity = Math.max(1, Math.ceil(Number($('[data-bom-quantity]', card).value) || 1));
    pendingBomDraft.lines[index] = window.BomManager.assignLine(pendingBomDraft.lines[index], component, quantity);
    renderBomDraft();
  }

  function filterBomComponentOptions(input) {
    if (!pendingBomDraft || !input) return;
    const card = input.closest('[data-bom-line]');
    const select = $('[data-bom-component]', card);
    const counter = $('[data-bom-match-count]', card);
    const results = $('[data-bom-search-results]', card);
    const index = pendingBomDraft.lines.findIndex(line => line.id === card.dataset.bomLine);
    if (!select || index < 0) return;
    const query = input.value.trim();
    pendingBomDraft.lines[index].searchQuery = query;
    const selectedId = select.value;
    const count = bomCandidateCount(query);
    select.innerHTML = componentOptions(selectedId, query);
    select.value = selectedId;
    results.innerHTML = bomSearchResults(query, selectedId, pendingBomDraft.lines[index].quantityNeedsReview);
    counter.textContent = count ? `${count} 项` : '没有结果';
    counter.classList.toggle('empty', count === 0);
    refreshIcons();
  }

  async function confirmBomDeduction() {
    if (!pendingBomDraft) return;
    const button = $('#confirmBomDeduction');
    $('#bomError').textContent = '';
    button.disabled = true;
    try {
      const projectName = $('#bomProjectName').value.trim();
      if (!projectName) throw new Error('请填写板卡 / 项目名称');
      if (!pendingBomDraft.lines.some(line => line.selected)) throw new Error('请至少选择一项库存元件');
      const plan = window.BomManager.buildDeductionPlan(pendingBomDraft.lines, state.components);
      const now = new Date().toISOString();
      const projectId = uid('project');
      plan.forEach(item => {
        item.component.quantity = Number(item.component.quantity) - item.quantity;
        item.component.updatedAt = now;
        state.transactions.push({
          id: uid('txn'), batchId: projectId, projectId, componentId: item.component.id, type: 'out', quantity: item.quantity,
          note: `BOM 领料 · ${projectName} · ${pendingBomDraft.boardCount} 块`, actor: currentActor(), createdAt: now, source: 'bom'
        });
      });
      const lineSnapshots = pendingBomDraft.lines.map(line => {
        const component = componentById(line.componentId);
        return { ...clone(line), componentName: component?.name || '', componentCode: component?.code || '' };
      });
      const deductedQuantity = plan.reduce((sum, item) => sum + item.quantity, 0);
      const unresolved = lineSnapshots.filter(line => !line.selected).length;
      if (!Array.isArray(state.boardProjects)) state.boardProjects = [];
      state.boardProjects.push({
        id: projectId, name: projectName, sourceFile: pendingBomDraft.sourceFile, sheetName: pendingBomDraft.sheetName,
        boardCount: pendingBomDraft.boardCount, createdAt: now, actor: currentActor(), lines: lineSnapshots,
        summary: { totalLines: lineSnapshots.length, selectedLines: lineSnapshots.filter(line => line.selected).length, deductedQuantity, unresolved }
      });
      state.lastSavedAt = new Date().toISOString();
      persistLocal();
      renderAll();
      closeModal($('#bomModal'));
      pendingBomDraft = null;
      switchView('projects');
      showToast(`已为“${projectName}”扣减 ${deductedQuantity} 个元件`);
    } catch (error) {
      $('#bomError').textContent = error.message || 'BOM 领料失败';
      showToast(error.message || 'BOM 领料失败', 'error');
    } finally {
      button.disabled = false;
    }
  }

  function buildRestockRows() {
    return lowStockItems().map(item => {
      const need = Math.max(restockNeed(item), item.quantity <= 0 ? Math.max(Number(item.min) || 1, 1) : 0);
      return {
        name: item.name,
        code: item.code || '',
        category: item.category || '',
        current: item.quantity,
        min: item.min,
        need: need || Math.max(Number(item.min) || 1, 1),
        location: item.location || '',
        supplier: item.supplier || ''
      };
    });
  }

  function openRestockModal() {
    const rows = buildRestockRows();
    if ($('#restockIntro')) {
      $('#restockIntro').textContent = rows.length
        ? `共 ${rows.length} 种元件建议补货，默认补到预警库存。`
        : '当前没有低库存元件，仓库状态良好。';
    }
    if ($('#restockList')) {
      $('#restockList').innerHTML = rows.length ? rows.map(row => `
        <div class="restock-row">
          <div>
            <strong>${escapeHtml(row.name)}</strong>
            <small>${escapeHtml(row.code || '无编号')} · 现有 ${row.current} / 预警 ${row.min}</small>
          </div>
          <span class="restock-need">+${row.need}</span>
        </div>`).join('') : '<div class="empty-mini">暂无需要补货的元件</div>';
    }
    $('#restockModal')?.showModal();
  }

  function exportRestockCsv() {
    const rows = buildRestockRows();
    if (!rows.length) {
      showToast('当前没有需要补货的元件', 'error');
      return;
    }
    const headers = ['型号/名称', '物料编号', '分类', '当前库存', '预警库存', '建议补货', '库位', '供应商'];
    const body = rows.map(row => [row.name, row.code, row.category, row.current, row.min, row.need, row.location, row.supplier]);
    const csv = '\uFEFF' + [headers, ...body].map(line => line.map(csvEscape).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `补货清单_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('补货清单已导出');
  }

  async function copyRestockList() {
    const rows = buildRestockRows();
    if (!rows.length) {
      showToast('当前没有需要补货的元件', 'error');
      return;
    }
    const text = rows.map(row => `${row.name}\t建议补 ${row.need}\t现有 ${row.current}/${row.min}\t${row.supplier || ''}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast('补货清单已复制');
    } catch (_) {
      showToast('复制失败，请改用导出 CSV', 'error');
    }
  }

  function exportJsonBackup() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      components: state.components,
      transactions: state.transactions,
      favorites: state.favorites || [],
      boardProjects: state.boardProjects || [],
      lastSavedAt: state.lastSavedAt,
      seedVersion: state.seedVersion
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `元件仓完整备份_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('完整备份已导出');
  }

  function importJsonBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const payload = data.components ? data : data.payload;
        if (!isValidState(payload) && !isValidState(data)) throw new Error('JSON 备份格式无效');
        const source = isValidState(payload) ? payload : data;
        if (!window.confirm(`将用备份覆盖当前库存（${source.components.length} 种元件）。是否继续？`)) return;
        state = {
          components: clone(source.components),
          transactions: clone(source.transactions || []),
          favorites: Array.isArray(source.favorites) ? clone(source.favorites) : [],
          boardProjects: Array.isArray(source.boardProjects) ? clone(source.boardProjects) : [],
          lastSavedAt: source.lastSavedAt || new Date().toISOString(),
          seedVersion: source.seedVersion || state.seedVersion
        };
        saveState();
        showToast('完整备份已恢复');
      } catch (error) {
        showToast(error.message || 'JSON 导入失败', 'error');
      } finally {
        $('#csvFileInput').value = '';
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  function importAnyFile(file) {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith('.json') || file.type.includes('json')) {
      importJsonBackup(file);
      return;
    }
    importCsv(file);
  }

  function openComponentModal(id = '') {
    const component = id ? componentById(id) : null;
    $('#componentForm').reset();
    $('#componentId').value = component?.id || '';
    $('#componentModalEyebrow').textContent = component ? '编辑资料' : '新建资料';
    $('#componentModalTitle').textContent = component ? '编辑元件' : '添加元件';
    $('#scanComponentButton').hidden = Boolean(component);
    $('#lcscSearchButton').hidden = Boolean(component);
    $('#deleteComponentButton').hidden = !component;
    $('#componentName').value = component?.name || '';
    $('#componentCategory').value = component?.category || '';
    $('#componentBrand').value = component?.brand || '';
    $('#componentPackage').value = component?.package || '';
    $('#componentCode').value = component?.code || '';
    $('#componentSpecs').value = component?.specs || '';
    $('#componentQuantity').value = component?.quantity ?? 0;
    $('#componentMin').value = component?.min ?? 5;
    $('#componentLocation').value = component?.location || '';
    $('#componentSupplier').value = component?.supplier || '';
    $('#componentNotes').value = component?.notes || '';
    $('#componentModal').showModal();
    setTimeout(() => $('#componentName').focus(), 50);
  }

  function setLcscStatus(message = '', type = 'info') {
    const status = $('#lcscSearchStatus');
    status.textContent = message;
    status.classList.toggle('is-info', type !== 'error');
  }

  function openLcscSearchModal() {
    const initial = $('#componentCode').value.trim() || $('#componentName').value.trim();
    $('#lcscSearchInput').value = initial;
    $('#lcscSearchResults').innerHTML = '';
    setLcscStatus('');
    $('#lcscSearchModal').showModal();
    setTimeout(() => {
      $('#lcscSearchInput').focus();
      $('#lcscSearchInput').select();
    }, 50);
  }

  async function fetchLcscJson(path) {
    if (!lcscApiBase) throw new Error('本开源演示版未配置立创代理，无法搜索立创商城');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`${lcscApiBase}${path}`, { headers: { Accept: 'application/json' }, signal: controller.signal });
      let payload = null;
      try { payload = await response.json(); } catch (_) { /* 接口异常时使用统一错误 */ }
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || `立创查询失败（HTTP ${response.status}）`);
      return payload;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('查询超过 20 秒，请检查网络后重试');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  function renderLcscResults(results) {
    const root = $('#lcscSearchResults');
    if (!results.length) {
      root.innerHTML = '<div class="lcsc-empty">没有找到匹配器件，请检查型号或尝试输入 C 编号。</div>';
      return;
    }
    root.innerHTML = results.map(item => `
      <article class="lcsc-result-card">
        <div class="lcsc-result-main">
          <strong>${escapeHtml(item.model || item.code)}</strong>
          <small>${escapeHtml(item.description || '点击后读取完整商品资料')}</small>
          <div class="lcsc-result-tags"><span>${escapeHtml(item.code)}</span>${item.brand ? `<span>${escapeHtml(item.brand)}</span>` : ''}${item.package ? `<span>${escapeHtml(item.package)}</span>` : ''}${item.category ? `<span>${escapeHtml(item.category)}</span>` : ''}</div>
        </div>
        <button type="button" class="button secondary" data-lcsc-code="${escapeHtml(item.code)}"><i data-lucide="download"></i>选用并填充</button>
      </article>`).join('');
    refreshIcons();
  }

  async function runLcscSearch(event) {
    event?.preventDefault?.();
    const query = $('#lcscSearchInput').value.trim();
    if (query.length < 2) {
      setLcscStatus('请输入至少 2 个字符。', 'error');
      return;
    }
    const button = $('#lcscSearchSubmit');
    button.disabled = true;
    $('#lcscSearchResults').innerHTML = '';
    setLcscStatus('正在查询立创商城…');
    try {
      if (/^C\d+$/i.test(query)) {
        const payload = await fetchLcscJson(`/detail?code=${encodeURIComponent(query.toUpperCase())}`);
        renderLcscResults([payload.item]);
        setLcscStatus('已读取 1 条器件资料，请确认后填充。');
      } else {
        const payload = await fetchLcscJson(`/search?q=${encodeURIComponent(query)}`);
        renderLcscResults(payload.results || []);
        setLcscStatus(payload.results?.length ? `找到 ${payload.results.length} 条结果。` : '没有找到匹配器件。');
      }
    } catch (error) {
      setLcscStatus(error.message || '立创查询暂时不可用。', 'error');
    } finally {
      button.disabled = false;
    }
  }

  async function applyLcscComponent(code, button) {
    if (!/^C\d+$/i.test(code || '')) return;
    button.disabled = true;
    setLcscStatus(`正在读取 ${code} 的完整资料…`);
    try {
      const { item } = await fetchLcscJson(`/detail?code=${encodeURIComponent(code.toUpperCase())}`);
      const displayName = window.InventoryQr?.formatPassiveName(item, { model: item.model }) || item.model || item.code;
      $('#componentName').value = displayName || $('#componentName').value;
      $('#componentCode').value = item.code || $('#componentCode').value;
      $('#componentCategory').value = item.category || $('#componentCategory').value;
      $('#componentBrand').value = item.brand || $('#componentBrand').value;
      $('#componentPackage').value = item.package || $('#componentPackage').value;
      $('#componentSpecs').value = [item.model, item.specs || item.description].filter(Boolean).join(' · ') || $('#componentSpecs').value;
      $('#componentSupplier').value = '立创商城';
      $('#lcscSearchModal').close();
      showToast(`${displayName} 的立创资料已填入`);
      $('#componentQuantity').focus();
    } catch (error) {
      setLcscStatus(error.message || '读取完整资料失败。', 'error');
      button.disabled = false;
    }
  }

  function submitComponent(event) {
    event.preventDefault();
    const id = $('#componentId').value;
    const now = new Date().toISOString();
    const values = {
      name: $('#componentName').value.trim(),
      category: $('#componentCategory').value.trim(),
      brand: $('#componentBrand').value.trim(),
      package: $('#componentPackage').value.trim(),
      code: $('#componentCode').value.trim(),
      specs: $('#componentSpecs').value.trim(),
      quantity: Math.max(0, Number($('#componentQuantity').value) || 0),
      min: Math.max(0, Number($('#componentMin').value) || 0),
      location: $('#componentLocation').value.trim(),
      supplier: $('#componentSupplier').value.trim(),
      notes: $('#componentNotes').value.trim(),
      updatedAt: now
    };
    if (!values.name || !values.category) return;

    const continueScan = resumeScanAfterSave;
    resumeScanAfterSave = false;
    if (id) {
      const component = componentById(id);
      const delta = values.quantity - component.quantity;
      Object.assign(component, values);
      if (delta !== 0) {
        state.transactions.push({ id: uid('txn'), componentId: id, type: delta > 0 ? 'in' : 'out', quantity: Math.abs(delta), note: '编辑资料时调整', actor: currentActor(), createdAt: now });
      }
      showToast(continueScan ? '元件已入库，请继续扫下一件' : '元件资料已更新');
    } else {
      const newId = uid('cmp');
      state.components.push({ id: newId, ...values });
      if (values.quantity > 0) state.transactions.push({ id: uid('txn'), componentId: newId, type: 'in', quantity: values.quantity, note: values.notes || '初始库存', actor: currentActor(), createdAt: now });
      showToast(continueScan ? '新元件已入库，请继续扫下一件' : '新元件已加入仓库');
    }
    $('#componentModal').close();
    saveState();
    if (continueScan) {
      window.setTimeout(() => returnToScanModal(), 0);
    }
  }

  function deleteComponent() {
    const id = $('#componentId').value;
    const component = componentById(id);
    if (!component) return;
    if (!window.confirm(`确定删除“${component.name}”吗？历史出入库记录会继续保留。`)) return;
    state.transactions.forEach(transaction => {
      if (transaction.componentId === id) {
        transaction.componentName = component.name;
        transaction.componentCategory = component.category;
      }
    });
    state.components = state.components.filter(item => item.id !== id);
    $('#componentModal').close();
    saveState();
    showToast('元件已删除');
  }

  function setAdjustMode(mode) {
    adjustMode = mode;
    $$('.adjust-segments button').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
    $('#adjustSubmit').innerHTML = `<i data-lucide="check"></i>确认${mode === 'in' ? '入库' : '出库'}`;
    $('#adjustError').textContent = '';
    refreshIcons();
  }

  function openAdjustModal(mode = 'in', componentId = '') {
    if (!state.components.length) {
      showToast('请先添加元件', 'error');
      openComponentModal();
      return;
    }
    $('#adjustForm').reset();
    $('#adjustQuantity').value = 1;
    setAdjustMode(mode);
    renderAdjustOptions(componentId);
    $('#adjustModal').showModal();
  }

  function updateStockPreview() {
    const component = componentById($('#adjustComponent').value);
    $('#stockPreview').innerHTML = `<span>当前库存</span><strong>${component ? component.quantity : 0} pcs</strong>`;
    $('#adjustError').textContent = '';
  }

  function submitAdjustment(event) {
    event.preventDefault();
    const component = componentById($('#adjustComponent').value);
    const quantity = Math.max(1, Number($('#adjustQuantity').value) || 0);
    if (!component) return;
    if (adjustMode === 'out' && quantity > component.quantity) {
      $('#adjustError').textContent = `出库数量不能超过当前库存 ${component.quantity} pcs`;
      return;
    }
    component.quantity += adjustMode === 'in' ? quantity : -quantity;
    component.updatedAt = new Date().toISOString();
    state.transactions.push({
      id: uid('txn'), componentId: component.id, type: adjustMode, quantity,
      note: $('#adjustNote').value.trim() || (adjustMode === 'in' ? '元件入库' : '元件出库'), actor: currentActor(),
      createdAt: component.updatedAt
    });
    $('#adjustModal').close();
    saveState();
    showToast(`${component.name} 已${adjustMode === 'in' ? '入库' : '出库'} ${quantity} pcs`);
  }

  function applyGlobalSearch() {
    const query = $('#globalSearch').value.trim();
    $('#inventorySearch').value = query;
    switchView('inventory');
    renderInventory();
  }

  function showLowStock() {
    openInventoryWithFilter({ stock: 'low' });
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i data-lucide="${type === 'error' ? 'circle-alert' : 'circle-check'}"></i><span>${escapeHtml(message)}</span>`;
    $('#toastRegion').appendChild(toast);
    refreshIcons();
    window.setTimeout(() => toast.remove(), 3200);
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function exportCsv() {
    const headers = ['型号/名称', '物料编号', '分类', '品牌', '封装', '参数值', '当前库存', '预警库存', '库位', '供应商', '备注', '更新时间'];
    const rows = state.components.map(item => [item.name, item.code, item.category, item.brand, item.package, item.specs, item.quantity, item.min, item.location, item.supplier, item.notes, item.updatedAt]);
    const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `元件库存_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('库存 CSV 已导出');
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (quoted) {
        if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
        else if (character === '"') quoted = false;
        else field += character;
      } else if (character === '"') quoted = true;
      else if (character === ',') { row.push(field); field = ''; }
      else if (character === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
      else field += character;
    }
    if (field.length || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
    return rows;
  }

  function importCsv(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result).replace(/^\uFEFF/, '')).filter(row => row.some(cell => cell.trim()));
        if (rows.length < 2) throw new Error('CSV 中没有可导入的数据');
        const headerMap = new Map(rows[0].map((header, index) => [header.trim(), index]));
        if (!headerMap.has('型号/名称') || !headerMap.has('分类')) throw new Error('缺少“型号/名称”或“分类”列');
        const now = new Date().toISOString();
        const imported = rows.slice(1).filter(row => row[headerMap.get('型号/名称')]?.trim()).map(row => ({
          id: uid('cmp'),
          name: row[headerMap.get('型号/名称')]?.trim() || '',
          code: row[headerMap.get('物料编号')]?.trim() || '',
          category: row[headerMap.get('分类')]?.trim() || '未分类',
          brand: row[headerMap.get('品牌')]?.trim() || '',
          package: row[headerMap.get('封装')]?.trim() || '',
          specs: row[headerMap.get('参数值')]?.trim() || '',
          quantity: Math.max(0, Number(row[headerMap.get('当前库存')]) || 0),
          min: Math.max(0, Number(row[headerMap.get('预警库存')]) || 0),
          location: row[headerMap.get('库位')]?.trim() || '',
          supplier: row[headerMap.get('供应商')]?.trim() || '',
          notes: row[headerMap.get('备注')]?.trim() || '',
          updatedAt: row[headerMap.get('更新时间')]?.trim() || now
        }));
        imported.forEach(item => {
          state.components.push(item);
          if (item.quantity > 0) state.transactions.push({ id: uid('txn'), componentId: item.id, type: 'in', quantity: item.quantity, note: 'CSV 导入', actor: currentActor(), createdAt: now });
        });
        saveState();
        showToast(`成功导入 ${imported.length} 种元件`);
      } catch (error) {
        showToast(error.message || 'CSV 导入失败', 'error');
      } finally {
        $('#csvFileInput').value = '';
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  function openScanModal(options = {}) {
    scanReturnToComponent = options.returnToComponent === true;
    solderMatchMode = options.solderMatch === true;
    $('#manualScanInput').value = '';
    $('#scanResult').hidden = true;
    $('#scanModal').showModal();
    setTimeout(() => $('#manualScanInput').focus(), 50);
  }

  function findScannedComponent(rawValue) {
    if (solderMatchMode) {
      matchSolderScan(rawValue);
      return;
    }
    const decoded = window.InventoryQr?.decode(rawValue) || { kind: 'plain', code: rawValue, model: rawValue, quantity: 1, raw: rawValue };
    if (!decoded.raw) return;
    const fingerprint = `${decoded.code}|${decoded.model}|${decoded.quantity}|${decoded.order}`;
    const now = Date.now();
    if (lastScan.fingerprint === fingerprint && now - lastScan.at < 5000) {
      showToast('5 秒内相同标签已忽略，避免重复入库', 'error');
      return;
    }
    lastScan = { fingerprint, at: now };
    lastDecodedScan = {
      ...decoded,
      displayName: window.InventoryQr?.formatPassiveName({}, decoded) || ''
    };
    renderScanResult(lastDecodedScan);
    if (/^C\d+$/i.test(decoded.code)) enrichScanFromLcsc(decoded);
  }

  function matchScannedComponent(decoded) {
    const candidates = [decoded.code, decoded.displayName, decoded.model].filter(Boolean).map(normalizeKey);
    return state.components.find(item => candidates.some(value => value === normalizeKey(item.code) || value === normalizeKey(item.name)))
      || state.components.find(item => candidates.some(value => normalizeKey(item.name).includes(value) || normalizeKey(item.code).includes(value)));
  }

  function renderScanResult(decoded) {
    const component = matchScannedComponent(decoded);
    const label = decoded.displayName || decoded.model || decoded.code || '';
    const result = $('#scanResult');
    result.hidden = false;
    if (!component) {
      result.innerHTML = `<strong>识别成功，但库存中还没有这项元件</strong><span>${escapeHtml(label)}</span><div class="scan-meta">${decoded.code ? `<b>料号 ${escapeHtml(decoded.code)}</b>` : ''}${decoded.quantity ? `<b>标签数量 ${decoded.quantity}</b>` : ''}${decoded.order ? `<b>订单 ${escapeHtml(decoded.order)}</b>` : ''}${decoded.model && decoded.model !== label ? `<b>厂家料号 ${escapeHtml(decoded.model)}</b>` : ''}</div><button class="button primary" data-scan-add><i data-lucide="plus"></i>按标签新建并入库</button>`;
    } else {
      result.innerHTML = `<strong>${escapeHtml(component.name)}</strong><span>${escapeHtml(component.code || '无物料编号')} · ${escapeHtml(component.location || '未分配库位')} · 当前库存 ${component.quantity} pcs</span><div class="scan-meta"><b>${decoded.kind === 'lcsc' ? '嘉立创标签' : '普通标签'}</b><b>建议入库 ${decoded.quantity} pcs</b>${decoded.order ? `<b>订单 ${escapeHtml(decoded.order)}</b>` : ''}</div><button class="button primary" data-scan-quick-in="${component.id}" data-qty="${decoded.quantity}"><i data-lucide="package-plus"></i>确认快速入库</button><button class="button secondary" data-scan-adjust="${component.id}">修改数量</button>`;
    }
    refreshIcons();
  }

  async function enrichScanFromLcsc(decoded) {
    try {
      const { item } = await fetchLcscJson(`/detail?code=${encodeURIComponent(decoded.code.toUpperCase())}`);
      const displayName = window.InventoryQr?.formatPassiveName(item, decoded) || lastDecodedScan?.displayName || item.model || decoded.code;
      lastDecodedScan = {
        ...decoded,
        displayName,
        package: item.package || '',
        category: item.category || '',
        brand: item.brand || '',
        specs: [decoded.model || item.model, item.specs || item.description].filter(Boolean).join(' · '),
        mpn: decoded.model || item.model
      };
      renderScanResult(lastDecodedScan);
    } catch (_) { /* 立创暂时不可用时，仍用标签上的规格名 */ }
  }

  function setScanStatus(text, waiting = false) {
    const status = $('#scanStatus');
    if (!status) return;
    status.hidden = !text;
    status.textContent = text || '';
    status.classList.toggle('is-wait', Boolean(waiting));
  }

  async function createBarcodeDetector() {
    if (!('BarcodeDetector' in window)) return null;
    const formats = ['qr_code', 'code_128', 'code_39', 'codabar', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'data_matrix'];
    try {
      const supported = await BarcodeDetector.getSupportedFormats();
      const usable = formats.filter(format => supported.includes(format));
      return new BarcodeDetector({ formats: usable.length ? usable : ['qr_code'] });
    } catch (_) {
      try { return new BarcodeDetector({ formats: ['qr_code'] }); }
      catch { return null; }
    }
  }

  function pickScanValue(values) {
    const unique = [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
    if (!unique.length) return '';
    const scored = unique.map(raw => {
      const parsed = window.InventoryQr?.decode(raw) || {};
      const lcsc = parsed.kind === 'lcsc' ? 3 : /^C\d{3,}$/i.test(parsed.code || raw) ? 2 : 0;
      return { raw, lcsc };
    });
    scored.sort((a, b) => b.lcsc - a.lcsc);
    return scored[0].raw;
  }

  async function readCodesFromFrame(video, canvas) {
    if (!video.videoWidth || !video.videoHeight) return '';
    const maxWidth = 800;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const width = Math.max(1, Math.round(video.videoWidth * scale));
    const height = Math.max(1, Math.round(video.videoHeight * scale));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, width, height);
    const found = [];
    if (barcodeDetector) {
      try {
        const codes = await barcodeDetector.detect(canvas);
        codes.forEach(item => { if (item.rawValue) found.push(item.rawValue); });
      } catch (_) { /* Windows BarcodeDetector often returns empty; jsQR is the fallback. */ }
    }
    if (typeof jsQR === 'function') {
      const regions = [
        [0, 0, width, height],
        [Math.round(width * 0.18), Math.round(height * 0.18), Math.round(width * 0.64), Math.round(height * 0.64)]
      ];
      for (const [x, y, w, h] of regions) {
        const image = ctx.getImageData(x, y, Math.max(1, w), Math.max(1, h));
        const qr = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
        if (qr?.data) found.push(qr.data);
      }
    }
    return pickScanValue(found);
  }

  async function tickCameraScan() {
    if (!scanStream) return;
    if (!scanBusy) {
      scanBusy = true;
      try {
        const raw = await readCodesFromFrame($('#scanVideo'), $('#scanCanvas'));
        if (raw) {
          findScannedComponent(raw);
          stopCamera();
          return;
        }
        if (Date.now() - scanStartedAt > 6000) {
          setScanStatus('还没扫到。请把袋上的小二维码对准绿框，拿近一些并避开塑料反光。', true);
        }
      } finally {
        scanBusy = false;
      }
    }
    scanTimer = window.requestAnimationFrame(tickCameraScan);
  }

  async function startCameraScan() {
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('当前浏览器不支持摄像头，请把二维码内容粘贴到下方', 'error');
      return;
    }
    try {
      scanStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      const track = scanStream.getVideoTracks()[0];
      try { await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }); } catch (_) {}
      $('#scanVideo').srcObject = scanStream;
      await $('#scanVideo').play();
      $('#cameraPlaceholder').hidden = true;
      $('#startCameraButton').innerHTML = '<i data-lucide="camera-off"></i>停止摄像头';
      setScanStatus('正在识别二维码，请把嘉立创标签上的小码对准绿框');
      refreshIcons();
      barcodeDetector = await createBarcodeDetector();
      scanStartedAt = Date.now();
      scanBusy = false;
      scanTimer = window.requestAnimationFrame(tickCameraScan);
    } catch (error) {
      showToast('无法使用摄像头，请检查浏览器权限，或把二维码内容粘贴到下方', 'error');
    }
  }

  function stopCamera() {
    if (scanTimer) window.cancelAnimationFrame(scanTimer);
    scanTimer = null;
    scanBusy = false;
    if (scanStream) scanStream.getTracks().forEach(track => track.stop());
    scanStream = null;
    barcodeDetector = null;
    $('#scanVideo').srcObject = null;
    $('#cameraPlaceholder').hidden = false;
    $('#startCameraButton').innerHTML = '<i data-lucide="camera"></i>开启摄像头扫描';
    setScanStatus('');
    refreshIcons();
  }

  function fillComponentFromScan(decoded) {
    $('#componentName').value = decoded.displayName || decoded.model || decoded.code || '';
    $('#componentCode').value = decoded.code || '';
    $('#componentPackage').value = decoded.package || $('#componentPackage').value;
    $('#componentCategory').value = decoded.category || $('#componentCategory').value;
    $('#componentBrand').value = decoded.brand || $('#componentBrand').value;
    $('#componentSpecs').value = decoded.specs || decoded.model || '';
    $('#componentSupplier').value = decoded.kind === 'lcsc' ? '立创商城' : $('#componentSupplier').value;
    $('#componentQuantity').value = decoded.quantity || 1;
    $('#componentNotes').value = decoded.order ? `扫码入库 · 订单 ${decoded.order}` : '扫码入库';
  }

  function prepareNextScan() {
    $('#manualScanInput').value = '';
    $('#scanResult').hidden = true;
    lastDecodedScan = null;
    if (!$('#scanModal').open) $('#scanModal').showModal();
    window.setTimeout(() => {
      if ($('#scanModal').open && !scanStream) startCameraScan();
    }, 60);
  }

  function returnToScanModal() {
    resumeScanAfterSave = false;
    prepareNextScan();
  }

  async function openComponentFromScan() {
    const keepScanning = !scanReturnToComponent && !solderMatchMode;
    scanReturnToComponent = false;
    const decoded = lastDecodedScan || {};
    stopCamera();
    resumeScanAfterSave = keepScanning;
    if (!$('#scanModal').open) $('#scanModal').showModal();
    openComponentModal();
    fillComponentFromScan(decoded);
    if (/^C\d+$/i.test(decoded.code) && !decoded.category) {
      try {
        await enrichScanFromLcsc(decoded);
        fillComponentFromScan(lastDecodedScan || decoded);
      } catch (_) { /* 保留标签解析结果 */ }
    }
  }

  function quickScanInbound(componentId, quantity) {
    const component = componentById(componentId);
    if (!component) return;
    const amount = Math.max(1, Number(quantity) || 1);
    const now = new Date().toISOString();
    component.quantity += amount;
    component.updatedAt = now;
    state.transactions.push({
      id: uid('txn'), componentId: component.id, type: 'in', quantity: amount,
      note: lastDecodedScan?.order ? `扫码入库 · 订单 ${lastDecodedScan.order}` : '扫码快速入库', actor: currentActor(), createdAt: now
    });
    saveState();
    showToast(`${component.name} 已入库 ${amount} pcs，请继续扫下一件`);
    if (solderMatchMode) {
      closeModal($('#scanModal'));
      return;
    }
    prepareNextScan();
  }

  function closeModal(dialog) {
    if (dialog === $('#scanModal')) {
      stopCamera();
      resumeScanAfterSave = false;
    }
    const resumeScan = dialog === $('#componentModal') && resumeScanAfterSave;
    dialog.close();
    if (resumeScan) window.setTimeout(() => returnToScanModal(), 0);
  }

  const SIDEBAR_KEY = 'component-vault-sidebar-collapsed';

  function navItemTitle(button) {
    const label = button.querySelector('span')?.textContent?.trim() || '';
    const count = button.querySelector('b')?.textContent?.trim();
    return count ? `${label} · ${count}` : label;
  }

  function refreshNavTitles() {
    $$('.nav-item').forEach(item => { item.title = navItemTitle(item); });
  }

  function applySidebarCollapsed(collapsed) {
    document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
    const button = $('#sidebarToggle');
    if (button) {
      button.setAttribute('aria-expanded', String(!collapsed));
      button.title = collapsed ? '展开侧边栏' : '收起侧边栏';
      button.setAttribute('aria-label', button.title);
    }
    refreshNavTitles();
    const status = $('#sidebarStatus');
    if (status) status.title = collapsed ? ($('#syncTitle')?.textContent || '同步状态') : '';
  }

  function bindSidebarToggle() {
    applySidebarCollapsed(localStorage.getItem(SIDEBAR_KEY) === '1');
    $('#sidebarToggle')?.addEventListener('click', () => {
      const next = !document.documentElement.classList.contains('sidebar-collapsed');
      localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
      applySidebarCollapsed(next);
      refreshIcons();
    });
    refreshIcons();
  }

  function bindEvents() {
    bindSidebarToggle();
    $$('.nav-item').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
    $$('[data-view-target]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.viewTarget)));
    $$('[data-go-inventory]').forEach(button => button.addEventListener('click', () => switchView('inventory')));
    $('#openAddButton').addEventListener('click', () => openComponentModal());
    $('#componentForm').addEventListener('submit', submitComponent);
    $('#deleteComponentButton').addEventListener('click', deleteComponent);
    $$('.close-modal').forEach(button => button.addEventListener('click', () => closeModal(button.closest('dialog'))));
    $$('.modal').forEach(dialog => dialog.addEventListener('click', event => {
      if (event.target === dialog) closeModal(dialog);
    }));

    $$('.quick-action[data-adjust-mode]').forEach(button => button.addEventListener('click', () => openAdjustModal(button.dataset.adjustMode)));
    $$('.adjust-segments button').forEach(button => button.addEventListener('click', () => setAdjustMode(button.dataset.mode)));
    $('#adjustComponent').addEventListener('change', updateStockPreview);
    $('#adjustForm').addEventListener('submit', submitAdjustment);

    $('#inventorySearch').addEventListener('input', renderInventory);
    $('#categoryFilter').addEventListener('change', renderInventory);
    $('#stockFilter').addEventListener('change', renderInventory);
    $('#locationFilter')?.addEventListener('change', renderInventory);
    $('#resetFilters').addEventListener('click', () => {
      $('#inventorySearch').value = '';
      $('#categoryFilter').value = 'all';
      $('#stockFilter').value = 'all';
      if ($('#locationFilter')) $('#locationFilter').value = 'all';
      renderInventory();
    });
    $('#inventoryTableBody').addEventListener('click', handleInventoryAction);
    $('#mobileInventoryList').addEventListener('click', handleInventoryAction);
    [$('#inventoryTableBody'), $('#mobileInventoryList')].forEach(root => root.addEventListener('change', event => {
      const input = event.target.closest('[data-select-id]');
      if (input) toggleSelection(input.dataset.selectId, input.checked);
    }));
    $('#selectAllFiltered').addEventListener('change', event => {
      filteredComponents().forEach(item => event.target.checked ? selectedComponentIds.add(item.id) : selectedComponentIds.delete(item.id));
      renderInventory();
    });
    $('#clearSelectionButton').addEventListener('click', () => { selectedComponentIds.clear(); renderInventory(); });
    $('#batchInButton').addEventListener('click', () => openBatchModal('in'));
    $('#batchOutButton').addEventListener('click', () => openBatchModal('out'));
    $('#batchForm').addEventListener('submit', submitBatch);
    $('#globalSearch').addEventListener('keydown', event => {
      if (event.key === 'Enter') applyGlobalSearch();
    });
    $('#lowStockShortcut').addEventListener('click', showLowStock);

    $$('[data-stat-jump]').forEach(button => {
      button.addEventListener('click', () => handleStatJump(button.dataset.statJump));
    });
    $('#viewAllLowButton')?.addEventListener('click', showLowStock);
    $('#openRestockButton')?.addEventListener('click', openRestockModal);
    $('#exportRestockButton')?.addEventListener('click', openRestockModal);
    $('#downloadRestockButton')?.addEventListener('click', exportRestockCsv);
    $('#copyRestockButton')?.addEventListener('click', copyRestockList);
    $('#exportJsonButton')?.addEventListener('click', exportJsonBackup);

    $('#recentActivity')?.addEventListener('click', event => {
      const row = event.target.closest('[data-activity-id]');
      if (!row?.dataset.activityId) return;
      openComponentModal(row.dataset.activityId);
    });
    $('#lowStockList')?.addEventListener('click', event => {
      const row = event.target.closest('[data-low-id]');
      if (!row) return;
      openAdjustModal('in', row.dataset.lowId);
    });
    $('#categoryLegend')?.addEventListener('click', event => {
      const row = event.target.closest('[data-category-jump]');
      if (!row || !row.dataset.categoryJump) return;
      openInventoryWithFilter({ category: row.dataset.categoryJump });
    });
    $('#favoritesList')?.addEventListener('click', event => {
      const openBtn = event.target.closest('[data-favorite-open]');
      if (openBtn) {
        openComponentModal(openBtn.dataset.favoriteOpen);
        return;
      }
      handleInventoryAction(event);
    });
    $('#insightList')?.addEventListener('click', event => {
      const card = event.target.closest('[data-insight]');
      if (!card?.dataset.insight) return;
      if (card.dataset.insight === 'view-low') openInventoryWithFilter({ stock: 'low' });
      if (card.dataset.insight === 'view-location') openInventoryWithFilter({ location: 'none' });
      if (card.dataset.insight === 'view-zero') openInventoryWithFilter({ stock: 'zero' });
      if (card.dataset.insight === 'view-category') openInventoryWithFilter({ category: card.dataset.category || 'all' });
    });

    $('#transactionFilter').addEventListener('click', event => {
      const button = event.target.closest('[data-transaction-filter]');
      if (!button) return;
      transactionFilter = button.dataset.transactionFilter;
      $$('[data-transaction-filter]').forEach(item => item.classList.toggle('active', item === button));
      renderTransactions();
    });

    $('#openSolderFromProjects')?.addEventListener('click', () => switchView('solder'));
    $('#openGerberZipButton')?.addEventListener('click', () => $('#gerberZipInput').click());
    $('#gerberZipInput')?.addEventListener('change', () => openGerberZipFile($('#gerberZipInput').files[0]));
    $('#openSolderBomButton')?.addEventListener('click', () => $('#solderBomInput').click());
    $('#solderBomInput')?.addEventListener('change', () => loadSolderBomFile($('#solderBomInput').files[0]));
    $('#openSolderPnpButton')?.addEventListener('click', () => $('#solderPnpInput').click());
    $('#solderPnpInput')?.addEventListener('change', () => loadSolderPnpFile($('#solderPnpInput').files[0]));
    $('#solderScanButton')?.addEventListener('click', () => openScanModal({ solderMatch: true }));
    $('#clearSolderBomButton')?.addEventListener('click', () => clearSolderBom());
    $('#clearSolderGerberButton')?.addEventListener('click', () => clearSolderGerber());
    $('#clearSolderSessionButton')?.addEventListener('click', clearSolderSession);
    $('#saveSolderBoardButton')?.addEventListener('click', saveCurrentSolderBoard);
    $('#solderSavedSearch')?.addEventListener('input', paintSavedSolderBoards);
    $('#solderSavedList')?.addEventListener('click', event => {
      const openButton = event.target.closest('[data-solder-open]');
      if (openButton) {
        loadSavedSolderBoard(openButton.dataset.solderOpen);
        return;
      }
      const deleteButton = event.target.closest('[data-solder-delete]');
      if (deleteButton) deleteSavedSolderBoard(deleteButton.dataset.solderDelete);
    });
    $('#solderLayerMode')?.addEventListener('click', event => {
      const button = event.target.closest('[data-solder-mode]');
      if (!button) return;
      solderState.mode = button.dataset.solderMode;
      $$('#solderLayerMode button').forEach(item => item.classList.toggle('active', item === button));
      updateSolderLayout();
    });
    $('#solderFitButton')?.addEventListener('click', () => {
      updateSolderLayout();
      renderGerberBoards();
    });
    $('#solderBomSearch')?.addEventListener('input', renderSolderBom);
    $('#solderBomList')?.addEventListener('click', event => {
      const row = event.target.closest('[data-solder-line]');
      if (!row) return;
      const line = solderState.bomLines.find(item => item.id === row.dataset.solderLine);
      if (line) markSolderLine(line);
    });
    $('#importBomButton').addEventListener('click', () => $('#bomFileInput').click());
    $('#bomFileInput').addEventListener('change', () => importBomFile($('#bomFileInput').files[0]));
    $('#bomBoardCount').addEventListener('input', () => {
      window.clearTimeout(bomBoardCountTimer);
      bomBoardCountTimer = window.setTimeout(updateBomBoardCount, 220);
    });
    $('#bomBoardCount').addEventListener('change', () => {
      window.clearTimeout(bomBoardCountTimer);
      updateBomBoardCount();
    });
    $('#bomLineList').addEventListener('change', event => {
      const card = event.target.closest('[data-bom-line]');
      if (!card || !pendingBomDraft) return;
      const index = pendingBomDraft.lines.findIndex(line => line.id === card.dataset.bomLine);
      if (event.target.matches('[data-bom-select]') && index >= 0) {
        pendingBomDraft.lines[index].selected = event.target.checked;
        renderBomDraft();
        return;
      }
      if (event.target.matches('[data-bom-component], [data-bom-quantity]')) updateBomLineFromControls(card);
    });
    $('#bomLineList').addEventListener('click', event => {
      const candidate = event.target.closest('[data-bom-pick]');
      if (!candidate) return;
      const card = candidate.closest('[data-bom-line]');
      const select = $('[data-bom-component]', card);
      select.value = candidate.dataset.bomPick;
      updateBomLineFromControls(card);
    });
    $('#bomLineList').addEventListener('input', event => {
      const input = event.target.closest('[data-bom-search]');
      if (!input) return;
      window.clearTimeout(bomSearchTimers.get(input));
      bomSearchTimers.set(input, window.setTimeout(() => filterBomComponentOptions(input), 120));
    });
    $('#bomLineList').addEventListener('keydown', event => {
      const input = event.target.closest('[data-bom-search]');
      if (input && event.key === 'ArrowDown') {
        event.preventDefault();
        input.closest('[data-bom-line]').querySelector('[data-bom-component]')?.focus();
      }
    });
    $('#confirmBomDeduction').addEventListener('click', confirmBomDeduction);

    $('#exportButton').addEventListener('click', exportCsv);
    $('#importButton').addEventListener('click', () => $('#csvFileInput').click());
    $('#csvFileInput').addEventListener('change', () => {
      if ($('#csvFileInput').files[0]) importAnyFile($('#csvFileInput').files[0]);
    });
    function resetDemoData() {
      if (!window.confirm('重置为内置演示数据？当前浏览器里的本地修改会被覆盖。')) return;
      state = clone(initialData);
      persistLocal();
      renderAll();
      showToast('已重置为演示数据');
    }
    $('#syncNowButton')?.addEventListener('click', resetDemoData);
    $('#syncNowButtonTop')?.addEventListener('click', resetDemoData);

    $('#openScanButton').addEventListener('click', openScanModal);
    $('#lcscSearchButton').addEventListener('click', openLcscSearchModal);
    $('#lcscSearchForm').addEventListener('submit', runLcscSearch);
    $('#lcscSearchResults').addEventListener('click', event => {
      const button = event.target.closest('[data-lcsc-code]');
      if (button) applyLcscComponent(button.dataset.lcscCode, button);
    });
    $('#scanComponentButton').addEventListener('click', () => {
      $('#componentModal').close();
      openScanModal({ returnToComponent: true });
    });
    $('#manualScanButton').addEventListener('click', findManualScan);
    $('#manualScanInput').addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); findManualScan(); }
    });
    $('#startCameraButton').addEventListener('click', () => scanStream ? stopCamera() : startCameraScan());
    $('#scanResult').addEventListener('click', event => {
      if (event.target.closest('[data-scan-add]')) openComponentFromScan();
      const quickIn = event.target.closest('[data-scan-quick-in]');
      if (quickIn) quickScanInbound(quickIn.dataset.scanQuickIn, quickIn.dataset.qty);
      const adjust = event.target.closest('[data-scan-adjust]');
      if (adjust) {
        const qty = lastDecodedScan?.quantity || 1;
        closeModal($('#scanModal'));
        openAdjustModal('in', adjust.dataset.scanAdjust);
        $('#adjustQuantity').value = qty;
        $('#adjustNote').value = lastDecodedScan?.order ? `扫码入库 · 订单 ${lastDecodedScan.order}` : '扫码入库';
      }
    });



    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        $('#globalSearch').focus();
      }
      if (event.key === 'Escape' && $('#scanModal').open) stopCamera();
      const isTyping = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
      if (!isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const now = Date.now();
        if (now - scannerLastKeyAt > 80) scannerBuffer = '';
        scannerLastKeyAt = now;
        if (event.key === 'Enter' && scannerBuffer.length >= 4) {
          event.preventDefault();
          openScanModal();
          $('#manualScanInput').value = scannerBuffer;
          findScannedComponent(scannerBuffer);
          scannerBuffer = '';
        } else if (event.key.length === 1) scannerBuffer += event.key;
      }
    });
    window.addEventListener('beforeunload', stopCamera);
  }

  function handleInventoryAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'edit') openComponentModal(button.dataset.id);
    if (button.dataset.action === 'adjust') openAdjustModal('in', button.dataset.id);
    if (button.dataset.action === 'favorite') toggleFavorite(button.dataset.id);
  }

  // 兼容旧本地数据：补全 favorites 字段
  ensureFavorites();

  function findManualScan(event) {
    event?.preventDefault?.();
    findScannedComponent($('#manualScanInput').value);
  }

  // 3D storage uses the current inventory state and its existing workspace sync.
  window.ComponentStorageBridge = {
    read() {
      return {
        records: clone(state.storage3d || {}),
        boxes: clone(state.storageBoxes || []),
        layout: inferStorageLayout(state),
        components: clone(state.components),
        scope: localStorageKey()
      };
    },
    save(id, record, expectedScope) {
      if (expectedScope !== localStorageKey()) throw new Error('仓库已切换，请重新选择位置');
      if (!/^[A-Z]{1,3}\d{2}-[A-Z]\d{2}$/.test(id)) throw new Error('无效的位置编号');
      if (!record || typeof record.name !== 'string' || record.name.length > 80 || typeof record.notes !== 'string' || record.notes.length > 500) throw new Error('位置数据无效');
      const component = record.componentId ? state.components.find(c => c.id === record.componentId) : null;
      if (record.componentId && !component) throw new Error('关联器件已不存在，请重新选择');
      const other = state.components.find(c => c.location === id && c.id !== record.componentId);
      if (other && other.id !== state.storage3d?.[id]?.componentId) throw new Error(`此位置已被 ${other.name} 占用，请先在元件明细中调整库位`);
      if (component && component.location && component.location !== id) throw new Error(`器件已有库位 ${component.location}，请先在元件明细清空旧库位后关联`);
      if (record.componentId && Object.entries(state.storage3d || {}).some(([key,value]) => key !== id && value.componentId === record.componentId)) throw new Error('此器件已关联其他位置，请先解除旧位置关联');
      const previous = clone(state);
      state.storage3d = state.storage3d || {};
      const old = state.storage3d[id];
      if (old?.componentId && old.componentId !== record.componentId) {
        const oldComponent = state.components.find(c => c.id === old.componentId);
        if (oldComponent?.location === id) oldComponent.location = '';
      }
      state.storage3d[id] = {name:record.name.trim(),notes:record.notes.trim(),componentId:record.componentId || ''};
      if (component) component.location = id;
      try { saveState(); } catch(error) { state = previous; throw error; }
    },
    saveBoxes(customBoxes, expectedScope) {
      if (expectedScope !== localStorageKey()) throw new Error('仓库已切换，请重新选择收纳盒');
      if (!Array.isArray(customBoxes)) throw new Error('收纳盒数据无效');
      const previous = clone(state);
      const nextIds = new Set(customBoxes.map(box => box.id));
      const oldIds = (state.storageBoxes || []).map(box => box.id);
      state.storage3d = state.storage3d || {};
      oldIds.forEach(boxId => {
        if (nextIds.has(boxId)) return;
        const prefix = `${boxId}-`;
        Object.keys(state.storage3d).forEach(id => {
          if (!id.startsWith(prefix)) return;
          const rec = state.storage3d[id];
          if (rec?.componentId) {
            const component = state.components.find(item => item.id === rec.componentId);
            if (component?.location === id) component.location = '';
          }
          delete state.storage3d[id];
        });
        state.components.forEach(component => {
          if (String(component.location || '').startsWith(prefix)) component.location = '';
        });
      });
      customBoxes.forEach(box => {
        const keep = new Set();
        const rows = Number(box.rows) || 0;
        const cols = Number(box.cols) || 0;
        for (let i = 0; i < rows * cols; i++) {
          keep.add(`${box.id}-${String.fromCharCode(65 + Math.floor(i / cols))}${String(i % cols + 1).padStart(2, '0')}`);
        }
        const prefix = `${box.id}-`;
        Object.keys(state.storage3d).forEach(id => {
          if (id.startsWith(prefix) && !keep.has(id)) {
            const rec = state.storage3d[id];
            if (rec?.componentId) {
              const component = state.components.find(item => item.id === rec.componentId);
              if (component?.location === id) component.location = '';
            }
            delete state.storage3d[id];
          }
        });
      });
      state.storageBoxes = clone(customBoxes);
      try { saveState(); } catch (error) { state = previous; throw error; }
    }
  };
  bindEvents();
  persistLocal();
  setSyncStatus('local', '本地演示模式 · 数据只保存在当前浏览器');
  renderAll();
  if (new URLSearchParams(location.search).get('view') === 'storage') switchView('storage');
})();
