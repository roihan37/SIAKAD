import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StudentDetail } from "@/types/campus"
import { useAppSelector } from "@/hooks/redux"
import { ArrowLeft,  BookOpen, CalendarDays,  GraduationCap,  Pencil, UserRound, Wallet } from "lucide-react"
import { useState } from "react"
import { TabContentSkeleton } from "../loading/tab-content-skeleton"



const tabs = ["Informasi Pribadi", "Akademik", "KRS", "Nilai", "Presensi", "Keuangan", "Akun"] as const
type Tab = (typeof tabs)[number]

const attendanceCourses = [
    { name: "Basis Data", meetings: 12, present: 11, excused: 1, sick: 0, absent: 0, percentage: "91.7%" },
    { name: "Struktur Data", meetings: 12, present: 12, excused: 0, sick: 0, absent: 0, percentage: "100%" },
    { name: "Pemrograman Web", meetings: 12, present: 10, excused: 1, sick: 1, absent: 0, percentage: "83.3%" },
]

const financeTransactions = [
    { year: "2025/2026 Ganjil", type: "UKT", bill: 3500000, paid: 3500000, remaining: 0, status: "Lunas" },
    { year: "2025/2026 Genap", type: "UKT", bill: 3500000, paid: 3500000, remaining: 0, status: "Lunas" },
]

function formatRupiah(value: number) {
    return `Rp${value.toLocaleString("id-ID")}`
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1 border-b border-border/60 pb-3 last:border-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="wrap-break-word text-sm font-medium text-foreground">{value || "-"}</dd>
        </div>
    )
}


export function TabContent({ tab, student, currentStatus }: { tab: Tab; student: StudentDetail['student']; currentStatus: string }) {
	const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
	const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
	const { riwayatSemester, krsMahasiswa, nilaiMahasiswa, isLoadingStudentsDetail } = useAppSelector((state) => state.students)

	if (isLoadingStudentsDetail && ["Akademik", "KRS", "Nilai"].includes(tab)) {
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
				<div className="flex justify-end"><Button><Pencil /> Edit Data</Button></div>
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

	if (tab === "KRS") {
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
								<select defaultValue="2026/2027 Ganjil" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium shadow-xs outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50">
									<option>2026/2027 Ganjil</option>
									<option>2025/2026 Genap</option>
									<option>2025/2026 Ganjil</option>
								</select>
							</label>
							<div className="space-y-2 text-sm font-medium">
								<span className="block text-muted-foreground">Status</span>
								<div className="flex h-9 items-center"><Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Disetujui</Badge></div>
							</div>
							<div className="rounded-lg bg-muted/50 px-4 py-3 sm:text-right">
								<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total SKS</p>
								<p className="mt-1 text-xl font-semibold">{krsMahasiswa?.totalSKS ?? 0} <span className="text-sm font-medium text-muted-foreground">SKS</span></p>
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
										{krsMahasiswa?.details.map((course) => <tr key={course.id} className="transition-colors hover:bg-muted/30">
										<td className="px-6 py-4 font-medium">{course.mataKuliah.kode}</td>
										<td className="px-6 py-4">{course.mataKuliah.nama}</td>
										<td className="px-6 py-4 text-right">{course.mataKuliah.sks}</td>
										<td className="px-6 py-4 text-muted-foreground">{course.kelas.nama}</td>
										<td className="px-6 py-4"><Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{course.status}</Badge></td>
									</tr>)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (tab === "Nilai") {
		return (
			<div className="space-y-5">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2"><GraduationCap className="size-4 text-muted-foreground" /> Nilai</CardTitle>
					</CardHeader>
					<CardContent>
						<label className="block max-w-sm space-y-2 text-sm font-medium">
							<span className="text-muted-foreground">Tahun Akademik</span>
							<select defaultValue="2026/2027 Ganjil" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium shadow-xs outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50">
								<option>2026/2027 Ganjil</option>
								<option>2025/2026 Genap</option>
								<option>2025/2026 Ganjil</option>
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
									{nilaiMahasiswa?.details.map((course) => <tr key={course.id} className="transition-colors hover:bg-muted/30">
										<td className="px-6 py-4 font-medium">{course.mataKuliah.kode}</td>
										<td className="px-6 py-4">{course.mataKuliah.nama}</td>
										<td className="px-6 py-4 text-right">{course.mataKuliah.sks}</td>
										<td className="px-6 py-4 text-right">{course.nilai ?? "-"}</td>
										<td className="px-6 py-4"><Badge variant="secondary" className="min-w-9 justify-center bg-sky-100 font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">{course.grade}</Badge></td>
									</tr>)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				<div className="grid gap-4 sm:grid-cols-2">
					<Card className="bg-primary text-primary-foreground ring-0"><CardContent className="p-5"><p className="text-sm text-primary-foreground/70">IPS</p><p className="mt-1 text-3xl font-semibold tracking-tight">{nilaiMahasiswa?.summary.ips.toFixed(2) ?? "-"}</p></CardContent></Card>
					<Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">IPK</p><p className="mt-1 text-3xl font-semibold tracking-tight">{nilaiMahasiswa?.summary.ipk.toFixed(2) ?? "-"}</p></CardContent></Card>
				</div>
			</div>
		)
	}

	if (tab === "Presensi") {
		const selectedCourseData = attendanceCourses.find((course) => course.name === selectedCourse)

		if (selectedCourseData) {
			return (
				<div className="space-y-5">
					<Button variant="ghost" className="-ml-2 text-muted-foreground" onClick={() => setSelectedCourse(null)}><ArrowLeft /> Kembali ke ringkasan presensi</Button>
					<Card>
						<CardHeader>
							<CardTitle>{selectedCourseData.name}</CardTitle>
							<p className="text-sm text-muted-foreground">Detail kehadiran pertemuan</p>
						</CardHeader>
						<CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{Array.from({ length: selectedCourseData.meetings }, (_, index) => <div key={index + 1} className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3"><span className="text-sm font-medium">Pertemuan {index + 1}</span><Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Hadir</Badge></div>)}
						</CardContent>
					</Card>
				</div>
			)
		}

		return (
			<div className="space-y-5">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2"><CalendarDays className="size-4 text-muted-foreground" /> Presensi</CardTitle>
					</CardHeader>
					<CardContent>
						<label className="block max-w-sm space-y-2 text-sm font-medium">
							<span className="text-muted-foreground">Tahun Akademik</span>
							<select defaultValue="2026/2027 Ganjil" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium shadow-xs outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50">
								<option>2026/2027 Ganjil</option>
								<option>2025/2026 Genap</option>
								<option>2025/2026 Ganjil</option>
							</select>
						</label>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="grid divide-y py-0 sm:grid-cols-5 sm:divide-x sm:divide-y-0">
						{[
							["Rata-rata Kehadiran", "91.5%"],
							["Hadir", "44"],
							["Izin", "2"],
							["Sakit", "1"],
							["Alpa", "1"],
						].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 py-4 first:pt-5 last:pb-5 sm:block sm:px-5 sm:py-5 sm:first:pl-0 sm:last:pr-0"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="text-xl font-semibold sm:mt-2">{value}</p></div>)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader><CardTitle>Rekap Mata Kuliah</CardTitle></CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="w-full min-w-220 text-sm">
								<thead className="border-y bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
									<tr>
										<th className="px-6 py-3 font-medium">Mata Kuliah</th>
										<th className="px-6 py-3 text-right font-medium">Pertemuan</th>
										<th className="px-6 py-3 text-right font-medium">Hadir</th>
										<th className="px-6 py-3 text-right font-medium">Izin</th>
										<th className="px-6 py-3 text-right font-medium">Sakit</th>
										<th className="px-6 py-3 text-right font-medium">Alpa</th>
										<th className="px-6 py-3 text-right font-medium">%</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{attendanceCourses.map((course) => <tr key={course.name} className="transition-colors hover:bg-muted/30">
										<td className="px-6 py-4"><button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => setSelectedCourse(course.name)}>{course.name}</button></td>
										<td className="px-6 py-4 text-right">{course.meetings}</td>
										<td className="px-6 py-4 text-right">{course.present}</td>
										<td className="px-6 py-4 text-right">{course.excused}</td>
										<td className="px-6 py-4 text-right">{course.sick}</td>
										<td className="px-6 py-4 text-right">{course.absent}</td>
										<td className="px-6 py-4 text-right font-medium">{course.percentage}</td>
									</tr>)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (tab === "Keuangan") {
		const selectedTransactionData = financeTransactions.find((transaction) => transaction.year === selectedTransaction)

		if (selectedTransactionData) {
			return (
				<div className="space-y-5">
					<Button variant="ghost" className="-ml-2 text-muted-foreground" onClick={() => setSelectedTransaction(null)}><ArrowLeft /> Kembali ke transaksi</Button>
					<Card>
						<CardHeader>
							<CardTitle>Detail Pembayaran</CardTitle>
							<p className="text-sm text-muted-foreground">{selectedTransactionData.year} · {selectedTransactionData.type}</p>
						</CardHeader>
						<CardContent>
							<dl className="grid gap-4 sm:grid-cols-2">
								<InfoRow label="Tahun Akademik" value={selectedTransactionData.year} />
								<InfoRow label="Jenis Tagihan" value={selectedTransactionData.type} />
								<InfoRow label="Total Tagihan" value={formatRupiah(selectedTransactionData.bill)} />
								<InfoRow label="Sudah Dibayar" value={formatRupiah(selectedTransactionData.paid)} />
								<InfoRow label="Sisa" value={formatRupiah(selectedTransactionData.remaining)} />
								<InfoRow label="Status" value={selectedTransactionData.status} />
							</dl>
						</CardContent>
					</Card>
				</div>
			)
		}

		return (
			<div className="space-y-5">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2"><Wallet className="size-4 text-muted-foreground" /> Keuangan</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-3 sm:grid-cols-3">
						<div className="rounded-lg bg-muted/50 px-4 py-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Tagihan</p><p className="mt-2 text-xl font-semibold">{formatRupiah(7000000)}</p></div>
						<div className="rounded-lg bg-emerald-50 px-4 py-4 dark:bg-emerald-900/20"><p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Sudah Dibayar</p><p className="mt-2 text-xl font-semibold text-emerald-700 dark:text-emerald-300">{formatRupiah(7000000)}</p></div>
						<div className="rounded-lg border border-emerald-200 px-4 py-4 dark:border-emerald-900/50"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sisa</p><p className="mt-2 text-xl font-semibold text-emerald-700 dark:text-emerald-300">{formatRupiah(0)}</p></div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader><CardTitle>Riwayat Transaksi</CardTitle><p className="text-sm text-muted-foreground">Klik transaksi untuk melihat detail pembayaran.</p></CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="w-full min-w-220 text-sm">
								<thead className="border-y bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
									<tr>
										<th className="px-6 py-3 font-medium">Tahun Akademik</th>
										<th className="px-6 py-3 font-medium">Jenis</th>
										<th className="px-6 py-3 text-right font-medium">Tagihan</th>
										<th className="px-6 py-3 text-right font-medium">Dibayar</th>
										<th className="px-6 py-3 text-right font-medium">Sisa</th>
										<th className="px-6 py-3 font-medium">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{financeTransactions.map((transaction) => <tr key={transaction.year} className="transition-colors hover:bg-muted/30">
										<td className="px-6 py-4"><button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => setSelectedTransaction(transaction.year)}>{transaction.year}</button></td>
										<td className="px-6 py-4">{transaction.type}</td>
										<td className="px-6 py-4 text-right">{formatRupiah(transaction.bill)}</td>
										<td className="px-6 py-4 text-right">{formatRupiah(transaction.paid)}</td>
										<td className="px-6 py-4 text-right">{formatRupiah(transaction.remaining)}</td>
										<td className="px-6 py-4"><Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{transaction.status}</Badge></td>
									</tr>)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

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