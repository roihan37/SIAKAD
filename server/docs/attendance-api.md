# Admin presensi

Semua route memerlukan Bearer token admin. Prefix `/api/admin` dan `/api/v1/admin` tersedia.

- GET `/presensi/summary`
- GET `/presensi/students`
- GET `/presensi/meetings`
- GET `/presensi/meetings/:meetingId`
- GET `/presensi/filters`

Filter bersama: tahunAkademikId, prodiId, kelasId, mataKuliahId (integer positif), dosenId (Dosen.id), search (maksimal 200 karakter), page (default 1), limit (default 10, maksimal 100). Tidak memberikan tahun berarti seluruh tahun, bukan tahun aktif otomatis. Filter kosong tidak diperlukan; hilangkan parameter yang tidak dipilih. Format invalid menghasilkan 400, detail tidak ditemukan menghasilkan 404.

Search memilih **pertemuan** berdasarkan topik, kode/nama mata kuliah, nama kelas, nama dosen, atau nama/NIM mahasiswa dengan absensi. Setelah pertemuan dipilih, seluruh catatan absensinya dihitung; search mahasiswa tidak menghilangkan catatan teman sekelas. Ini menjaga scope summary dan meetings tetap sama.

Summary tidak dipaginasi. averageAttendance = HADIR / seluruh catatan × 100, satu desimal, nol jika kosong. ALPHA dipetakan menjadi absent. Tidak ada imputasi alpha untuk mahasiswa tanpa catatan. Pertemuan belum dimulai tampil dengan count nol jika belum memiliki absensi.

Students dikelompokkan per mahasiswa–kelas (kelas berbeda menghasilkan baris terpisah), hanya untuk mahasiswa yang memiliki absensi. TotalRows menghitung kelompok, bukan akun unik. Sorting NIM lalu class.id. Meetings dipaginasi di database, diurutkan tanggal menurun lalu ID. Detail mengembalikan seluruh catatan siswa pertemuan dan mengabaikan pemotongan page/limit sesuai kontrak detail.

Filters mengembalikan `data.academicYears`, `studyPrograms`, `classes`, `courses`, `lecturers`; masing-masing berbentuk `{ items: [...], pagination: { page, limit, totalRows, totalPages } }`. Pilihan mengikuti filter struktural berdasarkan jadwal; bila search diisi, jadwal dibatasi ke pertemuan yang cocok. Lecturer option menyediakan `id` (Dosen.id), `userId`, `name`. Response detail/rekap menggunakan lecturer.id = User.id sesuai kontrak.

Tanggal pertemuan YYYY-MM-DD memakai Asia/Jakarta. Tidak ada perubahan database atau schema.

Pengujian: `node -r ts-node/register/transpile-only tests/attendance.cjs`.

Batas implementasi: rekap mahasiswa mengelompokkan projection catatan absensi terfilter di memory sebelum pagination; pilihan filter juga dideduplikasi di memory. Untuk volume sangat besar perlu agregasi SQL mahasiswa–kelas dan paging opsi di database. Summary memakai GROUP BY dan meetings memakai pagination database.
