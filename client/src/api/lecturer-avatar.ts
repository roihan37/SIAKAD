import { api } from "./axios"

/** Upload cropped pixels using the lecturer's edit URL; return the key for PATCH. */
export async function uploadLecturerAvatar(id: string, photo: string): Promise<string> {
  if (!/^data:image\/(png|jpeg|webp);base64,/.test(photo)) throw new Error("Format foto hasil crop tidak valid.")
  const imageResponse = await fetch(photo)
  if (!imageResponse.ok) throw new Error("Gagal memproses foto hasil crop.")
  const blob = await imageResponse.blob()
  if (!blob.size || blob.size > 1024 * 1024) throw new Error("Foto hasil crop harus berukuran maksimal 1 MB.")
  const { data } = await api.post<{ uploadUrl: string; key: string }>(`/avatars/lecturers/${encodeURIComponent(id)}/upload-url`, { contentType: blob.type })
  const upload = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": blob.type }, body: blob })
  if (!upload.ok) throw new Error("Foto gagal diunggah. Silakan coba lagi.")
  return data.key
}
