export const thesisMilestones = [
  "Pengajuan Judul",
  "Proposal",
  "Seminar Proposal",
  "Bimbingan",
  "Seminar Hasil",
  "Sidang",
  "Revisi",
  "Selesai",
] as const

export type ThesisMilestone = (typeof thesisMilestones)[number]
export type ThesisScenarioId = "not-started" | "awaiting-review" | "needs-revision" | "completed"
export type GuidanceStatus = "Disetujui" | "Perlu Revisi" | "Menunggu Review"
export type DocumentStatus = "Disetujui" | "Perlu Revisi" | "Menunggu Review"

export type GuidanceEntry = {
  id: string
  date: string
  topic: string
  supervisor: string
  note: string
  status: GuidanceStatus
}

export type ThesisDocument = {
  id: string
  name: string
  type: string
  date: string
  status: DocumentStatus
  size: string
}

export type ThesisExam = {
  id: string
  type: "Seminar Hasil" | "Sidang Skripsi"
  date: string
  time: string
  room: string
  examiners: string[]
  status: "Terjadwal" | "Selesai"
}

export type ThesisScenario = {
  id: ThesisScenarioId
  label: string
  status: string
  title: string | null
  currentMilestone: ThesisMilestone | null
  submittedAt: string | null
  nextAction: {
    eyebrow: string
    title: string
    description: string
    deadline?: string
    actionLabel: string
  }
}

const thesisTitle = "Prediksi Risiko Akademik Mahasiswa Menggunakan Machine Learning"

export const thesisScenarios: Record<ThesisScenarioId, ThesisScenario> = {
  "not-started": {
    id: "not-started",
    label: "Belum memiliki skripsi",
    status: "Belum Memiliki Skripsi",
    title: null,
    currentMilestone: null,
    submittedAt: null,
    nextAction: {
      eyebrow: "Langkah pertama",
      title: "Mulai pengajuan judul skripsi",
      description: "Siapkan topik, calon judul, dan ringkasan masalah untuk diajukan ke program studi.",
      actionLabel: "Mulai Pengajuan",
    },
  },
  "awaiting-review": {
    id: "awaiting-review",
    label: "Menunggu review",
    status: "Menunggu Review",
    title: thesisTitle,
    currentMilestone: "Pengajuan Judul",
    submittedAt: "14 Februari 2026",
    nextAction: {
      eyebrow: "Sedang diproses",
      title: "Tunggu hasil review judul",
      description: "Program studi sedang meninjau kelayakan judul dan calon pembimbing. Kamu akan mendapat notifikasi saat ada pembaruan.",
      actionLabel: "Lihat Pengajuan",
    },
  },
  "needs-revision": {
    id: "needs-revision",
    label: "Perlu revisi",
    status: "Perlu Revisi",
    title: thesisTitle,
    currentMilestone: "Revisi",
    submittedAt: "14 Februari 2026",
    nextAction: {
      eyebrow: "Prioritas berikutnya",
      title: "Unggah revisi pascasidang",
      description: "Perbaiki pembahasan Bab V dan konsistensi sitasi sesuai catatan penguji sebelum meminta persetujuan final.",
      deadline: "13 Oktober 2026",
      actionLabel: "Upload Revisi",
    },
  },
  completed: {
    id: "completed",
    label: "Skripsi selesai",
    status: "Skripsi Selesai",
    title: thesisTitle,
    currentMilestone: "Selesai",
    submittedAt: "14 Februari 2026",
    nextAction: {
      eyebrow: "Semua tahap selesai",
      title: "Arsip skripsimu sudah lengkap",
      description: "Naskah final dan lembar pengesahan telah disetujui. Tidak ada tindakan akademik yang tertunda.",
      actionLabel: "Lihat Dokumen Final",
    },
  },
}

export const thesisProfile = {
  student: "Ahmad Fauzan",
  studyProgram: "S1 Teknik Informatika",
  supervisors: [
    { role: "Pembimbing 1", name: "Dr. Rina Kurniawati, S.Kom., M.T.", initials: "RK" },
    { role: "Pembimbing 2", name: "Muhammad Farhan, S.T., M.Kom.", initials: "MF" },
  ],
}

export const guidanceHistory: GuidanceEntry[] = [
  {
    id: "guidance-4",
    date: "7 Oktober 2026",
    topic: "Revisi pascasidang · Bab V",
    supervisor: "Dr. Rina Kurniawati, S.Kom., M.T.",
    note: "Perjelas hubungan hasil evaluasi model dengan implikasi akademik dan samakan format sitasi pada subbab 5.2.",
    status: "Perlu Revisi",
  },
  {
    id: "guidance-3",
    date: "18 September 2026",
    topic: "Bab IV · Hasil pengujian",
    supervisor: "Muhammad Farhan, S.T., M.Kom.",
    note: "Hasil pengujian sudah konsisten. Tambahkan satu paragraf tentang keterbatasan dataset.",
    status: "Disetujui",
  },
  {
    id: "guidance-2",
    date: "4 September 2026",
    topic: "Bab III · Metodologi",
    supervisor: "Dr. Rina Kurniawati, S.Kom., M.T.",
    note: "Diagram alur penelitian sudah diperbaiki. Mohon unggah versi dengan penomoran tabel terbaru.",
    status: "Disetujui",
  },
  {
    id: "guidance-1",
    date: "21 Agustus 2026",
    topic: "Rancangan evaluasi model",
    supervisor: "Muhammad Farhan, S.T., M.Kom.",
    note: "Gunakan stratified cross-validation dan jelaskan alasan pemilihan metrik recall.",
    status: "Disetujui",
  },
]

export const thesisDocuments: ThesisDocument[] = [
  { id: "doc-1", name: "Proposal Skripsi", type: "Proposal", date: "2 April 2026", status: "Disetujui", size: "1,8 MB" },
  { id: "doc-2", name: "Naskah Skripsi v4", type: "Naskah", date: "7 Oktober 2026", status: "Perlu Revisi", size: "4,2 MB" },
  { id: "doc-3", name: "Laporan Hasil Turnitin", type: "Pendukung", date: "29 September 2026", status: "Disetujui", size: "760 KB" },
  { id: "doc-4", name: "Lembar Persetujuan Pembimbing", type: "Administrasi", date: "20 September 2026", status: "Disetujui", size: "420 KB" },
]

export const thesisExams: ThesisExam[] = [
  {
    id: "exam-1",
    type: "Seminar Hasil",
    date: "25 September 2026",
    time: "09.00–10.30 WIB",
    room: "Ruang Sidang TI-2",
    examiners: ["Dr. Maya Putri, M.Kom.", "Rizky Pratama, S.T., M.Cs."],
    status: "Selesai",
  },
  {
    id: "exam-2",
    type: "Sidang Skripsi",
    date: "3 Oktober 2026",
    time: "13.00–15.00 WIB",
    room: "Ruang Sidang Utama",
    examiners: ["Prof. Dr. Budi Santoso, M.Kom.", "Dr. Maya Putri, M.Kom.", "Rizky Pratama, S.T., M.Cs."],
    status: "Selesai",
  },
]
