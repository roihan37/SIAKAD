import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PresensiSelect } from "./PresensiSelect"
import { formatDate, statuses, type Attendance, type AttendanceStatus } from "./presensi-data"

export function CorrectionDialog({ records, onClose, onSave }: { records: Attendance[]; onClose: () => void; onSave: (id: string, status: AttendanceStatus, reason: string) => void }) {
  const [id, setId] = useState(records[0].id)
  const current = records.find((row) => row.id === id)!
  const [status, setStatus] = useState<AttendanceStatus>(current.status)
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const labels = records.map((row) => `${row.meeting} · ${formatDate(row.date)} · ${row.course}`)
  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
    <DialogHeader><DialogTitle>Koreksi Presensi</DialogTitle><DialogDescription>Perubahan hanya disimpan pada sesi demo ini.</DialogDescription></DialogHeader>
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault()
      if (status === current.status) { setError("Pilih status yang berbeda dari status saat ini."); return }
      if (reason.trim().length < 5) { setError("Tuliskan alasan koreksi minimal 5 karakter."); return }
      onSave(id, status, reason.trim())
    }}>
      <div className="rounded-lg bg-muted/50 p-3"><p className="font-medium">{current.name}</p><p className="text-sm text-muted-foreground">{current.nim} · {current.kelas}</p></div>
      <PresensiSelect label="Pertemuan" value={labels[records.indexOf(current)]} options={labels} onChange={(label) => { const row = records[labels.indexOf(label)]; setId(row.id); setStatus(row.status); setError(""); setReason("") }} />
      <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Status saat ini</span><Badge variant="secondary">{current.status}</Badge></div>
      <PresensiSelect label="Status baru" value={status} options={[...statuses]} onChange={(value) => { setStatus(value as AttendanceStatus); setError("") }} />
      <div className="space-y-2"><label htmlFor="correction-reason" className="text-sm font-medium">Alasan koreksi <span className="text-destructive">*</span></label><Textarea id="correction-reason" required minLength={5} maxLength={500} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Contoh: Surat izin telah diverifikasi oleh admin." aria-describedby="correction-help" /><p id="correction-help" className="text-xs text-muted-foreground">Wajib diisi, 5–500 karakter.</p></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Batal</Button><Button type="submit">Simpan</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>
}

export function AttendanceDetailDialog({ records, view, onClose }: { records: Attendance[]; view: "students" | "meetings"; onClose: () => void }) {
  const row = records[0]
  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
    <DialogHeader><DialogTitle>{view === "students" ? row.name : `Pertemuan ${row.meeting}`}</DialogTitle><DialogDescription>{view === "students" ? `${row.nim} · ${row.kelas}` : `${formatDate(row.date)} · ${row.kelas} · ${row.course}`} · {row.period}</DialogDescription></DialogHeader>
    <ul className="divide-y">{records.map((item) => <li key={item.id} className="space-y-1 py-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{view === "students" ? `Pertemuan ${item.meeting} · ${item.course}` : item.name}</p><p className="text-xs text-muted-foreground">{view === "students" ? formatDate(item.date) : item.nim}</p></div><Badge variant="outline">{item.status}</Badge></div>{item.reason && <p className="break-words text-xs text-muted-foreground">Alasan koreksi: {item.reason}</p>}</li>)}</ul>
    <DialogFooter><Button variant="outline" onClick={onClose}>Tutup</Button></DialogFooter>
  </DialogContent></Dialog>
}
