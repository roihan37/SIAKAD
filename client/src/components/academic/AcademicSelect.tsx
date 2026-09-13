import { useId } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AcademicSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const id = useId()
  return <div className="min-w-0 space-y-1.5">
    <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
    <Select value={value} onValueChange={(next) => { if (next) onChange(next) }}>
      <SelectTrigger id={id} className="h-10 w-full"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
    </Select>
  </div>
}
