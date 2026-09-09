(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.InventoryQr = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function clean(value) {
    return String(value == null ? '' : value).trim().replace(/^['"]|['"]$/g, '');
  }

  function parsePairs(text) {
    const source = clean(text).replace(/^\{\s*|\s*\}$/g, '');
    const pairs = {};
    source.split(/[,;\n]+/).forEach(part => {
      const match = part.match(/^\s*([a-zA-Z_][\w-]*)\s*[:=]\s*(.*?)\s*$/);
      if (match) pairs[match[1].toLowerCase()] = clean(match[2]);
    });
    return pairs;
  }

  function safeDecode(value) {
    try { return decodeURIComponent(value); } catch (_) { return value; }
  }

  function parseUrl(text) {
    try {
      const url = new URL(text);
      const all = `${url.pathname} ${url.search}`;
      const code = url.searchParams.get('code') || url.searchParams.get('pc') || (all.match(/\bC\d{3,}\b/i) || [])[0] || '';
      return code ? { kind: 'url', code: code.toUpperCase(), model: '', quantity: 1, order: '', raw: text } : null;
    } catch (_) { return null; }
  }

  function decode(rawValue) {
    const raw = safeDecode(clean(rawValue));
    if (!raw) return { kind: 'empty', code: '', model: '', quantity: 1, order: '', raw: '' };
    const pairs = parsePairs(raw);
    if (pairs.pc && (pairs.on || pairs.pm || pairs.qty)) {
      return {
        kind: 'lcsc', code: pairs.pc.toUpperCase(), model: pairs.pm || '',
        quantity: Math.max(1, Number.parseInt(pairs.qty, 10) || 1), order: pairs.on || '', raw
      };
    }
    if (pairs.id || pairs.pid || pairs.model) {
      return {
        kind: 'internal', id: pairs.id || '', code: pairs.pid || '', model: pairs.model || '',
        quantity: Math.max(1, Number.parseInt(pairs.qty, 10) || 1), action: pairs.type || '', order: '', raw
      };
    }
    const urlResult = parseUrl(raw);
    if (urlResult) return urlResult;
    const codeMatch = raw.match(/(?:物料编号|立创编号|LCSC(?:\s*Part)?\s*#?|编号|PC)\s*[:：#]?\s*(C\d{3,})/i)
      || raw.match(/\b(C\d{3,})\b/i);
    const quantityMatch = raw.match(/(?:数量|QTY)\s*[:：xX]?\s*(\d+)/i);
    const modelMatch = raw.match(/(?:型号|MODEL|PM)\s*[:：]?\s*([^,;\n]+)/i);
    if (codeMatch || modelMatch) {
      return {
        kind: 'label', code: (codeMatch?.[1] || '').toUpperCase(), model: clean(modelMatch?.[1] || ''),
        quantity: Math.max(1, Number.parseInt(quantityMatch?.[1], 10) || 1), order: '', raw
      };
    }
    return { kind: 'plain', code: raw, model: raw, quantity: 1, order: '', raw };
  }

  function specMap(specs) {
    const map = {};
    String(specs || '').split(/[；;]/).forEach(part => {
      const index = part.indexOf(':');
      if (index > 0) map[part.slice(0, index).trim()] = part.slice(index + 1).trim();
    });
    return map;
  }

  function eiaToCapacitance(code) {
    const text = String(code || '');
    if (!/^\d{3}$/.test(text)) return '';
    const pico = Number(text.slice(0, 2)) * Math.pow(10, Number(text.slice(2)));
    if (!Number.isFinite(pico) || pico <= 0) return '';
    if (pico >= 1e6) return `${Number((pico / 1e6).toPrecision(3))}uF`;
    if (pico >= 1e3) return `${Number((pico / 1e3).toPrecision(3))}nF`;
    return `${Number(pico.toPrecision(3))}pF`;
  }

  function eiaToVoltage(code) {
    const text = String(code || '');
    if (!/^\d{2,3}$/.test(text)) return '';
    const value = text.length === 3 ? Number(text) / 10 : Number(text);
    return value ? `${value}V` : '';
  }

  function formatPassiveName(item = {}, decoded = {}) {
    const specs = specMap(item.specs);
    const value = specs['容值'] || specs['阻值'] || specs.Capacitance || specs.Resistance || '';
    const volt = (specs['额定电压'] || specs.Voltage || '').replace(/\s+/g, '');
    const pkg = String(item.package || '').trim();
    if (value && pkg && volt) return `${value} ${pkg} ${volt}`;
    if (value && pkg) return `${value} ${pkg}`;
    const desc = String(item.description || '');
    const fromDesc = desc.match(/(\d+(?:\.\d+)?\s*(?:pF|nF|uF|µF|μF|kΩ|MΩ|Ω))\s*(?:±[^\s]+\s*)?(\d+\s*V)?[\s\S]*?(\d{4})/i);
    if (fromDesc) {
      return [fromDesc[1].replace(/\s+/g, ''), fromDesc[3], fromDesc[2] ? fromDesc[2].replace(/\s+/g, '') : ''].filter(Boolean).join(' ');
    }
    const mpn = String(decoded.model || item.model || '');
    const pkgFromMpn = (mpn.match(/0[246]0[235]|1206|1210|1812/) || [])[0] || pkg;
    const eia = mpn.match(/(\d{3})[A-Z](\d{2,3})/);
    if (eia && pkgFromMpn) {
      const cap = eiaToCapacitance(eia[1]);
      const voltage = eiaToVoltage(eia[2]);
      if (cap) return [cap, pkgFromMpn, voltage].filter(Boolean).join(' ');
    }
    return '';
  }

  return { decode, parsePairs, formatPassiveName };
});
