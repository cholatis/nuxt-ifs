# Create Supplier User Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มปุ่ม "สร้าง User Account" บนหน้า Contact Detail ให้ GEC admin สร้าง Supabase auth account พร้อม profile ให้ contact ที่ map supplier_code และมี email แล้ว โดยส่ง invite email ให้ supplier ตั้งรหัสผ่านเอง

**Architecture:** Frontend เรียก Edge Function `create-supplier-user` ผ่าน Bearer JWT ของ admin — Edge Function ใช้ service_role เรียก `auth.admin.inviteUserByEmail` สร้าง user + INSERT profiles + UPDATE contacts.linked_user_id ในคำสั่งเดียว หน้า `/auth/set-password` ที่มีอยู่แล้วรองรับ token flow ของ invite link

**Tech Stack:** Nuxt 3, Vue 3 Composition API, Supabase Edge Functions (Deno), Supabase Auth Admin API, TypeScript

---

## File Structure

| ไฟล์ | Action | หน้าที่ |
|------|--------|---------|
| `supabase/functions/create-supplier-user/index.ts` | **Create** | Edge Function รับ contact_id → สร้าง auth user → insert profile → update contact |
| `pages/gec/contacts/[id].vue` | **Modify** | เพิ่ม state, computed, function สร้าง user, UI ปุ่ม + confirmation dialog |

---

## Task 1: สร้าง Edge Function `create-supplier-user`

**Files:**
- Create: `supabase/functions/create-supplier-user/index.ts`

- [ ] **Step 1: สร้างโฟลเดอร์และไฟล์ Edge Function**

```bash
mkdir -p supabase/functions/create-supplier-user
touch supabase/functions/create-supplier-user/index.ts
```

- [ ] **Step 2: เขียน Edge Function**

เขียนไฟล์ `supabase/functions/create-supplier-user/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL              = Deno.env.get('APP_URL')!;

const corsHeaders = {
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // ── 1. ตรวจสอบ caller เป็น GEC admin ──────────────────
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return json({ error: 'Unauthorized' }, 401);
        }

        const callerClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
        if (callerErr || !caller) {
            return json({ error: 'Unauthorized' }, 401);
        }

        const { data: callerProfile, error: profileErr } = await callerClient
            .from('profiles')
            .select('role')
            .eq('id', caller.id)
            .single();

        if (profileErr || callerProfile?.role !== 'gec') {
            return json({ error: 'Forbidden: GEC role required' }, 403);
        }

        // ── 2. อ่าน request body ───────────────────────────────
        const { contact_id } = await req.json();
        if (!contact_id) {
            return json({ error: 'contact_id is required' }, 400);
        }

        // ── 3. service_role client สำหรับ admin operations ─────
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // ── 4. ดึง contact ────────────────────────────────────
        const { data: contact, error: contactErr } = await adminClient
            .from('contacts')
            .select('id, name, email, company_name, supplier_code, supplier_name, linked_user_id')
            .eq('id', contact_id)
            .single();

        if (contactErr || !contact) {
            return json({ error: 'Contact not found' }, 404);
        }

        // ── 5. Validate ────────────────────────────────────────
        if (!contact.email) {
            return json({ error: 'Contact has no email' }, 400);
        }
        if (!contact.supplier_code) {
            return json({ error: 'Contact has no supplier_code' }, 400);
        }
        if (contact.linked_user_id) {
            return json({ error: 'Account already exists for this contact' }, 409);
        }

        // ── 6. ตรวจว่า email ยังไม่มีใน auth.users ────────────
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const emailTaken = existingUsers?.users?.some((u: any) => u.email === contact.email);
        if (emailTaken) {
            return json({ error: 'Email already registered' }, 409);
        }

        // ── 7. Invite user (สร้าง account + ส่ง email) ─────────
        const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
            contact.email,
            {
                redirectTo: `${APP_URL}/auth/set-password`,
                data: {
                    full_name     : contact.name,
                    supplier_code : contact.supplier_code,
                    supplier_name : contact.supplier_name ?? '',
                },
            }
        );

        if (inviteErr || !inviteData?.user) {
            return json({ error: `Failed to create user: ${inviteErr?.message}` }, 500);
        }

        const userId = inviteData.user.id;

        // ── 8. INSERT profiles ─────────────────────────────────
        const { error: profileInsertErr } = await adminClient
            .from('profiles')
            .insert({
                id                   : userId,
                email                : contact.email,
                full_name            : contact.name,
                company_name         : contact.company_name ?? null,
                role                 : 'supplier',
                status               : 'pending',
                supplier_code        : contact.supplier_code,
                supplier_name        : contact.supplier_name ?? null,
                must_change_password : true,
            });

        if (profileInsertErr) {
            // rollback: ลบ user ที่เพิ่งสร้าง
            await adminClient.auth.admin.deleteUser(userId);
            return json({ error: `Failed to create profile: ${profileInsertErr.message}` }, 500);
        }

        // ── 9. UPDATE contacts.linked_user_id ─────────────────
        const { error: updateErr } = await adminClient
            .from('contacts')
            .update({ linked_user_id: userId })
            .eq('id', contact_id);

        if (updateErr) {
            return json({ error: `Failed to link contact: ${updateErr.message}` }, 500);
        }

        return json({ success: true, user_id: userId }, 200);

    } catch (err: any) {
        return json({ error: err.message ?? 'Internal server error' }, 500);
    }
});

function json(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}
```

- [ ] **Step 3: ตั้งค่า APP_URL secret ใน Supabase**

```bash
supabase secrets set APP_URL=https://your-app-domain.com --project-ref oyynkpgjmfntrrrnrzto
```

> แทน `https://your-app-domain.com` ด้วย URL จริงของ app

- [ ] **Step 4: Deploy Edge Function**

```bash
supabase functions deploy create-supplier-user --project-ref oyynkpgjmfntrrrnrzto
```

Expected output:
```
Deployed Function create-supplier-user on project oyynkpgjmfntrrrnrzto
```

- [ ] **Step 5: ทดสอบ Edge Function ด้วย curl**

ก่อนทดสอบ ต้องมี JWT ของ GEC admin (login แล้ว copy จาก localStorage หรือ devtools):

```bash
curl -X POST https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/create-supplier-user \
  -H "Authorization: Bearer <GEC_ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"contact_id": <CONTACT_ID_ที่มี_supplier_code_และ_email>}'
```

Expected response (success):
```json
{ "success": true, "user_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }
```

ตรวจสอบ error cases:
```bash
# contact ไม่มี linked_user_id ซ้ำ (สร้างครั้งที่ 2)
# Expected: 409 { "error": "Account already exists for this contact" }

# contact ไม่มี supplier_code
# Expected: 400 { "error": "Contact has no supplier_code" }
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/create-supplier-user/index.ts
git commit -m "feat: add create-supplier-user edge function"
```

---

## Task 2: ตั้งค่า Supabase Dashboard

- [ ] **Step 1: เพิ่ม Redirect URL whitelist**

ไปที่ [Supabase Dashboard](https://supabase.com/dashboard) → Project `oyynkpgjmfntrrrnrzto` → **Authentication → URL Configuration**

เพิ่ม URL ใน **Redirect URLs**:
```
https://your-app-domain.com/auth/set-password
```

- [ ] **Step 2: ปรับ Invite Email Template (optional แต่แนะนำ)**

ไปที่ **Authentication → Email Templates → Invite user**

ปรับ Subject เป็น:
```
ยินดีต้อนรับสู่ NEX Finance — ตั้งรหัสผ่านของคุณ
```

ปรับ Body ให้ link ชี้ไปที่ `{{ .ConfirmationURL }}` (Supabase จะใส่ redirect URL ให้อัตโนมัติ)

---

## Task 3: เพิ่ม UI บน Contact Detail Page

**Files:**
- Modify: `pages/gec/contacts/[id].vue`

- [ ] **Step 1: เพิ่ม constant URL และ reactive state**

ใน `<script lang="ts" setup>` หลังบรรทัด `const LISTSUPPLIERS_URL = ...` เพิ่ม:

```typescript
const CREATE_USER_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/create-supplier-user';

// ── Create User Dialog ────────────────────────────────────
const showCreateUserDialog = ref(false);
const isCreatingUser       = ref(false);
const createUserError      = ref('');
```

- [ ] **Step 2: เพิ่ม function `createUserAccount`**

เพิ่มใน `<script>` ก่อน `onMounted`:

```typescript
const createUserAccount = async () => {
    isCreatingUser.value  = true;
    createUserError.value = '';
    try {
        const res = await fetch(CREATE_USER_URL, {
            method : 'POST',
            headers: {
                'Authorization': `Bearer ${authStore.accessToken}`,
                'Content-Type' : 'application/json',
            },
            body: JSON.stringify({ contact_id: Number(route.params.id) }),
        });

        const data = await res.json();
        if (!res.ok) {
            createUserError.value = data.error ?? 'เกิดข้อผิดพลาด';
            return;
        }

        // อัปเดต local state โดยไม่ต้อง reload
        metadata.linked_user_id = data.user_id;
        showCreateUserDialog.value = false;
    } catch (err: any) {
        createUserError.value = err.message ?? 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
    } finally {
        isCreatingUser.value = false;
    }
};
```

- [ ] **Step 3: เพิ่ม UI ปุ่มและ dialog ใน `<template>`**

ใน `<template>` หา block `<!-- Account status badge -->` (บรรทัดที่มี `v-if="metadata.linked_user_id"`) แล้วแทนที่ block นั้นทั้งหมดด้วย:

```html
<!-- Account status -->
<div class="md:col-span-2">
    <!-- มี Account แล้ว -->
    <div v-if="metadata.linked_user_id" class="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
        <icon-check class="h-5 w-5 text-success shrink-0" />
        <div>
            <p class="text-sm font-semibold text-success">มี Account แล้ว</p>
            <p class="text-xs text-white-dark">User ID: {{ metadata.linked_user_id }}</p>
        </div>
    </div>

    <!-- ยังไม่มี Account — แสดงเมื่อ eligible -->
    <div
        v-else-if="selectedSupplier && form.email && !metadata.linked_user_id"
        class="flex items-center justify-between rounded-lg border border-[#e0e6ed] bg-[#fafafa] px-4 py-3 dark:border-[#1b2e4b] dark:bg-[#1b2e4b]"
    >
        <div class="flex items-center gap-2">
            <icon-user class="h-5 w-5 text-white-dark shrink-0" />
            <p class="text-sm text-white-dark">ยังไม่มี Account</p>
        </div>
        <button
            type="button"
            class="btn btn-outline-primary btn-sm gap-1"
            @click="showCreateUserDialog = true"
        >
            <icon-user-plus class="h-4 w-4" />
            สร้าง User Account
        </button>
    </div>
</div>

<!-- Confirmation Dialog -->
<Teleport to="body">
    <TransitionRoot appear :show="showCreateUserDialog" as="template">
        <Dialog as="div" @close="showCreateUserDialog = false" class="relative z-50">
            <TransitionChild as="template"
                enter="duration-200 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                leave="duration-150 ease-in"  leave-from="opacity-100" leave-to="opacity-0">
                <div class="fixed inset-0 bg-black/60" />
            </TransitionChild>

            <div class="fixed inset-0 flex items-center justify-center p-4">
                <TransitionChild as="template"
                    enter="duration-200 ease-out" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100"
                    leave="duration-150 ease-in"  leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
                    <DialogPanel class="w-full max-w-md rounded-xl bg-white p-6 dark:bg-[#1b2e4b]">
                        <DialogTitle class="mb-4 text-lg font-bold dark:text-white">
                            ยืนยันการสร้าง User Account
                        </DialogTitle>

                        <div class="mb-5 space-y-2 rounded-lg bg-gray-50 dark:bg-[#0e1726] p-4 text-sm">
                            <p class="text-white-dark">ชื่อ: <span class="font-semibold text-dark dark:text-white">{{ form.name }}</span></p>
                            <p class="text-white-dark">Email: <span class="font-semibold text-dark dark:text-white">{{ form.email }}</span></p>
                            <p class="text-white-dark">Supplier Code: <span class="font-mono font-semibold text-primary">{{ selectedSupplier?.supplier_code }}</span></p>
                        </div>

                        <p class="mb-5 text-sm text-white-dark">
                            ระบบจะส่ง email ไปยัง <span class="font-semibold text-dark dark:text-white">{{ form.email }}</span> เพื่อให้ตั้งรหัสผ่าน
                        </p>

                        <div v-if="createUserError" class="mb-4 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                            {{ createUserError }}
                        </div>

                        <div class="flex justify-end gap-3">
                            <button
                                type="button"
                                class="btn btn-outline-secondary"
                                :disabled="isCreatingUser"
                                @click="showCreateUserDialog = false; createUserError = ''"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                class="btn btn-primary"
                                :disabled="isCreatingUser"
                                @click="createUserAccount"
                            >
                                <span v-if="isCreatingUser" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                {{ isCreatingUser ? 'กำลังสร้าง...' : 'ยืนยัน สร้าง Account' }}
                            </button>
                        </div>
                    </DialogPanel>
                </TransitionChild>
            </div>
        </Dialog>
    </TransitionRoot>
</Teleport>
```

- [ ] **Step 4: ตรวจสอบ imports**

ในส่วน `import` ของ `<script>` ตรวจว่ามี `Dialog`, `DialogPanel`, `DialogTitle`, `TransitionRoot`, `TransitionChild` import จาก `@headlessui/vue` แล้ว หากยังไม่มีให้เพิ่ม:

```typescript
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue';
```

และตรวจว่า `icon-user-plus` มีใน components (ดูจาก `components/icon/icon-user-plus.vue` ที่มีอยู่แล้ว ✓)

- [ ] **Step 5: ทดสอบ UI ใน browser**

1. `pnpm dev` แล้วเปิด `http://localhost:3000`
2. Login เป็น GEC admin
3. ไปที่ `/gec/contacts/[id]` ของ contact ที่มี supplier_code + email + ไม่มี linked_user_id
4. ตรวจว่าปุ่ม "สร้าง User Account" แสดงขึ้นมา
5. กดปุ่ม → dialog แสดงข้อมูลครบ
6. กด "ยืนยัน" → spinner แสดง → สำเร็จ → badge "มี Account แล้ว" แสดงแทน
7. ตรวจ email ว่า invite email ถูกส่ง
8. คลิกลิงก์ใน email → ไปที่ `/auth/set-password` → ตั้งรหัสผ่านได้ → login เป็น supplier ได้

- [ ] **Step 6: ทดสอบ error cases ใน UI**

1. กด "สร้าง User Account" บน contact ที่ email นั้นมี account แล้ว → dialog แสดง error message (409)
2. กด "ยกเลิก" ใน dialog → dialog ปิด error ล้าง

- [ ] **Step 7: Commit**

```bash
git add pages/gec/contacts/\[id\].vue
git commit -m "feat: add create supplier user button on contact detail page"
```

---

## Checklist หลัง Implementation เสร็จ

- [ ] Edge Function deploy สำเร็จ และ curl test ผ่าน
- [ ] Supabase Dashboard: redirect URL whitelist ถูกตั้งค่าแล้ว
- [ ] ปุ่มแสดงเฉพาะ contact ที่มี supplier_code + email + ไม่มี linked_user_id
- [ ] Dialog แสดงข้อมูลถูกต้อง
- [ ] หลังสร้างสำเร็จ badge "มี Account แล้ว" แสดงโดยไม่ต้อง reload
- [ ] Supplier ได้รับ email และตั้ง password ผ่าน `/auth/set-password` ได้
- [ ] Login เป็น supplier แล้ว middleware redirect ไป `/supplier/request-list`
