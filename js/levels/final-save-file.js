/*
 * Level 06 — FINAL SAVE FILE
 * Reward terakhir: sebuah arsip dengan tiga file.
 *   1. letter_from_pray.txt  -> surat dari Pray
 *   2. our_memories/         -> galeri foto (dari assets/images/)
 *   3. one_more_video.mp4    -> video (dari assets/video/)
 * Setelah ketiganya dibuka, ending tampil seperti kredit game dan level dianggap selesai.
 *
 * Semua isi pribadi (surat, daftar foto, path video) ada di js/config.js -> SASMIT_CONFIG.finale.
 * Berkas yang belum ada TIDAK membuat game macet: foto/video yang hilang diganti placeholder
 * yang menyebutkan file apa yang perlu kamu tambahkan.
 */
(function () {
  'use strict';
  var SASMIT = window.SASMIT;
  var U = SASMIT.util;
  var S = SASMIT.state;
  var A = SASMIT.audio;
  var CFG = window.SASMIT_CONFIG;
  var F = CFG.finale || {};

  var LETTER = F.letter || { filename: 'letter_from_pray.txt', from: 'PRAY', to: 'SASMIT', paragraphs: [] };
  var GALLERY = F.gallery || { folder: 'our_memories/', photos: [] };
  var VIDEO = F.video || { filename: 'one_more_video.mp4', src: 'assets/video/one_more_video.mp4', caption: '' };

  var timers = [];
  var intervals = [];
  var viewCleanup = null;     // dibersihkan saat viewer ditutup (video, listener keyboard)
  var endingCleanup = null;   // dibersihkan saat overlay ending ditutup

  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function sprite(name) { return SASMIT.sprites.svg(name, ''); }
  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  SASMIT.registerLevel(6, {
    mount: function (stage, ctx) {
      var root = U.el('div', 'arc');
      stage.appendChild(root);

      var photos = (GALLERY.photos || []).filter(function (p) { return p && p.src; });

      /* ---------- Progres arsip ---------- */
      function opened(k) { return !!S.get().archive[k]; }
      function count() { return ['letter', 'gallery', 'video'].filter(opened).length; }
      function sync() { if (!ctx.isCompleted()) ctx.setProgress(count(), 3); }
      function markOpened(k, line) {
        if (!opened(k)) {
          S.markArchive(k);
          ctx.sfx('ok');
          ctx.say(line + ' (' + count() + ' / 3)', 'ok');
        }
        sync();
      }

      var FILES = [
        { key: 'letter',  icon: 'file-txt',    name: LETTER.filename, meta: 'TEXT FILE',  open: openLetter },
        { key: 'gallery', icon: 'file-folder', name: GALLERY.folder,  meta: photos.length + (photos.length === 1 ? ' PHOTO' : ' PHOTOS'), open: openGallery },
        { key: 'video',   icon: 'file-video',  name: VIDEO.filename,  meta: 'VIDEO FILE', open: openVideo }
      ];

      /* ---------- Intro: penyambung dari Level 05 ---------- */
      function intro() {
        var lines = [
          'FINAL ACCESS KEY ... ACCEPTED',
          'SIGNAL FROM PRAY DETECTED',
          'PRAY: "ada satu save file lagi. buka ya."',
          'OPENING FINAL_SAVE.ARC ...'
        ];
        var box = U.el('div', 'panel panel--dark arc__intro');
        box.innerHTML = '<span class="tab">ACCESS.LOG</span>';
        var term = U.el('div', 'term');
        box.appendChild(term);
        root.appendChild(box);
        var done = false;

        function go() {
          if (done) return;
          done = true;
          hub();
        }
        box.addEventListener('pointerdown', function () {   // ketuk untuk melewati
          timers.forEach(clearTimeout); timers = [];
          go();
        });

        if (U.reducedMotion()) {
          lines.forEach(function (t) { term.appendChild(U.el('div', 'line', '> ' + t)); });
          later(go, 900);
          return;
        }
        lines.forEach(function (t, i) {
          later(function () {
            term.appendChild(U.el('div', 'line' + (i === 0 ? ' is-ok' : i === 2 ? ' is-strong' : ''), '> ' + t));
            ctx.sfx('click');
          }, 500 + i * 700);
        });
        later(go, 500 + lines.length * 700 + 500);
      }

      /* ---------- Hub: daftar file ---------- */
      function hub(focusKey, autoFinish) {
        runViewCleanup();
        root.innerHTML = '';
        var all = count() === FILES.length;
        var done = ctx.isCompleted();

        var win = U.el('section', 'panel arcwin');
        win.setAttribute('aria-labelledby', 'arc-title');
        var bar = U.el('div', 'arcwin__bar');
        var title = U.el('span', null, 'FINAL_SAVE.ARC');
        title.id = 'arc-title';
        bar.appendChild(title);
        bar.appendChild(U.el('span', 'arcwin__stat', count() + ' / ' + FILES.length + ' OPENED'));
        win.appendChild(bar);

        var list = U.el('ul', 'arc__list');
        FILES.forEach(function (f) {
          var li = U.el('li');
          var b = U.el('button', 'arcrow' + (opened(f.key) ? ' is-opened' : ''));
          b.type = 'button';
          b.setAttribute('data-key', f.key);
          b.innerHTML = '<span class="arcrow__icon" aria-hidden="true">' + sprite(f.icon) + '</span>' +
                        '<span class="arcrow__txt"><span class="arcrow__name"></span><span class="arcrow__meta"></span></span>' +
                        '<span class="arcrow__tag"></span>';
          b.querySelector('.arcrow__name').textContent = f.name;
          b.querySelector('.arcrow__meta').textContent = f.meta;
          b.querySelector('.arcrow__tag').textContent = opened(f.key) ? 'OPENED' : 'NEW';
          b.setAttribute('aria-label', f.name + ', ' + f.meta + ', ' + (opened(f.key) ? 'opened' : 'not opened yet'));
          b.addEventListener('click', function () { ctx.sfx('click'); f.open(); });
          li.appendChild(b);
          list.appendChild(li);
        });
        win.appendChild(list);

        var foot = U.el('div', 'arc__foot');
        var status = U.el('p', 'arc__status');
        status.setAttribute('role', 'status');
        if (all) {
          status.textContent = autoFinish ? 'ARCHIVE COMPLETE. COMPILING FINAL SAVE...' : (done ? 'ARCHIVE STATUS: COMPLETE' : 'ARCHIVE COMPLETE.');
          status.classList.add('is-ok');
          var run = U.el('button', 'btn btn--lg', done ? 'PLAY ENDING' : 'RUN FINAL SAVE');
          run.type = 'button';
          run.setAttribute('data-run', '1');
          run.addEventListener('click', function () { ctx.sfx('click'); runEnding(); });
          foot.appendChild(status);
          foot.appendChild(run);
          if (autoFinish) later(runEnding, 1500);
        } else {
          status.textContent = 'OPEN ALL ' + FILES.length + ' FILES TO FINISH THE GAME.';
          foot.appendChild(status);
        }
        win.appendChild(foot);
        root.appendChild(win);

        var target = focusKey && root.querySelector('[data-key="' + focusKey + '"]');
        if (!target) target = root.querySelector('.arcrow:not(.is-opened)') || root.querySelector('.arcrow');
        if (target) target.focus({ preventScroll: true });
      }

      /* ---------- Bingkai viewer ---------- */
      function runViewCleanup() {
        if (viewCleanup) { try { viewCleanup(); } catch (e) { /* abaikan */ } viewCleanup = null; }
      }

      // Menggambar viewer dan mengembalikan tombol BACK. viewCleanup harus diisi SETELAH memanggil ini.
      function viewer(key, title, body) {
        runViewCleanup();
        root.innerHTML = '';
        var win = U.el('section', 'panel arcwin arcwin--view');
        win.setAttribute('aria-label', title);
        var bar = U.el('div', 'arcwin__bar');
        bar.appendChild(U.el('span', 'arcwin__title', title));
        var back = U.el('button', 'btn btn--ghost btn--sm', 'BACK');
        back.type = 'button';
        back.setAttribute('aria-label', 'Back to archive');
        back.addEventListener('click', function () {
          ctx.sfx('click');
          // Kalau ini file terakhir yang membuat arsip lengkap, ending langsung dijalankan.
          hub(key, count() === FILES.length && !ctx.isCompleted());
        });
        bar.appendChild(back);
        win.appendChild(bar);
        win.appendChild(body);
        root.appendChild(win);
        return back;
      }

      /* ---------- 1. Surat ---------- */
      function openLetter() {
        markOpened('letter', 'FILE OPENED: ' + LETTER.filename);
        var body = U.el('div', 'letter');
        body.tabIndex = 0;
        body.setAttribute('role', 'document');
        body.setAttribute('aria-label', 'Letter from ' + (LETTER.from || 'Pray'));

        var meta = U.el('p', 'letter__meta');
        meta.appendChild(document.createTextNode('FROM: ' + (LETTER.from || 'PRAY')));
        meta.appendChild(document.createElement('br'));
        meta.appendChild(document.createTextNode('TO: ' + (LETTER.to || 'SASMIT')));
        body.appendChild(meta);

        var n = 0;
        (LETTER.paragraphs || []).forEach(function (t) {
          var p = U.el('p', n === 0 ? 'letter__hello' : null, t);
          p.style.setProperty('--i', n++);
          body.appendChild(p);
        });
        if (LETTER.signature) {
          var sig = U.el('p', 'letter__sig', LETTER.signature);
          sig.style.setProperty('--i', n++);
          body.appendChild(sig);
        }
        if (LETTER.ps) {
          var ps = U.el('p', 'letter__ps', LETTER.ps);
          ps.style.setProperty('--i', n++);
          body.appendChild(ps);
        }
        viewer('letter', LETTER.filename, body);
        body.focus({ preventScroll: true });
      }

      /* ---------- 2. Galeri ---------- */
      // Satu foto (atau thumbnail). Kalau file tidak ada, diganti placeholder yang menyebut nama filenya.
      function photoEl(p, cls) {
        var box = U.el('span', cls);
        var img = new Image();
        img.alt = p.alt || p.caption || '';
        img.decoding = 'async';
        img.draggable = false;
        img.addEventListener('error', function () {
          box.innerHTML = '';
          box.classList.add('is-missing');
          var ph = U.el('span', 'ph');
          ph.innerHTML = sprite('photo');
          ph.appendChild(U.el('span', 'ph__t1', 'PHOTO NOT FOUND'));
          ph.appendChild(U.el('span', 'ph__t2', 'ADD: ' + p.src));
          box.appendChild(ph);
        });
        img.src = p.src;
        box.appendChild(img);
        return box;
      }

      function openGallery() {
        markOpened('gallery', 'FOLDER OPENED: ' + GALLERY.folder);
        var wrap = U.el('div', 'gal');

        if (!photos.length) {
          wrap.appendChild(U.el('p', 'gal__empty', 'THIS FOLDER IS EMPTY. LIST YOUR PHOTOS IN js/config.js (finale.gallery.photos).'));
          viewer('gallery', GALLERY.folder, wrap);
          return;
        }

        var idx = 0;
        var frame = U.el('figure', 'gal__frame');
        var stageBox = U.el('div', 'gal__stage');
        var cap = U.el('figcaption', 'gal__cap');
        frame.appendChild(stageBox);
        frame.appendChild(cap);
        wrap.appendChild(frame);

        var nav = U.el('div', 'gal__nav');
        var prev = U.el('button', 'btn btn--ghost', 'PREV');
        var next = U.el('button', 'btn btn--ghost', 'NEXT');
        prev.type = next.type = 'button';
        prev.setAttribute('aria-label', 'Previous photo');
        next.setAttribute('aria-label', 'Next photo');
        var counter = U.el('p', 'gal__count');
        counter.setAttribute('role', 'status');
        nav.appendChild(prev); nav.appendChild(counter); nav.appendChild(next);
        if (photos.length > 1) wrap.appendChild(nav);

        var thumbs = U.el('ul', 'gal__thumbs');
        var thumbBtns = photos.map(function (p, i) {
          var li = U.el('li');
          var b = U.el('button', 'gal__thumb');
          b.type = 'button';
          b.setAttribute('aria-label', 'Photo ' + (i + 1) + (p.caption ? ': ' + p.caption : ''));
          b.appendChild(photoEl(p, 'gal__timg'));
          b.addEventListener('click', function () { ctx.sfx('click'); show(i); });
          li.appendChild(b);
          thumbs.appendChild(li);
          return b;
        });
        if (photos.length > 1) wrap.appendChild(thumbs);

        function show(i) {
          idx = (i + photos.length) % photos.length;
          var p = photos[idx];
          stageBox.innerHTML = '';
          stageBox.appendChild(photoEl(p, 'gal__photo'));
          cap.textContent = p.caption || '';
          counter.textContent = pad2(idx + 1) + ' / ' + pad2(photos.length);
          thumbBtns.forEach(function (b, k) {
            b.classList.toggle('is-on', k === idx);
            if (k === idx) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
          });
        }
        prev.addEventListener('click', function () { ctx.sfx('click'); show(idx - 1); });
        next.addEventListener('click', function () { ctx.sfx('click'); show(idx + 1); });

        // Geser jari di HP.
        var x0 = null;
        frame.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
        frame.addEventListener('touchend', function (e) {
          if (x0 === null) return;
          var dx = e.changedTouches[0].clientX - x0;
          x0 = null;
          if (Math.abs(dx) > 40 && photos.length > 1) show(idx + (dx < 0 ? 1 : -1));
        }, { passive: true });

        show(0);
        var back = viewer('gallery', GALLERY.folder, wrap);

        // Panah keyboard (dilepas lagi saat viewer ditutup).
        function onKey(e) {
          if (e.key === 'ArrowLeft') show(idx - 1);
          else if (e.key === 'ArrowRight') show(idx + 1);
        }
        document.addEventListener('keydown', onKey);
        viewCleanup = function () { document.removeEventListener('keydown', onKey); };

        (photos.length > 1 ? next : back).focus({ preventScroll: true });
      }

      /* ---------- 3. Video ---------- */
      function openVideo() {
        markOpened('video', 'FILE OPENED: ' + VIDEO.filename);
        var wrap = U.el('div', 'vid');
        var box = U.el('div', 'vid__box');
        var status = U.el('p', 'vid__status', 'LOADING VIDEO...');
        var v = document.createElement('video');
        var closed = false;

        v.className = 'vid__el';
        v.controls = true;
        v.preload = 'metadata';
        v.setAttribute('playsinline', '');
        v.setAttribute('aria-label', VIDEO.filename);

        v.addEventListener('loadedmetadata', function () {
          status.hidden = true;
          if (v.videoWidth && v.videoHeight) v.style.aspectRatio = v.videoWidth + ' / ' + v.videoHeight;
        });
        v.addEventListener('error', function () {
          if (closed) return;
          v.hidden = true;
          status.hidden = true;
          var ph = U.el('div', 'vid__ph');
          ph.setAttribute('role', 'status');
          ph.appendChild(U.el('p', 'vid__t1', 'NO SIGNAL'));
          ph.appendChild(U.el('p', 'vid__t2', VIDEO.filename + ' was not found or can\u2019t be played.'));
          ph.appendChild(U.el('p', 'vid__t3', 'ADD YOUR VIDEO AT: ' + VIDEO.src));
          ph.appendChild(U.el('p', 'vid__t4', 'Use .mp4 (H.264) so it plays on every browser and phone.'));
          box.appendChild(ph);
          ctx.say('VIDEO FILE NOT FOUND. ADD IT AT ' + VIDEO.src + ' AND REFRESH.', 'warn');
        });
        // Musik latar dijeda selama video diputar, lalu lanjut lagi.
        v.addEventListener('play', function () { A.hold(true); });
        v.addEventListener('pause', function () { A.hold(false); });
        v.addEventListener('ended', function () { A.hold(false); });

        box.appendChild(v);
        box.appendChild(status);
        wrap.appendChild(box);
        if (VIDEO.caption) wrap.appendChild(U.el('p', 'vid__cap', VIDEO.caption));

        var back = viewer('video', VIDEO.filename, wrap);
        v.src = VIDEO.src;                       // set setelah masuk DOM supaya event error pasti tertangkap
        viewCleanup = function () {
          closed = true;
          try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) { /* abaikan */ }
          A.hold(false);
        };
        back.focus({ preventScroll: true });
      }

      /* ---------- Ending ---------- */
      function runEnding() {
        if (endingCleanup) return;
        ctx.complete({ silent: true });          // idempotent: replay tidak memberi hadiah ganda
        A.hold(false);
        ctx.say('ALL MISSIONS CLEARED. HAPPY BIRTHDAY, ' + CFG.player.codename + '.', 'ok');

        var P = CFG.player;
        var SEQ = [
          { t: 'ALL MISSIONS CLEARED', c: 'h' },
          { t: 'PLAYER LEVEL: ' + P.level },
          { t: 'ARCHIVE STATUS: COMPLETE', c: 'ok' },
          { gap: true },
          { t: 'PRAY HAS BEEN RESCUED.' },
          { t: 'MEMORIES HAVE BEEN RECOVERED.' },
          { t: 'BIRTHDAY PROTOCOL: COMPLETE.' },
          { gap: true },
          { t: 'HAPPY BIRTHDAY, ' + P.codename + '.', c: 'big', sfx: 'final', fx: true, burst: true, wait: 1700 },   // konfeti meledak
          { cake: true, wait: 1600 },                                                                              // lalu kue muncul
          { t: '[ FINAL SAVE COMPLETE ]', c: 'save' }
        ];

        var ov = U.el('div', 'fin');
        ov.setAttribute('role', 'dialog');
        ov.setAttribute('aria-modal', 'true');
        ov.setAttribute('aria-label', 'Final ending');
        ov.innerHTML = '<div class="fin__fx" aria-hidden="true"></div><div class="fin__col"></div>' +
                       '<button type="button" class="btn btn--ghost btn--sm fin__skip">SKIP</button>';
        document.body.appendChild(ov);
        document.documentElement.classList.add('is-ending');

        var confetti = U.el('div', 'fin__confetti');
        confetti.setAttribute('aria-hidden', 'true');
        ov.appendChild(confetti);
        var col = ov.querySelector('.fin__col');
        var fx = ov.querySelector('.fin__fx');
        var skip = ov.querySelector('.fin__skip');
        var steps = [];
        var fxTimer = null, fxCount = 0, finished = false;

        SEQ.forEach(function (st) {
          var n;
          if (st.gap) {
            n = U.el('div', 'fin__gap');
          } else if (st.cake) {
            // CAMIIT dan Pray memegang kue ulang tahun. Dua frame sprite berbeda di bagian api, dipakai bergantian (api berkedip).
            n = U.el('div', 'fin__hug');
            var items = S.inventory().map(function (r) { return '<span>' + SASMIT.sprites.svg(r.id, '') + '</span>'; }).join('');
            n.innerHTML = '<div class="fin__cake" role="img" aria-label="CAMIIT and Pray holding a birthday cake with lit candles">' +
                            '<span class="f1">' + SASMIT.sprites.svg('cake-duo', '') + '</span>' +
                            '<span class="f2">' + SASMIT.sprites.svg('cake-duo2', '') + '</span>' +
                          '</div>' +
                          '<div class="fin__items" role="img" aria-label="All ' + S.COUNT + ' rewards collected">' + items + '</div>';
          } else {
            n = U.el('p', 'fin__l' + (st.c ? ' fin__l--' + st.c : ''), st.t);
          }
          n.classList.add('is-wait');
          col.appendChild(n);
          steps.push({ el: n, st: st });
        });

        var actions = U.el('div', 'fin__actions is-wait');
        var back = U.el('button', 'btn', 'BACK TO ARCHIVE');
        var again = U.el('button', 'btn btn--ghost', 'REPLAY ENDING');
        back.type = again.type = 'button';
        actions.appendChild(back); actions.appendChild(again);
        col.appendChild(actions);

        function spawnFx() {
          var still = U.reducedMotion();
          if (!still && fx.children.length > 24) return;
          var pick = Math.random();
          var kind = pick < 0.55 ? 'heart' : pick < 0.8 ? 'star' : pick < 0.9 ? 'heart-o' : 'sparkle';
          var d = U.el('span', 'fin__p');
          d.innerHTML = sprite(kind);
          d.style.left = U.rand(3, 94).toFixed(1) + '%';
          d.style.width = (Math.round(U.rand(6, 14)) * 2) + 'px';
          if (still) {
            d.style.top = Math.round(U.rand(8, 88)) + '%';
            d.style.bottom = 'auto';
          } else {
            d.style.setProperty('--dx', Math.round(U.rand(-30, 30)) + 'px');
            d.style.animationDuration = U.rand(5, 9).toFixed(1) + 's';
            setTimeout(function () { d.remove(); }, 9200);
          }
          fx.appendChild(d);
          fxCount++;
        }
        function startFx() {
          if (fxTimer || fxCount) return;
          if (U.reducedMotion()) { for (var i = 0; i < 14; i++) spawnFx(); return; }
          for (var j = 0; j < 4; j++) spawnFx();
          fxTimer = setInterval(spawnFx, 340);
          intervals.push(fxTimer);
        }

        // Konfeti pixel meledak keluar dari tengah kue, lalu jatuh. Kembang api kecil menyusul dari kiri dan kanan.
        var CONF = ['#ffd66b', '#ff9fc4', '#71dcff', '#8cf4ce', '#e8504f', '#eef8ff'];
        function burstAt(x, y, n) {
          for (var k = 0; k < n; k++) {
            var c = U.el('i', 'fin__cf');
            var ang = Math.random() * Math.PI * 2, spd = U.rand(90, 260);
            var sz = Math.round(U.rand(3, 6)) * 2;
            c.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + sz + 'px;height:' + sz + 'px;background:' + CONF[k % CONF.length] + ';' +
                              '--dx:' + Math.round(Math.cos(ang) * spd) + 'px;--dy:' + Math.round(Math.sin(ang) * spd - 90) + 'px;' +
                              '--rot:' + Math.round(U.rand(-540, 540)) + 'deg;animation-duration:' + U.rand(2.4, 3.8).toFixed(2) + 's;';
            confetti.appendChild(c);
            setTimeout(function (el) { el.remove(); }.bind(null, c), 4000);
          }
        }
        function confettiBurst() {
          if (U.reducedMotion()) return;
          var cakeEl = ov.querySelector('.fin__cake');
          var r = cakeEl ? cakeEl.getBoundingClientRect() : null;
          var x = r && r.width ? r.left + r.width / 2 : window.innerWidth / 2;
          var y = r && r.height ? r.top + r.height / 2 : window.innerHeight / 2;
          burstAt(x, y, 90);
          setTimeout(function () { burstAt(window.innerWidth * 0.15, window.innerHeight * 0.6, 40); }, 450);
          setTimeout(function () { burstAt(window.innerWidth * 0.85, window.innerHeight * 0.6, 40); }, 650);
        }

        function reveal(i) {
          var s = steps[i];
          s.el.classList.remove('is-wait');
          s.el.classList.add('is-on');
          if (s.st.sfx) ctx.sfx(s.st.sfx);
          if (s.st.fx) startFx();
          if (s.st.burst) confettiBurst();
          if (s.st.cake) ctx.sfx('hug');
        }

        function showActions() {
          if (finished) return;
          finished = true;
          actions.classList.remove('is-wait');
          actions.classList.add('is-on');
          skip.hidden = true;
          back.focus({ preventScroll: true });
          ov.scrollTop = ov.scrollHeight;
        }

        // Jadwal tampil: tiap baris muncul bergantian seperti kredit game.
        if (U.reducedMotion()) {
          steps.forEach(function (s, i) { reveal(i); });
          startFx();
          showActions();
        } else {
          var t = 600;
          steps.forEach(function (s, i) {
            later(function () { reveal(i); ov.scrollTop = ov.scrollHeight; }, t);
            t += s.st.gap ? 350 : (s.st.wait || 850);
          });
          later(showActions, t + 300);
        }

        skip.addEventListener('click', function () {
          timers.forEach(clearTimeout); timers = [];
          steps.forEach(function (s, i) { if (s.el.classList.contains('is-wait')) reveal(i); });
          startFx();
          showActions();
        });

        function onKey(e) {
          if (e.key !== 'Escape') return;
          if (finished) closeEnding(true); else skip.click();
        }
        document.addEventListener('keydown', onKey);

        function closeEnding(toHub) {
          if (!endingCleanup) return;
          endingCleanup = null;
          document.removeEventListener('keydown', onKey);
          clearInterval(fxTimer);
          ov.remove();
          document.documentElement.classList.remove('is-ending');
          if (toHub) hub('video');
        }
        endingCleanup = function () { closeEnding(false); };

        back.addEventListener('click', function () { ctx.sfx('click'); closeEnding(true); });
        again.addEventListener('click', function () { ctx.sfx('click'); closeEnding(false); runEnding(); });
        skip.focus({ preventScroll: true });
      }

      /* ---------- Mulai ---------- */
      sync();
      if (!ctx.isCompleted() && count() === 0) {
        intro();
      } else {
        if (ctx.isCompleted()) ctx.say('FINAL SAVE FILE ALREADY COMPLETE. OPEN ANY FILE AGAIN, OR PLAY THE ENDING.');
        hub();
      }
    },

    unmount: function () {
      timers.forEach(clearTimeout); timers = [];
      intervals.forEach(clearInterval); intervals = [];
      if (viewCleanup) { try { viewCleanup(); } catch (e) { /* abaikan */ } viewCleanup = null; }
      if (endingCleanup) endingCleanup();
      document.documentElement.classList.remove('is-ending');
      A.hold(false);
    }
  });
})();
