# Factoring Invoice Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่ม Section 3 upload documents (ไฟล์ใดก็ได้ ไม่จำกัดจำนวน) ในหน้า New Factoring Request และแก้ Section 1 ให้ scroll ไม่ยาวล้น

**Architecture:** เพิ่ม `invoiceFiles` state + `uploadInvoiceFiles()` + `saveDocumentRecords()` ใน composable; upload ไปยัง Supabase Storage bucket `document` path `{requestId}/invoice-files/{filename}`; insert metadata ลง `application_documents` หลัง edge function สร้าง `credit_applications` row แล้ว

**Tech Stack:** Nuxt 3, Vue 3 Composition API, Supabase JS client, TypeScript, Tailwind CSS

---

## File Structure

| File | การเปลี่ยนแปลง |
|---|---|
| `composables/useSupplierFactoringRequest.ts` | เพิ่ม state + helper functions + แก้ saveDraft/submitRequest + export |
| `pages/supplier/new-factoring-request.vue` | scroll fix + Section 3 UI + update destructuring |

---

### Task 1: เพิ่ม state และ helper functions ใน composable

**Files:**
- Modify: `composables/useSupplierFactoringRequest.ts`

**Context:** ปัจจุบัน composable จัดการ form state + API calls แต่ไม่มี file state เลย ต้องเพิ่ม 4 อย่าง: (1) type + refs, (2) `addFiles`, (3) `removeFile`, (4) `uploadInvoiceFiles`, (5) `saveDocumentRecords`

- [ ] **Step 1: อ่านไฟล์เพื่อดู exact content**

```bash
cat -n /Volumes/WDSSD/GECnexproject/raw/nuxt-ifs/composables/useSupplierFactoringRequest.ts
```

- [ ] **Step 2: เพิ่ม type alias และ refs ใหม่ หลัง `isSaved` ref (ประมาณ line 28)**

หา:
```ts
    const isSaved          = ref(false);
    const isLoadingInvoice = ref(false);
```

แทรกก่อน `isLoadingInvoice`:
```ts
    const isSaved          = ref(false);

    // ── Invoice file upload ────────────────────────────────────
    type UploadedFile = { path: string; name: string; size: number };
    const invoiceFiles      = ref<File[]>([]);
    const uploadedFilePaths = ref<UploadedFile[]>([]);

    const isLoadingInvoice = ref(false);
```

- [ ] **Step 3: เพิ่ม `addFiles` และ `removeFile` หลัง refs ใหม่**

เพิ่มหลัง `const uploadedFilePaths = ref<UploadedFile[]>([]);`:
```ts
    const addFiles = (fileList: FileList | null) => {
        if (!fileList) return;
        const existing = new Set(invoiceFiles.value.map((f) => f.name));
        invoiceFiles.value.push(...Array.from(fileList).filter((f) => !existing.has(f.name)));
    };

    const removeFile = (index: number) => {
        invoiceFiles.value.splice(index, 1);
    };
```

- [ ] **Step 4: เพิ่ม `uploadInvoiceFiles` ก่อน `saveDraft` function**

หา comment `// ── Save Draft` แล้วเพิ่มก่อนหน้า:
```ts
    // ── Upload invoice files to Storage ───────────────────────
    const uploadInvoiceFiles = async (): Promise<{ ok: boolean; failedFile?: string; newUploads: UploadedFile[] }> => {
        const { $supabase } = useNuxtApp();
        const requestId     = form.value.requestId;
        const newUploads: UploadedFile[] = [];
        const alreadyUploaded = new Set(uploadedFilePaths.value.map((u) => u.name));

        for (const file of invoiceFiles.value) {
            if (alreadyUploaded.has(file.name)) continue;

            const path = `${requestId}/invoice-files/${file.name}`;
            const { data, error } = await ($supabase as any)
                .storage
                .from('document')
                .upload(path, file, { upsert: true });

            if (error) return { ok: false, failedFile: `${file.name} (${error.message})`, newUploads };

            const entry: UploadedFile = { path: data.path, name: file.name, size: file.size };
            uploadedFilePaths.value.push(entry);
            newUploads.push(entry);
        }
        return { ok: true, newUploads };
    };

    // ── Insert document records for newly uploaded files ──────
    const saveDocumentRecords = async (newUploads: UploadedFile[]) => {
        if (newUploads.length === 0) return;
        const { $supabase } = useNuxtApp();

        const rows = newUploads.map((u) => ({
            application_id: form.value.requestId,
            doc_id        : 'invoice_files',
            doc_name      : u.name,
            file_path     : u.path,
            file_name     : u.name,
            file_size     : u.size,
            upload_status : 'uploaded',
        }));

        await ($supabase as any).from('application_documents').insert(rows);
    };

```

- [ ] **Step 5: Verify grep**

```bash
grep -n "invoiceFiles\|uploadedFilePaths\|addFiles\|removeFile\|uploadInvoiceFiles\|saveDocumentRecords" /Volumes/WDSSD/GECnexproject/raw/nuxt-ifs/composables/useSupplierFactoringRequest.ts
```

Expected: เห็น refs ทั้ง 2, functions ทั้ง 4

---

### Task 2: แก้ `saveDraft` + `submitRequest` + update export

**Files:**
- Modify: `composables/useSupplierFactoringRequest.ts`

**Context:** `saveDraft` และ `submitRequest` ปัจจุบันไม่มี file upload เลย ต้องเพิ่ม 3 ขั้นตอน: (1) upload files, (2) save application, (3) save document records

- [ ] **Step 1: แก้ `saveDraft`**

หา:
```ts
    // ── Save Draft ─────────────────────────────────────────────
    const saveDraft = async () => {
        try {
            const result = isSaved.value
                ? await callUpdate('draft')
                : await callCreate('draft');
            form.value.status = 'draft';
            isSaved.value     = true;
            return { success: true, timestamp: new Date().toLocaleTimeString(), data: result.data };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };
```

แทนด้วย:
```ts
    // ── Save Draft ─────────────────────────────────────────────
    const saveDraft = async () => {
        try {
            const upload = await uploadInvoiceFiles();
            if (!upload.ok) throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${upload.failedFile}`);

            const result = isSaved.value
                ? await callUpdate('draft')
                : await callCreate('draft');

            await saveDocumentRecords(upload.newUploads);

            form.value.status = 'draft';
            isSaved.value     = true;
            return { success: true, timestamp: new Date().toLocaleTimeString(), data: result.data };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };
```

- [ ] **Step 2: แก้ `submitRequest`**

หา:
```ts
    // ── Submit Request ─────────────────────────────────────────
    const submitRequest = async () => {
        try {
            const result = isSaved.value
                ? await callUpdate('under_review')
                : await callCreate('under_review');
            form.value.status = 'under_review';
            isSaved.value     = true;
            return { success: true, message: 'Submitted', data: result.data };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };
```

แทนด้วย:
```ts
    // ── Submit Request ─────────────────────────────────────────
    const submitRequest = async () => {
        try {
            const upload = await uploadInvoiceFiles();
            if (!upload.ok) throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${upload.failedFile}`);

            const result = isSaved.value
                ? await callUpdate('under_review')
                : await callCreate('under_review');

            await saveDocumentRecords(upload.newUploads);

            form.value.status = 'under_review';
            isSaved.value     = true;
            return { success: true, message: 'Submitted', data: result.data };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };
```

- [ ] **Step 3: เพิ่ม `invoiceFiles`, `addFiles`, `removeFile` ใน return statement**

หา:
```ts
    return {
        form,
        pendingInvoices,
        pendingPOs,
        activeItems,
        isLoadingInvoice,
        isLoadingPO,
        invoiceError,
        poError,
        fetchInvoices,
        fetchPOs,
        totalSelectedAmount,
        selectedBuyerNames,
        selectedInvoiceRefs,
        isFormValid,
        isSaved,
        saveDraft,
        submitRequest,
    };
```

แทนด้วย:
```ts
    return {
        form,
        invoiceFiles,
        addFiles,
        removeFile,
        pendingInvoices,
        pendingPOs,
        activeItems,
        isLoadingInvoice,
        isLoadingPO,
        invoiceError,
        poError,
        fetchInvoices,
        fetchPOs,
        totalSelectedAmount,
        selectedBuyerNames,
        selectedInvoiceRefs,
        isFormValid,
        isSaved,
        saveDraft,
        submitRequest,
    };
```

- [ ] **Step 4: Commit Task 1 + 2**

```bash
cd /Volumes/WDSSD/GECnexproject/raw/nuxt-ifs && git add composables/useSupplierFactoringRequest.ts && git commit -m "feat: add invoice file upload logic to factoring request composable"
```

---

### Task 3: แก้ page — scroll fix + Section 3 UI + update destructuring

**Files:**
- Modify: `pages/supplier/new-factoring-request.vue`

**Context:** Page มี 444 lines ต้องแก้ 3 จุด: (1) เพิ่ม scroll class บน `table-responsive` div (line ~156), (2) เพิ่ม Section 3 ก่อน sticky footer (line ~274), (3) update destructuring เพิ่ม `invoiceFiles`, `addFiles`, `removeFile` (line ~313)

- [ ] **Step 1: อ่านไฟล์เพื่อดู exact content ของ 3 จุดที่ต้องแก้**

```bash
sed -n '154,158p' /Volumes/WDSSD/GECnexproject/raw/nuxt-ifs/pages/supplier/new-factoring-request.vue
sed -n '270,278p' /Volumes/WDSSD/GECnexproject/raw/nuxt-ifs/pages/supplier/new-factoring-request.vue
sed -n '311,315p' /Volumes/WDSSD/GECnexproject/raw/nuxt-ifs/pages/supplier/new-factoring-request.vue
```

- [ ] **Step 2: เพิ่ม scroll class บน table-responsive div (Section 1 fix)**

หา:
```html
                <div v-else class="table-responsive">
```

แทนด้วย:
```html
                <div v-else class="table-responsive max-h-[420px] overflow-y-auto">
```

- [ ] **Step 3: เพิ่ม Section 3 ก่อน sticky footer**

หา line ที่เป็นจุดเริ่ม sticky footer:
```html
        <!-- Sticky Bottom -->
        <div class="sticky bottom-0 bg-white dark:bg-[#0e1726] border-t dark:border-[#191e3a] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] p-4 z-10 -mx-6 px-10">
```

เพิ่มก่อนหน้า:
```html
        <!-- Section 3 — Upload Documents -->
        <div class="panel mb-5">
            <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
                Upload Documents
                <span class="text-sm font-normal text-white-dark ml-1">(ไม่บังคับ — PDF, รูปภาพ, หรือไฟล์อื่นๆ)</span>
            </h5>

            <!-- Drop zone -->
            <label
                for="invoice-file-input"
                class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors"
                @dragover.prevent
                @drop.prevent="(e: any) => addFiles(e.dataTransfer?.files ?? null)"
            >
                <svg class="w-8 h-8 text-primary/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span class="text-sm text-white-dark">ลากไฟล์มาวาง หรือ <span class="text-primary font-semibold">คลิกเพื่อเลือกไฟล์</span></span>
                <input id="invoice-file-input" type="file" class="hidden" multiple @change="(e: any) => addFiles(e.target.files)" />
            </label>

            <!-- File list -->
            <ul v-if="invoiceFiles.length > 0" class="mt-4 space-y-2">
                <li
                    v-for="(file, idx) in invoiceFiles"
                    :key="file.name"
                    class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-[#191e3a] px-4 py-2 text-sm"
                >
                    <div class="flex items-center gap-2 min-w-0">
                        <svg class="w-4 h-4 text-primary flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span class="truncate dark:text-white-light">{{ file.name }}</span>
                        <span class="text-white-dark flex-none">({{ (file.size / 1024).toFixed(1) }} KB)</span>
                    </div>
                    <button type="button" @click="removeFile(idx)" class="text-danger hover:text-danger/70 flex-none text-lg leading-none">✕</button>
                </li>
            </ul>
        </div>

```

- [ ] **Step 4: Update destructuring ใน script เพิ่ม `invoiceFiles`, `addFiles`, `removeFile`**

หา:
```ts
    const { form, pendingInvoices, pendingPOs, activeItems, isLoadingInvoice, isLoadingPO, invoiceError, poError, totalSelectedAmount, selectedBuyerNames, selectedInvoiceRefs, isFormValid, saveDraft, submitRequest } = useSupplierFactoringRequest();
```

แทนด้วย:
```ts
    const { form, invoiceFiles, addFiles, removeFile, pendingInvoices, pendingPOs, activeItems, isLoadingInvoice, isLoadingPO, invoiceError, poError, totalSelectedAmount, selectedBuyerNames, selectedInvoiceRefs, isFormValid, saveDraft, submitRequest } = useSupplierFactoringRequest();
```

- [ ] **Step 5: Verify ทุกจุดถูกต้อง**

```bash
grep -n "max-h-\[420px\]\|invoice-file-input\|invoiceFiles\|addFiles\|removeFile\|Upload Documents" /Volumes/WDSSD/GECnexproject/raw/nuxt-ifs/pages/supplier/new-factoring-request.vue
```

Expected: เห็นทั้ง scroll class, Section 3 UI elements, และ destructuring

- [ ] **Step 6: Commit**

```bash
cd /Volumes/WDSSD/GECnexproject/raw/nuxt-ifs && git add pages/supplier/new-factoring-request.vue && git commit -m "feat: add Section 3 upload documents and scroll fix in new-factoring-request page"
```

---

### Task 4: Manual verification

**Files:** ไม่มีการแก้ไข

- [ ] **Step 1: Start dev server**

```bash
cd /Volumes/WDSSD/GECnexproject/raw/nuxt-ifs && pnpm dev
```

- [ ] **Step 2: ทดสอบ Section 1 scroll**

ไปที่ `http://localhost:3000/supplier/new-factoring-request`
Expected: รายการ invoice/PO ไม่ยาวล้น มี scroll bar ที่ความสูง 420px

- [ ] **Step 3: ทดสอบ Section 3 file selection**

คลิก "คลิกเพื่อเลือกไฟล์" → เลือก 2-3 ไฟล์ต่างชนิด
Expected: ไฟล์แสดงใน list พร้อมชื่อและขนาด ปุ่ม ✕ ลบได้

- [ ] **Step 4: ทดสอบ drag-and-drop**

ลากไฟล์มาวางบน drop zone
Expected: ไฟล์เพิ่มใน list โดยไม่ duplicate ชื่อ

- [ ] **Step 5: ทดสอบ Save Draft พร้อมไฟล์**

เลือก invoice + กรอก request details + เพิ่มไฟล์ → กด Save Draft
Expected: toast "Draft saved successfully" ไฟล์ถูก upload ไปที่ Storage bucket `document`

- [ ] **Step 6: ทดสอบ submit ไม่มีไฟล์**

ไม่เพิ่มไฟล์ใด → กด Submit Request
Expected: submit ได้ตามปกติ ไม่ block
