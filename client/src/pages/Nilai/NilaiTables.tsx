import { Eye, MoreHorizontal, Pencil } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/tables/data-table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { CourseGradeItem, StudentGradeItem } from "@/types/grades"
import { GradeStatusBadge } from "./GradeStatusBadge"
import { score } from "./grade-format"
const tableProps = { embedded: true, searchValue: "", onSearchChange: () => {}, sorting: [], onSortingChange: () => {}, pageIndex: 0, pageCount: 1, onPageChange: () => {} }
export function StudentTable({ rows, loading, onDetail }: { rows: StudentGradeItem[]; loading: boolean; onDetail: (row: StudentGradeItem) => void }) {
  const columns: ColumnDef<StudentGradeItem>[] = [
    { id: "nim", header: "NIM", accessorFn: (row) => row.student.nim },
    { id: "student", header: "Mahasiswa", cell: ({ row: { original: row } }) => <><p className="font-medium">{row.student.name}</p><p className="text-xs text-muted-foreground">{row.student.studyProgram.name}</p></> },
    { id: "class", header: "Kelas", accessorFn: (row) => row.class.name },
    { id: "course", header: "Mata Kuliah", cell: ({ row: { original: row } }) => <><p>{row.course.name}</p><p className="text-xs text-muted-foreground">{row.course.code}</p></> },
    { id: "finalScore", header: "Nilai Akhir", cell: ({ row }) => score(row.original.finalScore) },
    { id: "grade", header: "Grade", cell: ({ row }) => row.original.grade ?? "—" },
    { id: "status", header: "Status", cell: ({ row }) => <GradeStatusBadge status={row.original.status} /> },
    { id: "actions", header: "Aksi", cell: ({ row: { original: row } }) => <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Aksi nilai ${row.student.name}, ${row.course.name}`}><MoreHorizontal /></Button>} /><DropdownMenuContent align="end" className="w-64"><DropdownMenuGroup><DropdownMenuItem disabled={!row.kelasMataKuliahId} onClick={() => onDetail(row)}><Eye />Lihat Detail</DropdownMenuItem>{!row.kelasMataKuliahId && <p className="px-2 py-1 text-xs text-muted-foreground">Detail belum tersedia dari rekap mahasiswa.</p>}<DropdownMenuItem disabled><Pencil />Koreksi Nilai</DropdownMenuItem><p className="px-2 py-1 text-xs text-muted-foreground">Layanan koreksi belum tersedia.</p></DropdownMenuGroup></DropdownMenuContent></DropdownMenu> },
  ]
  return <DataTable {...tableProps} columns={columns} data={rows} isLoading={loading} getRowId={(row) => row.krsDetailId} />
}
export function CourseTable({ rows, loading, onDetail }: { rows: CourseGradeItem[]; loading: boolean; onDetail: (row: CourseGradeItem) => void }) {
  const columns: ColumnDef<CourseGradeItem>[] = [
    { id: "code", header: "Kode", accessorFn: (row) => row.course.code },
    { id: "course", header: "Mata Kuliah", accessorFn: (row) => row.course.name },
    { id: "class", header: "Kelas", accessorFn: (row) => row.class.name },
    { id: "lecturer", header: "Dosen", accessorFn: (row) => row.lecturer.name },
    { accessorKey: "studentCount", header: "Jumlah Mahasiswa" },
    { id: "filled", header: "Nilai Terisi", cell: ({ row }) => `${row.original.gradedCount}/${row.original.studentCount}` },
    { id: "average", header: "Rata-rata", cell: ({ row }) => score(row.original.averageFinalScore) },
    { id: "status", header: "Status", cell: ({ row }) => <GradeStatusBadge status={row.original.status} /> },
    { id: "actions", header: "Aksi", cell: ({ row }) => <Button variant="ghost" size="sm" onClick={() => onDetail(row.original)}><Eye />Detail</Button> },
  ]
  return <DataTable {...tableProps} columns={columns} data={rows} isLoading={loading} getRowId={(row) => String(row.kelasMataKuliahId)} />
}
