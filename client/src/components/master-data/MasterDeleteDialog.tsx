import { useMasterMutation } from "./use-master-mutation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { masterApi, type MasterModule } from "./master-api"
export function MasterDeleteDialog({ module, id, name, onClose, onDeleted }: { module: MasterModule; id: string | number; name?: string; onClose: () => void; onDeleted: () => void }) {
  const { saving, pending, error, run } = useMasterMutation()
  const remove = async () => {
    if (await run(() => masterApi.remove(module, id))) onDeleted()
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !pending.current) onClose() }}><DialogContent showCloseButton={!saving}><DialogHeader><DialogTitle>Hapus data?</DialogTitle><DialogDescription>{name ?? `Data ${module} dengan ID ${id}`} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.{module === "krs" && " Hanya KRS draft tanpa detail mata kuliah yang dapat dihapus."}</DialogDescription></DialogHeader>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<DialogFooter><Button variant="outline" disabled={saving} onClick={onClose}>Batal</Button><Button variant="destructive" disabled={saving} onClick={() => void remove()}>{saving ? "Menghapus..." : "Hapus"}</Button></DialogFooter></DialogContent></Dialog>
}
