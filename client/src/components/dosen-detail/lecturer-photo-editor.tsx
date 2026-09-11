import { useRef, useState, type ChangeEvent } from "react"
import { Camera, RotateCcw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageCrop, ImageCropApply, ImageCropContent, ImageCropReset } from "@/components/kibo-ui/image-crop"

interface LecturerPhotoEditorProps {
  name: string
  avatarUrl: string | null
  preview: string | null
  disabled: boolean
  onChange: (photo: string | null) => void
}

export function LecturerPhotoEditor({ name, avatarUrl, preview, disabled, onChange }: LecturerPhotoEditorProps) {
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const initials = name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()
  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    event.target.value = ""
    if (!selected) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size > 1024 * 1024) {
      setError("Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 1 MB.")
      return
    }
    setError("")
    setFile(selected)
  }
  return <div className="flex w-full flex-col items-center gap-3">
    <Avatar className="size-24"><AvatarImage src={preview ?? avatarUrl ?? undefined} alt={preview ? `Pratinjau foto ${name}` : `Foto ${name}`} /><AvatarFallback className="bg-primary/10 text-2xl text-primary">{initials}</AvatarFallback></Avatar>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Pilih foto dosen" className="sr-only" disabled={disabled} onChange={selectPhoto} />
    <p className="text-xs text-muted-foreground">JPG, PNG, atau WebP. Maksimal 1 MB.</p>
    <div className="flex flex-wrap justify-center gap-2"><Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => input.current?.click()}><Camera /> Ubah Foto</Button>{preview && <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => { onChange(null); setError("") }}><RotateCcw /> Batalkan Foto</Button>}</div>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    {preview && <p role="status" className="text-xs text-muted-foreground">Foto baru siap. Klik Simpan Perubahan untuk mengunggah.</p>}
    <Dialog open={file !== null} onOpenChange={(open) => { if (!open) setFile(null) }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Atur Foto Dosen</DialogTitle><DialogDescription>Geser area crop agar wajah berada di tengah. Foto akan disimpan dalam rasio 1:1.</DialogDescription></DialogHeader>
        {file && <ImageCrop key={`${file.name}-${file.lastModified}`} file={file} aspect={1} maxImageSize={1024 * 1024} maxOutputSize={512} onCrop={(photo) => { onChange(photo); setFile(null) }}>
          <ImageCropContent className="mx-auto max-h-[50dvh] w-full [&>img]:max-h-[50dvh] [&>img]:object-contain" />
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFile(null)}>Batal</Button>
            <ImageCropReset asChild><Button type="button" variant="outline">Reset Crop</Button></ImageCropReset>
            <ImageCropApply asChild><Button type="button">Terapkan Foto</Button></ImageCropApply>
          </div>
        </ImageCrop>}
      </DialogContent>
    </Dialog>
  </div>
}
