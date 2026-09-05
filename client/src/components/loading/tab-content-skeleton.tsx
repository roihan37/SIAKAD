import { Card, CardHeader, CardContent } from "../ui/card"
import { Skeleton } from "../ui/skeleton"

const tabs = ["Informasi Pribadi", "Akademik", "KRS", "Nilai", "Presensi", "Keuangan", "Akun"] as const
type Tab = (typeof tabs)[number]

export function TabContentSkeleton({ tab }: { tab: Tab }) {
	const isAcademic = tab === "Akademik"
	const isKrs = tab === "KRS"
	const isGrades = tab === "Nilai"

	const TableSkeleton = ({ rows = 4, columns = 5 }: { rows?: number; columns?: number }) => (
		<div className="overflow-hidden rounded-xl border">
			<div className="overflow-x-auto">
				<div className="min-w-[640px]">
					<div className="flex items-center gap-6 border-b bg-muted/40 px-6 py-3">
						{Array.from({ length: columns }, (_, index) => <Skeleton key={index} className={`h-3 ${index === 1 ? "w-40" : "w-16"}`} />)}
					</div>
					<div className="divide-y">
						{Array.from({ length: rows }, (_, rowIndex) => <div key={rowIndex} className="flex items-center gap-6 px-6 py-4">
							{Array.from({ length: columns }, (_, columnIndex) => <Skeleton key={columnIndex} className={`${columnIndex === 1 ? "w-40" : columnIndex === columns - 1 ? "w-16 rounded-full" : "w-12"} h-4`} />)}
						</div>)}
					</div>
				</div>
			</div>
		</div>
	)

	const FilterSkeleton = ({ fields = 1 }: { fields?: number }) => (
		<Card>
			<CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
			<CardContent className={`grid gap-4 ${fields > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : "max-w-sm"}`}>
				{Array.from({ length: fields }, (_, index) => <div key={index} className="space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-9 w-full rounded-lg" /></div>)}
			</CardContent>
		</Card>
	)

	return (
		<div className="space-y-5" aria-label={`Memuat data ${tab}`}>
			{isAcademic && <Card>
				<CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
				<CardContent className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 5 }, (_, index) => <div key={index} className="space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-4 w-36" /></div>)}
				</CardContent>
			</Card>}

			{(isKrs || isGrades) && <FilterSkeleton fields={isKrs ? 3 : 1} />}

			{isAcademic && <Card>
				<CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
				<CardContent className="p-0"><TableSkeleton columns={6} /></CardContent>
			</Card>}

			{isKrs && <Card>
				<CardHeader><Skeleton className="h-5 w-44" /></CardHeader>
				<CardContent className="p-0"><TableSkeleton columns={5} /></CardContent>
			</Card>}

			{isGrades && <>
				<Card>
					<CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
					<CardContent className="p-0"><TableSkeleton columns={5} rows={3} /></CardContent>
				</Card>
				<div className="grid gap-4 sm:grid-cols-2">
					{Array.from({ length: 2 }, (_, index) => <Card key={index}><CardContent className="space-y-3 p-5"><Skeleton className="h-4 w-12" /><Skeleton className="h-9 w-20" /></CardContent></Card>)}
				</div>
			</>}
		</div>
	)
}