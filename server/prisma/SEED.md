# Dataset demo SIAKAD

Snapshot akademik: September 2026. Data ini menggambarkan kampus kecil untuk pengembangan, bukan laporan produksi. Seed tidak mengisi UKT atau log aktivitas karena kedua model belum tersedia.

## Struktur

- `seed.ts`: CLI dan foto opsional setelah transaksi database selesai.
- `seed-data/catalog.ts`: nama fakultas, prodi, dosen, mahasiswa, mata kuliah, periode dan skenario KRS.
- `seed-data/campus.ts`: pengisian data dari induk ke anak dan pemeriksaan bentrok.
- `seed-data/reset.ts`: penghapusan seluruh data sesuai urutan foreign key, hanya dengan `--reset`.
- `seed-data/photo.ts`: mengganti avatar dosen dan mahasiswa pertama, memakai file JPG yang sama, menghapus avatar lama sebelum upload.

## Jumlah pada database kosong

| Data | Jumlah | Keterangan |
|---|---:|---|
| Admin | 1 | Ratna Puspita |
| Fakultas / prodi | 2 / 2 | Teknik–TI dan Ekonomi Bisnis–Manajemen |
| Dosen | 6 | 3 per prodi, termasuk 1 kaprodi; pendidikan S2/S3 |
| Mahasiswa | 16 | 14 aktif, 2 cuti; angkatan 2025 semester 3 |
| Tahun akademik / periode KRS | 2 / 2 | Genap 2025/2026 dan ganjil 2026/2027 |
| Kurikulum / mata kuliah | 2 / 24 | 6 mata kuliah × 3 SKS per prodi per semester |
| Ruangan / kelas | 2 / 4 | Ruangan berkapasitas 30; 1 kelas per prodi per periode |
| Penugasan / jadwal | 24 / 24 | Senin–Rabu, 08:00–10:30 dan 10:45–13:15 |
| KRS / detail | 28 / 168 | 16 historis dan 12 semester berjalan |
| Transkrip | 96 | Hanya semester yang telah selesai |
| Riwayat status seed | 16 | Registrasi ulang atau permohonan cuti |

Semester berjalan: 6 KRS disetujui, 2 diajukan, 2 ditolak, 2 draft; 2 mahasiswa aktif belum membuat KRS; 2 mahasiswa cuti tanpa KRS. Dashboard saat ini menghitung draft sebagai belum mengajukan: `submitted=10`, `notSubmitted=4`, `pendingApproval=2`, `percentage=71` (dari 14 mahasiswa aktif). Jadwal hari Minggu kosong karena enum Hari hanya Senin–Sabtu.

## Menjalankan

```sh
npm run seed
# Mengganti seluruh isi database lama agar hanya berisi dataset kecil:
npm run seed -- --reset
# Opsional: unggah ulang foto mahasiswa0 dan dosen0, memerlukan konfigurasi S3:
npm run seed -- --photos
```

`--reset` menghapus SEMUA data aplikasi, termasuk akun dan refresh token; jangan gunakan pada database yang perlu dipertahankan. CLI menolak NODE_ENV=production. Transaksi rollback jika pengisian/validasi database gagal. Tidak ada reset database otomatis. Tanpa reset, data lain tetap ada sehingga jumlah total bisa lebih besar. Reset database tidak menghapus objek S3 lama; foto opsional hanya mengelola avatar yang masih dirujuk akun target.

Login: `admin`, `dosen0`–`dosen5`, `mahasiswa0`–`mahasiswa15`. Password dari `SEED_PASSWORD`, default demo `Tasik123`. Seed ulang mengembalikan profil, password dan skenario akademik akun seed ke nilai katalog.

Record utama di-upsert berdasarkan email, userId, kode dan unique key gabungan. Detail KRS/transkrip, jadwal, periode KRS dan riwayat status bertanda `[Seed]` dibangun ulang untuk ruang lingkup seed; jumlah stabil tetapi ID anak bisa berubah. Relasi KRS, nilai, dosen wali dan mata kuliah tetap konsisten. Satu tahun akademik dan periode KRS diaktifkan untuk snapshot ini. Konflik dengan jadwal data lain membatalkan transaksi.

## Analisis relasi

- Fakultas → Prodi → Dosen / Mahasiswa / Kurikulum / Kelas.
- User → Dosen atau Mahasiswa adalah relasi opsional satu-ke-satu (`userId` unik). Role harus cocok dengan profil; aturan ini belum dipaksa DB.
- Mahasiswa → Dosen wali opsional. Seed menempatkan dosen wali pada prodi yang sama; DB belum menjamin kesamaan prodi.
- Kurikulum ↔ MataKuliah melalui KurikulumMataKuliah; semester dan wajib berada pada relasi.
- Kelas + MataKuliah unik dalam KelasMataKuliah dan dosenId wajib. Kelas tanpa penugasan dapat ada, tetapi penugasan tanpa dosen tidak bisa.
- Jadwal menunjuk penugasan, ruangan, dan tahun akademik. Kesamaan tahun dengan kelas dan bentrok waktu tidak dijamin FK; seed memeriksanya.
- KRS unik per mahasiswa/tahun akademik; KRSDetail unik per KRS/penugasan. Header dan detail status menggunakan enum berbeda. Seed menyelaraskan keduanya dan mengisi metadata persetujuan hanya saat disetujui.
- Transkrip unik per mahasiswa/detail KRS. Mahasiswa transkrip harus sama dengan pemilik KRS; FK saja belum menjamin aturan tersebut.
- Hapus User meng-cascade profil dan refresh token; hapus Mahasiswa meng-cascade riwayat status. KRS/detail/transkrip dan jadwal harus ditangani dari anak ke induk karena tidak cascade.
- `approvedBy` berupa String tanpa FK, sehingga seed mengisinya dengan User.id dosen wali.
- PeriodeKRS dan Jadwal tidak memiliki unique key bisnis. Seed mengganti record dalam scope terpilih agar tidak duplikat.
- `isActive` tahun akademik tidak unik. Seed memastikan satu aktif; untuk penggunaan multi-user, aturan ini tetap perlu dijaga layanan/database.

Tidak ada migrasi schema dalam perubahan seed ini. Riwayat mahasiswa pada contoh hanya mencakup semester 2, sehingga IPK/SKS merupakan data parsial demo, bukan seluruh masa studi.

## Absensi dan pertemuan

`seed-data/attendance.ts` menambahkan 16 pertemuan untuk 8 jadwal terpilih (dua mata kuliah hari Senin per prodi, pada dua periode). Delapan pertemuan historis pada 16 dan 23 Februari 2026 berstatus SELESAI dengan total 64 absensi. Delapan pertemuan semester berjalan pada 14 dan 21 September 2026 berstatus BELUM_DIMULAI tanpa absensi. Status tersebut mengikuti snapshot demo September 2026, bukan jam saat seed dieksekusi.

Peserta hanya berasal dari header KRS DISETUJUI dan detail DISETUJUI yang menunjuk penugasan pada jadwal tersebut. Mahasiswa yang sekarang cuti tetap memiliki absensi historis karena dahulu mengikuti kelas. Pertemuan pertama seluruhnya HADIR; pertemuan kedua memiliki contoh IZIN, SAKIT dan ALPHA dengan keterangan. `ALPHA` mengikuti ejaan enum database.

Pertemuan unik per jadwal/nomor dan per jadwal/tanggal. Absensi unik per pertemuan/mahasiswa. Menghapus jadwal meng-cascade pertemuan dan absensi; relasi Absensi → Mahasiswa tidak cascade. Reset sekarang menghapus absensi dan pertemuan terlebih dahulu. Keikutsertaan pada KRS, kesesuaian hari/tanggal, dan larangan absensi pada pertemuan belum dimulai belum dijamin FK; seed menjaga aturan ini. Tidak ada perubahan schema atau migrasi.

Verifikasi tanpa database langsung: `node -r ts-node/register/transpile-only tests/seed.cjs` memeriksa dua kali seed, jumlah tetap, relasi akademik, nilai, serta peserta absensi yang sah. Ini pengujian mock, bukan pengujian constraint PostgreSQL.
