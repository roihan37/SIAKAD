import { MasterEditForm } from "@/components/master-data/MasterEditForm"
import type { MasterField } from "@/components/master-data/master-api"
import type { Kurikulum } from "@/types/campus"
const fields: MasterField[] = [{ key: "kode", label: "Kode" }, { key: "nama", label: "Nama" }, { key: "prodiId", label: "Program Studi", options: "prodi" }, { key: "tahun", label: "Tahun", type: "number", min: 1900, max: 9999 }, { key: "isActive", label: "Status", type: "boolean" }]
export function KurikulumEditDialog({ row, onClose, onSave }: { row: Kurikulum; onClose: () => void; onSave: () => void }) {
  if (row.id == null) return <p role="alert">ID data tidak tersedia</p>
  return <MasterEditForm key={String(row.id)} module="kurikulum" id={row.id} title="Kurikulum" fields={fields} onClose={onClose} onSaved={onSave} />
}
