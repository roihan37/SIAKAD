import { useEffect, useState } from "react"
import { CalendarDays, RefreshCw } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { getStudentAttendance } from "@/features/action/studentAttendanceThunk"
import { clearStudentAttendance, setStudentAttendanceYear } from "@/features/slice/studentAttendanceSlice"
import { getAllTAkademik } from "@/features/action/tAkademikThunk"
import type { TahunAkademik } from "@/types/campus"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function StudentAttendanceTab({ studentId, academicYears }: { studentId: string; academicYears: TahunAkademik[] }) {
  const dispatch = useAppDispatch()
  const state = useAppSelector((store) => store.studentAttendance)
  const yearsState = useAppSelector((store) => store.tAkademik)
  const [retry, setRetry] = useState(0)
  const yearId = academicYears.find((year) => year.id === state.selectedYearId)?.id ?? (academicYears.find((year) => year.isActive) ?? academicYears[0])?.id
  useEffect(() => {
    if (!yearId) return
    const request = dispatch(getStudentAttendance({ id: studentId, tahunAkademikId: yearId }))
    return () => request.abort()
  }, [dispatch, studentId, yearId, retry])
  useEffect(() => () => { dispatch(clearStudentAttendance()) }, [dispatch, studentId])
  const matches = state.query?.id === studentId && state.query.tahunAkademikId === yearId
  const data = matches ? state.data : null
  const error = matches ? state.error : null
  const loading = !!yearId && (!matches || state.loading || (!data && !error))
  const metrics = data ? [["Rata-rata Kehadiran", `${data.summary.attendancePercentage.toLocaleString("id-ID")}%`], ["Hadir", data.summary.present], ["Izin", data.summary.permission], ["Sakit", data.summary.sick], ["Alpa", data.summary.absent]] : []
  return <div className="space-y-5"><Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="size-4 text-muted-foreground" />Presensi</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap items-end justify-between gap-3"><label className="block w-full max-w-sm space-y-2 text-sm font-medium"><span className="text-muted-foreground">Tahun Akademik</span><select value={yearId ?? ""} disabled={!academicYears.length} onChange={(event) => dispatch(setStudentAttendanceYear(Number(event.target.value)))} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-ring"><option value="" disabled>Pilih tahun akademik</option>{academicYears.map((year) => <option key={year.id} value={year.id}>{year.tahun} - {year.semester}</option>)}</select></label><Button variant="outline" disabled={!yearId || loading} onClick={() => setRetry((value) => value + 1)}><RefreshCw />Muat Ulang</Button></div>{!academicYears.length && (yearsState.isLoading ? <Skeleton className="h-9" /> : <div role="status" className="space-y-2"><p className="text-sm text-muted-foreground">{yearsState.error ?? "Belum ada tahun akademik tersedia."}</p><Button variant="outline" onClick={() => dispatch(getAllTAkademik({ page: 1, limit: 100 }))}>Muat Tahun Akademik</Button></div>)}</CardContent></Card>
    {loading ? <div role="status" aria-label="Memuat presensi mahasiswa" className="space-y-5"><Skeleton className="h-28 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div> : error ? <Card><CardContent className="space-y-3 pt-5" role="alert"><p className="text-sm text-destructive">{error}</p><Button onClick={() => setRetry((value) => value + 1)}>Coba Lagi</Button></CardContent></Card> : data && <><Card><CardContent className="grid divide-y py-0 sm:grid-cols-5 sm:divide-x sm:divide-y-0">{metrics.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 py-4 sm:block sm:px-5 sm:py-5"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="text-xl font-semibold sm:mt-2">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</p></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Rekap Mata Kuliah</CardTitle><p className="text-sm text-muted-foreground">{data.academicYear.year} - {data.academicYear.semester} · {data.summary.totalRecords} catatan presensi</p></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow className="bg-muted/40">{["Mata Kuliah", "Pertemuan", "Hadir", "Izin", "Sakit", "Alpa", "Kehadiran"].map((label) => <TableHead key={label} className="px-5">{label}</TableHead>)}</TableRow></TableHeader><TableBody>{!data.courses.length && <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">Belum ada catatan presensi pada tahun akademik ini.</TableCell></TableRow>}{data.courses.map((row) => <TableRow key={row.course.id}><TableCell className="px-5"><p className="font-medium">{row.course.name}</p><p className="text-xs text-muted-foreground">{row.course.code}</p></TableCell>{[row.meetings, row.attendance.present, row.attendance.permission, row.attendance.sick, row.attendance.absent].map((value, index) => <TableCell key={index} className="px-5 tabular-nums">{value}</TableCell>)}<TableCell className="px-5 tabular-nums">{row.attendance.percentage.toLocaleString("id-ID")}%</TableCell></TableRow>)}</TableBody></Table></CardContent></Card><p className="text-xs text-muted-foreground">Jumlah pertemuan dan persentase dihitung dari catatan presensi yang tersedia.</p></>}
  </div>
}
