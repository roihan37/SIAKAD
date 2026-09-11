import { useState } from "react"
import { Ban, Info, KeyRound, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
export function DemoNotice({ children }: { children: string }) {
  return <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" /><p><span className="font-semibold text-foreground">Data contoh. </span>{children}</p></div>
}

function Status({ value }: { value: string }) {
  return <Badge variant="secondary" className={value === "Aktif" || value === "Disetujui" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : value === "Cuti" || value === "Menunggu" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : ""}>{value}</Badge>
}

export function AccountTab({ email, name }: { email: string; name: string }) {
  const [active, setActive] = useState(true)
  const [action, setAction] = useState<"reset" | "deactivate" | null>(null)
  const [notice, setNotice] = useState("")
  return <div className="space-y-5"><DemoNotice>Email berasal dari profil API. Username, status akun, dan terakhir login adalah contoh; tombol hanya menjalankan simulasi lokal.</DemoNotice><Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Informasi Akun</CardTitle></CardHeader><CardContent><dl className="grid gap-5 sm:grid-cols-2">{[{ label: "Username (contoh)", value: "budi.santoso" }, { label: "Email", value: email }, { label: "Role", value: "Dosen" }, { label: "Status Akun (contoh)", value: active ? "Aktif" : "Nonaktif" }, { label: "Terakhir Login (contoh)", value: "10 September 2026, 08:17 WIB" }].map((item) => <div key={item.label} className="space-y-1"><dt className="text-xs text-muted-foreground">{item.label}</dt><dd className="break-words text-sm font-medium">{item.label.startsWith("Status") ? <Status value={item.value} /> : item.value || "—"}</dd></div>)}</dl><div className="mt-6 flex flex-wrap gap-3 border-t pt-4"><Button variant="outline" disabled={!active} onClick={() => setAction("reset")}><KeyRound /> Reset Password</Button><Button variant="destructive" disabled={!active} onClick={() => setAction("deactivate")}><Ban /> Nonaktifkan Akun</Button></div>{notice && <p role="status" className="mt-4 rounded-lg bg-muted/40 p-3 text-sm">{notice}</p>}</CardContent></Card><Dialog open={action !== null} onOpenChange={(open) => { if (!open) setAction(null) }}><DialogContent><DialogHeader><DialogTitle>{action === "reset" ? "Simulasikan reset password?" : "Nonaktifkan akun contoh?"}</DialogTitle><DialogDescription>Aksi untuk {name} ini hanya mengubah pratinjau. Akun asli tidak berubah.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setAction(null)}>Batal</Button><Button variant={action === "deactivate" ? "destructive" : "default"} onClick={() => { if (action === "deactivate") { setActive(false); setNotice("Akun contoh dinonaktifkan. Muat ulang halaman untuk mengembalikan kondisi awal.") } else { setNotice("Simulasi reset password selesai. Password akun asli tidak berubah.") } setAction(null) }}>{action === "reset" ? "Simulasikan Reset" : "Ya, Nonaktifkan"}</Button></DialogFooter></DialogContent></Dialog></div>
}
