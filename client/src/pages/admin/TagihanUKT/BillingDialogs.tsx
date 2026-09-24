import { useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AcademicFilterSelect } from "@/components/academic/AcademicFilterSelect"
import type { BillOptions, GenerateBills } from "@/types/tuition"

export function BillingDialog({ options, yearId, programId, loading, error, onClose, onSave }: {
  options: BillOptions; yearId?: number; programId?: number; loading: boolean; error: string | null
  onClose: () => void; onSave: (payload: GenerateBills) => Promise<void>
}) {
  const [year, setYear] = useState(yearId === undefined ? undefined : String(yearId))
  const [program, setProgram] = useState(programId === undefined ? undefined : String(programId))
  const [angkatan, setAngkatan] = useState("")
  const [amount, setAmount] = useState("")
  const [due, setDue] = useState("")
  const [validation, setValidation] = useState("")
  const submitting = useRef(false)
  async function submit() {
    if (submitting.current || loading) return
    if (!year || !program) { setValidation("Pilih tahun akademik dan program studi."); return }
    if (!/^\d{4}$/.test(angkatan) || Number(angkatan) < 1900) { setValidation("Angkatan harus antara 1900 dan 9999."); return }
    if (!/^\d{1,13}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) { setValidation("Masukkan nominal positif, maksimal 13 digit dan 2 angka desimal."); return }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || Number.isNaN(Date.parse(due))) { setValidation("Pilih tanggal jatuh tempo yang valid."); return }
    setValidation(""); submitting.current = true
    try { await onSave({ tahunAkademikId: Number(year), prodiId: Number(program), angkatan: Number(angkatan), nominal: amount, jatuhTempo: due }) }
    finally { submitting.current = false }
  }
  return <Dialog open onOpenChange={open => { if (!open && !loading && !submitting.current) onClose() }}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>Generate Tagihan</DialogTitle><DialogDescription>Buat tagihan UKT untuk mahasiswa aktif sesuai program studi dan angkatan.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={event => { event.preventDefault(); void submit() }}>
        <fieldset disabled={loading} className="space-y-4">
          <AcademicFilterSelect label="Tahun Akademik" required value={year} options={options.years} onChange={setYear} disabled={loading} />
          <AcademicFilterSelect label="Prodi" required value={program} options={options.programs} onChange={setProgram} disabled={loading} />
          <div className="space-y-2"><label htmlFor="billing-cohort" className="text-sm font-medium">Angkatan</label><Input id="billing-cohort" type="number" min={1900} max={9999} required value={angkatan} onChange={event => setAngkatan(event.target.value)} /></div>
          <div className="space-y-2"><label htmlFor="billing-amount" className="text-sm font-medium">Nominal (Rp)</label><Input id="billing-amount" type="number" min="0.01" step="0.01" required value={amount} onChange={event => setAmount(event.target.value)} /></div>
          <div className="space-y-2"><label htmlFor="billing-due" className="text-sm font-medium">Jatuh Tempo</label><Input id="billing-due" type="date" required value={due} onChange={event => setDue(event.target.value)} /></div>
        </fieldset>
        <p className="rounded-lg bg-primary/5 p-3 text-sm">Jumlah tagihan akan dihitung oleh server. Mahasiswa yang sudah memiliki tagihan pada tahun akademik ini otomatis dilewati.</p>
        {(validation || error) && <p role="alert" className="text-sm text-destructive">{validation || error}</p>}
        <DialogFooter><Button type="button" variant="outline" disabled={loading} onClick={onClose}>Batal</Button><Button type="submit" disabled={loading}>{loading && <Loader2 className="animate-spin" />}{loading ? "Memproses..." : "Generate Tagihan"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}
