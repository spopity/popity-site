// Network AI demo: answers the dashboard's /api/* calls from a recorded snapshot
// (data/*.json), so the real app runs as a static page with no router behind it.
// Loaded before the app bundle, which only talks to the server through fetch().
(function () {
  var realFetch = window.fetch.bind(window);
  var base = new URL('data/', document.baseURI);

  // Start every visit with an empty Tshoot chat, so the suggestions show.
  try { localStorage.removeItem('tshoot-chat-v1'); } catch (e) {}

  // Newer Chromium returns a Promise from scrollIntoView(). The app returns that
  // value from two useEffect callbacks, and React then calls it as a cleanup
  // function and crashes. Keep the old behaviour: scroll, return nothing.
  var scrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function () { scrollIntoView.apply(this, arguments); };

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
    return new Response(typeof value === 'string' ? value : JSON.stringify(value), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Every recorded timestamp moves forward by the time since the snapshot,
  // so "checked 2 min ago" and the 24 h charts stay current.
  var shift = realFetch(new URL('meta.json', base)).then(function (r) { return r.json(); }).then(function (m) {
    return Date.now() - 2 * 60000 - Date.parse(m.recorded_at);
  });
  var ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:\+00:00|Z)/g;

  function load(file) {
    return Promise.all([shift, realFetch(new URL(file, base)).then(function (r) {
      if (!r.ok) throw new Error(file + ': ' + r.status);
      return r.text();
    })]).then(function (a) {
      var delta = a[0];
      return a[1].replace(ISO, function (t) { return new Date(Date.parse(t) + delta).toISOString(); });
    });
  }

  function loadConnmon(hours) {
    return Promise.all([shift, load('connmon_hours_' + hours + '.json')]).then(function (a) {
      var data = JSON.parse(a[1]);
      (data.points || []).forEach(function (p) { p.ts += Math.round(a[0] / 1000); });
      return json(data);
    });
  }

  // --- Tshoot -----------------------------------------------------------

  var KEYWORDS = [
    /drop|disconnect|outage|offline|down|internet|wan|pppoe/i,
    /channel|width|5 ?ghz|interfer|radio|band/i,
    /slow|signal|rssi|link rate|client|device|wi-?fi/i,
    /skynet|block|firewall|bad ip|malware|attack|security|scan/i
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
      { type: 'status', content: 'Tshoot is analyzing…' },
      { type: 'final', model: 'demo', content:
        'This is a **demo snapshot**, so there is no router behind it and only a few real investigations were recorded. Try one of these:\n\n' +
        chat.map(function (c) { return '- ' + c.question; }).join('\n') +
        '\n\nTip: the reset button at the top of the chat brings the suggestions back.' }
    ] };
  }

  function delayFor(ev) {
    if (ev.type === 'final') return 1200;
    if (ev.type === 'command_result') return 700 + Math.random() * 900;
    return 450 + Math.random() * 450;
  }

  function stream(events, signal) {
    var enc = new TextEncoder();
    return new Response(new ReadableStream({
      start: async function (controller) {
        try {
          for (var i = 0; i < events.length; i++) {
            await sleep(delayFor(events[i]), signal);
            controller.enqueue(enc.encode('data: ' + JSON.stringify(events[i]) + '\n\n'));
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      }
    }), { headers: { 'Content-Type': 'text/event-stream' } });
  }

  function tshootChat(body, signal) {
    return load('tshoot.json').then(function (text) {
      var chat = JSON.parse(text);
      var answer = pickAnswer(chat, body.message || '') || fallback(chat);
      return stream(answer.events, signal);
    });
  }

  function tshootApprove(signal) {
    return stream([{ type: 'final', model: 'demo', content:
      'Demo snapshot: there is no router behind this page, so nothing can be changed. ' +
      'On the real one, Tshoot runs the command only after this approval and then checks the result.' }], signal);
  }

  // --- routes -----------------------------------------------------------

  function handle(url, init) {
    var method = ((init && init.method) || 'GET').toUpperCase();
    var path = url.pathname.replace(/^.*\/api\//, '');
    var body = {};
    try { body = init && init.body ? JSON.parse(init.body) : {}; } catch (e) {}

    if (method === 'GET') {
      if (path === 'state') return load('state.json').then(json);
      if (path === 'history') return load('history_days_30.json').then(json);
      if (path === 'collect-status') return load('collect-status.json').then(json);
      if (path === 'connmon') return loadConnmon(+url.searchParams.get('hours') > 24 ? 168 : 24);
    } else {
      if (path === 'tshoot/chat') return tshootChat(body, init.signal);
      if (path === 'tshoot/approve') return Promise.resolve(tshootApprove(init.signal));
      if (path === 'tshoot/reset') return Promise.resolve(json({ ok: true }));
      if (path === 'collect-now') return Promise.resolve(json({ detail: 'Demo snapshot: there is no router to check.' }, 403));
    }
    return Promise.resolve(json({ error: 'Not in the demo snapshot.' }, 404));
  }

  window.fetch = function (input, init) {
    var url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (url.origin === location.origin && /\/api\//.test(url.pathname)) {
      // Answer with a server-like delay, not all in the same tick: the charts
      // expect their data to arrive after the first render, as it does live.
      return sleep(120 + Math.random() * 200).then(function () { return handle(url, init); });
    }
    return realFetch(input, init);
  };
})();
