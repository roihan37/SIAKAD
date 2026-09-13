import { useRef, useState } from "react"
import { masterError } from "./master-api"

// A ref locks immediately, including clicks before React renders the loading state.
export function useMasterMutation() {
  const pending = useRef(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (operation: () => Promise<unknown>): Promise<boolean> => {
    if (pending.current) return false
    pending.current = true
    setSaving(true)
    setError(null)
    try {
      await operation()
      return true
    } catch (cause) {
      setError(masterError(cause))
      return false
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  return { pending, saving, error, run }
}
