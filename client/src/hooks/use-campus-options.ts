import { useEffect, useState } from "react"
import { api } from "@/api/axios"
import { isAxiosError } from "axios"

interface Option { id: number; name: string }
export function useCampusOptions(kind: "fakultas" | "prodi", fakultasId?: number) {
  const [result, setResult] = useState<{ key: string; options: Option[]; error: string | null }>()
  const [attempt, setAttempt] = useState(0)
  const key = `${kind}-${fakultasId ?? "all"}-${attempt}`
  const enabled = kind === "fakultas" || !!fakultasId
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    async function load() {
      try {
        const options: Option[] = []
        let page = 1
        let totalPages = 1
        do {
          const response = await api.get<{ fakultas?: Option[]; prodi?: Option[]; pagination: { totalPages: number } }>(`/${kind}`, { params: { fakultasId, page, limit: 100, sortBy: "name", sortOrder: "asc" }, signal: controller.signal })
          options.push(...(response.data[kind] ?? []))
          totalPages = response.data.pagination.totalPages
          page += 1
        } while (page <= totalPages)
        if (!controller.signal.aborted) setResult({ key, options, error: null })
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key, options: [], error: isAxiosError<{ message?: string }>(error) ? error.response?.data?.message ?? "Pilihan gagal dimuat." : "Pilihan gagal dimuat." })
      }
    }
    void load()
    return () => controller.abort()
  }, [kind, fakultasId, enabled, key])
  return { options: enabled && result?.key === key ? result.options : [], loading: enabled && result?.key !== key, error: result?.key === key ? result.error : null, retry: () => setAttempt((value) => value + 1) }
}
