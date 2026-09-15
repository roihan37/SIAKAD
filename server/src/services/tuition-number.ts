import { Semester } from "@prisma/client";

export function tuitionBillNumber(year: string, semester: Semester, nim: string): string {
  const match = /^(\d{4})\/(\d{4})$/.exec(year);
  if (!match || Number(match[2]) !== Number(match[1]) + 1) {
    throw { name: "BadRequest", message: "Academic year must use consecutive years in YYYY/YYYY format." };
  }
  return `UKT-${match[1]}${match[2]}-${semester === Semester.GANJIL ? "01" : "02"}-${nim}`;
}
