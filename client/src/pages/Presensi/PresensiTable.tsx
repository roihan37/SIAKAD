import { Eye, MoreHorizontal, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDate, formatRate, summarize, type Attendance, type Recap } from "./presensi-data"

export function PresensiTable({ rows, view, onDetail, onCorrect }: { rows: Recap[]; view: "students" | "meetings"; onDetail: (records: Attendance[]) => void; onCorrect: (records: Attendance[]) => void }) {
  const studentView = view === "students"
  const headers = studentView ? ["NIM", "Mahasiswa", "Kelas", "Hadir", "Izin", "Sakit", "Alpa", "Kehadiran", "Aksi"] : ["Pertemuan", "Tanggal", "Kelas", "Hadir", "Izin", "Sakit", "Alpa", "Aksi"]
  return <Table><TableHeader><TableRow className="bg-muted/40">{headers.map((header) => <TableHead key={header} className="px-4 py-3">{header}</TableHead>)}</TableRow></TableHeader><TableBody>
    {!rows.length && <TableRow><TableCell colSpan={headers.length} className="h-40 text-center"><p className="font-medium">Tidak ada presensi ditemukan</p><p className="mt-1 text-sm text-muted-foreground">Coba ubah pencarian atau reset filter.</p></TableCell></TableRow>}
    {rows.map(({ id, records }) => {
      const row = records[0], counts = summarize(records)
      return <TableRow key={id}>
        {studentView ? <><TableCell className="px-4 font-mono text-xs">{row.nim}</TableCell><TableCell className="px-4"><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.prodi}</p></TableCell></> : <><TableCell className="px-4"><p className="font-medium">Pertemuan {row.meeting}</p><p className="text-xs text-muted-foreground">{row.course}</p></TableCell><TableCell className="px-4">{formatDate(row.date)}</TableCell></>}
        <TableCell className="px-4">{row.kelas}</TableCell>
        {(["Hadir", "Izin", "Sakit", "Alpa"] as const).map((status) => <TableCell key={status} className="px-4 tabular-nums">{counts[status]}</TableCell>)}
        {studentView && <TableCell className="px-4"><span className={`rounded-md px-2 py-1 text-xs font-medium ${counts.rate >= 75 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"}`}>{formatRate(counts.rate)}</span></TableCell>}
        <TableCell className="px-4">{studentView ? <DropdownMenu><DropdownMenuTrigger render={<Button size="icon" variant="ghost" aria-label={`Aksi presensi ${row.name}`}><MoreHorizontal /></Button>} /><DropdownMenuContent align="end" className="w-48"><DropdownMenuGroup><DropdownMenuItem onClick={() => onDetail(records)}><Eye />Lihat Detail</DropdownMenuItem><DropdownMenuItem onClick={() => onCorrect(records)}><Pencil />Koreksi Presensi</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu> : <Button variant="ghost" size="sm" onClick={() => onDetail(records)} aria-label={`Detail pertemuan ${row.meeting} ${row.kelas}`}><Eye />Detail</Button>}</TableCell>
      </TableRow>
    })}
  </TableBody></Table>
}
