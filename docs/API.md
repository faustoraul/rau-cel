# API de la Tienda — Contrato de referencia

**Base URL:** `http://localhost:3000/api`
**Encoding:** UTF-8 (`Content-Type: application/json; charset=utf-8`)
**Autenticación:** JWT en header `Authorization: Bearer <token>`
**Expiración del token:** 2h (configurable en `.env`)

---

## Formato de respuestas

### Éxito (200, 201)
```json
{
  "ok": true,
  "message": "Descripción opcional",
  "data": { ... }
}