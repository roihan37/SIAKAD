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

ROUTE_NOT_FOUND

INTERNAL_SERVER_ERROR

---

# Compatibility

Do not migrate every legacy endpoint at once.

Existing response contracts must remain compatible with
existing frontend consumers unless a coordinated migration
has been approved.