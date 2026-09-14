import { useEffect, useRef, useState } from "react"
import { CalendarPlus, Clock3, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { createJadwal, getAllJadwal } from "@/features/action/jadwalThunk"
import { masterError } from "@/components/master-data/master-api"
import { loadJadwalOptions } from "./jadwal-options"

export function JadwalFormDialog() {
  const [open, setOpen] = useState(false)
  const saving = useAppSelector((state) => state.jadwal.isCreatingJadwal)
  return <Dialog open={open} onOpenChange={(value) => { if (!saving) setOpen(value) }}><DialogTrigger render={<Button variant="outline"><Plus />Tambah Jadwal</Button>} /><DialogContent showCloseButton={!saving} className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarPlus className="size-5 text-primary" />Tambah Jadwal Kuliah</DialogTitle><DialogDescription>Tentukan kelas, waktu perkuliahan, dan ruangan yang digunakan.</DialogDescription></DialogHeader>{open && <JadwalForm onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />}</DialogContent></Dialog>
}
function JadwalForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const dispatch = useAppDispatch()
  const table = useAppSelector((state) => state.jadwal)
  const [options, setOptions] = useState<Awaited<ReturnType<typeof loadJadwalOptions>> | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [year, setYear] = useState(String(table.tahunAkademikId ?? ""))
  const [assignment, setAssignment] = useState("")
  const [room, setRoom] = useState("")
  const [day, setDay] = useState("SENIN")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const lock = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    void loadJadwalOptions(controller.signal).then((data) => { if (!controller.signal.aborted) setOptions(data) }).catch((cause: unknown) => { if (!controller.signal.aborted) setLoadError(masterError(cause)) })
    return () => controller.abort()
  }, [retry])
  const available = options?.assignments.filter((row) => row.yearId === Number(year)) ?? []
  const selected = available.find((row) => row.id === Number(assignment))
  const submit = async () => {
    if (lock.current || !options) return
    if (!selected || !options.rooms.some((row) => row.id === Number(room))) { setError("Pilih tahun akademik, kelas mata kuliah, dan ruangan yang valid."); return }
    if (!start || !end || start >= end) { setError("Jam selesai harus setelah jam mulai."); return }
    lock.current = true; setError(null)
    try {
      await dispatch(createJadwal({ kelasMataKuliahId: selected.id, tahunAkademikId: Number(year), ruanganId: Number(room), hari: day, jamMulai: start, jamSelesai: end })).unwrap()
      onSuccess()
      void dispatch(getAllJadwal({ page: table.page, limit: 10, search: table.search, sortBy: table.sortBy, sortOrder: table.sortOrder, prodiId: table.prodiId, tahunAkademikId: table.tahunAkademikId })).unwrap().catch(() => toast.error("Jadwal tersimpan, tetapi tabel gagal dimuat ulang."))
    } catch (cause) { setError(typeof cause === "string" ? cause : "Gagal menyimpan jadwal.") }
    finally { lock.current = false }
  }
  if (!options) return loadError ? <div role="alert" className="space-y-3"><p className="text-sm text-destructive">{loadError}</p><Button onClick={() => { setLoadError(null); setRetry(retry + 1) }}>Coba Lagi</Button></div> : <div role="status" aria-label="Memuat pilihan jadwal" className="space-y-4">{[1, 2, 3].map((id) => <Skeleton key={id} className="h-16" />)}</div>
  const selectClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-ring"
  return <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void submit() }}><fieldset disabled={table.isCreatingJadwal} className="space-y-4">
    <div className="space-y-2"><label htmlFor="jadwal-year" className="text-sm font-medium">Tahun Akademik</label><select id="jadwal-year" required className={selectClass} value={year} onChange={(event) => { setYear(event.target.value); setAssignment("") }}><option value="" disabled>Pilih tahun akademik</option>{options.years.map((row) => <option key={row.id} value={row.id}>{row.tahun} - {row.semester}</option>)}</select></div>
    <div className="space-y-2"><label htmlFor="jadwal-assignment" className="text-sm font-medium">Kelas & Mata Kuliah</label><select id="jadwal-assignment" required disabled={!year} className={selectClass} value={assignment} onChange={(event) => setAssignment(event.target.value)}><option value="" disabled>Pilih kelas dan mata kuliah</option>{available.map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}</select><p className="text-xs text-muted-foreground">{selected ? `Dosen pengampu: ${selected.lecturer}` : year && !available.length ? "Belum ada penugasan mata kuliah pada tahun ini. Siapkan kelas dan dosen pengampu terlebih dahulu." : "Dosen mengikuti penugasan kelas mata kuliah."}</p></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label htmlFor="jadwal-day" className="text-sm font-medium">Hari</label><select id="jadwal-day" className={selectClass} value={day} onChange={(event) => setDay(event.target.value)}>{["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"].map((value) => <option key={value} value={value}>{value.charAt(0) + value.slice(1).toLowerCase()}</option>)}</select></div><div className="space-y-2"><label htmlFor="jadwal-room" className="text-sm font-medium">Ruangan</label><select id="jadwal-room" required className={selectClass} value={room} onChange={(event) => setRoom(event.target.value)}><option value="" disabled>Pilih ruangan</option>{options.rooms.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label htmlFor="jadwal-start" className="text-sm font-medium">Jam Mulai</label><Input id="jadwal-start" type="time" required value={start} onChange={(event) => setStart(event.target.value)} /></div><div className="space-y-2"><label htmlFor="jadwal-end" className="text-sm font-medium">Jam Selesai</label><Input id="jadwal-end" type="time" required value={end} onChange={(event) => setEnd(event.target.value)} /></div></div>
    <p className="flex gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground"><Clock3 className="size-4 shrink-0" />Pastikan waktu dan ruangan sesuai dengan rencana perkuliahan.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </fieldset><DialogFooter><Button type="button" variant="outline" disabled={table.isCreatingJadwal} onClick={onCancel}>Batal</Button><Button type="submit" disabled={table.isCreatingJadwal || !available.length}>{table.isCreatingJadwal ? <Loader2 className="animate-spin" /> : <Plus />}{table.isCreatingJadwal ? "Menyimpan..." : "Simpan Jadwal"}</Button></DialogFooter></form>
}
