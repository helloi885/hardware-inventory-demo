(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GerberSession = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const GERBER_EXT = /\.(gtl|gbl|gto|gbo|gts|gbs|gko|gtp|gbp|gbr|gm\d+|g\d+|drl)$/i;

  function basename(path) {
    return String(path || '').split(/[/\\]/).pop() || '';
  }

  function classifyEntry(path) {
    const name = basename(path);
    const lower = name.toLowerCase();
    if (!name || name.startsWith('.') || /\/__macosx\//i.test(path)) return 'other';
    if (/\.(csv|tsv|xlsx|xls)$/i.test(lower) && /(bom|物料)/i.test(lower)) return 'bom';
    if (/\.json$/i.test(lower) && /(flying|probe|component|pnp|pick)/i.test(lower)) return 'probe';
    if (lower === 'flyingprobetesting.json') return 'probe';
    if (/\.(csv|tsv|txt|xlsx|xls)$/i.test(lower) && /(pick|place|pnp|cpl|pos|坐标|centroid)/i.test(lower)) return 'pnp';
    if (GERBER_EXT.test(lower) || /^gerber_/i.test(name) || /boardoutline/i.test(lower) || /drill/i.test(lower)) return 'gerber';
    return 'other';
  }

  function parseViewBox(svg) {
    const match = String(svg || '').match(/viewBox="([^"]+)"/i);
    if (!match) return [0, 0, 1000, 1000];
    const parts = match[1].trim().split(/[\s,]+/).map(Number);
    return parts.length === 4 && parts.every(Number.isFinite) ? parts : [0, 0, 1000, 1000];
  }

  function injectSvgSize(svg) {
    return String(svg || '')
      .replace(/\swidth="[^"]*"/i, '')
      .replace(/\sheight="[^"]*"/i, '')
      .replace('<svg', '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"');
  }

  function mmToUserUnits(xMm, yMm, units) {
    const scale = units === 'in' ? 1000 / 25.4 : 1000;
    return { x: Number(xMm) * scale, y: Number(yMm) * scale };
  }

  function overlayTransforms(svg) {
    const source = String(svg || '');
    return {
      yFlip: (source.match(/transform="(translate\([^"]*\)\s+scale\(1,-1\))"/) || [])[1] || '',
      xMirror: (source.match(/transform="(translate\([^"]*\)\s+scale\(-1,1\))"/) || [])[1] || ''
    };
  }

  function wrapOverlayMarkup(inner, stackupSide, pane) {
    const transforms = overlayTransforms(stackupSide?.svg || '');
    let markup = inner;
    if ((pane === 'bottom' || pane === 'B') && transforms.xMirror) {
      markup = `<g transform="${transforms.xMirror}">${markup}</g>`;
    }
    if (transforms.yFlip) markup = `<g transform="${transforms.yFlip}">${markup}</g>`;
    return markup;
  }

  function mapRecordToSvg(record, pane, stackupSide) {
    return mmToUserUnits(record.xMm, record.yMm, stackupSide?.units || 'mm');
  }

  function padMarkup(pad, pane, stackupSide) {
    const point = mapRecordToSvg(pad, pane, stackupSide);
    const size = mmToUserUnits(pad.widthMm || 0.5, pad.heightMm || 0.5, stackupSide?.units || 'mm');
    const width = Math.max(Math.abs(size.x), 250);
    const height = Math.max(Math.abs(size.y), 250);
    const angle = Number(pad.angle) || 0;
    const glowW = width * 1.35;
    const glowH = height * 1.35;
    if (String(pad.shape || '').toUpperCase() === 'C') {
      const radius = Math.max(width, height) / 2;
      return `<g transform="translate(${point.x} ${point.y})">
        <circle class="gerber-pad-glow" r="${radius * 1.35}"></circle>
        <circle class="gerber-pad" r="${radius}"></circle>
      </g>`;
    }
    const radius = Math.min(width, height) * 0.18;
    return `<g transform="translate(${point.x} ${point.y}) rotate(${angle})">
      <rect class="gerber-pad-glow" x="${-glowW / 2}" y="${-glowH / 2}" width="${glowW}" height="${glowH}" rx="${radius}"></rect>
      <rect class="gerber-pad" x="${-width / 2}" y="${-height / 2}" width="${width}" height="${height}" rx="${radius}"></rect>
    </g>`;
  }

  async function readZipEntries(buffer, JSZipImpl) {
    const zip = await JSZipImpl.loadAsync(buffer);
    const entries = [];
    const names = Object.keys(zip.files);
    for (const name of names) {
      const file = zip.files[name];
      if (!file || file.dir) continue;
      const kind = classifyEntry(name);
      if (kind === 'other') continue;
      const content = (kind === 'gerber' || kind === 'probe')
        ? await file.async('string')
        : await file.async('uint8array');
      entries.push({ name, kind, content });
    }
    return entries;
  }

  async function renderStackup(gerberEntries, pcbStackupImpl) {
    if (!gerberEntries.length) throw new Error('压缩包里没有识别到 Gerber 层文件');
    const layers = gerberEntries.map(entry => ({ gerber: entry.content, filename: basename(entry.name) }));
    const stackup = await pcbStackupImpl(layers, {
      id: 'solder-board',
      color: {
        fr4: '#16382c',
        cu: '#d2b15a',
        cf: '#e8c547',
        sm: 'rgba(16, 92, 58, 0.84)',
        ss: '#f3f6f2',
        sp: '#b7bdb8',
        out: '#0c1c16'
      }
    });
    return {
      topSvg: injectSvgSize(stackup.top.svg),
      bottomSvg: injectSvgSize(stackup.bottom.svg),
      top: stackup.top,
      bottom: stackup.bottom,
      layerCount: gerberEntries.length
    };
  }

  async function openArchive(buffer, options = {}) {
    const JSZipImpl = options.JSZip || (typeof JSZip !== 'undefined' ? JSZip : null);
    const pcbStackupImpl = options.pcbStackup || (typeof pcbStackup !== 'undefined' ? pcbStackup : null);
    if (!JSZipImpl) throw new Error('ZIP 解析组件未加载');
    if (!pcbStackupImpl) throw new Error('Gerber 渲染组件未加载');
    const entries = await readZipEntries(buffer, JSZipImpl);
    const gerbers = entries.filter(entry => entry.kind === 'gerber');
    const rendered = await renderStackup(gerbers, pcbStackupImpl);
    return {
      ...rendered,
      bomEntry: entries.find(entry => entry.kind === 'bom') || null,
      pnpEntry: entries.find(entry => entry.kind === 'pnp') || null,
      probeEntry: entries.find(entry => entry.kind === 'probe') || null,
      files: entries.map(entry => ({ name: entry.name, kind: entry.kind }))
    };
  }

  return { classifyEntry, parseViewBox, overlayTransforms, wrapOverlayMarkup, mmToUserUnits, mapRecordToSvg, padMarkup, openArchive, injectSvgSize };
});
