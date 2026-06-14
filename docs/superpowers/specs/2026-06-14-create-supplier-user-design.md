# Design: Create Supplier User from Contact

**Date:** 2026-06-14
**Status:** Approved

## Overview

เพิ่มปุ่ม "สร้าง User Account" บนหน้า Contact Detail สำหรับ contact ที่ map supplier_code แล้วและมี email ระบบจะสร้าง Supabase auth account + profile และส่ง invite email ให้ supplier ตั้งรหัสผ่านเอง

## Scope

ทำงานเฉพาะ contact ที่ผ่านเงื่อนไขทั้งสามพร้อมกัน:

- `supplier_code` ≠ null
- `email` ≠ null
- `linked_user_id` IS NULL (ยังไม่มี account)

## UI — `/gec/contacts/[id].vue`

### เงื่อนไขแสดงปุ่ม

```
v-if="selectedSupplier && metadata.email && !metadata.linked_user_id"
```

### ตำแหน่ง

แทรกใต้ selectedSupplier block (บรรทัดหลังแสดง supplier ที่ selected) อยู่ใน `md:col-span-2` เดียวกับ "มี Account แล้ว" badge

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  👤  ยังไม่มี Account                                   │
│      [+ สร้าง User Account]                             │
└─────────────────────────────────────────────────────────┘
```

ปุ่มใช้ class `btn btn-outline-primary` ขนาดปกติ

### Confirmation Dialog

Dialog ยืนยันก่อนดำเนินการ แสดงข้อมูลสรุป:

- ชื่อ: `contact.name`
- Email: `contact.email`
- Supplier Code: `contact.supplier_code`
- ข้อความแจ้ง: "ระบบจะส่ง email ไปยัง [email] เพื่อให้ตั้งรหัสผ่าน"

ปุ่มใน dialog: `[ยกเลิก]` / `[ยืนยัน สร้าง Account]`

### หลังสร้างสำเร็จ

- แสดง toast success
- อัปเดต `metadata.linked_user_id` ใน local state โดยไม่ต้อง reload หน้า
- ส่วน "มี Account แล้ว" badge แสดงขึ้นมาแทนปุ่มอัตโนมัติ

## Edge Function: `create-supplier-user`

**Path:** `supabase/functions/create-supplier-user/index.ts`

**Method:** POST

**Auth:** Bearer JWT ของ GEC admin — ตรวจสอบ caller role = 'gec' ผ่าน service_role

### Request

```json
{ "contact_id": 42 }
```

### Response (success)

```json
{ "success": true, "user_id": "uuid" }
```

### Logic

```
1. ดึง contact WHERE id = contact_id
2. Validate: supplier_code != null, email != null, linked_user_id IS NULL
3. ตรวจสอบ email ไม่ซ้ำใน auth.users
4. auth.admin.inviteUserByEmail(email, {
     redirectTo: `${APP_URL}/auth/set-password`,
     data: { full_name, supplier_code, supplier_name }
   })
5. INSERT profiles {
     id             = user.id,
     email, full_name, company_name,
     role           = 'supplier',
     status         = 'pending',
     supplier_code, supplier_name,
     must_change_password = true
   }
6. UPDATE contacts SET linked_user_id = user.id WHERE id = contact_id
7. Return { success: true, user_id: user.id }
```

### Error Responses

| สถานการณ์ | HTTP | Message |
|-----------|------|---------|
| contact ไม่พบ | 404 | Contact not found |
| ไม่มี email หรือ supplier_code | 400 | Missing email or supplier_code |
| linked_user_id มีอยู่แล้ว | 409 | Account already exists for this contact |
| email มีใน auth.users แล้ว | 409 | Email already registered |
| Supabase invite fail | 500 | Failed to create user: [error] |

## Data Flow

```
Admin กดปุ่ม "สร้าง User Account"
        │
        ▼
Confirmation Dialog → ยืนยัน
        │
        ▼
POST /create-supplier-user { contact_id }
        │
        ├── INSERT profiles (status='pending', must_change_password=true)
        ├── UPDATE contacts SET linked_user_id = user.id
        └── Supabase ส่ง Invite Email → supplier email
                │
                ▼
        Supplier คลิกลิงก์ใน email
                │
                ▼
        /auth/set-password?token=xxx&type=recovery
                │
                ├── ตั้ง password ใหม่
                └── เรียก activateprofile edge function
                        │
                        └── UPDATE profiles SET
                              status = 'active',
                              must_change_password = false
                                │
                                ▼
                        Sign out → /auth/cover-login
                                │
                                ▼
                        Supplier login → middleware → /supplier/request-list
```

## Supabase Dashboard Config

ต้องตั้งค่า Invite Email template ใน Authentication → Email Templates:

- **Redirect URL whitelist** เพิ่ม `<APP_URL>/auth/set-password`
- **Invite template** ปรับ subject และ body ให้สื่อถึง NEX Finance

> `APP_URL` ใน Edge Function อ่านจาก Supabase secret `APP_URL` (ตั้งผ่าน `supabase secrets set APP_URL=https://...`) ไม่ใช่ env var ของ Nuxt

## สิ่งที่ไม่ต้องสร้างใหม่

| ส่วน | สถานะ |
|------|-------|
| `/auth/set-password` page | ✓ มีอยู่แล้ว |
| `activateprofile` edge function | ✓ มีอยู่แล้ว |
| middleware role guard (supplier) | ✓ มีอยู่แล้ว |
| profiles.supplier_code field | ✓ มีอยู่แล้ว |

## สิ่งที่ต้องสร้างใหม่

1. **Edge Function** `create-supplier-user` — Supabase
2. **UI** ปุ่ม + dialog ใน `/gec/contacts/[id].vue`
3. **Supabase Dashboard** ตั้งค่า redirect URL และ invite email template
