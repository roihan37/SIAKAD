import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
interface Props { children: ReactNode }
export class RouteBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return <section role="alert" className="m-6 space-y-3 rounded-xl border bg-card p-6">
      <h1 className="text-lg font-semibold">Halaman gagal dimuat</h1>
      <p className="text-sm text-muted-foreground">Periksa koneksi Anda, lalu muat ulang halaman. Versi aplikasi mungkin telah diperbarui.</p>
      {/* A rejected dynamic import stays cached by React.lazy; a reload obtains the latest assets. */}
      <Button onClick={() => window.location.reload()}>Muat Ulang Halaman</Button>
    </section>
  }
}
