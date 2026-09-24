import { AppShell } from "../app-shell/AppShell"
import { PortalNavigation } from "../app-shell/PortalNavigation"
import { dosenNavigation } from "@/navigation/dosen-navigation"
import { navigationLabels } from "@/navigation/types"
const pageLabels = navigationLabels(dosenNavigation)
export default function DosenLayout() {
  return <AppShell dashboardPath="/dosen/dashboard" pageLabels={pageLabels} navigation={<PortalNavigation basePath="/dosen" groups={dosenNavigation} />} />
}
