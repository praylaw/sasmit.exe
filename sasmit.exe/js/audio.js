/*
 * audio.js — musik latar + efek suara kecil.
 * - Musik baru mulai setelah pemain menekan START (aturan autoplay browser).
 * - Kalau file musik tidak ada, game tetap jalan tanpa suara.
 */
(function () {
  'use strict';
  var SASMIT = (window.SASMIT = window.SASMIT || {});
  var CFG = window.SASMIT_CONFIG.audio;
  var S = SASMIT.state;

  var music = null;
  var missing = false;
  var unlocked = false;   // jadi true setelah ada klik pemain
  var held = false;       // true = musik dijeda sementara (mis. saat video diputar)
  var duckTo = null;      // angka 0..1 = volume musik sementara dikecilkan (mis. saat pemain bernyanyi)
  var fadeTimer = null;
  var actx = null;
  var listeners = [];

  function emit(name) { listeners.forEach(function (fn) { fn(name); }); }

  function ensureMusic() {
    if (music || !CFG.src) return;
    music = new window.Audio();
    music.loop = true;
    music.volume = duckTo === null ? CFG.volume : duckTo;
    music.preload = 'auto';
    music.addEventListener('error', function () { missing = true; emit('missing'); });
    music.src = CFG.src;
  }

  function play() {
    if (!unlocked || !S.get().soundOn || held) return;
    ensureMusic();
    if (!music || missing) return;
    var p = music.play();
    if (p && p.catch) p.catch(function () { /* diblokir browser: abaikan */ });
  }

  // Ubah volume musik pelan-pelan (fade) ke nilai target.
  function fadeTo(target) {
    clearInterval(fadeTimer);
    if (!music) return;
    fadeTimer = setInterval(function () {
      var d = target - music.volume;
      if (Math.abs(d) < 0.01) { music.volume = Math.max(0, Math.min(1, target)); clearInterval(fadeTimer); return; }
      music.volume = Math.max(0, Math.min(1, music.volume + (d > 0 ? 0.02 : -0.02)));
    }, 60);
  }

  // [frekuensi, mulai(detik), durasi(detik), tipe gelombang]
  var SFX = {
    click:  [[520, 0, 0.05, 'square']],
    ok:     [[660, 0, 0.08, 'square'], [880, 0.08, 0.12, 'square']],
    bad:    [[200, 0, 0.16, 'sawtooth']],
    locked: [[150, 0, 0.12, 'square'], [120, 0.12, 0.14, 'square']],
    win:    [[523, 0, 0.1, 'square'], [659, 0.1, 0.1, 'square'], [784, 0.2, 0.1, 'square'], [1047, 0.3, 0.25, 'square']],
    // Stage 3 (semua dibuat dari oscillator, tidak butuh file audio)
    down:   [[440, 0, 0.12, 'sawtooth'], [330, 0.12, 0.12, 'sawtooth'], [220, 0.24, 0.16, 'sawtooth'], [110, 0.4, 0.35, 'sawtooth']],
    hug:    [[392, 0, 0.22, 'triangle'], [494, 0.16, 0.22, 'triangle'], [587, 0.32, 0.22, 'triangle'], [784, 0.48, 0.5, 'triangle']],
    heart:  [[988, 0, 0.06, 'triangle'], [1319, 0.06, 0.12, 'triangle']],
    final:  [[523, 0, 0.12, 'square'], [659, 0.12, 0.12, 'square'], [784, 0.24, 0.12, 'square'], [1047, 0.36, 0.2, 'square'],
             [784, 0.62, 0.1, 'square'], [1047, 0.72, 0.1, 'square'], [1319, 0.84, 0.45, 'square']]
  };

  function sfx(name) {
    if (!unlocked || !S.get().soundOn || !SFX[name]) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t0 = actx.currentTime;
      SFX[name].forEach(function (n) {
        var osc = actx.createOscillator();
        var gain = actx.createGain();
        osc.type = n[3];
        osc.frequency.value = n[0];
        gain.gain.setValueAtTime(0.05, t0 + n[1]);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n[1] + n[2]);
        osc.connect(gain); gain.connect(actx.destination);
        osc.start(t0 + n[1]); osc.stop(t0 + n[1] + n[2] + 0.02);
      });
    } catch (e) { /* efek suara bersifat opsional */ }
  }

  SASMIT.audio = {
    // Panggil dari handler klik (mis. tombol START).
    unlock: function () { unlocked = true; play(); },
    setEnabled: function (on) {
      S.setSound(on);
      if (on) play(); else if (music) music.pause();
      emit('toggle');
    },
    // Jeda/lanjutkan musik latar tanpa mengubah pengaturan SOUND pemain.
    hold: function (on) {
      held = !!on;
      if (held) { if (music) music.pause(); } else play();
    },
    // Kecilkan musik latar ke volume tertentu (0..1); duck(null) mengembalikan ke volume normal.
    duck: function (vol) {
      duckTo = typeof vol === 'number' ? vol : null;
      fadeTo(duckTo === null ? CFG.volume : duckTo);
    },
    isEnabled: function () { return S.get().soundOn; },
    isMissing: function () { return missing; },
    sfx: sfx,
    subscribe: function (fn) { listeners.push(fn); }
  };
})();
