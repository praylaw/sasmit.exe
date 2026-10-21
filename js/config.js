/*
 * config.js — semua hal yang mungkin kamu ganti ada di sini.
 * File ini dimuat PERTAMA, sebelum script lain.
 */
window.SASMIT_CONFIG = {
  // Kunci penyimpanan progres di localStorage. Ganti angka versi kalau struktur save berubah.
  saveKey: 'sasmit-exe-save-v1',

  player: {
    codename: 'CAMIIT',
    level: 21,
    status: 'READY'
  },

  birthday: {
    display: '26 DEC 2026',
    build: '18.10.26'
  },

  // Musik latar. Taruh file audio milikmu di assets/audio/ lalu samakan nama file-nya di sini.
  // Kalau file tidak ada, game tetap jalan tanpa suara.
  audio: {
    src: 'assets/audio/spend-a-lifetime.mp3',
    title: 'Spend a Lifetime',
    volume: 0.35
  },

  /* ======================================================================
   * Level 03 — SING ALONG (sambung lirik). Sasmit menyanyikan bagian yang hilang lewat mic.
   *
   * PENTING: lirik lagu dilindungi hak cipta, jadi TIDAK saya tuliskan di sini.
   * Tempel liriknya sendiri ke `shown` dan `hidden` di bawah (satu string = satu baris).
   *  - shown  : baris yang tampil dari awal (di contoh lagumu: 3 baris).
   *  - hidden : baris yang harus dinyanyikan; awalnya tertutup, terbuka satu per satu
   *             setelah suara Sasmit terdeteksi cukup lama (di contoh lagumu: 9 baris).
   * Jumlah baris bebas; game menyesuaikan sendiri.
   * ==================================================================== */
  singalong: {
    title: 'BEST PART',
    secondsPerLine: 2.2,   // detik suara yang harus terdeteksi supaya satu baris terbuka
    musicVolume: 0.06,     // volume musik latar (0..1) saat bagian nyanyi dimulai; normalnya audio.volume
    shown: [
      '[You\'re my water when I\'m stuck in the desert]',
      '[You\'re the Tylenol I take when my head hurts]',
      'You\'re the sunshine on my life]'
    ],
    hidden: [
      '[I just wanna see how beautiful you are]', '[You know that I see it]', '[i know you are a star]',
      '[where you go are follow]', '[no matter how far]', '[ if life is a movie]',
      '[Then you\'re the best part]', '[oh oh oh You\'re the best part]', '[oh oh oh, best part]'
    ]
  },

  /* ======================================================================
   * Stage 3 — isi FINAL SAVE FILE (Level 06). Semua yang pribadi ada di sini,
   * jadi kamu tidak perlu menyentuh kode level untuk mengganti isinya.
   * ==================================================================== */
  finale: {

    // ---- 1. letter_from_pray.txt ----
    // Satu string = satu paragraf. Baris pertama biasanya sapaan. Ini DRAFT: ganti sesukamu.
    letter: {
      filename: 'letter_from_pray.txt',
      from: 'PRAY',
      to: 'SASMIT',
      paragraphs: [
        'Untuk Sasmit, my bf',
        'Selamat ulang tahun yang ke-21.',
        'Kalau kamu baca ini, berarti kamu sudah melewati semua levelnya. Maaf ya, aku bikin hari ulang tahunmu jadi penuh teka-teki. but i\'m very proud of you karena udah nyelesaiin semua level.',
        'Aku awalnya iseng bikin game ini, tapi ternyata rasa penasaran aku bikin aku jadi serius. Aku pengen bikin game ini spesial buat kamu, karena kamu spesial buat aku. Aku harap kamu suka sama game ini, dan semoga kamu suka sama hadiah-hadiah yang aku siapin di level terakhir.',
        'Aku pengen bilang banyak hal, tapi aku takut tulisannya kepanjangan. Jadi aku cuma mau bilang: aku sayang kamu, dan aku pengen kita selalu bareng sampai tua nanti. Aku pengen kita bisa saling support, saling jaga, dan saling sayang. Aku pengen kita bisa bikin banyak kenangan seru bareng, dan aku pengen kita bisa terus bahagia bareng.',
        'Aku harap kamu bisa ngerasain betapa aku sayang sama kamu,dan aku berharap kita masih bersama untuk ngerayain ultah kita berdua di tahun tahun berikutnya.',
        'Sekali lagi, selamat ulang tahun yang ke-21, my love. Aku sayang kamu banget.',
        'Selamat ulang tahun, BBY<3'
      ],
      signature: '— Pray',
      ps: 'P.S. Kabarin ya kalau sudah selesai baca.'
    },

    // ---- 2. our_memories/ ----
    // Taruh foto di assets/images/ lalu samakan nama file-nya di sini.
    // Tambah/kurangi baris sesukamu; galeri menyesuaikan sendiri. Kalau file belum ada,
    // yang tampil adalah placeholder yang menyebutkan nama file yang dicari.
    gallery: {
      folder: 'our_memories/',
      photos: [
        { src: 'assets/images/first-datee.jpeg', caption: 'FIRST DATE · 20 AUG 2026' },
        { src: 'assets/images/flowerr.jpeg',  caption: 'My first flower' },
        { src: 'assets/images/memory.jpeg',  caption: 'us' },
        { src: 'assets/images/bf.jpeg',  caption: 'My Wonderful man' },
        { src: 'assets/images/little-you-03.png',  caption: 'little you' }
      ]
    },

    // ---- 3. one_more_video.mp4 ----
    // Taruh videomu di assets/video/ (disarankan .mp4 H.264 supaya jalan di semua browser/HP).
    video: {
      filename: 'one_more_video.mp4',
      src: 'assets/video/one_more_video.mp4',
      caption: 'ONE MORE THING.'
    }
  }
};
