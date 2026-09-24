import { Skeleton } from "@/components/ui/skeleton"
export function RouteLoading() {
  return <div role="status" aria-live="polite" aria-busy="true" className="w-full space-y-6 p-6">
    <span className="sr-only">Memuat halaman...</span>
    <div className="space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 max-w-full" /></div>
    <Skeleton className="h-20 w-full rounded-xl" />
    <div className="space-y-3 rounded-xl border p-4">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
  </div>
}
