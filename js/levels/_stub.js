/*
 * _stub.js — penampung sementara untuk level yang belum dibangun (Stage 2).
 * Setiap file level memanggil SASMIT.createStubLevel(id); akan diganti game sungguhan di Stage 2.
 * Tombol "DEV: COMPLETE LEVEL" hanya muncul kalau URL memakai ?dev=1.
 */
(function () {
  'use strict';
  var SASMIT = (window.SASMIT = window.SASMIT || {});

  SASMIT.createStubLevel = function () {
    return {
      mount: function (stage, ctx) {
        ctx.setProgress(0, 1);
        var box = document.createElement('div');
        box.className = 'stub';
        box.innerHTML = '<p class="stub__title">LEVEL UNDER CONSTRUCTION</p>' +
                        '<p>This mission is still being built.</p>';
        if (SASMIT.devTools) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn btn--ghost btn--sm';
          btn.textContent = 'DEV: COMPLETE LEVEL';
          btn.addEventListener('click', function () { ctx.complete(); });
          box.appendChild(btn);
        }
        stage.appendChild(box);
      }
    };
  };
})();
