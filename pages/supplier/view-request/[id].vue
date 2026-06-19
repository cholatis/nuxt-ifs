<template>
    <div>
        <!-- Loading -->
        <div v-if="isLoading" class="flex items-center justify-center py-32">
            <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
            <span class="ml-3 text-white-dark">กำลังโหลด...</span>
        </div>

        <!-- Not found -->
        <div v-else-if="!app" class="panel py-20 text-center">
            <p class="text-white-dark mb-2">ไม่พบคำขอนี้</p>
            <p v-if="fetchError" class="text-danger text-sm mb-4 font-mono">{{ fetchError }}</p>
            <NuxtLink to="/supplier/request-list" class="btn btn-primary">← กลับสู่รายการ</NuxtLink>
        </div>

        <template v-else>
            <!-- Header -->
            <div class="bg-primary text-white rounded-lg p-4 flex items-center justify-between mb-5 shadow-md">
                <div class="flex items-center gap-4">
                    <div class="p-2 bg-white/20 rounded-lg">
                        <icon-menu-invoice class="w-6 h-6" />
                    </div>
                    <div>
                        <h4 class="text-xl font-bold">
                            {{ app.document_type === 'credit_line' ? 'Credit Line Application'
                                : app.drawdown_type === 'po' ? 'PO Factoring Request'
                                : 'Invoice Factoring Request' }}
                        </h4>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-white/80 text-sm">ID: {{ app.id }}</span>
                            <span :class="statusBadgeClass(app.status)">{{ statusLabel(app.status) }}</span>
                        </div>
                    </div>
                </div>
                <NuxtLink to="/supplier/request-list" class="btn btn-outline-white">← Back</NuxtLink>
            </div>

            <!-- Review note (rejected) -->
            <div v-if="app.status === 'rejected' && (app.review_note || app.verify_note)"
                class="mb-5 rounded-lg border border-danger/30 bg-danger/5 px-5 py-3 text-sm">
                <p class="font-semibold text-danger mb-1">เหตุผลที่ปฏิเสธ</p>
                <p class="text-white-dark">{{ app.review_note || app.verify_note }}</p>
            </div>

            <!-- Section 1 — Applicant Info -->
            <div class="panel mb-5">
                <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                    <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                    ข้อมูลผู้ยื่นคำขอ
                </h5>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p class="text-white-dark mb-1">บริษัท</p>
                        <p class="font-semibold dark:text-white">{{ app.company_name }}</p>
                    </div>
                    <div>
                        <p class="text-white-dark mb-1">ประเภทคำขอ</p>
                        <p class="font-semibold dark:text-white">
                            {{ app.document_type === 'credit_line' ? 'Credit Line'
                                : app.drawdown_type === 'po' ? 'PO Factoring (Drawdown)'
                                : 'Invoice Factoring (Drawdown)' }}
                        </p>
                    </div>
                    <div>
                        <p class="text-white-dark mb-1">วันที่ยื่น</p>
                        <p class="font-semibold dark:text-white">{{ formatDate(app.created_at) }}</p>
                    </div>
                    <div>
                        <p class="text-white-dark mb-1">สถานะ</p>
                        <span :class="statusBadgeClass(app.status)">{{ statusLabel(app.status) }}</span>
                    </div>
                </div>
            </div>

            <!-- ── CREDIT LINE ── -->
            <template v-if="app.document_type === 'credit_line'">
                <div class="panel mb-5">
                    <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                        รายละเอียดคำขอวงเงิน
                    </h5>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p class="text-white-dark mb-1">Tax ID</p>
                            <p class="font-semibold dark:text-white">{{ app.tax_id || '-' }}</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">ประเภทธุรกิจ</p>
                            <p class="font-semibold dark:text-white">{{ app.business_type || '-' }}</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">วงเงินที่ขอ (THB)</p>
                            <p class="text-xl font-black text-primary">฿ {{ formatAmount(app.requested_credit_limit) }}</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">ระยะเวลาเครดิต</p>
                            <p class="font-semibold dark:text-white">{{ app.credit_period ?? '-' }} วัน</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">% Factoring</p>
                            <p class="font-semibold dark:text-white">
                                {{ app.factoring_rate != null ? app.factoring_rate + ' %' : '-' }}
                            </p>
                        </div>
                    </div>

                    <!-- Credit Facility Summary -->
                    <template v-if="app.credit_facility">
                        <div class="mt-5 pt-5 border-t dark:border-[#191e3a]">
                            <p class="text-sm font-semibold text-white-dark mb-3 uppercase tracking-wide">วงเงินที่อนุมัติ</p>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div class="rounded-xl bg-primary/10 px-5 py-4 flex items-center justify-between">
                                    <span class="text-sm font-medium text-primary">วงเงินอนุมัติ</span>
                                    <span class="text-lg font-black text-primary">฿ {{ formatAmount(app.credit_facility.approved_limit) }}</span>
                                </div>
                                <div class="rounded-xl bg-warning/10 px-5 py-4 flex items-center justify-between">
                                    <span class="text-sm font-medium text-warning-dark">ใช้ไปแล้ว</span>
                                    <span class="text-lg font-black text-warning-dark">฿ {{ formatAmount(app.credit_facility.used_balance ?? 0) }}</span>
                                </div>
                                <div class="rounded-xl px-5 py-4 flex items-center justify-between"
                                    :class="(app.credit_facility.available_balance ?? 0) <= 0 ? 'bg-danger/10' : 'bg-success/10'">
                                    <span class="text-sm font-medium" :class="(app.credit_facility.available_balance ?? 0) <= 0 ? 'text-danger' : 'text-success'">วงเงินคงเหลือ</span>
                                    <span class="text-lg font-black" :class="(app.credit_facility.available_balance ?? 0) <= 0 ? 'text-danger' : 'text-success'">
                                        ฿ {{ formatAmount(app.credit_facility.available_balance ?? 0) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Section 3 — Attached Documents (Credit Line) -->
                <div class="panel mb-5">
                    <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">3</span>
                        เอกสารแนบ
                    </h5>
                    <div v-if="signedUrlError" class="mb-3 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                        {{ signedUrlError }}
                    </div>
                    <div v-if="!app.application_documents?.length" class="py-6 text-center text-white-dark text-sm">
                        ไม่มีเอกสารแนบ
                    </div>
                    <div v-else class="table-responsive">
                        <table class="table-hover table">
                            <thead>
                                <tr>
                                    <th>ประเภทเอกสาร</th>
                                    <th>ชื่อไฟล์</th>
                                    <th>วันที่อัปโหลด</th>
                                    <th class="text-center">สถานะ</th>
                                    <th class="text-center">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="doc in app.application_documents" :key="doc.id">
                                    <td class="font-semibold dark:text-white-light">{{ doc.doc_name }}</td>
                                    <td class="text-sm">{{ doc.file_name || '-' }}</td>
                                    <td class="text-sm text-white-dark">{{ doc.uploaded_at ? formatDate(doc.uploaded_at) : '-' }}</td>
                                    <td class="text-center">
                                        <span v-if="doc.upload_status === 'uploaded'" class="badge badge-outline-success text-[10px]">Uploaded</span>
                                        <span v-else class="badge badge-outline-warning text-[10px]">{{ doc.upload_status }}</span>
                                    </td>
                                    <td class="text-center">
                                        <button
                                            v-if="doc.upload_status === 'uploaded' && doc.file_path"
                                            @click="openDocument(doc)"
                                            :disabled="signedUrlLoading === doc.id"
                                            class="btn btn-outline-primary btn-sm gap-1 px-3"
                                            :title="`เปิด ${doc.doc_name}`"
                                        >
                                            <span v-if="signedUrlLoading === doc.id" class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-l-transparent"></span>
                                            <icon-eye v-else class="h-4 w-4" />
                                            View
                                        </button>
                                        <span v-else class="text-xs text-white-dark">—</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </template>

            <!-- ── DRAWDOWN ── -->
            <template v-else>
                <div class="panel mb-5">
                    <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                        รายละเอียดคำขอ Factoring
                    </h5>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p class="text-white-dark mb-1">Buyer Name</p>
                            <p class="font-semibold dark:text-white">{{ app.buyer_name || '-' }}</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">จำนวนที่ขอ (THB)</p>
                            <p class="text-xl font-black text-primary">฿ {{ formatAmount(app.requested_amount) }}</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">ระยะเวลาเครดิต</p>
                            <p class="font-semibold dark:text-white">{{ app.credit_period ?? '-' }} วัน</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">% Factoring</p>
                            <p class="font-semibold dark:text-white">{{ app.factoring_rate != null ? app.factoring_rate + ' %' : '-' }}</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">ประเภทการชำระ</p>
                            <p class="font-semibold dark:text-white capitalize">{{ app.payment_type || '-' }}</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">หมายเหตุ</p>
                            <p class="font-semibold dark:text-white">{{ app.remark || '-' }}</p>
                        </div>
                        <div v-if="app.application_po_items?.length" class="md:col-span-3 border-t pt-3 dark:border-[#191e3a]">
                            <p class="text-white-dark mb-1">ยอดรวม {{ app.drawdown_type === 'po' ? 'PO' : 'Invoice' }} ทั้งหมด (THB)</p>
                            <p class="text-2xl font-black text-success">฿ {{ formatAmount(totalPoAmount) }}</p>
                        </div>
                    </div>
                </div>

                <!-- Section 3 — Attached Documents (Drawdown) -->
                <div class="panel mb-5">
                    <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">3</span>
                        เอกสารแนบ
                    </h5>
                    <div v-if="signedUrlError" class="mb-3 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                        {{ signedUrlError }}
                    </div>
                    <div v-if="!app.application_documents?.length" class="py-6 text-center text-white-dark text-sm">
                        ไม่มีเอกสารแนบ
                    </div>
                    <div v-else class="table-responsive">
                        <table class="table-hover table">
                            <thead>
                                <tr>
                                    <th>ประเภทเอกสาร</th>
                                    <th>ชื่อไฟล์</th>
                                    <th>วันที่อัปโหลด</th>
                                    <th class="text-center">สถานะ</th>
                                    <th class="text-center">การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="doc in app.application_documents" :key="doc.id">
                                    <td class="font-semibold dark:text-white-light">{{ doc.doc_name }}</td>
                                    <td class="text-sm">{{ doc.file_name || '-' }}</td>
                                    <td class="text-sm text-white-dark">{{ doc.uploaded_at ? formatDate(doc.uploaded_at) : '-' }}</td>
                                    <td class="text-center">
                                        <span v-if="doc.upload_status === 'uploaded'" class="badge badge-outline-success text-[10px]">Uploaded</span>
                                        <span v-else class="badge badge-outline-warning text-[10px]">{{ doc.upload_status }}</span>
                                    </td>
                                    <td class="text-center">
                                        <button
                                            v-if="doc.upload_status === 'uploaded' && doc.file_path"
                                            @click="openDocument(doc)"
                                            :disabled="signedUrlLoading === doc.id"
                                            class="btn btn-outline-primary btn-sm gap-1 px-3"
                                            :title="`เปิด ${doc.doc_name}`"
                                        >
                                            <span v-if="signedUrlLoading === doc.id" class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-l-transparent"></span>
                                            <icon-eye v-else class="h-4 w-4" />
                                            View
                                        </button>
                                        <span v-else class="text-xs text-white-dark">—</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Invoice / PO Items -->
                <div class="panel mb-5">
                    <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">4</span>
                        {{ app.drawdown_type === 'po' ? 'รายการ Purchase Order' : 'รายการ Invoice' }}
                    </h5>
                    <div v-if="!app.application_po_items?.length" class="py-6 text-center text-white-dark text-sm">
                        ไม่มีรายการ {{ app.drawdown_type === 'po' ? 'PO' : 'Invoice' }}
                    </div>
                    <div v-else class="table-responsive">
                        <table class="table-hover table">
                            <thead>
                                <tr>
                                    <th>{{ app.drawdown_type === 'po' ? 'PO No' : 'Invoice No' }}</th>
                                    <th>{{ app.drawdown_type === 'po' ? 'PO Date' : 'Invoice Date' }}</th>
                                    <th>Buyer</th>
                                    <th class="text-right">Amount (THB)</th>
                                    <th class="text-center">{{ app.drawdown_type === 'po' ? 'Invoice Reference' : 'PO Reference' }}</th>
                                    <th class="text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="po in app.application_po_items" :key="po.id">
                                    <td class="font-semibold text-primary">{{ po.po_number }}</td>
                                    <td class="text-white-dark text-sm">{{ po.po_date }}</td>
                                    <td>{{ po.buyer }}</td>
                                    <td class="text-right font-bold">{{ formatAmount(po.amount) }}</td>
                                    <td class="text-center text-white-dark text-sm">{{ po.term || '-' }}</td>
                                    <td class="text-center">
                                        <span class="badge badge-outline-info text-[10px]">{{ po.po_status }}</span>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr class="font-bold bg-gray-50 dark:bg-dark/20">
                                    <td colspan="3" class="text-right text-white-dark">
                                        Total {{ app.drawdown_type === 'po' ? 'PO' : 'Invoice' }} Value
                                    </td>
                                    <td class="text-right text-primary text-base">฿ {{ formatAmount(totalPoAmount) }}</td>
                                    <td colspan="2"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- ── Repayment Section (read-only) ── -->
                <div class="panel mb-5">
                    <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">5</span>
                        การคืนวงเงิน
                    </h5>

                    <div v-if="repayInfoLoading" class="flex items-center gap-2 py-4 text-white-dark text-sm">
                        <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-l-transparent"></span>
                        กำลังโหลด...
                    </div>

                    <template v-else>
                        <!-- Summary cards -->
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div class="rounded-xl bg-primary/10 px-4 py-3 flex items-center justify-between">
                                <span class="text-sm text-primary font-medium">วงเงินตามเอกสาร</span>
                                <span class="font-black text-primary">฿ {{ formatAmount(app.requested_amount) }}</span>
                            </div>
                            <div class="rounded-xl bg-success/10 px-4 py-3 flex items-center justify-between">
                                <span class="text-sm text-success font-medium">คืนแล้ว</span>
                                <span class="font-black text-success">฿ {{ formatAmount(repayInfo.total_repaid) }}</span>
                            </div>
                            <div class="rounded-xl px-4 py-3 flex items-center justify-between"
                                :class="repayInfo.remaining <= 0 ? 'bg-gray-100 dark:bg-dark/20' : 'bg-warning/10'">
                                <span class="text-sm font-medium" :class="repayInfo.remaining <= 0 ? 'text-white-dark' : 'text-warning-dark'">คงค้าง</span>
                                <span class="font-black" :class="repayInfo.remaining <= 0 ? 'text-white-dark' : 'text-warning-dark'">
                                    ฿ {{ formatAmount(repayInfo.remaining) }}
                                </span>
                            </div>
                        </div>

                        <!-- Progress bar -->
                        <div class="mb-4">
                            <div class="flex justify-between text-xs text-white-dark mb-1">
                                <span>{{ app.requested_amount > 0 ? ((repayInfo.total_repaid / app.requested_amount) * 100).toFixed(1) : 0 }}% คืนแล้ว</span>
                                <span :class="repayInfo.remaining <= 0 ? 'text-success font-semibold' : ''">
                                    {{ repayInfo.remaining <= 0 ? '✓ คืนครบถ้วน' : `คงค้าง ฿${formatAmount(repayInfo.remaining)}` }}
                                </span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-dark rounded-full h-3">
                                <div class="h-3 rounded-full transition-all duration-700"
                                    :class="repayInfo.remaining <= 0 ? 'bg-success' : 'bg-primary'"
                                    :style="{ width: Math.min(100, app.requested_amount > 0 ? (repayInfo.total_repaid / app.requested_amount) * 100 : 0) + '%' }">
                                </div>
                            </div>
                        </div>

                        <!-- Repayment history -->
                        <div v-if="repayInfo.repayments?.length">
                            <p class="text-xs font-semibold text-white-dark uppercase tracking-wide mb-2">ประวัติการคืนวงเงิน</p>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th class="text-center w-10">#</th>
                                            <th>วันที่</th>
                                            <th class="text-right">จำนวน (THB)</th>
                                            <th>หมายเหตุ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(r, i) in repayInfo.repayments" :key="r.id">
                                            <td class="text-center text-white-dark text-sm">{{ i + 1 }}</td>
                                            <td class="text-white-dark text-sm">{{ formatRepayDate(r.repaid_at) }}</td>
                                            <td class="text-right font-bold text-success">฿ {{ formatAmount(r.amount) }}</td>
                                            <td class="text-white-dark text-sm">{{ r.note || '-' }}</td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr class="font-bold bg-gray-50 dark:bg-dark/20">
                                            <td colspan="2" class="text-right text-white-dark">รวมคืนทั้งหมด</td>
                                            <td class="text-right text-success">฿ {{ formatAmount(repayInfo.total_repaid) }}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        <div v-else class="py-4 text-center text-white-dark text-sm">
                            ยังไม่มีการคืนวงเงิน
                        </div>
                    </template>
                </div>
            </template>
        </template>
    </div>
</template>

<script lang="ts" setup>
    import { ref, computed, onMounted } from 'vue';
    import { useAuthStore } from '@/stores/auth';

    useHead({ title: 'View Request - NEX Finance' });
    definePageMeta({ layout: 'default' });

    const GET_URL   = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/getapplication';
    const REPAY_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/repaydrawdown';
    const authStore = useAuthStore();
    const route     = useRoute();
    const config    = useRuntimeConfig();

    // Per-row state for the "View" buttons in the Documents section
    const signedUrlLoading = ref<string | null>(null);
    const signedUrlError   = ref('');

    const openDocument = async (doc: any) => {
        if (!doc?.file_path) {
            signedUrlError.value = 'ไม่มี file_path ในรายการนี้';
            return;
        }
        signedUrlLoading.value = doc.id;
        signedUrlError.value   = '';
        try {
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;
            const url = `${config.public.supabaseUrl}/functions/v1/getsignedurl?path=${encodeURIComponent(doc.file_path)}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${jwt}` } });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
            window.open(json.signed_url, '_blank', 'noopener,noreferrer');
        } catch (err: any) {
            signedUrlError.value = err?.message || 'ไม่สามารถเปิดไฟล์ได้';
        } finally {
            signedUrlLoading.value = null;
        }
    };

    const isLoading  = ref(true);
    const fetchError = ref('');
    const app        = ref<any>(null);

    // Repay Info (read-only)
    const repayInfoLoading = ref(false);
    const repayInfo = ref<{ total_repaid: number; remaining: number; repayments: any[] }>({
        total_repaid: 0,
        remaining   : 0,
        repayments  : [],
    });

    const totalPoAmount = computed(() =>
        (app.value?.application_po_items ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
    );

    const fetchApp = async () => {
        isLoading.value  = true;
        fetchError.value = '';
        try {
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;

            const res  = await fetch(`${GET_URL}?id=${encodeURIComponent(String(route.params.id))}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();
            if (!res.ok) {
                fetchError.value = `[${res.status}] ${json.error ?? JSON.stringify(json)}`;
                app.value = null;
            } else {
                app.value = json.data ?? null;
            }
        } catch (err: any) {
            fetchError.value = err.message;
            app.value = null;
        } finally {
            isLoading.value = false;
        }
    };

    const fetchRepayInfo = async () => {
        if (!app.value?.id) return;
        repayInfoLoading.value = true;
        try {
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;
            const res  = await fetch(`${REPAY_URL}?application_id=${encodeURIComponent(app.value.id)}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();
            if (res.ok) {
                repayInfo.value = {
                    total_repaid: json.total_repaid ?? 0,
                    remaining   : json.remaining    ?? 0,
                    repayments  : json.repayments   ?? [],
                };
            }
        } catch { /* silent */ } finally {
            repayInfoLoading.value = false;
        }
    };

    const formatAmount = (n: number) =>
        new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.floor(n || 0));

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    const formatRepayDate = (d: string) =>
        new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

    const statusLabel = (s: string) =>
        ({ under_review: 'รอพิจารณา', verified: 'Verified', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ', draft: 'Draft', repaid: 'คืนวงเงินแล้ว' }[s] ?? s);

    const statusBadgeClass = (s: string) => ({
        under_review: 'badge badge-outline-warning text-[10px]',
        verified    : 'badge badge-outline-info text-[10px]',
        approved    : 'badge badge-outline-success text-[10px]',
        rejected    : 'badge badge-outline-danger text-[10px]',
        draft       : 'badge badge-outline-secondary text-[10px]',
        repaid      : 'badge bg-primary/20 text-primary text-[10px]',
    }[s] ?? 'badge');

    onMounted(async () => {
        await fetchApp();
        if (app.value?.document_type === 'drawdown') {
            await fetchRepayInfo();
        }
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
