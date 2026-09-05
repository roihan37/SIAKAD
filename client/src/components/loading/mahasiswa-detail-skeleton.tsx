import { Skeleton } from "../ui/skeleton";

export function MahasiswaDetailSkeleton() {
	return (
		<main className="mx-auto w-full max-w-6xl space-y-5 py-5 sm:py-7" aria-label="Memuat detail mahasiswa">
			<Skeleton className="h-8 w-28" />

			<section className="rounded-xl bg-muted px-5 py-6 sm:px-8 sm:py-8">
				<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-4">
						<Skeleton className="size-16 shrink-0 rounded-full bg-muted-foreground/20 sm:size-20" />
						<div className="space-y-3">
							<Skeleton className="h-7 w-44 bg-muted-foreground/20 sm:w-56" />
							<Skeleton className="h-4 w-28 bg-muted-foreground/20" />
							<Skeleton className="h-4 w-40 bg-muted-foreground/20" />
							<Skeleton className="h-5 w-16 rounded-full bg-muted-foreground/20" />
						</div>
					</div>
					<div className="flex gap-2 self-start sm:self-center">
						<Skeleton className="h-8 w-32" />
						<Skeleton className="size-8" />
					</div>
				</div>
			</section>

			<section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{["ipk", "sks", "semester", "kehadiran"].map((metric) => <div key={metric} className="rounded-xl border p-4"><Skeleton className="h-4 w-24" /><Skeleton className="mt-3 h-8 w-16" /></div>)}
			</section>

			<section className="overflow-hidden rounded-xl border bg-card">
				<div className="flex gap-6 overflow-hidden border-b px-4 py-4">
					{["tab-one", "tab-two", "tab-three", "tab-four", "tab-five"].map((tab) => <Skeleton key={tab} className="h-4 w-20 shrink-0" />)}
				</div>
				<div className="space-y-5 p-4 sm:p-6">
					<div className="grid gap-5 lg:grid-cols-2"><div className="rounded-xl border p-5"><Skeleton className="h-5 w-36" /><div className="mt-6 grid gap-5 sm:grid-cols-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div></div><div className="rounded-xl border p-5"><Skeleton className="h-5 w-24" /><div className="mt-6 space-y-5"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div></div></div>
					<div className="rounded-xl border p-5"><Skeleton className="h-5 w-48" /><Skeleton className="mt-6 h-24 w-full" /></div>
				</div>
			</section>
		</main>
	)
}