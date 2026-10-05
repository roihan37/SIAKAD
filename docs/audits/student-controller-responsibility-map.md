# StudentController Responsibility Map

**File:** `server/src/controllers/studentController.ts`
**Lines:** 1,957
**Created:** 2026-10-05 (Milestone 1)

---

## Method Inventory

| # | Method | Lines | Route | Auth | Risk |
|---|--------|-------|-------|------|------|
| 1 | getFinanceyId | 13-26 | GET /:id/keuangan | adminMiddleware | LOW |
| 2 | getUKTById | 27-39 | GET /:id/ukt | adminMiddleware | LOW |
| 3 | getMyUKT | 40-54 | GET /me/ukt | None (public) | LOW |
| 4 | getStudentAttendance | 55-115 | GET /:id/presensi | adminMiddleware | MEDIUM |
| 5 | bulkUpdateStatus | 116-151 | PATCH /bulk/status | adminMiddleware | HIGH |
| 6 | createStudent | 152-229 | POST / | adminMiddleware | HIGH |
| 7 | updateStudentById | 230-910 | PATCH /:id | adminMiddleware | HIGH |
| 8 | deleteUserById | 911-966 | DELETE /:id | adminMiddleware | HIGH |
| 9 | bulkDelete | 967-1034 | DELETE /bulk | adminMiddleware | HIGH |
| 10 | getAllStudents | 1035-1110 | GET / | adminMiddleware | MEDIUM |
| 11 | getStudentById | 1111-1327 | GET /:id | adminOrMahasiswaMiddleware | MEDIUM |
| 12 | getStudentSemesterHistory | 1328-1589 | GET /:id/history-semester | adminOrMahasiswaMiddleware | MEDIUM |
| 13 | getStudentKRS | 1590-1783 | GET /:id/krs | adminOrMahasiswaMiddleware | MEDIUM |
| 14 | getStudentNilai | 1784-1888 | GET /:id/nilai | adminOrMahasiswaMiddleware | MEDIUM |
| 15 | resetPassword | 1889-end | PATCH /:userId/reset-password | adminMiddleware | HIGH |

---

## Detailed Method Analysis

### 1. getFinanceyId
- **Route:** GET /api/v1/students/:id/keuangan
- **Auth:** adminMiddleware required
- **Prisma Models:** finance, user
- **Dependencies:** getStudentFinance() from tuition.service
- **Response Shape:** { data: {...} } or { code, message, requestId }
- **Risk:** LOW - Simple finance data retrieval

### 2. getUKTById
- **Route:** GET /api/v1/students/:id/ukt
- **Auth:** adminMiddleware required
- **Prisma Models:** ukt, user
- **Dependencies:** None external
- **Response Shape:** { data: {...} }
- **Risk:** LOW - Simple UKT data retrieval

### 3. getMyUKT
- **Route:** GET /api/v1/students/me/ukt
- **Auth:** None (public endpoint)
- **Prisma Models:** ukt, user
- **Dependencies:** None external
- **Response Shape:** { data: {...} }
- **Risk:** LOW - Self-service UKT lookup

### 4. getStudentAttendance
- **Route:** GET /api/v1/students/:id/presensi
- **Auth:** adminMiddleware required
- **Prisma Models:** attendance, user
- **Dependencies:** attendanceCounts(), percentage() from attendance.service
- **Response Shape:** { data: { counts: {...}, percentage: number } }
- **Risk:** MEDIUM - Aggregation logic, multiple attendance records

### 5. bulkUpdateStatus ⚠️ HIGH RISK
- **Route:** PATCH /api/v1/students/bulk/status
- **Auth:** adminMiddleware required
- **Prisma Models:** user, mahasiswa (transaction)
- **Dependencies:** None external
- **Transactions:** YES - Single $transaction wrapping updates
- **Business Rules:**
  - Status must be one of: "Aktif", "Cuti", "Lulus", "Nonaktif"
  - Status reason required when changing from Aktif to other statuses
  - Maximum 100 students per bulk operation
  - All users must have mahasiswa relation
- **Response Shape:** { data: { updated: number } }
- **Risk:** HIGH - Transaction boundary, bulk operation, status change logic

### 6. createStudent ⚠️ HIGH RISK
- **Route:** POST /api/v1/students
- **Auth:** adminMiddleware required
- **Prisma Models:** user, mahasiswa, avatar (transaction)
- **Dependencies:** hashPassword(), AvatarService, S3Service
- **Transactions:** YES - Creates user + mahasiswa + optional avatar in transaction
- **Validations:**
  - Required fields: email, password, name, semester, angkatan, prodiId
  - Email uniqueness check
  - Password strength validation
  - Optional avatar upload to S3
- **External Side Effects:** S3 upload for avatar
- **Response Shape:** { data: {...}, message?: string }
- **Risk:** HIGH - Transaction with external side effects (S3), password hashing

### 7. updateStudentById — Milestone 7 pre-extraction characterization (2026-10-05)

Inspected the complete original method before production edits. This supersedes the earlier summary (there is no avatar model/upload, no name validation, and reason is required for changes from **any** status).

- Route: `PATCH /api/v1/students/:id`; existing admin middleware is unchanged. `String(req.params.id)` is used without trimming or ID validation.
- Lookup: `user.findUnique({where:{id}})` selects avatarKey and nested mahasiswa ID, NIM, angkatan, semester, status, prodiId, dosenId. No role predicate. Missing user throws `NotFound: User tidak ditemukan`; missing mahasiswa throws `BadRequest: User ini bukan mahasiswa`. All lookup/relation reads precede the transaction.
- Editable user fields: name, email, username, password, phoneNumber, gender, address, nik, birthPlace, birthDate, avatarKey. Editable mahasiswa fields: nim, angkatan, semester, status, prodiId, dosenId. Name/email/username/NIM are passed through without trimming, normalization or duplicate preflight. Prisma errors (including uniqueness/null/enum errors) are forwarded unchanged.
- Non-editable through this method: user/mahasiswa IDs, role, userId, photo, mustChangePassword, timestamps, arbitrary body fields, direct avatarUrl. Username and NIM are **not** immutable. Avatar changes clear persisted avatarUrl.
- Status: strict inequality to the previously read status when status is not undefined. There is **no explicit status allow-list**. A change requires a non-null/defined reason whose String conversion trims to nonempty; otherwise `BadRequest: Alasan perubahan status wajib diisi`. No maximum length. Unchanged/omitted status ignores reason. Invalid status with reason reaches Prisma; without reason it fails reason validation first. Null/empty status is also treated as a change and forwarded if reason exists.
- Birth date: undefined omits write; null/empty string clears to null. Other values use String conversion and exact YYYY-MM-DD regex (`birthDate harus menggunakan format YYYY-MM-DD`), then Date.UTC with UTC component equality (`birthDate tidak valid`). Valid dates store UTC midnight; impossible dates and Date.UTC's 0000–0099 year rollover fail.
- Angkatan/semester/prodiId: undefined omits write. Number conversion must yield integer >0 (`<field> harus berupa angka positif`). Null/empty string becomes zero and fails; numeric strings are accepted (also legacy coercions such as true → 1). No upper bound. Prodi existence lookup follows parsing; missing row throws `NotFound: Program Studi tidak ditemukan`.
- Dosen: undefined omits write; null/empty string clears relation without lookup. Otherwise String conversion without trimming and existence lookup; missing row throws `NotFound: Dosen tidak ditemukan`.
- Avatar: undefined preserves key and stored URL. Null/empty string requests removal, skips verification, writes key/URL null. Other values use String conversion, must start `students/${userId}/` (`BadRequest: Avatar tidak valid`), then `S3Service.checkObjectExists` (`BadRequest: File avatar tidak ditemukan` if false). Same key is still verified and stored URL cleared. No upload or AvatarService call occurs here.
- Password: undefined/null/empty string is ignored. Otherwise hashPassword runs after avatar verification, before transaction, with no added strength rule. The user update sets the hash and revokes all refreshTokens atomically; mustChangePassword is untouched.
- Transaction: one interactive `$transaction(callback)` with **default options**. Nested `user.update` writes user and mahasiswa together, then status history is created when changed, with previous status from the earlier lookup, new raw status and trimmed reason. History select is id/statusLama/statusBaru/alasan/tanggal. User select is id/name/email/username/avatarKey plus mahasiswa id/nim/angkatan/semester/status/prodiId/dosenId. History/write/commit failures propagate; no independent writes.
- External ordering: lookup → reason/date/numeric/relation validation → avatar verification → hash → transaction user+mahasiswa+tokens/history → commit → disable new-avatar compensation → best-effort delete old key if replaced/removed → sign read URL for resulting key → HTTP response. No S3 operation is inside the transaction.
- Compensation: only a verified **different** nonempty new key is marked for cleanup. Subsequent hash/transaction failure attempts deletion of that new key; cleanup errors log `Gagal cleanup avatar baru:` and preserve the original error. Bad prefix, failed/throwing verification, same key, and removal do not register compensation. Old key is never deleted on rollback.
- Post-commit old-key deletion failure logs `Gagal menghapus avatar lama:` and is swallowed; signing still runs. Signing failure is forwarded **after commit**, with no compensation of the now-owned new key. Response-send failure also forwards with no new-key cleanup. Removal returns avatarUrl null and does not sign.
- Response: HTTP 200 `{message:"Mahasiswa berhasil diperbarui",data:{id,nama,email,username,avatarUrl,mahasiswa,statusHistory}}`; statusHistory is null if unchanged. All exceptions go to next(error).

Value semantics: raw name/email/username/phoneNumber/gender/address/nik/birthPlace/NIM/status are included exactly when `!== undefined`; empty strings and null are forwarded, with Prisma responsible for required/enum/unique constraints. Nullable phoneNumber/address/nik/birthPlace accept null. Required name/email/username/NIM/gender/status do not become nullable merely because the controller forwards null. An empty patch still executes a nested mahasiswa update and signs any existing avatar. No fallback/default/coalescing may erase omitted-versus-null-versus-empty distinctions.

Risks retained: stale status/avatar snapshots and relation races from reads outside transaction; failed cleanup may orphan objects; failed verification does not clean a new upload; signing can fail after commit; concurrent/reused keys complicate compensation. These are deferred under TD-22, not silently repaired in this extraction. Tests use isolated Prisma/S3 doubles, so actual database rollback/cloud behavior remains an integration-validation limit.

M7 outcome: these responsibilities now live in `StudentManagementService.updateStudent` and its private `prepareStudentUpdate` helper. The controller constructs `UpdateStudentInput` from the explicit supported field list and preserves the HTTP envelope/error forwarding. The original 27 characterization tests passed before extraction and after each risky checkpoint; two service/controller-boundary tests were added afterward. Other controller methods are unchanged; see the ExecPlan for full validation results.

### 8. deleteUserById
- **Route:** DELETE /api/v1/students/:id
- **Auth:** adminMiddleware required
- **Prisma Models:** user, mahasiswa (transaction)
- **Dependencies:** AvatarService, S3Service
- **Transactions:** YES - Deletes user + mahasiswa + cleanup avatar
- **Business Rules:**
  - Checks if student has active records before deletion
  - Cleans up S3 avatar if exists
- **Response Shape:** { message: "Success" }
- **Risk:** HIGH - Destructive operation with external cleanup

### 9. bulkDelete
- **Route:** DELETE /api/v1/students/bulk
- **Auth:** adminMiddleware required
- **Prisma Models:** user, mahasiswa (transaction)
- **Dependencies:** AvatarService, S3Service
- **Transactions:** YES - Bulk delete with avatar cleanup
- **Business Rules:**
  - Maximum 100 students per operation
  - Validates all IDs exist
  - Cleans up S3 avatars
- **Response Shape:** { data: { deleted: number } }
- **Risk:** HIGH - Bulk destructive operation

### 10. getAllStudents
- **Route:** GET /api/v1/students
- **Auth:** adminMiddleware required
- **Prisma Models:** mahasiswa, user (pagination)
- **Dependencies:** None external
- **Pagination:** Page-based with limit parameter
- **Filtering:** Search by name, NIM, status
- **Sorting:** Default by createdAt descending
- **Response Shape:** Paginated response with meta
- **Risk:** MEDIUM - Pagination and filtering logic

### 11. getStudentById
- **Route:** GET /api/v1/students/:id
- **Auth:** adminMiddleware OR mahasiswa (self)
- **Prisma Models:** mahasiswa, user, prodi, dosen
- **Dependencies:** None external
- **Response Shape:** { data: {...} } with nested relations
- **Risk:** MEDIUM - Nested relation loading

### 12. getStudentSemesterHistory
- **Route:** GET /api/v1/students/:id/history-semester
- **Auth:** adminMiddleware OR mahasiswa (self)
- **Prisma Models:** akademik, transkrip_nilai, mahasiswa
- **Dependencies:** None external
- **Business Rules:**
  - Calculates IPK (GPA) per semester
  - Aggregates completed credits
- **Response Shape:** Array of semester records with GPA
- **Risk:** MEDIUM - Academic calculations

### 13. getStudentKRS
- **Route:** GET /api/v1/students/:id/krs
- **Auth:** adminMiddleware OR mahasiswa (self)
- **Prisma Models:** krs, jadwal, mata_kuliah
- **Dependencies:** None external
- **Note:** KRS is explicitly excluded from redesign in this plan
- **Risk:** MEDIUM - Read-only, but KRS domain complexity

### 14. getStudentNilai
- **Route:** GET /api/v1/students/:id/nilai
- **Auth:** adminMiddleware OR mahasiswa (self)
- **Prisma Models:** nilai, mata_kuliah
- **Dependencies:** None external
- **Business Rules:** Grade aggregation and calculation
- **Risk:** MEDIUM - Academic calculations

### 15. resetPassword
- **Route:** PATCH /api/v1/students/:userId/reset-password
- **Auth:** adminMiddleware required
- **Prisma Models:** user
- **Dependencies:** hashPassword()
- **Business Rules:**
  - New password must not match old password
  - Password strength validation
- **Response Shape:** { message: "Password reset successful" }
- **Risk:** HIGH - Authentication-related, password handling

---

## Proposed Service Mapping

Based on cohesion analysis:

### StudentAccountService
- createStudent
- updateStudentById
- deleteUserById
- resetPassword

**Rationale:** All account lifecycle operations with shared dependencies (hashPassword, AvatarService, S3Service)

### StudentManagementService
- getAllStudents
- getStudentById
- bulkUpdateStatus
- bulkDelete

**Rationale:** Administrative CRUD and bulk operations

### StudentAcademicService
- getStudentSemesterHistory
- getStudentKRS
- getStudentNilai

**Rationale:** Academic record operations (KRS excluded from redesign, but structure preserved)

### StudentFinanceService
- getFinanceyId
- getUKTById
- getMyUKT

**Rationale:** Financial data queries (already delegated to tuition.service)

### StudentAttendanceService
- getStudentAttendance

**Rationale:** Attendance aggregation (already uses attendance.service helpers)

---

## Test Coverage Matrix

| Behavior | Existing Test | Coverage Gap |
|----------|---------------|--------------|
| Student list with filters | No | ❌ Need characterization |
| Student pagination | No | ❌ Need characterization |
| Student detail by ID | No | ❌ Need characterization |
| Student creation | No | ❌ HIGH risk, need coverage |
| Student update | No | ❌ HIGHEST risk, need coverage |
| Student deletion | No | ❌ Need coverage |
| Bulk status update | No | ❌ HIGH risk, need coverage |
| Bulk delete | No | ❌ HIGH risk, need coverage |
| Reset password | No | ❌ HIGH risk, need coverage |
| Semester history | tests/student-grades.cjs | ✅ Partial |
| KRS | tests/student-tuition.cjs | ✅ Partial |
| Grades/Nilai | tests/student-grades.cjs | ✅ Partial |
| Attendance | tests/student-attendance.cjs | ✅ Partial |
| Tuition/Finance | tests/student-finance.cjs | ✅ Partial |
| Auth boundary (admin vs mahasiswa) | No | ❌ Need verification |

---

## Suspected Bugs

| ID | Method | Suspected Issue | Severity |
|----|--------|-----------------|----------|
| TBD-1 | updateStudentById | Error handling consistency - some paths throw objects, others use AppError | Low |
| TBD-2 | createStudent | Avatar cleanup on transaction rollback unclear | Medium |

**Note:** No bugs fixed in this milestone. Issues recorded for future consideration.

---

## High-Risk Items Requiring Characterization Tests

1. **updateStudentById** (680 lines, transaction + S3)
2. **createStudent** (transaction + S3 upload)
3. **bulkUpdateStatus** (transaction with business rules)
4. **deleteUserById** (destructive with S3 cleanup)
5. **bulkDelete** (bulk destructive operation)
6. **resetPassword** (auth-sensitive operation)
7. **Authorization boundaries** (admin vs mahasiswa access)

---

