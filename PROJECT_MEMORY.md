# NEX Finance — Project Memory
> สรุป context ทั้งหมดของโปรเจกต์ สำหรับใช้ต่อใน session ถัดไป
> Last updated: 2026-05-05

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Nuxt 3 + TypeScript + Vuexy Admin Theme (Tailwind CSS) |
| Backend | Supabase (PostgreSQL + Edge Functions + Storage) |
| Auth | Supabase Auth (JWT) + Pinia store |
| State | Pinia (`stores/auth.ts`) |
| UI Library | Vuexy Admin (Tailwind, HeadlessUI, SweetAlert2) |

---

## 2. Supabase Project

- **Project ID**: `oyynkpgjmfntrrrnrzto`
- **Project URL**: `https://oyynkpgjmfntrrrnrzto.supabase.co`
- **Region**: ap-northeast-1
- **DB Host**: `db.oyynkpgjmfntrrrnrzto.supabase.co`

---

## 3. User Roles

| Role | Route Prefix | Description |
|---|---|---|
| `gec` | ไม่จำกัด (เข้าได้ทุก route) | GEC Admin — ดูได้อย่างเดียว ไม่ approve/reject |
| `lender` | `/lender/*` | Lender — approve/reject คำขอได้ |
| `supplier` | `/supplier/*` | Supplier — ยื่นคำขอ Factoring/Credit Line |

**Middleware**: `middleware/auth.global.ts`
- ทุก navigation → `getSession()` เพื่อ refresh token อัตโนมัติ
- Supplier ถูกแบน route นอก `/supplier/*`
- Lender ถูกแบน route นอก `/lender/*`
- GEC เข้าได้ทุก route

---

## 4. Auth Store (`stores/auth.ts`)

```typescript
interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    company_name: string | null;
    role: 'gec' | 'lender' | 'supplier';
    status: 'pending' | 'active' | 'inactive';
    lender_code: string | null;
    lender_org: string | null;
}
```

**⚠️ Token Pattern — สำคัญมาก:**
```typescript
// ❌ อย่าใช้ (token หมดอายุหลัง ~1hr)
const jwt = authStore.accessToken;

// ✅ ใช้แบบนี้ทุกครั้ง (ได้ token ใหม่เสมอ)
const { $supabase } = useNuxtApp();
const { data: { session } } = await ($supabase as any).auth.getSession();
const jwt = session?.access_token || authStore.accessToken;
```

---

## 5. Edge Functions

### Pattern มาตรฐานสำหรับทุก Edge Function

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2';  // ใช้ npm: ไม่ใช่ jsr:

const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS }); // 200 ไม่ใช่ 204!

  // ... logic

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', ...CORS }
  });
});
```

**Deploy config**: `verify_jwt: false` (validate JWT ใน function body เอง)

### รายการ Edge Functions ทั้งหมด

| Function | Method | Description | Auth Required |
|---|---|---|---|
| `listapplication` | GET | รายการคำขอทั้งหมด (lender/gec) | JWT → lender หรือ gec |
| `getapplication` | GET | ดูคำขอเดี่ยว `?id=` | JWT |
| `createapplications` | POST | สร้างคำขอใหม่ | JWT → supplier |
| `updateapplication` | PATCH | แก้ไขคำขอ (draft/rejected เท่านั้น) | JWT → supplier |
| `createcredit` | POST | อนุมัติ + สร้าง credit facility | JWT → lender |
| `rejectapplication` | PATCH | ปฏิเสธคำขอ | JWT → lender |
| `listpo` | GET | รายการ PO ของ supplier นั้น ๆ | JWT → supplier |
| `listallpo` | GET | รายการ PO ทั้งหมด (GEC) | JWT → gec |
| `listprofile` | GET | รายการ profiles ทั้งหมด | JWT → gec |
| `updateprofile` | PATCH | แก้ไข profile (เช่น supplier mapping) | JWT → gec |
| `listsuppliers` | GET | distinct supplier_code, supplier_name จาก purchase_orders | JWT |
| `getcreditfacility` | GET | credit facility ของ supplier นั้น ๆ | JWT → supplier |

### `updateapplication` — EDITABLE_STATUSES
```typescript
const EDITABLE_STATUSES = ['draft', 'rejected']; // v2 — rejected ก็แก้ไขได้
```

---

## 6. Database Tables (ที่ใช้จริง)

| Table | Description |
|---|---|
| `profiles` | ข้อมูล user: role, status, company_name, supplier_code, supplier_name, lender_code, lender_org |
| `applications` | คำขอ Factoring/Credit Line หลัก |
| `application_po_items` | รายการ PO ที่แนบกับคำขอ |
| `application_documents` | เอกสารแนบของ credit line |
| `credit_facilities` | วงเงินที่อนุมัติแล้ว |
| `purchase_orders` | รายการ PO ทั้งหมด |

### `credit_facilities` — โครงสร้าง
- `facility_type = 'credit_line'` → วงเงิน Total Credit Limit
- `facility_type = 'drawdown'` → ยอดที่ใช้ไปแล้ว (Already Used)
- `available_balance` → Remaining
- `supplier_id` → FK ไปที่ `profiles.id`

### `getcreditfacility` Response Shape
```json
{
  "has_facility": true,
  "credit_limit": 1000000,
  "already_used": 200000,
  "remaining": 800000,
  "credit_period": 30,
  "interest_rate": 0.065
}
```

---

## 7. Pages ที่สร้าง/แก้ไข

### GEC Pages
| Path | File | Description |
|---|---|---|
| `/gec/request-list` | `pages/gec/request-list.vue` | รายการคำขอทั้งหมด + View button (ไม่มี approve/reject) |
| `/gec/view-request/[id]` | `pages/gec/view-request/[id].vue` | ดูรายละเอียดคำขอ — read-only |
| `/gec/registration-list` | `pages/gec/registration-list.vue` | รายการลงทะเบียน |
| `/gec/profile-list` | `pages/gec/profile-list.vue` | รายการ profiles + edit modal (supplier mapping) |
| `/po_list` | `pages/po_list.vue` | PO List ดึงจาก `listallpo` edge function |

### Supplier Pages
| Path | File | Description |
|---|---|---|
| `/supplier/request-list` | `pages/supplier/request-list.vue` | รายการคำขอของ supplier + Edit/Submit สำหรับ rejected |
| `/supplier/new-factoring-request` | `pages/supplier/new-factoring-request.vue` | สร้างคำขอใหม่ + Credit Facility Summary widget |
| `/supplier/new-line-application` | `pages/supplier/new-line-application.vue` | สมัครวงเงิน credit line |
| `/supplier/edit-request/[id]` | `pages/supplier/edit-request/[id].vue` | แก้ไขคำขอ (draft + rejected) |

### Lender Pages
| Path | File | Description |
|---|---|---|
| `/lender/request-list` | `pages/lender/request-list.vue` | รายการคำขอ + View button |
| `/lender/view-request/[id]` | `pages/lender/view-request/[id].vue` | ดูรายละเอียด + Approve/Reject modal |

---

## 8. Composables

### `composables/useSupplierFactoringRequest.ts`
- `form` — state ของฟอร์มคำขอใหม่
- `pendingPOs` — รายการ PO จาก `listpo`
- `fetchPOs()` — ดึง PO ด้วย fresh session token
- `saveDraft()` / `submitRequest()` — POST (ครั้งแรก) หรือ PATCH (ครั้งต่อไป)
- `totalSelectedAmount`, `selectedBuyerNames`, `selectedPoRefs`, `isFormValid`

---

## 9. Sidebar (`components/layout/Sidebar.vue`)

### GEC Menu ซ่อน/แสดงตาม role
```html
<!-- Credit Application submenu -->
<li><NuxtLink to="/po_list">PO List</NuxtLink></li>
<template v-if="!authStore.isGEC">
    <!-- ซ่อนจาก GEC เพราะ GEC ไม่ต้องสร้างแทน supplier -->
    <li><NuxtLink to="/new_line_application">New Line Application</NuxtLink></li>
    <li><NuxtLink to="/new_factoring_request">New Factoring Request</NuxtLink></li>
</template>
```

---

## 10. Key Fixes ที่ทำไปแล้ว

### Token Expiry Fix
- **ปัญหา**: `authStore.accessToken` ถูก set ครั้งเดียวตอน login → หมดอายุหลัง ~1hr
- **แก้**: `middleware/auth.global.ts` เรียก `getSession()` ทุก navigation
- **แก้**: ทุก composable/page ใช้ `$supabase.auth.getSession()` ตรง ๆ

### CORS Fix
- **ปัญหา**: Edge function ใช้ `jsr:@supabase/supabase-js@2` → cold-start crash → OPTIONS return 500
- **แก้**: เปลี่ยนเป็น `npm:@supabase/supabase-js@2` + OPTIONS return `new Response('ok', ...)` (status 200)

### Edit-Request Rejected Fix
- **ปัญหา**: `if (data.status !== 'draft')` → ปฏิเสธ rejected request
- **แก้**: `if (data.status !== 'draft' && data.status !== 'rejected')`

### `edit-request/[id].vue` Additional Fixes
- ใช้ fresh token ใน `fetchApplication`, `uploadNewFiles`, `callUpdate`
- แทนที่ mock PO data ด้วย real `listpo` API call
- เพิ่ม loading/error state สำหรับ PO table

---

## 11. `new-factoring-request.vue` — Credit Facility Widget

```typescript
const CREDIT_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/getcreditfacility';

const credit = ref({
    has_facility : false,
    credit_limit : 0,   // Total Credit Limit — credit_line facility
    already_used : 0,   // Already Used — sum of drawdown facilities
    remaining    : 0,   // Remaining
    credit_period: null,
    interest_rate: null,
});
```

Cards UI: Purple (Total Credit Limit) → Orange (Already Used) → Green/Red (Remaining)

---

## 12. `gec/profile-list.vue` — Supplier Mapping

- ดึง profiles จาก `listprofile`
- Edit modal: เลือก supplier จาก `listsuppliers` dropdown (preload on open)
- PATCH ไปที่ `updateprofile` ด้วย `{ target_user_id, supplier_code, supplier_name }`
- Blur delay 200ms เพื่อให้ click dropdown ได้ก่อน blur ปิด

---

## 13. `po_list.vue` (GEC) — Edge Function `listallpo`

```
GET /listallpo?search=&status=&limit=200&offset=0
```
- Auth: JWT + role check (`gec` only → 403 otherwise)
- Query: `purchase_orders` table ทั้งหมด (ไม่ filter supplier)
- Response: `{ data: [...], total: N }`
- Export: download CSV พร้อม UTF-8 BOM (รองรับ Excel ภาษาไทย)

---

## 14. สิ่งที่ยังไม่ได้ทำ / อาจต้องทำต่อ

- [ ] GEC Dashboard (analytics/summary cards)
- [ ] Notification system (real-time หรือ polling)
- [ ] File preview for uploaded documents (PDF viewer)
- [ ] `listapplication` — ตรวจสอบว่า GEC JWT ผ่านหรือต้องแยก role check
- [ ] Export Excel สำหรับ request list
- [ ] Pagination ปุ่มหน้าถัดไปใน `gec/request-list` (ตอนนี้ render ทุกหน้า — ควรทำ ellipsis เหมือน po_list)
