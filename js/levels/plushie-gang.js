/*
 * Level 04 — PLUSHIE GANG
 * 1) Temukan enam plushie di kamar pixel (klik masing-masing).
 * 2) Setelah semuanya ditemukan, pemain mengucapkan GOODNIGHT (ketik pesan, atau tekan tombol cepat).
 * 3) Plushie pindah ke kasur, berbaring, kamar menjadi gelap, dan huruf "zzz" melayang.
 * Sprite-nya orisinal (placeholder): untuk memakai gambar sendiri, ganti isi <span class="plush__art">.
 * x / y = posisi kaki karakter dalam persen dari ukuran kamar.
 */
(function () {
  'use strict';
  var SASMIT = window.SASMIT;
  var U = SASMIT.util;

  var CAST = [
    { id: 'cidut',   name: 'Cidut',   note: 'Chubby chicken',      sprite: 'plush-cidut',   x: 83, y: 39, line: 'Cip cip! Aku bulet seperti daddy' },
    { id: 'mpun',    name: 'Mpun',    note: 'Lupi from Pororo',    sprite: 'plush-mpun',    x: 13, y: 84, line: 'Mpun hadir. Siapa yang nyariin aku?' },
    { id: 'blubub',  name: 'Blubub',  note: 'Soft pink bunny',     sprite: 'plush-blubub',  x: 45, y: 90, line: 'Blub blub... boleh pyuk nda' },
    { id: 'milop',   name: 'Milop',   note: 'Long-eared teddy',    sprite: 'plush-milop',   x: 88, y: 91, line: 'Milop semanis miloo' },
    { id: 'tulalit', name: 'Tulalit', note: 'Mofusand in a frog hat', sprite: 'plush-tulalit', x: 31, y: 38, line: 'Tulalit! aku suka ngelag XD' },
    { id: 'jenitsu', name: 'Jenitsu', note: 'Chibi Zenitsu',       sprite: 'plush-jenitsu', x: 63, y: 76, line: 'H-hah?! nande?! Jangan bilang nezuko!' }
  ];

  // Posisi tidur (titik TENGAH tiap plushie, persen dari kamar). Dua baris, tiga plushie per baris.
  var SLEEP_WIDE   = [[30, 68], [50, 68], [70, 68], [30, 88], [50, 88], [70, 88]];
  var SLEEP_NARROW = [[24, 66], [50, 66], [76, 66], [24, 88], [50, 88], [76, 88]];   // layar sempit (HP)

  // Kata/kalimat yang diterima sebagai ucapan selamat malam (huruf besar/kecil bebas).
  var GOODNIGHT = /good\s*night|goodnight|\bgn\b|\bnite\b|night|selamat\s*(malam|tidur)|met\s*(malam|bobo|tidur)|malam|bobo|tidur/i;

  var TOTAL = CAST.length + 1;      // 6 plushie ditemukan + 1 ucapan goodnight
  var timers = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }

  SASMIT.registerLevel(4, {
    mount: function (stage, ctx) {
      var found = {};
      var count = 0;
      var asleep = false;
      var btns = {};
      if (!ctx.isCompleted()) ctx.setProgress(0, TOTAL);

      var wrap = U.el('div', 'plush');
      wrap.innerHTML =
        '<div class="room" id="room">' +
          '<div class="room__window" aria-hidden="true"></div>' +
          '<div class="room__shelf" aria-hidden="true"></div>' +
          '<div class="room__rug" aria-hidden="true"></div>' +
          '<div class="room__bed" aria-hidden="true"></div>' +
        '</div>' +
        '<p class="plush__count" id="plush-count"></p>' +
        '<form class="goodnight" id="gn" hidden novalidate>' +
          '<label class="goodnight__label" for="gn-input">THE GANG IS SLEEPY. SAY GOODNIGHT.</label>' +
          '<div class="goodnight__row"><input id="gn-input" type="text" maxlength="60" autocomplete="off" placeholder="type goodnight..." />' +
          '<button type="submit" class="btn btn--sm">SEND</button></div>' +
          '<button type="button" class="btn btn--ghost btn--sm" id="gn-quick">JUST SAY "GOODNIGHT"</button>' +
          '<p class="goodnight__hint" id="gn-hint" role="status"></p>' +
        '</form>' +
        '<p class="sr-only" id="plush-live" role="status"></p>' +
        '<ul class="roster" id="roster"></ul>';
      stage.appendChild(wrap);

      var room = wrap.querySelector('#room');
      var roster = wrap.querySelector('#roster');
      var countEl = wrap.querySelector('#plush-count');
      var form = wrap.querySelector('#gn');
      var input = wrap.querySelector('#gn-input');
      var hint = wrap.querySelector('#gn-hint');
      var live = wrap.querySelector('#plush-live');

      var bubble = U.el('div', 'bubble');
      bubble.hidden = true;
      bubble.setAttribute('role', 'status');
      var dark = U.el('div', 'room__dark');
      dark.setAttribute('aria-hidden', 'true');
      room.appendChild(dark);
      room.appendChild(bubble);

      var bubbleTimer = null;
      // Gelembung di atas karakter (c = {name, line, x, y}); anchorH = tinggi sprite.
      function showBubble(c, anchorH, ms) {
        bubble.innerHTML = '<b></b><span></span>';
        bubble.firstChild.textContent = c.name;
        bubble.lastChild.textContent = c.line;
        bubble.hidden = false;
        var rw = room.clientWidth, bw = Math.min(220, rw - 16);
        bubble.style.width = bw + 'px';
        var cx = rw * c.x / 100;
        bubble.style.left = Math.max(8, Math.min(rw - bw - 8, cx - bw / 2)) + 'px';
        bubble.style.top = Math.max(4, room.clientHeight * c.y / 100 - anchorH - bubble.offsetHeight - 18) + 'px';
        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(function () { bubble.hidden = true; }, ms || 4200);
        timers.push(bubbleTimer);
      }

      function update(text) {
        countEl.textContent = text || ('DISCOVERED ' + count + ' / ' + CAST.length);
      }

      /* ---------- Tahap 1: menemukan plushie ---------- */
      CAST.forEach(function (c, i) {
        var b = U.el('button', 'plush__btn');
        b.type = 'button';
        b.style.left = c.x + '%';
        b.style.top = c.y + '%';
        b.innerHTML = '<span class="plush__art">' + SASMIT.sprites.svg(c.sprite, '') + '</span>';
        b.setAttribute('aria-label', 'Plushie ' + (i + 1) + ', not found yet');
        room.appendChild(b);
        btns[c.id] = b;

        var li = U.el('li', 'roster__slot');
        li.innerHTML = '<span class="roster__art">' + SASMIT.sprites.svg(c.sprite, '') + '</span><span class="roster__name">???</span>';
        roster.appendChild(li);

        b.addEventListener('click', function () {
          if (asleep) { showBubble({ name: c.name, line: 'Zzz... zzz...', x: sleepX(i), y: sleepY(i) }, 40, 2200); return; }
          b.classList.remove('is-wiggle'); void b.offsetWidth; b.classList.add('is-wiggle');
          showBubble(c, b.offsetHeight);
          if (found[c.id]) { ctx.sfx('click'); return; }
          found[c.id] = true; count++;
          b.classList.add('is-found');
          b.setAttribute('aria-label', c.name + ', found');
          li.classList.add('is-on');
          li.querySelector('.roster__name').textContent = c.name;
          li.title = c.note;
          ctx.sfx('ok');
          ctx.setProgress(count, TOTAL);
          ctx.say(c.name.toUpperCase() + ' JOINED THE GANG: "' + c.line + '"', 'ok');
          update();
          if (count === CAST.length) allFound();
        });
      });

      var plant = U.el('div', 'room__plant');
      plant.setAttribute('aria-hidden', 'true');
      room.appendChild(plant);

      /* ---------- Tahap 2: ucapkan goodnight ---------- */
      function allFound() {
        update('ALL SIX FOUND. THEY LOOK SLEEPY...');
        ctx.say('ALL SIX FOUND. THE GANG IS YAWNING. SAY GOODNIGHT TO TUCK THEM IN.', 'ok');
        live.textContent = 'All six plushies found. Type goodnight or press the goodnight button to tuck them in.';
        later(function () {
          form.hidden = false;
          // Jangan memaksa keyboard layar muncul di HP: fokus otomatis hanya untuk mouse.
          if (window.matchMedia('(pointer: fine)').matches) input.focus({ preventScroll: true });
        }, 900);
      }

      function setHint(t) { hint.textContent = t; }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (asleep) return;
        var text = input.value.trim();
        if (!text) { setHint('Say something first. Type goodnight, or tap the button.'); input.focus(); return; }
        if (!GOODNIGHT.test(text)) {
          ctx.sfx('bad');
          setHint('The gang is still awake. They are waiting for a goodnight...');
          input.focus();
          return;
        }
        tuckIn(text);
      });
      wrap.querySelector('#gn-quick').addEventListener('click', function () { if (!asleep) tuckIn('goodnight'); });

      /* ---------- Tahap 3: plushie tidur ---------- */
      function narrow() { return room.clientWidth < 520; }
      function spots() { return narrow() ? SLEEP_NARROW : SLEEP_WIDE; }
      function sleepX(i) { return spots()[i][0]; }
      function sleepY(i) { return spots()[i][1]; }

      function tuckIn(text) {
        asleep = true;
        input.disabled = true;
        form.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
        setHint('');
        ctx.sfx('ok');
        ctx.say('CAMIIT: "' + text + '"', 'ok');
        showBubble({ name: 'CAMIIT', line: text, x: 50, y: 22 }, 0, 3200);
        ctx.setProgress(CAST.length + 1, TOTAL);
        update('SHHH... THE GANG IS FALLING ASLEEP');

        room.classList.add('is-night');
        later(function () { form.hidden = true; }, 600);

        var S = spots();
        var STEP = 380, START = 900, TRAVEL = 1100;
        CAST.forEach(function (c, i) {
          var b = btns[c.id];
          later(function () {
            b.classList.add('is-sleeping');
            b.style.setProperty('--rot', (i % 2 === 0 ? 90 : -90) + 'deg');   // kepala menghadap tengah
            b.style.left = S[i][0] + '%';
            b.style.top = S[i][1] + '%';
            b.setAttribute('aria-label', c.name + ', sleeping');
            ctx.sfx('click');
          }, START + i * STEP);
          later(function () { addZzz(S[i][0], S[i][1], i); }, START + i * STEP + TRAVEL);
        });

        var done = START + (CAST.length - 1) * STEP + TRAVEL + 400;
        later(function () {
          update('ALL ASLEEP. GOODNIGHT.');
          ctx.say('THE PLUSHIE GANG IS ASLEEP. GOODNIGHT.', 'ok');
          live.textContent = 'All the plushies are asleep. Goodnight.';
        }, done);
        later(function () { ctx.complete(); }, done + 2800);
      }

      // Huruf "z z Z" yang melayang dari tiap plushie yang tidur (tetap tegak, tidak ikut berputar).
      function addZzz(x, y, i) {
        var z = U.el('span', 'zzz');
        z.setAttribute('aria-hidden', 'true');
        z.style.left = 'calc(' + x + '% + 14px)';
        z.style.top = 'calc(' + y + '% - 54px)';
        z.innerHTML = '<i>z</i><i>z</i><i>Z</i>';
        z.querySelectorAll('i').forEach(function (n, k) { n.style.animationDelay = (k * 0.55 + i * 0.17) + 's'; });
        room.appendChild(z);
      }

      update();
      ctx.say('SIX PLUSHIES ARE HIDING IN THIS ROOM. CLICK TO SAY HI.');
    },
    unmount: function () { timers.forEach(clearTimeout); timers = []; }
  });
})();
