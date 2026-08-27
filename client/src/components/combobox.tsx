import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"

import { Button } from "@/components/ui/button"

interface ComboboxItem {
  id: number
  label: string
}

interface ComboboxPopupProps {
  items: ComboboxItem[]
  value?: ComboboxItem
  placeholder?: string
  onValueChange?: (
    value: ComboboxItem
  ) => void
}
export function ComboboxPopup({
  items,
  value,
  placeholder = "Pilih",
  onValueChange,
}: ComboboxPopupProps) {
  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={(value) => {
        if (value) {
          onValueChange?.(value)
        }
      }}
    >
      <ComboboxTrigger
        render={
          <Button
            variant="outline"
            className="w-full justify-between font-normal"
          >
            <ComboboxValue
              placeholder={placeholder}
            />
          </Button>
        }
      />

      <ComboboxContent>
        <ComboboxInput
          showTrigger={false}
          placeholder="Cari..."
        />

        <ComboboxEmpty>
          Data tidak ditemukan.
        </ComboboxEmpty>

        <ComboboxList>
          {(item) => (
            <ComboboxItem
              key={item.id}
              value={item}
            >
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}