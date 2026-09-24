import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { fetchDashboard, fetchDashboardYears } from "@/features/action/dashboardThunk"
import { reloadDashboard, reloadDashboardYears, selectDashboardYear } from "@/features/slice/dashboardSlice"

export function useDashboard() {
  const dispatch = useAppDispatch()
  const { overview, years, selectedYear, revision, yearsRevision } = useAppSelector((state) => state.dashboard)

  useEffect(() => {
    const request = dispatch(fetchDashboard(selectedYear))
    return () => request.abort()
  }, [dispatch, selectedYear, revision])

  useEffect(() => {
    const request = dispatch(fetchDashboardYears())
    return () => request.abort()
  }, [dispatch, yearsRevision])

  return {
    data: overview.data,
    loading: overview.loading,
    error: overview.error,
    years: years.data ?? [],
    yearsLoading: years.loading,
    yearsError: years.error,
    selectedYear: selectedYear ?? overview.data?.academicYear.id,
    selectYear: (id: number) => dispatch(selectDashboardYear(id)),
    reload: () => dispatch(reloadDashboard()),
    retryYears: () => dispatch(reloadDashboardYears()),
  }
}
