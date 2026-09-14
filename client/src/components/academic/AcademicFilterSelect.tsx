import { useId } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
type SelectOption = { id: string; label: string }
export function AcademicFilterSelect({ label, value, options, disabled, required, onChange }: { label: string; value: number | string | undefined; options: SelectOption[]; disabled?: boolean; required?: boolean; onChange: (value: string | undefined) => void }) {
  const id = useId()
  return <div className="min-w-0 space-y-1.5"><label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label><Select items={[{ value: "all", label: required ? `Pilih ${label}` : "Semua" }, ...options.map((option) => ({ value: option.id, label: option.label }))]} value={value === undefined ? "all" : String(value)} disabled={disabled} onValueChange={(next) => { if (next !== null) onChange(next === "all" ? undefined : next) }}><SelectTrigger id={id} className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all" disabled={required}>{required ? `Pilih ${label}` : "Semua"}</SelectItem>{options.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}</SelectContent></Select></div>
}
