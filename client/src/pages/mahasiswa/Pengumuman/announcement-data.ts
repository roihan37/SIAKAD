export type AnnouncementCategory = "Akademik" | "Keuangan" | "Kegiatan" | "Umum"

export type Announcement = {
  id: string
  title: string
  category: AnnouncementCategory
  publishedAt: string
  publisher: string
  summary: string
  content: string[]
  pinned?: boolean
  unread?: boolean
  deadline?: string
  attachment?: {
    name: string
    size: string
  }
  action?: {
    label: string
    path: string
    expired?: boolean
  }
}

export const announcementCategories = ["Semua", "Akademik", "Keuangan", "Kegiatan", "Umum"] as const

export const announcements: Announcement[] = [
  {
    id: "krs-ganjil-2026",
    title: "Periode Pengisian KRS Semester Ganjil Dibuka",
    category: "Akademik",
    publishedAt: "2026-10-06T08:00:00+07:00",
    publisher: "Biro Administrasi Akademik",
    summary: "Pengisian dan pengajuan KRS dibuka sampai 12 Oktober 2026. Periksa kembali kelas dan total SKS sebelum mengajukan.",
    content: [
      "Periode pengisian KRS Semester Ganjil Tahun Akademik 2026/2027 telah dibuka untuk seluruh mahasiswa aktif.",
      "Pastikan mata kuliah yang dipilih tidak memiliki bentrok jadwal, memenuhi prasyarat, dan tidak melampaui batas SKS. KRS yang sudah diajukan akan masuk ke proses persetujuan dosen pembimbing akademik.",
    ],
    pinned: true,
    unread: true,
    deadline: "2026-10-12T23:59:00+07:00",
    attachment: { name: "Panduan-Pengisian-KRS-2026.pdf", size: "1,2 MB" },
    action: { label: "Buka KRS", path: "/mahasiswa/krs" },
  },
  {
    id: "ukt-ganjil-2026",
    title: "Pengingat Pembayaran UKT Semester Ganjil",
    category: "Keuangan",
    publishedAt: "2026-10-05T09:30:00+07:00",
    publisher: "Direktorat Keuangan",
    summary: "Pastikan pembayaran UKT diselesaikan sebelum 10 Oktober 2026 agar layanan akademik tetap dapat digunakan.",
    content: [
      "Mahasiswa yang masih memiliki sisa tagihan UKT diminta menyelesaikan pembayaran sesuai nominal pada portal SIAKAD.",
      "Status pembayaran dapat membutuhkan waktu pemrosesan setelah transaksi. Simpan bukti pembayaran untuk keperluan verifikasi apabila diperlukan.",
    ],
    pinned: true,
    unread: true,
    deadline: "2026-10-10T23:59:00+07:00",
    action: { label: "Lihat Tagihan", path: "/mahasiswa/tagihan-ukt" },
  },
  {
    id: "jadwal-uts-2026",
    title: "Jadwal Ujian Tengah Semester Telah Tersedia",
    category: "Akademik",
    publishedAt: "2026-10-04T13:15:00+07:00",
    publisher: "Biro Administrasi Akademik",
    summary: "Jadwal UTS dapat dilihat melalui menu Jadwal Kuliah. Perhatikan perubahan ruangan pada beberapa mata kuliah.",
    content: [
      "Jadwal Ujian Tengah Semester Ganjil Tahun Akademik 2026/2027 telah diterbitkan.",
      "Mahasiswa diminta memeriksa tanggal, waktu, dan ruangan masing-masing mata kuliah. Hadir paling lambat 15 menit sebelum ujian dimulai dan membawa kartu mahasiswa.",
    ],
    unread: true,
    action: { label: "Lihat Jadwal", path: "/mahasiswa/jadwal-kuliah" },
  },
  {
    id: "seminar-karier-digital",
    title: "Pendaftaran Seminar Karier Digital 2026",
    category: "Kegiatan",
    publishedAt: "2026-10-02T10:00:00+07:00",
    publisher: "Direktorat Kemahasiswaan",
    summary: "Ikuti seminar persiapan karier bersama praktisi industri. Kuota terbatas untuk 200 peserta.",
    content: [
      "Direktorat Kemahasiswaan mengundang mahasiswa untuk mengikuti Seminar Karier Digital 2026 di Auditorium Utama pada 17 Oktober 2026.",
      "Materi meliputi persiapan portofolio, simulasi wawancara, dan tren kompetensi digital yang dibutuhkan industri.",
    ],
    deadline: "2026-10-14T17:00:00+07:00",
    attachment: { name: "Poster-Seminar-Karier.pdf", size: "840 KB" },
  },
  {
    id: "pemeliharaan-siakad",
    title: "Pemeliharaan Sistem SIAKAD Terjadwal",
    category: "Umum",
    publishedAt: "2026-09-30T15:45:00+07:00",
    publisher: "UPT Teknologi Informasi",
    summary: "SIAKAD tidak dapat diakses sementara pada Sabtu, 10 Oktober 2026 pukul 22.00–23.30 WIB.",
    content: [
      "Pemeliharaan rutin akan dilakukan untuk meningkatkan stabilitas dan keamanan layanan SIAKAD.",
      "Selesaikan aktivitas penting sebelum waktu pemeliharaan. Layanan akan kembali tersedia setelah proses selesai.",
    ],
  },
  {
    id: "koreksi-data-nilai",
    title: "Batas Akhir Pengajuan Koreksi Data Nilai",
    category: "Akademik",
    publishedAt: "2026-09-22T08:30:00+07:00",
    publisher: "Biro Administrasi Akademik",
    summary: "Periode pengajuan koreksi data nilai semester sebelumnya telah berakhir pada 30 September 2026.",
    content: [
      "Mahasiswa dapat memeriksa nilai semester sebelumnya pada halaman Nilai & KHS.",
      "Batas pengajuan koreksi telah berakhir. Untuk kendala administratif, hubungi program studi dengan membawa dokumen pendukung.",
    ],
    deadline: "2026-09-30T16:00:00+07:00",
    action: { label: "Lihat Nilai", path: "/mahasiswa/nilai-khs", expired: true },
  },
]
