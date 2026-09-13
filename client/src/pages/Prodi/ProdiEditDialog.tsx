import { MasterEditForm } from "@/components/master-data/MasterEditForm"
import type { MasterField } from "@/components/master-data/master-api"
import type { ProgramStudi } from "@/types/campus"
const fields: MasterField[] = [{ key: "kode", label: "Kode" }, { key: "name", label: "Nama" }, { key: "fakultasId", label: "Fakultas", options: "fakultas" }]
export function ProdiEditDialog({ row, onClose, onSave }: { row: ProgramStudi; onClose: () => void; onSave: () => void }) {
  if (row.id == null) return <p role="alert">ID data tidak tersedia</p>
  return <MasterEditForm key={String(row.id)} module="prodi" id={row.id} title="Program Studi" fields={fields} onClose={onClose} onSaved={onSave} />
}
