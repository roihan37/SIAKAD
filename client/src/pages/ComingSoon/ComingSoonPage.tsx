import { ArrowLeft, Clock3, LayoutDashboard } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function ComingSoonPage({ title }: { title: string }) {
  const navigate = useNavigate()
  return <main className="flex flex-1 flex-col py-6">
    <header><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-1 text-sm text-muted-foreground">Modul {title.toLowerCase()} SIAKAD.</p></header>
    <section className="mt-6 flex min-h-[50vh] flex-col items-center justify-center rounded-xl border bg-card px-5 py-12 text-center sm:px-8">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Clock3 className="size-7" aria-hidden="true" /></div>
      <Badge variant="secondary">Coming Soon</Badge>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Segera Hadir</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Halaman {title.toLowerCase()} belum tersedia. Anda dapat melanjutkan aktivitas melalui menu lain yang sudah tersedia.</p>
      <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <Button variant="outline" onClick={() => { if (window.history.state?.idx > 0) navigate(-1); else navigate("/dashboard", { replace: true }) }}><ArrowLeft />Kembali</Button>
        <Button render={<Link to="/dashboard" />}><LayoutDashboard />Ke Dashboard</Button>
      </div>
    </section>
  </main>
}
