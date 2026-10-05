# SIAKAD API Contract

## Status

This contract applies to:

- **NEW endpoints** — must follow the canonical contract exactly
- **Significantly modified endpoints** — should adopt the canonical contract
- **Explicitly migrated endpoints** — documented in this file with migration status

Legacy endpoints do not need to be immediately rewritten. See [Compatibility](#compatibility) below.

---

## Canonical Response Shapes

### Single Resource Response

```json
{
  "data": {
    "id": 1,
    "name": "Example"
  }
}
```

When a user-facing message is meaningful:

```json
{
  "message": "Mahasiswa berhasil ditemukan",
  "data": {
    "id": 1,
    "name": "Example"
  }
}
```

### Collection Response (Paginated)

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response

```json
{
  "code": "STUDENT_NOT_FOUND",
  "message": "Mahasiswa tidak ditemukan",
  "requestId": "req_xxx"
}
```

### Validation Error Response

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Input tidak valid",
  "details": {
    "field": ["Field wajib diisi"]
  },
  "requestId": "req_xxx"
}
```

---

## Legacy Response Patterns

The following patterns are used by existing endpoints and are preserved for backward compatibility:

| Pattern | Shape | Examples |
|---------|-------|----------|
| A | `{ data: ... }` | Health endpoints (pre-M7), some auth responses |
| B | `{ message: "...", data: ... }` | AttendanceController, most domain controllers |
| C | `{ success: true, data: ... }` | None found |
| D | Raw arrays | None found |
| E | `{ students, pagination: {...} }` | Legacy attendance pagination shape |
| F | `{ fakultas, pagination: {...} }` | Legacy master data pagination shape |

**Frontend compatibility**: Frontend code reads `response.data` and `error.response?.data?.message`. These access patterns are preserved in all responses.

---

## Migration Status

### MIGRATED Endpoints

These endpoints have been migrated to the canonical contract:

| Endpoint | Method | Status | Response Shape |
|----------|--------|--------|----------------|
| `/health/live` | GET | ✅ MIGRATED | `{ data: { status: "ok" } }` |
| `/health/ready` | GET | ✅ MIGRATED | `{ data: { status: "ok" } }` or `{ data: { status: "error", reason: "..." } }` |

### LEGACY Endpoints (No Migration Required)

These endpoints remain on their existing response shapes until explicitly migrated:

| Controller | Methods | Notes |
|------------|---------|-------|
| `StudentController` | All | Excluded from platform hardening per AGENTS.md |
| `LecturerController` | All | Not yet migrated |
| `AttendanceController` | All | Uses custom pagination shape |
| `MasterData*` controllers | All | Legacy `{ entity, pagination }` shape |
| `AuthController` | login, refreshToken | Returns `{ accessToken, user }` |
| `KRS*` controllers | All | Custom shapes for academic records |

---

## HTTP Status Usage

| Status | Meaning |
|--------|---------|
| 200 | Successful request |
| 201 | Resource created |
| 204 | Successful operation with no response body |
| 400 | Invalid request |
| 401 | Unauthenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource or API route not found |
| 409 | Conflict with current resource state |
| 422 | Semantically invalid input when appropriate |
| 500 | Unexpected server error |

---

## Error Codes

Error codes must:

- be machine readable
- use UPPER_SNAKE_CASE
- remain stable whenever possible

Examples:

```
STUDENT_NOT_FOUND
INVALID_CREDENTIALS
FORBIDDEN
KRS_ALREADY_SUBMITTED
VALIDATION_ERROR
DUPLICATE_DATA
TOKEN_INVALID
TOKEN_EXPIRED
PASSWORD_CHANGE_REQUIRED
INTERNAL_SERVER_ERROR
ROUTE_NOT_FOUND
```

---

## AppError Usage Pattern

```typescript
// In controllers/services
throw new AppError(
  404,                              // HTTP status
  "STUDENT_NOT_FOUND",              // Machine-readable code
  "Mahasiswa tidak ditemukan",      // Human-readable message
  {                                 // Optional structured details
    details: { field: 'studentId' }
  }
);
```

The centralized error handler in `middleware/errHendler.ts` processes errors in this priority order:

1. **AppError instances** → Directly use statusCode, code, message, details
2. **Prisma known errors** → Map P2002/P2003/P2025/P2034 to appropriate HTTP status
3. **Legacy named objects** → Backward-compatible mapping (TokenInvalid, NotFound, etc.)
4. **Unknown errors** → Safe 500 with INTERNAL_SERVER_ERROR code

---

## Prisma Error Mapping

| Prisma Code | HTTP Status | Error Code | Notes |
|-------------|-------------|------------|-------|
| P2002       | 409         | DUPLICATE_DATA | Duplicate unique constraint |
| P2003       | 409         | CONFLICT | Foreign key constraint violation |
| P2025       | 404         | NOT_FOUND | Record not found for update/delete |
| P2034       | 409         | CONFLICT | Optimistic concurrency conflict |

Unknown Prisma error codes fall through to the generic 500 handler.

---

## Legacy Error Compatibility

The following legacy error name patterns are supported for backward compatibility while controller code is incrementally migrated:

| Name | HTTP Status | Error Code | Message Fallback |
|------|-------------|------------|------------------|
| TokenInvalid | 401 | TOKEN_INVALID | "Invalid or expired token" |
| TokenExpiredError | 401 | TOKEN_EXPIRED | "Access token expired" |
| JsonWebTokenError | 401 | TOKEN_INVALID | "Invalid or expired token" |
| Unauthorized | 401 | INVALID_CREDENTIALS | "Invalid Email / Password" |
| Forbidden | 403 | FORBIDDEN | "Akses ditolak" |
| NotFound | 404 | NOT_FOUND | "Data not found" |
| Conflict | 409 | CONFLICT | "Data masih digunakan." |
| BadRequest | 400 | VALIDATION_ERROR | "Email / Password is required" |
| PasswordChangeRequired | 403 | PASSWORD_CHANGE_REQUIRED | "Change your password before continuing." |

---

## Security Requirements

Error responses MUST NOT expose:

- Stack traces
- SQL queries or database internals
- Filesystem paths
- Environment variables
- Secrets or tokens
- Internal implementation details

All errors are logged internally via structured logging (Pino), but only safe, sanitized information is returned to clients.

---

## Request ID

Every request receives a unique identifier that flows through the entire stack.

- The server generates a UUID v4 by default
- Clients may provide a trusted `X-Request-Id` header with a UUID or legacy `req_` prefix; unsafe values are rejected and a fresh ID is generated
- The ID is echoed back via the `X-Request-Id` response header
- The ID is included in all error responses as `requestId`

Example error response with request ID:

```json
{
  "code": "ROUTE_NOT_FOUND",
  "message": "API route not found",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Response Helpers

The following helpers are available in `server/src/lib/responseHelpers.ts`:

```typescript
// Send single resource with optional message
sendData(res, data, statusCode = 200)
sendWithData(res, data, message?, statusCode = 200)

// Send created resource
sendCreated(res, data)

// Send paginated collection
sendPaginated(res, data, meta)
```

Usage example:

```typescript
// Instead of:
res.status(200).json({ data: student })

// Use:
sendData(res, student)

// With message:
sendWithData(res, student, "Student retrieved successfully")

// Paginated:
sendPaginated(res, students, { page: 1, limit: 10, total: 50, totalPages: 5 })
```

---

## Compatibility

Do not migrate every legacy endpoint at once.

Existing response contracts must remain compatible with
existing frontend consumers unless a coordinated migration
has been approved.

To migrate an endpoint:

1. Verify frontend does not depend on legacy shape
2. Update controller to use response helpers
3. Update/add tests
4. Update this document to reflect MIGRATED status

**Critical**: StudentController is excluded from migration during platform hardening. A separate execution plan covers its decomposition.
