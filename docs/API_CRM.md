# CRM API Endpoints — OpenAPI 3.0

## Base URL
```
https://api.echowave.ai/v1
```

## Authentication
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Leads

### POST /leads
Create a new lead from website form or manual entry.

**Request**
```json
{
  "name": "Ahmed Hassan",
  "email": "ahmed@example.com",
  "phone": "+201001234567",
  "message": "Interested in mobile app development",
  "serviceInterest": "mobile_app",
  "source": "website"
}
```

**Response (201)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "organizationId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Ahmed Hassan",
  "email": "ahmed@example.com",
  "phone": "+201001234567",
  "message": "Interested in mobile app development",
  "serviceInterest": "mobile_app",
  "status": "new",
  "source": "website",
  "score": null,
  "notes": null,
  "contactId": null,
  "opportunityId": null,
  "createdAt": "2026-10-16T10:30:00Z",
  "updatedAt": "2026-10-16T10:30:00Z",
  "lastContactedAt": null
}
```

**Error (400)**
```json
{
  "error": "validation_error",
  "message": "Validation failed",
  "fields": {
    "email": ["Invalid email address"],
    "name": ["Name cannot be empty"]
  }
}
```

### GET /leads
Get all leads for organization with pagination and filters.

**Query Parameters**
- `status` (optional): Filter by lead status (new, contacted, qualified, rejected)
- `source` (optional): Filter by source (website, referral, email, phone, other)
- `search` (optional): Search by name or email
- `limit` (optional, default: 50): Results per page
- `offset` (optional, default: 0): Pagination offset

**Response (200)**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "organizationId": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Ahmed Hassan",
      "email": "ahmed@example.com",
      "status": "new",
      "source": "website",
      "createdAt": "2026-10-16T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 125,
    "limit": 50,
    "offset": 0
  }
}
```

### GET /leads/{leadId}
Get a specific lead by ID.

**Response (200)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "organizationId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Ahmed Hassan",
  "email": "ahmed@example.com",
  "status": "new",
  "source": "website"
}
```

**Error (404)**
```json
{
  "error": "not_found",
  "message": "Lead not found"
}
```

### PATCH /leads/{leadId}
Update lead status and notes.

**Request**
```json
{
  "status": "contacted",
  "notes": "Initial conversation scheduled"
}
```

**Response (200)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "contacted",
  "notes": "Initial conversation scheduled",
  "lastContactedAt": "2026-10-16T11:00:00Z",
  "updatedAt": "2026-10-16T11:00:00Z"
}
```

---

## Contacts

### POST /contacts
Create a new contact.

**Request**
```json
{
  "firstName": "Ahmed",
  "lastName": "Hassan",
  "email": "ahmed@example.com",
  "phone": "+201001234567",
  "address": "123 Business St",
  "city": "Cairo",
  "country": "Egypt",
  "postalCode": "11111",
  "consentMarketing": true,
  "consentEmail": true,
  "consentPhone": false
}
```

**Response (201)**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "organizationId": "123e4567-e89b-12d3-a456-426614174000",
  "firstName": "Ahmed",
  "lastName": "Hassan",
  "email": "ahmed@example.com",
  "phone": "+201001234567",
  "consentMarketing": true,
  "consentEmail": true,
  "consentPhone": false,
  "createdAt": "2026-10-16T10:30:00Z"
}
```

### GET /contacts
Get all contacts for organization.

**Query Parameters**
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response (200)**
```json
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "firstName": "Ahmed",
      "lastName": "Hassan",
      "email": "ahmed@example.com",
      "createdAt": "2026-10-16T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 85,
    "limit": 50,
    "offset": 0
  }
}
```

### GET /contacts/{contactId}
Get a specific contact.

### PATCH /contacts/{contactId}
Update contact details.

**Request**
```json
{
  "firstName": "Ahmed",
  "email": "ahmed.new@example.com",
  "consentMarketing": false
}
```

### PATCH /contacts/{contactId}/consent
Update contact consent preferences.

**Request**
```json
{
  "marketing": false,
  "email": true,
  "phone": false
}
```

**Response (200)**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "consentMarketing": false,
  "consentEmail": true,
  "consentPhone": false
}
```

---

## Opportunities

### POST /opportunities
Create a new opportunity for a lead.

**Request**
```json
{
  "leadId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Mobile App Project",
  "description": "iOS and Android app for e-commerce",
  "value": 50000,
  "currency": "EGP",
  "stage": "prospect",
  "expectedCloseDate": "2026-12-31",
  "probability": 25
}
```

**Response (201)**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "organizationId": "123e4567-e89b-12d3-a456-426614174000",
  "leadId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Mobile App Project",
  "value": 50000,
  "currency": "EGP",
  "stage": "prospect",
  "probability": 25,
  "createdAt": "2026-10-16T10:30:00Z"
}
```

### GET /opportunities
Get all opportunities with filters.

**Query Parameters**
- `stage` (optional): Filter by stage
- `leadId` (optional): Filter by lead
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response (200)**
```json
{
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "leadId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Mobile App Project",
      "value": 50000,
      "stage": "prospect",
      "probability": 25
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 50,
    "offset": 0
  }
}
```

### GET /opportunities/{opportunityId}
Get a specific opportunity.

### PATCH /opportunities/{opportunityId}
Update opportunity details.

**Request**
```json
{
  "title": "Mobile App & Web Platform",
  "value": 75000,
  "probability": 60
}
```

### PATCH /opportunities/{opportunityId}/stage
Update opportunity stage.

**Request**
```json
{
  "stage": "proposal"
}
```

**Response (200)**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "stage": "proposal",
  "updatedAt": "2026-10-16T11:30:00Z"
}
```

### GET /opportunities/pipeline/summary
Get pipeline summary by stage and revenue.

**Response (200)**
```json
{
  "byStage": {
    "prospect": {
      "count": 15,
      "totalValue": 250000
    },
    "qualified": {
      "count": 8,
      "totalValue": 320000
    },
    "proposal": {
      "count": 5,
      "totalValue": 400000
    }
  },
  "totalValue": 970000,
  "opportunityCount": 28
}
```

### GET /opportunities/forecast
Get revenue forecast (weighted by probability).

**Response (200)**
```json
{
  "forecast": 487500
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "forbidden",
  "message": "You do not have permission to access this resource"
}
```

### 500 Internal Server Error
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred",
  "errorId": "err_12345678"
}
```

---

## Rate Limiting

All endpoints are rate-limited to 100 requests per minute per API key.

Response headers:
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 95`
- `X-RateLimit-Reset: 1634389800`

---

## Webhooks (Future)

- `lead.created`: Triggered when a new lead is created
- `lead.status_changed`: Triggered when lead status changes
- `opportunity.stage_changed`: Triggered when opportunity stage changes

Webhook payload includes:
```json
{
  "event": "lead.created",
  "timestamp": "2026-10-16T10:30:00Z",
  "data": { ... }
}
```
