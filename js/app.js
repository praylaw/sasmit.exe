/*
 * app.js — mengatur layar boot, HUD, navigasi level, dialog, dan reset.
 * Logika tiap level ada di js/levels/*.js dan hanya berbicara dengan app lewat objek `ctx`.
 */
(function () {
  'use strict';

  var CFG = window.SASMIT_CONFIG;
  var SASMIT = window.SASMIT;
  var S = SASMIT.state;
  var A = SASMIT.audio;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel) { return document.querySelector(sel); }
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  var el = {
    boot: $('#boot'), game: $('#game'), bootGrid: $('#boot-grid'), term: $('#term'),
    startBtn: $('#start-btn'), newBtn: $('#new-game-btn'), titleBtn: $('#title-btn'),
    levels: $('#levels'), stage: $('#stage'), dialog: $('#dialog'),
    missionCode: $('#mission-code'), missionTitle: $('#mission-title'), missionDesc: $('#mission-desc'),
    progressText: $('#progress-text'), bar: $('#bar'), barFill: $('#bar-fill'),
    hintBtn: $('#hint-btn'), hint: $('#hint'),
    inventory: $('#inventory'), pips: $('#hud-pips'), slotCaption: $('#slot-caption'), resetBtn: $('#reset-btn'), confirm: $('#confirm-dialog'), saveNote: $('#save-note')
  };

  var activeId = null;    // level yang sedang terbuka
  var activeMod = null;   // modul level yang sedang ter-mount

  /* ================= Dialog / log pesan ================= */
  function say(text, kind) {
    var p = document.createElement('p');
    p.textContent = text;
    if (kind) p.className = 'is-' + kind;
    el.dialog.appendChild(p);
    while (el.dialog.children.length > 40) el.dialog.removeChild(el.dialog.firstChild);
    el.dialog.scrollTop = el.dialog.scrollHeight;
  }

  /* ================= Layar ================= */
  function showScreen(name) {
    el.boot.hidden = name !== 'boot';
    el.game.hidden = name !== 'game';
    window.scrollTo(0, 0);
  }

  /* ================= Boot (SCREEN 00) ================= */
  var LINES = [
    { t: 'INITIALIZING BIRTHDAY PROTOCOL...' },
    { t: 'LOADING MEMORY DATABASE ... OK', ok: true },
    { t: 'CALIBRATING PLAYER PROFILE ... OK', ok: true },
    { t: 'ONE SPECIAL PLAYER HAS ENTERED THE SYSTEM.', strong: true }
  ];
  var bootToken = 0;
  var bootSkip = null;

  function lineEl(l, text) {
    var d = document.createElement('div');
    d.className = 'line' + (l.ok ? ' is-ok' : '') + (l.strong ? ' is-strong' : '');
    d.textContent = '> ' + text;
    return d;
  }

  function setReveal(on) {
    document.querySelectorAll('[data-reveal]').forEach(function (n) { n.inert = !on; });
    el.bootGrid.classList.toggle('is-pending', !on);
  }

  function renderBootCta() {
    var started = S.get().started;
    el.startBtn.textContent = started ? 'CONTINUE' : 'START GAME';
    el.newBtn.hidden = !started;
  }

  function runBoot(instant) {
    var token = ++bootToken;
    el.term.innerHTML = '';
    setReveal(false);

    function finish() {
      if (token !== bootToken) return;
      bootToken++;              // batalkan timer yang masih menunggu
      bootSkip = null;
      el.term.innerHTML = '';
      LINES.forEach(function (l) { el.term.appendChild(lineEl(l, l.t)); });
      setReveal(true);
      if (!el.boot.hidden) el.startBtn.focus({ preventScroll: true });
    }

    if (instant || reduceMotion) { finish(); return; }

    bootSkip = finish;
    var li = 0, ci = 0, node = null;
    var cursor = document.createElement('span');
    cursor.className = 'cursor';

    (function tick() {
      if (token !== bootToken) return;
      if (li >= LINES.length) { setTimeout(finish, 450); return; }
      var line = LINES[li];
      if (!node) { node = lineEl(line, ''); el.term.appendChild(node); }
      ci++;
      node.textContent = '> ' + line.t.slice(0, ci);
      node.appendChild(cursor);
      if (ci >= line.t.length) { li++; ci = 0; node = null; setTimeout(tick, 280); }
      else setTimeout(tick, 24);
    })();
  }

  /* ================= Suara ================= */
  function renderSound() {
    var on = A.isEnabled();
    document.querySelectorAll('[data-sound-toggle]').forEach(function (b) {
      b.textContent = on ? 'SOUND: ON' : 'SOUND: OFF';
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', 'Sound ' + (on ? 'on' : 'off') + '. Press to turn ' + (on ? 'off' : 'on') + '.');
    });
  }

  /* ================= HUD ================= */
  function buildLevelNav() {
    S.LEVELS.forEach(function (lv) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="node__marker" aria-hidden="true">' + SASMIT.sprites.svg('arrow', '') + '</span>';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'node';
      b.setAttribute('data-id', lv.id);
      b.innerHTML = '<span class="node__num">' + pad(lv.id) + '</span><span class="node__state"></span>';
      b.addEventListener('click', function () { openLevel(lv.id); });
      li.appendChild(b);
      var name = document.createElement('span');
      name.className = 'node-label';
      name.setAttribute('aria-hidden', 'true');
      name.textContent = lv.short;
      li.appendChild(name);
      el.levels.appendChild(li);
    });
  }

  var DEFAULT_CAPTION = 'Clear levels to fill all six slots.';

  function buildInventory() {
    S.LEVELS.forEach(function (lv) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot';
      b.setAttribute('data-reward', lv.reward.id);
      b.setAttribute('data-level', lv.id);
      li.appendChild(b);
      el.inventory.appendChild(li);
    });
    for (var i = 0; i < S.COUNT; i++) {
      var pip = document.createElement('i');
      el.pips.appendChild(pip);
    }
    // Keterangan slot muncul saat disorot, difokus, atau diketuk.
    function caption(e) {
      var slot = e.target.closest('.slot');
      el.slotCaption.textContent = slot ? slot.getAttribute('data-caption') : DEFAULT_CAPTION;
    }
    el.inventory.addEventListener('mouseover', caption);
    el.inventory.addEventListener('focusin', caption);
    el.inventory.addEventListener('click', caption);
    el.inventory.addEventListener('mouseleave', caption);
    el.inventory.addEventListener('focusout', function () { el.slotCaption.textContent = DEFAULT_CAPTION; });
  }

  function renderHud() {
    // Peta level
    el.levels.querySelectorAll('.node').forEach(function (b) {
      var id = +b.getAttribute('data-id');
      var lv = S.getLevel(id);
      var locked = !S.isUnlocked(id);
      var done = S.isCompleted(id);
      var li = b.parentNode;
      b.classList.toggle('is-locked', locked);
      b.classList.toggle('is-current', id === activeId);
      li.classList.toggle('is-done', done);
      li.classList.toggle('is-current', id === activeId);
      li.querySelector('.node__marker').hidden = id !== activeId;
      b.setAttribute('aria-disabled', String(locked));
      if (id === activeId) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.setAttribute('aria-label', 'Level ' + id + ': ' + lv.title + ', ' + (locked ? 'locked' : done ? 'completed' : 'open'));
      b.querySelector('.node__state').innerHTML = locked ? SASMIT.sprites.svg('lock', '') : done ? SASMIT.sprites.svg('check', '') : '';
    });

    // Profil
    $('#hud-codename').textContent = CFG.player.codename;
    $('#hud-level').textContent = CFG.player.level;
    $('#hud-cleared').textContent = S.completedCount() + ' / ' + S.COUNT;
    el.pips.querySelectorAll('i').forEach(function (pip, i) { pip.classList.toggle('on', S.isCompleted(i + 1)); });

    // Inventaris (diturunkan dari level yang selesai, jadi tidak bisa dobel)
    el.inventory.querySelectorAll('.slot').forEach(function (slot) {
      var lv = S.getLevel(+slot.getAttribute('data-level'));
      var owned = S.isCompleted(lv.id);
      slot.classList.toggle('is-owned', owned);
      slot.setAttribute('data-caption', owned ? lv.reward.name : 'Empty. Clear level ' + pad(lv.id) + ' to fill this slot.');
      slot.innerHTML = (owned ? SASMIT.sprites.svg(lv.reward.id, '') : '<span class="slot__empty">?</span>') +
                       '<span class="sr-only">' + (owned ? lv.reward.name : 'Empty slot') + '</span>';
    });

    // Misi
    if (activeId) {
      var lvl = S.getLevel(activeId);
      var p = S.getProgress(activeId);
      var pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
      el.missionCode.textContent = 'LEVEL ' + pad(activeId) + ' / ' + pad(S.COUNT) + (S.isCompleted(activeId) ? '  ·  CLEARED' : '');
      el.missionTitle.textContent = lvl.title;
      el.missionDesc.textContent = lvl.mission;
      el.progressText.textContent = p.total ? p.done + ' / ' + p.total : '—';
      el.barFill.style.width = pct + '%';
      el.bar.setAttribute('aria-valuenow', String(pct));
    }
    el.saveNote.hidden = S.isPersistent();
  }

  function resetHint() {
    el.hint.hidden = true;
    el.hintBtn.setAttribute('aria-expanded', 'false');
    el.hint.textContent = activeId ? S.getLevel(activeId).hint : '';
  }

  /* ================= Level ================= */
  function teardown() {
    if (activeMod && typeof activeMod.unmount === 'function') activeMod.unmount();
    activeMod = null;
    el.stage.innerHTML = '';
  }

  /* ---------- Reaksi Pray di tiap akhir level ---------- */
  // sprite = nama sprite di sprites.js, jump = gaya lompatan (lihat .cheer--* di style.css),
  // fx = efek di sekitarnya, cap = ucapan Pray. Ubah di sini kalau mau reaksi lain.
  var REACTIONS = {
    1: { sprite: 'pray-sparkle', jump: 'high',  fx: 'sparkle',  label: 'Pray jumps with sparkling eyes',   cap: '"kamu inget semuanya! beneran bener semua!"' },
    2: { sprite: 'pray-cheer',   jump: 'arms',  fx: 'confetti', label: 'Pray jumps with both arms up',     cap: '"yeay! jawabannya bener semua!"' },
    3: { sprite: 'pray-heart',   jump: 'sway',  fx: 'notes',    label: 'Pray swoons with heart eyes',      cap: '"suara kamu... aaa, meleleh!"' },
    4: { sprite: 'pray-happy',   jump: 'hop',   fx: 'hearts',   label: 'Pray hops happily with rosy cheeks', cap: '"gemes banget! selamat tidur, gang!"' },
    5: { sprite: 'pray-joy',     jump: 'leap',  fx: 'mix',      label: 'Pray leaps with happy tears',      cap: '"makasih udah nyelametin aku..."' }
  };
  var CONFETTI = ['#ffd66b', '#ff9fc4', '#71dcff', '#8cf4ce', '#e8504f'];

  function buildCheer(id) {
    var r = REACTIONS[id];
    if (!r) return null;
    var fxList = {
      sparkle:  ['sparkle', 'sparkle', 'star', 'sparkle', 'star', 'sparkle'],
      confetti: [],
      notes:    ['note-beam', 'note-one-p', 'note-one', 'note-beam-p', 'note-one-p', 'note-beam'],
      hearts:   ['heart', 'heart-o', 'heart', 'heart', 'heart-o', 'heart'],
      mix:      ['heart', 'sparkle', 'star', 'heart', 'sparkle', 'heart']
    }[r.fx] || [];
    var parts = '';
    if (r.fx === 'confetti') {
      for (var c = 0; c < 14; c++) {
        parts += '<i class="cheer__cf" style="--x:' + Math.round(4 + c * 6.8) + '%;--dl:' + ((c * 0.23) % 1.6).toFixed(2) +
                 's;background:' + CONFETTI[c % CONFETTI.length] + '"></i>';
      }
    } else {
      fxList.forEach(function (n, i) {
        parts += '<i class="cheer__p" style="--x:' + (8 + i * 15) + '%;--dl:' + (i * 0.35).toFixed(2) + 's;--sx:' + (i % 2 ? 14 : -14) + 'px">' +
                 SASMIT.sprites.svg(n, '') + '</i>';
      });
    }
    var wrap = document.createElement('div');
    wrap.className = 'cheer cheer--' + r.jump;
    wrap.innerHTML =
      '<div class="cheer__stage" role="img" aria-label="' + r.label + '">' +
        '<div class="cheer__fx" aria-hidden="true">' + parts + '</div>' +
        '<span class="cheer__jump"><span class="cheer__spr">' + SASMIT.sprites.svg(r.sprite, '') + '</span></span>' +
        '<span class="cheer__shadow" aria-hidden="true"></span>' +
      '</div>' +
      '<p class="cheer__cap"><b>PRAY:</b> ' + r.cap + '</p>';
    return wrap;
  }

  function showComplete(id, firstTime) {
    var lv = S.getLevel(id);
    var next = id < S.COUNT ? id + 1 : null;
    var box = document.createElement('div');
    box.className = 'complete';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-labelledby', 'complete-title');
    box.innerHTML =
      '<h3 id="complete-title">LEVEL ' + pad(id) + ' CLEARED</h3>' +
      '<div class="complete__item">' + SASMIT.sprites.svg(lv.reward.id, '') + '</div>' +
      '<p class="complete__reward">' + (firstTime ? 'REWARD UNLOCKED: ' : 'ALREADY COLLECTED: ') + lv.reward.name + '</p>' +
      '<div class="complete__actions"></div>';
    var cheer = buildCheer(id);
    if (cheer) box.insertBefore(cheer, box.firstChild);
    var actions = box.querySelector('.complete__actions');

    function addBtn(label, ghost, fn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn' + (ghost ? ' btn--ghost' : '');
      b.textContent = label;
      b.addEventListener('click', fn);
      actions.appendChild(b);
      return b;
    }
    var first = null;
    if (next) first = addBtn('NEXT LEVEL', false, function () { openLevel(next); });
    var review = addBtn('STAY HERE', !!next, function () { box.remove(); el.missionTitle.focus(); });
    el.stage.appendChild(box);
    (first || review).focus();
  }

  function makeCtx(id) {
    return {
      id: id,
      level: S.getLevel(id),
      say: say,
      sfx: A.sfx,
      isCompleted: function () { return S.isCompleted(id); },
      getProgress: function () { return S.getProgress(id); },
      setProgress: function (done, total) { S.setProgress(id, done, total); },
      // opts.silent = true: level menampilkan layar penutupnya sendiri (dipakai Level 06),
      // jadi kartu "LEVEL CLEARED" bawaan tidak dimunculkan.
      complete: function (opts) {
        var silent = !!(opts && opts.silent);
        var r = S.completeLevel(id);
        if (!r) return;
        if (r.firstTime) { if (!silent) A.sfx('win'); say('REWARD UNLOCKED: ' + r.reward.name, 'ok'); }
        else if (!silent) say('LEVEL ALREADY CLEARED. REWARD IS ALREADY IN YOUR INVENTORY.');
        if (!silent) showComplete(id, r.firstTime);
      }
    };
  }

  function openLevel(id) {
    if (!S.isUnlocked(id)) {
      A.sfx('locked');
      say('LEVEL ' + pad(id) + ' IS LOCKED. CLEAR LEVEL ' + pad(id - 1) + ' FIRST.', 'warn');
      return false;
    }
    teardown();
    activeId = id;
    S.setCurrent(id);
    resetHint();
    renderHud();
    var mod = SASMIT.getLevelModule(id);
    if (mod) {
      activeMod = mod;
      mod.mount(el.stage, makeCtx(id));
    } else {
      el.stage.textContent = 'This level could not be loaded.';
    }
    A.sfx('click');
    say('LEVEL ' + pad(id) + ' LOADED: ' + S.getLevel(id).title + '.');
    el.missionTitle.focus({ preventScroll: true });
    return true;
  }

  /* ================= Reset ================= */
  function doReset() {
    teardown();
    activeId = null;
    S.reset();
    el.dialog.innerHTML = '';
    renderBootCta();
    showScreen('boot');
    runBoot();
  }

  function askReset() {
    if (typeof el.confirm.showModal !== 'function') {
      if (window.confirm('Reset all progress? This cannot be undone.')) doReset();
      return;
    }
    el.confirm.returnValue = '';
    el.confirm.showModal();
  }

  /* ================= Event ================= */
  function bind() {
    el.startBtn.addEventListener('click', function () {
      A.unlock();
      A.sfx('click');
      var firstRun = !S.get().started;
      S.markStarted();
      showScreen('game');
      openLevel(S.resumeLevel());
      say(firstRun ? 'WELCOME, ' + CFG.player.codename + '. YOUR MISSION BEGINS NOW.' : 'WELCOME BACK, ' + CFG.player.codename + '.', 'ok');
    });
    el.newBtn.addEventListener('click', askReset);
    el.resetBtn.addEventListener('click', askReset);
    el.confirm.addEventListener('close', function () { if (el.confirm.returnValue === 'confirm') doReset(); });

    el.titleBtn.addEventListener('click', function () {
      showScreen('boot');
      renderBootCta();
      runBoot(true);
    });

    document.querySelectorAll('[data-sound-toggle]').forEach(function (b) {
      b.addEventListener('click', function () { A.setEnabled(!A.isEnabled()); });
    });

    el.hintBtn.addEventListener('click', function () {
      var show = el.hint.hidden;
      el.hint.hidden = !show;
      el.hintBtn.setAttribute('aria-expanded', String(show));
    });

    // Lewati animasi boot dengan klik/tap atau tombol apa saja (kecuali Tab).
    el.boot.addEventListener('pointerdown', function () { if (bootSkip) bootSkip(); });
    document.addEventListener('keydown', function (e) { if (bootSkip && e.key !== 'Tab') bootSkip(); });

    // ?dev=1: tombol loncat level untuk menguji Level 05 / 06 tanpa mengulang dari awal.
    if (SASMIT.devTools) {
      [[5, 'DEV: GO TO LV 05'], [6, 'DEV: GO TO LV 06']].forEach(function (d) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn--ghost btn--block btn--sm';
        b.style.marginTop = '12px';
        b.textContent = d[1];
        b.addEventListener('click', function () {
          for (var i = 1; i < d[0]; i++) S.completeLevel(i);
          openLevel(d[0]);
        });
        el.resetBtn.parentNode.insertBefore(b, el.saveNote);
      });
    }

    S.subscribe(renderHud);
    A.subscribe(function (ev) {
      renderSound();
      if (ev === 'missing' && SASMIT.isDev) say('AUDIO FILE NOT FOUND (' + CFG.audio.src + '). THE GAME CONTINUES IN SILENCE.', 'warn');
    });
  }

  /* ================= Mulai ================= */
  function init() {
    SASMIT.sprites.mount(document);
    $('#boot-codename').textContent = CFG.player.codename;
    $('#boot-level').textContent = CFG.player.level;
    $('#boot-status').textContent = CFG.player.status;
    $('#boot-date').textContent = CFG.birthday.display;
    buildLevelNav();
    buildInventory();
    renderSound();
    renderBootCta();
    renderHud();
    el.slotCaption.textContent = DEFAULT_CAPTION;
    bind();
    showScreen('boot');
    runBoot();
  }

  init();
})();
