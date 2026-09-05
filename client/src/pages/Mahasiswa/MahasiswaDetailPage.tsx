import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Activity, ArrowLeft, Ban, BookOpen, CalendarDays, Check, Ellipsis, GraduationCap, KeyRound, Pencil, UserRound } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { toast } from "sonner"
import { getStudentById, getStudentHistorySemester, getStudentKRS, getStudentNilai } from "@/features/action/mahasiswaThunk"
import { getAllTAkademik } from "@/features/action/tAkademikThunk"
import { TabContent } from "@/components/mahasiswa-detail/tab-content"
import { MahasiswaDetailSkeleton } from "@/components/loading/mahasiswa-detail-skeleton"

const tabs = ["Informasi Pribadi", "Akademik", "KRS", "Nilai", "Presensi", "Keuangan", "Akun"] as const
type Tab = (typeof tabs)[number]

function getInitials(name: string) {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase()
}

export default function MahasiswaDetailPage() {
	const navigate = useNavigate()
	const dispatch = useAppDispatch()
	const { id } = useParams()
	const { studentDetail } = useAppSelector((state) => state.students)
	const academicYears = useAppSelector((state) => state.tAkademik.tAkademik)
	const [activeTab, setActiveTab] = useState<Tab>("Informasi Pribadi")
	const [currentStatus, setCurrentStatus] = useState(studentDetail?.student?.status || "Aktif")
	const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
	const [newStatus, setNewStatus] = useState("Cuti")
	const [statusReason, setStatusReason] = useState("")
	const [activityLogs, setActivityLogs] = useState<string[]>([])
	const summary = studentDetail?.student.summary

	const handleStatusSave = () => {
		const activity = `Status mahasiswa diubah dari ${currentStatus} menjadi ${newStatus}${statusReason.trim() ? `: ${statusReason.trim()}` : ""}`
		setCurrentStatus(newStatus)
		setActivityLogs((logs) => [activity, ...logs])
		setIsStatusDialogOpen(false)
		setStatusReason("")
		toast.success("Status berhasil diubah dan dicatat di Log Aktivitas")
	}

	const metrics = [
		{ label: "IPK", value: summary ? summary.ipk.toFixed(2) : "-", icon: GraduationCap },
		{ label: "Total SKS", value: summary?.totalSKS?.toString() ?? "-", icon: BookOpen },
		{ label: "Semester", value: summary?.semester?.toString() ?? "-", icon: CalendarDays },
		{ label: "Kehadiran", value: summary?.kehadiran != null ? `${summary.kehadiran}%` : "-", icon: Check },
	]
	
	useEffect(() => {
		if(id){
			dispatch(getStudentById(id))
		}
	}, [dispatch, id])

	useEffect(() => {
		dispatch(getAllTAkademik({ limit: 100 }))
	}, [dispatch])

	useEffect(() => {
		if (!id) return

		if (activeTab === "Akademik") {
			dispatch(getStudentHistorySemester(id))
		}

		const activeAcademicYear = academicYears.find((year) => year.isActive) ?? academicYears[0]
		if (activeAcademicYear?.id && activeTab === "KRS") {
			dispatch(getStudentKRS({ id, tahunAkademikId: activeAcademicYear.id }))
		}
		if (activeAcademicYear?.id && activeTab === "Nilai") {
			dispatch(getStudentNilai({ id, tahunAkademikId: activeAcademicYear.id }))
		}
	}, [activeTab, academicYears, dispatch, id])

	if (!studentDetail) {
		return <MahasiswaDetailSkeleton />
	}

	return (
		<main className="mx-auto w-full max-w-6xl space-y-5 py-5 sm:py-7">
			<Button variant="ghost" className="-ml-2 text-muted-foreground" onClick={() => navigate("/mahasiswa")}><ArrowLeft /> Mahasiswa</Button>

			<section className="relative overflow-hidden rounded-xl bg-primary px-5 py-6 text-primary-foreground sm:px-8 sm:py-8">
				<div className="absolute -right-16 -top-20 size-56 rounded-full border-32 border-primary-foreground/10" />
				<div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex min-w-0 items-center gap-4 sm:gap-5">
						<Avatar className="size-16 shrink-0 border-2 border-primary-foreground/20 sm:size-20"><AvatarFallback className="bg-primary-foreground/15 text-lg text-primary-foreground sm:text-xl">{getInitials(String(studentDetail?.student.nama))}</AvatarFallback></Avatar>
						<div className="min-w-0">
							<h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{studentDetail?.student.nama}</h1>
							<p className="mt-1 text-sm text-primary-foreground/70">{studentDetail?.student.nim}</p>
							<p className="mt-1 truncate text-sm text-primary-foreground/80">{studentDetail?.student.prodi?.nama}</p>
							<Badge className="mt-3 border-0 bg-emerald-400/20 text-emerald-100">{currentStatus}</Badge>
						</div>
					</div>
					<div className="flex gap-2 self-start sm:self-center">
						<Button variant="secondary" size="sm" onClick={() => navigate(`/mahasiswa/${id}/edit`)}><Pencil /> Edit Mahasiswa</Button>
						<DropdownMenu>
							<DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" aria-label="Buka menu aksi admin"><Ellipsis /></Button>} />
							<DropdownMenuContent align="end" className="w-52">
								<DropdownMenuItem onClick={() => navigate(`/mahasiswa/${id}/edit`)}><Pencil /> Edit Data</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setIsStatusDialogOpen(true)}><UserRound /> Ubah Status</DropdownMenuItem>
								<DropdownMenuItem><KeyRound /> Reset Password</DropdownMenuItem>
								<DropdownMenuItem onClick={() => toast(activityLogs.length ? activityLogs.join("\n") : "Belum ada aktivitas untuk mahasiswa ini")}><Activity /> Lihat Aktivitas</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem variant="destructive"><Ban /> Nonaktifkan Akun</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Ubah Status Mahasiswa</DialogTitle>
									<DialogDescription>Perubahan status akan dicatat ke Log Aktivitas.</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div className="rounded-lg bg-muted/50 px-3 py-2 text-sm"><span className="text-muted-foreground">Status saat ini</span><p className="mt-1 font-semibold">{currentStatus}</p></div>
									<label className="block space-y-2 text-sm font-medium"><span>Status Baru</span><select value={newStatus} onChange={(event) => setNewStatus(event.target.value)} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"><option>Aktif</option><option>Cuti</option><option>Lulus</option><option>Nonaktif</option></select></label>
									<label className="block space-y-2 text-sm font-medium"><span>Alasan</span><textarea value={statusReason} onChange={(event) => setStatusReason(event.target.value)} placeholder="Pengajuan cuti semester..." rows={4} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50" /></label>
								</div>
								<DialogFooter><Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Batal</Button><Button onClick={handleStatusSave}>Simpan</Button></DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</section>

			<section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{metrics.map(({ label, value, icon: Icon }) => <Card key={label} className="gap-2 py-4"><CardContent className="px-4"><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"><Icon className="size-3.5" /> {label}</div><p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>{value === "-" && <p className="mt-1 text-xs text-muted-foreground">Belum tersedia</p>}</CardContent></Card>)}
			</section>

			<section className="overflow-hidden rounded-xl border bg-card shadow-sm">
				<nav className="flex overflow-x-auto border-b px-2 sm:px-4" aria-label="Detail mahasiswa">
					{tabs.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`relative shrink-0 px-3 py-4 text-sm font-medium transition-colors sm:px-4 ${activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} aria-current={activeTab === tab ? "page" : undefined}>{tab}{activeTab === tab && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary sm:inset-x-4" />}</button>)}
				</nav>
				<div className="p-4 sm:p-6"><TabContent tab={activeTab} student={studentDetail.student} currentStatus={currentStatus} /></div>
			</section>
		</main>
	)
}
