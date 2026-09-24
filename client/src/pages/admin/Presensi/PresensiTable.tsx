import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AttendanceStudent, AttendanceMeeting, AttendanceCounts } from "@/types/attendance"
export function Counts({ value }: { value: AttendanceCounts }) {
  return <>{[value.present, value.permission, value.sick, value.absent].map((count, i) => <TableCell key={i} className="px-4 tabular-nums">{count}</TableCell>)}</>
}
export function PresensiTable({ students, meetings, view, onStudent, onMeeting }: { students: AttendanceStudent[]; meetings: AttendanceMeeting[]; view: "students" | "meetings"; onStudent: (row: AttendanceStudent) => void; onMeeting: (id: string) => void }) {
  const student = view === "students"
  const headers = student ? ["NIM", "Mahasiswa", "Kelas", "Hadir", "Izin", "Sakit", "Alpa", "Kehadiran", "Aksi"] : ["Pertemuan", "Tanggal", "Kelas", "Hadir", "Izin", "Sakit", "Alpa", "Aksi"]
  return <Table><TableHeader><TableRow>{headers.map((label) => <TableHead key={label} className="px-4">{label}</TableHead>)}</TableRow></TableHeader><TableBody>
    {!(student ? students : meetings).length && <TableRow><TableCell colSpan={headers.length} className="h-32 text-center text-muted-foreground">Tidak ada presensi sesuai filter.</TableCell></TableRow>}
    {student ? students.map((row) => <TableRow key={`${row.studentId}-${row.class.id}`}><TableCell className="px-4">{row.nim}</TableCell><TableCell className="px-4"><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.studyProgram.name}</p></TableCell><TableCell className="px-4">{row.class.name}</TableCell><Counts value={row.attendance} /><TableCell className="px-4">{row.attendance.percentage ?? 0}%</TableCell><TableCell><Button size="sm" variant="ghost" onClick={() => onStudent(row)}>Lihat Detail</Button></TableCell></TableRow>) : meetings.map((row) => <TableRow key={row.id}><TableCell className="px-4"><p>Pertemuan {row.meetingNumber}</p><p className="text-xs text-muted-foreground">{row.course.name}</p></TableCell><TableCell className="px-4">{row.date}</TableCell><TableCell className="px-4">{row.class.name}</TableCell><Counts value={row.attendance} /><TableCell><Button size="sm" variant="ghost" onClick={() => onMeeting(row.id)}>Detail</Button></TableCell></TableRow>)}
  </TableBody></Table>
}
