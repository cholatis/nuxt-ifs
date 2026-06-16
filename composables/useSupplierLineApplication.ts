import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const CREATE_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/createapplications';
const UPDATE_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/updateapplication';

export const useSupplierLineApplication = () => {
    const { $supabase } = useNuxtApp();
    const authStore = useAuthStore();

    const getJwt = async (): Promise<string> => {
        const { data: { session } } = await ($supabase as any).auth.getSession();
        const jwt = session?.access_token || authStore.accessToken;
        if (!jwt) throw new Error('กรุณาเข้าสู่ระบบใหม่');
        return jwt;
    };

    const generateId = () => {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const rand = Math.floor(Math.random() * 9000 + 1000);
        return `LINE-${yy}${mm}-${rand}`;
    };

    const isSaved = ref(false); // true after first successful save to DB

    const application = ref({
        applicationId: generateId(),
        status: 'draft',
        companyName: authStore.profile?.company_name || authStore.profile?.full_name || '',
        taxId: '',
        businessType: '',
        requestedCreditLimit: null as number | null,
        creditPeriod: null as number | null,
        documents: [
            { docId: 'company_cert', docName: 'หนังสือรับรองบริษัท (อายุไม่เกิน 3 เดือน)', required: true, files: [] as File[], uploadStatus: 'pending', filePath: null as string | null, fileName: null as string | null },
            { docId: 'pp30',         docName: 'ภ.พ.30 (PP 30)',                              required: true, files: [] as File[], uploadStatus: 'pending', filePath: null as string | null, fileName: null as string | null },
            { docId: 'remittance',   docName: 'Remittance (ย้อนหลัง 3 เดือน)',              required: true, files: [] as File[], uploadStatus: 'pending', filePath: null as string | null, fileName: null as string | null },
        ],
    });

    // ── Computed ───────────────────────────────────────────────────
    const uploadProgress = computed(() => {
        const required = application.value.documents.filter((d) => d.required);
        const uploaded = required.filter((d) => d.uploadStatus === 'uploaded').length;
        const total = required.length;
        return { uploaded, total, percentage: total > 0 ? Math.round((uploaded / total) * 100) : 0 };
    });

    const isFormValid = computed(() =>
        !!(application.value.businessType &&
           application.value.requestedCreditLimit &&
           application.value.creditPeriod)
    );

    // ── File handling ──────────────────────────────────────────────
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

    // Upload new files to Storage bucket "document"
    // Path: {applicationId}/{docId}/{filename}
    const uploadFilesToStorage = async (): Promise<{ ok: boolean; failedDoc?: string }> => {
        const appId = application.value.applicationId;
        for (const doc of application.value.documents) {
            if (doc.files.length === 0 || doc.filePath) continue; // skip: no file or already uploaded

            const file = doc.files[0];
            const path = `${appId}/${doc.docId}/${file.name}`;

            const { data, error } = await ($supabase as any)
                .storage
                .from('document')
                .upload(path, file, { upsert: true });

            if (error) {
                console.error(`Storage upload failed [${doc.docId}]:`, error.message);
                return { ok: false, failedDoc: `${doc.docName} (${error.message})` };
            }
            doc.filePath = data.path;
            console.log(`Uploaded [${doc.docId}] → ${data.path}`);
        }
        return { ok: true };
    };

    // ── Build documents payload ────────────────────────────────────
    const buildDocuments = () =>
        application.value.documents.map((doc) => ({
            doc_id        : doc.docId,
            doc_name      : doc.docName,
            required      : doc.required,
            upload_status : doc.uploadStatus,
            file_path     : doc.filePath ?? null,
            file_name     : doc.files[0]?.name ?? null,
            file_size     : doc.files[0]?.size ?? null,
        }));

    // ── POST createapplications (first save) ──────────────────────
    const callCreate = async (status: 'draft' | 'under_review') => {
        const jwt = await getJwt();

        const res = await fetch(CREATE_URL, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
            body   : JSON.stringify({
                id                    : application.value.applicationId,
                document_type         : 'credit_line',
                company_name          : application.value.companyName,
                status,
                submitted_by          : authStore.user?.id,
                tax_id                : application.value.taxId || null,
                business_type         : application.value.businessType,
                requested_credit_limit: application.value.requestedCreditLimit,
                credit_period         : application.value.creditPeriod,
                documents             : buildDocuments(),
            }),
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
                id                    : application.value.applicationId,
                status,
                tax_id                : application.value.taxId || null,
                business_type         : application.value.businessType,
                requested_credit_limit: application.value.requestedCreditLimit,
                credit_period         : application.value.creditPeriod,
                documents             : buildDocuments(),
            }),
        });
        const text = await res.text();
        let json: any = {};
        try { json = JSON.parse(text); } catch {}
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        return json;
    };

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

    // ── Save Draft ─────────────────────────────────────────────────
    const saveDraft = async () => {
        try {
            await getJwt(); // validate auth before uploading files to avoid orphaned storage objects
            const upload = await uploadFilesToStorage();
            if (!upload.ok) throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${upload.failedDoc}`);

            const result = isSaved.value
                ? await callUpdate('draft')
                : await callCreate('draft');

            application.value.status = 'draft';
            isSaved.value = true;
            return { success: true, timestamp: new Date().toLocaleTimeString(), data: result.data };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    // ── Submit Application ─────────────────────────────────────────
    const submitApplication = async () => {
        try {
            await getJwt(); // validate auth before uploading files to avoid orphaned storage objects
            const upload = await uploadFilesToStorage();
            if (!upload.ok) throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${upload.failedDoc}`);

            const result = isSaved.value
                ? await callUpdate('under_review')
                : await callCreate('under_review');

            application.value.status = 'under_review';
            isSaved.value = true;
            return { success: true, message: 'Submitted', data: result.data };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    return { application, uploadProgress, isFormValid, isSaved, loadDraft, saveDraft, submitApplication, handleFileUpload };
};
