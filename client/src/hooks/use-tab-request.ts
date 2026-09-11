import { useEffect, useState } from "react"
import type { AsyncThunkAction, UnknownAction } from "@reduxjs/toolkit"
import { useAppDispatch } from "@/hooks/redux"

export function useTabRequest<T, P>(thunk: (params: P) => AsyncThunkAction<T, P, { rejectValue: string }>, params: P, clear: () => UnknownAction) {
  const dispatch = useAppDispatch()
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const request = dispatch(thunk(params))
    return () => { request.abort(); dispatch(clear()) }
  }, [dispatch, thunk, params, clear, attempt])
  return () => setAttempt((current) => current + 1)
}

