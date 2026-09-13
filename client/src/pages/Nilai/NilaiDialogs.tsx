import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GradeStatusBadge } from "./GradeStatusBadge"
import { grade, score, type GradeRecord } from "./nilai-data"

export function CorrectionDialog({ row, onClose, onSave }: { row: GradeRecord; onClose: () => void; onSave: (value: number, reason: string) => void }) {
  const [value, setValue] = useState(row.final === null ? "" : String(row.final))
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const parsed = Number(value)
  const valid = value.trim() !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
    <DialogHeader><DialogTitle>Koreksi Nilai</DialogTitle><DialogDescription>Koreksi administratif pada nilai akhir. Perubahan disimpan pada sesi demo ini.</DialogDescription></DialogHeader>
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault()
      if (!valid) { setError("Masukkan nilai antara 0 dan 100."); return }
      if (parsed === row.final) { setError("Nilai baru harus berbeda dari nilai saat ini."); return }
      if (reason.trim().length < 5) { setError("Alasan koreksi minimal 5 karakter."); return }
      onSave(parsed, reason.trim())
    }}>
      <div className="space-y-1 rounded-lg bg-muted/50 p-3"><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.nim} · {row.kelas}</p><p className="pt-2 text-sm">{row.code} · {row.course}</p></div>
      <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Nilai saat ini</span><span className="font-semibold">{score(row.final)} · {grade(row.final)}</span></div>
      <div className="space-y-2"><label htmlFor="new-grade" className="text-sm font-medium">Nilai baru</label><Input id="new-grade" type="number" required min={0} max={100} step="0.01" value={value} onChange={(event) => { setValue(event.target.value); setError("") }} aria-describedby="grade-preview" /><p id="grade-preview" aria-live="polite" className="text-sm">Preview grade: <strong>{valid ? grade(parsed) : "—"}</strong></p><p className="text-xs text-muted-foreground">Skala demo: A ≥ 85 · B ≥ 75 · C ≥ 65 · D ≥ 50 · E &lt; 50.</p></div>
      <div className="space-y-2"><label htmlFor="grade-reason" className="text-sm font-medium">Alasan koreksi <span className="text-destructive">*</span></label><Textarea id="grade-reason" required minLength={5} maxLength={500} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Jelaskan dasar koreksi nilai (5–500 karakter)." /></div>
      <p className="text-xs text-muted-foreground">Nilai akhir menjadi Final. Komponen tugas, UTS, dan UAS tetap tercatat sebagai referensi.</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Batal</Button><Button type="submit">Simpan</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>
}

export function StudentDetailDialog({ row, onClose }: { row: GradeRecord; onClose: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
    <DialogHeader><DialogTitle>Detail Nilai Mahasiswa</DialogTitle><DialogDescription>{row.period} · Data dummy</DialogDescription></DialogHeader>
    <div className="rounded-lg bg-muted/50 p-4"><p className="font-semibold">{row.name}</p><p className="mt-1 text-sm text-muted-foreground">{row.nim} · {row.kelas} · {row.prodi}</p></div>
    <div><p className="font-medium">{row.code} · {row.course}</p><p className="text-sm text-muted-foreground">Dosen: {row.lecturer}</p></div>
    <dl className="grid grid-cols-3 gap-3">{([['Tugas', row.tugas], ['UTS', row.uts], ['UAS', row.uas]] as const).map(([label, value]) => <div key={label} className="rounded-lg border p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold">{score(value)}</dd></div>)}</dl>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"><div><p className="text-xs text-muted-foreground">Nilai akhir · Grade</p><p className="mt-1 text-xl font-semibold">{score(row.final)} · {grade(row.final)}</p></div><GradeStatusBadge status={row.status} /></div>
    <p className="text-xs text-muted-foreground">Komponen yang belum tersedia ditandai —. Nilai awal demo: tugas 30%, UTS 30%, UAS 40%. Koreksi admin mengganti nilai akhir.</p>
    <section><h3 className="text-sm font-semibold">Riwayat Koreksi</h3>{!row.history.length ? <p className="mt-2 text-sm text-muted-foreground">Belum ada koreksi nilai.</p> : <ol className="mt-3 space-y-3">{row.history.slice().reverse().map((entry, i) => <li key={`${entry.date}-${i}`} className="rounded-lg border p-3 text-sm"><p className="font-medium">{score(entry.before)} → {score(entry.after)} · Grade {grade(entry.after)}</p><p className="mt-1 break-words">{entry.reason}</p><p className="mt-2 text-xs text-muted-foreground">Admin (demo) · {new Date(entry.date).toLocaleString("id-ID")}</p></li>)}</ol>}</section>
    <DialogFooter><Button variant="outline" onClick={onClose}>Tutup</Button></DialogFooter>
  </DialogContent></Dialog>
}
