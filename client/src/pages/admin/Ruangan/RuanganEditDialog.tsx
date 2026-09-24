import { MasterEditForm } from "@/components/master-data/MasterEditForm"
import type { MasterField } from "@/components/master-data/master-api"
import type { Ruangan } from "@/types/campus"
const fields: MasterField[] = [{ key: "kode", label: "Kode" }, { key: "nama", label: "Nama" }, { key: "kapasitas", label: "Kapasitas", type: "number", min: 1 }, { key: "gedung", label: "Gedung", optional: true }]
export function RuanganEditDialog({ row, onClose, onSave }: { row: Ruangan; onClose: () => void; onSave: () => void }) {
  if (row.id == null) return <p role="alert">ID data tidak tersedia</p>
  return <MasterEditForm key={String(row.id)} module="ruangan" id={row.id} title="Ruangan" fields={fields} onClose={onClose} onSaved={onSave} />
}
