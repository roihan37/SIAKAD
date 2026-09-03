import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Mahasiswa } from "@/types/campus"
import { Activity, ArrowLeft, Ban, BookOpen, CalendarDays, Check, Ellipsis, GraduationCap, KeyRound, Pencil, UserRound, Wallet } from "lucide-react"
import { use, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { toast } from "sonner"
import { getStudentById } from "@/features/action/usersThunk"

const tabs = ["Informasi Pribadi", "Akademik", "KRS", "Nilai", "Presensi", "Keuangan", "Akun"] as const
type Tab = (typeof tabs)[number]

type StudentDetails = {
	nik: string
	tempatLahir: string
	tanggalLahir: string
	jenisKelamin: string
	email: string
	noHp: string
	alamat: string
	fakultas: string
	angkatan: string
	dosenPa: string
}

type StudentWithDetails = Mahasiswa & { details?: StudentDetails }

const dummyStudent: StudentWithDetails = {
	id: "preview-mahasiswa-1",
	name: "Andi Pratama",
	role: "Mahasiswa",
	mahasiswa: {
		id: "preview-mahasiswa-1",
		nim: "20240001",
		semester: 6,
		status: "Aktif",
		prodi: {
			name: "Teknik Informatika",
		},
	},
	details: {
		nik: "327xxxxxxxxxxxxx",
		tempatLahir: "Tasikmalaya",
		tanggalLahir: "12 Januari 2004",
		jenisKelamin: "Laki-laki",
		email: "andi@email.com",
		noHp: "0812xxxxxxxx",
		alamat: "Jl. .............",
		fakultas: "Fakultas Teknik",
		angkatan: "2024",
		dosenPa: "Dr. Budi Santoso",
	},
}

const academicHistory = [
	{ semester: "1", tahun: "2024/2025 Ganjil", sks: 20, ips: "3.50", ipk: "3.50", status: "Selesai" },
	{ semester: "2", tahun: "2024/2025 Genap", sks: 22, ips: "3.70", ipk: "3.60", status: "Selesai" },
	{ semester: "3", tahun: "2025/2026 Ganjil", sks: 20, ips: "3.80", ipk: "3.67", status: "Selesai" },
	{ semester: "4", tahun: "2025/2026 Genap", sks: 20, ips: "3.75", ipk: "3.69", status: "Selesai" },
]

const krsCourses = [
	{ code: "IF201", name: "Basis Data", sks: 3, className: "TI-3A", status: "Disetujui" },
	{ code: "IF202", name: "Struktur Data", sks: 3, className: "TI-3A", status: "Disetujui" },
	{ code: "IF203", name: "Pemrograman Web", sks: 3, className: "TI-3A", status: "Disetujui" },
	{ code: "IF204", name: "Sistem Operasi", sks: 3, className: "TI-3A", status: "Disetujui" },
]

const gradeCourses = [
	{ code: "IF201", name: "Basis Data", sks: 3, score: 85, grade: "A" },
	{ code: "IF202", name: "Struktur Data", sks: 3, score: 80, grade: "A-" },
	{ code: "IF203", name: "Pemrograman Web", sks: 3, score: 88, grade: "A" },
]

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

function getInitials(name: string) {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase()
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="space-y-1 border-b border-border/60 pb-3 last:border-0">
			<dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
			<dd className="wrap-break-word text-sm font-medium text-foreground">{value || "-"}</dd>
		</div>
	)
}

function TabContent({ tab, student, currentStatus }: { tab: Tab; student: Mahasiswa; currentStatus: string }) {
	const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
	const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)

	if (tab === "Informasi Pribadi") {
		const details = student.id === dummyStudent.id ? dummyStudent.details : undefined
		const personal = details ?? {
			nik: "",
			tempatLahir: "",
			tanggalLahir: "",
			jenisKelamin: "",
			email: "",
			noHp: "",
			alamat: "",
			fakultas: "",
			angkatan: "",
			dosenPa: "",
		}
		return (
			<div className="space-y-5">
				<div className="grid gap-5 lg:grid-cols-2">
					<Card>
						<CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-4 text-muted-foreground" /> Data Identitas</CardTitle></CardHeader>
						<CardContent><dl className="grid gap-4 sm:grid-cols-2">
							<InfoRow label="NIM" value={student.mahasiswa.nim} />
							<InfoRow label="Nama Lengkap" value={student.name} />
							<InfoRow label="NIK" value={personal.nik} />
							<InfoRow label="Tempat Lahir" value={personal.tempatLahir} />
							<InfoRow label="Tanggal Lahir" value={personal.tanggalLahir} />
							<InfoRow label="Jenis Kelamin" value={personal.jenisKelamin} />
						</dl></CardContent>
					</Card>
					<Card>
						<CardHeader><CardTitle>Kontak</CardTitle></CardHeader>
						<CardContent><dl className="grid gap-4"><InfoRow label="Email" value={personal.email} /><InfoRow label="No. HP" value={personal.noHp} /><InfoRow label="Alamat" value={personal.alamat} /></dl></CardContent>
					</Card>
				</div>
				<Card>
					<CardHeader><CardTitle>Data Akademik Dasar</CardTitle></CardHeader>
					<CardContent><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<InfoRow label="Fakultas" value={personal.fakultas} />
						<InfoRow label="Program Studi" value={student.mahasiswa.prodi.name} />
						<InfoRow label="Angkatan" value={personal.angkatan} />
						<InfoRow label="Dosen Pembimbing Akademik" value={personal.dosenPa} />
					</dl></CardContent>
				</Card>
				<div className="flex justify-end"><Button><Pencil /> Edit Data</Button></div>
			</div>
		)
	}

	if (tab === "Akademik") {
		const isDummy = student.id === dummyStudent.id
		return (
			<div className="space-y-5">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2"><GraduationCap className="size-4 text-muted-foreground" /> Akademik</CardTitle>
					</CardHeader>
					<CardContent><dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
						<InfoRow label="Status Mahasiswa" value={currentStatus} />
						<InfoRow label="Angkatan" value={isDummy ? "2024" : ""} />
						<InfoRow label="Program Studi" value={student.mahasiswa.prodi.name} />
						<InfoRow label="Kurikulum" value={isDummy ? "Kurikulum 2024" : ""} />
						<InfoRow label="Dosen PA" value={isDummy ? "Dr. Budi Santoso" : ""} />
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
									{academicHistory.map((history) => <tr key={history.semester} className="transition-colors hover:bg-muted/30">
										<td className="px-6 py-4 font-medium">{history.semester}</td>
										<td className="px-6 py-4 text-muted-foreground">{history.tahun}</td>
										<td className="px-6 py-4 text-right">{history.sks}</td>
										<td className="px-6 py-4 text-right">{history.ips}</td>
										<td className="px-6 py-4 text-right font-medium">{history.ipk}</td>
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
								<p className="mt-1 text-xl font-semibold">21 <span className="text-sm font-medium text-muted-foreground">SKS</span></p>
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
									{krsCourses.map((course) => <tr key={course.code} className="transition-colors hover:bg-muted/30">
										<td className="px-6 py-4 font-medium">{course.code}</td>
										<td className="px-6 py-4">{course.name}</td>
										<td className="px-6 py-4 text-right">{course.sks}</td>
										<td className="px-6 py-4 text-muted-foreground">{course.className}</td>
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
									{gradeCourses.map((course) => <tr key={course.code} className="transition-colors hover:bg-muted/30">
										<td className="px-6 py-4 font-medium">{course.code}</td>
										<td className="px-6 py-4">{course.name}</td>
										<td className="px-6 py-4 text-right">{course.sks}</td>
										<td className="px-6 py-4 text-right">{course.score}</td>
										<td className="px-6 py-4"><Badge variant="secondary" className="min-w-9 justify-center bg-sky-100 font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">{course.grade}</Badge></td>
									</tr>)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				<div className="grid gap-4 sm:grid-cols-2">
					<Card className="bg-primary text-primary-foreground ring-0"><CardContent className="p-5"><p className="text-sm text-primary-foreground/70">IPS</p><p className="mt-1 text-3xl font-semibold tracking-tight">3.72</p></CardContent></Card>
					<Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">IPK</p><p className="mt-1 text-3xl font-semibold tracking-tight">3.68</p></CardContent></Card>
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
		const isDummy = student.id === dummyStudent.id
		return (
			<div className="space-y-5">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2"><UserRound className="size-4 text-muted-foreground" /> Akun</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
							<InfoRow label="Username" value={isDummy ? "20240001" : ""} />
							<InfoRow label="Email" value={isDummy ? "andi@email.com" : ""} />
							<InfoRow label="Role" value="Mahasiswa" />
							<InfoRow label="Status Akun" value={currentStatus} />
							<InfoRow label="Terakhir Login" value={isDummy ? "02 September 2026, 08:32" : ""} />
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

export default function MahasiswaDetailPage() {
	const navigate = useNavigate()
	const dispatch = useAppDispatch()
	const { id } = useParams()
	const {studentDetail} = useAppSelector((state) => state.users)
	const [activeTab, setActiveTab] = useState<Tab>("Informasi Pribadi")
	const [currentStatus, setCurrentStatus] = useState(studentDetail?.student?.status || "Aktif")
	const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
	const [newStatus, setNewStatus] = useState("Cuti")
	const [statusReason, setStatusReason] = useState("")
	const [activityLogs, setActivityLogs] = useState<string[]>([])

	const handleStatusSave = () => {
		const activity = `Status mahasiswa diubah dari ${currentStatus} menjadi ${newStatus}${statusReason.trim() ? `: ${statusReason.trim()}` : ""}`
		setCurrentStatus(newStatus)
		setActivityLogs((logs) => [activity, ...logs])
		setIsStatusDialogOpen(false)
		setStatusReason("")
		toast.success("Status berhasil diubah dan dicatat di Log Aktivitas")
	}

	const metrics = [
		{ label: "IPK", value: "-", icon: GraduationCap },
		{ label: "Total SKS", value: "-", icon: BookOpen },
		{ label: "Semester", value: "-", icon: CalendarDays },
		{ label: "Kehadiran", value: "-", icon: Check },
	]
	
	useEffect(() => {
		if(id){
			dispatch(getStudentById(id))
		}
	},[dispatch])

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
						<Button variant="secondary" size="sm"><Pencil /> Edit Mahasiswa</Button>
						<DropdownMenu>
							<DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" aria-label="Buka menu aksi admin"><Ellipsis /></Button>} />
							<DropdownMenuContent align="end" className="w-52">
								<DropdownMenuItem><Pencil /> Edit Data</DropdownMenuItem>
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
				{/* <div className="p-4 sm:p-6"><TabContent tab={activeTab} student={student} currentStatus={currentStatus} /></div> */}
			</section>
		</main>
	)
}
