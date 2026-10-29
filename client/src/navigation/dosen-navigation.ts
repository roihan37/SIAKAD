import type { PortalNavigationGroup } from "./types"
export const dosenNavigation: PortalNavigationGroup[] = [
  { label: "UTAMA", items: [{ title: "Dashboard", path: "dashboard", icon: "dashboard" }] },
  { label: "PERKULIAHAN", items: [
    { title: "Jadwal Mengajar", path: "jadwal-mengajar", icon: "calendar" },
    { title: "Kelas & Mata Kuliah", path: "kelas-mata-kuliah", icon: "course" },
    { title: "Presensi", path: "presensi", icon: "attendance" },
    { title: "Nilai", path: "nilai", icon: "transcript" },
  ] },
  { label: "BIMBINGAN", items: [
    { title: "Mahasiswa PA", path: "mahasiswa-pa", icon: "advisees" },
    { title: "Persetujuan KRS", path: "persetujuan-krs", icon: "approval" },
    { title: "Bimbingan Skripsi", path: "bimbingan-skripsi", icon: "graduation" },
  ] },
  { label: "INFORMASI", items: [
    { title: "Pengumuman", path: "pengumuman", icon: "announcement" },
    { title: "AI Assistant", path: "ai-assistant", icon: "sparkles" },
  ] },
  { label: "AKUN", items: [
    { title: "Profil", path: "profil", icon: "profile" },
    { title: "Pengaturan", path: "pengaturan", icon: "settings" },
    { title: "Ubah Password", path: "ubah-password", icon: "password" },
  ] },
]
