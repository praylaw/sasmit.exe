# SASMIT.EXE — Birthday Special

Mini-game RPG retro sebagai hadiah ulang tahun. Website statis: HTML + CSS + JavaScript biasa, tanpa build, tanpa server, tanpa library.
Font pixel (Press Start 2P dan VT323) disimpan lokal di `assets/fonts/` sehingga tetap jalan offline dan di GitHub Pages. Lisensi: SIL OFL 1.1, lihat `assets/fonts/LICENSE.txt`.

> **Status: Stage 3 (Game lengkap).** Level 01–06 dan ending sudah bisa dimainkan.
> Level 05 sekarang adalah misi penyelamatan (CAMIIT menyelamatkan Pray dari DRILLING.EXE) dengan cutscene pelukan.
> Level 06 adalah arsip akhir: surat, galeri foto, video, lalu ending.
>
> **Update v3:** Level 03 sekarang SING ALONG (sambung lirik pakai mic, menggantikan Busy Mode). Tiap level selesai, Pray lompat dengan reaksi
> yang berbeda. Di Level 05, kalau HP CAMIIT habis muncul K.O. dan Pray menangis (game tetap lanjut). Ending akhir: konfeti meledak, lalu
> CAMIIT dan Pray memegang kue ulang tahun dengan lilin menyala.

## Cara menjalankan

Cara paling mudah: **klik dua kali `index.html`**. Semua script memakai `<script>` biasa (bukan ES module), jadi bisa jalan langsung dari file.

Alternatif lewat server lokal (lebih mirip kondisi saat dipublikasikan):

```bash
cd sasmit-exe
python3 -m http.server 8000
# buka http://localhost:8000
```

Tambahkan `?dev=1` di URL (mis. `index.html?dev=1`) untuk menguji tanpa mengulang dari awal. Muncul tombol **DEV: GO TO LV 05** dan **DEV: GO TO LV 06** di panel SYSTEM (menandai level sebelumnya selesai), dan **DEV: DEFEAT BOSS** di layar awal Level 05 untuk langsung melihat cutscene. Semua tombol ini tidak muncul tanpa `?dev=1`.

## Struktur

```text
sasmit-exe/
├── index.html              Struktur halaman (boot, HUD, dialog konfirmasi)
├── css/style.css           Seluruh desain visual
├── js/
│   ├── config.js           Nama, tanggal, path musik — edit di sini
│   ├── game-state.js       State terpusat, daftar level, hadiah, localStorage
│   ├── sprites.js          Pixel art (peta karakter → SVG)
│   ├── audio.js            Musik latar + efek suara
│   ├── util.js             Fungsi bantu (acak, buat elemen)
│   ├── app.js              Boot, HUD, navigasi level, reset
│   └── levels/             Satu file per level (01–06 semuanya sudah jadi)
└── assets/
    ├── fonts/              Font pixel + lisensi (jangan dihapus)
    ├── ui/                 Latar bintang dan skyline kota (SVG, boleh diganti)
    ├── images/             Foto untuk galeri Level 06
    ├── audio/              Taruh musik di sini
    └── video/              Video untuk Level 06
```

## Menambahkan lagu

1. Siapkan file audio milikmu sendiri (disarankan **.mp3**, di bawah ±5 MB supaya cepat dimuat).
2. Taruh di `assets/audio/` dengan nama **`spend-a-lifetime.mp3`**, atau pakai nama lain lalu ubah `audio.src` di `js/config.js`.
3. Refresh. Musik mulai setelah pemain menekan START, dan tombol SOUND mengatur nyala/matinya. Kalau file belum ada, game tetap jalan tanpa suara (di localhost muncul pesan "AUDIO FILE NOT FOUND" di kotak dialog; di situs publik pesan itu tidak muncul).

Catatan: lagu berhak cipta yang kamu taruh di repositori publik bisa dilihat dan diunduh siapa saja. Pertimbangkan itu sebelum dipublikasikan.

## Mengubah isi level

- **Level 01** — pasangan kartu: `PAIRS` di `js/levels/memory-database.js`.
- **Level 02** — soal dan pilihan: `QUESTIONS` di `js/levels/player-diagnostics.js`.
- **Level 03** — lirik, durasi nyanyi per baris, dan volume musik saat bernyanyi: `singalong` di `js/config.js` (lihat bagian di bawah).
- **Reaksi Pray** — sprite, gaya lompatan, efek, dan ucapannya per level: `REACTIONS` di `js/app.js`.
- **Level 04** — karakter, dialog, posisi: `CAST` di `js/levels/plushie-gang.js`. Sprite plushie hanya placeholder orisinal; gambar sendiri bisa dipasang dengan mengganti sprite-nya.
- **Level 05** — tingkat kesulitan: `CONFIG` dan `MOVES` di `js/levels/drilling-boss.js`. Dialog Pray saat bertarung: `PRAY_LINES`. Durasi cutscene: `CUT` (milidetik; total ±15 detik, ada tombol SKIP).
- **Level 06** — surat, daftar foto, dan video semuanya di `finale` dalam `js/config.js` (lihat bagian di bawah).

## Mengisi lirik Level 03 (SING ALONG)

Lirik lagu dilindungi hak cipta, jadi **tidak disertakan** di project ini. Isinya masih placeholder `[tempel lirik baris N ...]`; tempel liriknya sendiri di `singalong` pada `js/config.js`:

```js
shown:  ['baris 1', 'baris 2', 'baris 3'],          // tampil dari awal
hidden: ['baris 4', 'baris 5', /* ... */ ]          // harus dinyanyikan; terbuka satu per satu
```

Satu string = satu baris, jumlahnya bebas. Cara mainnya: nyalakan mic, tekan START SINGING, lalu nyanyi. Setiap baris terbuka setelah suara terdeteksi `secondsPerLine` detik (bawaan 2,2). Musik latar mengecil ke `musicVolume` selama bagian nyanyi dan kembali normal setelah selesai.

Catatan teknis:

- Yang dideteksi adalah **ada/tidaknya suara** (volume), bukan ketepatan kata atau nada. Browser tidak bisa menilai nyanyian dengan andal, jadi level ini tidak bisa buntu atau salah menolak.
- Mic butuh izin browser dan konteks aman (https, atau file yang dibuka langsung dari komputer). Kalau mic ditolak atau tidak ada, pakai **BUTTON MODE** (tombol SING yang bisa di-toggle).
- Pakai headphone kalau bisa, supaya musik dari speaker tidak ikut terdeteksi sebagai suara.

## Mengisi FINAL SAVE FILE (Level 06)

Semua ada di `finale` pada `js/config.js`.

**Surat** — `finale.letter.paragraphs`: satu string = satu paragraf. Isi bawaan adalah DRAFT yang disusun dari fakta yang ada di project; baca dan ubah sampai terdengar seperti kamu. Tanda tangan di `signature`, catatan kaki di `ps`.

**Foto** — taruh file di `assets/images/`, lalu daftarkan di `finale.gallery.photos`:

```js
{ src: 'assets/images/first-date.jpg', caption: 'FIRST DATE · 20 AUG 2026' }
```

Nama file bebas. Tambah atau hapus baris sesukamu; galeri menyesuaikan jumlah foto sendiri. Foto yang filenya belum ada tampil sebagai placeholder bertuliskan nama file yang dicari, jadi game tidak macet. Disarankan mengecilkan foto (±1600 px sisi terpanjang, di bawah ±500 KB) supaya cepat dimuat di HP.

**Video** — taruh di `assets/video/one_more_video.mp4` (atau ubah `finale.video.src`). Pakai **.mp4 H.264 + AAC** supaya jalan di semua browser dan HP; format lain (mis. HEVC/.mov dari iPhone) bisa gagal diputar di sebagian perangkat. Kalau file belum ada, tampil layar "NO SIGNAL" yang menyebut lokasi file. Musik latar dijeda otomatis saat video diputar.

**Ending** — muncul otomatis setelah ketiga file pernah dibuka dan file terakhir ditutup (atau lewat tombol RUN FINAL SAVE). Bisa diputar ulang dari arsip lewat PLAY ENDING.

## Yang bisa kamu ganti sekarang

- **Nama/level/tanggal:** `js/config.js`.
- **Teks misi dan hint tiap level, nama hadiah:** daftar `LEVELS` di `js/game-state.js`.
- **Warna:** variabel di bagian atas `css/style.css`.
- **Latar boot:** `assets/ui/skyline.svg` dan `assets/ui/stars.svg`.
- **Tampilan avatar dan ikon item:** peta karakter `player` di `js/sprites.js`.

## Reset progres

Tombol **RESET PROGRESS** di panel SYSTEM (atau **NEW GAME** di layar boot) menghapus progres setelah konfirmasi. Progres tersimpan di `localStorage` browser, jadi refresh tidak menghapusnya, tetapi progres tidak berpindah antar browser/perangkat.

## Catatan perubahan terbaru

- **Level 01:** pasangan kartu sekarang ice cream (basement parking), pelukan (bby micuu), kalender (firstdate), dan hati (iloveu in every universe). Ubah di `PAIRS` pada `js/levels/memory-database.js`; ikon es krim ada di `js/sprites.js` (`icon-icecream`).
- **Level 04:** setelah keenam plushie ditemukan, muncul kolom goodnight. Pemain mengetik ucapan selamat malam (atau menekan tombol GOODNIGHT), lalu plushie pindah ke kasur, berbaring, kamar menjadi gelap, dan huruf zzz melayang. Kata yang diterima diatur oleh `GOODNIGHT` di `js/levels/plushie-gang.js`; posisi tidur di `SLEEP_WIDE` / `SLEEP_NARROW`.
