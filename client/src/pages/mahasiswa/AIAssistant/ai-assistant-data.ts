export type AssistantTopic = "schedule" | "krs" | "grade" | "attendance" | "tuition" | "announcement"

export type ConversationMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  topic?: AssistantTopic
  createdAt: string
}

export const studentAssistantProfile = {
  name: "Rizky Pratama",
  firstName: "Rizky",
  program: "Informatika",
  semester: 7,
}

export const quickPrompts: Array<{ label: string; prompt: string; topic: AssistantTopic }> = [
  { label: "Jadwal hari ini", prompt: "Apa jadwal kuliah saya hari ini?", topic: "schedule" },
  { label: "Status KRS", prompt: "Bagaimana status KRS saya?", topic: "krs" },
  { label: "IPK & nilai", prompt: "Tampilkan ringkasan IPK dan nilai saya.", topic: "grade" },
  { label: "Presensi", prompt: "Bagaimana ringkasan presensi saya?", topic: "attendance" },
  { label: "UKT", prompt: "Apakah UKT saya sudah lunas?", topic: "tuition" },
  { label: "Pengumuman", prompt: "Ada pengumuman kampus terbaru?", topic: "announcement" },
]

export const assistantReplies: Record<AssistantTopic, string> = {
  schedule: "Hari ini ada 3 kelas. Kelas terdekat dimulai pukul 10.00 WIB di Lab Komputasi 2.",
  krs: "KRS semester ini sudah disetujui oleh dosen wali dengan total 21 SKS.",
  grade: "IPK kamu saat ini 3,72. Performa akademik stabil, dengan 92 SKS telah ditempuh.",
  attendance: "Kehadiran semester ini 94%. Tidak ada mata kuliah yang mendekati batas minimum presensi.",
  tuition: "UKT Semester Ganjil 2026/2027 sudah lunas. Pembayaran diverifikasi pada 12 Agustus 2026.",
  announcement: "Ada 2 pengumuman baru yang relevan: pendaftaran seminar proposal dan jadwal pemeliharaan portal akademik.",
}

export const conversationHistory = [
  { id: "history-1", title: "Jadwal kuliah hari ini", preview: "Ada 3 kelas hari ini...", date: "Hari ini, 08.12", topic: "schedule" as const },
  { id: "history-2", title: "Status KRS semester", preview: "KRS sudah disetujui...", date: "Kemarin, 19.40", topic: "krs" as const },
  { id: "history-3", title: "Ringkasan IPK", preview: "IPK kamu saat ini 3,72...", date: "2 hari lalu", topic: "grade" as const },
]

export const topicPrompts: Record<AssistantTopic, string> = Object.fromEntries(
  quickPrompts.map((item) => [item.topic, item.prompt]),
) as Record<AssistantTopic, string>

export function inferTopic(value: string): AssistantTopic | null {
  const text = value.toLocaleLowerCase("id-ID")
  if (text.includes("krs") || text.includes("sks")) return "krs"
  if (text.includes("nilai") || text.includes("ipk") || text.includes("khs")) return "grade"
  if (text.includes("presensi") || text.includes("hadir")) return "attendance"
  if (text.includes("ukt") || text.includes("bayar") || text.includes("tagihan")) return "tuition"
  if (text.includes("pengumuman") || text.includes("informasi")) return "announcement"
  if (text.includes("jadwal") || text.includes("kuliah") || text.includes("kelas")) return "schedule"
  return null
}
