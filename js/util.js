/*
 * util.js — fungsi kecil yang dipakai banyak level.
 */
(function () {
  'use strict';
  var SASMIT = (window.SASMIT = window.SASMIT || {});

  SASMIT.util = {
    // Acak urutan array (Fisher–Yates), tidak mengubah array asli.
    shuffle: function (arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },
    // Buat elemen: el('div', 'kelas', 'teks')
    el: function (tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      return n;
    },
    rand: function (min, max) { return min + Math.random() * (max - min); },
    pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    reducedMotion: function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  };
})();
