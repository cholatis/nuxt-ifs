# Factoring Request — Invoice File Upload Design

## Goal

เพิ่ม Section 3 "Upload Documents" ในหน้า New Factoring Request ให้ supplier อัปโหลดไฟล์ invoice ตัวจริง (PDF/ภาพ/ไฟล์ใดก็ได้ ไม่จำกัดจำนวน) พร้อมแก้ Section 1 ให้ scroll แทนที่จะยาวล้นหน้า

---

## Context

- `pages/supplier/new-factoring-request.vue` — หน้า form มี Section 1 (เลือก Invoice/PO) + Section 2 (Request Details)
- `composables/useSupplierFactoringRequest.ts` — state + API calls ผ่าน edge functions `createapplications` + `updateapplication`
- Supabase Storage bucket `document` — มี RLS policy `supplier_insert_documents` อนุญาต `app_metadata.role = 'supplier'`
- `application_documents` table — RLS `supplier_own_app_docs` อนุญาต INSERT เมื่อ `credit_applications` row ของ user มีอยู่แล้ว
- Edge functions `createapplications` / `updateapplication` ไม่ต้องแก้

---

## Files ที่แก้

| File | การเปลี่ยนแปลง |
|---|---|
| `composables/useSupplierFactoringRequest.ts` | เพิ่ม `files` state + `uploadFilesAndSave()` helper |
| `pages/supplier/new-factoring-request.vue` | Section 1 scroll fix + Section 3 upload UI |

---

## Detailed Design

### 1. Section 1 — Scroll Fix

เพิ่ม `max-h-[420px] overflow-y-auto` บน `<div class="table-responsive">` (line 156) ให้ตาราง invoice/PO scroll แทนยาวล้นหน้า header column ไม่ต้อง sticky (ความซับซ้อนไม่คุ้ม)

### 2. Composable — state ใหม่

เพิ่มใน `form` ref:
```ts
// ไม่เพิ่มใน form เพราะไม่ต้องส่งไปที่ edge function
```

เพิ่มเป็น ref แยกนอก form:
```ts
const invoiceFiles       = ref<File[]>([]);          // ไฟล์ที่ user เลือก (ยังไม่ upload)
const uploadedFilePaths  = ref<{path: string; name: string; size: number}[]>([]);  // track ไฟล์ที่ upload แล้ว
```

### 3. Composable — `addFiles` / `removeFile`

```ts
const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    // ป้องกัน duplicate filename
    const existing = new Set(invoiceFiles.value.map(f => f.name));
    invoiceFiles.value.push(...incoming.filter(f => !existing.has(f.name)));
};

const removeFile = (index: number) => {
    invoiceFiles.value.splice(index, 1);
};
```

### 4. Composable — `uploadInvoiceFiles()`

อัปโหลดเฉพาะไฟล์ที่ยังไม่เคย upload (ป้องกัน duplicate เมื่อ Save Draft หลายครั้ง) และ return `newUploads[]` เฉพาะที่ upload ในรอบนี้:

```ts
type UploadedFile = { path: string; name: string; size: number };

const uploadInvoiceFiles = async (): Promise<{ ok: boolean; failedFile?: string; newUploads: UploadedFile[] }> => {
    const { $supabase } = useNuxtApp();
    const requestId     = form.value.requestId;
    const newUploads: UploadedFile[] = [];

    const alreadyUploaded = new Set(uploadedFilePaths.value.map(u => u.name));

    for (const file of invoiceFiles.value) {
        if (alreadyUploaded.has(file.name)) continue;  // skip already uploaded this session

        const path = `${requestId}/invoice-files/${file.name}`;
        const { data, error } = await ($supabase as any)
            .storage
            .from('document')
            .upload(path, file, { upsert: true });

        if (error) return { ok: false, failedFile: `${file.name} (${error.message})`, newUploads };

        const entry = { path: data.path, name: file.name, size: file.size };
        uploadedFilePaths.value.push(entry);
        newUploads.push(entry);
    }
    return { ok: true, newUploads };
};
```

### 5. Composable — `saveDocumentRecords(newUploads)`

Insert เฉพาะ `newUploads` จากรอบปัจจุบันเท่านั้น — ป้องกัน duplicate row เพราะ `application_documents` ใช้ `uuid` PK ไม่มี unique constraint บน `(application_id, file_name)`:

```ts
const saveDocumentRecords = async (newUploads: UploadedFile[]) => {
    if (newUploads.length === 0) return;
    const { $supabase } = useNuxtApp();

    const rows = newUploads.map(u => ({
        application_id: form.value.requestId,
        doc_id        : 'invoice_files',
        doc_name      : u.name,
        file_path     : u.path,
        file_name     : u.name,
        file_size     : u.size,
        upload_status : 'uploaded',
    }));

    await ($supabase as any)
        .from('application_documents')
        .insert(rows);
};
```

### 6. Composable — แก้ `saveDraft` และ `submitRequest`

เพิ่มการ upload และ save records ในทั้งสอง function:

```ts
const saveDraft = async () => {
    try {
        // 1. Upload ไฟล์ใหม่
        const upload = await uploadInvoiceFiles();
        if (!upload.ok) throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${upload.failedFile}`);

        // 2. Save application
        const result = isSaved.value
            ? await callUpdate('draft')
            : await callCreate('draft');

        // 3. Save document records (only newly uploaded this round)
        await saveDocumentRecords(upload.newUploads);

        form.value.status = 'draft';
        isSaved.value     = true;
        return { success: true, timestamp: new Date().toLocaleTimeString(), data: result.data };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
};

const submitRequest = async () => {
    try {
        // 1. Upload ไฟล์ใหม่
        const upload = await uploadInvoiceFiles();
        if (!upload.ok) throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${upload.failedFile}`);

        // 2. Submit application
        const result = isSaved.value
            ? await callUpdate('under_review')
            : await callCreate('under_review');

        // 3. Save document records (only newly uploaded this round)
        await saveDocumentRecords(upload.newUploads);

        form.value.status = 'under_review';
        isSaved.value     = true;
        return { success: true, message: 'Submitted', data: result.data };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
};
```

Export เพิ่ม: `invoiceFiles`, `addFiles`, `removeFile`

### 7. Template — Section 3 Upload UI

เพิ่ม Section 3 ใต้ Section 2:

```html
<!-- Section 3 — Upload Documents -->
<div class="panel mb-5">
    <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
        Upload Documents
        <span class="text-sm font-normal text-white-dark ml-1">(ไม่บังคับ — PDF, รูปภาพ, หรือไฟล์อื่นๆ)</span>
    </h5>

    <!-- Drop zone / file input -->
    <label
        for="invoice-file-input"
        class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors"
        @dragover.prevent
        @drop.prevent="(e) => addFiles(e.dataTransfer?.files ?? null)"
    >
        <icon-upload class="w-8 h-8 text-primary/50 mb-2" />
        <span class="text-sm text-white-dark">ลากไฟล์มาวาง หรือ <span class="text-primary font-semibold">คลิกเพื่อเลือกไฟล์</span></span>
        <input id="invoice-file-input" type="file" class="hidden" multiple @change="(e: any) => addFiles(e.target.files)" />
    </label>

    <!-- File list -->
    <ul v-if="invoiceFiles.length > 0" class="mt-4 space-y-2">
        <li v-for="(file, idx) in invoiceFiles" :key="file.name"
            class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-[#191e3a] px-4 py-2 text-sm">
            <div class="flex items-center gap-2 min-w-0">
                <icon-file class="w-4 h-4 text-primary flex-none" />
                <span class="truncate dark:text-white-light">{{ file.name }}</span>
                <span class="text-white-dark flex-none">({{ (file.size / 1024).toFixed(1) }} KB)</span>
            </div>
            <button type="button" @click="removeFile(idx)" class="text-danger hover:text-danger/70 flex-none">✕</button>
        </li>
    </ul>
</div>
```

---

## Data Flow

```
User เลือกไฟล์ → invoiceFiles[] (browser memory)
                        │
        onSaveDraft / onSubmit
                        │
         uploadInvoiceFiles() → Storage bucket "document"
              path: {requestId}/invoice-files/{filename}
                        │
         callCreate / callUpdate → credit_applications row
                        │
         saveDocumentRecords() → application_documents
              (upsert on application_id + doc_id + file_name)
```

---

## Edge Cases

| กรณี | พฤติกรรม |
|---|---|
| ไม่เลือกไฟล์ | upload/save steps ถูก skip อัตโนมัติ — form submit ตามปกติ |
| เลือกไฟล์ชื่อซ้ำ | `addFiles` filter ออก ไม่เพิ่ม duplicate |
| Save Draft หลายครั้ง | `uploadedFilePaths` track ไฟล์ที่ upload แล้ว — ไฟล์เดิมถูก skip |
| Upload fail | error bubble ขึ้น error toast ทันที ไม่ submit |
| ไฟล์ใหญ่มาก | Storage รับได้ตาม Supabase limit — ไม่มี client-side size check (YAGNI) |

---

## ไม่ทำในขอบเขตนี้

- ไม่ทำ drag-and-drop highlight effect พิเศษ
- ไม่ทำ preview ไฟล์ภาพ
- ไม่ทำ file size limit client-side
- ไม่แก้ edge functions
- ไม่ทำ load existing uploaded files เมื่อ edit draft (แยก scope)
