// Isang Parcel — small helpers: menu toggle, YouTube embeds on the live site, Sources tabs.
(function () {
  var btn = document.getElementById("menu-btn");
  var menu = document.getElementById("site-menu");
  if (btn && menu) {
    btn.addEventListener("click", function () {
      var open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Close" : "Menu";
    });
  }

  // On the published site (GitHub Pages or a local file), swap each video card for a real YouTube embed.
  // In other previews, the card stays a link that opens YouTube.
  var host = location.hostname;
  var canEmbed = !/claudeusercontent\.com$|claude\.ai$/.test(host);
  if (canEmbed) {
    document.querySelectorAll(".video[data-yt]").forEach(function (v) {
      var id = v.getAttribute("data-yt");
      var frame = document.createElement("div");
      frame.className = "frame";
      var ifr = document.createElement("iframe");
      ifr.src = "https://www.youtube-nocookie.com/embed/" + id;
      ifr.title = v.getAttribute("data-title") || "Video";
      ifr.loading = "lazy";
      ifr.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture";
      ifr.allowFullscreen = true;
      frame.appendChild(ifr);
      var card = v.querySelector(".link-card");
      if (card) v.replaceChild(frame, card);
    });
  }

  // Sources page tabs
  var tabs = document.querySelectorAll(".tabs button");
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      tabs.forEach(function (o) {
        o.setAttribute("aria-selected", "false");
        var p = document.getElementById(o.getAttribute("aria-controls"));
        if (p) p.hidden = true;
      });
      t.setAttribute("aria-selected", "true");
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = false;
    });
  });
})();

// Moving sea (Follow the Parcel, stations 6-11): drifting light bands + ripples that follow the cursor or finger.
(function () {
  var host = document.querySelector(".journey .sea");
  if (!host) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cv = document.createElement("canvas");
  cv.className = "sea-canvas";
  cv.setAttribute("aria-hidden", "true");
  host.appendChild(cv);
  var ctx = cv.getContext("2d");
  var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  function size() {
    w = host.clientWidth; h = host.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener("resize", size);

  var ripples = [], last = 0;
  function addRipple(e, strong) {
    var r = host.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    if (x < 0 || y < h * 0.08 || x > w || y > h) return;
    var now = performance.now();
    if (!strong && now - last < 90) return;
    last = now;
    ripples.push({ x: x, y: y, t: now, max: strong ? 140 : 70 });
    if (ripples.length > 30) ripples.shift();
  }
  window.addEventListener("pointermove", function (e) { addRipple(e, false); }, { passive: true });
  window.addEventListener("pointerdown", function (e) { addRipple(e, true); }, { passive: true });

  var bands = 9;
  function frame(now) {
    ctx.clearRect(0, 0, w, h);
    var t = now / 1000;
    var gap = h / bands;
    for (var i = 0; i < bands; i++) {
      var baseY = gap * i + gap * 0.5 + Math.sin(t * 0.4 + i) * gap * 0.35;
      ctx.beginPath();
      for (var x = -20; x <= w + 20; x += 24) {
        var y = baseY + Math.sin(x / 90 + t * 0.9 + i) * 10 + Math.sin(x / 37 - t * 1.3 + i * 2) * 4;
        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(207, 230, 228," + (0.06 + 0.04 * Math.sin(t + i)) + ")";
      ctx.lineWidth = 2 + (i % 3);
      ctx.stroke();
    }
    ripples = ripples.filter(function (r) { return now - r.t < 1600; });
    ripples.forEach(function (r) {
      var p = (now - r.t) / 1600;
      for (var k = 0; k < 2; k++) {
        var rad = r.max * (p + k * 0.18);
        if (rad <= 0) continue;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, rad, rad * 0.55, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255," + (0.35 * (1 - p)) / (k + 1) + ")";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

// Home: shrink the big overlapping logo once the page scrolls past the hero top
(function () {
  var head = document.querySelector('.site-head.is-home');
  if (!head) return;
  function onScroll() { head.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// Start every page at the top. The preview frame keeps the previous page's scroll position,
// so reset this page and every same-origin parent frame, a few times while the frame settles.
(function () {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var userMoved = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
    window.addEventListener(ev, function () { userMoved = true; }, { passive: true, once: true });
  });
  function allTop() {
    var w = window;
    for (var i = 0; i < 5; i++) {
      try {
        w.scrollTo(0, 0);
        var se = w.document.scrollingElement || w.document.documentElement;
        se.scrollTop = 0;
        if (w.document.body) w.document.body.scrollTop = 0;
      } catch (e) { break; }
      if (w === w.parent) break;
      w = w.parent;
    }
    try { document.documentElement.scrollIntoView({ block: 'start', behavior: 'instant' }); } catch (e) { document.documentElement.scrollIntoView(true); }
  }
  function go() {
    if (userMoved) return;
    if (location.hash && location.hash.length > 1) {
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t) { t.scrollIntoView({ block: 'start' }); return; }
    }
    allTop();
  }
  go();
  document.addEventListener('DOMContentLoaded', go);
  window.addEventListener('load', go);
  window.addEventListener('pageshow', go);
  [50, 150, 350, 700, 1200].forEach(function (ms) { setTimeout(go, ms); });
})();

// Smooth scroll for in-page links only
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a) return;
  var id = a.getAttribute('href').slice(1); var t = id && document.getElementById(id);
  if (!t) return;
  e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', '#' + id);
});

// Follow the Parcel: station pop-ups over the map
(function () {
  var modal = document.getElementById('st-modal');
  if (!modal) return;
  var body = modal.querySelector('.st-body'), prevB = modal.querySelector('.st-prev'), nextB = modal.querySelector('.st-next'),
      cliffP = modal.querySelector('.st-cliff'), lastFocus = null, current = null;
  function pop(key) { return document.getElementById('pop-' + key); }
  function mark(key) {
    document.querySelectorAll('.map a[data-key]').forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('data-key') === key); });
  }
  function open(key, fromHash) {
    var p = pop(key); if (!p) return;
    if (!current) lastFocus = document.activeElement;
    current = key;
    modal.querySelector('.st-dialog').setAttribute('data-theme', key);
    body.innerHTML = p.innerHTML;
    var prev = p.getAttribute('data-prev'), next = p.getAttribute('data-next');
    prevB.hidden = !prev; prevB.onclick = function () { go(prev); };
    if (next) {
      nextB.textContent = p.getAttribute('data-nlabel');
      nextB.onclick = function () { go(next); };
    } else {
      nextB.textContent = 'Sino ang dapat kumilos? →';
      nextB.onclick = function () { location.href = 'responsible.html'; };
    }
    cliffP.textContent = p.getAttribute('data-cliff') || '';
    modal.hidden = false; document.documentElement.classList.add('st-lock');
    body.scrollTop = 0; mark(key);
    if (!fromHash) history.replaceState(null, '', '#station-' + key);
    setTimeout(function () { modal.querySelector('.st-dialog').focus(); }, 0);
  }
  function go(key) { open(key); }
  function close() {
    modal.hidden = true; document.documentElement.classList.remove('st-lock'); current = null; mark('');
    history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  modal.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' && !nextB.hidden) nextB.click();
    if (e.key === 'ArrowLeft' && !prevB.hidden) prevB.click();
  });
  // any link to #station-XX (map nodes, buttons, links inside pop-ups)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#station-"]');
    if (!a) return;
    e.preventDefault(); e.stopPropagation();
    open(a.getAttribute('href').slice(9));
  }, true);
  modal.querySelector('.st-dialog').setAttribute('tabindex', '-1');
  // came from the homepage cards: show a way back
  var homeB = modal.querySelector('.st-home');
  if (homeB && /(^|[?&])from=home(&|$)/.test(location.search.slice(1))) homeB.hidden = false;
  function fromHash() { var m = location.hash.match(/^#station-(\w+)$/); if (m && pop(m[1])) open(m[1], true); }
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();

// Sources page: a link to #ref-... (or arriving with one) opens the References tab first
(function () {
  var refs = document.getElementById('p-refs'), tab = document.getElementById('t-refs');
  if (!refs || !tab) return;
  function show(id) {
    var t = id && document.getElementById(id);
    var panel = t && t.closest('[role="tabpanel"]');
    if (!t || !panel) return;
    var ptab = document.querySelector('[aria-controls="' + panel.id + '"]');
    if (panel.hidden && ptab) ptab.click();
    setTimeout(function () { t.scrollIntoView({ block: 'center' }); t.classList.add('flash'); setTimeout(function () { t.classList.remove('flash'); }, 3200); }, 1300);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#ref-"], a[href^="#lim-"], a[href^="#out-"]');
    if (!a) return;
    e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); show(a.getAttribute('href').slice(1));
  });
  if (/^#(ref|lim|out)-/.test(location.hash)) show(location.hash.slice(1));
})();

// "On this page" outline for long reading pages (built from the page's section headings)
(function () {
  var pages = /(^|\/)(issue-[a-z]+|resp-[a-z]+|about)\.html$/;
  if (!pages.test(location.pathname)) return;
  var main = document.querySelector('main'); if (!main) return;
  var hs = Array.prototype.filter.call(main.querySelectorAll('h2'), function (h) { return !h.closest('.chart, figure, table, .st-modal'); });
  if (hs.length < 3) return;
  var items = hs.map(function (h, i) {
    if (!h.id) h.id = 'sec-' + (i + 1);
    return '<li><a href="#' + h.id + '">' + h.textContent.replace(/</g, '&lt;') + '</a></li>';
  }).join('');
  var side = document.createElement('nav'); side.className = 'toc toc-side'; side.setAttribute('aria-label', 'On this page');
  side.innerHTML = '<p class="toc-title">On this page</p><ol>' + items + '</ol>';
  var top = document.createElement('nav'); top.className = 'toc toc-top'; top.setAttribute('aria-label', 'On this page');
  top.innerHTML = '<details><summary>On this page</summary><ol>' + items + '</ol></details>';
  document.body.appendChild(side);
  top.addEventListener('click', function (e) { if (e.target.closest('a')) top.querySelector('details').open = false; });
  var links = document.querySelectorAll('.toc a');
  function mark() {
    var cur = hs[0];
    hs.forEach(function (h) { if (h.getBoundingClientRect().top < 160) cur = h; });
    links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + cur.id); });
    // keep the side outline clear of the footer
    var f = document.querySelector('footer'); if (f) side.style.visibility = f.getBoundingClientRect().top < side.getBoundingClientRect().bottom + 20 ? 'hidden' : '';
  }
  window.addEventListener('scroll', mark, { passive: true }); mark();
})();

// Sources page: open a tab from the address (e.g. sources.html#p-brief, #p-img)
(function () {
  var h = location.hash.slice(1); if (!h) return;
  var panel = document.getElementById(h); if (!panel || panel.getAttribute('role') !== 'tabpanel') return;
  var tab = document.querySelector('[aria-controls="' + h + '"]'); if (tab) tab.click();
})();

// Sources: switching tabs from the top menu while already on the page
window.addEventListener('hashchange', function () {
  var h = location.hash.slice(1); var panel = h && document.getElementById(h);
  if (!panel || panel.getAttribute('role') !== 'tabpanel') return;
  var tab = document.querySelector('[aria-controls="' + h + '"]'); if (tab) { tab.click(); tab.scrollIntoView({ block: 'center' }); }
});

// Top menu: show sub-pages on hover / keyboard focus
(function () {
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('.site-head .menu li.has-sub').forEach(function (li) {
    var link = li.querySelector(':scope > a'), sub = li.querySelector(':scope > ul.sub'), t = null;
    if (!link || !sub) return;
    function place() {
      var r = link.getBoundingClientRect(), w = Math.max(sub.offsetWidth, 250);
      var left = Math.min(r.left - 12, window.innerWidth - w - 10);
      sub.style.left = Math.max(10, left) + 'px'; sub.style.top = (r.bottom + 6) + 'px';
    }
    function open() { clearTimeout(t); document.querySelectorAll('.site-head ul.sub.open').forEach(function (s) { if (s !== sub) s.classList.remove('open'); }); place(); sub.classList.add('open'); }
    function close() { t = setTimeout(function () { sub.classList.remove('open'); }, 180); }
    li.addEventListener('mouseenter', open); li.addEventListener('mouseleave', close);
    sub.addEventListener('mouseenter', function () { clearTimeout(t); }); sub.addEventListener('mouseleave', close);
    li.addEventListener('focusin', open); li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) close(); });
    window.addEventListener('scroll', function () { if (sub.classList.contains('open')) place(); }, { passive: true });
    window.addEventListener('resize', function () { sub.classList.remove('open'); });
  });
})();
