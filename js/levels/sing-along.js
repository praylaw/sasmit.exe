/*
 * Level 03 — SING ALONG (menggantikan BUSY MODE)
 * Beberapa baris lirik tampil dari awal; sisanya tertutup. Sasmit harus menyalakan mic dan
 * menyanyikan bagian yang hilang. Setiap baris terbuka setelah suara terdeteksi cukup lama.
 *
 * Yang dideteksi adalah ADA/TIDAKNYA SUARA (volume lewat Web Audio), bukan ketepatan kata atau nada.
 * Browser tidak bisa menilai nyanyian dengan andal, dan dengan cara ini game tidak pernah salah menolak.
 *
 * - Musik latar dikecilkan (CONFIG.singalong.musicVolume) begitu bagian nyanyi dimulai.
 * - Tidak ada waktu habis dan tidak ada kegagalan: level ini tidak bisa buntu.
 * - Mic ditolak/tidak ada/file dibuka dari konteks yang tidak aman? Pakai BUTTON MODE (tombol toggle).
 * - Isi lirik ada di js/config.js -> SASMIT_CONFIG.singalong (shown / hidden).
 */
(function () {
  'use strict';
  var SASMIT = window.SASMIT;
  var U = SASMIT.util;
  var A = SASMIT.audio;
  var CONFIG = window.SASMIT_CONFIG.singalong || {};

  var SHOWN = CONFIG.shown || [];
  var HIDDEN = CONFIG.hidden || [];
  var NEED = CONFIG.secondsPerLine || 2.2;          // detik suara per baris
  var DUCK = typeof CONFIG.musicVolume === 'number' ? CONFIG.musicVolume : 0.06;
  var HOLD = 0.3;                                    // toleransi jeda napas (detik) supaya animasi tidak putus-putus
  var BARS = 14;

  var raf = null, timers = [], noteTimer = null;
  var mic = null;                                    // { stream, ctx, analyser, buf }

  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }

  function stopMic() {
    if (!mic) return;
    try { mic.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { /* abaikan */ }
    try { mic.ctx.close(); } catch (e2) { /* abaikan */ }
    mic = null;
  }

  SASMIT.registerLevel(3, {
    mount: function (stage, ctx) {
      var total = HIDDEN.length;
      var state = 'intro';                           // intro -> ready -> count -> sing -> done
      var useButton = false;                         // BUTTON MODE
      var manualOn = false;                          // toggle di BUTTON MODE
      var revealed = 0, lineT = 0, voicedHold = 0, level = 0, thr = 0.04, last = 0;
      if (!ctx.isCompleted()) ctx.setProgress(0, Math.max(1, total));

      var wrap = U.el('div', 'sing');
      wrap.innerHTML =
        '<p class="sing__goal">Turn on your <strong>mic</strong>, Sasmit. Sing the <strong>missing lyrics</strong>.</p>' +
        '<div class="sing__main">' +
          '<section class="lyr panel panel--dark" aria-label="Lyrics">' +
            '<span class="tab">NOW SINGING</span>' +
            '<h3 class="lyr__title"></h3>' +
            '<ol class="lyr__list" id="lyr-list"></ol>' +
          '</section>' +
          '<aside class="singer" aria-label="Sasmit singing">' +
            '<div class="singer__stage" id="singer-stage">' +
              '<div class="singer__light" aria-hidden="true"></div>' +
              '<div class="singer__notes" id="singer-notes" aria-hidden="true"></div>' +
              '<div class="singer__who" id="singer-who" aria-hidden="true">' +
                '<span class="f1">' + SASMIT.sprites.svg('player-sing', '') + '</span>' +
                '<span class="f2">' + SASMIT.sprites.svg('player-sing2', '') + '</span>' +
              '</div>' +
              '<div class="singer__count" id="singer-count" hidden></div>' +
            '</div>' +
            '<div class="meter" aria-hidden="true" id="meter"></div>' +
            '<p class="singer__status" id="sing-status" role="status"></p>' +
          '</aside>' +
        '</div>' +
        '<div class="sing__ctl" id="sing-ctl"></div>';
      stage.appendChild(wrap);

      var $ = function (id) { return wrap.querySelector(id); };
      var list = $('#lyr-list'), meter = $('#meter'), statusEl = $('#sing-status'), ctl = $('#sing-ctl');
      var who = $('#singer-who'), notesEl = $('#singer-notes'), countEl = $('#singer-count');
      wrap.querySelector('.lyr__title').textContent = (CONFIG.title || 'SING ALONG').toUpperCase();

      for (var b = 0; b < BARS; b++) meter.appendChild(document.createElement('i'));
      var bars = meter.children;

      /* ---------- Lirik ---------- */
      var lines = [];                                // elemen <li> untuk baris tersembunyi
      SHOWN.forEach(function (t) {
        var li = U.el('li', 'lyr__l is-shown');
        li.textContent = t;
        list.appendChild(li);
      });
      HIDDEN.forEach(function (t, i) {
        var li = U.el('li', 'lyr__l is-hidden');
        var mask = U.el('span', 'lyr__mask');
        mask.style.width = Math.min(30, Math.max(8, t.length)) + 'ch';
        mask.setAttribute('role', 'img');
        mask.setAttribute('aria-label', 'Missing lyric line ' + (i + 1));
        var bar = U.el('span', 'lyr__bar');
        bar.appendChild(document.createElement('i'));
        li.appendChild(mask); li.appendChild(bar);
        li.setAttribute('data-text', t);
        list.appendChild(li);
        lines.push(li);
      });
      function markActive() {
        lines.forEach(function (li, i) { li.classList.toggle('is-active', state === 'sing' && i === revealed); });
      }
      function reveal(i) {
        var li = lines[i];
        li.classList.remove('is-hidden', 'is-active');
        li.classList.add('is-revealed');
        li.textContent = li.getAttribute('data-text');
        ctx.sfx('ok');
      }

      function setStatus(t) { statusEl.textContent = t; }

      /* ---------- Tombol kontrol ---------- */
      function btn(label, cls, fn) {
        var b2 = U.el('button', 'btn' + (cls ? ' ' + cls : ''), label);
        b2.type = 'button';
        b2.addEventListener('click', fn);
        ctl.appendChild(b2);
        return b2;
      }
      var focusFirst = function () { var f = ctl.querySelector('button'); if (f) f.focus({ preventScroll: true }); };

      function showIntro() {
        state = 'intro'; ctl.innerHTML = '';
        setStatus('Mic is off.');
        btn('TURN ON MIC', 'btn--lg', askMic);
        btn('NO MIC? BUTTON MODE', 'btn--ghost', function () { useButton = true; showReady(); });
        focusFirst();
      }

      function askMic() {
        var md = navigator.mediaDevices;
        if (!md || !md.getUserMedia || !window.isSecureContext) {
          ctx.say('MIC IS NOT AVAILABLE HERE (needs https or opening the file locally). USE BUTTON MODE.', 'warn');
          setStatus('Mic unavailable in this browser. Use BUTTON MODE.');
          return;
        }
        setStatus('Waiting for mic permission...');
        md.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
          .then(function (stream) {
            var AC = window.AudioContext || window.webkitAudioContext;
            var ac = new AC();
            var src = ac.createMediaStreamSource(stream);
            var an = ac.createAnalyser();
            an.fftSize = 1024; an.smoothingTimeConstant = 0.4;
            src.connect(an);
            mic = { stream: stream, ctx: ac, analyser: an, buf: new Float32Array(an.fftSize) };
            if (ac.state === 'suspended') ac.resume();
            ctx.sfx('ok');
            ctx.say('MIC ON. SAY SOMETHING TO TEST IT.', 'ok');
            showReady();
          })
          .catch(function () {
            ctx.sfx('bad');
            ctx.say('MIC BLOCKED. ALLOW IT IN YOUR BROWSER, OR USE BUTTON MODE.', 'warn');
            setStatus('Mic blocked. Allow it in the address bar, or use BUTTON MODE.');
          });
      }

      function showReady() {
        state = 'ready'; ctl.innerHTML = '';
        setStatus(useButton ? 'BUTTON MODE. Tap SING to sing, tap again to pause.' : 'Mic is on. Say something and watch the meter.');
        btn('START SINGING', 'btn--lg', startCount);
        if (!useButton) btn('USE BUTTON MODE', 'btn--ghost', function () { useButton = true; stopMic(); showReady(); });
        focusFirst();
      }

      /* ---------- Hitung mundur + kalibrasi ---------- */
      function startCount() {
        state = 'count'; ctl.innerHTML = '';
        A.duck(DUCK);                                // musik latar dikecilkan sebelum bernyanyi
        ctx.say('MUSIC TURNED DOWN. GET READY TO SING.', 'ok');
        setStatus('Get ready...');
        var noise = [], n = 3;
        countEl.hidden = false;
        function tick() {
          if (n === 0) {
            countEl.hidden = true;
            if (noise.length) {                       // ambang suara = kebisingan ruangan x 2.5, dibatasi
              var avg = noise.reduce(function (a, v) { return a + v; }, 0) / noise.length;
              thr = Math.max(0.03, Math.min(0.2, avg * 2.5 + 0.015));
            }
            beginSing();
            return;
          }
          countEl.textContent = String(n);
          countEl.classList.remove('is-pop'); void countEl.offsetWidth; countEl.classList.add('is-pop');
          ctx.sfx('click');
          n--;
          later(tick, 900);
        }
        // kumpulkan sampel kebisingan selama hitung mundur
        var sampler = setInterval(function () { if (mic) noise.push(readLevel()); }, 80);
        timers.push(sampler);
        tick();
        later(function () { clearInterval(sampler); }, 3000);
      }

      function beginSing() {
        state = 'sing'; ctl.innerHTML = '';
        revealed = 0; lineT = 0;
        markActive();
        ctx.say('SING THE MISSING LINES!', 'ok');
        setStatus(useButton ? 'Tap SING and keep singing.' : 'Sing! Keep your voice going to open each line.');
        if (useButton) {
          var tgl = btn('SING', 'btn--lg', function () {
            manualOn = !manualOn;
            tgl.textContent = manualOn ? 'SINGING... TAP TO PAUSE' : 'SING';
            tgl.setAttribute('aria-pressed', manualOn ? 'true' : 'false');
          });
          tgl.setAttribute('aria-pressed', 'false');
          tgl.focus({ preventScroll: true });
        }
        noteTimer = setInterval(spawnNote, 360);
      }

      /* ---------- Mic: tingkat suara 0..1 ---------- */
      function readLevel() {
        if (!mic) return 0;
        mic.analyser.getFloatTimeDomainData(mic.buf);
        var sum = 0;
        for (var i = 0; i < mic.buf.length; i++) sum += mic.buf[i] * mic.buf[i];
        return Math.sqrt(sum / mic.buf.length);
      }

      /* ---------- Not balok melayang di samping Sasmit ---------- */
      var NOTE_SPRITES = ['note-beam', 'note-one-p', 'note-one', 'note-beam-p'];
      function spawnNote() {
        if (voicedHold <= 0 || notesEl.children.length > 10) return;
        var n = U.el('i', 'singer__note');
        n.innerHTML = SASMIT.sprites.svg(U.pick(NOTE_SPRITES), '');
        n.style.setProperty('--dy', Math.round(U.rand(-20, 20)) + 'px');
        n.style.setProperty('--dur', U.rand(2.2, 3.2).toFixed(2) + 's');
        n.style.bottom = Math.round(U.rand(95, 130)) + 'px';
        notesEl.appendChild(n);
        setTimeout(function () { n.remove(); }, 3300);
        if (U.reducedMotion()) { n.style.left = Math.round(U.rand(52, 80)) + '%'; }
      }

      /* ---------- Loop ---------- */
      function frame(now) {
        raf = requestAnimationFrame(frame);
        var dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;

        var raw = 0, voiced = false;
        if (useButton) {
          voiced = state === 'sing' && manualOn;
          raw = voiced ? 0.35 + 0.25 * Math.sin(now / 90) : 0;
        } else if (mic) {
          raw = readLevel();
          voiced = raw > thr;
        }
        level += (Math.min(1, raw * 6) - level) * 0.35;         // haluskan meter
        for (var i = 0; i < BARS; i++) bars[i].classList.toggle('is-on', i < Math.round(level * BARS));

        if (voiced) voicedHold = HOLD; else voicedHold = Math.max(0, voicedHold - dt);
        who.classList.toggle('is-singing', voicedHold > 0 && state === 'sing');

        if (state === 'sing' && voiced) {
          lineT += dt;
          var li = lines[revealed];
          if (li) li.querySelector('.lyr__bar i').style.width = Math.min(100, lineT / NEED * 100) + '%';
          if (lineT >= NEED) {
            reveal(revealed); revealed++; lineT = 0;
            ctx.setProgress(revealed, total);
            markActive();
            if (revealed >= total) finish();
          }
        }
      }

      function finish() {
        state = 'done'; ctl.innerHTML = '';
        clearInterval(noteTimer); noteTimer = null;
        who.classList.remove('is-singing');
        A.duck(null);                                 // musik latar kembali normal
        stopMic();
        setStatus('All lyrics recovered!');
        ctx.say('ALL LYRICS RECOVERED. WHAT A VOICE.', 'ok');
        later(function () { ctx.complete(); }, 1800);
      }

      /* ---------- Mulai ---------- */
      if (!total) {
        // Tidak ada baris tersembunyi di config: jangan biarkan level buntu.
        setStatus('No hidden lyrics are set in js/config.js (singalong.hidden).');
        btn('FINISH LEVEL', 'btn--lg', function () { ctx.complete(); });
      } else {
        showIntro();
      }
      raf = requestAnimationFrame(frame);
      ctx.say('SOME LYRICS ARE MISSING. TURN ON THE MIC AND SING THEM, SASMIT.');
    },

    unmount: function () {
      if (raf) cancelAnimationFrame(raf); raf = null;
      timers.forEach(function (t) { clearTimeout(t); clearInterval(t); }); timers = [];
      clearInterval(noteTimer); noteTimer = null;
      A.duck(null);
      stopMic();
    }
  });
})();
