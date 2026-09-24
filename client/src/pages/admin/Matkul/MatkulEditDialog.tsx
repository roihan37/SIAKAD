import { MasterEditForm } from "@/components/master-data/MasterEditForm"
import type { MasterField } from "@/components/master-data/master-api"
import type { MataKuliah } from "@/types/campus"
const fields: MasterField[] = [{ key: "kode", label: "Kode" }, { key: "nama", label: "Nama" }, { key: "sks", label: "SKS", type: "number", min: 1 }]
export function MatkulEditDialog({ row, onClose, onSave }: { row: MataKuliah; onClose: () => void; onSave: () => void }) {
  if (row.id == null) return <p role="alert">ID data tidak tersedia</p>
  return <MasterEditForm key={String(row.id)} module="mata-kuliah" id={row.id} title="Mata Kuliah" fields={fields} onClose={onClose} onSaved={onSave} />
}
