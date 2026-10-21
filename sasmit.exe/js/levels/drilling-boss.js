/*
 * Level 05 — DRILLING.EXE (boss fight + cutscene penyelamatan)
 * Cerita: Pray terjebak di dalam mesin bor. Pemain mengendalikan CAMIIT untuk menyelamatkannya.
 * Setelah boss kalah: mesin mati -> Pray bebas -> mereka bertemu -> berpelukan -> hati pixel ->
 * "MISSION COMPLETE" -> Final Access Key terbuka -> level dianggap selesai.
 * Mekanik combat TIDAK berubah dari Stage 2; hanya narasi, visual, dan akhir pertarungan.
 *
 * Pemain harus menyerang aktif; boss tidak pernah kehilangan HP sendiri.
 *  - 3 serangan dengan cooldown + 1 tombol BLOCK. Boss mengumumkan serangannya (WARNING)
 *    lalu menghantam 1 detik kemudian: BLOCK tepat waktu = nol damage.
 *  - Serangan berat membuat boss pingsan dan membatalkan serangannya.
 *  - Kalau HP pemain habis: SYSTEM REBOOT (HP pulih, HP boss tetap). Setiap reboot membuat boss
 *    sedikit lebih lemah, jadi pemain tidak mungkin buntu selamanya.
 * Angka keseimbangan ada di CONFIG; ubah di sana kalau terasa terlalu mudah/sulit.
 */
(function () {
  'use strict';
  var SASMIT = window.SASMIT;
  var U = SASMIT.util;

  var CONFIG = {
    bossHp: 600,
    playerHp: 100,
    attackGap: [3.0, 4.0],       // jeda antar serangan boss (detik)
    warnTime: 1.0,               // lama peringatan sebelum boss memukul
    blockTime: 0.9,              // lama perisai aktif
    blockCooldown: 1.8,
    stunTime: 2.5,
    assistPerReboot: 0.25,       // pengurang damage boss tiap reboot
    maxAssist: 0.5
  };

  var MOVES = [
    { id: 'MARAH', key: '1', name: 'BBY MARAH YA', note: 'Quick hit', dmg: 9, cd: 0.8,
      msg: 'BBY MARAH YA! A clean, respectful hit.' },
    { id: 'gundar', key: '2', name: 'SAYANG NANTI MAM KESINI YU', note: 'Solid hit', dmg: 22, cd: 3.2,
      msg: 'SAYANG NANTI MAM KESINI YU! Critical question!' },
    { id: 'CANTIK', key: '3', name: 'SAYANG KAMU CANTIK BANGET', note: 'Heavy, stuns boss', dmg: 42, cd: 8,
      stun: true, msg: 'SAYANG KAMU CANTIK BANGET! The boss is dazed.' }
  ];
  var BOSS_ATTACKS = [
    { name: 'DRILL SPIN', dmg: 14 },
    { name: 'MUD SPLASH', dmg: 12 },
    { name: 'PRESSURE SURGE', dmg: 18 }
  ];

  // Dialog Pray selama pertarungan (gelembung kecil di dekat kurungan).
  var PRAY_LINES = {
    warn:   ['Camiit, awas!', 'Tahan dulu!', 'Hati-hati!'],
    stun:   ['Bagus! Lagi!', 'Dia goyang!'],
    ko:     ['CAMIIT!! Bangun!', 'Camiit... jangan pergi...'],
    reboot: ['Jangan nyerah!', 'Aku di sini. Ayo lagi!'],
    low:    ['Dikit lagi bby!']
  };

  // Durasi cutscene (ms). Total sekitar 15 detik; tombol SKIP tersedia.
  var CUT = { free: 2300, walk: 4300, hug: 6900, end: 12200, done: 15200 };

  var raf = null, onKey = null;
  var timers = [], heartTimer = null, sayTimer = null;

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function at(ms, fn) { var t = setTimeout(fn, ms); timers.push(t); return t; }

  SASMIT.registerLevel(5, {
    mount: function (stage, ctx) {
      var S = { bossHp: CONFIG.bossHp, hp: CONFIG.playerHp, running: false, over: false,
                cd: {}, block: 0, blockCd: 0, nextAtk: 2.5, warn: 0, pending: null,
                stun: 0, reboots: 0, rebootT: 0, last: 0, talkCd: 0, lowSaid: false };
      MOVES.forEach(function (m) { S.cd[m.id] = 0; });
      // Boss sudah dikalahkan tapi cutscene belum selesai (mis. halaman di-refresh/pindah level):
      // progres boss tersimpan penuh, jadi langsung lanjutkan ke cutscene tanpa mengulang pertarungan.
      var saved = ctx.getProgress();
      var resumeCut = !ctx.isCompleted() && saved.total === CONFIG.bossHp && saved.done >= CONFIG.bossHp;
      if (!ctx.isCompleted() && !resumeCut) ctx.setProgress(0, CONFIG.bossHp);

      var wrap = U.el('div', 'boss');
      wrap.innerHTML =
        '<div class="boss__top"><div class="boss__row"><span class="boss__name">DRILLING.EXE</span><span class="boss__sub">PRAY IS TRAPPED INSIDE</span></div>' +
          '<div class="bar bar--boss" role="progressbar" aria-label="Boss HP" aria-valuemin="0" aria-valuemax="' + CONFIG.bossHp + '" aria-valuenow="' + CONFIG.bossHp + '"><i></i></div></div>' +
        '<div class="arena" id="arena">' +
          '<div class="arena__warn" id="b-warn" hidden></div>' +
          '<div class="arena__boss" id="b-boss">' + SASMIT.sprites.svg('boss-drill', 'Drilling machine boss') + '</div>' +
          '<div class="arena__pray" id="b-pray"><span class="pray__spr">' + SASMIT.sprites.svg('pray', 'Pray, trapped by the drilling machine') + '</span>' +
            '<span class="pray__tears" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
            '<span class="cage" aria-hidden="true"></span><span class="arena__tag" aria-hidden="true">PRAY</span></div>' +
          '<p class="arena__say" id="b-say" role="status" hidden></p>' +
          '<div class="arena__fx" id="b-fx" aria-hidden="true"></div>' +
          '<div class="arena__me" id="b-me"><span class="me__spr">' + SASMIT.sprites.svg('player', '') + '</span>' +
            '<span class="me__stars" aria-hidden="true"><i>' + SASMIT.sprites.svg('star', '') + '</i><i>' + SASMIT.sprites.svg('star', '') + '</i><i>' + SASMIT.sprites.svg('star', '') + '</i></span>' +
            '<span class="arena__shield" id="b-shield"></span></div>' +
          '<p class="arena__ko" id="b-ko" aria-hidden="true" hidden>K.O.</p>' +
          '<div class="arena__hp"><span>HP</span><div class="bar bar--me" role="progressbar" aria-label="Player HP" aria-valuemin="0" aria-valuemax="' + CONFIG.playerHp + '" aria-valuenow="' + CONFIG.playerHp + '"><i></i></div></div>' +
          '<div class="arena__start" id="b-start"><p>PRAY IS TRAPPED INSIDE DRILLING.EXE.</p>' +
            '<p>Only CAMIIT can get Pray out.</p>' +
            '<p class="arena__keys">Tap the buttons, or press 1 2 3 and 4.</p>' +
            '<button type="button" class="btn btn--lg" id="b-go">START RESCUE</button></div>' +
        '</div>' +
        '<p class="sr-only" id="b-live" role="status"></p>' +
        '<div class="moves" id="b-moves"></div>';
      stage.appendChild(wrap);

      var $ = function (id) { return wrap.querySelector(id); };
      var arena = $('#arena'), bossEl = $('#b-boss'), fx = $('#b-fx'), warn = $('#b-warn');
      var meEl = $('#b-me'), shield = $('#b-shield'), live = $('#b-live'), sayEl = $('#b-say');
      var prayEl = $('#b-pray'), koEl = $('#b-ko');
      var bossBar = wrap.querySelector('.bar--boss'), meBar = wrap.querySelector('.bar--me');
      var btns = {};

      // ---- Tombol aksi ----
      var movesBox = $('#b-moves');
      MOVES.concat([{ id: 'block', key: '4', name: 'BLOCK', note: 'Raise shield', cd: CONFIG.blockCooldown }]).forEach(function (m) {
        var b = U.el('button', 'move' + (m.id === 'block' ? ' move--block' : ''));
        b.type = 'button';
        b.disabled = true;
        b.innerHTML = '<span class="move__key">' + m.key + '</span><span class="move__name">' + m.name +
                      '</span><span class="move__note">' + m.note + '</span><span class="move__cd"></span>';
        b.addEventListener('click', function () { act(m.id); });
        movesBox.appendChild(b);
        btns[m.id] = b;
      });

      function floatText(text, cls, x) {
        var f = U.el('span', 'fx ' + cls, text);
        f.style.left = (x || 50) + '%';
        fx.appendChild(f);
        setTimeout(function () { f.remove(); }, 900);
      }
      function announce(t) { live.textContent = t; }
      function prayTalk(kind, force) {
        if (S.over) return;
        if (!force && S.talkCd > 0) return;
        var line = U.pick(PRAY_LINES[kind]);
        S.talkCd = 7;
        sayEl.textContent = line; sayEl.hidden = false;
        clearTimeout(sayTimer);
        sayTimer = setTimeout(function () { sayEl.hidden = true; }, 1900);
        ctx.say('PRAY: "' + line + '"');
      }
      // K.O.: CAMIIT tumbang (mata > <, bintang berputar), Pray menangis. Permainan tetap lanjut setelah reboot.
      function setSprite(box, sel, name) { box.querySelector(sel).innerHTML = SASMIT.sprites.svg(name, ''); }
      function setKO(on) {
        meEl.classList.toggle('is-ko', on);
        prayEl.classList.toggle('is-cry', on);
        koEl.hidden = !on;
        setSprite(meEl, '.me__spr', on ? 'player-ko' : 'player');
        setSprite(prayEl, '.pray__spr', on ? 'pray-cry' : 'pray');
        if (!on) { meEl.classList.remove('is-up'); void meEl.offsetWidth; meEl.classList.add('is-up'); }
      }

      function render() {
        bossBar.firstChild.style.width = Math.max(0, S.bossHp / CONFIG.bossHp * 100) + '%';
        bossBar.setAttribute('aria-valuenow', Math.max(0, Math.round(S.bossHp)));
        meBar.firstChild.style.width = Math.max(0, S.hp / CONFIG.playerHp * 100) + '%';
        meBar.setAttribute('aria-valuenow', Math.max(0, Math.round(S.hp)));
        MOVES.forEach(function (m) { cdView(m.id, S.cd[m.id], m.cd); });
        cdView('block', S.blockCd, CONFIG.blockCooldown);
        shield.classList.toggle('is-on', S.block > 0);
        bossEl.classList.toggle('is-stunned', S.stun > 0);
      }
      function cdView(id, left, total) {
        var b = btns[id];
        var ready = left <= 0 && S.running && !S.over;
        b.disabled = !S.running || S.over;
        b.classList.toggle('is-cool', left > 0);
        b.querySelector('.move__cd').style.transform = 'scaleY(' + Math.max(0, left / total) + ')';
      }

      // ---- Aksi pemain ----
      function act(id) {
        if (!S.running || S.over) return;
        if (id === 'block') {
          if (S.blockCd > 0) return;
          S.block = CONFIG.blockTime; S.blockCd = CONFIG.blockCooldown;
          ctx.sfx('click');
          return;
        }
        var m = MOVES.filter(function (x) { return x.id === id; })[0];
        if (S.cd[id] > 0) return;
        S.cd[id] = m.cd;
        S.bossHp -= m.dmg;
        bossEl.classList.remove('is-hit'); void bossEl.offsetWidth; bossEl.classList.add('is-hit');
        floatText('-' + m.dmg, 'fx--dmg', U.rand(35, 65));
        ctx.sfx('ok');
        if (m.id !== 'greenflag') ctx.say(m.msg, 'ok');
        if (m.stun) {
          S.stun = CONFIG.stunTime;
          prayTalk('stun', true);
          if (S.pending) { S.pending = null; S.warn = 0; warn.hidden = true; floatText('INTERRUPTED!', 'fx--msg'); }
        }
        ctx.setProgress(Math.min(CONFIG.bossHp, CONFIG.bossHp - Math.max(0, S.bossHp)), CONFIG.bossHp);
        if (S.bossHp <= 0) win();
        else if (!S.lowSaid && S.bossHp < CONFIG.bossHp * 0.25) { S.lowSaid = true; prayTalk('low', true); }
      }

      function win() {
        S.over = true; S.bossHp = 0; render();
        setKO(false);
        bossEl.classList.add('is-dead');
        warn.hidden = true; sayEl.hidden = true;
        ctx.sfx('down');
        ctx.say('DRILLING.EXE DEFEATED.', 'ok');
        announce('Drilling.exe defeated.');
        at(1700, function () { startCutscene(false); });   // setelah animasi boss hancur
      }

      // ---- Cutscene penyelamatan ----
      // Urutan: mesin mati -> kurungan terbuka (PRAY RESCUED) -> CAMIIT & Pray berjalan saling mendekati
      // -> pelukan + hati pixel -> MISSION COMPLETE -> ctx.complete() (Final Access Key terbuka).
      // Kelas fase (is-free, is-walk, is-hug, is-end) ditambahkan bertahap; animasinya ada di style.css.
      function startCutscene(resumed) {
        movesBox.hidden = true;
        warn.hidden = true; sayEl.hidden = true;
        var sp = SASMIT.sprites;
        var hrow = ['heart-o', 'heart-o', 'heart', 'heart-o', 'heart-o'].map(function (n, i) {
          return '<span class="' + (n === 'heart' ? 'is-lit' : '') + '">' + sp.svg(n, '') + '</span>';
        }).join('');

        var cut = U.el('div', 'cut');
        cut.innerHTML =
          '<div class="cut__boss">' + sp.svg('boss-drill', '') + '</div>' +
          '<div class="cut__pray">' + sp.svg('pray', 'Pray') + '<span class="cage" aria-hidden="true"></span></div>' +
          '<div class="cut__me">' + sp.svg('player', 'CAMIIT') + '</div>' +
          '<div class="cut__hug">' + sp.svg('hug', 'CAMIIT and Pray hugging') + '</div>' +
          '<div class="cut__hearts" aria-hidden="true"></div>' +
          '<div class="cut__hrow" aria-hidden="true">' + hrow + '</div>' +
          '<p class="cut__line" hidden><span class="cut__who"></span><span class="cut__txt"></span></p>' +
          '<div class="cut__end">' +
            '<p class="cut__t1">MISSION COMPLETE</p><p>PRAY HAS BEEN RESCUED.</p><p>FINAL ACCESS KEY UNLOCKED.</p>' +
            '<div class="cut__key">' + sp.svg('final-access-key', '') + '</div></div>' +
          '<button type="button" class="btn btn--ghost btn--sm cut__skip">SKIP</button>';
        arena.appendChild(cut);

        var heartsBox = cut.querySelector('.cut__hearts');
        var lineEl = cut.querySelector('.cut__line');
        var whoEl = cut.querySelector('.cut__who'), txtEl = cut.querySelector('.cut__txt');
        var skip = cut.querySelector('.cut__skip');
        var finished = false, spawned = 0;

        function phase(name) { cut.classList.add('is-' + name); }
        function setLine(who, text, kind) {
          lineEl.hidden = !text;
          lineEl.className = 'cut__line' + (kind ? ' is-' + kind : '');
          whoEl.textContent = who ? who + ':' : '';
          txtEl.textContent = text;
          if (text) announce((who ? who + ': ' : '') + text);
        }

        function spawnHeart() {
          var still = U.reducedMotion();
          if (!still && heartsBox.children.length > 14) return;
          var h = U.el('span', 'cut__heart');
          h.innerHTML = sp.svg(Math.random() < 0.3 ? 'heart-o' : 'heart', '');
          h.style.left = U.rand(32, 68).toFixed(1) + '%';
          h.style.width = (Math.round(U.rand(7, 15)) * 2) + 'px';
          if (still) {
            h.style.bottom = Math.round(U.rand(170, 270)) + 'px';   // tanpa animasi: hati diam di sekitar pelukan
          } else {
            h.style.setProperty('--dx', Math.round(U.rand(-26, 26)) + 'px');
            h.style.animationDuration = U.rand(2.8, 4.2).toFixed(2) + 's';
            var el = h;
            setTimeout(function () { el.remove(); }, 4400);
          }
          heartsBox.appendChild(h);
          if (spawned++ % 4 === 0) ctx.sfx('heart');
        }

        function startHearts() {
          if (U.reducedMotion()) { for (var i = 0; i < 7; i++) spawnHeart(); return; }
          spawnHeart();
          heartTimer = setInterval(spawnHeart, 380);
        }

        function finish() {
          if (finished) return;
          finished = true;
          clearTimers();
          clearInterval(heartTimer); heartTimer = null;
          ctx.complete();                       // Level 05 selesai -> Final Access Key -> tombol NEXT LEVEL
        }

        function toEnd(wait) {
          phase('end');
          setLine('', '');
          skip.textContent = 'CONTINUE';
          ctx.sfx('win');
          ctx.say('MISSION COMPLETE. PRAY HAS BEEN RESCUED.', 'ok');
          announce('Mission complete. Pray has been rescued. Final access key unlocked.');
          at(wait, finish);
        }

        skip.addEventListener('click', function () {
          if (finished) return;
          if (cut.classList.contains('is-end')) { finish(); return; }
          clearTimers();
          phase('free'); phase('walk'); phase('hug');
          var sub2 = wrap.querySelector('.boss__sub');
          if (sub2) sub2.textContent = 'PRAY IS FREE';
          if (!heartTimer) startHearts();
          toEnd(2200);
        });

        // ---- Jadwal adegan ----
        setLine('SYSTEM', 'DRILLING.EXE: SHUTTING DOWN...');
        if (resumed) ctx.say('DRILLING.EXE IS ALREADY DOWN. CONTINUING THE RESCUE.');
        else ctx.say('DRILLING.EXE: SHUTTING DOWN...');
        at(CUT.free, function () {
          phase('free');
          var sub = wrap.querySelector('.boss__sub');
          if (sub) sub.textContent = 'PRAY IS FREE';
          setLine('SYSTEM', 'PRAY RESCUED.', 'ok');
          ctx.say('PRAY RESCUED.', 'ok');
          ctx.sfx('ok');
        });
        at(CUT.walk, function () {
          phase('walk');
          setLine('CAMIIT', '"sini pyuk."');
          ctx.say('CAMIIT: "sini pyuk."');
        });
        at(CUT.hug, function () {
          phase('hug');
          setLine('', '');
          ctx.sfx('hug');
          startHearts();
        });
        at(CUT.end, function () { toEnd(CUT.done - CUT.end); });
        skip.focus({ preventScroll: true });
      }

      // ---- Boss ----
      function startAttack() {
        S.pending = U.pick(BOSS_ATTACKS);
        S.warn = CONFIG.warnTime;
        warn.hidden = false;
        warn.textContent = 'WARNING: ' + S.pending.name + '!';
        announce('Warning: ' + S.pending.name + '. Press block!');
        prayTalk('warn');
        bossEl.classList.add('is-charging');
      }

      function resolveAttack() {
        var atk = S.pending; S.pending = null; warn.hidden = true;
        bossEl.classList.remove('is-charging');
        bossEl.classList.remove('is-lunge'); void bossEl.offsetWidth; bossEl.classList.add('is-lunge');
        if (S.block > 0) {
          floatText('BLOCKED!', 'fx--msg');
          ctx.sfx('click');
        } else {
          var assist = Math.min(CONFIG.maxAssist, S.reboots * CONFIG.assistPerReboot);
          var dmg = Math.round(atk.dmg * (1 - assist));
          S.hp -= dmg;
          floatText('-' + dmg, 'fx--hurt', 22);
          arena.classList.remove('is-shake'); void arena.offsetWidth; arena.classList.add('is-shake');
          ctx.sfx('bad');
          if (S.hp <= 0) reboot();
        }
        S.nextAtk = U.rand(CONFIG.attackGap[0], CONFIG.attackGap[1]);
      }

      function reboot() {
        S.reboots++;
        S.rebootT = 3.2;                              // sedikit lebih lama supaya animasi K.O. sempat terlihat
        setKO(true);
        ctx.sfx('down');
        S.pending = null; S.warn = 0; warn.hidden = true;
        ctx.say('K.O.! CAMIIT IS DOWN AND PRAY IS CRYING... SYSTEM REBOOT. HP RESTORED, THE BOSS KEEPS ITS DAMAGE.', 'warn');
        announce('K.O. CAMIIT is down and Pray is crying. System reboot, health will be restored.');
        floatText('REBOOTING...', 'fx--msg');
        prayTalk('ko', true);
      }

      // ---- Game loop ----
      function frame(now) {
        raf = requestAnimationFrame(frame);
        var dt = Math.min(0.1, (now - (S.last || now)) / 1000); S.last = now;
        if (!S.running || S.over) return;

        MOVES.forEach(function (m) { S.cd[m.id] = Math.max(0, S.cd[m.id] - dt); });
        S.talkCd = Math.max(0, S.talkCd - dt);
        S.block = Math.max(0, S.block - dt);
        S.blockCd = Math.max(0, S.blockCd - dt);

        if (S.rebootT > 0) {                         // jeda reboot: boss tidak menyerang
          S.rebootT -= dt;
          if (S.rebootT <= 0) { S.hp = CONFIG.playerHp; S.nextAtk = 2.5; setKO(false); prayTalk('reboot', true); }
        } else if (S.stun > 0) {
          S.stun -= dt;
        } else if (S.pending) {
          S.warn -= dt;
          if (S.warn <= 0) resolveAttack();
        } else {
          S.nextAtk -= dt;
          if (S.nextAtk <= 0) startAttack();
        }
        render();
      }

      onKey = function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        var map = { '1': 'greenflag', '2': 'gundar', '3': 'pertamina', '4': 'block' };
        if (map[e.key] && S.running) { act(map[e.key]); }
      };
      document.addEventListener('keydown', onKey);

      $('#b-go').addEventListener('click', function () {
        $('#b-start').remove();
        S.running = true;
        S.last = 0;
        ctx.sfx('click');
        ctx.say('BATTLE START. HIT HARD, BLOCK ON WARNING.');
        render();
        btns.greenflag.focus({ preventScroll: true });
      });

      // ?dev=1 saja: langsung kalahkan boss untuk menguji cutscene.
      if (SASMIT.devTools) {
        var dev = U.el('button', 'btn btn--ghost btn--sm', 'DEV: DEFEAT BOSS');
        dev.type = 'button';
        dev.addEventListener('click', function () {
          $('#b-start').remove();
          S.running = true; S.bossHp = 1;
          act('greenflag');
        });
        $('#b-start').appendChild(dev);
      }

      render();
      raf = requestAnimationFrame(frame);

      if (resumeCut) {
        $('#b-start').remove();
        S.over = true; S.bossHp = 0; render();
        bossEl.hidden = true;
        startCutscene(true);
      }
    },
    unmount: function () {
      clearTimers();
      clearInterval(heartTimer); heartTimer = null;
      clearTimeout(sayTimer); sayTimer = null;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      if (onKey) document.removeEventListener('keydown', onKey);
      onKey = null;
    }
  });
})();
