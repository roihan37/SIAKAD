import { AppShell } from "../app-shell/AppShell"
import { NavMain } from "@/components/nav/nav-main"
import { NavProjects } from "@/components/nav/nav-projects"
import { adminNavigation } from "@/navigation/admin-navigation"
import { comingSoonPages } from "@/pages/ComingSoon/coming-soon-pages"
const adminPageLabels: Record<string, string> = {
  ...Object.fromEntries(comingSoonPages.map(({ path, title }) => [path.slice(1), title])),
  dashboard: "Dashboard",
  "tagihan-ukt": "Tagihan UKT",
  pembayaran: "Pembayaran",
  presensi: "Presensi",
  nilai: "Nilai",
  mahasiswa: "Mahasiswa",
  dosen: "Dosen",
  fakultas: "Fakultas",
  "program-studi": "Program Studi",
  "mata-kuliah": "Mata Kuliah",
  ruangan: "Ruangan",
  "tahun-akademik": "Tahun Akademik",
  kurikulum: "Kurikulum",
  "jadwal-kuliah": "Jadwal Kuliah",
  krs: "KRS",
}

export default function AdminLayout() {
  return <AppShell dashboardPath="/admin/dashboard" pageLabels={adminPageLabels} navigation={<><NavMain items={adminNavigation.navMain} /><NavProjects profile={adminNavigation.profile} /></>} />
}
