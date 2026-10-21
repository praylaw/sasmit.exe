/*
 * game-state.js — satu-satunya sumber kebenaran untuk progres game.
 * Semua level membaca/menulis progres lewat SASMIT.state, bukan variabel sendiri.
 */
(function () {
  'use strict';

  var CFG = window.SASMIT_CONFIG;
  var SASMIT = (window.SASMIT = window.SASMIT || {});

  // ?dev=1 menampilkan tombol bantu; localhost/file:// menampilkan pesan teknis (mis. audio hilang).
  SASMIT.devTools = /[?&]dev=1/.test(location.search);
  SASMIT.isDev = SASMIT.devTools || /^(localhost|127\.0\.0\.1|)$/.test(location.hostname);

  /* ---------- Registry level ---------- */
  var modules = {};
  SASMIT.registerLevel = function (id, mod) { modules[id] = mod; };
  SASMIT.getLevelModule = function (id) { return modules[id]; };

  /* ---------- Definisi level (teks misi, hint, hadiah) ---------- */
  var LEVELS = [
    { id: 1, short: 'MEMORY', title: 'MEMORY DATABASE',
      mission: 'Recover the corrupted memories by matching every pair of cards.',
      hint: 'Take your time. Wrong guesses cost nothing, so use them to learn where each card sits.',
      reward: { id: 'memory-fragment', name: 'Memory Fragment' } },
    { id: 2, short: 'PLAYER', title: 'PLAYER DIAGNOSTICS',
      mission: 'Answer four questions to verify the player profile.',
      hint: 'Wrong answers never lock you out. Pick again until the system accepts it.',
      reward: { id: 'player-verified', name: 'Verified Badge' } },
    { id: 3, short: 'SING', title: 'SING ALONG',
      mission: 'Some lyrics are missing. Turn on your mic and sing the missing part, Sasmit.',
      hint: 'Sing out loud until each hidden line opens. No mic? Use BUTTON MODE. Nothing here can make you fail.',
      reward: { id: 'quality-time', name: 'LEAD VOCALS +1' } },
    { id: 4, short: 'PLUSHIES', title: 'PLUSHIE GANG',
      mission: 'Find all six plushies, then say goodnight to the gang.',
      hint: 'Click every plushie first. Once all six are found, type goodnight (or tap the GOODNIGHT button) to tuck them in.',
      reward: { id: 'plushie-approved', name: 'PLUSHIE GANG APPROVED' } },
    { id: 5, short: 'DRILLING', title: 'DRILLING.EXE',
      mission: 'Pray is trapped inside the drilling machine. Defeat DRILLING.EXE and bring Pray home.',
      hint: 'Attacks recharge over time. Mix them up, tap BLOCK when the warning appears, and keep going. Pray is counting on you.',
      reward: { id: 'final-access-key', name: 'Final Access Key' } },
    { id: 6, short: 'SAVE FILE', title: 'FINAL SAVE FILE',
      mission: 'Open all three files in the archive.',
      hint: 'Each file opens a different section. Open them all to finish the game.',
      reward: { id: 'birthday-archive', name: 'Birthday Archive' } }
  ];
  var N = LEVELS.length;

  /* ---------- State ---------- */
  var state;
  var listeners = [];
  var persistent = true; // false kalau localStorage diblokir (mis. mode private tertentu)

  function fresh() {
    return {
      version: 1,
      started: false,
      soundOn: true,
      current: 1,
      completed: {},   // { "1": true, ... }
      progress: {},    // { "1": {done, total} }
      archive: { letter: false, gallery: false, video: false }
    };
  }

  // Bersihkan data hasil localStorage supaya save yang rusak tidak merusak game.
  function sanitize(raw) {
    var s = fresh();
    if (!raw || typeof raw !== 'object') return s;
    s.started = raw.started === true;
    s.soundOn = raw.soundOn !== false;
    var prevDone = true;
    for (var i = 1; i <= N; i++) {
      // Level hanya dianggap selesai kalau level sebelumnya juga selesai (urutan tidak bisa dilompati).
      if (raw.completed && raw.completed[i] === true && prevDone) s.completed[i] = true;
      else prevDone = false;
      var p = raw.progress && raw.progress[i];
      if (p && typeof p.done === 'number' && typeof p.total === 'number') {
        s.progress[i] = { done: Math.max(0, p.done), total: Math.max(0, p.total) };
      }
    }
    var cur = parseInt(raw.current, 10);
    s.current = cur >= 1 && cur <= N ? cur : 1;
    ['letter', 'gallery', 'video'].forEach(function (k) {
      s.archive[k] = !!(raw.archive && raw.archive[k] === true);
    });
    return s;
  }

  function load() {
    try {
      var txt = localStorage.getItem(CFG.saveKey);
      return txt ? sanitize(JSON.parse(txt)) : fresh();
    } catch (e) {
      persistent = false;
      return fresh();
    }
  }

  function save() {
    try { localStorage.setItem(CFG.saveKey, JSON.stringify(state)); }
    catch (e) { persistent = false; }
  }

  function notify() { listeners.forEach(function (fn) { fn(state); }); }

  /* ---------- Aturan progres ---------- */
  function getLevel(id) { return LEVELS[id - 1]; }
  function isCompleted(id) { return state.completed[id] === true; }
  function isUnlocked(id) { return id === 1 || (id > 1 && id <= N && isCompleted(id - 1)); }

  function firstOpenLevel() {
    for (var i = 1; i <= N; i++) if (isUnlocked(i) && !isCompleted(i)) return i;
    return N;
  }

  function completeLevel(id) {
    if (!isUnlocked(id)) return null;
    var reward = getLevel(id).reward;
    if (isCompleted(id)) return { firstTime: false, reward: reward }; // replay: tidak ada hadiah ganda
    state.completed[id] = true;
    var p = state.progress[id];
    state.progress[id] = { done: p && p.total ? p.total : 1, total: p && p.total ? p.total : 1 };
    save();
    notify();
    return { firstTime: true, reward: reward };
  }

  // Inventaris diturunkan dari level yang selesai, jadi hadiah tidak mungkin terhitung dua kali.
  function inventory() {
    return LEVELS.filter(function (l) { return isCompleted(l.id); })
                 .map(function (l) { return l.reward; });
  }

  SASMIT.state = {
    LEVELS: LEVELS,
    COUNT: N,
    getLevel: getLevel,
    get: function () { return state; },
    isUnlocked: isUnlocked,
    isCompleted: isCompleted,
    completedCount: function () { return LEVELS.filter(function (l) { return isCompleted(l.id); }).length; },
    completeLevel: completeLevel,
    inventory: inventory,
    resumeLevel: function () { return isUnlocked(state.current) ? state.current : firstOpenLevel(); },
    isPersistent: function () { return persistent; },

    getProgress: function (id) { return state.progress[id] || { done: 0, total: 0 }; },
    setProgress: function (id, done, total) {
      if (isCompleted(id)) return; // level selesai selalu penuh
      state.progress[id] = { done: done, total: total };
      save(); notify();
    },
    setCurrent: function (id) { state.current = id; save(); },
    markStarted: function () { state.started = true; save(); },
    setSound: function (on) { state.soundOn = !!on; save(); notify(); },
    markArchive: function (key) {
      if (key in state.archive) { state.archive[key] = true; save(); notify(); }
    },
    reset: function () {
      try { localStorage.removeItem(CFG.saveKey); } catch (e) { /* abaikan */ }
      var keepSound = state.soundOn;
      state = fresh();
      state.soundOn = keepSound; // preferensi suara tetap dipertahankan
      save(); notify();
    },
    subscribe: function (fn) { listeners.push(fn); }
  };

  state = load();
})();
