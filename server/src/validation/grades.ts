export function gradeId(value: unknown, label: string): number {
  if (typeof value !== 'string' || !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1 || Number(value) > 2147483647)
    throw { name: 'BadRequest', message: `${label} must be a positive integer.` };
  return Number(value);
}
export function gradeUserId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 100) throw { name: 'BadRequest', message: 'studentId must be a valid user ID.' };
  return value.trim();
}
export function gradeFilters(query: Record<string, unknown>) {
  const academicYearId = gradeId(query.academicYearId, 'academicYearId');
  const optionalId = (key: string) => query[key] === undefined ? undefined : gradeId(query[key], key);
  const status = query.status;
  if (status !== undefined && status !== 'BELUM_DIINPUT' && status !== 'BELUM_LENGKAP' && status !== 'FINAL') throw { name: 'BadRequest', message: 'Invalid grade status.' };
  if (query.lecturerId !== undefined && (typeof query.lecturerId !== 'string' || !query.lecturerId.trim() || query.lecturerId.length > 100)) throw { name: 'BadRequest', message: 'lecturerId must be a lecturer profile ID.' };
  if (query.search !== undefined && (typeof query.search !== 'string' || query.search.length > 200)) throw { name: 'BadRequest', message: 'search must be a string of at most 200 characters.' };
  const sortBy = query.sortBy ?? 'nim';
  if (sortBy !== 'nim' && sortBy !== 'name' && sortBy !== 'finalScore' && sortBy !== 'grade' && sortBy !== 'status') throw { name: 'BadRequest', message: 'Invalid sortBy. Use nim, name, finalScore, grade, or status.' };
  const sortOrder = query.sortOrder ?? 'asc';
  if (sortOrder !== 'asc' && sortOrder !== 'desc') throw { name: 'BadRequest', message: 'sortOrder must be asc or desc.' };
  const page = query.page === undefined ? 1 : gradeId(query.page, 'page');
  const limit = query.limit === undefined ? 10 : gradeId(query.limit, 'limit');
  if (limit > 100 || page > 1000000) throw { name: 'BadRequest', message: 'limit must not exceed 100 and page must not exceed 1000000.' };
  return { academicYearId, studyProgramId: optionalId('studyProgramId'), classId: optionalId('classId'), courseId: optionalId('courseId'), lecturerId: (query.lecturerId as string | undefined)?.trim(), status, search: (query.search as string | undefined)?.trim(), page, limit, sortBy, sortOrder } as const;
}
export type GradeFilters = ReturnType<typeof gradeFilters>;
