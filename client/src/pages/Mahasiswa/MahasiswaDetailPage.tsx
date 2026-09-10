import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Activity, ArrowLeft, Ban, BookOpen, CalendarDays, Check, Copy, Ellipsis, GraduationCap, KeyRound, Loader2, Pencil, RefreshCw, UserRound } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { toast } from "sonner"
import { getStudentById, getStudentHistorySemester, getStudentKRS, getStudentNilai, updateStudent, resetStudentPassword } from "@/features/action/mahasiswaThunk"
import { getAllTAkademik } from "@/features/action/tAkademikThunk"
import { TabContent } from "@/components/mahasiswa-detail/tab-content"
import { MahasiswaDetailSkeleton } from "@/components/loading/mahasiswa-detail-skeleton"

const tabs = ["Informasi Pribadi", "Akademik", "Status Mahasiswa", "KRS", "Nilai", "Presensi", "Keuangan", "Akun"] as const
type Tab = (typeof tabs)[number]

function getInitials(name: string) {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase()
}

function generateTemporaryPassword() {
	const characters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
	const values = new Uint32Array(14)
	crypto.getRandomValues(values)
	return Array.from(values, (value) => characters[value % characters.length]).join("")
}

export default function MahasiswaDetailPage() {
	const navigate = useNavigate()
	const dispatch = useAppDispatch()
	const { id } = useParams()
	const { studentDetail, isResettingPassword } = useAppSelector((state) => state.students)
	const academicYears = useAppSelector((state) => state.tAkademik.tAkademik)
	const [activeTab, setActiveTab] = useState<Tab>("Informasi Pribadi")
	const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
	const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
	const [generatedPassword, setGeneratedPassword] = useState("")
	const [newStatus, setNewStatus] = useState("Aktif")
	const [statusReason, setStatusReason] = useState("")
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
	const [selectedKrsAcademicYearId, setSelectedKrsAcademicYearId] = useState<number | undefined>()
	const [selectedNilaiAcademicYearId, setSelectedNilaiAcademicYearId] = useState<number | undefined>()
	const [settledAvatarUrl, setSettledAvatarUrl] = useState<string | null>(null)
	const summary = studentDetail?.student.summary
	const currentStatus = studentDetail?.student.status ?? "Aktif"
	const avatarUrl = studentDetail?.student.avatarUrl ?? null
	const isAvatarLoading = Boolean(avatarUrl && settledAvatarUrl !== avatarUrl)

	const openResetPasswordDialog = () => {
		setGeneratedPassword(generateTemporaryPassword())
		setIsResetPasswordDialogOpen(true)
	}

	const copyGeneratedPassword = async () => {
		try {
			await navigator.clipboard.writeText(generatedPassword)
			toast.success("Password berhasil disalin")
		} catch {
			toast.error("Password tidak dapat disalin. Silakan salin secara manual.")
		}
	}

	const handleResetPassword = async () => {
		if (!id || !generatedPassword || isResettingPassword) return
		try {
			await dispatch(resetStudentPassword({ userId: id, password: generatedPassword })).unwrap()
			setIsResetPasswordDialogOpen(false)
			toast.success("Password mahasiswa berhasil direset")
		} catch (error) {
			toast.error(typeof error === "string" ? error : "Gagal mereset password mahasiswa")
		}
	}

	const handleStatusSave = async () => {
		if (!id) return
		if (newStatus === currentStatus) {
			toast.error("Status belum berubah")
			return
		}
		if (!statusReason.trim()) {
			toast.error("Alasan perubahan status wajib diisi")
			return
		}

		setIsUpdatingStatus(true)
		try {
			await dispatch(updateStudent({ id, payload: { status: newStatus, statusReason: statusReason.trim() } })).unwrap()
			await dispatch(getStudentById(id)).unwrap()
			setIsStatusDialogOpen(false)
			setStatusReason("")
			toast.success("Status mahasiswa berhasil diperbarui")
		} catch (error) {
			toast.error(typeof error === "string" ? error : "Gagal memperbarui status mahasiswa")
		} finally {
			setIsUpdatingStatus(false)
		}
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
		if (!academicYears.length) return

		setSelectedKrsAcademicYearId((currentId) => {
			if (currentId && academicYears.some((year) => year.id === currentId)) return currentId
			return (academicYears.find((year) => year.isActive) ?? academicYears[0]).id
		})
		setSelectedNilaiAcademicYearId((currentId) => {
			if (currentId && academicYears.some((year) => year.id === currentId)) return currentId
			return (academicYears.find((year) => year.isActive) ?? academicYears[0]).id
		})
	}, [academicYears])

	useEffect(() => {
		if (!id) return

		if (activeTab === "Akademik") {
			dispatch(getStudentHistorySemester(id))
		}

		if (selectedKrsAcademicYearId && activeTab === "KRS") {
			dispatch(getStudentKRS({ id, tahunAkademikId: selectedKrsAcademicYearId }))
		}
		if (selectedNilaiAcademicYearId && activeTab === "Nilai") {
			dispatch(getStudentNilai({ id, tahunAkademikId: selectedNilaiAcademicYearId }))
		}
	}, [activeTab, dispatch, id, selectedKrsAcademicYearId, selectedNilaiAcademicYearId])

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
						<Avatar className="relative size-16 shrink-0 border-2 border-primary-foreground/20 sm:size-20">
							{avatarUrl && <AvatarImage src={avatarUrl} alt={`Foto ${studentDetail.student.nama}`} onLoad={() => setSettledAvatarUrl(avatarUrl)} onError={() => setSettledAvatarUrl(avatarUrl)} className={isAvatarLoading ? "opacity-0" : "opacity-100"} />}
							<AvatarFallback className="bg-primary-foreground/15 text-lg text-primary-foreground sm:text-xl">{getInitials(String(studentDetail.student.nama))}</AvatarFallback>
							{isAvatarLoading && <span className="absolute inset-0 flex items-center justify-center bg-primary/50" aria-label="Memuat foto mahasiswa"><Loader2 className="size-5 animate-spin text-primary-foreground" /></span>}
						</Avatar>
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
								<DropdownMenuItem onClick={() => { setNewStatus(currentStatus); setStatusReason(""); setIsStatusDialogOpen(true) }}><UserRound /> Ubah Status</DropdownMenuItem>
								<DropdownMenuItem disabled={isResettingPassword} onClick={openResetPasswordDialog}><KeyRound /> Reset Password</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setActiveTab("Status Mahasiswa")}><Activity /> Lihat Riwayat Status</DropdownMenuItem>
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
								<DialogFooter><Button variant="outline" onClick={() => setIsStatusDialogOpen(false)} disabled={isUpdatingStatus}>Batal</Button><Button onClick={handleStatusSave} disabled={isUpdatingStatus}>{isUpdatingStatus ? "Menyimpan..." : "Simpan"}</Button></DialogFooter>
							</DialogContent>
						</Dialog>
						<Dialog open={isResetPasswordDialogOpen} onOpenChange={(open) => { if (!isResettingPassword) setIsResetPasswordDialogOpen(open) }}>
							<DialogContent className="sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Reset Password</DialogTitle>
									<DialogDescription>Password baru akan dibuat otomatis untuk mahasiswa ini.</DialogDescription>
								</DialogHeader>
								<div className="space-y-5">
									<div className="rounded-lg bg-muted/50 px-4 py-3"><p className="font-semibold">{studentDetail.student.nama}</p><p className="mt-0.5 text-sm text-muted-foreground">{studentDetail.student.nim}</p></div>
									<div className="space-y-2"><p className="text-sm font-medium">Password Baru</p><div className="flex h-10 items-center rounded-lg border bg-background pl-3"><code className="min-w-0 flex-1 truncate font-mono text-sm font-semibold tracking-wide">{generatedPassword}</code><Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => setGeneratedPassword(generateTemporaryPassword())} disabled={isResettingPassword} aria-label="Buat password baru"><RefreshCw /></Button><Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={copyGeneratedPassword} disabled={isResettingPassword} aria-label="Salin password"><Copy /></Button></div><p className="text-xs text-muted-foreground">Password dibuat secara otomatis.</p></div>
									<p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">Mahasiswa wajib mengganti password saat login setelah reset.</p>
								</div>
								<DialogFooter><Button type="button" variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)} disabled={isResettingPassword}>Batal</Button><Button type="button" onClick={handleResetPassword} disabled={isResettingPassword}>{isResettingPassword ? <Loader2 className="animate-spin" /> : <KeyRound />}{isResettingPassword ? "Mereset..." : "Reset Password"}</Button></DialogFooter>
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
				<div className="p-4 sm:p-6"><TabContent tab={activeTab} student={studentDetail.student} currentStatus={currentStatus} academicYears={academicYears} selectedKrsAcademicYearId={selectedKrsAcademicYearId} onKrsAcademicYearChange={setSelectedKrsAcademicYearId} selectedNilaiAcademicYearId={selectedNilaiAcademicYearId} onNilaiAcademicYearChange={setSelectedNilaiAcademicYearId} /></div>
			</section>
		</main>
	)
}
