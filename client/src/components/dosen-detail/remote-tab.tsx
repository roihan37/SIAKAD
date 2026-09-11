import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"
import type { RemoteData } from "@/types/lecturer-tabs"

export function TabSkeleton() {
  return <div className="space-y-4" aria-busy="true" aria-label="Memuat data tab"><span className="sr-only" role="status">Memuat data...</span><div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div><div className="space-y-4 rounded-xl border p-4">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div></div>
}

export function RemoteTab<T>({ state, retry, children }: { state: RemoteData<T>; retry: () => void; children: (data: T) => ReactNode }) {
  if (state.loading) return <TabSkeleton />
  if (state.error) return <div className="rounded-xl border p-8 text-center"><p role="alert" className="text-sm text-muted-foreground">{state.error}</p><Button variant="outline" className="mt-4" onClick={retry}><RefreshCw /> Coba Lagi</Button></div>
  if (state.data === null) return <TabSkeleton />
  return <>{children(state.data)}</>
}

export function EmptyTab({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{children}</div>
}
