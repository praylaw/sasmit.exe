/*
 * Level 01 — MEMORY DATABASE
 * Mencocokkan 4 pasang: gambar (ikon pixel) <-> keterangan teks.
 * Untuk mengubah isi kartu, edit PAIRS di bawah (ikon ada di js/sprites.js).
 */
(function () {
  'use strict';
  var SASMIT = window.SASMIT;
  var U = SASMIT.util;

  // Setiap pasang = satu kartu gambar + satu kartu teks (caption). `sub` opsional (baris kecil di bawah caption).
  var PAIRS = [
    { id: 'icecream', icon: 'icon-icecream', label: 'basement parking',         sub: '' },
    { id: 'hug',      icon: 'hug',           label: 'bby micuu',                sub: '' },
    { id: 'date',     icon: 'icon-date',     label: 'firstdate',                sub: '' },
    { id: 'heart',    icon: 'heart',         label: 'iloveu in every universe', sub: '' }
  ];
  var MISMATCH_DELAY = 900; // ms sebelum pasangan salah menutup lagi

  var timers = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }

  SASMIT.registerLevel(1, {
    mount: function (stage, ctx) {
      var matched = 0, moves = 0, first = null, locked = false;
      if (!ctx.isCompleted()) ctx.setProgress(0, PAIRS.length);

      var wrap = U.el('div', 'mem');
      var info = U.el('p', 'mem__info');
      var grid = U.el('div', 'mem__grid');
      wrap.appendChild(info);
      wrap.appendChild(grid);
      stage.appendChild(wrap);

      function updateInfo() { info.textContent = 'PAIRS ' + matched + ' / ' + PAIRS.length + '   MOVES ' + moves; }

      // Setiap pasangan = satu kartu gambar + satu kartu teks.
      var cards = [];
      PAIRS.forEach(function (p) {
        cards.push({ pair: p, kind: 'icon' });
        cards.push({ pair: p, kind: 'text' });
      });
      cards = U.shuffle(cards);

      function setLabel(c, i) {
        var what = c.kind === 'icon' ? 'picture card' : 'text card: ' + c.pair.label + (c.pair.sub ? ' ' + c.pair.sub : '');
        c.el.setAttribute('aria-label', 'Card ' + (i + 1) + ', ' +
          (c.open || c.done ? what + (c.done ? ', matched' : '') : 'face down'));
      }
      function show(c, open) {
        c.el.classList.toggle('is-open', open);
        setLabel(c, cards.indexOf(c));
      }

      cards.forEach(function (c, i) {
        var b = U.el('button', 'card3d');
        b.type = 'button';
        var face = c.kind === 'icon'
          ? SASMIT.sprites.svg(c.pair.icon, '')
          : '<span class="card3d__label">' + c.pair.label + '</span>' +
            (c.pair.sub ? '<span class="card3d__sub">' + c.pair.sub + '</span>' : '');
        b.innerHTML = '<span class="card3d__inner"><span class="card3d__back" aria-hidden="true">?</span>' +
                      '<span class="card3d__front">' + face + '</span></span>';
        c.el = b;
        if (SASMIT.devTools) b.setAttribute('data-pair', c.pair.id); // hanya untuk pengujian (?dev=1)
        setLabel(c, i);
        b.addEventListener('click', function () { flip(c); });
        grid.appendChild(b);
      });

      function flip(c) {
        if (locked || c.open || c.done) return;
        c.open = true; show(c, true); ctx.sfx('click');
        if (!first) { first = c; return; }

        moves++;
        var a = first; first = null;
        if (a.pair === c.pair) {
          a.done = c.done = true;
          matched++;
          show(a, true); show(c, true);
          a.el.classList.add('is-matched'); c.el.classList.add('is-matched');
          ctx.sfx('ok');
          ctx.setProgress(matched, PAIRS.length);
          ctx.say('MEMORY RECOVERED: ' + c.pair.label.toUpperCase() + '.', 'ok');
          if (matched === PAIRS.length) {
            locked = true;
            ctx.say('ALL MEMORIES RECOVERED IN ' + moves + ' MOVES.', 'ok');
            later(function () { ctx.complete(); }, 900);
          }
        } else {
          locked = true;
          ctx.sfx('bad');
          later(function () {
            a.open = c.open = false; show(a, false); show(c, false); locked = false;
          }, MISMATCH_DELAY);
        }
        updateInfo();
      }
      updateInfo();
    },
    unmount: function () { timers.forEach(clearTimeout); timers = []; }
  });
})();
