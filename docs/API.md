# Inventra API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

---

## Authentication `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Register new user |
| POST | `/login` | — | Login, get JWT |
| POST | `/verify-otp` | — | Verify 2FA OTP |
| POST | `/refresh-token` | — | Refresh access token |
| POST | `/forgot-password` | — | Send reset email |
| PATCH | `/reset-password/:token` | — | Reset password |
| GET | `/me` | ✓ | Get current user |
| POST | `/logout` | ✓ | Logout |
| POST | `/setup-otp` | ✓ | Enable 2FA |
| POST | `/disable-otp` | ✓ | Disable 2FA |

---

## Products `/api/products`

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/` | all | List products (paginated, filterable) |
| GET | `/low-stock` | all | Products below minimum stock |
| GET | `/:id` | all | Get single product |
| GET | `/:id/history` | all | Stock transaction history |
| POST | `/` | admin, manager | Create product |
| PUT | `/:id` | admin, manager | Update product |
| DELETE | `/:id` | admin | Soft-delete product |
| PATCH | `/:id/adjust-stock` | admin, manager, staff | Adjust stock quantity |

### Query Parameters (GET /)
- `page` (default: 1)
- `limit` (default: 20)
- `search` (text search on name, SKU, tags)
- `category` (category ObjectId)
- `supplier` (supplier ObjectId)
- `stockStatus` (`low_stock` | `out_of_stock`)
- `sortBy` (field name, default: `createdAt`)
- `sortOrder` (`asc` | `desc`)
- `minPrice`, `maxPrice`

---

## Categories `/api/categories`

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/` | all | List categories |
| GET | `/:id` | all | Get category |
| POST | `/` | admin, manager | Create category |
| PUT | `/:id` | admin, manager | Update category |
| DELETE | `/:id` | admin | Deactivate category |

---

## Suppliers `/api/suppliers`

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/` | all | List suppliers |
| GET | `/:id` | all | Get supplier |
| POST | `/` | admin, manager | Create supplier |
| PUT | `/:id` | admin, manager | Update supplier |
| DELETE | `/:id` | admin | Deactivate supplier |

---

## Transactions `/api/transactions`

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/` | all | List transactions (filterable) |

### Query Parameters
- `type` (purchase | sale | adjustment | return | damaged | expired | transfer)
- `productId`
- `startDate`, `endDate`

---

## Dashboard `/api/dashboard`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stats` | ✓ | Key metrics + recent activity |
| GET | `/trend` | ✓ | Stock movement over time (param: `days`) |
| GET | `/categories` | ✓ | Category distribution |
| GET | `/top-products` | ✓ | Top selling products |

---

## Reports `/api/reports`

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/inventory/pdf` | admin, manager | Download inventory PDF |
| GET | `/inventory/excel` | admin, manager | Download inventory Excel |
| GET | `/transactions/pdf` | admin, manager | Download transaction PDF |

---

## AI `/api/ai`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/summary` | ✓ | AI inventory executive summary |
| GET | `/reorder/:id` | ✓ | Reorder prediction for a product |
| GET | `/anomalies` | ✓ | Detect transaction anomalies |
| POST | `/chat` | ✓ | Chat with Inventra AI |

### POST /chat Body
```json
{
  "message": "Which products need reordering?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

---

## Users `/api/users`

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/` | admin | List all users |
| GET | `/:id` | admin, manager | Get user |
| PUT | `/me/profile` | all | Update own profile |
| PATCH | `/:id/role` | admin | Update user role |
| PATCH | `/:id/status` | admin | Toggle user active status |

---

## Response Format

All responses follow:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Errors:
```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

---

## Roles & Permissions

| Feature | admin | manager | staff | viewer |
|---------|-------|---------|-------|--------|
| View inventory | ✓ | ✓ | ✓ | ✓ |
| Adjust stock | ✓ | ✓ | ✓ | — |
| Create/edit products | ✓ | ✓ | — | — |
| Delete products | ✓ | — | — | — |
| Manage categories | ✓ | ✓ | — | — |
| Manage suppliers | ✓ | ✓ | — | — |
| Export reports | ✓ | ✓ | — | — |
| Manage users | ✓ | — | — | — |
| AI features | ✓ | ✓ | ✓ | ✓ |
