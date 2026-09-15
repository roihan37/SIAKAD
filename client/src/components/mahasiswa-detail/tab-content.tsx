import { StudentFinanceTab } from "./student-finance-tab"
import { StudentAttendanceTab } from "./student-attendance-tab"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { StudentDetail, TahunAkademik } from "@/types/campus"
import { useAppSelector } from "@/hooks/redux"
import { BookOpen, CircleCheck, GraduationCap, History, UserRound } from "lucide-react"
import { TabContentSkeleton } from "../loading/tab-content-skeleton"



type Tab = "Informasi Pribadi" | "Akademik" | "Status Mahasiswa" | "KRS" | "Nilai" | "Presensi" | "Keuangan" | "Akun"

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1 border-b border-border/60 pb-3 last:border-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="wrap-break-word text-sm font-medium text-foreground">{value || "-"}</dd>
        </div>
    )
}


export function TabContent({ tab, student, currentStatus, academicYears, selectedKrsAcademicYearId, onKrsAcademicYearChange, selectedNilaiAcademicYearId, onNilaiAcademicYearChange }: { tab: Tab; student: StudentDetail['student']; currentStatus: string; academicYears: TahunAkademik[]; selectedKrsAcademicYearId?: number; onKrsAcademicYearChange: (id: number) => void; selectedNilaiAcademicYearId?: number; onNilaiAcademicYearChange: (id: number) => void }) {
	const { riwayatSemester, krsMahasiswa, nilaiMahasiswa, isLoadingStudentsDetail } = useAppSelector((state) => state.students)

	if (isLoadingStudentsDetail && tab === "Akademik") {
		return <TabContentSkeleton tab={tab} />
	}

	if (tab === "Informasi Pribadi") {
		
		return (
			<div className="space-y-5">
				<div className="grid gap-5 lg:grid-cols-2">
					<Card>
						<CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-4 text-muted-foreground" /> Data Identitas</CardTitle></CardHeader>
						<CardContent><dl className="grid gap-4 sm:grid-cols-2">
							<InfoRow label="NIM" value={student?.nim || "-"} />
							<InfoRow label="Nama Lengkap" value={student.nama || "-"} />
							<InfoRow label="NIK" value={student.nik || "-"} />
							<InfoRow label="Tempat Lahir" value={student.tempatLahir || "-"} />
							<InfoRow label="Tanggal Lahir" value={student.tanggalLahir || "-"} />
							<InfoRow label="Jenis Kelamin" value={student.jenisKelamin || "-"} />
						</dl></CardContent>
					</Card>
					<Card>
						<CardHeader><CardTitle>Kontak</CardTitle></CardHeader>
						<CardContent><dl className="grid gap-4"><InfoRow label="Email" value={student.email || "-"} /><InfoRow label="No. HP" value={student.noHp || "-"} /><InfoRow label="Alamat" value={student.alamat || "-"} /></dl></CardContent>
					</Card>
				</div>
				<Card>
					<CardHeader><CardTitle>Data Akademik Dasar</CardTitle></CardHeader>
					<CardContent><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<InfoRow label="Fakultas" value={student.fakultas?.nama || "-"} />
						<InfoRow label="Program Studi" value={student.prodi?.nama || "-"} />
						<InfoRow label="Angkatan" value={student.angkatan?.toString() || "-"} />
						<InfoRow label="Dosen Pembimbing Akademik" value={student.dosenPembimbing?.nama || "-"} />
					</dl></CardContent>
				</Card>
				{/* <div className="flex justify-end"><Button><Pencil /> Edit Data</Button></div> */}
			</div>
		)
	}

	if (tab === "Akademik") {

		return (
			<div className="space-y-5">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2"><GraduationCap className="size-4 text-muted-foreground" /> Akademik</CardTitle>
					</CardHeader>
					<CardContent><dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
						<InfoRow label="Status Mahasiswa" value={currentStatus} />
						<InfoRow label="Angkatan" value={ student.angkatan?.toString() || "-"} />
						<InfoRow label="Program Studi" value={student.prodi?.nama || "-"} />
						<InfoRow label="Kurikulum" value={ student.kurikulum?.nama || "-"} />
						<InfoRow label="Dosen PA" value={ student.dosenPembimbing?.nama || "-"} />
					</dl></CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Riwayat Semester</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="w-full min-w-170 text-sm">
								<thead className="border-y bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
									<tr>
										<th className="px-6 py-3 font-medium">Semester</th>
										<th className="px-6 py-3 font-medium">Tahun Akademik</th>
										<th className="px-6 py-3 text-right font-medium">SKS</th>
										<th className="px-6 py-3 text-right font-medium">IPS</th>
										<th className="px-6 py-3 text-right font-medium">IPK</th>
										<th className="px-6 py-3 font-medium">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{riwayatSemester.map((history) => <tr key={history.semester} className="transition-colors hover:bg-muted/30">
										<td className="px-6 py-4 font-medium">{history.semester}</td>
										<td className="px-6 py-4 text-muted-foreground">{history.tahunAkademik.label}</td>
										<td className="px-6 py-4 text-right">{history.sks}</td>
										<td className="px-6 py-4 text-right">{history.ips.toFixed(2)}</td>
										<td className="px-6 py-4 text-right font-medium">{history.ipk.toFixed(2)}</td>
										<td className="px-6 py-4"><Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{history.status}</Badge></td>
									</tr>)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (tab === "Status Mahasiswa") {
		const statusHistory = student.riwayatStatus ?? []
		const formatStatusDate = (date: string) => new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(date))

		return (
			<div className="space-y-5">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2"><CircleCheck className="size-4 text-muted-foreground" /> Status Mahasiswa</CardTitle>
						<p className="text-sm text-muted-foreground">Status studi mahasiswa saat ini.</p>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Status Saat Ini</p>
							<Badge className="border-0 bg-emerald-100 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{currentStatus}</Badge>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2"><History className="size-4 text-muted-foreground" /> Riwayat Status Mahasiswa</CardTitle>
						<p className="text-sm text-muted-foreground">Perubahan status studi yang tercatat.</p>
					</CardHeader>
					<CardContent>
					<div className="grid gap-4 lg:grid-cols-2">
						{statusHistory.length ? statusHistory.map((entry) => (
							<div key={entry.id} className="rounded-lg border bg-muted/20 p-4">
								<div className="space-y-5">
									<div>
										<p className="font-semibold">{entry.statusBaru}</p>
										<p className="mt-1 text-sm text-muted-foreground">{formatStatusDate(entry.tanggal)}</p>
									</div>
									<div className="border-t pt-4">
										<p className="text-sm font-medium text-muted-foreground">Alasan</p>
										<p className="mt-1 text-sm leading-6">{entry.alasan}</p>
									</div>
								</div>
							</div>
						)) : <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground lg:col-span-2">Belum ada riwayat perubahan status.</div>}
					</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (tab === "KRS") {
		const isLoadingKrs = isLoadingStudentsDetail
		const krsDetails = krsMahasiswa?.details ?? []

		return (
			<div className="space-y-5">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2"><BookOpen className="size-4 text-muted-foreground" /> KRS</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<label className="space-y-2 text-sm font-medium">
								<span className="text-muted-foreground">Tahun Akademik</span>
								<select value={selectedKrsAcademicYearId?.toString() ?? ""} onChange={(event) => onKrsAcademicYearChange(Number(event.target.value))} disabled={!academicYears.length || isLoadingKrs} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium shadow-xs outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60">
									<option value="" disabled>{academicYears.length ? "Pilih tahun akademik" : "Memuat tahun akademik..."}</option>
									{academicYears.filter((year) => year.id !== undefined).map((year) => <option key={year.id} value={year.id}>{year.tahun} - {year.semester}{year.isActive ? " (Aktif)" : ""}</option>)}
								</select>
							</label>
							<div className="space-y-2 text-sm font-medium">
								<span className="block text-muted-foreground">Status</span>
								<div className="flex h-9 items-center"><Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Disetujui</Badge></div>
							</div>
							<div className="rounded-lg bg-muted/50 px-4 py-3 sm:text-right">
								<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total SKS</p>
								{isLoadingKrs ? <Skeleton className="mt-2 ml-auto h-7 w-18" /> : <p className="mt-1 text-xl font-semibold">{krsMahasiswa?.totalSKS ?? 0} <span className="text-sm font-medium text-muted-foreground">SKS</span></p>}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader><CardTitle>Daftar Mata Kuliah</CardTitle></CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="w-full min-w-170 text-sm">
								<thead className="border-y bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
									<tr>
										<th className="px-6 py-3 font-medium">Kode</th>
										<th className="px-6 py-3 font-medium">Mata Kuliah</th>
										<th className="px-6 py-3 text-right font-medium">SKS</th>
										<th className="px-6 py-3 font-medium">Kelas</th>
										<th className="px-6 py-3 font-medium">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{isLoadingKrs ? Array.from({ length: 4 }, (_, index) => <tr key={index}>
										<td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
										<td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
										<td className="px-6 py-4"><Skeleton className="ml-auto h-4 w-8" /></td>
										<td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
										<td className="px-6 py-4"><Skeleton className="h-5 w-18 rounded-full" /></td>
									</tr>) : krsDetails.length ? krsDetails.map((course) => <tr key={course.id} className="transition-colors hover:bg-muted/30">
										<td className="px-6 py-4 font-medium">{course.mataKuliah.kode}</td>
										<td className="px-6 py-4">{course.mataKuliah.nama}</td>
										<td className="px-6 py-4 text-right">{course.mataKuliah.sks}</td>
										<td className="px-6 py-4 text-muted-foreground">{course.kelas.nama}</td>
										<td className="px-6 py-4"><Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{course.status}</Badge></td>
									</tr>) : <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="flex flex-col items-center gap-2 text-muted-foreground"><BookOpen className="size-5" /><p className="text-sm font-medium text-foreground">Belum ada mata kuliah</p><p className="text-sm">Tidak ada data KRS untuk tahun akademik yang dipilih.</p></div></td></tr>}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (tab === "Nilai") {
		const isLoadingNilai = isLoadingStudentsDetail
		const nilaiDetails = nilaiMahasiswa?.details ?? []

		return (
			<div className="space-y-5">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2"><GraduationCap className="size-4 text-muted-foreground" /> Nilai</CardTitle>
					</CardHeader>
					<CardContent>
						<label className="block max-w-sm space-y-2 text-sm font-medium">
							<span className="text-muted-foreground">Tahun Akademik</span>
							<select value={selectedNilaiAcademicYearId?.toString() ?? ""} onChange={(event) => onNilaiAcademicYearChange(Number(event.target.value))} disabled={!academicYears.length || isLoadingNilai} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium shadow-xs outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60">
								<option value="" disabled>{academicYears.length ? "Pilih tahun akademik" : "Memuat tahun akademik..."}</option>
								{academicYears.filter((year) => year.id !== undefined).map((year) => <option key={year.id} value={year.id}>{year.tahun} - {year.semester}{year.isActive ? " (Aktif)" : ""}</option>)}
							</select>
						</label>
					</CardContent>
				</Card>

				<Card>
					<CardHeader><CardTitle>Daftar Nilai</CardTitle></CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="w-full min-w-170 text-sm">
								<thead className="border-y bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
									<tr>
										<th className="px-6 py-3 font-medium">Kode</th>
										<th className="px-6 py-3 font-medium">Mata Kuliah</th>
										<th className="px-6 py-3 text-right font-medium">SKS</th>
										<th className="px-6 py-3 text-right font-medium">Nilai</th>
										<th className="px-6 py-3 font-medium">Grade</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{isLoadingNilai ? Array.from({ length: 4 }, (_, index) => <tr key={index}>
										<td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
										<td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
										<td className="px-6 py-4"><Skeleton className="ml-auto h-4 w-8" /></td>
										<td className="px-6 py-4"><Skeleton className="ml-auto h-4 w-10" /></td>
										<td className="px-6 py-4"><Skeleton className="h-5 w-9 rounded-full" /></td>
									</tr>) : nilaiDetails.length ? nilaiDetails.map((course) => <tr key={course.id} className="transition-colors hover:bg-muted/30">
										<td className="px-6 py-4 font-medium">{course.mataKuliah.kode}</td>
										<td className="px-6 py-4">{course.mataKuliah.nama}</td>
										<td className="px-6 py-4 text-right">{course.mataKuliah.sks}</td>
										<td className="px-6 py-4 text-right">{course.nilai ?? "-"}</td>
										<td className="px-6 py-4"><Badge variant="secondary" className="min-w-9 justify-center bg-sky-100 font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">{course.grade}</Badge></td>
									</tr>) : <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="flex flex-col items-center gap-2 text-muted-foreground"><GraduationCap className="size-5" /><p className="text-sm font-medium text-foreground">Belum ada data nilai</p><p className="text-sm">Tidak ada nilai untuk tahun akademik yang dipilih.</p></div></td></tr>}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				<div className="grid gap-4 sm:grid-cols-2">
					<Card className="bg-primary text-primary-foreground ring-0"><CardContent className="p-5"><p className="text-sm text-primary-foreground/70">IPS</p>{isLoadingNilai ? <Skeleton className="mt-2 h-9 w-20 bg-primary-foreground/20" /> : <p className="mt-1 text-3xl font-semibold tracking-tight">{nilaiMahasiswa?.summary.ips.toFixed(2) ?? "-"}</p>}</CardContent></Card>
					<Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">IPK</p>{isLoadingNilai ? <Skeleton className="mt-2 h-9 w-20" /> : <p className="mt-1 text-3xl font-semibold tracking-tight">{nilaiMahasiswa?.summary.ipk.toFixed(2) ?? "-"}</p>}</CardContent></Card>
				</div>
			</div>
		)
	}

	if (tab === "Presensi") return <StudentAttendanceTab key={student.id} studentId={student.id} academicYears={academicYears} />

	if (tab === "Keuangan") return <StudentFinanceTab key={student.id} studentId={student.id} />

	if (tab === "Akun") {
		return (
			<div className="space-y-5">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2"><UserRound className="size-4 text-muted-foreground" /> Akun</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
							<InfoRow label="Username" value={student.nim || ""} />
							<InfoRow label="Email" value={student.email || ""} />
							<InfoRow label="Role" value="Mahasiswa" />
							<InfoRow label="Status Akun" value={currentStatus} />
							<InfoRow label="Terakhir Login" value="-" />
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader><CardTitle>Keamanan Akun</CardTitle><p className="text-sm text-muted-foreground">Password tidak pernah ditampilkan kepada admin. Password hanya dapat di-reset.</p></CardHeader>
					<CardContent className="flex flex-col gap-3 sm:flex-row">
						<Button variant="outline">Reset Password</Button>
						<Button variant="destructive">Nonaktifkan Akun</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	return null
}
