import {
  createListenerMiddleware,
  type UnknownAction,
} from "@reduxjs/toolkit"

import { toast } from "sonner"
import { getRequestId } from "./requestId"

export const toastMiddleware =
  createListenerMiddleware()

const loadingToastMap = new Map<
  string,
  string | number
>()

const isMutationAction = (
  action: UnknownAction
) => {
  const type = action.type

  return (
    type.includes("/create/") ||
    type.includes("/update/") ||
    type.includes("/delete/") ||
    type.includes("/add/") ||
    type.includes("/remove/")
  )
}

const getSuccessMessage = (
  action: UnknownAction
) => {
  const type = action.type

  if (type.includes("/create/")) {
    return "Data berhasil ditambahkan."
  }

  if (type.includes("/update/")) {
    return "Data berhasil diperbarui."
  }

  if (type.includes("/delete/")) {
    return "Data berhasil dihapus."
  }

  if (type.includes("/add/")) {
    return "Data berhasil ditambahkan."
  }

  if (type.includes("/remove/")) {
    return "Data berhasil dihapus."
  }

  return "Operasi berhasil."
}

const getErrorMessage = (
  action: UnknownAction
) => {
  const payload = action.payload

  if (typeof payload === "string") {
    return payload
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload
  ) {
    const message = payload.message

    if (typeof message === "string") {
      return message
    }
  }

  if (
    action.error &&
    typeof action.error === "string"
  ) {
    return action.error
  }

  return "Terjadi kesalahan. Silakan coba lagi."
}

toastMiddleware.startListening({
  predicate: (action) => {
    return (
      action.type.endsWith("/pending") &&
      isMutationAction(action)
    )
  },

  effect: async (action) => {
    const requestId = getRequestId(action)

    if (!requestId) return

    const toastId = toast.loading(
      "Menyimpan data..."
    )

    loadingToastMap.set(
      requestId,
      toastId
    )
  },
})

toastMiddleware.startListening({
  predicate: (action) => {
    return (
      action.type.endsWith("/fulfilled") &&
      isMutationAction(action)
    )
  },

  effect: async (action) => {
    const requestId =getRequestId(action)

    if (!requestId) return

    const toastId =
      loadingToastMap.get(requestId)

    toast.success(
      getSuccessMessage(action),
      {
        id: toastId,
      }
    )

    loadingToastMap.delete(requestId)
  },
})

toastMiddleware.startListening({
  predicate: (action) => {
    return (
      action.type.endsWith("/rejected") &&
      isMutationAction(action)
    )
  },

  effect: async (action) => {
    const requestId =getRequestId(action)

    if (!requestId) return

    const toastId =
      loadingToastMap.get(requestId)

    toast.error(
      getErrorMessage(action),
      {
        id: toastId,
      }
    )

    loadingToastMap.delete(requestId)
  },
})