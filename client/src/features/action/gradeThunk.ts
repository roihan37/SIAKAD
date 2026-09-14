import { createAsyncThunk } from "@reduxjs/toolkit"
import { isAxiosError } from "axios"
import { api } from "@/api/axios"
import type { GradeQuery, GradeSummary, StudentGradesResponse, CourseGradesResponse, CourseGradeDetail, StudentGradeDetail, GradeOptions } from "@/types/grades"
import { getAllTAkademik } from "./tAkademikThunk"
import { getAllProdi } from "./campusThunk"
import { getAllMatkul } from "./matkulThunk"
import { getAllLecturers } from "./dosenThunk"
import type { AppDispatch } from "@/app/store"

const message = (error: unknown) => typeof error === "string" ? error : isAxiosError<{ message?: string }>(error) ? error.response?.data?.message ?? "Tidak dapat menghubungi server. Silakan coba lagi." : "Data nilai gagal dimuat. Silakan coba lagi."
function list<T>(name: string) {
  return createAsyncThunk<T, GradeQuery, { rejectValue: string }>(`grades/${name}`, async (params, { signal, rejectWithValue }) => {
    try { return (await api.get<{ data: T }>(`/admin/grades/${name}`, { params, signal })).data.data }
    catch (error) { return rejectWithValue(message(error)) }
  })
}
export const getGradeSummary = list<GradeSummary>("summary")
export const getStudentGrades = list<StudentGradesResponse>("students")
export const getCourseGrades = list<CourseGradesResponse>("courses")
export const getCourseGradeDetail = createAsyncThunk<CourseGradeDetail, { kelasMataKuliahId: number; academicYearId: number }, { rejectValue: string }>("grades/courseDetail", async ({ kelasMataKuliahId, academicYearId }, { signal, rejectWithValue }) => {
  try { return (await api.get<{ data: CourseGradeDetail }>(`/admin/grades/courses/${kelasMataKuliahId}/students`, { params: { academicYearId }, signal })).data.data }
  catch (error) { return rejectWithValue(message(error)) }
})
// The backend parameter named studentId expects User.id, not Mahasiswa.id.
export const getStudentGradeDetail = createAsyncThunk<StudentGradeDetail, { studentId: string; kelasMataKuliahId: number }, { rejectValue: string }>("grades/studentDetail", async ({ studentId, kelasMataKuliahId }, { signal, rejectWithValue }) => {
  try { return (await api.get<{ data: StudentGradeDetail }>(`/admin/grades/students/${encodeURIComponent(studentId)}/courses/${kelasMataKuliahId}`, { signal })).data.data }
  catch (error) { return rejectWithValue(message(error)) }
})

// Reuse existing master-data thunks, collecting all pages for filter choices.
export const getGradeOptions = createAsyncThunk<GradeOptions, void, { dispatch: AppDispatch; rejectValue: string }>("grades/options", async (_, { dispatch, signal, rejectWithValue }) => {
  async function collect<T>(fetchPage: (page: number) => Promise<{ items: T[]; pages: number }>): Promise<T[]> {
    const items: T[] = []
    for (let page = 1, pages = 1; page <= pages; page++) {
      signal.throwIfAborted()
      const result = await fetchPage(page); items.push(...result.items); pages = result.pages
    }
    return items
  }
  type Year = { id: number; tahun: string; semester: string; isActive: boolean }
  type Program = { id: number; name: string }
  type Course = { id: number; kode: string; nama: string }
  type Lecturer = { name: string; dosen: { id: string; prodiId: number } }
  try {
    const [years, programs, courses, lecturers, classes] = await Promise.all([
      collect<Year>(async (page) => { const data = await dispatch(getAllTAkademik({ page, limit: 100, sortBy: "tahun", sortOrder: "desc" })).unwrap(); return { items: data.tahunAkademik, pages: data.pagination.totalPages } }),
      collect<Program>(async (page) => { const data = await dispatch(getAllProdi({ page, limit: 100 })).unwrap(); return { items: data.prodi, pages: data.pagination.totalPages } }),
      collect<Course>(async (page) => { const data = await dispatch(getAllMatkul({ page, limit: 100 })).unwrap(); return { items: data.mataKuliah, pages: data.pagination.totalPages } }),
      collect<Lecturer>(async (page) => { const data = await dispatch(getAllLecturers({ page, limit: 100, search: "", sortBy: "name", sortOrder: "asc" })).unwrap(); return { items: data.lecturers, pages: data.pagination.totalPages } }),
      api.get<{ kelas: { id: number; nama: string; tahunAkademikId: number; prodiId: number }[] }>("/kelas", { signal }),
    ])
    return {
      years: years.map((row) => ({ id: String(row.id), label: `${row.tahun} - ${row.semester}`, active: row.isActive })),
      programs: programs.map((row) => ({ id: String(row.id), label: row.name })),
      courses: courses.map((row) => ({ id: String(row.id), label: `${row.kode} · ${row.nama}` })),
      lecturers: lecturers.map((row) => ({ id: row.dosen.id, label: row.name, studyProgramId: row.dosen.prodiId })),
      classes: classes.data.kelas.map((row) => ({ id: String(row.id), label: row.nama, academicYearId: row.tahunAkademikId, studyProgramId: row.prodiId })),
    }
  } catch (error) { return rejectWithValue(message(error)) }
})
