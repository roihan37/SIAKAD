import { BookOpen, GraduationCap, Layers3 } from "lucide-react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-[1fr_1.1fr]">
      <section className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm">
            <GraduationCap className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-lg font-bold tracking-[0.12em]">SIAKAD</p>
            <p className="text-xs text-muted-foreground">Sistem Informasi Akademik</p>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 items-center py-12 sm:py-16">
          <LoginForm className="w-full" />
        </div>
        <p className="text-center text-xs leading-5 text-muted-foreground">SIAKAD · Portal layanan akademik kampus</p>
      </section>

      <aside className="relative m-4 ml-0 hidden overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-36 size-[32rem] rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-64 -left-40 size-[42rem] rounded-full border border-white/10" />
        <div className="relative flex items-center gap-2 text-sm font-medium text-blue-100">
          <Layers3 className="size-4" aria-hidden="true" />Portal Akademik Terpadu
        </div>
        <div className="relative max-w-lg py-16">
          <div className="mb-8 flex size-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <BookOpen className="size-8" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">Satu akses untuk<br />aktivitas akademik Anda.</h2>
          <p className="mt-6 max-w-md text-base leading-7 text-blue-100/90">Terhubung dengan layanan perkuliahan, informasi akademik, dan administrasi kampus dalam satu tempat.</p>
          <div className="mt-10 flex flex-wrap gap-2">
            {["Mahasiswa", "Dosen", "Administrator"].map(role => <span key={role} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-blue-100">{role}</span>)}
          </div>
        </div>
        <p className="relative border-t border-white/15 pt-6 text-xs leading-5 text-blue-100/80">Mendukung proses belajar dan layanan kampus yang lebih terorganisir.</p>
      </aside>
    </main>
  )
}
