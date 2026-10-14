(function () {
  /* Product frames: tabs within each frame */
  [].slice.call(document.querySelectorAll('.pf [role="tablist"]')).forEach(function (list) {
    var tabs = [].slice.call(list.querySelectorAll('[role="tab"]'));
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab, panel = document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panel.hidden = !on;
        if (on) { if (t.scrollIntoView && t.parentNode.scrollWidth > t.parentNode.clientWidth) t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); panel.classList.remove('enter'); panel.offsetWidth; panel.classList.add('enter'); }
      });
    }
    tabs.forEach(function (t, i) {
      t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); select(n);
      });
    });
  });

  /* Scenarios: weights always total 100; moving one rebalances the rest in proportion.
     Each objective's direction comes from the net change in the channels that serve it. */
  var OBJ = [
    ['share', 'Grow share of Acme Shaving among UK men aged 35 to 54'],
    ['pref', 'Increase percentage who name Acme Shaving as the razor brand they would choose'],
    ['advocacy', 'Increase word-of-mouth advocacy for Acme Shaving'],
    ['pen', 'Increase percentage who have bought Acme Shaving within previous 12 months'],
    ['fame', 'Fame: make Acme Shaving highly visible and talked about, to drive perceived authority']
  ];
  var CH = [
    { name: 'Social', base: 22, serves: ['share', 'fame'] },
    { name: 'Linear TV', base: 25, serves: ['share', 'pref', 'advocacy', 'pen', 'fame'] },
    { name: 'Broadcaster VOD (BVoD)', base: 13, serves: ['share', 'pen'] },
    { name: 'Events and experiential', base: 15, serves: ['advocacy'] },
    { name: 'PR', base: 8, serves: ['fame', 'pref'] },
    { name: 'Athlete and influencer', base: 10, serves: ['advocacy', 'fame'] },
    { name: 'Outdoor', base: 7, serves: ['fame', 'pen'] }
  ];
  var START = [22, 30, 13, 10, 8, 10, 7]; /* the sample opens mid-scenario: TV up 5, events down 5 */
  var w = START.slice();
  var box = document.getElementById('channels'), movesBox = document.getElementById('moves');
  if (!box || !movesBox) return;
  var last = {};

  CH.forEach(function (c, i) {
    var d = document.createElement('div'); d.className = 'ch';
    d.innerHTML = '<div class="row"><label class="name" for="ch' + i + '">' + c.name + '</label><span><span class="pct"></span> <span class="was"></span></span></div>' +
      '<input type="range" id="ch' + i + '" min="0" max="60" step="1">';
    box.appendChild(d);
    d.querySelector('input').addEventListener('input', function (e) { setWeight(i, +e.target.value); });
  });
  OBJ.forEach(function (o) {
    var r = document.createElement('div'); r.className = 'move';
    r.innerHTML = '<span>' + o[1] + '</span><span class="st" id="st-' + o[0] + '"></span>';
    movesBox.appendChild(r);
  });

  function setWeight(i, v) {
    var others = 0; w.forEach(function (x, j) { if (j !== i) others += x; });
    var rest = 100 - v;
    w = w.map(function (x, j) { return j === i ? v : others ? x * rest / others : rest / (w.length - 1); });
    render();
  }
  function render() {
    var rounded = w.map(Math.round), diff = 100 - rounded.reduce(function (a, b) { return a + b; }, 0);
    if (diff) { var k = rounded.indexOf(Math.max.apply(null, rounded)); rounded[k] += diff; }
    [].slice.call(box.children).forEach(function (d, i) {
      var v = rounded[i], b = CH[i].base, inp = d.querySelector('input');
      inp.value = v; inp.style.setProperty('--p', (v / 60 * 100) + '%');
      d.querySelector('.pct').textContent = v + '%';
      d.querySelector('.was').textContent = v !== b ? '(was ' + b + '%)' : '';
      d.classList.toggle('changed', v !== b);
    });
    OBJ.forEach(function (o) {
      var net = 0; CH.forEach(function (c, i) { if (c.serves.indexOf(o[0]) > -1) net += w[i] - c.base; });
      var st = net > 1.5 ? ['up', 'Improves'] : net < -1.5 ? ['down', 'Weakens'] : ['flat', 'No material change'];
      var el = document.getElementById('st-' + o[0]);
      if (last[o[0]] !== st[1]) { el.classList.remove('flash'); el.offsetWidth; el.classList.add('flash'); }
      el.className = 'st ' + st[0] + (last[o[0]] !== st[1] && last[o[0]] ? ' flash' : '');
      el.textContent = st[1]; last[o[0]] = st[1];
    });
  }
  document.getElementById('reset').addEventListener('click', function () { w = CH.map(function (c) { return c.base; }); render(); });
  render();
})();

(function () {
  /* Mobile nav */
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    });
  }

  /* Early-access form. data-endpoint stays empty until an endpoint (e.g. Formspree) is chosen. */
  var form = document.getElementById('access-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  var button = form.querySelector('button[type="submit"]');
  var email = form.getAttribute('data-email') || '';

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var endpoint = form.getAttribute('data-endpoint');
    if (!endpoint) {
      status.textContent = 'This is a preview, so the form is not connected yet. Nothing was sent.';
      return;
    }
    button.disabled = true;
    status.textContent = 'Sending…';
    fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.reset();
        status.textContent = 'Thanks. We will be in touch to arrange a demo.';
      })
      .catch(function () {
        status.textContent = 'Something went wrong. Email ' + email + ' instead.';
      })
      .then(function () { button.disabled = false; });
  });
})();

(function () {
  /* Load sequence, section reveal and the pitch-to-renewal track. Translate and opacity only. */
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('pep-load'); }); });

  var stops = [].slice.call(document.querySelectorAll('#stops .stop'));
  var puck = document.getElementById('puck');
  var timers = [];
  function place(i) {
    if (!puck) return;
    var line = puck.parentNode.getBoundingClientRect();
    puck.style.transform = 'translateX(' + (stops[i].getBoundingClientRect().left - line.left - 2) + 'px)';
  }
  function runTrack() {
    if (!stops.length) return;
    timers.forEach(clearTimeout); timers = [];
    stops.forEach(function (s) { s.classList.remove('on'); });
    if (puck) { puck.style.transition = 'none'; place(0); puck.offsetWidth; puck.style.transition = ''; }
    stops[0].classList.add('on');
    if (reduce) { stops.forEach(function (s) { s.classList.add('on'); }); place(stops.length - 1); return; }
    stops.forEach(function (s, i) {
      if (i) timers.push(setTimeout(function () { place(i); s.classList.add('on'); }, 200 + i * 360));
    });
  }
  window.addEventListener('resize', function () {
    var on = stops.filter(function (s) { return s.classList.contains('on'); }).length;
    if (on) place(on - 1);
  });

  var targets = [].slice.call(document.querySelectorAll('main > .section, main > .ticker'));
  var track = document.getElementById('track');
  if (reduce || !('IntersectionObserver' in window)) { runTrack(); return; }
  targets.forEach(function (el) {
    if (el.getBoundingClientRect().top > window.innerHeight * 0.85) el.classList.add('pre');
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.remove('pre');
      if (e.target === track) runTrack();
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  targets.forEach(function (t) { io.observe(t); });
  if (track && !track.classList.contains('pre')) setTimeout(runTrack, 300);
})();
