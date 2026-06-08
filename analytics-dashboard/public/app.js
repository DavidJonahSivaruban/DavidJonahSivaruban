'use strict';

// ── Theme ─────────────────────────────────────────────────────────────────────
const html        = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const iconMoon    = document.getElementById('iconMoon');
const iconSun     = document.getElementById('iconSun');

function isDark() { return html.getAttribute('data-theme') === 'dark'; }

function setTheme(dark) {
  html.setAttribute('data-theme', dark ? 'dark' : 'light');
  iconMoon.style.display = dark ? '' : 'none';
  iconSun.style.display  = dark ? 'none' : '';
  updateChartTheme();
}

themeToggle.addEventListener('click', () => setTheme(!isDark()));

// ── Chart.js defaults ─────────────────────────────────────────────────────────
const PALETTE = {
  blue:   '#4f86f7',
  purple: '#9b74f5',
  green:  '#34d399',
  red:    '#f87171',
  orange: '#fb923c',
  teal:   '#2dd4bf',
  yellow: '#fbbf24',
};

function chartDefaults() {
  const dark = isDark();
  return {
    grid:   dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)',
    tick:   dark ? '#8892a4' : '#6b7280',
    legend: dark ? '#e2e8f0' : '#1a1d27',
  };
}

function makeGradient(ctx, color) {
  const g = ctx.createLinearGradient(0, 0, 0, 200);
  g.addColorStop(0, color + '55');
  g.addColorStop(1, color + '00');
  return g;
}

function lineDataset(label, color, data) {
  return {
    label,
    data,
    borderColor:     color,
    borderWidth:     2,
    pointRadius:     0,
    pointHoverRadius:4,
    tension:         0.4,
    fill:            true,
    backgroundColor: ctx => makeGradient(ctx.chart.ctx, color),
  };
}

function baseOptions(yLabel = '', max = undefined) {
  const d = chartDefaults();
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: isDark() ? '#21253a' : '#fff',
        borderColor: isDark() ? '#2a2d3e' : '#e2e6f0',
        borderWidth: 1,
        titleColor: d.legend,
        bodyColor:  d.tick,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: d.grid },
        ticks: { color: d.tick, maxTicksLimit: 6, maxRotation: 0 },
      },
      y: {
        grid: { color: d.grid },
        ticks: { color: d.tick },
        title: { display: !!yLabel, text: yLabel, color: d.tick, font: { size: 11 } },
        max,
        beginAtZero: false,
      },
    },
    interaction: { mode: 'index', intersect: false },
  };
}

// ── Shared history labels ─────────────────────────────────────────────────────
let labels = [];
const MAX_POINTS = 40;

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Create charts ─────────────────────────────────────────────────────────────
const chartUsers = new Chart(document.getElementById('chartUsers'), {
  type: 'line',
  data: { labels, datasets: [lineDataset('Active Users', PALETTE.blue, [])] },
  options: baseOptions('users'),
});

const chartLoad = new Chart(document.getElementById('chartLoad'), {
  type: 'line',
  data: { labels, datasets: [lineDataset('Server Load %', PALETTE.orange, [])] },
  options: baseOptions('%', 100),
});

const chartRevenue = new Chart(document.getElementById('chartRevenue'), {
  type: 'bar',
  data: {
    labels,
    datasets: [{
      label: 'Revenue',
      data: [],
      backgroundColor: PALETTE.green + '99',
      borderColor: PALETTE.green,
      borderWidth: 1.5,
      borderRadius: 4,
    }],
  },
  options: { ...baseOptions('USD'), animation: { duration: 300 } },
});

const chartResponse = new Chart(document.getElementById('chartResponse'), {
  type: 'line',
  data: { labels, datasets: [lineDataset('Response ms', PALETTE.teal, [])] },
  options: baseOptions('ms'),
});

const chartError = new Chart(document.getElementById('chartError'), {
  type: 'line',
  data: { labels, datasets: [lineDataset('Error %', PALETTE.red, [])] },
  options: baseOptions('%', 20),
});

const chartDoughnut = new Chart(document.getElementById('chartDoughnut'), {
  type: 'doughnut',
  data: {
    labels: ['Direct', 'Search', 'Social', 'Referral', 'Email'],
    datasets: [{
      data: [32, 28, 18, 14, 8],
      backgroundColor: [PALETTE.blue, PALETTE.purple, PALETTE.teal, PALETTE.green, PALETTE.orange],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: { color: chartDefaults().tick, font: { size: 11 }, boxWidth: 10, padding: 14 },
      },
      tooltip: {
        backgroundColor: isDark() ? '#21253a' : '#fff',
        borderColor: isDark() ? '#2a2d3e' : '#e2e6f0',
        borderWidth: 1,
        titleColor: chartDefaults().legend,
        bodyColor: chartDefaults().tick,
      },
    },
  },
});

const allCharts = [chartUsers, chartLoad, chartRevenue, chartResponse, chartError, chartDoughnut];

function updateChartTheme() {
  const d = chartDefaults();
  allCharts.forEach(c => {
    if (c.config.type === 'doughnut') {
      c.options.plugins.legend.labels.color = d.tick;
      c.options.plugins.tooltip.backgroundColor = isDark() ? '#21253a' : '#fff';
      c.options.plugins.tooltip.borderColor = isDark() ? '#2a2d3e' : '#e2e6f0';
      c.options.plugins.tooltip.titleColor = d.legend;
      c.options.plugins.tooltip.bodyColor = d.tick;
    } else {
      c.options.scales.x.grid.color = d.grid;
      c.options.scales.x.ticks.color = d.tick;
      c.options.scales.y.grid.color = d.grid;
      c.options.scales.y.ticks.color = d.tick;
      c.options.plugins.tooltip.backgroundColor = isDark() ? '#21253a' : '#fff';
      c.options.plugins.tooltip.borderColor = isDark() ? '#2a2d3e' : '#e2e6f0';
      c.options.plugins.tooltip.titleColor = d.legend;
      c.options.plugins.tooltip.bodyColor = d.tick;
    }
    c.update('none');
  });
}

function pushPoint(chart, label, value, max = MAX_POINTS) {
  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(value);
  if (chart.data.labels.length > max) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
}

// ── KPI cards ─────────────────────────────────────────────────────────────────
const prev = {};

function fmt(key, val) {
  if (key === 'revenue')      return '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (key === 'errorRate')    return val.toFixed(2) + '%';
  if (key === 'serverLoad')   return val.toFixed(1) + '%';
  if (key === 'responseTime') return val + ' ms';
  return val.toLocaleString();
}

function updateKPI(id, key, val, invertDelta = false) {
  const el = document.getElementById(id);
  const deltaEl = document.getElementById('delta' + key.charAt(0).toUpperCase() + key.slice(1));
  if (el) el.textContent = fmt(key, val);
  if (deltaEl && prev[key] !== undefined) {
    const diff = val - prev[key];
    const pct  = prev[key] !== 0 ? ((diff / prev[key]) * 100).toFixed(1) : '0';
    const up   = diff > 0;
    const good = invertDelta ? !up : up;
    deltaEl.textContent  = (up ? '▲' : '▼') + ' ' + Math.abs(pct) + '%';
    deltaEl.className    = 'kpi-delta ' + (good ? 'up' : 'down');
  }
  prev[key] = val;
}

// ── Event list ────────────────────────────────────────────────────────────────
const eventList  = document.getElementById('eventList');
const eventCount = document.getElementById('eventCount');
let totalEvents  = 0;

function renderEvents(events) {
  if (!events || !events.length) return;
  totalEvents += events.length;
  eventCount.textContent = totalEvents;

  const empties = eventList.querySelectorAll('.event-empty');
  empties.forEach(e => e.remove());

  events.forEach(ev => {
    const li = document.createElement('li');
    li.className = 'event-item';
    li.innerHTML = `
      <span class="event-badge event-badge--${ev.type}">${ev.type}</span>
      <div>
        <div class="event-msg">${ev.message}</div>
        <div class="event-time">${fmtTime(ev.timestamp)}</div>
      </div>`;
    eventList.prepend(li);
  });

  // keep max 20 visible
  while (eventList.children.length > 20) eventList.lastChild.remove();
}

// ── Load initial history ──────────────────────────────────────────────────────
async function loadHistory() {
  try {
    const r = await fetch('/api/history');
    const { data } = await r.json();
    const ts = data.timestamps.map(fmtTime);

    const seed = (chart, arr) => {
      chart.data.labels = ts.slice(-MAX_POINTS);
      chart.data.datasets[0].data = arr.slice(-MAX_POINTS);
      chart.update('none');
    };

    seed(chartUsers,    data.activeUsers);
    seed(chartLoad,     data.serverLoad);
    seed(chartRevenue,  data.revenue);
    seed(chartResponse, data.responseTime);
    seed(chartError,    data.errorRate);
  } catch {}
}

// ── SSE stream ────────────────────────────────────────────────────────────────
const statusBadge  = document.getElementById('statusBadge');
const lastUpdated  = document.getElementById('lastUpdated');
let seenEventIds   = new Set();
let lastEventTimes = [];

function connectStream() {
  const es = new EventSource('/api/stream');

  es.onopen = () => {
    statusBadge.className = 'badge live';
    statusBadge.textContent = '● LIVE';
  };

  es.onmessage = e => {
    const { metrics, latest, events } = JSON.parse(e.data);

    // KPIs
    updateKPI('kpiActiveUsers',  'activeUsers',  metrics.activeUsers);
    updateKPI('kpiPageViews',    'pageViews',    metrics.pageViews);
    updateKPI('kpiRevenue',      'revenue',      metrics.revenue);
    updateKPI('kpiErrorRate',    'errorRate',    metrics.errorRate,    true);
    updateKPI('kpiServerLoad',   'serverLoad',   metrics.serverLoad,   true);
    updateKPI('kpiResponseTime', 'responseTime', metrics.responseTime, true);

    // Charts
    const label = fmtTime(latest.timestamp);
    pushPoint(chartUsers,    label, latest.activeUsers);
    pushPoint(chartLoad,     label, latest.serverLoad);
    pushPoint(chartRevenue,  label, latest.revenue);
    pushPoint(chartResponse, label, latest.responseTime);
    pushPoint(chartError,    label, latest.errorRate);

    chartUsers.update();
    chartLoad.update();
    chartRevenue.update();
    chartResponse.update();
    chartError.update();

    // Events (deduplicate)
    const fresh = (events || []).filter(ev => !seenEventIds.has(ev.id));
    fresh.forEach(ev => seenEventIds.add(ev.id));
    if (fresh.length) renderEvents(fresh);

    lastUpdated.textContent = 'Updated ' + fmtTime(latest.timestamp);
  };

  es.onerror = () => {
    statusBadge.className = 'badge offline';
    statusBadge.textContent = '● OFFLINE';
    es.close();
    setTimeout(connectStream, 4000);
  };
}

// ── API Explorer ──────────────────────────────────────────────────────────────
const apiResponse      = document.getElementById('apiResponse');
const apiResponseLabel = document.getElementById('apiResponseLabel');
const copyBtn          = document.getElementById('copyBtn');

document.querySelectorAll('.api-endpoint').forEach(el => {
  el.addEventListener('click', async () => {
    document.querySelectorAll('.api-endpoint').forEach(e => e.classList.remove('active'));
    el.classList.add('active');

    const url = el.dataset.url;
    apiResponseLabel.textContent = 'GET ' + url;
    apiResponse.textContent = 'Fetching…';
    copyBtn.style.display = 'none';

    try {
      const r    = await fetch(url);
      const json = await r.json();
      apiResponse.textContent = JSON.stringify(json, null, 2);
      copyBtn.style.display = '';
    } catch (err) {
      apiResponse.textContent = 'Error: ' + err.message;
    }
  });
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(apiResponse.textContent).then(() => {
    copyBtn.textContent = 'Copied!';
    setTimeout(() => (copyBtn.textContent = 'Copy'), 1500);
  });
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadHistory().then(connectStream);
