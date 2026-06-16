# Load Draft — New Line Application Form Design

## Goal

เมื่อ supplier กด Edit บน draft จาก Request List ระบบนำทางไปยัง `/supplier/new-line-application?draft=<id>` และฟอร์มต้องโหลดข้อมูล draft เดิมมาแสดงให้ครบทุกฟิลด์ รวมถึงสถานะ uploaded ของเอกสาร

---

## Context

- `pages/supplier/request-list.vue` ส่ง route ไป `/supplier/new-line-application?draft=${req.id}` สำหรับ draft ที่เป็น `credit_line`
- `pages/supplier/new-line-application.vue` ปัจจุบัน **ไม่อ่าน** `?draft=` query param เลย — ฟอร์มเริ่มว่างเปล่าเสมอ
- `composables/useSupplierLineApplication.ts` ไม่มี load function — มีแต่ save/submit
- ข้อมูลถูกเก็บใน `line_applications` + `line_application_documents` ซึ่ง supplier อ่านได้ผ่าน RLS policy `supplier_own_line_apps` / `supplier_own_line_docs`

---

## Architecture

### Files ที่แก้

| File | การเปลี่ยนแปลง |
|---|---|
| `composables/useSupplierLineApplication.ts` | เพิ่ม `fileName` field ใน doc type + เพิ่ม `loadDraft(id)` function |
| `pages/supplier/new-line-application.vue` | เพิ่ม `isLoadingDraft` state + `onMounted` logic + loading overlay + document display fix |

---

## Detailed Design

### 1. Document type — เพิ่ม `fileName` field

เพิ่ม `fileName: string | null` ในแต่ละ document object ของ `application.documents`:

```ts
{ docId: 'company_cert', docName: '...', required: true, files: [], uploadStatus: 'pending', filePath: null, fileName: null }
```

ใช้ `fileName` สำหรับแสดงชื่อไฟล์ที่เคย upload ไว้ใน DB เมื่อไม่มี `File` object (กรณีโหลด draft)

### 2. `loadDraft(id: string)` ใน composable

```ts
const loadDraft = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    try {
        // fetch line_applications
        const { data: app, error: appErr } = await ($supabase as any)
            .from('line_applications')
            .select('*')
            .eq('id', id)
            .single();
        if (appErr || !app) return { ok: false, error: 'ไม่พบ draft นี้' };

        // fetch line_application_documents
        const { data: docs, error: docErr } = await ($supabase as any)
            .from('line_application_documents')
            .select('*')
            .eq('application_id', id);
        if (docErr) return { ok: false, error: docErr.message };

        // populate application state
        application.value.applicationId       = app.id;
        application.value.status              = app.status;
        application.value.companyName         = app.company_name ?? '';
        application.value.taxId               = app.tax_id ?? '';
        application.value.businessType        = app.business_type ?? '';
        application.value.requestedCreditLimit = app.requested_credit_limit ?? null;
        application.value.creditPeriod        = app.credit_period ?? null;

        // map documents by doc_id
        for (const doc of application.value.documents) {
            const saved = docs?.find((d: any) => d.doc_id === doc.docId);
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

Export `loadDraft` จาก return ของ composable

### 3. Page — `onMounted` + loading state

```ts
import { ref, onMounted } from 'vue';

const route          = useRoute();
const isLoadingDraft = ref(false);

const { application, uploadProgress, isFormValid, isSaved, saveDraft, submitApplication, handleFileUpload, loadDraft } = useSupplierLineApplication();

onMounted(async () => {
    const draftId = route.query.draft as string | undefined;
    if (!draftId) return;

    isLoadingDraft.value = true;
    const result = await loadDraft(draftId);
    isLoadingDraft.value = false;

    if (!result.ok) {
        Swal.fire({ icon: 'error', title: 'โหลด Draft ไม่สำเร็จ', text: result.error, confirmButtonColor: '#e7515a' });
    }
});
```

### 4. Template — Loading overlay

แสดง overlay ขณะโหลด:

```html
<div v-if="isLoadingDraft" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
    <div class="bg-white rounded-xl p-6 flex items-center gap-3 shadow-xl">
        <span class="inline-block h-5 w-5 animate-spin rounded-full border-3 border-primary border-l-transparent"></span>
        <span class="font-medium">กำลังโหลด draft...</span>
    </div>
</div>
```

### 5. Template — Document filename display fix

แก้การแสดงชื่อไฟล์ในรายการเอกสาร ให้ fallback ไปที่ `doc.fileName` เมื่อไม่มี `File` object:

```html
<!-- เดิม -->
<p class="text-xs text-white-dark" v-if="doc.files.length > 0">
    Files: {{ doc.files.map((f: any) => f.name).join(', ') }}
</p>

<!-- ใหม่ -->
<p class="text-xs text-white-dark" v-if="doc.files.length > 0 || doc.fileName">
    Files: {{ doc.files.length > 0 ? doc.files.map((f: any) => f.name).join(', ') : doc.fileName }}
</p>
```

---

## Data Flow

```
URL: /supplier/new-line-application?draft=LINE-2606-00001
        │
        ▼ onMounted
  route.query.draft → loadDraft('LINE-2606-00001')
        │
        ├── query line_applications → populate Section 1 fields
        ├── query line_application_documents → populate doc status + fileName
        └── isSaved = true (ทำให้ save/submit ครั้งต่อไปใช้ PATCH แทน POST)
```

---

## Edge Cases

| กรณี | พฤติกรรม |
|---|---|
| ไม่มี `?draft=` query | ฟอร์มเปิดใหม่ว่างเปล่าตามปกติ |
| `?draft=` ชี้ไปยัง id ที่ไม่มีหรือเป็นของคนอื่น | RLS block → error toast → ฟอร์มยังใช้งานได้ (blank) |
| Draft ที่ upload ไฟล์แล้ว | `uploadStatus = 'uploaded'`, `filePath` มีค่า, `fileName` แสดงชื่อไฟล์เดิม |
| Document ใน DB น้อยกว่า template | doc ที่ไม่มีใน DB คง `pending` ไว้ตามค่า default |
| Re-upload ไฟล์หลังโหลด draft | `handleFileUpload` ต้อง clear `doc.filePath = null` เมื่อ user เลือกไฟล์ใหม่ — ไม่งั้น `uploadFilesToStorage` จะ skip เพราะ `filePath` ยังมีค่าเดิม |

---

## ไม่ทำในขอบเขตนี้

- ไม่แก้ `new-factoring-request.vue` (คนละ composable, แยก scope)
- ไม่แก้ logic การ re-upload ไฟล์ (ใช้ existing `upsert: true` ของ Storage)
- ไม่เพิ่ม draft auto-save
