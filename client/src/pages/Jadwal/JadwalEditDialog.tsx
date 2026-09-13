import { MasterEditForm } from "@/components/master-data/MasterEditForm"
import type { MasterField } from "@/components/master-data/master-api"
import type { Jadwal } from "@/types/campus"

const fields: MasterField[] = [
  { key: "hari", label: "Hari", choices: ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"].map((day) => [day, day.charAt(0) + day.slice(1).toLowerCase()]) },
  { key: "jamMulai", label: "Jam Mulai", type: "time" },
  { key: "jamSelesai", label: "Jam Selesai", type: "time" },
  { key: "ruanganId", label: "Ruangan", options: "ruangan" },
]

export function JadwalEditDialog({ row, onClose, onSaved }: { row: Jadwal; onClose: () => void; onSaved: () => void }) {
  if (row.id == null) return null
  return <MasterEditForm module="jadwal" id={row.id} title={`Jadwal ${row.mataKuliah}`} description="Sesuaikan waktu dan ruangan untuk kelas ini. Server akan memeriksa bentrok ruangan, dosen, dan kelas saat disimpan." fields={fields} onClose={onClose} onSaved={onSaved} />
}
