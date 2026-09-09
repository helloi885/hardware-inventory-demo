(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SolderBoardStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DB_NAME = 'component-vault-solder-boards-v1';
  const STORE = 'boards';

  function buildRecord(input = {}) {
    const name = String(input.name || '').trim() || '未命名板卡';
    const zipBytes = input.zipBytes;
    if (!zipBytes || !(zipBytes.byteLength || zipBytes.size)) throw new Error('还没有 Gerber 文件，无法保存');
    return {
      id: input.id || `board-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      savedAt: input.savedAt || new Date().toISOString(),
      zipName: input.zipName || '',
      zipBytes,
      bomName: input.bomName || '',
      bomLines: Array.isArray(input.bomLines) ? input.bomLines : [],
      pnp: Array.isArray(input.pnp) ? input.pnp : []
    };
  }

  function summarize(record) {
    const zipBytes = record?.zipBytes;
    return {
      id: record.id,
      name: record.name,
      savedAt: record.savedAt,
      zipName: record.zipName || '',
      bomName: record.bomName || '',
      bomCount: Array.isArray(record.bomLines) ? record.bomLines.length : 0,
      pnpCount: Array.isArray(record.pnp) ? record.pnp.length : 0,
      zipSize: zipBytes ? (zipBytes.byteLength || zipBytes.size || 0) : 0
    };
  }

  function openDb() {
    if (typeof indexedDB === 'undefined') return Promise.reject(new Error('当前环境不能保存板卡文件'));
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('无法打开板卡保存库'));
    });
  }

  function run(mode, work) {
    return openDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      let request;
      try {
        request = work(store);
      } catch (error) {
        db.close();
        reject(error);
        return;
      }
      request.onsuccess = () => {
        const value = request.result;
        tx.oncomplete = () => {
          db.close();
          resolve(value);
        };
      };
      request.onerror = () => {
        db.close();
        reject(request.error || new Error('板卡保存失败'));
      };
    }));
  }

  function list() {
    return run('readonly', store => store.getAll()).then(rows => (rows || [])
      .map(summarize)
      .sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt))));
  }

  function get(id) {
    return run('readonly', store => store.get(id)).then(row => {
      if (!row) throw new Error('找不到这条板卡记录');
      return row;
    });
  }

  function put(record) {
    const next = buildRecord(record);
    return run('readwrite', store => store.put(next)).then(() => summarize(next));
  }

  function remove(id) {
    return run('readwrite', store => store.delete(id)).then(() => true);
  }

  return { DB_NAME, STORE, buildRecord, summarize, list, get, put, remove };
});
