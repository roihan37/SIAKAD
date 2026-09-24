import type { PortalNavigationGroup } from "./types"
export const mahasiswaNavigation: PortalNavigationGroup[] = [
  { label: "UTAMA", items: [{ title: "Dashboard", path: "dashboard", icon: "dashboard" }] },
  { label: "AKADEMIK", items: [
    { title: "KRS", path: "krs", icon: "krs" },
    { title: "Jadwal Kuliah", path: "jadwal-kuliah", icon: "calendar" },
    { title: "Nilai & KHS", path: "nilai-khs", icon: "graduation" },
    { title: "Presensi", path: "presensi", icon: "attendance" },
    { title: "Transkrip Nilai", path: "transkrip-nilai", icon: "transcript" },
  ] },
  { label: "KEUANGAN", items: [
    { title: "Tagihan UKT", path: "tagihan-ukt", icon: "wallet" },
    { title: "Riwayat Pembayaran", path: "riwayat-pembayaran", icon: "receipt" },
  ] },
  { label: "LAINNYA", items: [
    { title: "Pengumuman", path: "pengumuman", icon: "announcement" },
    { title: "AI Assistant", path: "ai-assistant", icon: "sparkles" },
    { title: "Skripsi", path: "skripsi", icon: "graduation" },
  ] },
  { label: "AKUN", items: [
    { title: "Profil", path: "profil", icon: "profile" },
    { title: "Pengaturan", path: "pengaturan", icon: "settings" },
    { title: "Ubah Password", path: "ubah-password", icon: "password" },
  ] },
]
