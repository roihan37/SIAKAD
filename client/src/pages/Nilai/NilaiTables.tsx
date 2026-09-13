import { Eye, MoreHorizontal, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GradeStatusBadge } from "./GradeStatusBadge"
import { courseStatus, grade, score, summarizeGrades, type CourseRecap, type GradeRecord } from "./nilai-data"

function EmptyRow() { return <TableRow><TableCell colSpan={8} className="h-40 text-center"><p className="font-medium">Tidak ada nilai ditemukan</p><p className="mt-1 text-sm text-muted-foreground">Ubah pencarian atau reset filter untuk melihat data.</p></TableCell></TableRow> }
function Headers({ labels }: { labels: string[] }) { return <TableHeader><TableRow className="bg-muted/40">{labels.map((label) => <TableHead key={label} className="px-4 py-3">{label}</TableHead>)}</TableRow></TableHeader> }
export function StudentTable({ rows, onDetail, onCorrect }: { rows: GradeRecord[]; onDetail: (row: GradeRecord) => void; onCorrect: (row: GradeRecord) => void }) {
  return <Table><Headers labels={["NIM", "Mahasiswa", "Kelas", "Mata Kuliah", "Nilai Akhir", "Grade", "Status", "Aksi"]} /><TableBody>
    {!rows.length && <EmptyRow />}
    {rows.map((row) => <TableRow key={row.id}><TableCell className="px-4 font-mono text-xs">{row.nim}</TableCell><TableCell className="px-4"><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.prodi}</p></TableCell><TableCell className="px-4">{row.kelas}</TableCell><TableCell className="px-4"><p>{row.course}</p><p className="text-xs text-muted-foreground">{row.code}</p></TableCell><TableCell className="px-4 font-medium tabular-nums">{score(row.final)}</TableCell><TableCell className="px-4">{grade(row.final)}</TableCell><TableCell className="px-4"><GradeStatusBadge status={row.status} /></TableCell><TableCell className="px-4"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Aksi nilai ${row.name}, ${row.course}`}><MoreHorizontal /></Button>} /><DropdownMenuContent align="end" className="w-44"><DropdownMenuGroup><DropdownMenuItem onClick={() => onDetail(row)}><Eye />Lihat Detail</DropdownMenuItem><DropdownMenuItem onClick={() => onCorrect(row)}><Pencil />Koreksi Nilai</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}
  </TableBody></Table>
}
export function CourseTable({ rows, onDetail }: { rows: CourseRecap[]; onDetail: (row: CourseRecap) => void }) {
  return <Table><Headers labels={["Kode", "Mata Kuliah", "Kelas", "Dosen", "Jumlah Mahasiswa", "Nilai Terisi", "Rata-rata", "Status", "Aksi"]} /><TableBody>
    {!rows.length && <TableRow><TableCell colSpan={9} className="h-40 text-center text-muted-foreground">Tidak ada mata kuliah sesuai filter. Coba reset filter.</TableCell></TableRow>}
    {rows.map((group) => { const row = group.records[0], summary = summarizeGrades(group.records)
      return <TableRow key={group.id}><TableCell className="px-4 font-mono text-xs">{row.code}</TableCell><TableCell className="px-4 font-medium">{row.course}</TableCell><TableCell className="px-4">{row.kelas}</TableCell><TableCell className="px-4">{row.lecturer}</TableCell><TableCell className="px-4">{summary.students}</TableCell><TableCell className="px-4">{summary.filled}/{group.records.length}</TableCell><TableCell className="px-4 tabular-nums">{score(summary.average)}</TableCell><TableCell className="px-4"><GradeStatusBadge status={courseStatus(group.records)} /></TableCell><TableCell className="px-4"><Button variant="ghost" size="sm" onClick={() => onDetail(group)} aria-label={`Detail ${row.course} ${row.kelas}`}><Eye />Detail</Button></TableCell></TableRow>
    })}
  </TableBody></Table>
}
export function CourseDetailDialog({ group, onClose }: { group: CourseRecap; onClose: () => void }) {
  const row = group.records[0], summary = summarizeGrades(group.records)
  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{row.code} · {row.course}</DialogTitle><DialogDescription>{row.kelas} · {row.lecturer} · {row.period}</DialogDescription></DialogHeader><p className="text-sm text-muted-foreground">Sesuai filter aktif: {summary.students} mahasiswa · {summary.filled} nilai terisi · Rata-rata {score(summary.average)}</p><Table><Headers labels={["Mahasiswa", "Nilai Akhir", "Grade", "Status"]} /><TableBody>{group.records.map((student) => <TableRow key={student.id}><TableCell className="px-4"><p className="font-medium">{student.name}</p><p className="text-xs text-muted-foreground">{student.nim}</p></TableCell><TableCell className="px-4">{score(student.final)}</TableCell><TableCell className="px-4">{grade(student.final)}</TableCell><TableCell className="px-4"><GradeStatusBadge status={student.status} /></TableCell></TableRow>)}</TableBody></Table><DialogFooter><Button variant="outline" onClick={onClose}>Tutup</Button></DialogFooter></DialogContent></Dialog>
}
