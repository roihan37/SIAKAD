// Shared by route registration, navigation, and breadcrumb labels.
export const comingSoonPages = [
  { path: "/skripsi", title: "Skripsi" },
  { path: "/pembayaran", title: "Pembayaran" },
  { path: "/beasiswa", title: "Beasiswa" },
  { path: "/manajemen-user", title: "Manajemen User" },
  { path: "/role-permission", title: "Role & Permission" },
  { path: "/log-aktivitas", title: "Log Aktivitas" },
  { path: "/backup-database", title: "Backup Database" },
  { path: "/pengaturan-sistem", title: "Pengaturan Sistem" },
  { path: "/laporan-mahasiswa", title: "Data Mahasiswa" },
  { path: "/laporan-dosen", title: "Data Dosen" },
  { path: "/rekap-nilai", title: "Rekap Nilai" },
  { path: "/rekap-presensi", title: "Rekap Presensi" },
  { path: "/rekap-pembayaran", title: "Rekap Pembayaran" },
  { path: "/profil", title: "Profile" },
  { path: "/ubah-password", title: "Ubah Password" },
] as const

export function upcomingPath(title: string) {
  return comingSoonPages.find((page) => page.title === title)?.path ?? "#"
}
