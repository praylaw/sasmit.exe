/*
 * Level 02 — PLAYER DIAGNOSTICS
 * Kuis 4 soal, satu per layar. Jawaban salah tidak menghukum: pilihan itu dinonaktifkan
 * dan pemain boleh mencoba lagi. Urutan pilihan diacak tiap kali.
 * Untuk mengubah soal, edit QUESTIONS (correct = teks yang benar).
 */
(function () {
  'use strict';
  var SASMIT = window.SASMIT;
  var U = SASMIT.util;

  var QUESTIONS = [
    { q: 'Which flavor wins every menu debate?',
      correct: 'Extra spicy, always',
      wrong: ['Mild and creamy', 'Plain rice, nothing else', 'Anything sweet'],
      ok: 'FLAVOR CONFIRMED. THE SPICY SECTOR IS HOME.' },
    { q: 'In a team game, which role does this player pick?',
      correct: 'DPS',
      wrong: ['Tank', 'Healer', 'Scout'],
      ok: 'ROLE CONFIRMED. DAMAGE PER SECOND, ALWAYS.' },
    { q: 'Which phrase is the official player call?',
      correct: 'SINI PYUK',
      wrong: ['NANTI DULU YA', 'LANJUT BESOK', 'KAMU DULUAN'],
      ok: 'VOICE LINE CONFIRMED. SINI PYUK ACCEPTED.' },
    { q: 'Which activity recharges this player the most?',
      correct: 'Going to the gym',
      wrong: ['Sleeping until noon', 'Rearranging bookshelves', 'Watching rain from the window'],
      ok: 'ACTIVITY CONFIRMED. GAINS ARE LOADING.' }
  ];

  var WRONG_LINES = [
    'ERROR 404: that answer is a decoy. Try again!',
    'Close, but the system is not convinced.',
    'Nope! Even the NPCs know this one.',
    'Wrong door. The data is behind another one.'
  ];

  var timer = null;

  SASMIT.registerLevel(2, {
    mount: function (stage, ctx) {
      var total = QUESTIONS.length;
      var index = 0;
      var saved = ctx.getProgress();
      // Kalau pemain keluar di tengah kuis, lanjutkan dari soal terakhir yang belum dijawab.
      if (!ctx.isCompleted() && saved.total === total && saved.done < total) index = saved.done;
      if (!ctx.isCompleted()) ctx.setProgress(index, total);

      var wrap = U.el('div', 'quiz');
      stage.appendChild(wrap);

      function render() {
        wrap.innerHTML = '';
        var item = QUESTIONS[index];
        wrap.appendChild(U.el('p', 'quiz__num', 'QUESTION ' + (index + 1) + ' / ' + total));
        var q = U.el('h3', 'quiz__q', item.q);
        q.id = 'quiz-q';
        wrap.appendChild(q);

        var list = U.el('div', 'quiz__choices');
        list.setAttribute('role', 'group');
        list.setAttribute('aria-labelledby', 'quiz-q');
        var status = U.el('p', 'quiz__status');
        status.setAttribute('role', 'status');

        U.shuffle([item.correct].concat(item.wrong)).forEach(function (text, i) {
          var b = U.el('button', 'choice');
          b.type = 'button';
          b.innerHTML = '<span class="choice__key">' + String.fromCharCode(65 + i) + '</span><span></span>';
          b.lastChild.textContent = text;
          b.addEventListener('click', function () { answer(b, text === item.correct, item, status, list); });
          list.appendChild(b);
        });
        wrap.appendChild(list);
        wrap.appendChild(status);
      }

      function answer(btn, correct, item, status, list) {
        if (correct) {
          ctx.sfx('ok');
          btn.classList.add('is-right');
          list.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
          status.textContent = item.ok;
          status.className = 'quiz__status is-ok';
          ctx.say(item.ok, 'ok');
          index++;
          ctx.setProgress(index, total);
          timer = setTimeout(function () {
            if (index >= total) verified(); else render();
          }, 1100);
        } else {
          ctx.sfx('bad');
          btn.disabled = true;
          btn.classList.add('is-wrong');
          var line = U.pick(WRONG_LINES);
          status.textContent = line;
          status.className = 'quiz__status is-warn';
          ctx.say(line, 'warn');
        }
      }

      function verified() {
        wrap.innerHTML = '';
        var box = U.el('div', 'quiz__done');
        box.innerHTML = '<p class="quiz__stamp">PLAYER VERIFIED</p><p>All four diagnostics passed. Identity confirmed.</p>';
        wrap.appendChild(box);
        ctx.say('PLAYER VERIFIED.', 'ok');
        timer = setTimeout(function () { ctx.complete(); }, 1400);
      }

      if (index >= total) verified(); else render();
    },
    unmount: function () { clearTimeout(timer); timer = null; }
  });
})();
