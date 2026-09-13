import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { fetchAttendanceFilters, fetchAttendanceMeetings, fetchAttendanceStudents, fetchAttendanceSummary } from "@/features/action/attendanceThunk"
import { setAttendanceQuery } from "@/features/slice/attendanceSlice"

export function useAttendance() {
  const dispatch = useAppDispatch()
  const state = useAppSelector((store) => store.attendance)
  const { query, page, view } = state
  const [search, setSearch] = useState(query.search ?? "")
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const request = dispatch(fetchAttendanceFilters())
    return () => request.abort()
  }, [dispatch, revision])

  useEffect(() => {
    const request = dispatch(fetchAttendanceSummary(query))
    return () => request.abort()
  }, [dispatch, query, revision])

  useEffect(() => {
    const params = { ...query, page, limit: 10 }
    const request = view === "students" ? dispatch(fetchAttendanceStudents(params)) : dispatch(fetchAttendanceMeetings(params))
    return () => request.abort()
  }, [dispatch, query, page, view, revision])

  useEffect(() => {
    const normalized = search.trim()
    if (normalized === (query.search ?? "")) return
    const timer = setTimeout(() => dispatch(setAttendanceQuery({ ...query, search: normalized || undefined })), 400)
    return () => clearTimeout(timer)
  }, [dispatch, search, query])

  return { ...state, search, setSearch, reload: () => setRevision((value) => value + 1) }
}
