import { Prisma } from "@prisma/client";

// Skala demo 0–4; sesuaikan dengan peraturan akademik kampus.
const gradeSamples = [
  { score: 88, letter: "A", weight: 4 },
  { score: 77, letter: "B", weight: 3 },
  { score: 84, letter: "A", weight: 4 },
  { score: 68, letter: "C", weight: 2 },
  { score: 74, letter: "B", weight: 3 },
  { score: 91, letter: "A", weight: 4 },
];

export function seedGrade(studentIndex: number, courseIndex: number, periodIndex: number) {
  return gradeSamples[(studentIndex + courseIndex + periodIndex) % gradeSamples.length];
}

// Demo weighting: assignment 30%, midterm 30%, final exam 40%.
// Offsets preserve the existing transcript score exactly.
export async function seedAssessment(tx: Prisma.TransactionClient, detailId: string, studentIndex: number, courseIndex: number, periodIndex: number) {
  const sample = seedGrade(studentIndex, courseIndex, periodIndex);
  const complete = periodIndex === 0 || courseIndex < 3;
  const data = {
    tugas: sample.score + 4,
    uts: sample.score - 4,
    uas: complete ? sample.score : null,
    nilaiAkhir: complete ? sample.score : null,
    grade: complete ? sample.letter : null,
    bobot: complete ? sample.weight : null,
    status: complete ? "FINAL" as const : "BELUM_LENGKAP" as const,
    finalizedAt: complete ? new Date(periodIndex === 0 ? "2026-06-26T09:00:00+07:00" : "2026-09-14T09:00:00+07:00") : null,
  };
  await tx.nilai.upsert({ where: { krsDetailId: detailId }, update: data, create: { krsDetailId: detailId, ...data } });
}
