import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const CREATE_URL  = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/createapplications';
const UPDATE_URL  = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/updateapplication';
const INVOICE_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/listinvoicessupplier';
const PO_URL      = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/listposupplier';

export const useSupplierFactoringRequest = () => {
    const authStore = useAuthStore();

    const getJwt = async (): Promise<string> => {
        const { $supabase } = useNuxtApp();
        const { data: { session } } = await ($supabase as any).auth.getSession();
        const jwt = session?.access_token || authStore.accessToken;
        if (!jwt) throw new Error('กรุณาเข้าสู่ระบบใหม่');
        return jwt;
    };

    const generateId = () => {
        const now  = new Date();
        const yy   = String(now.getFullYear()).slice(2);
        const mm   = String(now.getMonth() + 1).padStart(2, '0');
        const rand = Math.floor(Math.random() * 9000 + 1000);
        return `FACT-${yy}${mm}-${rand}`;
    };

    const isSaved          = ref(false);

    // ── Invoice file upload ────────────────────────────────────
    type UploadedFile = { path: string; name: string; size: number };
    const invoiceFiles      = ref<File[]>([]);
    const uploadedFilePaths = ref<UploadedFile[]>([]);

    const addFiles = (fileList: FileList | null) => {
        if (!fileList) return;
        const existing = new Set(invoiceFiles.value.map((f) => f.name));
        invoiceFiles.value.push(...Array.from(fileList).filter((f) => !existing.has(f.name)));
    };

    const removeFile = (index: number) => {
        invoiceFiles.value.splice(index, 1);
    };

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

    const isLoadingInvoice = ref(false);
    const isLoadingPO      = ref(false);
    const invoiceError     = ref('');
    const poError          = ref('');

    const form = ref({
        requestId         : generateId(),
        status            : 'draft',
        drawdownType      : 'invoice' as 'po' | 'invoice',
        selectedInvoiceIds: [] as string[],
        requestedAmount   : 0,
        creditPeriod      : null as number | null,
        paymentType       : null as string | null,
        remark            : '',
        factoringRate     : null as number | null,  // snapshotted from approved LINE facility
    });

    // Invoice list — fetched from listinvoicessupplier edge function
    const pendingInvoices = ref<any[]>([]);
    // PO list — fetched from listposupplier edge function
    const pendingPOs      = ref<any[]>([]);

    const mapItems = (list: any[]) =>
        list.map((inv: any) => ({
            id         : inv.id,
            invoiceNo  : inv.invoice_no,
            invoiceDate: inv.invoice_date,
            buyer      : inv.buyer_name,
            amount     : Number(inv.amount_incl_vat ?? 0),
            poNo       : inv.po_no ?? '-',
            status     : inv.status,
        }));

    const fetchInvoices = async () => {
        isLoadingInvoice.value = true;
        invoiceError.value     = '';
        try {
            const jwt = await getJwt();

            const res  = await fetch(`${INVOICE_URL}?limit=200`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
            pendingInvoices.value = mapItems(json.data ?? []);
        } catch (err: any) {
            invoiceError.value = err.message;
            console.error('[listinvoicessupplier] error:', err.message);
        } finally {
            isLoadingInvoice.value = false;
        }
    };

    const fetchPOs = async () => {
        isLoadingPO.value = true;
        poError.value     = '';
        try {
            const jwt = await getJwt();

            const res  = await fetch(`${PO_URL}?limit=200`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
            pendingPOs.value = mapItems(json.data ?? []);
        } catch (err: any) {
            poError.value = err.message;
            console.error('[listposupplier] error:', err.message);
        } finally {
            isLoadingPO.value = false;
        }
    };

    onMounted(() => { fetchInvoices(); fetchPOs(); });

    // ── Active list based on drawdown type ────────────────────────
    const activeItems = computed(() =>
        form.value.drawdownType === 'po' ? pendingPOs.value : pendingInvoices.value
    );

    // ── Computed ───────────────────────────────────────────────────
    const totalSelectedAmount = computed(() =>
        form.value.selectedInvoiceIds.reduce((total, id) => {
            const inv = activeItems.value.find((i) => i.id === id);
            return total + (inv?.amount ?? 0);
        }, 0)
    );

    const selectedBuyerNames = computed(() => {
        const buyers = form.value.selectedInvoiceIds
            .map((id) => activeItems.value.find((i) => i.id === id)?.buyer ?? '')
            .filter(Boolean);
        return [...new Set(buyers)].join(', ');
    });

    const selectedInvoiceRefs = computed(() =>
        form.value.selectedInvoiceIds
            .map((id) => activeItems.value.find((i) => i.id === id)?.invoiceNo ?? id)
            .join(', ')
    );

    const isFormValid = computed(() =>
        form.value.selectedInvoiceIds.length > 0 &&
        form.value.requestedAmount > 0 &&
        !!form.value.creditPeriod &&
        !!form.value.paymentType
    );

    // ── Build items payload (mapped to po_items schema) ───────────
    const buildPoItems = () =>
        form.value.selectedInvoiceIds.map((id) => {
            const inv = activeItems.value.find((i) => i.id === id)!;
            return {
                po_number: inv.invoiceNo,
                po_date  : inv.invoiceDate,
                buyer    : inv.buyer,
                amount   : inv.amount,
                term     : inv.poNo,     // PO/Invoice reference stored in term field
                po_status: 'pending',    // always 'pending' on creation; constraint: pending|used|cancelled
            };
        });

    // ── Build common payload ───────────────────────────────────────
    const buildPayload = (status: 'draft' | 'under_review') => ({
        id              : form.value.requestId,
        document_type   : 'drawdown',
        drawdown_type   : form.value.drawdownType,
        company_name    : authStore.profile?.company_name || authStore.profile?.full_name || '',
        status,
        submitted_by    : authStore.user?.id,
        buyer_name      : selectedBuyerNames.value || null,
        requested_amount: form.value.requestedAmount,
        credit_period   : form.value.creditPeriod,
        payment_type    : form.value.paymentType ?? null,
        remark          : form.value.remark || null,
        factoring_rate  : form.value.factoringRate ?? null,  // snapshot from approved LINE
        po_items        : buildPoItems(),
    });

    // ── POST createapplications (first save) ──────────────────────
    const callCreate = async (status: 'draft' | 'under_review') => {
        const jwt = await getJwt();

        const res = await fetch(CREATE_URL, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
            body   : JSON.stringify(buildPayload(status)),
        });
        const text = await res.text();
        let json: any = {};
        try { json = JSON.parse(text); } catch {}
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        return json;
    };

    // ── PATCH updateapplication (subsequent saves) ────────────────
    const callUpdate = async (status: 'draft' | 'under_review') => {
        const jwt = await getJwt();

        const res = await fetch(UPDATE_URL, {
            method : 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
            body   : JSON.stringify({
                id              : form.value.requestId,
                status,
                drawdown_type   : form.value.drawdownType,
                buyer_name      : selectedBuyerNames.value || null,
                requested_amount: form.value.requestedAmount,
                credit_period   : form.value.creditPeriod,
                payment_type    : form.value.paymentType ?? null,
                remark          : form.value.remark || null,
                po_items        : buildPoItems(),
            }),
        });
        const text = await res.text();
        let json: any = {};
        try { json = JSON.parse(text); } catch {}
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        return json;
    };

    // ── Save Draft ─────────────────────────────────────────────────
    const saveDraft = async () => {
        try {
            const firstSave = !isSaved.value;

            // 1. Create/update application first — server may assign a different ID
            const result = firstSave
                ? await callCreate('draft')
                : await callUpdate('draft');

            // 2. Sync requestId with server-assigned ID (first save only)
            if (firstSave) {
                const serverId = result?.data?.id ?? result?.id;
                if (serverId) form.value.requestId = serverId;
                isSaved.value = true;
            }

            // 3. Upload files — now uses correct requestId
            const upload = await uploadInvoiceFiles();
            if (!upload.ok) throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${upload.failedFile}`);

            // 4. Save document records with correct application_id
            await saveDocumentRecords(upload.newUploads);

            form.value.status = 'draft';
            return { success: true, timestamp: new Date().toLocaleTimeString(), data: result.data };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    // ── Submit Request ─────────────────────────────────────────────
    const submitRequest = async () => {
        try {
            const firstSave = !isSaved.value;

            // 1. Create/update application first — server may assign a different ID
            const result = firstSave
                ? await callCreate('under_review')
                : await callUpdate('under_review');

            // 2. Sync requestId with server-assigned ID (first save only)
            if (firstSave) {
                const serverId = result?.data?.id ?? result?.id;
                if (serverId) form.value.requestId = serverId;
                isSaved.value = true;
            }

            // 3. Upload files — now uses correct requestId
            const upload = await uploadInvoiceFiles();
            if (!upload.ok) throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${upload.failedFile}`);

            // 4. Save document records with correct application_id
            await saveDocumentRecords(upload.newUploads);

            form.value.status = 'under_review';
            return { success: true, message: 'Submitted', data: result.data };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

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
};
