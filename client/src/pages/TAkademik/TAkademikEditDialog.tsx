import { MasterEditForm } from "@/components/master-data/MasterEditForm"
import type { MasterField } from "@/components/master-data/master-api"
import type { TahunAkademik } from "@/types/campus"
const fields: MasterField[] = [{ key: "tahun", label: "Tahun Akademik", type: "yearRange" }, { key: "semester", label: "Semester", type: "semester" }, { key: "isActive", label: "Status", type: "boolean" }]
export function TAkademikEditDialog({ row, onClose, onSave }: { row: TahunAkademik; onClose: () => void; onSave: () => void }) {
  if (row.id == null) return <p role="alert">ID data tidak tersedia</p>
  return <MasterEditForm key={String(row.id)} module="tahun-akademik" id={row.id} title="Tahun Akademik" fields={fields} onClose={onClose} onSaved={onSave} />
}
