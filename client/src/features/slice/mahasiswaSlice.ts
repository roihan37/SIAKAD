import type { MahasiswaState } from "@/types/state";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createStudent, getAllStudents, getStudentById, getStudentHistorySemester, getStudentKRS, getStudentNilai, updateStudent, resetStudentPassword, deleteStudent, bulkMutateStudents } from "../action/mahasiswaThunk";

const initialState : MahasiswaState ={
    error: null,
    students: [],
    search: "",
    page: 1,
    limit: 10,
    totalPages: 1,
    totalRows: 0,
    sortBy: "name",
    sortOrder: "asc",
    riwayatSemester: [],
    krsMahasiswa: null,
    nilaiMahasiswa: null,

    studentDetail: null,
    isResettingPassword: false,
    deletingStudentId: null,
    isBulkMutating: false,

    isLoadingStudents: false,
    isLoadingStudentsDetail: false,
    isCreatingStudent: false,
    
}
const mahasiswaSilce = createSlice({
    name : 'students',
    initialState,
    reducers: {
        setPage: (state, action: PayloadAction<number>) => {
          state.page = action.payload
        },
        setSearch: (state, action: PayloadAction<string>) => {
          state.search = action.payload
          state.page = 1 
        },
        setSorting: (state, action: PayloadAction<{ sortBy: string; sortOrder: "asc" | "desc" }>) => {
            state.sortBy = action.payload.sortBy
            state.sortOrder = action.payload.sortOrder
            state.page = 1   
          },
      },
    extraReducers(builder) {
        builder

        .addCase(resetStudentPassword.pending, (state) => {
            state.isResettingPassword = true
        })
        .addCase(resetStudentPassword.fulfilled, (state) => {
            state.isResettingPassword = false
        })
        .addCase(resetStudentPassword.rejected, (state) => {
            state.isResettingPassword = false
        })

        .addCase(deleteStudent.pending, (state, action) => {
            state.deletingStudentId = action.meta.arg
        })
        .addCase(deleteStudent.fulfilled, (state, action) => {
            state.deletingStudentId = null
            state.students = state.students.filter((student) => student.id !== action.payload)
            if (state.totalRows !== undefined) state.totalRows = Math.max(0, state.totalRows - 1)
            if (state.studentDetail?.student.id === action.payload) state.studentDetail = null
        })
        .addCase(deleteStudent.rejected, (state) => {
            state.deletingStudentId = null
        })

        .addCase(bulkMutateStudents.pending, (state) => { state.isBulkMutating = true })
        .addCase(bulkMutateStudents.rejected, (state) => { state.isBulkMutating = false })
        .addCase(bulkMutateStudents.fulfilled, (state, action) => {
            state.isBulkMutating = false
            const input = action.meta.arg
            if (input.kind === "delete") {
                state.students = state.students.filter((student) => !input.ids.includes(student.id))
                if (state.totalRows !== undefined) state.totalRows = Math.max(0, state.totalRows - input.ids.length)
            } else {
                state.students.forEach((student) => {
                    if (input.ids.includes(student.id)) student.mahasiswa.status = input.status
                })
            }
            if (state.studentDetail && input.ids.includes(state.studentDetail.student.id)) state.studentDetail = null
        })

        // ADD STUDENTS
        .addCase(createStudent.pending, state => {
            state.isCreatingStudent = true
        })
        .addCase(createStudent.fulfilled, (state) => {
            state.isCreatingStudent = false
        })
        .addCase(createStudent.rejected, (state, action) =>{
            state.isCreatingStudent = false
            state.error =
                typeof action.payload === "string"
                ? action.payload
                : action.error.message ?? "Gagal membuat mahasiswa."
        })

        // UPDATE STUDENTS
        .addCase(updateStudent.pending, state => {
            state.isCreatingStudent = true
        })
        .addCase(updateStudent.fulfilled, (state) => {
            state.isCreatingStudent = false
        })
        .addCase(updateStudent.rejected, (state, action) =>{
            state.isCreatingStudent = false
            state.error =
                typeof action.payload === "string"
                ? action.payload
                : action.error.message ?? "Gagal membuat mahasiswa."
        })


        // STUDENTS
        .addCase(getAllStudents.pending, state => {
            state.isLoadingStudents = true
        })
        .addCase(getAllStudents.fulfilled, (state, action) => {
            state.isLoadingStudents = false
            state.students = action.payload.students
            state.page = action.payload.pagination.page;
            state.limit = action.payload.pagination.limit;
            state.totalPages = action.payload.pagination.totalPages;
            state.totalRows = action.payload.pagination.totalRows;
        })
        .addCase(getAllStudents.rejected, (state, action) =>{
            state.isLoadingStudents = false
            state.error = action.payload as string;
        })

        // GET ID STUDENTS
        .addCase(getStudentById.pending, state => {
            state.isLoadingStudentsDetail = true
        })
        .addCase(getStudentById.fulfilled, (state, action) => {
            state.isLoadingStudentsDetail = false
            state.studentDetail = action.payload
            
        })
        .addCase(getStudentById.rejected, (state, action) =>{
            state.isLoadingStudentsDetail = false
            state.studentDetail = null
        })

        // GET HISTORY SEMESTER STUDENTS
         .addCase(getStudentHistorySemester.pending, state => {
            state.isLoadingStudentsDetail = true
        })
        .addCase(getStudentHistorySemester.fulfilled, (state, action) => {
            state.isLoadingStudentsDetail = false
            state.riwayatSemester = action.payload.riwayatSemester
            
        })
        .addCase(getStudentHistorySemester.rejected, (state, action) =>{
            state.isLoadingStudentsDetail = false
            state.riwayatSemester = []
        })

        // GET KRS STUDENTS
        .addCase(getStudentKRS.pending, state => {
            state.isLoadingStudentsDetail = true
        })
        .addCase(getStudentKRS.fulfilled, (state, action) => {
            state.isLoadingStudentsDetail = false
            state.krsMahasiswa = action.payload.krs
            
        })
        .addCase(getStudentKRS.rejected, (state, action) =>{
            state.isLoadingStudentsDetail = false
            state.krsMahasiswa = null
        })

        // GET NILAI STUDENTS
        .addCase(getStudentNilai.pending, state => {
            state.isLoadingStudentsDetail = true
        })
        .addCase(getStudentNilai.fulfilled, (state, action) => {
            state.isLoadingStudentsDetail = false
            state.nilaiMahasiswa = action.payload.nilai
            
        })
        .addCase(getStudentNilai.rejected, (state, action) =>{
            state.isLoadingStudentsDetail = false
            state.nilaiMahasiswa = null
        })
        


    }
})
export const { setPage, setSearch, setSorting } = mahasiswaSilce.actions;
export default mahasiswaSilce.reducer