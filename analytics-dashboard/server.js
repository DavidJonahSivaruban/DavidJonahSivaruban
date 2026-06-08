const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── In-memory data store ─────────────────────────────────────────────────────

const MAX_HISTORY = 60;

const state = {
  metrics: {
    activeUsers:  Math.floor(Math.random() * 500) + 100,
    pageViews:    Math.floor(Math.random() * 10000) + 5000,
    revenue:      parseFloat((Math.random() * 5000 + 1000).toFixed(2)),
    errorRate:    parseFloat((Math.random() * 5).toFixed(2)),
    serverLoad:   parseFloat((Math.random() * 60 + 10).toFixed(1)),
    responseTime: Math.floor(Math.random() * 300) + 80,
  },
  history: {
    timestamps:   [],
    activeUsers:  [],
    pageViews:    [],
    revenue:      [],
    errorRate:    [],
    serverLoad:   [],
    responseTime: [],
  },
  events: [],
  sseClients: [],
};

// Seed history with 30 initial points
(function seedHistory() {
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    const ts = new Date(now - i * 2000).toISOString();
    state.history.timestamps.push(ts);
    state.history.activeUsers.push(Math.floor(Math.random() * 500) + 100);
    state.history.pageViews.push(Math.floor(Math.random() * 200) + 50);
    state.history.revenue.push(parseFloat((Math.random() * 150 + 30).toFixed(2)));
    state.history.errorRate.push(parseFloat((Math.random() * 5).toFixed(2)));
    state.history.serverLoad.push(parseFloat((Math.random() * 60 + 10).toFixed(1)));
    state.history.responseTime.push(Math.floor(Math.random() * 300) + 80);
  }
})();

// ─── Data generation ──────────────────────────────────────────────────────────

function nudge(val, min, max, delta) {
  const next = val + (Math.random() - 0.5) * delta;
  return parseFloat(Math.min(max, Math.max(min, next)).toFixed(2));
}

function tickMetrics() {
  const m = state.metrics;
  m.activeUsers  = Math.round(nudge(m.activeUsers,  50,  900,  40));
  m.pageViews   += Math.floor(Math.random() * 30) + 5;
  m.revenue     += parseFloat((Math.random() * 20).toFixed(2));
  m.errorRate    = nudge(m.errorRate,    0,   15,   1);
  m.serverLoad   = nudge(m.serverLoad,   5,   95,   8);
  m.responseTime = Math.round(nudge(m.responseTime, 40, 1200, 40));

  const ts = new Date().toISOString();
  const h  = state.history;

  h.timestamps.push(ts);
  h.activeUsers.push(m.activeUsers);
  h.pageViews.push(Math.floor(Math.random() * 200) + 50);
  h.revenue.push(parseFloat((Math.random() * 150 + 30).toFixed(2)));
  h.errorRate.push(m.errorRate);
  h.serverLoad.push(m.serverLoad);
  h.responseTime.push(m.responseTime);

  for (const key of Object.keys(h)) {
    if (h[key].length > MAX_HISTORY) h[key].shift();
  }

  // Random events
  if (Math.random() < 0.15) {
    const types = ['info', 'warning', 'error', 'success'];
    const msgs  = [
      'New user registered',
      'Payment processed',
      'High memory usage detected',
      'API rate limit approached',
      'Database query slow',
      'Cache cleared',
      'Deployment completed',
      'SSL certificate renewed',
    ];
    state.events.unshift({
      id:        Date.now(),
      type:      types[Math.floor(Math.random() * types.length)],
      message:   msgs[Math.floor(Math.random() * msgs.length)],
      timestamp: ts,
    });
    if (state.events.length > 50) state.events.pop();
  }

  // Broadcast to SSE clients
  const payload = JSON.stringify({
    metrics: m,
    latest: {
      timestamp:   ts,
      activeUsers: m.activeUsers,
      pageViews:   h.pageViews.at(-1),
      revenue:     h.revenue.at(-1),
      errorRate:   m.errorRate,
      serverLoad:  m.serverLoad,
      responseTime:m.responseTime,
    },
    events: state.events.slice(0, 5),
  });

  state.sseClients = state.sseClients.filter(res => {
    try { res.write(`data: ${payload}\n\n`); return true; }
    catch { return false; }
  });
}

setInterval(tickMetrics, 2000);

// ─── REST API ─────────────────────────────────────────────────────────────────

// GET /api/metrics — current snapshot
app.get('/api/metrics', (req, res) => {
  res.json({ ok: true, data: state.metrics, timestamp: new Date().toISOString() });
});

// GET /api/history — time-series data
app.get('/api/history', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || MAX_HISTORY, MAX_HISTORY);
  const slice = key => state.history[key].slice(-limit);
  res.json({
    ok: true,
    data: {
      timestamps:   slice('timestamps'),
      activeUsers:  slice('activeUsers'),
      pageViews:    slice('pageViews'),
      revenue:      slice('revenue'),
      errorRate:    slice('errorRate'),
      serverLoad:   slice('serverLoad'),
      responseTime: slice('responseTime'),
    },
  });
});

// GET /api/events — recent system events
app.get('/api/events', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  res.json({ ok: true, data: state.events.slice(0, limit) });
});

// GET /api/summary — aggregated KPIs
app.get('/api/summary', (req, res) => {
  const h = state.history;
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  res.json({
    ok: true,
    data: {
      avgActiveUsers:  Math.round(avg(h.activeUsers)),
      avgResponseTime: Math.round(avg(h.responseTime)),
      avgErrorRate:    parseFloat(avg(h.errorRate).toFixed(2)),
      avgServerLoad:   parseFloat(avg(h.serverLoad).toFixed(1)),
      totalPageViews:  state.metrics.pageViews,
      totalRevenue:    parseFloat(state.metrics.revenue.toFixed(2)),
      dataPoints:      h.timestamps.length,
    },
  });
});

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// SSE endpoint — real-time push
app.get('/api/stream', (req, res) => {
  res.set({
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write(': connected\n\n');
  state.sseClients.push(res);
  req.on('close', () => {
    state.sseClients = state.sseClients.filter(c => c !== res);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Analytics API running at http://localhost:${PORT}`);
  console.log(`Dashboard:  http://localhost:${PORT}`);
  console.log(`REST API:   http://localhost:${PORT}/api/metrics`);
});
