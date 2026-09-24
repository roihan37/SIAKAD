import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { getCourseGrades, getGradeOptions, getGradeSummary, getStudentGrades } from "@/features/action/gradeThunk"
import { setSearch } from "@/features/slice/gradeSlice"
export function useGrades() {
  const dispatch = useAppDispatch()
  const state = useAppSelector((store) => store.grades)
  const { filters, studentPagination, coursePagination } = state
  const [view, setView] = useState<"students" | "courses">("students")
  const [search, setSearchInput] = useState(filters.search ?? "")
  const [summaryRetry, retrySummary] = useState(0)
  const [tableRetry, retryTable] = useState(0)
  const [optionsRetry, retryOptions] = useState(0)
  const pagination = view === "students" ? studentPagination : coursePagination
  useEffect(() => { const request = dispatch(getGradeOptions()); return () => request.abort() }, [dispatch, optionsRetry])
  useEffect(() => {
    if (!filters.academicYearId) return
    const request = dispatch(getGradeSummary(filters)); return () => request.abort()
  }, [dispatch, filters, summaryRetry])
  useEffect(() => {
    if (!filters.academicYearId) return
    const params = { ...filters, page: pagination.page, limit: pagination.limit }
    const request = view === "students" ? dispatch(getStudentGrades(params)) : dispatch(getCourseGrades(params))
    return () => request.abort()
  }, [dispatch, filters, view, pagination.page, pagination.limit, tableRetry])
  useEffect(() => {
    if (search.trim() === (filters.search ?? "")) return
    const timer = setTimeout(() => dispatch(setSearch(search.trim() || undefined)), 400)
    return () => clearTimeout(timer)
  }, [dispatch, search, filters.search])
  return { ...state, view, setView, search, setSearchInput, pagination,
    retrySummary: () => retrySummary((value) => value + 1), retryTable: () => retryTable((value) => value + 1), retryOptions: () => retryOptions((value) => value + 1) }
}
