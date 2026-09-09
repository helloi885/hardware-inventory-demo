(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BomManager = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FIELD_CANDIDATES = {
    quantity: ['quantity', 'qty', '数量', '用量'],
    comment: ['comment', 'description', 'desc', 'value', 'componentvalue', '物料名称', '名称', '参数', '参数值'],
    designator: ['designator', 'ref', 'reference', '位号', '器件位号'],
    footprint: ['footprint', 'package', 'footprintref', '封装'],
    manufacturerPart: ['manufacturer part', 'manufacturerpart', 'mpn', 'partnumber', 'mfr part', '型号规格', '型号', '制造商料号'],
    supplierPart: ['supplier part', 'supplierpart', 'lcsc part', 'lcscpart', '立创编号', '物料编号', 'c编号']
  };

  function text(value) {
    return value == null ? '' : String(value).trim();
  }

  function normalizeHeader(value) {
    return text(value).toLocaleLowerCase('zh-CN').replace(/[\s_\-\/]+/g, '');
  }

  function normalizePart(value) {
    return text(value).toLocaleLowerCase('zh-CN').replace(/[\s\u3000]+/g, '');
  }

  function splitList(value) {
    return text(value).split(/[,，;；\n\r]+/).map(item => item.trim()).filter(Boolean);
  }

  function splitDesignators(value) {
    return text(value).split(/[,，;；\s\n\r]+/).map(item => item.trim()).filter(Boolean);
  }

  function isDoNotPlace(comment, manufacturerPart) {
    const markers = /^(ns|nc|dnp|dni|na|nlp|dnc|nostuff|不贴|不焊接|不安装)$/i;
    const commentTokens = splitList(comment);
    if (commentTokens.length && commentTokens.every(token => markers.test(token.replace(/\s+/g, '')))) return true;
    return markers.test(text(comment).replace(/\s+/g, '')) && !text(manufacturerPart);
  }

  function normalizeFootprint(value) {
    const match = text(value).toUpperCase().match(/(?:^|[^0-9])(?:R|C)?(0201|0402|0603|0805|1206|1210|1812|2512)(?:[^0-9]|$)/);
    return match ? match[1] : '';
  }

  function compactNumber(value) {
    return Number(Number(value).toPrecision(12)).toString();
  }

  function formatEngineeringValue(value, type) {
    if (type === 'resistor') {
      if (value >= 1000000) return `${compactNumber(value / 1000000)}MΩ`;
      if (value >= 1000) return `${compactNumber(value / 1000)}kΩ`;
      if (value > 0 && value < 1) return `${compactNumber(value * 1000)}mΩ`;
      return `${compactNumber(value)}Ω`;
    }
    if (value >= 0.001) return `${compactNumber(value * 1000)}mF`;
    if (value >= 0.000001) return `${compactNumber(value * 1000000)}uF`;
    if (value >= 0.000000001) return `${compactNumber(value * 1000000000)}nF`;
    return `${compactNumber(value * 1000000000000)}pF`;
  }

  function resistorFromNumeric(numeric, raw) {
    if (!Number.isFinite(numeric) || numeric < 0) return null;
    return { type: 'resistor', numeric, key: `resistor:${compactNumber(numeric)}`, display: formatEngineeringValue(numeric, 'resistor'), raw: text(raw) };
  }

  function parsePassiveValue(value, type) {
    const source = text(value).replace(/[μµ]/g, 'u');
    if (type === 'resistor') {
      let match = source.match(/(\d+(?:\.\d+)?)\s*([kKmM]?)\s*(?:Ω|ohms?)/i);
      if (!match) match = source.match(/(?:^|[^A-Za-z0-9.])(\d+(?:\.\d+)?)\s*([kK])(?=\s|$|[±,，;；]|[±+\-]?\d+(?:\.\d+)?\s*%)/);
      if (match) {
        const prefix = match[2] || '';
        const factor = prefix === 'k' || prefix === 'K' ? 1000 : (prefix === 'M' ? 1000000 : (prefix === 'm' ? 0.001 : 1));
        return resistorFromNumeric(Number(match[1]) * factor, value);
      }
      match = source.match(/(?:^|[^A-Za-z0-9.])(\d+(?:\.\d+)?)\s*[rR](?=$|[^A-Za-z0-9])/);
      if (match) return resistorFromNumeric(Number(match[1]), value);
      match = source.match(/(?:^|[^A-Za-z0-9.])(\d+)[rR](\d+)(?=$|[^A-Za-z0-9])/);
      if (match) return resistorFromNumeric(Number(`${match[1]}.${match[2]}`), value);
      return null;
    }
    if (type === 'capacitor') {
      let match = source.match(/(\d+(?:\.\d+)?)\s*([pnum]?)\s*f\b/i);
      if (!match) match = source.match(/(\d+(?:\.\d+)?)\s*([pnum])(?!\s*h)\b/i);
      if (!match) return null;
      const prefix = (match[2] || '').toLowerCase();
      const factor = ({ p: 1e-12, n: 1e-9, u: 1e-6, m: 1e-3 })[prefix] || 1;
      const numeric = Number(match[1]) * factor;
      return { type, numeric, key: `capacitor:${compactNumber(numeric)}`, display: formatEngineeringValue(numeric, type), raw: text(value) };
    }
    return null;
  }

  function detectPassiveType(comment, designators, footprint) {
    const footprintText = text(footprint).toUpperCase();
    if (/^R(?:0201|0402|0603|0805|1206|1210|1812|2512)/.test(footprintText)) return 'resistor';
    if (/^C(?:0201|0402|0603|0805|1206|1210|1812|2512)/.test(footprintText)) return 'capacitor';
    if (designators.length && designators.every(item => /^R\d+/i.test(item))) return 'resistor';
    if (designators.length && designators.every(item => /^C\d+/i.test(item))) return 'capacitor';
    if (/[pnuμµ]f\b/i.test(text(comment))) return 'capacitor';
    if (/(?:Ω|ohms?)/i.test(text(comment))) return 'resistor';
    return '';
  }

  function uniquePassiveValues(values) {
    const seen = new Set();
    const result = [];
    (values || []).forEach(value => {
      if (!value || seen.has(value.key)) return;
      seen.add(value.key);
      result.push(value);
    });
    return result;
  }

  function extractPassiveValues(comment, type) {
    return uniquePassiveValues(splitList(comment).map(item => parsePassiveValue(item, type)).filter(Boolean));
  }

  function expandPassiveLine(line, boardCount) {
    const type = detectPassiveType(line.comment, line.designators, line.footprint);
    const footprint = normalizeFootprint(line.footprint);
    const tokens = splitList(line.comment);
    const classified = tokens.map(token => ({ token, passive: type ? parsePassiveValue(token, type) : null }));
    const values = uniquePassiveValues(classified.map(item => item.passive).filter(Boolean));
    const otherTokens = classified.filter(item => !item.passive).map(item => item.token);
    if (!type || !footprint || !values.length) return [line];
    const mixed = otherTokens.length > 0;
    if (values.length === 1 && !mixed) {
      return [{
        ...line,
        ambiguous: false,
        passive: { type, footprint, valueKey: values[0].key, value: values[0].numeric, display: values[0].display },
        displayName: `${footprint} ${values[0].display}`,
        matchReason: ''
      }];
    }
    const quantityKnown = !mixed && line.designators.length === values.length;
    const lines = values.map((passiveValue, index) => ({
      ...line,
      id: `${line.id}-passive-${index + 1}`,
      comment: passiveValue.display,
      displayName: `${footprint} ${passiveValue.display}`,
      manufacturerPart: '',
      manufacturerParts: [],
      supplierPart: '',
      supplierParts: [],
      originalComment: line.comment,
      originalManufacturerPart: line.manufacturerPart,
      originalDesignator: line.designator,
      designator: quantityKnown ? line.designators[index] : line.designator,
      designators: quantityKnown ? [line.designators[index]] : [],
      unitQuantity: 1,
      requiredQuantity: boardCount,
      ambiguous: false,
      quantityNeedsReview: !quantityKnown,
      passive: { type, footprint, valueKey: passiveValue.key, value: passiveValue.numeric, display: passiveValue.display },
      status: 'unmatched',
      selected: false,
      componentId: '',
      matchReason: quantityKnown ? '已按封装和标称值拆分' : `已从合并行拆出；原行 ${line.designators.length} 个位号，无法确定此值的实际数量`
    }));
    if (mixed) {
      const leftover = otherTokens.join(',');
      lines.push({
        ...line,
        id: `${line.id}-other`,
        comment: leftover,
        displayName: leftover,
        originalComment: line.comment,
        originalDesignator: line.designator,
        designators: [],
        unitQuantity: 1,
        requiredQuantity: boardCount,
        quantityNeedsReview: true,
        selected: false,
        componentId: '',
        status: line.ambiguous ? 'manual' : 'unmatched',
        matchReason: `已从合并行拆出非标称值物料；原行 ${line.designators.length} 个位号，无法确定数量`
      });
    }
    return lines;
  }

  function mapHeaders(headers) {
    const normalized = headers.map(normalizeHeader);
    const used = new Set();
    const result = {};
    Object.entries(FIELD_CANDIDATES).forEach(([field, candidates]) => {
      const aliases = candidates.map(normalizeHeader);
      let index = normalized.findIndex((header, candidateIndex) => !used.has(candidateIndex) && aliases.includes(header));
      if (index < 0) {
        index = normalized.findIndex((header, candidateIndex) => !used.has(candidateIndex)
          && aliases.some(alias => header && alias && (header.includes(alias) || alias.includes(header))));
      }
      if (index >= 0) {
        result[field] = index;
        used.add(index);
      }
    });
    return result;
  }

  function cell(row, map, field) {
    return map[field] == null ? '' : text(row[map[field]]);
  }

  function parseRows(rows, options = {}) {
    if (!Array.isArray(rows) || rows.length < 2) throw new Error('BOM 中没有可读取的数据');
    const headerRowIndex = Number.isInteger(options.headerRowIndex) ? options.headerRowIndex : 0;
    const map = mapHeaders(rows[headerRowIndex] || []);
    if (map.designator == null && map.manufacturerPart == null && map.comment == null) {
      throw new Error('没有识别到位号、型号或物料名称列');
    }
    const boardCount = Math.max(1, Math.floor(Number(options.boardCount) || 1));
    const lines = [];
    rows.slice(headerRowIndex + 1).forEach((row, offset) => {
      if (!Array.isArray(row)) return;
      const comment = cell(row, map, 'comment');
      const designator = cell(row, map, 'designator');
      const footprint = cell(row, map, 'footprint');
      const manufacturerPart = cell(row, map, 'manufacturerPart');
      const supplierPart = cell(row, map, 'supplierPart');
      const designators = splitDesignators(designator);
      const manufacturerParts = splitList(manufacturerPart);
      const supplierParts = splitList(supplierPart);
      if (!designators.length && !manufacturerParts.length && !supplierParts.length) return;
      const explicitQuantity = Number(cell(row, map, 'quantity'));
      const unitQuantity = Number.isFinite(explicitQuantity) && explicitQuantity > 0
        ? Math.ceil(explicitQuantity)
        : Math.max(1, designators.length);
      const ambiguous = manufacturerParts.length > 1 || supplierParts.length > 1;
      const baseLine = {
        id: `bom-line-${headerRowIndex + offset + 2}`,
        sourceRow: headerRowIndex + offset + 2,
        comment,
        designator,
        designators,
        footprint,
        manufacturerPart,
        manufacturerParts,
        supplierPart,
        supplierParts,
        unitQuantity,
        requiredQuantity: unitQuantity * boardCount,
        ambiguous,
        status: ambiguous ? 'manual' : 'unmatched',
        selected: false,
        componentId: '',
        matchReason: ambiguous ? '一行包含多个候选料号，需确认实际用量' : ''
      };
      if (isDoNotPlace(comment, manufacturerPart)) {
        lines.push({
          ...baseLine,
          displayName: comment || manufacturerPart || '不贴装',
          doNotPlace: true,
          status: 'skipped',
          selected: false,
          matchReason: '标记为不贴装 / NC / NS，不参与领料'
        });
        return;
      }
      lines.push(...expandPassiveLine(baseLine, boardCount));
    });
    if (!lines.length) throw new Error('BOM 中没有有效的元件行');
    return { headerMap: map, lines, boardCount };
  }

  function componentKeys(component) {
    return [component?.name, component?.code].map(normalizePart).filter(Boolean);
  }

  function componentPassiveSignature(component) {
    const source = [component?.category, component?.name, component?.specs].filter(Boolean).join(' ');
    let type = '';
    if (/(?:电容|capacitor|mlcc)/i.test(source)) type = 'capacitor';
    else if (/(?:电阻|resistor)/i.test(source)) type = 'resistor';
    else if (/[pnuμµ]f\b/i.test(source)) type = 'capacitor';
    else if (/(?:Ω|ohms?)/i.test(source)) type = 'resistor';
    if (!type) return null;
    const parsed = parsePassiveValue([component?.specs, component?.name].filter(Boolean).join(' '), type);
    const footprint = normalizeFootprint([component?.package, component?.name, component?.specs].filter(Boolean).join(' '));
    if (!parsed || !footprint) return null;
    return { type, footprint, valueKey: parsed.key, value: parsed.numeric };
  }

  function filterComponents(components, query) {
    const needle = normalizePart(query);
    if (!needle) return [...(components || [])];
    return (components || []).filter(component => [
      component?.name,
      component?.code,
      component?.category,
      component?.package,
      component?.specs,
      component?.brand,
      component?.location
    ].some(value => normalizePart(value).includes(needle)));
  }

  function lineKeys(line) {
    const preferred = [...(line.supplierParts || []), ...(line.manufacturerParts || [])];
    const fallback = preferred.length ? [] : [line.comment];
    return [...new Set([...preferred, ...fallback].map(normalizePart).filter(Boolean))];
  }

  function statusFor(component, quantity) {
    return Number(component?.quantity) >= Number(quantity) ? 'available' : 'shortage';
  }

  function matchLine(line, components) {
    if (line.doNotPlace || line.status === 'skipped') {
      return { ...line, doNotPlace: true, status: 'skipped', selected: false, componentId: '', matchReason: line.matchReason || '标记为不贴装 / NC / NS，不参与领料' };
    }
    if (line.passive) {
      const matches = (components || []).filter(component => {
        const signature = componentPassiveSignature(component);
        return signature
          && signature.type === line.passive.type
          && signature.footprint === line.passive.footprint
          && signature.valueKey === line.passive.valueKey;
      });
      if (matches.length !== 1) {
        return {
          ...line,
          status: matches.length > 1 ? 'manual' : 'missing',
          selected: false,
          componentId: '',
          matchReason: matches.length > 1
            ? `找到 ${matches.length} 个同为 ${line.displayName} 的库存候选，请确认具体器件`
            : `库存中没有匹配的 ${line.displayName}`
        };
      }
      const component = matches[0];
      if (line.quantityNeedsReview) {
        return {
          ...line,
          componentId: component.id,
          status: 'manual',
          selected: false,
          matchReason: `已按 ${line.displayName} 匹配到 ${component.name}；请确认领用数量`
        };
      }
      const status = statusFor(component, line.requiredQuantity);
      return {
        ...line,
        componentId: component.id,
        status,
        selected: status === 'available',
        matchReason: `按类型、封装和标称值匹配：${line.displayName}`
      };
    }
    if (line.ambiguous) return { ...line, status: 'manual', selected: false, componentId: '' };
    const keys = lineKeys(line);
    const matches = (components || []).filter(component => componentKeys(component).some(key => keys.includes(key)));
    if (matches.length !== 1) {
      return {
        ...line,
        status: matches.length > 1 ? 'manual' : 'missing',
        selected: false,
        componentId: '',
        matchReason: matches.length > 1 ? '库存中有多个完全一致的候选项' : '库存中没有完全一致的型号或物料编号'
      };
    }
    const component = matches[0];
    if (line.quantityNeedsReview) {
      return {
        ...line,
        componentId: component.id,
        status: 'manual',
        selected: false,
        matchReason: `已匹配到 ${component.name}；请确认领用数量`
      };
    }
    const status = statusFor(component, line.requiredQuantity);
    return {
      ...line,
      componentId: component.id,
      status,
      selected: status === 'available',
      matchReason: keys.includes(normalizePart(component.code)) ? '立创/物料编号完全一致' : '型号完全一致'
    };
  }

  function matchLines(lines, components) {
    return (lines || []).map(line => matchLine(line, components));
  }

  function assignLine(line, component, requiredQuantity) {
    if (line.doNotPlace) {
      return { ...line, componentId: '', status: 'skipped', selected: false, quantityNeedsReview: false, matchReason: '标记为不贴装 / NC / NS，不参与领料' };
    }
    const quantity = Math.max(1, Math.ceil(Number(requiredQuantity) || Number(line.requiredQuantity) || 1));
    if (!component) return { ...line, componentId: '', requiredQuantity: quantity, status: 'manual', selected: false };
    const status = statusFor(component, quantity);
    return {
      ...line,
      componentId: component.id,
      requiredQuantity: quantity,
      quantityNeedsReview: false,
      status,
      selected: status === 'available',
      matchReason: '人工指定库存元件与用量'
    };
  }

  function summarize(lines) {
    const summary = { total: 0, available: 0, shortage: 0, missing: 0, manual: 0, selected: 0, skipped: 0 };
    (lines || []).forEach(line => {
      summary.total += 1;
      if (summary[line.status] != null) summary[line.status] += 1;
      if (line.selected) summary.selected += 1;
    });
    return summary;
  }

  function buildDeductionPlan(lines, components) {
    const componentMap = new Map((components || []).map(component => [component.id, component]));
    const totals = new Map();
    (lines || []).filter(line => line.selected).forEach(line => {
      if (!line.componentId) throw new Error(`第 ${line.sourceRow} 行尚未指定库存元件`);
      const quantity = Math.max(1, Math.ceil(Number(line.requiredQuantity) || 0));
      totals.set(line.componentId, (totals.get(line.componentId) || 0) + quantity);
    });
    const plan = [...totals.entries()].map(([componentId, quantity]) => {
      const component = componentMap.get(componentId);
      if (!component) throw new Error('选中的库存元件已不存在，请重新匹配');
      return { componentId, quantity, component };
    });
    const insufficient = plan.filter(item => Number(item.component.quantity) < item.quantity);
    if (insufficient.length) {
      const detail = insufficient.map(item => `${item.component.name} 需要 ${item.quantity}，现有 ${item.component.quantity}`).join('；');
      throw new Error(`库存已变化，无法整批扣减：${detail}`);
    }
    return plan;
  }

  return { FIELD_CANDIDATES, normalizeHeader, normalizePart, normalizeFootprint, parsePassiveValue, detectPassiveType, extractPassiveValues, uniquePassiveValues, isDoNotPlace, componentPassiveSignature, splitList, splitDesignators, mapHeaders, parseRows, filterComponents, matchLine, matchLines, assignLine, summarize, buildDeductionPlan };
});
