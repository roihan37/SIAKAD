# SIAKAD API Contract

## Status

This contract applies to:

- new endpoints
- significantly modified endpoints
- explicitly migrated endpoints

Legacy endpoints do not need to be immediately rewritten.

---

# Success Response

Single resource:

{
  "message": "Mahasiswa berhasil ditemukan",
  "data": {}
}

`message` may be omitted when it does not provide useful information.

---

# Collection Response

{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}

---

# Error Response

{
  "code": "STUDENT_NOT_FOUND",
  "message": "Mahasiswa tidak ditemukan",
  "requestId": "req_xxx"
}

New and migrated backend flows should use the shared `AppError` foundation. It carries an HTTP status, stable machine-readable `code`, human-readable `message`, and optional safe structured `details`. The centralized middleware preserves `message` for existing frontend consumers.

Unexpected errors return HTTP 500 with `INTERNAL_SERVER_ERROR` and a generic message. Responses never include stack traces, Prisma metadata, SQL, filesystem paths, environment values, or secrets. Legacy named errors remain mapped for compatibility while callers migrate incrementally.

**Frontend compatibility**: Frontend code reads `error.response?.data?.message` and `error.response?.data?.code`. These fields are preserved in all error responses.

---

# Validation Error

{
  "code": "VALIDATION_ERROR",
  "message": "Input tidak valid",
  "details": {
    "field": [
      "Field wajib diisi"
    ]
  },
  "requestId": "req_xxx"
}

The `details` field is optional and only present when validation provides structured information. An empty details object is omitted from the response.

---

# HTTP Status Usage

200
Successful request

201
Resource created

204
Successful operation with no response body

400
Invalid request

401
Unauthenticated

403
Authenticated but not authorized

404
Resource or API route not found

409
Conflict with current resource state

422
Semantically invalid input when appropriate

500
Unexpected server error

---

# Error Codes

Error codes must:

- be machine readable
- use UPPER_SNAKE_CASE
- remain stable whenever possible

Examples:

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

---

# AppError Usage Pattern

```typescript
// In controllers/services
throw new AppError(
  404,                    // HTTP status
  "STUDENT_NOT_FOUND",    // Machine-readable code
  "Mahasiswa tidak ditemukan", // Human-readable message
  {                        // Optional structured details
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

# Prisma Error Mapping

| Prisma Code | HTTP Status | Error Code | Notes |
|-------------|-------------|------------|-------|
| P2002       | 409         | DUPLICATE_DATA | Duplicate unique constraint |
| P2003       | 409         | CONFLICT | Foreign key constraint violation |
| P2025       | 404         | NOT_FOUND | Record not found for update/delete |
| P2034       | 409         | CONFLICT | Optimistic concurrency conflict |

Unknown Prisma error codes fall through to the generic 500 handler.

---

# Legacy Error Compatibility

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

# Security Requirements

Error responses MUST NOT expose:

- Stack traces
- SQL queries or database internals
- Filesystem paths
- Environment variables
- Secrets or tokens
- Internal implementation details

All errors are logged internally via `console.error` for debugging, but only safe, sanitized information is returned to clients.

---

# requestId

Every error response includes a `requestId` field for correlation:

```json
{
  "code": "STUDENT_NOT_FOUND",
  "message": "Mahasiswa tidak ditemukan",
  "requestId": "req_a1b2c3d4e5f6g7h8"
}
```

This enables tracing requests across distributed systems and log aggregation.

---

# Compatibility

Do not migrate every legacy endpoint at once.

Existing response contracts must remain compatible with
existing frontend consumers unless a coordinated migration
has been approved.
