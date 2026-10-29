export const announcementCategories = ["Semua", "Akademik", "Perkuliahan", "Kegiatan", "Umum"] as const

export type AnnouncementCategory = Exclude<(typeof announcementCategories)[number], "Semua">

export type LecturerAnnouncement = {
  id: string
  title: string
  category: AnnouncementCategory
  summary: string
  content: string[]
  publisher: string
  publishedAt: string
  unread: boolean
  pinned?: boolean
  deadline?: string
  attachment?: {
    name: string
    size: string
  }
  action?: {
    label: string
    path: string
  }
}

export const lecturerAnnouncements: LecturerAnnouncement[] = [
  {
    id: "announcement-1",
    title: "Batas Akhir Pengisian Nilai Semester Ganjil",
    category: "Akademik",
    summary: "Seluruh dosen diminta menyelesaikan dan memublikasikan nilai kelas sebelum batas waktu yang ditentukan.",
    content: [
      "Sehubungan dengan penutupan kegiatan akademik semester ganjil, seluruh dosen pengampu diminta memastikan komponen nilai setiap mahasiswa telah terisi lengkap.",
      "Mohon lakukan pemeriksaan kembali sebelum nilai dipublikasikan. Nilai yang masih berstatus draf belum dapat dilihat oleh mahasiswa.",
    ],
    publisher: "Biro Administrasi Akademik",
    publishedAt: "2026-10-28T08:00:00+07:00",
    deadline: "2026-11-06T23:59:00+07:00",
    unread: true,
    pinned: true,
    attachment: { name: "Panduan_Pengisian_Nilai.pdf", size: "1,2 MB" },
    action: { label: "Input Nilai", path: "/dosen/nilai" },
  },
  {
    id: "announcement-2",
    title: "Penyesuaian Ruang Kuliah Pekan Ke-10",
    category: "Perkuliahan",
    summary: "Beberapa ruang kuliah mengalami penyesuaian karena pemeliharaan gedung pada pekan ke-10.",
    content: [
      "Pemeliharaan Gedung B akan dilaksanakan pada pekan ke-10. Kelas yang terdampak telah dipindahkan ke ruang pengganti.",
      "Dosen diminta memeriksa jadwal mengajar terbaru sebelum perkuliahan dan menginformasikan perubahan ruang kepada mahasiswa.",
    ],
    publisher: "Bagian Akademik Fakultas Teknik",
    publishedAt: "2026-10-27T13:30:00+07:00",
    deadline: "2026-11-02T07:00:00+07:00",
    unread: true,
    pinned: true,
    attachment: { name: "Daftar_Perubahan_Ruang.pdf", size: "860 KB" },
    action: { label: "Lihat Jadwal Mengajar", path: "/dosen/jadwal-mengajar" },
  },
  {
    id: "announcement-3",
    title: "Workshop Pembelajaran Berbasis Proyek",
    category: "Kegiatan",
    summary: "Pendaftaran workshop penyusunan pembelajaran berbasis proyek untuk dosen telah dibuka.",
    content: [
      "Fakultas Teknik menyelenggarakan workshop pembelajaran berbasis proyek pada Jumat, 13 November 2026 di Auditorium Utama.",
      "Kegiatan ini ditujukan bagi dosen yang ingin memperkuat perancangan aktivitas dan asesmen kolaboratif di kelas.",
    ],
    publisher: "Unit Pengembangan Pembelajaran",
    publishedAt: "2026-10-25T10:15:00+07:00",
    deadline: "2026-11-09T16:00:00+07:00",
    unread: true,
    attachment: { name: "Agenda_Workshop.pdf", size: "540 KB" },
  },
  {
    id: "announcement-4",
    title: "Pengingat Pengisian Presensi Perkuliahan",
    category: "Perkuliahan",
    summary: "Pastikan presensi mahasiswa diisi untuk setiap pertemuan yang telah terlaksana.",
    content: [
      "Dosen pengampu diminta memperbarui presensi mahasiswa setelah kegiatan perkuliahan selesai.",
      "Data presensi yang lengkap membantu proses evaluasi kehadiran dan pelaporan akademik pada akhir semester.",
    ],
    publisher: "Program Studi Teknik Informatika",
    publishedAt: "2026-10-23T09:00:00+07:00",
    unread: false,
    action: { label: "Kelola Presensi", path: "/dosen/presensi" },
  },
  {
    id: "announcement-5",
    title: "Jadwal Rapat Evaluasi Tengah Semester",
    category: "Umum",
    summary: "Rapat evaluasi pembelajaran tengah semester akan dilaksanakan secara luring di ruang rapat fakultas.",
    content: [
      "Rapat evaluasi tengah semester dijadwalkan pada Rabu, 4 November 2026 pukul 09.00 WIB di Ruang Rapat Fakultas Teknik.",
      "Setiap dosen diharapkan membawa catatan kendala perkuliahan dan tindak lanjut yang telah dilakukan.",
    ],
    publisher: "Dekan Fakultas Teknik",
    publishedAt: "2026-10-20T14:20:00+07:00",
    unread: false,
    attachment: { name: "Undangan_Rapat_Evaluasi.pdf", size: "420 KB" },
  },
  {
    id: "announcement-6",
    title: "Periode Review KRS Mahasiswa PA",
    category: "Akademik",
    summary: "Dosen pembimbing akademik dapat meninjau pengajuan KRS mahasiswa pada periode yang sedang berjalan.",
    content: [
      "Periode review KRS mahasiswa pembimbing akademik dibuka hingga 31 Oktober 2026.",
      "Mohon periksa beban studi serta jadwal mata kuliah sebelum memberikan persetujuan atau catatan perbaikan.",
    ],
    publisher: "Biro Administrasi Akademik",
    publishedAt: "2026-10-18T08:30:00+07:00",
    deadline: "2026-10-31T23:59:00+07:00",
    unread: false,
    action: { label: "Review KRS", path: "/dosen/persetujuan-krs" },
  },
  {
    id: "announcement-7",
    title: "Pemeliharaan Portal Akademik",
    category: "Umum",
    summary: "Portal akademik akan menjalani pemeliharaan terjadwal pada akhir pekan.",
    content: [
      "Pemeliharaan portal dijadwalkan pada Sabtu, 7 November 2026 pukul 22.00–23.30 WIB.",
      "Selama periode tersebut, sebagian layanan akademik mungkin tidak dapat diakses untuk sementara waktu.",
    ],
    publisher: "UPT Teknologi Informasi",
    publishedAt: "2026-10-15T15:00:00+07:00",
    unread: false,
  },
]
