import { ComboboxPopup } from "@/components/combobox"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import type { ComboboxOption } from "@/types/combobox"

export interface FilterConfig {
  key: string
  items: ComboboxOption[]
  value?: ComboboxOption
  placeholder: string
  onChange: (value: ComboboxOption) => void
  width?: string
}

interface PageFiltersProps {
  filters: FilterConfig[]
  onReset?: () => void
  showReset?: boolean
}

export function PageFilters({
  filters,
  onReset,
  showReset = true,
}: PageFiltersProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-2 sm:flex-row sm:flex-wrap sm:items-center">

      {/* Label */}
      <div className="hidden shrink-0 px-2 text-sm font-medium text-muted-foreground sm:block">
        Filter
      </div>

      {/* Filters */}
      {filters.map((filter) => (
        <div
          key={filter.key}
          className={
            filter.width ??
            "w-full sm:w-56"
          }
        >
          <ComboboxPopup
            items={filter.items}
            value={filter.value}
            placeholder={filter.placeholder}
            onValueChange={filter.onChange}
          />
        </div>
      ))}

      {/* Reset */}
      {showReset && onReset && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
        >
          <RotateCcw className="size-4" />
          Reset
        </Button>
      )}
    </div>
  )
}