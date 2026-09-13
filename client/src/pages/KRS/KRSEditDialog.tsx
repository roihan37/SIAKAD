import { MasterEditForm } from "@/components/master-data/MasterEditForm"
import type { MasterField } from "@/components/master-data/master-api"
import type { KRS } from "@/types/campus"

const fields: MasterField[] = [
  { key: "tahunAkademikId", label: "Tahun Akademik", options: "tahun-akademik" },
]

export function KRSEditDialog({ row, onClose, onSaved }: { row: KRS; onClose: () => void; onSaved: () => void }) {
  if (!row.krsId) return null
  return <MasterEditForm module="krs" id={row.krsId} title={`KRS ${row.nama}`} description="Ubah tahun akademik untuk mahasiswa ini. Hanya KRS draft tanpa detail mata kuliah yang dapat dipindahkan. Status KRS mengikuti alur persetujuan." fields={fields} onClose={onClose} onSaved={onSaved} />
}
