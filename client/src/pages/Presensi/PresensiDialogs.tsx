import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { fetchAttendanceDetail } from "@/features/action/attendanceThunk"
import { clearAttendanceDetail } from "@/features/slice/attendanceSlice"
import type { AttendanceStudent } from "@/types/attendance"
export function StudentAttendanceDialog({ row, onClose }: { row: AttendanceStudent; onClose: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}><DialogContent><DialogHeader><DialogTitle>{row.name}</DialogTitle><DialogDescription>{row.nim} · {row.class.name} · {row.studyProgram.name}</DialogDescription></DialogHeader><p className="text-sm text-muted-foreground">Rekap sesuai filter aktif.</p><dl className="grid grid-cols-2 gap-4">{[["Hadir", row.attendance.present], ["Izin", row.attendance.permission], ["Sakit", row.attendance.sick], ["Alpa", row.attendance.absent], ["Kehadiran", `${row.attendance.percentage ?? 0}%`]].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-xl font-semibold">{value}</dd></div>)}</dl></DialogContent></Dialog>
}
export function MeetingAttendanceDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const dispatch = useAppDispatch()
  const { data, loading, error } = useAppSelector((state) => state.attendance.detail)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => { const request = dispatch(fetchAttendanceDetail(id)); return () => { request.abort(); dispatch(clearAttendanceDetail()) } }, [dispatch, id, attempt])
  const labels: Record<string, string> = { HADIR: "Hadir", IZIN: "Izin", SAKIT: "Sakit", ALPHA: "Alpa" }
  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Detail Pertemuan</DialogTitle><DialogDescription>Daftar presensi mahasiswa pada pertemuan ini.</DialogDescription></DialogHeader>{loading ? <Skeleton className="h-48" /> : error ? <div role="alert"><p>{error}</p><Button onClick={() => setAttempt((value) => value + 1)}>Coba Lagi</Button></div> : data && <><p className="font-medium">Pertemuan {data.meeting.meetingNumber} · {data.meeting.course.name}</p><p className="text-sm text-muted-foreground">{data.meeting.date} · {data.meeting.class.name} · {data.meeting.lecturer.name}</p>{data.meeting.topic && <p className="text-sm">Topik: {data.meeting.topic}</p>}<ul className="divide-y">{data.students.map((row) => <li key={row.id} className="py-3"><div className="flex justify-between gap-3"><div><p className="text-sm font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.nim}</p></div><span className="text-sm">{labels[row.status] ?? row.status}</span></div>{row.note && <p className="mt-1 break-words text-sm text-muted-foreground">{row.note}</p>}</li>)}</ul>{!data.students.length && <p className="text-sm text-muted-foreground">Belum ada catatan presensi.</p>}</>}</DialogContent></Dialog>
}
