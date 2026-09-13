import { useMasterMutation } from "./use-master-mutation"
import { buildMasterPayload } from "./master-validation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { masterApi, masterError, type MasterModule, type MasterField, type MasterOption } from "./master-api"

export function MasterEditForm({ module, id, title, description, fields, onClose, onSaved }: { module: MasterModule; id: string | number; title: string; description?: string; fields: MasterField[]; onClose: () => void; onSaved: () => void }) {
  const [loaded, setLoaded] = useState<{ values: Record<string, string>; options: Record<string, MasterOption[]> } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { saving, pending, error: saveError, run } = useMasterMutation()
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const [record, pairs] = await Promise.all([
          masterApi.detail(module, id, controller.signal),
          Promise.all(fields.filter((field) => field.options).map(async (field) => [field.key, await masterApi.options(field.options!, controller.signal)] as const)),
        ])
        if (!controller.signal.aborted) setLoaded({ values: Object.fromEntries(fields.map((field) => [field.key, record[field.key] == null ? "" : String(record[field.key])])), options: Object.fromEntries(pairs) })
      } catch (error) { if (!controller.signal.aborted) setLoadError(masterError(error)) }
    }
    void load()
    return () => controller.abort()
  }, [module, id, fields, attempt])
  const submit = async () => {
    if (!loaded || pending.current) return
    const { errors: validation, payload } = buildMasterPayload(fields, loaded.values)
    setErrors(validation)
    if (Object.keys(validation).length) return
    if (!await run(() => masterApi.update(module, id, payload))) return
    onSaved()
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !pending.current) onClose() }}><DialogContent showCloseButton={!saving} className="max-h-[85vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Edit {title}</DialogTitle><DialogDescription>{description ?? `Perbarui data ${title.toLowerCase()} lalu simpan perubahan.`}</DialogDescription></DialogHeader>
    {!loaded ? loadError ? <div role="alert" className="space-y-3"><p className="text-sm text-destructive">{loadError}</p><Button onClick={() => { setLoadError(null); setAttempt((value) => value + 1) }}>Coba Lagi</Button></div> : <div role="status" aria-label="Memuat data" className="space-y-4 py-3">{[1, 2, 3].map((item) => <div key={item} className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-9 w-full" /></div>)}</div> : <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void submit() }}><FieldGroup>{fields.map((field) => {
      const choices = field.choices ?? (field.options ? loaded.options[field.key].map((option) => [String(option.id), option.name]) : field.type === "boolean" ? [["true", "Aktif"], ["false", "Tidak Aktif"]] : field.type === "semester" ? [["GANJIL", "Ganjil"], ["GENAP", "Genap"]] : null)
      const update = (value: string) => setLoaded({ ...loaded, values: { ...loaded.values, [field.key]: value } })
      return <Field key={field.key} data-invalid={!!errors[field.key]}><FieldLabel htmlFor={`edit-${field.key}`}>{field.label}</FieldLabel>{choices ? <select id={`edit-${field.key}`} disabled={saving} value={loaded.values[field.key]} onChange={(event) => update(event.target.value)} aria-invalid={!!errors[field.key]} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="" disabled>Pilih {field.label}</option>{!choices.some(([value]) => value === loaded.values[field.key]) && loaded.values[field.key] && <option value={loaded.values[field.key]}>Pilihan saat ini (ID {loaded.values[field.key]})</option>}{choices.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : <Input id={`edit-${field.key}`} disabled={saving} value={loaded.values[field.key]} onChange={(event) => update(event.target.value)} type={field.type === "number" ? "number" : field.type === "time" ? "time" : "text"} min={field.min} max={field.max} aria-invalid={!!errors[field.key]} />}<FieldError>{errors[field.key]}</FieldError></Field>
    })}</FieldGroup>{saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}<DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Batal</Button><Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Perubahan"}</Button></DialogFooter></form>}
  </DialogContent></Dialog>
}
