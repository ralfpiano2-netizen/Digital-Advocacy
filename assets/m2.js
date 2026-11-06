// Isang Parcel Milestone 2: tabs (nested), open a tab from the address (#slug), and the projection slider.
(function () {
  function own(box) {
    var list = box.querySelector(':scope > [role="tablist"]');
    return list ? Array.prototype.slice.call(list.querySelectorAll('[role="tab"]')) : [];
  }
  function pick(box, t, focus) {
    own(box).forEach(function (x) {
      var on = x === t; x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
      var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
    });
    if (focus) t.focus();
  }
  document.querySelectorAll('[data-tabs]').forEach(function (box) {
    var ts = own(box);
    ts.forEach(function (t, i) {
      t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
      t.addEventListener('click', function () {
        pick(box, t);
        if (box.classList.contains('outer') && history.replaceState) history.replaceState(null, '', '#' + t.getAttribute('aria-controls'));
      });
      t.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
        if (j === null) return; e.preventDefault(); var n = ts[(j + ts.length) % ts.length]; pick(box, n, true);
      });
    });
  });
  // open whatever tab (and parent tabs) contain the element named in the address
  function fromHash(scroll) {
    var id = decodeURIComponent(location.hash.slice(1)); if (!id) return;
    var el = document.getElementById(id); if (!el || !el.closest('[data-tabs]')) return;
    var p = el.closest('[role="tabpanel"]'), last = null;
    while (p) {
      var t = document.querySelector('[role="tab"][aria-controls="' + p.id + '"]');
      var box = t && t.closest('[data-tabs]');
      if (box) { pick(box, t); last = box; }
      p = box ? box.parentElement.closest('[role="tabpanel"]') : null;
    }
    if (scroll && last) last.scrollIntoView({ block: 'start' });
  }
  fromHash(true);
  window.addEventListener('hashchange', function () { fromHash(true); });

  document.querySelectorAll('[data-calc]').forEach(function (box) {
    var orders = +box.getAttribute('data-orders'), g = +box.getAttribute('data-g');
    var r = box.querySelector('input[type=range]'), s = box.querySelector('[data-out-share]'), t = box.querySelector('[data-out-t]');
    function upd() {
      var tonnes = orders * (+r.value / 100) * g / 1e6;
      s.textContent = r.value + '%';
      t.textContent = Math.round(tonnes).toLocaleString('en-US') + ' tonnes';
    }
    r.addEventListener('input', upd); upd();
  });

  // Existing Solutions: "Read more" notes open the full record in a pop-up
  var modal = document.getElementById('m2-modal');
  if (modal) {
    var order = ['plat', 'epr', 'qc', 'ra9003', 'ord'], cur = -1, lastFocus = null;
    var body = document.getElementById('m2-dlg-body'), cliff = document.getElementById('m2-dlg-cliff');
    var dlg = modal.querySelector('.m2-dialog'), prev = modal.querySelector('[data-m2step="-1"]'), next = modal.querySelector('[data-m2step="1"]');
    function title(k) { var d = document.getElementById('sol-' + k); return d ? d.getAttribute('data-title') : ''; }
    // jump to one section of the open record (Current status, How it works, Results, Assessment, Video)
    function toSec(sec) {
      if (!sec) return;
      var el = body.querySelector('[data-sec="' + sec + '"]'); if (!el) return;
      setTimeout(function () {
        el.scrollIntoView({ block: 'start' });
        el.classList.remove('m2-flash'); void el.offsetWidth; el.classList.add('m2-flash');
      }, 30);
    }
    function parse(h) { var m = (h || '').match(/#sol-([a-z0-9]+)(?:-([a-z]+))?$/); return m && order.indexOf(m[1]) > -1 ? { i: order.indexOf(m[1]), sec: m[2] } : null; }
    // links to a record section on this page open the pop-up instead of reloading
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#sol-"]'); if (!a || a.hasAttribute('data-sol')) return;
      var href = a.getAttribute('href'), page = href.split('#')[0];
      if (page && page !== (location.pathname.split('/').pop() || 'index.html')) return;
      var t = parse(href); if (!t) return;
      e.preventDefault(); show(t.i, true, t.sec);
    });
    function show(i, push, sec) {
      var src = document.getElementById('sol-' + order[i]); if (!src) return;
      cur = i; body.innerHTML = src.innerHTML; body.scrollTop = 0; dlg.scrollTop = 0;
      body.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
      prev.hidden = i === 0;
      if (i < order.length - 1) { next.textContent = 'Next →'; cliff.textContent = 'Next: ' + title(order[i + 1]) + '.'; }
      else { next.textContent = 'Compare solutions →'; cliff.textContent = 'End of the five measures.'; }
      if (modal.hidden) { lastFocus = document.activeElement; modal.hidden = false; document.documentElement.classList.add('st-lock'); }
      dlg.focus();
      if (push !== false && history.replaceState) history.replaceState(null, '', '#sol-' + order[i] + (sec ? '-' + sec : ''));
      if (window.ipLoadVideos) window.ipLoadVideos(body);
      toSec(sec);
    }
    function close() {
      modal.hidden = true; document.documentElement.classList.remove('st-lock'); body.innerHTML = '';
      if (history.replaceState) history.replaceState(null, '', location.pathname + (cur >= 0 ? '#stop-' + order[cur] : ''));
      if (lastFocus) lastFocus.focus(); cur = -1;
    }
    document.querySelectorAll('.m2-note[data-sol]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); show(order.indexOf(a.getAttribute('data-sol'))); });
    });
    modal.querySelectorAll('[data-m2close]').forEach(function (b) { b.addEventListener('click', close); });
    prev.addEventListener('click', function () { if (cur > 0) show(cur - 1); });
    next.addEventListener('click', function () { if (cur < order.length - 1) show(cur + 1); else location.href = 'm2-verdict.html'; });
    document.addEventListener('keydown', function (e) {
      if (modal.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        var f = dlg.querySelectorAll('a[href], button:not([hidden]), iframe, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return; var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    function fromSol() { var t = parse(location.hash); if (t) show(t.i, false, t.sec); }
    fromSol(); window.addEventListener('hashchange', fromSol);
  }
})();

// "Back to where you were": after following a link inside the content, offer a way back to the exact spot.
(function () {
  var KEY = 'ipBack', SS;
  try { SS = window.sessionStorage; SS.getItem('x'); } catch (e) { return; }
  function here() { return location.pathname.split('/').pop() || 'index.html'; }
  function label() { var t = document.title.split(' · ')[0]; return t === 'Isang Parcel' ? 'Home' : t; }
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'ip-back'; btn.hidden = true;
  document.body.appendChild(btn);
  function show(st) {
    btn.innerHTML = '← Back to ' + st.label + '<span class="x" aria-hidden="true">✕</span>';
    btn.setAttribute('aria-label', 'Back to ' + st.label);
    btn.hidden = false;
  }
  function read() { try { return JSON.parse(SS.getItem(KEY) || 'null'); } catch (e) { return null; } }
  btn.addEventListener('click', function (e) {
    var st = read(); SS.removeItem(KEY); btn.hidden = true;
    if (!st || e.target.classList.contains('x')) return;
    if (st.page === here()) { window.scrollTo({ top: st.y, behavior: 'instant' }); }
    else { SS.setItem('ipRestore', JSON.stringify(st)); location.href = st.page; }
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    if (a.target === '_blank' || a.hasAttribute('data-sol')) return;
    if (a.closest('header, footer, .jump, .m2-track, .m2-end, .m1-bar, .tabs')) { SS.removeItem(KEY); btn.hidden = true; return; }
    var href = a.getAttribute('href'); if (!href || /^(https?:|mailto:)/.test(href)) return;
    var st = { page: here(), y: window.scrollY, label: label() };
    SS.setItem(KEY, JSON.stringify(st));
    if (href.charAt(0) === '#') setTimeout(function () { show(st); }, 50);
  }, true);
  var r = null; try { r = JSON.parse(SS.getItem('ipRestore') || 'null'); } catch (e) {}
  if (r && r.page === here()) { SS.removeItem('ipRestore'); history.replaceState && history.replaceState(null, '', location.pathname); var go = function () { window.scrollTo({ top: r.y, behavior: 'instant' }); }; window.addEventListener('load', function () { setTimeout(go, 0); }); window.addEventListener('pageshow', function () { setTimeout(go, 0); }); setTimeout(go, 250); setTimeout(go, 700); setTimeout(go, 1300); }
  else { var st = read(); if (st && st.page !== here()) show(st); }
})();

// "Reasons ↓" in the report card opens the matching explanation
(function () {
  function openWhy(id) { var d = document.getElementById(id); if (d && d.tagName === 'DETAILS') { d.open = true; d.scrollIntoView({ block: 'center' }); } }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#why-"]'); if (!a) return;
    e.preventDefault(); openWhy(a.getAttribute('href').slice(1));
  });
  if (/^#why-/.test(location.hash)) openWhy(location.hash.slice(1));
})();
