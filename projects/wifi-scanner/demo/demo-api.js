// Wi-Fi Scanner demo: answers the dashboard's /api/* calls from a recorded
// walk-test snapshot (data/*.json), so the real app runs as a static page with
// no Wi-Fi card behind it. Loaded before app.js, which only talks to the server
// through fetch(). Room tags, heatmap pins and a custom floorplan work, but only
// in this tab: a reload brings back the recording.
(function () {
  var realFetch = window.fetch.bind(window);
  var base = new URL('data/', document.baseURI);

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function json(value, status) {
    return new Response(JSON.stringify(value), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function load(file) {
    return realFetch(new URL(file, base)).then(function (r) {
      if (!r.ok) throw new Error(file + ': ' + r.status);
      return r.json();
    });
  }

  var status = load('status.json');
  var neighbors = load('neighbors.json');
  var floorplan = null;

  function body(init) {
    try { return JSON.parse((init && init.body) || '{}'); } catch (e) { return {}; }
  }

  function pin(s, b) {
    var l = s.latest;
    var now = new Date();
    return {
      id: now.getTime(), x: b.x, y: b.y, room: b.room || s.config.current_room,
      rssi_dbm: l.rssi_dbm, signal_pct: l.signal_pct, tx_mbps: l.tx_mbps,
      channel: l.channel, band: l.band, bssid: l.bssid,
      quality_label: l.quality_label, quality_color: l.quality_color,
      iso_time: now.toTimeString().slice(0, 8)
    };
  }

  function api(path, method, init) {
    if (method === 'GET') {
      if (path === '/api/status') return status.then(json);
      if (path === '/api/neighbors') return neighbors.then(json);
      if (path === '/api/floorplan') return Promise.resolve(json({ floorplan_data_url: floorplan }));
      return Promise.resolve(json({ error: 'not in the demo' }, 404));
    }
    var b = body(init);
    return status.then(function (s) {
      switch (path) {
        case '/api/config':
          if ('paused' in b) s.config.paused = !!b.paused;
          if ('poll_interval' in b) s.config.poll_interval = b.poll_interval;
          if (b.clear_session) {
            s.history = []; s.room_stats = []; s.roaming_events = [];
            s.heatmap_points = []; s.advisor = []; s.speed_tests = {};
            s.session = { total_samples: 0, roam_count: 0, heatmap_count: 0 };
          }
          return json({ ok: true, config: s.config });
        case '/api/room':
          s.config.current_room = b.room;
          return json({ ok: true, room: b.room });
        case '/api/heatmap/point':
          if (b.action === 'add') s.heatmap_points.push(pin(s, b));
          else if (b.action === 'undo') s.heatmap_points.pop();
          else if (b.action === 'clear') s.heatmap_points = [];
          return json({ ok: true, points: s.heatmap_points });
        case '/api/floorplan':
          floorplan = b.floorplan_data_url || null;
          return json({ ok: true });
        case '/api/speedtest':
          // Replays the speed test recorded during the walk.
          var keys = Object.keys(s.speed_tests);
          return sleep(1500).then(function () {
            return json(keys.length ? s.speed_tests[keys[0]] : { ok: false, error: 'no speed test recorded' });
          });
        case '/api/session/load':
          return json({ ok: true });
        default:
          // Saving sessions and opening Windows settings need the real app.
          return json({ ok: false, error: 'disabled in the demo' });
      }
    });
  }

  window.fetch = function (input, init) {
    var url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (url.origin !== location.origin || url.pathname.indexOf('/api/') !== 0) {
      return realFetch(input, init);
    }
    var method = ((init && init.method) || 'GET').toUpperCase();
    // A short delay, so the dashboard behaves like it does against the local server.
    return sleep(40 + Math.random() * 80).then(function () { return api(url.pathname, method, init); });
  };
})();
