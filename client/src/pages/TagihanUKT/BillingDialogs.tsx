import { useState } from "react"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AcademicSelect } from "@/components/academic/AcademicSelect"
import { generationTargets, money, paid, periods, relativeDate, students, type Bill } from "./billing-data"

export type BillingAction = { kind: "generate" } | { kind: "edit"; bills: Bill[] } | { kind: "cancel"; bills: Bill[] } | { kind: "due"; bills: Bill[] }
export type BillingChange = { kind: "generate"; period: string; studentIds: string[]; amount: number; due: string } | { kind: "edit"; ids: string[]; amount: number; due: string; note: string } | { kind: "cancel"; ids: string[]; reason: string } | { kind: "due"; ids: string[]; due: string }

export function BillingDialog({ action, bills, period: initialPeriod, onClose, onSave }: { action: BillingAction; bills: Bill[]; period: string; onClose: () => void; onSave: (change: BillingChange) => void }) {
  const row = action.kind === "generate" ? undefined : action.bills[0]
  const [period, setPeriod] = useState(initialPeriod)
  const [target, setTarget] = useState("Sesuai Filter")
  const [prodi, setProdi] = useState("Semua")
  const [angkatan, setAngkatan] = useState("Semua")
  const [amount, setAmount] = useState(String(row?.amount ?? 5000000))
  const [due, setDue] = useState(row?.due ?? relativeDate(30))
  const [note, setNote] = useState(action.kind === "edit" ? row?.note ?? "" : "")
  const [error, setError] = useState("")
  const targets = generationTargets(bills, period, target, prodi, angkatan)
  const title = { generate: "Generate Tagihan", edit: "Edit Tagihan", cancel: "Batalkan Tagihan", due: "Ubah Jatuh Tempo" }[action.kind]
  const submit = () => {
    const ids = action.kind === "generate" ? [] : action.bills.map((bill) => bill.id)
    if (action.kind === "cancel") {
      if (note.trim().length < 5) { setError("Alasan pembatalan wajib diisi, minimal 5 karakter."); return }
      onSave({ kind: "cancel", ids, reason: note.trim() }); return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || Number.isNaN(Date.parse(due))) { setError("Pilih tanggal jatuh tempo yang valid."); return }
    if (action.kind === "due") { onSave({ kind: "due", ids, due }); return }
    const nominal = Number(amount)
    if (!Number.isSafeInteger(nominal) || nominal <= 0 || nominal > 1000000000) { setError("Nominal harus berupa rupiah bulat antara 1 dan 1.000.000.000."); return }
    if (row && nominal < paid(row)) { setError("Nominal tidak boleh lebih kecil dari jumlah terbayar."); return }
    if (action.kind === "generate") {
      if (!targets.length) { setError("Tidak ada mahasiswa yang memenuhi target."); return }
      onSave({ kind: "generate", period, studentIds: targets.map((student) => student.id), amount: nominal, due })
    } else onSave({ kind: "edit", ids, amount: nominal, due, note: note.trim() })
  }
  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{action.kind === "generate" ? "Buat tagihan UKT untuk mahasiswa yang belum memiliki tagihan aktif pada periode ini." : `${action.kind === "edit" ? "Perbarui" : "Kelola"} ${action.bills.length} tagihan terpilih. Perubahan hanya pada data demo.`}</DialogDescription></DialogHeader>
    <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); submit() }}>
      {row && <div className="rounded-lg bg-muted/50 p-3"><p className="font-medium">{action.kind !== "generate" && action.bills.length > 1 ? `${action.bills.length} tagihan terpilih` : row.student.name}</p><p className="mt-1 text-xs text-muted-foreground">{row.period} · {action.kind !== "generate" && action.bills.length === 1 ? `${row.student.nim} · ${money(row.amount)}` : "Perubahan berlaku untuk seluruh pilihan."}</p></div>}
      {action.kind === "generate" && <><AcademicSelect label="Tahun Akademik" value={period} options={periods} onChange={setPeriod} /><AcademicSelect label="Target Mahasiswa" value={target} options={["Sesuai Filter", "Semua Mahasiswa"]} onChange={setTarget} />{target === "Sesuai Filter" && <div className="grid gap-3 sm:grid-cols-2"><AcademicSelect label="Prodi" value={prodi} options={["Semua", ...new Set(students.map((student) => student.prodi))]} onChange={setProdi} /><AcademicSelect label="Angkatan" value={angkatan} options={["Semua", "2023", "2024", "2025"]} onChange={setAngkatan} /></div>}</>}
      {action.kind === "edit" && row && paid(row) > 0 && <p className="flex gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300"><TriangleAlert className="size-4 shrink-0" />Sudah ada pembayaran {money(paid(row))}. Nominal minimal sebesar jumlah terbayar.</p>}
      {(action.kind === "generate" || action.kind === "edit") && <div className="space-y-2"><label htmlFor="billing-amount" className="text-sm font-medium">Nominal (Rp)</label><Input id="billing-amount" type="number" min={1} max={1000000000} step={1} required value={amount} onChange={(event) => setAmount(event.target.value)} /></div>}
      {action.kind !== "cancel" && <div className="space-y-2"><label htmlFor="billing-due" className="text-sm font-medium">Jatuh Tempo</label><Input id="billing-due" type="date" required value={due} onChange={(event) => setDue(event.target.value)} /></div>}
      {(action.kind === "edit" || action.kind === "cancel") && <div className="space-y-2"><label htmlFor="billing-note" className="text-sm font-medium">{action.kind === "cancel" ? "Alasan pembatalan *" : "Catatan"}</label><Textarea id="billing-note" rows={3} maxLength={500} required={action.kind === "cancel"} minLength={action.kind === "cancel" ? 5 : undefined} value={note} onChange={(event) => setNote(event.target.value)} /></div>}
      {action.kind === "generate" && <p className="rounded-lg bg-primary/5 p-3 text-sm"><strong>{targets.length} mahasiswa</strong> akan dibuatkan tagihan. Mahasiswa dengan tagihan aktif pada periode ini otomatis dilewati.</p>}
      {action.kind === "cancel" && <p className="text-xs text-muted-foreground">Tagihan yang dibatalkan tetap tersimpan untuk riwayat dan tidak dapat diedit kembali.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Batal</Button><Button type="submit" variant={action.kind === "cancel" ? "destructive" : "default"} disabled={action.kind === "generate" && targets.length === 0}>{action.kind === "generate" || action.kind === "cancel" ? title : "Simpan"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>
}
