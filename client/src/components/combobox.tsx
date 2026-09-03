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
import type { ComboboxPopupProps } from "@/types/combobox"



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