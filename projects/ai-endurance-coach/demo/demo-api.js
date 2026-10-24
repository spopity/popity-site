// AI Coach demo: answers the dashboard's /api/* calls from a recorded snapshot
// (data/*.json), so the real app runs as a static page with no backend.
// Loaded before the app bundle, which only talks to the server through fetch().
(function () {
  var realFetch = window.fetch.bind(window);
  var base = new URL('data/', document.baseURI);

  // Start every visit with an empty chat, so the suggested questions show.
  try { localStorage.removeItem('ai-coach-chat-v1'); } catch (e) {}

  function sleep(ms, signal) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(resolve, ms);
      if (signal) signal.addEventListener('abort', function () {
        clearTimeout(t);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  }

  function json(value, status) {
    return new Response(JSON.stringify(value), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function disabled(what) {
    return json({ detail: 'Demo snapshot: ' + what + ' is disabled here.' }, 403);
  }

  function load(file) {
    return realFetch(new URL(file, base)).then(function (r) {
      if (!r.ok) throw new Error(file + ': ' + r.status);
      return r.json();
    });
  }

  // Ranges the dashboard offers; anything else falls back to the closest recorded one.
  function closest(n, options) {
    return options.reduce(function (a, b) { return Math.abs(b - n) < Math.abs(a - n) ? b : a; });
  }

  // --- chat -------------------------------------------------------------

  var KEYWORDS = [
    /tomorrow|today|next (session|workout|ride)|what should i (do|ride|train)|plan/i,
    /recover|interval|fatigue|tired|ready|hrv|injur|rest/i,
    /ctl|fitness|tss|project|weeks|future|twin|predict/i,
    /last (ride|activity|workout)|ride go|how did|yesterday|recent/i
  ];

  function pickAnswer(chat, message) {
    var text = message.trim().toLowerCase();
    for (var i = 0; i < chat.length; i++) {
      if (chat[i].question.toLowerCase() === text) return chat[i];
    }
    for (var j = 0; j < KEYWORDS.length; j++) {
      if (KEYWORDS[j].test(text)) return chat[j];
    }
    return null;
  }

  function fallback(chat) {
    return { events: [
      { type: 'status', content: 'Engaging Supervisor...' },
      { type: 'final', agent: null, model: 'none', content:
        'This is a **demo snapshot**, so the coaching team is offline and only a few real answers were recorded. Try one of these:\n\n' +
        chat.map(function (c) { return '- ' + c.question; }).join('\n') +
        '\n\nTip: the reset button at the top of the chat brings the suggestions back.' }
    ] };
  }

  function chatStream(body, signal) {
    var enc = new TextEncoder();
    return load('chat.json').then(function (chat) {
      var answer = pickAnswer(chat, body.message || '') || fallback(chat);
      var stream = new ReadableStream({
        start: async function (controller) {
          try {
            for (var i = 0; i < answer.events.length; i++) {
              var ev = answer.events[i];
              await sleep(ev.type === 'final' ? 1400 : 650 + Math.random() * 500, signal);
              controller.enqueue(enc.encode('data: ' + JSON.stringify(ev) + '\n\n'));
            }
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        }
      });
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
    });
  }

  // --- routes -----------------------------------------------------------

  function handle(url, init) {
    var method = ((init && init.method) || 'GET').toUpperCase();
    var path = url.pathname.replace(/^.*\/api\//, '');
    var q = url.searchParams;
    var body = {};
    try { body = init && init.body ? JSON.parse(init.body) : {}; } catch (e) {}
    var m;

    if (method === 'GET') {
      if (path === 'overview') {
        return load('overview.json').then(function (o) {
          // Show the snapshot as freshly synced.
          var t = new Date(Date.now() - 12 * 60000).toISOString();
          o.last_sync = t;
          if (o.athlete) o.athlete.synced_at = t;
          return json(o);
        });
      }
      if (path === 'pmc') return load('pmc_days_' + closest(+q.get('days'), [90, 180, 365, 1095, 6000]) + '.json').then(json);
      if (path === 'usage') return load('usage_days_' + closest(+q.get('days'), [1, 7, 30]) + '.json').then(json);
      if (path === 'wellness') return load('wellness_days_90.json').then(json);
      if (path === 'weekly') return load('weekly_weeks_12.json').then(json);
      if (path === 'plan') return load('plan_weeks_8.json').then(json);
      if (path === 'activities') return load('activities_limit_20.json').then(json);
      if (path === 'next-session' || path === 'focus' || path === 'injury') return load(path + '.json').then(json);
      if ((m = path.match(/^strava-note\/([\w-]+)$/))) {
        return load('strava-note/' + m[1] + '.json').then(json, function () {
          return json({ note: null, context: null, strava_url: null, posted_at: null });
        });
      }
    } else {
      if (path === 'chat') return chatStream(body, init.signal);
      if (path === 'sync') return sleep(1200).then(function () { return json({ message: 'Demo snapshot: live sync is disabled here.' }); });
      if (path === 'next-session') return sleep(2500).then(function () { return load('next-session.json').then(json); });
      if (path === 'focus') return Promise.resolve(disabled('switching focus'));
      if (path.indexOf('next-session/proposals/') === 0) return Promise.resolve(disabled('changing the plan'));
      if (path.indexOf('strava-note/') === 0) return Promise.resolve(disabled('posting to Strava'));
    }
    return Promise.resolve(json({ detail: 'Not in the demo snapshot.' }, 404));
  }

  window.fetch = function (input, init) {
    var url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (url.origin === location.origin && /\/api\//.test(url.pathname) && !/\/data\//.test(url.pathname)) {
      // Answer with a server-like delay, not all in the same tick: the charts
      // expect their data to arrive after the first render, as it does live.
      return sleep(120 + Math.random() * 200).then(function () { return handle(url, init); });
    }
    return realFetch(input, init);
  };
})();
