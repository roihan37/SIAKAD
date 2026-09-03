export interface ComboboxOption {
  id: number
  label: string
  value?: string | number | undefined
}

export interface ComboboxPopupProps {
  items: ComboboxOption[]
  value?: ComboboxOption
  placeholder?: string
  onValueChange?: (
    value: ComboboxOption
  ) => void
}