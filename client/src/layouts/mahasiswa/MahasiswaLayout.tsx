import { MahasiswaMobileNavigation } from "./MahasiswaMobileNavigation"
import { AppShell } from "../app-shell/AppShell"
import { PortalNavigation } from "../app-shell/PortalNavigation"
import { mahasiswaNavigation } from "@/navigation/mahasiswa-navigation"
import { navigationLabels } from "@/navigation/types"
import { MahasiswaAIFloatingButton } from "./MahasiswaAIFloatingButton"
const pageLabels = { ...navigationLabels(mahasiswaNavigation), notifikasi: "Notifikasi" }
export default function MahasiswaLayout() {
  return <><AppShell dashboardPath="/mahasiswa/dashboard" pageLabels={pageLabels} mobileNavigation={<MahasiswaMobileNavigation />} navigation={<PortalNavigation basePath="/mahasiswa" groups={mahasiswaNavigation} />} studentUser /><MahasiswaAIFloatingButton /></>
}
