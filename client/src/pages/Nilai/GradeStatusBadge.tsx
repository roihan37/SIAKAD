import { Badge } from "@/components/ui/badge"
import type { GradeStatus } from "@/types/grades"
import { statusLabels } from "./grade-format"
const colors: Record<GradeStatus, string> = {
  FINAL: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  BELUM_LENGKAP: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  BELUM_DIINPUT: "bg-muted text-muted-foreground",
}
export function GradeStatusBadge({ status }: { status: GradeStatus }) {
  return <Badge variant="secondary" className={colors[status]}>{statusLabels[status] ?? "Status tidak dikenal"}</Badge>
}
