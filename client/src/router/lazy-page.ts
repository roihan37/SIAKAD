import { createElement, lazy, Suspense, type ComponentType } from "react"
import { RouteBoundary } from "./components/RouteBoundary"
import { RouteLoading } from "./components/RouteLoading"

export type PageLoader<Props extends object = Record<string, never>> = () => Promise<{ default: ComponentType<Props> }>

// Declare once in the route registry; imports only run when the auth guard renders the page.
export function createLazyPage<Props extends object>(load: PageLoader<Props>) {
  const Page = lazy(load)
  return function LazyPage(props: Props) {
    return createElement(RouteBoundary, null,
      createElement(Suspense, { fallback: createElement(RouteLoading) }, createElement(Page, props)),
    )
  }
}
