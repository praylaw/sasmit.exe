/*
 * sprites.js — menggambar pixel art dari "peta karakter" menjadi SVG.
 * Setiap huruf = satu warna di PALETTE, titik (.) = transparan.
 * Untuk mengganti gambar, cukup edit barisnya. Semua sprite ini orisinal (bukan aset game lain).
 */
(function () {
  'use strict';
  var SASMIT = (window.SASMIT = window.SASMIT || {});

  var PALETTE = {
    o: '#02070f', h: '#5b7fa3', s: '#f0c9a4', e: '#061426', m: '#b4705f',
    j: '#71dcff', w: '#eef8ff', p: '#1d4a78', c: '#71dcff', n: '#0a2038',
    g: '#8cf4ce', i: '#c8f1ff', k: '#8da9bd', d: '#2a8fb0',
    // warna tambahan untuk karakter, ikon kartu, dan boss
    y: '#ffd66b', a: '#ff9f45', P: '#ff9fc4', Q: '#e0709f', b: '#8b5a35', B: '#c58d5a',
    f: '#5bd68c', F: '#2f9d5c', r: '#e8504f', x: '#fff1d6', S: '#3d5a78', T: '#2a4560',
    // Stage 3: rambut Pray
    u: '#4a2f27'
  };

  var MAPS = {
    // Avatar pemain, 16 x 21
    player: [
      '................',
      '.....oooooo.....',
      '....ohhhhhho....',
      '...ohhhhhhhho...',
      '...ohhhhhhhho...',
      '...ohssssssho...',
      '...osesssseso...',
      '...osssssssso...',
      '...osssmmssso...',
      '.....osssso.....',
      '..ojjjjjjjjjjo..',
      '..ojjjjwwjjjjo..',
      '..ojjjjwwjjjjo..',
      '..osjjjwwjjjso..',
      '...ojjjjjjjjo...',
      '...oppppppppo...',
      '...opppoopppo...',
      '...oppo..oppo...',
      '...oppo..oppo...',
      '..owwwo..owwwo..',
      '..ooooo..ooooo..'
    ],
    // Logo: monitor kecil dengan wajah piksel, 12 x 11
    logo: [
      '.oooooooooo.',
      'occcccccccco',
      'ocnnnnnnnnco',
      'ocnngnngnnco',
      'ocnnnnnnnnco',
      'ocnnggggnnco',
      'ocnnnnnnnnco',
      '.occccccccco',
      '....oooo....',
      '...occccco..',
      '..oooooooo..'
    ],

    // ---- Ikon item inventaris (8 x 8), satu per hadiah level ----
    'memory-fragment': [
      '...ii...',
      '..iccd..',
      '.iccccd.',
      'icccccdd',
      '.dcccdd.',
      '..dcdd..',
      '...dd...'
    ],
    'player-verified': [
      'cccccccc',
      'cwwwwwwd',
      'cwwwwgwd',
      'cwgwgwwd',
      '.cwgwwd.',
      '..cwwd..',
      '...cd...'
    ],
    'quality-time': [
      '..cccc..',
      '.cwwwwc.',
      'cwwwiwwc',
      'cwwwiwwc',
      'cwwwiiwc',
      'cwwwwwwc',
      '.cwwwwc.',
      '..cccc..'
    ],
    'plushie-approved': [
      '.cc..cc.',
      'cwcccccc',
      'cccccccd',
      'cccccccd',
      '.ccccdd.',
      '..cccd..',
      '...dd...'
    ],
    'final-access-key': [
      '..ccc...',
      '.c...c..',
      '.c...c..',
      '..ccc...',
      '...c....',
      '...cc...',
      '...c....',
      '...cc...'
    ],
    'birthday-archive': [
      'ccc.....',
      'cccccccc',
      'cwwwwwwd',
      'cwwwwwwd',
      'cwwwwwwd',
      'cwwwwwwd',
      'dddddddd'
    ],
    // Penanda UI
    check: [
      '......gg',
      '.....gg.',
      'gg..gg..',
      '.gggg...',
      '..gg....'
    ],
    arrow: [
      'ccccccc',
      '.ccccc.',
      '..ccc..',
      '...c...'
    ],
    'icon-date': [
      '...cc..cc...',
      'iiiiiiiiiiii',
      'icccccccccci',
      'icccccccccci',
      'iwwwwwwwwwwi',
      'iwcwcwcwcwwi',
      'iwwwwwwwwwwi',
      'iwcwcwgwcwwi',
      'iwwwwwwwwwwi',
      'iwcwcwcwwwwi',
      'iiiiiiiiiiii'
    ],
    'icon-duck': [
      '....yyy.....',
      '...yyyyy....',
      '...yyeyyaa..',
      '...yyyyyaaa.',
      '....yyyy....',
      '....yyyy....',
      '..yyyyyyyyy.',
      '.yyyyyyyyyyy',
      '.yyaayyyyyy.',
      '..yyyyyyyy..',
      '..aaa.aaa...'
    ],
    'icon-stage': [
      'rrrrrrrrrrrr',
      'rQrnnnnnnrQr',
      'rQrnnwwnnrQr',
      'rQrnwwwwnrQr',
      'rQnwwwwwwnQr',
      'rQwwwwwwwwQr',
      'rQwwwwwwwwQr',
      'rQBBBBBBBBQr',
      'rQBBBBBBBBQr',
      'rrbbbbbbbbrr',
      'rrrrrrrrrrrr'
    ],
    'icon-oops': [
      '.cccccccccc.',
      'cwwwwwwwwwwc',
      'cwwwwrrwwwwc',
      'cwwwwrrwwwwc',
      'cwwwwrrwwwwc',
      'cwwwwrrwwwwc',
      'cwwwwwwwwwwc',
      'cwwwwrrwwwwc',
      '.cccccccccc.',
      '..ccc.......',
      '...c........'
    ],
    'plush-cidut': [
      '................',
      '......rrrr......',
      '.....orrrro.....',
      '....oyyyyyyo....',
      '...oyyyyyyyyo...',
      '..oyyeyyyyeyyo..',
      '..oyyeyyyyeyyo..',
      '..oyyyyaayyyyo..',
      '.oyyyyyyyyyyyyo.',
      '.oyyyyyyyyyyyyo.',
      '.oyyaayyyyaayyo.',
      '.oyyaayyyyaayyo.',
      '..oyyyyyyyyyyo..',
      '...oyyyyyyyyo...',
      '....oaa..aao....',
      '....ooo..ooo....'
    ],
    'plush-mpun': [
      '................',
      '..oo........oo..',
      '.oPPooooooooPPo.',
      '.oPPPPPPPPPPPPo.',
      '.oPkkkkPPkkkkPo.',
      '.oPkwwkkkkwwkPo.',
      '.oPkwekkkkwekPo.',
      '.oPkkkkPPkkkkPo.',
      '.oPPPPPPPPPPPPo.',
      '.oPPPPPQQPPPPPo.',
      '.oPPPPPwwPPPPPo.',
      '.oPPPPPwwPPPPPo.',
      '..oPPPPPPPPPPo..',
      '...oPPPPPPPPo...',
      '...oPPo..oPPo...',
      '...oooo..oooo...'
    ],
    'plush-blubub': [
      '...oo......oo...',
      '..oPPo....oPPo..',
      '..oPQo....oQPo..',
      '..oPQo....oQPo..',
      '..oPQo....oQPo..',
      '..oPPooooooPPo..',
      '.oPPPPPPPPPPPPo.',
      '.oPPPPPPPPPPPPo.',
      '.oPPePPPPPPePPo.',
      '.oPPePPQQPPePPo.',
      '.oPPPPPPPPPPPPo.',
      '..oPPPPPPPPPPo..',
      '..oPPPPPPPPPPo..',
      '...oPPPPPPPPo...',
      '...oPPo..oPPo...',
      '...oooo..oooo...'
    ],
    'plush-milop': [
      '..oo........oo..',
      '.oBBo......oBBo.',
      '.oBBo......oBBo.',
      '.oBBboooooobBBo.',
      '.obbbbbbbbbbbbo.',
      '.obbbbbbbbbbbbo.',
      '.obbebbbbbbebbo.',
      '.obbbbBBBBbbbbo.',
      '.obbbBBeeBBbbbo.',
      '.obbbbBBBBbbbbo.',
      '..obbbbbbbbbbo..',
      '..obbBBBBBBbbo..',
      '..obbBBBBBBbbo..',
      '...obbbbbbbbo...',
      '...obbo..obbo...',
      '...oooo..oooo...'
    ],
    'plush-tulalit': [
      '................',
      '..oooo....oooo..',
      '.offffo..offffo.',
      '.offwfoooofwffo.',
      '.offefffffffeffo',
      '.offfffFFFFffffo',
      '.oFFFFFFFFFFFFo.',
      '..oxxxxxxxxxxo..',
      '..oxxexxxxexxo..',
      '..oxxxxQQxxxxo..',
      '...oxxxxxxxxo...',
      '...oxxxxxxxxo...',
      '....oxxxxxxo....',
      '....oxo..oxo....',
      '....ooo..ooo....',
      '................'
    ],
    'plush-jenitsu': [
      '..a..aa..aa..a..',
      '..oaaaaaaaaaao..',
      '.oayyyyyyyyyyao.',
      '.oayyyyyyyyyyao.',
      '.oayssssssssyao.',
      '.oaysessssesyao.',
      '.oayssssssssyao.',
      '..oasssmmsssao..',
      '....oosssso.....',
      '..oyyyyyyyyyyo..',
      '..oyayayayayyo..',
      '..oayayayayayo..',
      '..oyayayayayyo..',
      '...oyyyyyyyyo...',
      '...onno..onno...',
      '...oooo..oooo...'
    ],
    'boss-drill': [
      '.......oooooo.......',
      '......oaaaaaao......',
      '.....oaayyyyaao.....',
      '....oaaaaaaaaaao....',
      '....oooooooooooo....',
      '...oSSSSSSSSSSSSo...',
      '...oSSrrSSSSrrSSo...',
      '...oSSrrSSSSrrSSo...',
      '...oSSSSSSSSSSSSo...',
      '...oSkkkkkkkkkkSo...',
      '...oSSSSSSSSSSSSo...',
      '..oooooooooooooooo..',
      '.oaaSSSSSSSSSSSSaao.',
      '.oaaSSwwwwwwwwSSaao.',
      '.oaaSSwccccccwSSaao.',
      '.oaaSSwwwwwwwwSSaao.',
      '.ooaaSSSSSSSSSSaaoo.',
      '....ooSSSSSSSSoo....',
      '.ooooooyyyyyyoooooo.',
      '.oTTTooyayayyooTTTo.',
      '.oTkTooayayayooTkTo.',
      '.oTkTo.oyayyo.oTkTo.',
      '.oTTTo..oyyo..oTTTo.',
      '.ooooo...oo...ooooo.'
    ],
    // ---- Stage 3: Pray, pelukan, hati, ikon arsip ----
    // Pray, 16 x 21 (ukuran sama dengan avatar CAMIIT supaya sejajar di cutscene)
    pray: [
      '................',
      '....oooooooo....',
      '...ouuuuuuuuo...',
      '..ouuuuuuuuuuo..',
      '..ouuuuuuuuuuo..',
      '..ouussssssuuo..',
      '..ouusessesuuo..',
      '..ouussssssuuo..',
      '..ouussmmssuuo..',
      '..ouuuossssouuo.',
      '..ouPPPPPPPPuo..',
      '..ouPPPQQPPPuo..',
      '..ouPPPQQPPPuo..',
      '..osPPPPPPPPso..',
      '...oPPPPPPPPo...',
      '...oSSSSSSSSo...',
      '...oSSSooSSSo...',
      '...oSSo..oSSo...',
      '...oSSo..oSSo...',
      '..owwwo..owwwo..',
      '..ooooo..ooooo..'
    ],
    // CAMIIT dan Pray berpelukan, 26 x 21 (gabungan dua sprite di atas + lengan saling melingkar)
    hug: [
      '..........................',
      '.....oooooo...oooooooo....',
      '....ohhhhhho.ouuuuuuuuo...',
      '...ohhhhhhhhouuuuuuuuuuo..',
      '...ohhhhhhhhouuuuuuuuuuo..',
      '...ohsssssshouussssssuuo..',
      '...osessssesouusessesuuo..',
      '...ossssssssouussssssuuo..',
      '...osssmmsssouussmmssuuo..',
      '.....osssso.ouuuossssouuo.',
      '..ojjjjjjjjjouPPPPPPPPuo..',
      '..ojjjjwwjjjjjjjjjjjjjjjs.',
      '..ojjjjwwjjjjjjjjjjjjjjjs.',
      '.oooooooooooooooooooooooo.',
      '.sPPPPPPPPPPooPPPPPPPPo...',
      '.sPPPPPPPPPPooSSSSSSSSo...',
      '...oooooooooooSSSooSSSo...',
      '...oppo..oppooSSo..oSSo...',
      '...oppo..oppooSSo..oSSo...',
      '..owwwo..owwowwwo..owwwo..',
      '..ooooo..oooooooo..ooooo..'
    ],
    heart: [
      '.PP..PP.',
      'PwPPPPPP',
      'PPPPPPPQ',
      'PPPPPPQQ',
      '.PPPPQQ.',
      '..PPQQ..',
      '...PQ...'
    ],
    'heart-o': [
      '.PP..PP.',
      'P..PP..P',
      'P......P',
      'P......P',
      '.P....P.',
      '..P..P..',
      '...PP...'
    ],
    sparkle: [
      '..i..',
      '.iii.',
      'iiwii',
      '.iii.',
      '..i..'
    ],
    star: [
      '..y..',
      '..y..',
      'yyyyy',
      '.yyy.',
      '.y.y.'
    ],
    // Ikon file untuk menu arsip (Level 06)
    'file-txt': [
      'ooooooo..',
      'owwwwwwoo',
      'owcccwwwo',
      'owwwwwwwo',
      'owccccccw',
      'owwwwwwwo',
      'owcccwwwo',
      'owwwwwwwo',
      'owccccwwo',
      'owwwwwwwo',
      'ooooooooo'
    ],
    'file-folder': [
      'oooooo......',
      'occccco.....',
      'ooooooooooo.',
      'occccccccccd',
      'oiiiiiiiiicd',
      'occccccccccd',
      'occccccccccd',
      'occccccccccd',
      'odddddddddd.'
    ],
    'file-video': [
      '.oooooooooo.',
      'occccccccccd',
      'ocnnnnnnnncd',
      'ocngnnnnnncd',
      'ocnggnnnnncd',
      'ocngggnnnncd',
      'ocnggnnnnncd',
      'ocngnnnnnncd',
      'ocnnnnnnnncd',
      '.oddddddddd.'
    ],
    photo: [
      'oooooooooooo',
      'oiiiiiiiiiio',
      'oiiiiiyiiiio',
      'oiiiiiiiiiio',
      'oiiiiiiciiio',
      'oiiiiiccciio',
      'oiicciccccio',
      'oiccccccccio',
      'oooooooooooo'
    ],
    'icon-icecream': [
      '....PPPP....',
      '...PPwPPP...',
      '..PPPPPPPP..',
      '..QQQQQQQQ..',
      '..xxxxxxxx..',
      '.xxwxxxxxxx.',
      '.xxxxxxxxxx.',
      '..BBBBBBBB..',
      '...BbBBbB...',
      '...BBbBBb...',
      '....BbBB....',
      '....BBbB....',
      '.....BB.....',
      '......B.....'
    ],
    // ---- Stage 3 v3: sprite ending (kue ulang tahun), not balok, mic ----
    // CAMIIT dan Pray memegang kue ulang tahun, 42 x 21. Dua frame api (cake-duo / cake-duo2) dipakai bergantian.
    'cake-duo': [
      '..........................................',
      '.....oooooo...................oooooooo....',
      '....ohhhhhho.................ouuuuuuuuo...',
      '...ohhhhhhhho...............ouuuuuuuuuuo..',
      '...ohhhhhhhho...............ouuuuuuuuuuo..',
      '...ohssssssho...............ouussssssuuo..',
      '...osesssseso...............ouusessesuuo..',
      '...osssssssso.....a..a..a...ouussssssuuo..',
      '...osssmmssso.....y..y..y...ouussmmssuuo..',
      '.....osssso.......w..w..w...ouuuossssouuo.',
      '..ojjjjjjjjjjo....r..r..r...ouPPPPPPPPuo..',
      '..ojjjjwwjjjjo....w..w..w...ouPPPQQPPPuo..',
      '..ojjjjwwjjjjo..oooooooooo..ouPPPQQPPPuo..',
      '..osjjjwwjjjjjjsoPPPPPPPPosPPPPPPPPPPPso..',
      '...ojjjjjjjjo...oxxxxxxxxo...oPPPPPPPPo...',
      '...oppppppppo...oPPPPPPPPo...oSSSSSSSSo...',
      '...opppoopppo...oxxxxxxxxo...oSSSooSSSo...',
      '...oppo..oppo...oooooooooo...oSSo..oSSo...',
      '...oppo..oppo................oSSo..oSSo...',
      '..owwwo..owwwo..............owwwo..owwwo..',
      '..ooooo..ooooo..............ooooo..ooooo..'
    ],
    'cake-duo2': [
      '..........................................',
      '.....oooooo...................oooooooo....',
      '....ohhhhhho.................ouuuuuuuuo...',
      '...ohhhhhhhho...............ouuuuuuuuuuo..',
      '...ohhhhhhhho...............ouuuuuuuuuuo..',
      '...ohssssssho...............ouussssssuuo..',
      '...osesssseso...............ouusessesuuo..',
      '...osssssssso...............ouussssssuuo..',
      '...osssmmssso.....a..a..a...ouussmmssuuo..',
      '.....osssso.......w..w..w...ouuuossssouuo.',
      '..ojjjjjjjjjjo....r..r..r...ouPPPPPPPPuo..',
      '..ojjjjwwjjjjo....w..w..w...ouPPPQQPPPuo..',
      '..ojjjjwwjjjjo..oooooooooo..ouPPPQQPPPuo..',
      '..osjjjwwjjjjjjsoPPPPPPPPosPPPPPPPPPPPso..',
      '...ojjjjjjjjo...oxxxxxxxxo...oPPPPPPPPo...',
      '...oppppppppo...oPPPPPPPPo...oSSSSSSSSo...',
      '...opppoopppo...oxxxxxxxxo...oSSSooSSSo...',
      '...oppo..oppo...oooooooooo...oSSo..oSSo...',
      '...oppo..oppo................oSSo..oSSo...',
      '..owwwo..owwwo..............owwwo..owwwo..',
      '..ooooo..ooooo..............ooooo..ooooo..'
    ],
    // Not balok (dua nada diikat balok) dan nada tunggal, warna biru dan pink (pink dibuat di bawah)
    'note-beam': [
      '..cccccccccc',
      '..cccccccccc',
      '..cc......cc',
      '..cc......cc',
      '..cc......cc',
      '..cc......cc',
      '.ccc.....ccc',
      'cccc....cccc',
      '.cc......cc.'
    ],
    'note-one': [
      '...cc...',
      '...ccc..',
      '...cc.cc',
      '...cc..c',
      '...cc...',
      '...cc...',
      '.cccc...',
      'ccccc...',
      '.ccc....'
    ],
    // Gembok kecil untuk level terkunci, 7 x 7
    lock: [
      '..kkk..',
      '.k...k.',
      '.k...k.',
      'kkkkkkk',
      'kkknkkk',
      'kkknkkk',
      'kkkkkkk'
    ]
  };

  // ---- Varian dibuat dari sprite dasar: kalau `player` / `pray` diedit, semua varian ikut berubah ----
  // variant(dasar, [[baris, kolom, huruf], ...]) menimpa beberapa piksel.
  function variant(base, patches) {
    var rows = MAPS[base].map(function (r) { return r.split(''); });
    patches.forEach(function (p) { rows[p[0]][p[1]] = p[2]; });
    return rows.map(function (r) { return r.join(''); });
  }
  function recolor(base, from, to) {
    return MAPS[base].map(function (r) { return r.split(from).join(to); });
  }
  // Kedua lengan terangkat (rambut Pray memakai kolom 2..13, jadi lengan di kolom 1 dan 14).
  var ARMS_UP = [];
  [1, 14].forEach(function (c) {
    var edge = c === 1 ? 0 : 15;
    for (var r = 0; r <= 10; r++) ARMS_UP.push([r, edge, 'o']);
    for (var r2 = 1; r2 <= 5; r2++) ARMS_UP.push([r2, c, 's']);
    for (var r3 = 6; r3 <= 10; r3++) ARMS_UP.push([r3, c, 'P']);
  });
  var EYES_SPARKLE = [[5, 6, 'y'], [5, 9, 'y'], [6, 5, 'y'], [6, 6, 'w'], [6, 7, 'y'], [6, 9, 'w'], [6, 10, 'y'], [7, 6, 'y'], [7, 9, 'y']];
  // (dua mata berbentuk plus, di tengahnya putih, supaya terbaca berkilau)
  var EYES_HEART   = [[5, 5, 'r'], [5, 6, 'r'], [6, 5, 'r'], [6, 6, 'r'], [7, 5, 'r'], [5, 9, 'r'], [5, 10, 'r'], [6, 9, 'r'], [6, 10, 'r'], [7, 10, 'r']];
  var EYES_HAPPY   = [[6, 5, 'e'], [6, 6, 'e'], [6, 9, 'e'], [6, 10, 'e']];
  var BLUSH        = [[7, 5, 'P'], [7, 10, 'P']];
  var SMILE_OPEN   = [[8, 6, 'm'], [8, 7, 'r'], [8, 8, 'r'], [8, 9, 'm']];
  var TEARS        = [[7, 5, 'c'], [8, 5, 'c'], [7, 10, 'c'], [8, 10, 'c']];

  MAPS['pray-sparkle'] = variant('pray', EYES_SPARKLE.concat(SMILE_OPEN));          // mata berbinar
  MAPS['pray-cheer']   = variant('pray', ARMS_UP.concat(EYES_HAPPY, SMILE_OPEN));   // tangan di atas, hore
  MAPS['pray-heart']   = variant('pray', EYES_HEART.concat([[8, 7, 'm'], [8, 8, 'm']]));  // mata hati
  MAPS['pray-happy']   = variant('pray', EYES_HAPPY.concat(BLUSH, SMILE_OPEN));     // gemas, pipi merah
  MAPS['pray-joy']     = variant('pray', ARMS_UP.concat(EYES_HAPPY, TEARS, SMILE_OPEN)); // nangis bahagia
  MAPS['pray-cry']     = variant('pray', EYES_HAPPY.concat(TEARS, [[8, 7, 'e'], [8, 8, 'e']])); // menangis sedih
  MAPS['note-beam-p']  = recolor('note-beam', 'c', 'P');
  MAPS['note-one-p']   = recolor('note-one', 'c', 'P');

  // CAMIIT memegang mic. Dua frame: mulut tertutup (player-sing) dan terbuka (player-sing2).
  var MIC = [[4, 13, 'o'], [4, 14, 'o'], [5, 13, 'k'], [5, 14, 'k'], [6, 13, 'w'], [6, 14, 'k'], [5, 15, 'o'], [6, 15, 'o'],
             [7, 13, 'o'], [7, 14, 'o'], [7, 15, 'o'], [8, 13, 'S'], [8, 14, 'S'], [9, 13, 's'], [9, 14, 's']];
  MAPS['player-sing']  = variant('player', MIC);
  MAPS['player-sing2'] = variant('player', MIC.concat([[8, 7, 'e'], [8, 8, 'e'], [9, 7, 'm'], [9, 8, 'm']]));
  // CAMIIT K.O.: mata X dan mulut terbuka. Rebahannya dibuat dengan CSS.
  MAPS['player-ko'] = variant('player', [[5, 5, 'e'], [6, 6, 'e'], [7, 5, 'e'], [5, 10, 'e'], [6, 9, 'e'], [7, 10, 'e'], [8, 7, 'e'], [8, 8, 'e']]);

  var LABELS = { player: 'Pixel art player avatar', logo: 'SASMIT.EXE logo', lock: 'Locked', pray: 'Pixel art Pray', hug: 'CAMIIT and Pray hugging' };

  // Gabungkan piksel sewarna yang bersebelahan jadi satu <rect> supaya SVG tetap ringan.
  function svg(name, label) {
    var rows = MAPS[name];
    if (!rows) return '';
    var w = 0;
    rows.forEach(function (r) { w = Math.max(w, r.length); });
    var out = '';
    rows.forEach(function (row, y) {
      var padded = row + new Array(w - row.length + 1).join('.');
      var x = 0;
      while (x < w) {
        var ch = padded.charAt(x);
        if (ch === '.' || !PALETTE[ch]) { x++; continue; }
        var start = x;
        while (x < w && padded.charAt(x) === ch) x++;
        out += '<rect x="' + start + '" y="' + y + '" width="' + (x - start) +
               '" height="1" fill="' + PALETTE[ch] + '"/>';
      }
    });
    var alt = label === undefined ? LABELS[name] : label;
    var aria = alt ? 'role="img" aria-label="' + alt + '"' : 'aria-hidden="true"';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + rows.length +
           '" shape-rendering="crispEdges" ' + aria + '>' + out + '</svg>';
  }

  // Isi semua elemen [data-sprite="nama"] di halaman.
  function mount(root) {
    (root || document).querySelectorAll('[data-sprite]').forEach(function (el) {
      var decorative = el.hasAttribute('data-decorative');
      el.innerHTML = svg(el.getAttribute('data-sprite'), decorative ? '' : undefined);
    });
  }

  SASMIT.sprites = { svg: svg, mount: mount, PALETTE: PALETTE };
})();
