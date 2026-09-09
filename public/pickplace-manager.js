(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PickPlaceManager = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function text(value) {
    return value == null ? '' : String(value).trim();
  }

  function decodeBytes(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes);
    if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return new TextDecoder('utf-8').decode(bytes);
    let zeros = 0;
    const sample = Math.min(bytes.length, 240);
    for (let index = 1; index < sample; index += 2) if (bytes[index] === 0) zeros += 1;
    if (zeros > sample / 6) return new TextDecoder('utf-16le').decode(bytes);
    return new TextDecoder('utf-8').decode(bytes);
  }

  function detectSeparator(line) {
    const tab = (String(line).match(/\t/g) || []).length;
    const comma = (String(line).match(/,/g) || []).length;
    const semi = (String(line).match(/;/g) || []).length;
    if (tab >= comma && tab >= semi && tab > 0) return '\t';
    if (semi > comma) return ';';
    return ',';
  }

  function splitLine(line, separator) {
    const result = [];
    let current = '';
    let quoted = false;
    const source = String(line || '');
    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (quoted) {
        if (character === '"' && source[index + 1] === '"') {
          current += '"';
          index += 1;
        } else if (character === '"') quoted = false;
        else current += character;
      } else if (character === '"') quoted = true;
      else if (character === separator) {
        result.push(current);
        current = '';
      } else current += character;
    }
    result.push(current);
    return result.map(item => text(item.replace(/^['"]|['"]$/g, '')));
  }

  function parseDelimitedRows(source) {
    const raw = typeof source === 'string' ? source : decodeBytes(source);
    const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
    if (!lines.length) return [];
    const separator = detectSeparator(lines[0]);
    return lines.map(line => splitLine(line, separator));
  }

  function normalizeHeader(value) {
    return text(value).toLocaleLowerCase('zh-CN').replace(/[\s_\-()（）\[\]\.]+/g, '');
  }

  function parseLength(value) {
    const source = text(value).replace(/["']/g, '');
    const match = source.match(/([+-]?\d+(?:\.\d+)?)(?:\s*(mm|mil|inch|in))?/i);
    if (!match) return 0;
    const numeric = Number(match[1]);
    const unit = (match[2] || 'mm').toLowerCase();
    if (unit === 'mil') return numeric * 0.0254;
    if (unit === 'in' || unit === 'inch') return numeric * 25.4;
    return numeric;
  }

  function normalizeLayer(value) {
    const source = text(value).toUpperCase();
    if (!source) return '';
    if (/TOP|FRONT|TOPLAYER|^T$|^TOP\b|^上|^顶/.test(source) || source.startsWith('T')) return 'T';
    if (/BOTTOM|BACK|BOTLAYER|^B$|^BOT\b|^下|^底/.test(source) || source.startsWith('B')) return 'B';
    return '';
  }

  function findColumn(headers, candidates) {
    const normalized = headers.map(normalizeHeader);
    for (const candidate of candidates) {
      const needle = normalizeHeader(candidate);
      const exact = normalized.indexOf(needle);
      if (exact >= 0) return exact;
    }
    for (const candidate of candidates) {
      const needle = normalizeHeader(candidate);
      const index = normalized.findIndex(header => header && needle && (header === needle || header.includes(needle) || needle.includes(header)));
      if (index >= 0) return index;
    }
    return -1;
  }

  function findHeaderRow(rows) {
    let best = { index: 0, score: -1 };
    (rows || []).slice(0, 12).forEach((row, index) => {
      const headers = (row || []).map(item => text(item));
      const score = [
        findColumn(headers, ['designator', 'ref', '位号']) >= 0 ? 3 : 0,
        findColumn(headers, ['mid x', 'midx', 'centerx', 'posx', 'x']) >= 0 ? 3 : 0,
        findColumn(headers, ['mid y', 'midy', 'centery', 'posy', 'y']) >= 0 ? 3 : 0,
        findColumn(headers, ['layer', 'side', '层']) >= 0 ? 1 : 0
      ].reduce((sum, value) => sum + value, 0);
      if (score > best.score) best = { index, score };
    });
    return best;
  }

  function parseRows(rows, options = {}) {
    if (!Array.isArray(rows) || rows.length < 2) throw new Error('坐标文件中没有可读取的数据');
    const detected = findHeaderRow(rows);
    if (detected.score < 6) throw new Error('没有识别到位号和 X/Y 坐标列');
    const headerRowIndex = Number.isInteger(options.headerRowIndex) ? options.headerRowIndex : detected.index;
    const headers = rows[headerRowIndex] || [];
    const map = {
      designator: findColumn(headers, ['designator', 'refdes', 'ref', 'reference', '位号', '器件位号']),
      device: findColumn(headers, ['device', 'part', 'partnumber', 'mpn', 'manufacturerpart', '型号']),
      x: findColumn(headers, ['midx', 'mid x', 'centerx', 'center-x(mm)', 'posx', 'x(mm)', 'x']),
      y: findColumn(headers, ['midy', 'mid y', 'centery', 'center-y(mm)', 'posy', 'y(mm)', 'y']),
      layer: findColumn(headers, ['layer', 'side', 'tb', '顶底层', '层']),
      comment: findColumn(headers, ['comment', 'description', 'desc', 'value', '注释']),
      name: findColumn(headers, ['name', 'value']),
      footprint: findColumn(headers, ['footprint', 'package', '封装']),
      rotation: findColumn(headers, ['rotation', 'rot', 'angle', '旋转'])
    };
    if (map.x < 0 || map.y < 0) throw new Error('坐标文件缺少 Mid X / Mid Y 列');
    const records = [];
    const layerCounts = { T: 0, B: 0, '': 0 };
    rows.slice(headerRowIndex + 1).forEach((row, offset) => {
      if (!Array.isArray(row)) return;
      const cell = index => (index < 0 ? '' : text(row[index]));
      const designator = cell(map.designator);
      const xMm = parseLength(cell(map.x));
      const yMm = parseLength(cell(map.y));
      if (!designator && !xMm && !yMm) return;
      const layer = normalizeLayer(cell(map.layer));
      const record = {
        id: `pnp-${headerRowIndex + offset + 2}`,
        designator,
        device: cell(map.device),
        xMm,
        yMm,
        layer,
        comment: cell(map.comment),
        name: cell(map.name),
        footprint: cell(map.footprint),
        rotation: Number(cell(map.rotation)) || 0
      };
      records.push(record);
      layerCounts[layer] = (layerCounts[layer] || 0) + 1;
    });
    if (!records.length) throw new Error('坐标文件中没有有效的器件记录');
    return { headerMap: map, records, layerCounts };
  }

  function parseText(source) {
    return parseRows(parseDelimitedRows(source));
  }

  function searchByDesignators(records, designators) {
    const keys = new Set((designators || []).map(item => text(item).toLocaleLowerCase('zh-CN')).filter(Boolean));
    if (!keys.size) return [];
    return (records || []).filter(record => keys.has(text(record.designator).toLocaleLowerCase('zh-CN')));
  }

  function searchByKeyword(records, keyword) {
    const needle = text(keyword).toLocaleLowerCase('zh-CN');
    if (!needle) return [];
    return (records || []).filter(record => [record.designator, record.device, record.comment, record.name, record.footprint]
      .some(value => text(value).toLocaleLowerCase('zh-CN').includes(needle)));
  }

  function fieldIndex(fields, names) {
    const normalized = (fields || []).map(normalizeHeader);
    for (const name of names) {
      const needle = normalizeHeader(name);
      const exact = normalized.indexOf(needle);
      if (exact >= 0) return exact;
    }
    for (const name of names) {
      const needle = normalizeHeader(name);
      const index = normalized.findIndex(header => header && needle && (header === needle || header.includes(needle)));
      if (index >= 0) return index;
    }
    return -1;
  }

  function unitToMm(value, unit) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    const kind = String(unit || 'mm').toLowerCase();
    if (kind === 'mil') return numeric * 0.0254;
    if (kind === 'in' || kind === 'inch') return numeric * 25.4;
    return numeric;
  }

  function parseFlyingProbe(source) {
    const raw = typeof source === 'string' ? source : decodeBytes(source);
    const data = typeof raw === 'object' && raw && raw.components ? raw : JSON.parse(raw);
    if (!data || (!data.components && !data.pins)) throw new Error('不是有效的飞针/器件坐标 JSON');
    const unit = data.lengthUnit || data.unit || 'mm';
    const records = new Map();
    const layerCounts = { T: 0, B: 0, '': 0 };
    const ensure = (designator) => {
      const key = text(designator);
      if (!key) return null;
      if (!records.has(key)) {
        records.set(key, {
          designator: key,
          device: '',
          xMm: 0,
          yMm: 0,
          layer: '',
          comment: '',
          name: key,
          footprint: '',
          rotation: 0,
          pads: []
        });
      }
      return records.get(key);
    };

    const components = data.components || {};
    const compFields = components.fields || [];
    const cName = fieldIndex(compFields, ['COMPONENT_NAME', 'designator', 'name']);
    const cLayer = fieldIndex(compFields, ['LAYER', 'side']);
    const cX = fieldIndex(compFields, ['X_COORDINATE', 'x', 'midx']);
    const cY = fieldIndex(compFields, ['Y_COORDINATE', 'y', 'midy']);
    const cAngle = fieldIndex(compFields, ['ANGLE', 'rotation']);
    (components.rows || []).forEach(row => {
      const record = ensure(row[cName]);
      if (!record) return;
      record.layer = normalizeLayer(row[cLayer]);
      record.xMm = unitToMm(row[cX], unit);
      record.yMm = unitToMm(row[cY], unit);
      record.rotation = Number(row[cAngle]) || 0;
    });

    const pins = data.pins || {};
    const pinFields = pins.fields || [];
    const pName = fieldIndex(pinFields, ['PIN_NAME', 'name']);
    const pX = fieldIndex(pinFields, ['PIN_X', 'x']);
    const pY = fieldIndex(pinFields, ['PIN_Y', 'y']);
    const pLayer = fieldIndex(pinFields, ['LAYER', 'side']);
    const pShape = fieldIndex(pinFields, ['PAD_SHAPE', 'shape']);
    const pW = fieldIndex(pinFields, ['PAD_SIZEX', 'width', 'sizex']);
    const pH = fieldIndex(pinFields, ['PAD_SIZEY', 'height', 'sizey']);
    const pAngle = fieldIndex(pinFields, ['PAD_ANGLE', 'angle']);
    const known = new Set([...records.keys()].sort((a, b) => b.length - a.length));
    (pins.rows || []).forEach(row => {
      const pinName = text(row[pName]);
      let designator = pinName.replace(/_\d+$/, '');
      if (known.size) {
        const match = [...known].find(name => pinName === name || pinName.startsWith(`${name}_`));
        if (match) designator = match;
      }
      const record = ensure(designator);
      if (!record) return;
      const pad = {
        xMm: unitToMm(row[pX], unit),
        yMm: unitToMm(row[pY], unit),
        layer: normalizeLayer(row[pLayer]) || record.layer,
        shape: text(row[pShape]).toUpperCase() || 'R',
        widthMm: Math.abs(unitToMm(row[pW], unit)) || 0.4,
        heightMm: Math.abs(unitToMm(row[pH], unit)) || 0.4,
        angle: Number(row[pAngle]) || 0
      };
      record.pads.push(pad);
      if (!record.layer) record.layer = pad.layer;
      if (!record.xMm && !record.yMm) {
        record.xMm = pad.xMm;
        record.yMm = pad.yMm;
      }
    });

    const list = [...records.values()];
    if (!list.length) throw new Error('飞针 JSON 中没有器件或焊盘');
    list.forEach(record => {
      layerCounts[record.layer] = (layerCounts[record.layer] || 0) + 1;
    });
    return { records: list, layerCounts, source: 'flying-probe' };
  }

  function parseCoordinates(source, filename = '') {
    const raw = typeof source === 'string' ? source : decodeBytes(source);
    const trimmed = String(raw).trim();
    if (/\.json$/i.test(filename) || trimmed.startsWith('{')) return parseFlyingProbe(trimmed);
    return parseText(raw);
  }

  return { decodeBytes, parseDelimitedRows, parseLength, normalizeLayer, parseRows, parseText, parseFlyingProbe, parseCoordinates, searchByDesignators, searchByKeyword };
});
