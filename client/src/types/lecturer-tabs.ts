export interface AcademicYear { id: number; tahun: string; semester: string; isActive?: boolean }
export interface LecturerTabParams { id: string; tahunAkademikId: number }
export interface AdviseeParams extends LecturerTabParams { search: string; page: number; limit: number }
export interface ScheduleTime { id: number; hari: string; jamMulai: string; jamSelesai: string }
export interface TeachingData {
  tahunAkademik: AcademicYear
  mengajar: Array<{ id: number; kode: string; mataKuliah: string; kelas: string; sks: number; jadwal: Array<ScheduleTime & { ruangan: string }> }>
}
export interface ScheduleData {
  tahunAkademik: AcademicYear
  jadwal: Array<ScheduleTime & { mataKuliah: { id: number; kode: string; nama: string; sks: number }; kelas: { id: number; nama: string }; ruangan: { id: number; kode: string; nama: string } }>
}
export interface AdviseesData {
  summary: { total: number; approved: number; pending: number; notSubmitted: number; rejected: number }
  advisees: Array<{ id: string; studentId: string; nim: string; name: string; studyProgram: { id: number; name: string }; cohort: number; studentStatus: string; krsStatus: string }>
  pagination: { page: number; limit: number; totalRows: number; totalPages: number }
}
export interface RemoteData<T> { data: T | null; loading: boolean; error: string | null; requestId: string | null }
