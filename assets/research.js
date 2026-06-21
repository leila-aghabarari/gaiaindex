/* ==========================================================================
   GAIA Research — shared helpers for paper pages
   - CSV loading via PapaParse (no hardcoded data)
   - Dark-theme Chart.js defaults
   - PNG export, clipboard (cite / share), linear regression, stats utils
   ========================================================================== */

const GAIA = (() => {
  const TEAL = '#0D9E76';
  const TEAL_BR = '#18c994';
  const GRID = 'rgba(255,255,255,0.07)';
  const TICK = '#9bb1c6';

  // Stable color palette for the 22 major occupation groups / income groups.
  const PALETTE = ['#18c994','#4f9dff','#e0a83b','#e0607a','#9b7be0','#39c2c9',
    '#7ec24a','#ff8a5b','#5bd1b0','#c98ad6','#d6c44a','#6aa9ff','#e06b6b',
    '#4ad6a3','#b0a0ff','#ffb049','#5fb0e0','#d65b8a','#74d04a','#9d8cff',
    '#ef9a6b','#56c0e0'];

  const _colorCache = {};
  function colorFor(key, allKeys) {
    if (_colorCache[key] != null) return _colorCache[key];
    if (allKeys) {
      const i = allKeys.indexOf(key);
      _colorCache[key] = PALETTE[(i < 0 ? Object.keys(_colorCache).length : i) % PALETTE.length];
    } else {
      _colorCache[key] = PALETTE[Object.keys(_colorCache).length % PALETTE.length];
    }
    return _colorCache[key];
  }

  /* ---- Chart.js dark defaults ---- */
  function applyChartDefaults() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.color = TICK;
    Chart.defaults.borderColor = GRID;
    Chart.defaults.font.family = 'Inter, sans-serif';
    Chart.defaults.font.size = 11;
    Chart.defaults.plugins.tooltip.backgroundColor = '#0f2238';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(13,158,118,0.5)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.titleColor = '#fff';
    Chart.defaults.plugins.tooltip.bodyColor = '#cfe0ee';
    Chart.defaults.plugins.tooltip.padding = 10;
  }

  /* ---- CSV loading (skips '#' comment header blocks) ---- */
  function loadCSV(path) {
    return new Promise((resolve, reject) => {
      Papa.parse(path, {
        download: true, header: true, dynamicTyping: true,
        skipEmptyLines: true, comments: '#',
        complete: r => resolve(r.data.filter(row => Object.keys(row).length > 1)),
        error: reject
      });
    });
  }

  const num = v => (v === '' || v == null || isNaN(parseFloat(v))) ? null : parseFloat(v);
  const mean = arr => { const a = arr.filter(x => x != null && !isNaN(x)); return a.length ? a.reduce((s,x)=>s+x,0)/a.length : null; };

  /* ---- Ordinary least squares: y = a + b x ---- */
  function regression(pts) {
    const p = pts.filter(d => d.x != null && d.y != null && !isNaN(d.x) && !isNaN(d.y));
    const n = p.length; if (n < 2) return null;
    const sx = p.reduce((s,d)=>s+d.x,0), sy = p.reduce((s,d)=>s+d.y,0);
    const mx = sx/n, my = sy/n;
    let num = 0, den = 0, sst = 0;
    p.forEach(d => { num += (d.x-mx)*(d.y-my); den += (d.x-mx)**2; });
    const b = num/den, a = my - b*mx;
    p.forEach(d => { const yh = a + b*d.x; sst += (d.y-my)**2; });
    let ssr = 0; p.forEach(d => { const yh = a + b*d.x; ssr += (d.y-yh)**2; });
    const r2 = sst ? 1 - ssr/sst : 0;
    return { a, b, r2, n, xmin: Math.min(...p.map(d=>d.x)), xmax: Math.max(...p.map(d=>d.x)) };
  }

  /* ---- PNG export of a chart canvas (composited on the page bg) ---- */
  function downloadPNG(canvasId, filename) {
    const src = document.getElementById(canvasId);
    if (!src) return;
    const out = document.createElement('canvas');
    out.width = src.width; out.height = src.height;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#0A1628'; ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(src, 0, 0);
    const a = document.createElement('a');
    a.href = out.toDataURL('image/png'); a.download = filename || (canvasId + '.png');
    a.click();
  }

  /* ---- Toast + clipboard ---- */
  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove('show'), 1800);
  }
  function copy(text, okMsg) {
    navigator.clipboard.writeText(text).then(() => toast(okMsg || 'Copied to clipboard'))
      .catch(() => toast('Copy failed'));
  }
  function copyCite(bibtex) { copy(bibtex, 'BibTeX citation copied'); }
  function sharePage() { copy(window.location.href, 'Page link copied'); }

  /* ---- Histogram binning helper ---- */
  function histogram(values, nbins, min, max) {
    const v = values.filter(x => x != null && !isNaN(x));
    if (min == null) min = Math.min(...v);
    if (max == null) max = Math.max(...v);
    const w = (max - min) / nbins || 1;
    const counts = Array(nbins).fill(0);
    v.forEach(x => { let i = Math.floor((x - min) / w); if (i >= nbins) i = nbins-1; if (i < 0) i = 0; counts[i]++; });
    const labels = counts.map((_, i) => (min + i*w));
    return { counts, labels, w, min, max };
  }

  /* ---- mobile nav toggle ---- */
  function initNav() {
    const btn = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (btn && links) btn.addEventListener('click', () => links.classList.toggle('open'));
  }
  document.addEventListener('DOMContentLoaded', initNav);

  return { TEAL, TEAL_BR, GRID, TICK, PALETTE, colorFor, applyChartDefaults, loadCSV,
           num, mean, regression, downloadPNG, toast, copy, copyCite, sharePage, histogram };
})();
