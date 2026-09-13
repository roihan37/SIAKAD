import { Badge } from "@/components/ui/badge"
import type { GradeStatus } from "./nilai-data"
const colors: Record<GradeStatus, string> = {
  Final: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "Belum Lengkap": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "Belum Diinput": "bg-muted text-muted-foreground",
}
export function GradeStatusBadge({ status }: { status: GradeStatus }) {
  return <Badge variant="secondary" className={colors[status]}>{status}</Badge>
}
