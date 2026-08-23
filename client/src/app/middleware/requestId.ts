import type { UnknownAction } from "redux"

export const getRequestId = (
  action: UnknownAction
): string | undefined => {
  if (
    action.meta &&
    typeof action.meta === "object" &&
    "requestId" in action.meta &&
    typeof action.meta.requestId === "string"
  ) {
    return action.meta.requestId
  }

  return undefined
}