export type StudentNotification = {
  id: string
  category: string
  title: string
  message: string
  time: string
  href: string
  unread: boolean
}

export const studentNotifications: StudentNotification[] = [
  { id: "krs-approved", category: "KRS", title: "KRS kamu disetujui", message: "Pengajuan KRS semester ini telah disetujui.", time: "10 menit lalu", href: "/mahasiswa/krs", unread: true },
  { id: "grades-published", category: "Nilai", title: "Nilai semester telah dipublikasikan", message: "Nilai untuk beberapa mata kuliah sudah tersedia.", time: "1 jam lalu", href: "/mahasiswa/nilai-khs", unread: true },
  { id: "ukt-due", category: "Keuangan", title: "Tagihan UKT segera jatuh tempo", message: "Periksa tagihan dan tanggal jatuh tempo pembayaranmu.", time: "3 jam lalu", href: "/mahasiswa/tagihan-ukt", unread: true },
  { id: "payment-success", category: "Keuangan", title: "Pembayaran berhasil", message: "Pembayaran UKT kamu telah berhasil diverifikasi.", time: "Kemarin", href: "/mahasiswa/riwayat-pembayaran", unread: false },
  { id: "schedule-change", category: "Jadwal", title: "Ada perubahan jadwal kuliah", message: "Jadwal salah satu kelasmu mengalami perubahan.", time: "Kemarin", href: "/mahasiswa/jadwal-kuliah", unread: false },
  { id: "announcement", category: "Pengumuman", title: "Pengumuman penting dari akademik", message: "Baca informasi terbaru terkait kegiatan akademik.", time: "2 hari lalu", href: "/mahasiswa/pengumuman", unread: false },
]
