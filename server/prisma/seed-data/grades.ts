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
