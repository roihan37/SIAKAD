import { useEffect, useState } from "react"
export function useRetryAfter(retryAt?: number) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!retryAt) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [retryAt])
  return Math.max(0, Math.ceil(((retryAt ?? 0) - now) / 1000))
}
