# Load Draft — New Line Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เมื่อ supplier กด Edit บน draft ระบบโหลดข้อมูลเดิมมาแสดงในฟอร์ม New Line Application ให้ครบทุกฟิลด์รวมถึงสถานะ uploaded ของเอกสาร

**Architecture:** เพิ่ม `fileName` field ใน document type และ `loadDraft(id)` function ใน `useSupplierLineApplication.ts` ที่ query Supabase โดยตรง แล้วให้ `new-line-application.vue` เรียก `loadDraft` ใน `onMounted` เมื่อเจอ `?draft=` query param

**Tech Stack:** Nuxt 3, Vue 3 Composition API, Supabase JS client, TypeScript

---

## File Structure

| File | การเปลี่ยนแปลง |
|---|---|
| `composables/useSupplierLineApplication.ts` | เพิ่ม `fileName` field + fix `handleFileUpload` + เพิ่ม `loadDraft()` + export |
| `pages/supplier/new-line-application.vue` | เพิ่ม `onMounted` + `isLoadingDraft` + loading overlay + fix document filename display |

---

### Task 1: เพิ่ม `fileName` field และแก้ `handleFileUpload` ใน composable

**Files:**
- Modify: `composables/useSupplierLineApplication.ts`

**Context:** ไฟล์นี้เป็น composable หลักที่ manage state ของฟอร์ม ปัจจุบัน document object ไม่มี `fileName` field และ `handleFileUpload` ไม่ clear `filePath` เมื่อ user เลือกไฟล์ใหม่

- [ ] **Step 1: เพิ่ม `fileName: null` ในแต่ละ document object**

เปิดไฟล์ `composables/useSupplierLineApplication.ts` หา lines 36-40:

```ts
// เดิม
documents: [
    { docId: 'company_cert', docName: 'หนังสือรับรองบริษัท (อายุไม่เกิน 3 เดือน)', required: true, files: [] as File[], uploadStatus: 'pending', filePath: null as string | null },
    { docId: 'pp30',         docName: 'ภ.พ.30 (PP 30)',                              required: true, files: [] as File[], uploadStatus: 'pending', filePath: null as string | null },
    { docId: 'remittance',   docName: 'Remittance (ย้อนหลัง 3 เดือน)',              required: true, files: [] as File[], uploadStatus: 'pending', filePath: null as string | null },
],
```

แก้เป็น:

```ts
// ใหม่ — เพิ่ม fileName: null ใน document ทุกตัว
documents: [
    { docId: 'company_cert', docName: 'หนังสือรับรองบริษัท (อายุไม่เกิน 3 เดือน)', required: true, files: [] as File[], uploadStatus: 'pending', filePath: null as string | null, fileName: null as string | null },
    { docId: 'pp30',         docName: 'ภ.พ.30 (PP 30)',                              required: true, files: [] as File[], uploadStatus: 'pending', filePath: null as string | null, fileName: null as string | null },
    { docId: 'remittance',   docName: 'Remittance (ย้อนหลัง 3 เดือน)',              required: true, files: [] as File[], uploadStatus: 'pending', filePath: null as string | null, fileName: null as string | null },
],
```

- [ ] **Step 2: แก้ `handleFileUpload` ให้ clear `filePath` เมื่อเลือกไฟล์ใหม่**

หา function `handleFileUpload` (lines 58-65):

```ts
// เดิม
const handleFileUpload = (docId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const doc = application.value.documents.find((d) => d.docId === docId);
    if (doc) {
        doc.files = Array.from(files);
        doc.uploadStatus = 'uploaded';
    }
};
```

แก้เป็น:

```ts
// ใหม่ — clear filePath เพื่อให้ uploadFilesToStorage รู้ว่าต้อง re-upload
const handleFileUpload = (docId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const doc = application.value.documents.find((d) => d.docId === docId);
    if (doc) {
        doc.files        = Array.from(files);
        doc.uploadStatus = 'uploaded';
        doc.filePath     = null;
        doc.fileName     = null;
    }
};
```

- [ ] **Step 3: Verify ไฟล์ถูกต้อง**

```bash
grep -n "handleFileUpload\|fileName\|filePath" composables/useSupplierLineApplication.ts
```

Expected output ต้องเห็น `fileName` ใน documents array และ `doc.filePath = null` ใน handleFileUpload

---

### Task 2: เพิ่ม `loadDraft()` function ใน composable

**Files:**
- Modify: `composables/useSupplierLineApplication.ts`

**Context:** `loadDraft` จะ query `line_applications` + `line_application_documents` จาก Supabase โดยตรง (RLS `supplier_own_line_apps` และ `supplier_own_line_docs` อนุญาต supplier อ่าน own data ได้) แล้ว populate `application.value`

- [ ] **Step 1: เพิ่ม `loadDraft` function ก่อน `saveDraft`**

หา comment `// ── Save Draft ─────────────────────────────────────────────────────` แล้วเพิ่ม function ใหม่ก่อนหน้า:

```ts
// ── Load Draft ────────────────────────────────────────────────
const loadDraft = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    try {
        const { data: app, error: appErr } = await ($supabase as any)
            .from('line_applications')
            .select('id, status, company_name, tax_id, business_type, requested_credit_limit, credit_period')
            .eq('id', id)
            .single();

        if (appErr || !app) return { ok: false, error: 'ไม่พบ draft นี้' };

        const { data: docs, error: docErr } = await ($supabase as any)
            .from('line_application_documents')
            .select('doc_id, upload_status, file_path, file_name')
            .eq('application_id', id);

        if (docErr) return { ok: false, error: docErr.message };

        application.value.applicationId        = app.id;
        application.value.status               = app.status;
        application.value.companyName          = app.company_name ?? '';
        application.value.taxId                = app.tax_id ?? '';
        application.value.businessType         = app.business_type ?? '';
        application.value.requestedCreditLimit = app.requested_credit_limit ?? null;
        application.value.creditPeriod         = app.credit_period ?? null;

        for (const doc of application.value.documents) {
            const saved = (docs ?? []).find((d: any) => d.doc_id === doc.docId);
            if (saved) {
                doc.uploadStatus = saved.upload_status ?? 'pending';
                doc.filePath     = saved.file_path ?? null;
                doc.fileName     = saved.file_name ?? null;
            }
        }

        isSaved.value = true;
        return { ok: true };
    } catch (err: any) {
        return { ok: false, error: err.message };
    }
};
```

- [ ] **Step 2: Export `loadDraft` จาก return statement**

หา return statement ท้าย composable:

```ts
// เดิม
return { application, uploadProgress, isFormValid, isSaved, saveDraft, submitApplication, handleFileUpload };
```

แก้เป็น:

```ts
// ใหม่
return { application, uploadProgress, isFormValid, isSaved, loadDraft, saveDraft, submitApplication, handleFileUpload };
```

- [ ] **Step 3: Verify ไฟล์ถูกต้อง**

```bash
grep -n "loadDraft\|return {" composables/useSupplierLineApplication.ts
```

Expected: เห็น `loadDraft` ทั้งใน function definition และใน return statement

- [ ] **Step 4: Commit Task 1 + 2**

```bash
git add composables/useSupplierLineApplication.ts
git commit -m "feat: add loadDraft function and fileName field to line application composable"
```

---

### Task 3: แก้ page ให้โหลด draft จาก query param + loading overlay + document filename display

**Files:**
- Modify: `pages/supplier/new-line-application.vue`

**Context:** Page ปัจจุบัน import แค่ `{ ref, computed }` และ destructure composable โดยไม่มี `loadDraft` ต้องเพิ่ม `onMounted`, `useRoute`, `isLoadingDraft`, และแก้ template 2 จุด

- [ ] **Step 1: แก้ script imports และ destructuring**

หา section `<script setup lang="ts">` (line 148-157):

```ts
// เดิม
import { ref, computed } from 'vue';
import { useSupplierLineApplication } from '@/composables/useSupplierLineApplication';
import Swal from 'sweetalert2';

useHead({ title: 'New Line Application - NEX Finance' });
definePageMeta({ layout: 'default' });

const { application, uploadProgress, isFormValid, saveDraft, submitApplication, handleFileUpload } = useSupplierLineApplication();

const lastSaved = ref('');
```

แก้เป็น:

```ts
// ใหม่
import { ref, onMounted } from 'vue';
import { useSupplierLineApplication } from '@/composables/useSupplierLineApplication';
import Swal from 'sweetalert2';

useHead({ title: 'New Line Application - NEX Finance' });
definePageMeta({ layout: 'default' });

const route = useRoute();
const { application, uploadProgress, isFormValid, isSaved, loadDraft, saveDraft, submitApplication, handleFileUpload } = useSupplierLineApplication();

const lastSaved       = ref('');
const isLoadingDraft  = ref(false);
```

- [ ] **Step 2: เพิ่ม `onMounted` block หลัง `isLoadingDraft`**

เพิ่มหลัง `const isLoadingDraft = ref(false);`:

```ts
onMounted(async () => {
    const draftId = route.query.draft as string | undefined;
    if (!draftId) return;

    isLoadingDraft.value = true;
    const result = await loadDraft(draftId);
    isLoadingDraft.value = false;

    if (!result.ok) {
        Swal.fire({
            icon            : 'error',
            title           : 'โหลด Draft ไม่สำเร็จ',
            text            : result.error,
            confirmButtonColor: '#e7515a',
        });
    }
});
```

- [ ] **Step 3: เพิ่ม loading overlay ใน template**

หา `<template>` เปิดสุด (line 1-2) แล้วเพิ่ม overlay เป็น element แรกใน `<div>`:

```html
<template>
    <div>
        <!-- Draft loading overlay -->
        <div v-if="isLoadingDraft" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div class="bg-white dark:bg-[#1b2e4b] rounded-xl p-6 flex items-center gap-3 shadow-xl">
                <span class="inline-block h-5 w-5 animate-spin rounded-full border-[3px] border-primary border-l-transparent"></span>
                <span class="font-medium text-dark dark:text-white-light">กำลังโหลด draft...</span>
            </div>
        </div>

        <!-- Header Bar -->
        ...
```

- [ ] **Step 4: แก้ document filename display ใน template**

หา section แสดงชื่อไฟล์ (lines 100-102):

```html
<!-- เดิม -->
<p class="text-xs text-white-dark" v-if="doc.files.length > 0">
    Files: {{ doc.files.map((f: any) => f.name).join(', ') }}
</p>
```

แก้เป็น:

```html
<!-- ใหม่ — fallback ไปที่ fileName จาก DB เมื่อไม่มี File object -->
<p class="text-xs text-white-dark" v-if="doc.files.length > 0 || doc.fileName">
    Files: {{ doc.files.length > 0 ? doc.files.map((f: any) => f.name).join(', ') : doc.fileName }}
</p>
```

- [ ] **Step 5: ตรวจสอบ template ไม่มี `computed` ที่ import แล้วไม่ได้ใช้**

```bash
grep -n "computed\|onMounted\|isLoadingDraft\|loadDraft\|isSaved" pages/supplier/new-line-application.vue
```

Expected: ไม่มี `computed` ใน imports (ถูก remove แล้ว) และเห็น `onMounted`, `isLoadingDraft`, `loadDraft` ทั้งใน script และ template

- [ ] **Step 6: Commit**

```bash
git add pages/supplier/new-line-application.vue
git commit -m "feat: load draft data on mount in new-line-application page"
```

---

### Task 4: Manual verification

**Files:** ไม่มีการแก้ไขไฟล์

**Context:** Project นี้ไม่มี test runner ตรวจ logic โดยตรงจาก unit test ต้อง verify ผ่าน browser

- [ ] **Step 1: Start dev server**

```bash
cd /Volumes/WDSSD/GECnexproject/raw/nuxt-ifs
pnpm dev
```

Expected: server ขึ้น `http://localhost:3000`

- [ ] **Step 2: Login เป็น supplier แล้วไปที่ Request List**

ไปที่ `http://localhost:3000/supplier/request-list` ตรวจว่ามี draft LINE-* อยู่

- [ ] **Step 3: กด Edit บน draft ที่มีข้อมูลครบ**

Expected:
- URL เปลี่ยนเป็น `/supplier/new-line-application?draft=LINE-XXXX-XXXXX`
- แสดง loading overlay "กำลังโหลด draft..." ชั่วครู่
- ฟอร์มแสดงข้อมูลเดิม: Business Type, Credit Limit, Credit Period
- เอกสารที่เคย upload แสดง badge "Uploaded" + ชื่อไฟล์จาก DB

- [ ] **Step 4: ทดสอบ Save Draft หลังโหลด**

แก้ Credit Limit แล้วกด Save Draft

Expected: ไม่เกิด error, toast "Draft saved successfully", ข้อมูลใหม่ถูกบันทึก

- [ ] **Step 5: ทดสอบ Change Files หลังโหลด**

กด "Change Files" บนเอกสารที่ uploaded แล้ว แล้วเลือกไฟล์ใหม่

Expected:
- badge เปลี่ยนเป็น "Uploaded"
- ชื่อไฟล์ใหม่ปรากฏ
- กด Save Draft → ไฟล์ใหม่ถูก upload ไปที่ Storage (ไม่ถูก skip)

- [ ] **Step 6: ทดสอบ URL ไม่มี draft param**

ไปที่ `http://localhost:3000/supplier/new-line-application` (ไม่มี `?draft=`)

Expected: ฟอร์มว่างเปล่าตามปกติ ไม่มี loading overlay

- [ ] **Step 7: ทดสอบ draft id ไม่ถูกต้อง**

ไปที่ `http://localhost:3000/supplier/new-line-application?draft=LINE-INVALID`

Expected: error toast "โหลด Draft ไม่สำเร็จ" ปรากฏ, ฟอร์มว่างเปล่า (ยังใช้งานได้)
