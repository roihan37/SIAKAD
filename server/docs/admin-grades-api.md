# Admin grades API

All routes use `/api/v1/admin/grades` and require authentication and the existing admin middleware.

| Method | Path | Controller method |
| --- | --- | --- |
| GET | `/summary` | `getGradeSummary` |
| GET | `/students` | `getStudentGradeRecap` |
| GET | `/courses` | `getCourseGradeRecap` |
| GET | `/courses/:kelasMataKuliahId/students` | `getCourseGradeDetail` |
| GET | `/students/:studentId/courses/:kelasMataKuliahId` | `getStudentGradeDetail` |

The first four routes require a positive integer `academicYearId`. Recap and summary filters accept `studyProgramId`, `classId`, `courseId`, `lecturerId` (Dosen.id), and `status`. Student recap also supports case-insensitive name/NIM `search`, `page` (default 1), `limit` (default 10, maximum 100), `sortBy` (`nim`, `name`, `finalScore`, `grade`, `status`) and `sortOrder` (`asc`, `desc`). Numeric IDs are validated strictly. Invalid parameters return 400; nonexistent academic years return 404.

`studentId` in the detail URL is **User.id**, consistent with existing student controller routes. Response `student.studentId` remains Mahasiswa.id. The course-class identifies the academic year for student detail; no year query is required there. A missing enrollment returns 404, whereas an enrollment with no Nilai returns null components/scores and `BELUM_DIINPUT`.

Population includes matching KRSDetail records regardless of approval status, as specified by the contract. Both KRS and class must belong to the selected year. No records are inferred from Transkrip. Summary counts unique students and all matching records, including records without Nilai. Averages include all non-null final scores, including incomplete grades, and return null when there are no scores.

Student and summary status filters apply to individual records. Course status filters apply after aggregating the full participant group: zero FINAL records means BELUM_DIINPUT, some FINAL records means BELUM_LENGKAP, and all participants FINAL means FINAL. Empty course-classes are included with zero counts, null average, and BELUM_DIINPUT. Course detail returns every participant, without pagination or recap status filtering.

Read operations use repeatable-read transactions. Student pagination runs count and data queries together; ordering includes a stable ID tie-breaker. Course recap aggregates selected participant scores in memory before status filtering and pagination, without per-course queries. For very large academic datasets this can be migrated to grouped database aggregation; it currently loads the selected groups' score/status fields. Summary likewise loads the selected records' student IDs and scores for unique counts and averages.

Corrections map existing fields to `id`, `changedById`, `previousFinalScore`, `newFinalScore`, `reason`, and ISO `createdAt`, newest first. Scores are JSON numbers; missing scores are null. No schema changes, migrations, or demo data are introduced.

Verification: `npx tsc --noEmit` and `node -r ts-node/register/transpile-only tests/grades.cjs`. Tests use a mock database and do not verify PostgreSQL execution or perform live writes.
