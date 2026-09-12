import { Loader2, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export type BulkKind = "delete" | "status"
export interface BulkTarget { id: string; name: string; identifier: string; status: string }

export function BulkActionsToolbar({ count, entity, busy, onAction, onClear }: { count: number; entity: string; busy: boolean; onAction: (kind: BulkKind) => void; onClear: () => void }) {
  if (!count) return null
  return <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4" role="region" aria-label={`Aksi ${entity} terpilih`}><div className="mr-auto"><p className="text-sm font-semibold" aria-live="polite">{count} {entity} dipilih</p><p className="text-xs text-muted-foreground">Pilihan hanya pada halaman ini.</p></div><Button variant="outline" onClick={() => onAction("status")} disabled={busy}>Ubah status</Button><Button variant="destructive" onClick={() => onAction("delete")} disabled={busy}><TrashIcon /> Hapus</Button><Button variant="ghost" onClick={onClear} disabled={busy}>Batal pilih</Button></div>
}

interface BulkActionDialogProps {
  kind: BulkKind | null
  entity: string
  targets: BulkTarget[]
  busy: boolean
  status: string
  statusOptions: readonly string[]
  onStatusChange: (value: string) => void
  reason?: string
  onReasonChange?: (value: string) => void
  deleteDescription: string
  onClose: () => void
  onConfirm: () => void
}

export function BulkActionDialog({ kind, entity, targets, busy, status, statusOptions, onStatusChange, reason, onReasonChange, deleteDescription, onClose, onConfirm }: BulkActionDialogProps) {
  const changed = targets.filter((target) => target.status !== status).length
  const invalid = !targets.length || (kind === "status" && (!changed || (onReasonChange !== undefined && !reason?.trim())))
  return <Dialog open={kind !== null} onOpenChange={(open) => { if (!open && !busy) onClose() }}><DialogContent showCloseButton={!busy} aria-busy={busy}><DialogHeader><DialogTitle>{kind === "delete" ? `Hapus ${entity} terpilih?` : `Ubah status ${entity}`}</DialogTitle><DialogDescription>{kind === "delete" ? deleteDescription : `Tentukan status baru untuk ${targets.length} ${entity}. ${onReasonChange ? `Alasan akan dicatat pada riwayat masing-masing ${entity}.` : "Periksa pilihan sebelum menyimpan."}`}</DialogDescription></DialogHeader><ul className="max-h-36 space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-3 text-sm" aria-label={`${entity} yang dipilih`}>{targets.map((target) => <li key={target.id} className="flex flex-wrap justify-between gap-x-3"><span className="font-medium">{target.name}</span><span className="text-muted-foreground">{target.identifier} · {target.status}</span></li>)}</ul>{kind === "status" && <div className="space-y-4"><fieldset disabled={busy}><legend className="mb-2 text-sm font-medium">Status baru</legend><div className="grid grid-cols-2 gap-2">{statusOptions.map((option) => <label key={option} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${status === option ? "border-primary bg-primary/5 font-medium" : ""}`}><input type="radio" name="bulk-status" value={option} checked={status === option} onChange={() => onStatusChange(option)} className="accent-primary" />{option}</label>)}</div></fieldset>{onReasonChange && <label className="block space-y-2 text-sm font-medium"><span>Alasan perubahan <span className="text-destructive">*</span></span><textarea required maxLength={1000} disabled={busy} value={reason ?? ""} onChange={(event) => onReasonChange(event.target.value)} rows={3} placeholder="Tuliskan alasan perubahan status..." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring" /></label>}<p role="status" className="text-xs text-muted-foreground">{changed} {entity} akan diperbarui. {targets.length - changed} {entity} dengan status yang sama dilewati.</p></div>}<DialogFooter><Button variant="outline" disabled={busy} onClick={onClose}>Batal</Button><Button variant={kind === "delete" ? "destructive" : "default"} disabled={busy || invalid} onClick={onConfirm}>{busy && <Loader2 className="animate-spin" />}{busy ? "Memproses..." : kind === "delete" ? `Ya, hapus ${targets.length} ${entity}` : "Simpan status"}</Button></DialogFooter></DialogContent></Dialog>
}
