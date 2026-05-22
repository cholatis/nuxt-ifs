<template>
    <div>
        <!-- Header Bar -->
        <div class="bg-primary text-white rounded-lg p-4 flex items-center justify-between mb-5 shadow-md">
            <div class="flex items-center gap-4">
                <div class="p-2 bg-white/20 rounded-lg">
                    <icon-menu-invoice class="w-6 h-6" />
                </div>
                <div>
                    <h4 class="text-xl font-bold">{{ isDrawdown ? 'Edit Factoring Request' : 'Edit Credit Line Application' }}</h4>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-white/80 text-sm">ID: {{ route.params.id }}</span>
                        <span :class="getStatusBadgeClass(appStatus)">{{ appStatus.toUpperCase() }}</span>
                        <span v-if="lastSaved" class="text-xs text-white/60 ml-2 italic">Last saved: {{ lastSaved }}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <NuxtLink to="/supplier/request-list" class="btn btn-outline-white">← Back</NuxtLink>
                <button @click="onSaveDraft" :disabled="isLoading || isPageLoading" class="btn btn-outline-white">
                    Save Draft
                </button>
                <button @click="onSubmit" :disabled="!isFormValid || isLoading || isPageLoading" class="btn bg-white text-primary font-bold shadow-lg hover:bg-gray-100 disabled:opacity-50 transition-all">
                    Submit
                </button>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isPageLoading" class="panel flex items-center justify-center py-20">
            <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
            <span class="ml-3 text-white-dark">กำลังโหลด...</span>
        </div>

        <!-- Not found -->
        <div v-else-if="!appData" class="panel py-16 text-center text-white-dark">
            ไม่พบคำขอ หรือไม่มีสิทธิ์แก้ไข
        </div>

        <template v-else>
            <!-- ─── DRAWDOWN (Factoring) Form ─────────────────────────── -->
            <template v-if="isDrawdown">
                <!-- Section 1 — PO Selection -->
                <div class="panel mb-5">
                    <h5 class="mb-5 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                        Section 1 — Select Purchase Order
                    </h5>
                    <p class="text-sm text-white-dark mb-4">Please select the Invoices you would like to include in this factoring request.</p>
                    <!-- Loading -->
                    <div v-if="isLoadingInvoice" class="flex items-center justify-center py-10 text-white-dark gap-3">
                        <span class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
                        กำลังโหลดรายการ Invoice...
                    </div>
                    <!-- Error -->
                    <div v-else-if="invoiceError" class="py-6 text-center text-danger text-sm">
                        โหลดข้อมูล Invoice ไม่สำเร็จ: {{ invoiceError }}
                    </div>
                    <!-- Empty -->
                    <div v-else-if="pendingInvoices.length === 0" class="py-10 text-center text-white-dark text-sm">
                        ไม่พบรายการ Invoice ที่พร้อมใช้งาน
                    </div>
                    <!-- Table -->
                    <div v-else class="table-responsive">
                        <table class="table-hover table">
                            <thead>
                                <tr>
                                    <th class="w-10"></th>
                                    <th>Invoice No</th>
                                    <th>Invoice Date</th>
                                    <th>Buyer</th>
                                    <th class="text-right">Amount (THB)</th>
                                    <th class="text-center">PO Reference</th>
                                    <th class="text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="inv in pendingInvoices" :key="inv.id">
                                    <td><input type="checkbox" :value="inv.id" v-model="drawdownForm.selectedInvoiceIds" class="form-checkbox" /></td>
                                    <td class="font-semibold text-primary">{{ inv.invoiceNo }}</td>
                                    <td class="text-white-dark text-sm">{{ inv.invoiceDate }}</td>
                                    <td>{{ inv.buyer }}</td>
                                    <td class="text-right font-bold">{{ formatNumber(inv.amount) }}</td>
                                    <td class="text-center text-white-dark text-sm">{{ inv.poNo }}</td>
                                    <td class="text-center">
                                        <span class="badge badge-outline-info text-[10px]">{{ inv.status }}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-if="drawdownForm.selectedPoIds.length > 0" class="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h6 class="font-bold text-primary mb-1">Selection Summary</h6>
                                <p class="text-sm text-white-dark">{{ drawdownForm.selectedPoIds.length }} PO(s) selected: <span class="font-medium text-black dark:text-white">{{ selectedPoRefs }}</span></p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs uppercase text-white-dark font-semibold">Total PO Value</p>
                                <p class="text-2xl font-black text-primary">฿ {{ formatNumber(totalSelectedAmount) }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 2 — Request Details -->
                <div class="panel mb-5">
                    <h5 class="mb-5 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                        Section 2 — Request Details
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label>Request Type</label>
                            <input type="text" value="PO Factoring" class="form-input bg-gray-100 dark:bg-[#1b2e4b]" readonly />
                        </div>
                        <div>
                            <label>Buyer Name</label>
                            <input type="text" :value="selectedBuyerNames" class="form-input bg-gray-100 dark:bg-[#1b2e4b]" readonly placeholder="Auto-fill from selected POs" />
                        </div>
                        <div>
                            <label>Requested Amount (THB) <span class="text-danger">*</span></label>
                            <div class="relative">
                                <input type="number" class="form-input" v-model="drawdownForm.requestedAmount" :max="totalSelectedAmount" placeholder="0.00" />
                                <span class="absolute right-3 top-2 text-xs text-white-dark" v-if="totalSelectedAmount > 0">Max: {{ formatNumber(totalSelectedAmount) }}</span>
                            </div>
                        </div>
                        <div>
                            <label>Credit Period (Days) <span class="text-danger">*</span></label>
                            <select class="form-select" v-model="drawdownForm.creditPeriod">
                                <option :value="null" disabled>Select Period</option>
                                <option :value="30">30 วัน</option>
                                <option :value="45">45 วัน</option>
                                <option :value="60">60 วัน</option>
                                <option :value="90">90 วัน</option>
                                <option :value="120">120 วัน</option>
                            </select>
                        </div>
                        <div>
                            <label>Payment Type <span class="text-danger">*</span></label>
                            <select class="form-select" v-model="drawdownForm.paymentType">
                                <option :value="null" disabled>Select Payment Type</option>
                                <option value="cheque">Cheque</option>
                                <option value="transfer">Transfer</option>
                            </select>
                        </div>
                        <div class="md:col-span-2">
                            <label>Remark / Additional Notes</label>
                            <textarea class="form-textarea" rows="3" v-model="drawdownForm.remark" placeholder="Any special instructions..."></textarea>
                        </div>
                    </div>
                </div>
            </template>

            <!-- ─── CREDIT LINE Form ──────────────────────────────────── -->
            <template v-else>
                <!-- Section 1 — Company Information -->
                <div class="panel mb-5">
                    <h5 class="mb-5 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                        Section 1 — Company Information & Requested Limit
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label>Company Name</label>
                            <input type="text" :value="lineForm.companyName" class="form-input bg-gray-100 dark:bg-[#1b2e4b]" readonly />
                        </div>
                        <div>
                            <label>Tax ID</label>
                            <input type="text" v-model="lineForm.taxId" class="form-input" placeholder="เลขประจำตัวผู้เสียภาษี" />
                        </div>
                        <div>
                            <label>Business Type <span class="text-danger">*</span></label>
                            <select class="form-select" v-model="lineForm.businessType">
                                <option value="" disabled>Select Business Type</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Trade">Trade</option>
                                <option value="Services">Services</option>
                                <option value="Contractor">Contractor</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label>Requested Credit Limit (THB) <span class="text-danger">*</span></label>
                                <input type="number" class="form-input" v-model="lineForm.requestedCreditLimit" placeholder="0.00" />
                            </div>
                            <div>
                                <label>Credit Period (Days) <span class="text-danger">*</span></label>
                                <select class="form-select" v-model="lineForm.creditPeriod">
                                    <option :value="null" disabled>Select Period</option>
                                    <option :value="30">30 วัน</option>
                                    <option :value="45">45 วัน</option>
                                    <option :value="60">60 วัน</option>
                                    <option :value="90">90 วัน</option>
                                    <option :value="120">120 วัน</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 2 — Document Upload -->
                <div class="panel mb-5">
                    <h5 class="mb-5 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                        Section 2 — Document Upload
                    </h5>
                    <div class="bg-warning/10 border border-warning/20 p-4 rounded-lg flex gap-3 mb-5">
                        <icon-info-circle class="text-warning w-5 h-5 flex-none mt-0.5" />
                        <p class="text-sm text-warning-dark font-medium">
                            NCB (Credit Bureau) ต้องมีอายุไม่เกิน 1 เดือน — กรุณาแนบเอกสารที่เป็นปัจจุบัน
                        </p>
                    </div>
                    <div v-for="doc in lineForm.documents" :key="doc.docId"
                        class="flex flex-wrap md:flex-nowrap items-center gap-4 border border-gray-200 dark:border-[#191e3a] rounded-lg p-4 mb-3 hover:bg-gray-50 dark:hover:bg-dark/20 transition-colors">
                        <div class="flex-grow">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="font-semibold dark:text-white-light text-base">{{ doc.docName }}</span>
                                <span v-if="doc.required" class="badge badge-outline-danger text-[10px] py-0.5 px-1.5 uppercase">Required</span>
                                <span v-else class="badge badge-outline-secondary text-[10px] py-0.5 px-1.5 uppercase">Optional</span>
                            </div>
                            <p class="text-xs text-white-dark" v-if="doc.newFiles.length > 0">
                                New: {{ doc.newFiles.map((f: any) => f.name).join(', ') }}
                            </p>
                            <p class="text-xs text-success" v-else-if="doc.filePath">
                                ✓ {{ doc.filePath.split('/').pop() }}
                            </p>
                        </div>
                        <div class="flex items-center gap-3 flex-none">
                            <div v-if="doc.uploadStatus === 'uploaded' || doc.filePath" class="flex items-center gap-1 text-success text-sm font-bold bg-success/10 px-3 py-1 rounded-full">
                                <icon-circle-check class="w-4 h-4" />
                                Uploaded
                            </div>
                            <input
                                type="file"
                                class="hidden"
                                :id="'file-' + doc.docId"
                                @change="(e: any) => handleLineFileUpload(doc.docId, e.target.files)"
                                accept="application/pdf,image/*"
                                multiple
                            />
                            <label :for="'file-' + doc.docId" class="btn btn-sm btn-outline-primary cursor-pointer mb-0">
                                {{ (doc.uploadStatus === 'uploaded' || doc.filePath) ? 'Change Files' : 'Upload Files' }}
                            </label>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Sticky Bottom Bar -->
            <div class="sticky bottom-0 bg-white dark:bg-[#0e1726] border-t dark:border-[#191e3a] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] p-4 z-10 -mx-6 px-10">
                <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div v-if="isDrawdown" class="flex flex-col">
                        <span class="text-xs uppercase text-white-dark font-semibold">Total Requested Amount</span>
                        <span class="text-xl font-bold text-primary">฿ {{ formatNumber(drawdownForm.requestedAmount || 0) }}</span>
                    </div>
                    <div v-else class="flex flex-col">
                        <span class="text-xs uppercase text-white-dark font-semibold">Upload Progress</span>
                        <span class="text-sm font-bold text-primary">{{ uploadProgress.uploaded }} / {{ uploadProgress.total }} required docs</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <button @click="onSaveDraft" :disabled="isLoading" class="btn btn-outline-secondary">
                            <span v-if="isLoading && !submitting" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-l-transparent"></span>
                            Save Draft
                        </button>
                        <button @click="onSubmit" :disabled="!isFormValid || isLoading" class="btn btn-primary px-8 shadow-md hover:shadow-lg disabled:opacity-50 transition-all">
                            <span v-if="isLoading && submitting" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue';
    import { useAuthStore } from '@/stores/auth';
    import Swal from 'sweetalert2';

    useHead({ title: 'Edit Request - IFS Finance' });
    definePageMeta({ layout: 'default' });

    const GET_URL      = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/getapplication';
    const UPDATE_URL   = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/updateapplication';
    const INVOICE_URL  = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/listinvoicessupplier';

    const authStore = useAuthStore();
    const route = useRoute();
    const router = useRouter();

    // ── State ──────────────────────────────────────────────────────
    const isPageLoading = ref(true);
    const isLoading = ref(false);
    const submitting = ref(false);
    const lastSaved = ref('');

    const appData = ref<any>(null);
    const appStatus = ref('draft');
    const isDrawdown = computed(() => appData.value?.document_type === 'drawdown');

    // ── Invoices from listinvoicessupplier edge function ──────────
    const pendingInvoices   = ref<any[]>([]);
    const isLoadingInvoice  = ref(false);
    const invoiceError      = ref('');

    const fetchInvoices = async () => {
        isLoadingInvoice.value = true;
        invoiceError.value     = '';
        try {
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;
            const res = await fetch(`${INVOICE_URL}?limit=200`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
            pendingInvoices.value = (json.data ?? []).map((inv: any) => ({
                id         : inv.id,
                invoiceNo  : inv.invoice_no,
                invoiceDate: inv.invoice_date,
                buyer      : inv.buyer_name,
                amount     : Number(inv.amount_incl_vat ?? 0),
                poNo       : inv.po_no ?? '-',
                status     : inv.status,
            }));
        } catch (err: any) {
            invoiceError.value = err.message;
            console.error('[listinvoicessupplier] error:', err.message);
        } finally {
            isLoadingInvoice.value = false;
        }
    };

    // ── Drawdown form ─────────────────────────────────────────────
    const drawdownForm = ref({
        selectedInvoiceIds: [] as string[],
        requestedAmount   : 0 as number,
        creditPeriod      : null as number | null,
        paymentType       : null as string | null,
        remark            : '',
    });

    const totalSelectedAmount = computed(() =>
        drawdownForm.value.selectedInvoiceIds.reduce((total, id) => {
            const inv = pendingInvoices.value.find((i) => i.id === id);
            return total + (inv?.amount ?? 0);
        }, 0)
    );

    const selectedBuyerNames = computed(() => {
        const buyers = drawdownForm.value.selectedInvoiceIds
            .map((id) => pendingInvoices.value.find((i) => i.id === id)?.buyer ?? '')
            .filter(Boolean);
        return [...new Set(buyers)].join(', ');
    });

    const selectedInvoiceRefs = computed(() =>
        drawdownForm.value.selectedInvoiceIds
            .map((id) => pendingInvoices.value.find((i) => i.id === id)?.invoiceNo ?? id)
            .join(', ')
    );

    // ── Credit Line form ──────────────────────────────────────────
    type LineDoc = {
        docId: string;
        docName: string;
        required: boolean;
        uploadStatus: string;
        filePath: string | null;
        newFiles: File[];
    };

    const lineForm = ref({
        companyName          : '',
        taxId                : '',
        businessType         : '',
        requestedCreditLimit : null as number | null,
        creditPeriod         : null as number | null,
        documents            : [
            { docId: 'pp30',       docName: 'PP 30 (ภ.พ.30)',                    required: true,  uploadStatus: 'pending', filePath: null as string | null, newFiles: [] as File[] },
            { docId: 'ncb',        docName: 'NCB (รายงาน Credit Bureau)',         required: true,  uploadStatus: 'pending', filePath: null as string | null, newFiles: [] as File[] },
            { docId: 'ar',         docName: 'AR (Accounts Receivable)',            required: true,  uploadStatus: 'pending', filePath: null as string | null, newFiles: [] as File[] },
            { docId: 'consent',    docName: 'Consent Form (หนังสือยินยอม)',       required: true,  uploadStatus: 'pending', filePath: null as string | null, newFiles: [] as File[] },
            { docId: 'pdpa',       docName: 'PDPA Acknowledgement',                required: true,  uploadStatus: 'pending', filePath: null as string | null, newFiles: [] as File[] },
            { docId: 'credit_ass', docName: 'Credit Assessment',                   required: false, uploadStatus: 'pending', filePath: null as string | null, newFiles: [] as File[] },
            { docId: 'bank_stmt',  docName: 'Bank Statement (ย้อนหลัง 6 เดือน)', required: true,  uploadStatus: 'pending', filePath: null as string | null, newFiles: [] as File[] },
        ] as LineDoc[],
    });

    const uploadProgress = computed(() => {
        const required = lineForm.value.documents.filter((d) => d.required);
        const uploaded = required.filter((d) => d.uploadStatus === 'uploaded' || d.filePath).length;
        return { uploaded, total: required.length };
    });

    const handleLineFileUpload = (docId: string, files: FileList | null) => {
        if (!files || files.length === 0) return;
        const doc = lineForm.value.documents.find((d) => d.docId === docId);
        if (doc) {
            doc.newFiles = Array.from(files);
            doc.uploadStatus = 'uploaded';
        }
    };

    // ── isFormValid ───────────────────────────────────────────────
    const isFormValid = computed(() => {
        if (isDrawdown.value) {
            return drawdownForm.value.selectedInvoiceIds.length > 0 &&
                   drawdownForm.value.requestedAmount > 0 &&
                   !!drawdownForm.value.creditPeriod &&
                   !!drawdownForm.value.paymentType;
        } else {
            return !!(lineForm.value.businessType &&
                      lineForm.value.requestedCreditLimit &&
                      lineForm.value.creditPeriod);
        }
    });

    // ── Fetch application via getapplication Edge Function ────────
    const fetchApplication = async () => {
        isPageLoading.value = true;
        try {
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;

            const res = await fetch(`${GET_URL}?id=${encodeURIComponent(String(route.params.id))}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();

            if (!res.ok || !json.data) {
                appData.value = null;
                return;
            }

            const data = json.data;

            // Allow editing draft or rejected requests
            if (data.status !== 'draft' && data.status !== 'rejected') {
                appData.value = null;
                return;
            }

            appData.value = data;
            appStatus.value = data.status;

            if (data.document_type === 'drawdown') {
                // Populate drawdown form
                drawdownForm.value.requestedAmount = data.requested_amount ?? 0;
                drawdownForm.value.creditPeriod    = data.credit_period ?? null;
                drawdownForm.value.paymentType     = data.payment_type ?? null;
                drawdownForm.value.remark          = data.remark ?? '';

                // Pre-select invoices based on stored po_items (po_number = invoice_no)
                const storedInvoiceNos = (data.application_po_items ?? []).map((item: any) => item.po_number);
                drawdownForm.value.selectedInvoiceIds = pendingInvoices.value
                    .filter((inv) => storedInvoiceNos.includes(inv.invoiceNo))
                    .map((inv) => inv.id);
            } else {
                // Populate credit line form
                lineForm.value.companyName           = data.company_name ?? '';
                lineForm.value.taxId                 = data.tax_id ?? '';
                lineForm.value.businessType          = data.business_type ?? '';
                lineForm.value.requestedCreditLimit  = data.requested_credit_limit ?? null;
                lineForm.value.creditPeriod          = data.credit_period ?? null;

                // Populate document statuses from stored application_documents
                const storedDocs: any[] = data.application_documents ?? [];
                for (const doc of lineForm.value.documents) {
                    const stored = storedDocs.find((d) => d.doc_id === doc.docId);
                    if (stored) {
                        doc.uploadStatus = stored.upload_status ?? 'pending';
                        doc.filePath     = stored.file_path ?? null;
                    }
                }
            }
        } catch (err) {
            console.error('fetchApplication error:', err);
            appData.value = null;
        } finally {
            isPageLoading.value = false;
        }
    };

    // ── Upload new files to Storage via REST API (no Supabase client) ─
    const STORAGE_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/storage/v1/object/document';

    const uploadNewFiles = async (): Promise<{ ok: boolean; failedDoc?: string }> => {
        const appId = String(route.params.id);
        const { $supabase } = useNuxtApp();
        const { data: { session } } = await ($supabase as any).auth.getSession();
        const jwt = session?.access_token || authStore.accessToken;

        for (const doc of lineForm.value.documents) {
            if (doc.newFiles.length === 0) continue;

            const file = doc.newFiles[0];
            const path = `${appId}/${doc.docId}/${file.name}`;

            const res = await fetch(`${STORAGE_URL}/${path}`, {
                method : 'POST',
                headers: {
                    Authorization : `Bearer ${jwt}`,
                    'x-upsert'    : 'true',
                    'Content-Type': file.type || 'application/octet-stream',
                },
                body: file,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
                console.error(`Storage upload failed [${doc.docId}]:`, err.message ?? err.error);
                return { ok: false, failedDoc: `${doc.docName} (${err.message ?? err.error})` };
            }

            doc.filePath     = path;
            doc.newFiles     = [];
            doc.uploadStatus = 'uploaded';
        }
        return { ok: true };
    };

    // ── Build payloads ────────────────────────────────────────────
    const buildDrawdownPayload = (status: 'draft' | 'under_review') => {
        const poItems = drawdownForm.value.selectedInvoiceIds.map((id) => {
            const inv = pendingInvoices.value.find((i) => i.id === id)!;
            return {
                po_number: inv.invoiceNo,
                po_date  : inv.invoiceDate,
                buyer    : inv.buyer,
                amount   : inv.amount,
                term     : inv.poNo,
                po_status: inv.status,
            };
        });
        return {
            id              : String(route.params.id),
            status,
            buyer_name      : selectedBuyerNames.value || null,
            requested_amount: drawdownForm.value.requestedAmount,
            credit_period   : drawdownForm.value.creditPeriod,
            payment_type    : drawdownForm.value.paymentType ?? null,
            remark          : drawdownForm.value.remark || null,
            po_items        : poItems,
        };
    };

    const buildLinePayload = (status: 'draft' | 'under_review') => {
        const documents = lineForm.value.documents.map((doc) => ({
            doc_id       : doc.docId,
            doc_name     : doc.docName,
            required     : doc.required,
            upload_status: doc.uploadStatus,
            file_path    : doc.filePath ?? null,
            file_name    : doc.newFiles[0]?.name ?? null,
            file_size    : doc.newFiles[0]?.size ?? null,
        }));
        return {
            id                    : String(route.params.id),
            status,
            tax_id                : lineForm.value.taxId || null,
            business_type         : lineForm.value.businessType,
            requested_credit_limit: lineForm.value.requestedCreditLimit,
            credit_period         : lineForm.value.creditPeriod,
            documents,
        };
    };

    // ── PATCH updateapplication ───────────────────────────────────
    const callUpdate = async (status: 'draft' | 'under_review') => {
        const payload = isDrawdown.value
            ? buildDrawdownPayload(status)
            : buildLinePayload(status);

        const { $supabase } = useNuxtApp();
        const { data: { session } } = await ($supabase as any).auth.getSession();
        const jwt = session?.access_token || authStore.accessToken;

        const res = await fetch(UPDATE_URL, {
            method : 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
            body   : JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        return json;
    };

    // ── Save Draft ────────────────────────────────────────────────
    const onSaveDraft = async () => {
        isLoading.value  = true;
        submitting.value = false;
        try {
            if (!isDrawdown.value) {
                const upload = await uploadNewFiles();
                if (!upload.ok) throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${upload.failedDoc}`);
            }
            await callUpdate('draft');
            appStatus.value = 'draft';
            lastSaved.value = new Date().toLocaleTimeString();
            const toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            toast.fire({ icon: 'success', title: 'Draft saved successfully', padding: '10px 20px' });
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'Save Failed', text: err.message, confirmButtonColor: '#e7515a' });
        } finally {
            isLoading.value = false;
        }
    };

    // ── Submit ────────────────────────────────────────────────────
    const onSubmit = async () => {
        isLoading.value  = true;
        submitting.value = true;
        try {
            if (!isDrawdown.value) {
                const upload = await uploadNewFiles();
                if (!upload.ok) throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${upload.failedDoc}`);
            }
            await callUpdate('under_review');
            appStatus.value = 'under_review';
            await Swal.fire({
                icon             : 'success',
                title            : isDrawdown.value ? 'Request Submitted!' : 'Application Submitted!',
                text             : 'Your request has been received and is under review.',
                confirmButtonColor: '#4361ee',
            });
            router.push('/supplier/request-list');
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'Submission Failed', text: err.message, confirmButtonColor: '#e7515a' });
        } finally {
            isLoading.value  = false;
            submitting.value = false;
        }
    };

    // ── Helpers ───────────────────────────────────────────────────
    const formatNumber = (num: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.floor(num || 0));

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'approved'    : return 'badge badge-outline-success text-[10px]';
            case 'rejected'    : return 'badge badge-outline-danger text-[10px]';
            case 'draft'       : return 'badge badge-outline-secondary text-[10px]';
            case 'under_review': return 'badge badge-outline-warning text-[10px]';
            default            : return 'badge badge-outline-warning text-[10px]';
        }
    };

    onMounted(() => {
        fetchInvoices();
        fetchApplication();
    });
</script>

<style scoped>
    .btn-outline-white {
        @apply bg-transparent border-2 border-white text-white;
    }
    .btn-outline-white:hover {
        @apply bg-white text-primary;
    }
</style>
