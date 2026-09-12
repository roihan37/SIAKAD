
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createLecturer, getAllLecturers, getLecturerById, updateLecturer, bulkMutateLecturers } from "../action/dosenThunk";
import type { DosenState } from "@/types/state";

const initialState: DosenState = {
    isUpdatingLecturer: false,
    isBulkMutating: false,
    lecturerListRequestId: null,
    lecturerListError: null,
    error: null,
    lecturerDetail: null,
    isLoadingLecturerDetail: false,
    lecturerDetailError: null,
    lecturerDetailRequestId: null,
    lecturers: [],
    search: "",
    page: 1,
    limit: 10,
    totalPages: 1,
    totalRows: 0,
    sortBy: "name",
    sortOrder: "asc",


    isLoadingLecturers: false,
    isCreatingLecturer: false

}
const dosenSilce = createSlice({
    name: 'lecturers',
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


            .addCase(getLecturerById.pending, (state, action) => {
                state.isLoadingLecturerDetail = true
                state.lecturerDetailError = null
                state.lecturerDetail = null
                state.lecturerDetailRequestId = action.meta.requestId
            })
            .addCase(getLecturerById.fulfilled, (state, action) => {
                if (state.lecturerDetailRequestId !== action.meta.requestId) return
                state.lecturerDetail = action.payload.lecturer
                state.isLoadingLecturerDetail = false
                state.lecturerDetailRequestId = null
            })
            .addCase(getLecturerById.rejected, (state, action) => {
                if (state.lecturerDetailRequestId !== action.meta.requestId) return
                state.isLoadingLecturerDetail = false
                state.lecturerDetailRequestId = null
                if (!action.meta.aborted) state.lecturerDetailError = action.payload ?? "Gagal memuat detail dosen."
            })

            .addCase(updateLecturer.pending, (state) => { state.isUpdatingLecturer = true })
            .addCase(updateLecturer.fulfilled, (state) => { state.isUpdatingLecturer = false })
            .addCase(updateLecturer.rejected, (state) => { state.isUpdatingLecturer = false })

            .addCase(bulkMutateLecturers.pending, (state) => { state.isBulkMutating = true })
            .addCase(bulkMutateLecturers.rejected, (state) => { state.isBulkMutating = false })
            .addCase(bulkMutateLecturers.fulfilled, (state, action) => {
                state.isBulkMutating = false
                const ids = action.payload.ids
                const input = action.meta.arg
                if (input.kind === "delete") {
                    state.lecturers = state.lecturers.filter((lecturer) => !ids.includes(lecturer.id))
                    if (state.totalRows !== undefined) state.totalRows = Math.max(0, state.totalRows - ids.length)
                    state.totalPages = Math.max(1, Math.ceil((state.totalRows ?? state.lecturers.length) / state.limit))
                } else {
                    state.lecturers.forEach((lecturer) => { if (ids.includes(lecturer.id)) lecturer.dosen.status = input.status })
                }
                if (state.lecturerDetail && ids.includes(state.lecturerDetail.id)) state.lecturerDetail = null
            })

            // LECTURERS
            .addCase(getAllLecturers.pending, (state, action) => {
                state.lecturerListRequestId = action.meta.requestId
                state.lecturerListError = null
                state.isLoadingLecturers = true
            })
            .addCase(getAllLecturers.fulfilled, (state, action) => {
                if (state.lecturerListRequestId !== action.meta.requestId) return
                state.isLoadingLecturers = false
                state.lecturers = action.payload.lecturers
                state.page = action.payload.pagination.page;
                state.limit = action.payload.pagination.limit;
                state.totalPages = action.payload.pagination.totalPages;
                state.totalRows = action.payload.pagination.totalRows;
            })
            .addCase(getAllLecturers.rejected, (state, action) => {
                if (state.lecturerListRequestId !== action.meta.requestId) return
                if (!action.meta.aborted) state.lecturerListError = typeof action.payload === "string" ? action.payload : "Gagal memuat daftar dosen."
                state.isLoadingLecturers = false
                state.error = action.payload as string;
            })


            .addCase(createLecturer.pending, state => {
                state.isCreatingLecturer = true
            })
            .addCase(createLecturer.fulfilled, (state) => {
                state.isCreatingLecturer = false
            })
            .addCase(createLecturer.rejected, (state, action) => {
                state.isCreatingLecturer = false
                state.error =
                    typeof action.payload === "string"
                        ? action.payload
                        : action.error.message ?? "Gagal membuat mahasiswa."
            })

    }
})
export const { setPage, setSearch, setSorting } = dosenSilce.actions;
export default dosenSilce.reducer