import { api } from "@/api/axios"
import type { GradeFilters, StudentGradesResponse, CourseGradesResponse } from "@/types/grades"
import { score, statusLabels } from "./grade-format"
export async function exportGrades(filters: GradeFilters, view: "students" | "courses", signal: AbortSignal) {
  const rows: (string | number)[][] = [view === "students" ? ["NIM", "Mahasiswa", "Prodi", "Kelas", "Mata Kuliah", "Nilai Akhir", "Grade", "Status"] : ["Kode", "Mata Kuliah", "Kelas", "Dosen", "Jumlah Mahasiswa", "Nilai Terisi", "Rata-rata", "Status"]]
  for (let page = 1, totalPages = 1; page <= totalPages; page++) {
    const params = { ...filters, page, limit: 100 }
    if (view === "students") {
      const { data: { data } } = await api.get<{ data: StudentGradesResponse }>("/admin/grades/students", { params, signal })
      totalPages = data.pagination.totalPages
      rows.push(...data.grades.map((row) => [row.student.nim, row.student.name, row.student.studyProgram.name, row.class.name, row.course.name, score(row.finalScore), row.grade ?? "—", statusLabels[row.status]]))
    } else {
      const { data: { data } } = await api.get<{ data: CourseGradesResponse }>("/admin/grades/courses", { params, signal })
      totalPages = data.pagination.totalPages
      rows.push(...data.courses.map((row) => [row.course.code, row.course.name, row.class.name, row.lecturer.name, row.studentCount, row.gradedCount, score(row.averageFinalScore), statusLabels[row.status]]))
    }
  }
  signal.throwIfAborted()
  const csv = rows.map((cells) => cells.map((cell) => {
    const text = String(cell); const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text
    return `"${safe.replaceAll('"', '""')}"`
  }).join(",")).join("\r\n")
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }))
  const link = document.createElement("a"); link.href = url; link.download = `nilai-${view}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
