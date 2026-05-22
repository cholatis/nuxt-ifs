<template>
    <div>
        <!-- Page Header -->
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-dark dark:text-white">Factoring Request List</h2>
                <p class="mt-1 text-sm text-white-dark">รายการคำขอ Factoring ที่รอการพิจารณา</p>
            </div>
            <div class="flex items-center gap-3">
                <span class="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    {{ authStore.profile?.lender_code || 'IFS01' }} — {{ authStore.profile?.lender_org || 'IFS' }}
                </span>
                <button @click="logout" class="btn btn-outline-danger btn-sm gap-1">
                    <icon-logout class="h-4 w-4" />
                    ออกจากระบบ
                </button>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div class="panel rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-warning">{{ stats.under_review ?? 0 }}</p>
                <p class="text-sm text-white-dark">รอพิจารณา</p>
            </div>
            <div class="panel rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-success">{{ stats.approved ?? 0 }}</p>
                <p class="text-sm text-white-dark">อนุมัติแล้ว</p>
            </div>
            <div class="panel rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-danger">{{ stats.rejected ?? 0 }}</p>
                <p class="text-sm text-white-dark">ปฏิเสธ</p>
            </div>
            <div class="panel rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-primary">{{ stats.total ?? 0 }}</p>
                <p class="text-sm text-white-dark">ทั้งหมด</p>
            </div>
        </div>

        <!-- Filter Bar -->
        <div class="panel mb-4">
            <div class="flex flex-wrap items-center gap-3">
                <div class="relative flex-1 min-w-[200px]">
                    <input
                        v-model="searchText"
                        type="text"
                        class="form-input ps-9"
                        placeholder="ค้นหาชื่อบริษัท, เลข PO..."
                        @input="onSearchInput"
                    />
                    <span class="absolute start-3 top-1/2 -translate-y-1/2 text-white-dark">
                        <icon-search class="h-4 w-4" />
                    </span>
                </div>
                <select v-model="filterStatus" class="form-select w-44" @change="() => { currentPage = 1; fetchRequests(); }">
                    <option value="">ทุกสถานะ</option>
                    <option value="under_review">รอพิจารณา</option>
                    <option value="verified">Verified (รอ Lender)</option>
                    <option value="approved">อนุมัติแล้ว</option>
                    <option value="rejected">ปฏิเสธ</option>
                    <option value="repaid">คืนวงเงินแล้ว</option>
                </select>
                <select v-model="filterType" class="form-select w-36" @change="() => { currentPage = 1; fetchRequests(); }">
                    <option value="">ทุกประเภท</option>
                    <option value="credit_line">LINE</option>
                    <option value="drawdown">PO</option>
                </select>
            </div>
        </div>

        <!-- Table -->
        <div class="panel">
            <div v-if="isLoading" class="flex items-center justify-center py-20">
                <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
                <span class="ml-3 text-white-dark">กำลังโหลด...</span>
            </div>

            <div v-else-if="requests.length === 0" class="py-20 text-center text-white-dark">
                ไม่พบรายการคำขอ
            </div>

            <div v-else class="table-responsive">
                <table class="table-hover table">
                    <thead>
                        <tr>
                            <th>เลขที่คำขอ</th>
                            <th>ประเภท</th>
                            <th>บริษัท</th>
                            <th>Buyer</th>
                            <th class="text-right">จำนวนเงิน (บาท)</th>
                            <th class="text-center">% Factoring</th>
                            <th>วันที่ยื่น</th>
                            <th class="text-center">สถานะ</th>
                            <th class="text-center">การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="req in requests" :key="req.id">
                            <td class="font-semibold text-primary">{{ req.id }}</td>
                            <td>
                                <span :class="req.document_type === 'credit_line'
                                    ? 'badge bg-info/20 text-info'
                                    : 'badge bg-warning/20 text-warning'">
                                    {{ req.document_type === 'credit_line' ? 'LINE' : 'PO' }}
                                </span>
                            </td>
                            <td>{{ req.company_name }}</td>
                            <td class="text-white-dark text-sm">{{ req.buyer_name || '-' }}</td>
                            <td class="text-right font-semibold">
                                {{ formatAmount(req.requested_amount ?? req.requested_credit_limit ?? 0) }}
                            </td>
                            <td class="text-center">
                                {{ req.factoring_rate != null ? req.factoring_rate + ' %' : '-' }}
                            </td>
                            <td class="text-white-dark text-sm">{{ formatDate(req.created_at) }}</td>
                            <td class="text-center">
                                <span :class="statusClass(req.status)">{{ statusLabel(req.status) }}</span>
                            </td>
                            <td class="text-center">
                                <div class="flex items-center justify-center gap-2">
                                    <NuxtLink
                                        :to="`/lender/view-request/${req.id}`"
                                        class="btn btn-outline-primary btn-sm gap-1 px-3"
                                    >
                                        <icon-eye class="h-4 w-4" />
                                        View
                                    </NuxtLink>
                                    <!-- คืนวงเงิน: approved drawdown only -->
                                    <button
                                        v-if="req.status === 'approved' && req.document_type === 'drawdown'"
                                        @click="openRepayModal(req)"
                                        class="btn btn-outline-success btn-sm gap-1 px-3"
                                    >
                                        <icon-refresh class="h-4 w-4" />
                                        คืนวงเงิน
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between px-2">
                <p class="text-sm text-white-dark">
                    แสดง {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, totalCount) }}
                    จาก {{ totalCount }} รายการ
                </p>
                <div class="flex items-center gap-1">
                    <button @click="goPage(currentPage - 1)" :disabled="currentPage === 1"
                        class="btn btn-sm btn-outline-secondary disabled:opacity-40">‹</button>
                    <button v-for="p in totalPages" :key="p" @click="goPage(p)"
                        :class="['btn btn-sm', p === currentPage ? 'btn-primary' : 'btn-outline-secondary']">
                        {{ p }}
                    </button>
                    <button @click="goPage(currentPage + 1)" :disabled="currentPage === totalPages"
                        class="btn btn-sm btn-outline-secondary disabled:opacity-40">›</button>
                </div>
            </div>
        </div>
    </div>

    <!-- ─── Repay Modal ───────────────────────────────────────────── -->
    <TransitionRoot appear :show="isRepayOpen" as="template">
        <Dialog as="div" @close="closeRepayModal" class="relative z-50">
            <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                <div class="fixed inset-0 bg-black/60" />
            </TransitionChild>
            <div class="fixed inset-0 overflow-y-auto">
                <div class="flex min-h-full items-center justify-center p-4">
                    <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                        enter-to="opacity-100 scale-100" leave="duration-200 ease-in"
                        leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
                        <DialogPanel class="w-full max-w-2xl rounded-xl bg-white p-6 dark:bg-[#1b2e4b]">
                            <!-- Header -->
                            <div class="mb-4 flex items-center gap-3">
                                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-success/20 text-success">
                                    <icon-refresh class="h-5 w-5" />
                                </div>
                                <DialogTitle class="text-lg font-bold dark:text-white">คืนวงเงิน Factoring</DialogTitle>
                            </div>

                            <!-- Loading repay info -->
                            <div v-if="repayInfoLoading" class="flex items-center justify-center py-6 text-white-dark gap-2">
                                <span class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-l-transparent"></span>
                                กำลังโหลด...
                            </div>

                            <template v-else>
                                <!-- Summary -->
                                <div class="mb-4 rounded-lg bg-gray-50 dark:bg-dark/30 p-3 text-sm space-y-1.5">
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">คำขอ</span>
                                        <span class="font-semibold text-primary">{{ repayTarget?.id }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">บริษัท</span>
                                        <span class="font-semibold dark:text-white">{{ repayTarget?.company_name }}</span>
                                    </div>
                                    <div class="flex justify-between border-t pt-1.5 dark:border-[#191e3a]">
                                        <span class="text-white-dark">วงเงินตามเอกสาร</span>
                                        <span class="font-bold dark:text-white">฿ {{ formatAmount(repayTarget?.requested_amount ?? 0) }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">คืนแล้ว</span>
                                        <span class="font-bold text-success">฿ {{ formatAmount(repayInfo.total_repaid) }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="font-semibold dark:text-white">คงค้าง</span>
                                        <span class="font-black text-danger text-base">฿ {{ formatAmount(repayInfo.remaining) }}</span>
                                    </div>
                                </div>

                                <!-- Progress bar -->
                                <div class="mb-4">
                                    <div class="flex justify-between text-xs text-white-dark mb-1">
                                        <span>คืนแล้ว {{ repayInfo.total_repaid > 0 ? ((repayInfo.total_repaid / (repayTarget?.requested_amount ?? 1)) * 100).toFixed(1) : 0 }}%</span>
                                        <span>เป้าหมาย ฿ {{ formatAmount(repayTarget?.requested_amount ?? 0) }}</span>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-dark rounded-full h-2">
                                        <div class="bg-success h-2 rounded-full transition-all duration-500"
                                            :style="{ width: Math.min(100, repayTarget?.requested_amount > 0 ? (repayInfo.total_repaid / repayTarget.requested_amount) * 100 : 0) + '%' }">
                                        </div>
                                    </div>
                                </div>

                                <!-- Repayment history -->
                                <div v-if="repayInfo.repayments?.length" class="mb-4">
                                    <p class="text-xs font-semibold text-white-dark uppercase mb-2">ประวัติการคืนวงเงิน</p>
                                    <div class="space-y-1 max-h-32 overflow-y-auto">
                                        <div v-for="(r, i) in repayInfo.repayments" :key="r.id"
                                            class="flex items-center justify-between rounded bg-gray-50 dark:bg-dark/20 px-3 py-1.5 text-sm">
                                            <span class="text-white-dark">#{{ i + 1 }} · {{ formatRepayDate(r.repaid_at) }}</span>
                                            <div class="flex items-center gap-3">
                                                <span v-if="r.note" class="text-xs text-white-dark italic truncate max-w-[140px]">{{ r.note }}</span>
                                                <span class="font-bold text-success">฿ {{ formatAmount(r.amount) }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Invoice selection -->
                                <div class="mb-3">
                                    <div class="mb-2 flex items-center justify-between">
                                        <label class="text-sm font-medium dark:text-white">
                                            เลือกใบ invoice ที่ถูกจ่ายแล้ว <span class="text-danger">*</span>
                                            <span class="text-xs font-normal text-white-dark ml-1">
                                                (Factoring rate {{ repayInfo.factoring_rate || 0 }}%)
                                            </span>
                                        </label>
                                        <div v-if="payablePoItems.length > 0" class="flex items-center gap-2 text-xs">
                                            <button type="button" @click="selectAllPayable"
                                                class="font-semibold text-primary hover:underline">เลือกทั้งหมด</button>
                                            <span class="text-white-dark">|</span>
                                            <button type="button" @click="selectedPoItemIds = []"
                                                class="text-white-dark hover:underline">เคลียร์</button>
                                        </div>
                                    </div>

                                    <div v-if="!repayInfo.po_items?.length"
                                        class="rounded-lg border border-dashed border-gray-300 dark:border-[#191e3a] py-6 text-center text-sm text-white-dark">
                                        ไม่มีรายการ invoice ในคำขอนี้
                                    </div>
                                    <div v-else
                                        class="overflow-hidden rounded-lg border border-gray-200 dark:border-[#191e3a]">
                                        <div class="max-h-64 overflow-y-auto">
                                            <table class="table-hover table mb-0 text-sm">
                                                <thead class="sticky top-0 z-10 bg-gray-50 dark:bg-dark/40">
                                                    <tr>
                                                        <th class="w-10"></th>
                                                        <th>Invoice</th>
                                                        <th class="text-right">มูลค่า</th>
                                                        <th class="text-right">คืน ({{ repayInfo.factoring_rate || 0 }}%)</th>
                                                        <th class="text-center">สถานะ</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="item in repayInfo.po_items" :key="item.id"
                                                        :class="{ 'opacity-60': item.po_status === 'paid' }">
                                                        <td class="text-center">
                                                            <input type="checkbox" :value="item.id"
                                                                v-model="selectedPoItemIds"
                                                                :disabled="item.po_status === 'paid'"
                                                                class="form-checkbox" />
                                                        </td>
                                                        <td>
                                                            <div class="font-semibold text-primary">{{ item.po_number }}</div>
                                                            <div class="text-xs text-white-dark">{{ item.buyer || '-' }}</div>
                                                        </td>
                                                        <td class="text-right">฿ {{ formatAmount(item.amount) }}</td>
                                                        <td class="text-right font-bold text-success">฿ {{ formatAmount(item.repay_amount) }}</td>
                                                        <td class="text-center">
                                                            <span v-if="item.po_status === 'paid'"
                                                                class="badge badge-outline-success text-[10px]">paid</span>
                                                            <span v-else-if="item.po_status === 'cancelled'"
                                                                class="badge badge-outline-danger text-[10px]">cancelled</span>
                                                            <span v-else
                                                                class="badge badge-outline-warning text-[10px]">{{ item.po_status }}</span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div class="mt-3 flex items-center justify-between rounded-lg bg-success/10 px-4 py-2.5">
                                        <span class="text-sm font-semibold text-success-dark">
                                            รวมที่จะคืน
                                            <span class="text-xs font-normal text-white-dark ml-1">
                                                ({{ selectedPoItemIds.length }} ใบ)
                                            </span>
                                        </span>
                                        <span class="text-lg font-black text-success">฿ {{ formatAmount(selectedRepaySum) }}</span>
                                    </div>
                                    <p v-if="selectedRepaySum > repayInfo.remaining + 0.01"
                                        class="mt-1 text-xs text-danger">
                                        จำนวนเกินวงเงินคงค้าง ฿{{ formatAmount(repayInfo.remaining) }}
                                    </p>
                                </div>

                                <!-- Note -->
                                <div class="mb-4">
                                    <label class="mb-1 block text-sm font-medium dark:text-white">หมายเหตุ / อ้างอิงการชำระ</label>
                                    <input type="text" v-model="repayNote" class="form-input"
                                        placeholder="เช่น Transfer ref. TXN20260512-001 (เว้นว่างได้ — ระบบจะใส่เลข invoice ให้)" />
                                </div>

                                <div v-if="repayError" class="mb-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                                    {{ repayError }}
                                </div>

                                <div class="flex justify-end gap-3">
                                    <button @click="closeRepayModal" class="btn btn-outline-secondary" :disabled="repayLoading">ยกเลิก</button>
                                    <button @click="submitRepay"
                                        class="btn btn-success px-6"
                                        :disabled="repayLoading || selectedPoItemIds.length === 0 || selectedRepaySum > repayInfo.remaining + 0.01">
                                        <span v-if="repayLoading"
                                            class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                        ยืนยันคืนวงเงิน
                                    </button>
                                </div>
                            </template>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<script lang="ts" setup>
    import { ref, computed, onMounted } from 'vue';
    import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
    import { useAuthStore } from '@/stores/auth';
    import { useAuth } from '@/composables/useAuth';
    import Swal from 'sweetalert2';

    useHead({ title: 'Request List - IFS Finance' });
    definePageMeta({ layout: 'default' });

    const LIST_URL  = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/listapplication';
    const REPAY_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/repaydrawdown';

    const authStore = useAuthStore();
    const { logout } = useAuth();

    // ── State ──────────────────────────────────────────────────────
    const requests     = ref<any[]>([]);
    const stats        = ref<Record<string, number>>({});
    const isLoading    = ref(false);
    const searchText   = ref('');
    const filterStatus = ref('');
    const filterType   = ref('');

    // Pagination
    const currentPage = ref(1);
    const pageSize    = ref(10);
    const totalCount  = ref(0);
    const totalPages  = computed(() => Math.ceil(totalCount.value / pageSize.value));

    let searchTimer: ReturnType<typeof setTimeout> | null = null;
    const onSearchInput = () => {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => { currentPage.value = 1; fetchRequests(); }, 400);
    };

    const goPage = (p: number) => {
        if (p < 1 || p > totalPages.value) return;
        currentPage.value = p;
        fetchRequests();
    };

    // ── Fetch ──────────────────────────────────────────────────────
    const fetchRequests = async () => {
        isLoading.value = true;
        try {
            const jwt    = authStore.accessToken;
            const params = new URLSearchParams();
            params.set('page',  String(currentPage.value));
            params.set('limit', String(pageSize.value));
            if (filterStatus.value) params.set('status',        filterStatus.value);
            if (filterType.value)   params.set('document_type', filterType.value);
            if (searchText.value)   params.set('search',        searchText.value);

            const res  = await fetch(`${LIST_URL}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

            requests.value   = json.data  ?? [];
            stats.value      = json.stats ?? {};
            totalCount.value = json.total ?? json.data?.length ?? 0;
        } catch (err: any) {
            console.error('fetchRequests error:', err.message);
        } finally {
            isLoading.value = false;
        }
    };

    // ── Helpers ────────────────────────────────────────────────────
    const formatAmount = (n: number) =>
        new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.floor(n || 0));

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

    const statusLabel = (s: string) =>
        ({ under_review: 'รอพิจารณา', verified: 'Verified', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ', draft: 'Draft', repaid: 'คืนวงเงินแล้ว' }[s] ?? s);

    const statusClass = (s: string) => ({
        under_review: 'badge bg-warning/20 text-warning',
        verified    : 'badge bg-info/20 text-info',
        approved    : 'badge bg-success/20 text-success',
        rejected    : 'badge bg-danger/20 text-danger',
        draft       : 'badge bg-secondary/20 text-secondary',
        repaid      : 'badge bg-primary/20 text-primary',
    }[s] ?? 'badge');

    // ── Repay Modal ────────────────────────────────────────────────
    const isRepayOpen     = ref(false);
    const repayTarget     = ref<any>(null);
    const repayNote       = ref('');
    const repayLoading    = ref(false);
    const repayInfoLoading= ref(false);
    const repayError      = ref('');
    const repayInfo       = ref({
        total_repaid  : 0,
        remaining     : 0,
        repayments    : [] as any[],
        po_items      : [] as any[],
        factoring_rate: 0,
    });
    const selectedPoItemIds = ref<string[]>([]);

    // Items that can still be marked paid (exclude paid + cancelled)
    const payablePoItems = computed(() =>
        (repayInfo.value.po_items ?? []).filter((i: any) => i.po_status !== 'paid' && i.po_status !== 'cancelled')
    );

    // Sum of repay_amount across selected items (server is authoritative; this is for UI display)
    const selectedRepaySum = computed(() => {
        const map = new Map<string, number>((repayInfo.value.po_items ?? []).map((i: any) => [i.id, Number(i.repay_amount) || 0]));
        return selectedPoItemIds.value.reduce((s, id) => s + (map.get(id) ?? 0), 0);
    });

    const selectAllPayable = () => {
        selectedPoItemIds.value = payablePoItems.value.map((i: any) => i.id);
    };

    const fetchRepayInfo = async (applicationId: string) => {
        repayInfoLoading.value = true;
        try {
            const jwt = authStore.accessToken;
            const res = await fetch(`${REPAY_URL}?application_id=${encodeURIComponent(applicationId)}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const data = await res.json();
            if (res.ok) {
                repayInfo.value = {
                    total_repaid  : data.total_repaid   ?? 0,
                    remaining     : data.remaining      ?? 0,
                    repayments    : data.repayments     ?? [],
                    po_items      : data.po_items       ?? [],
                    factoring_rate: data.factoring_rate ?? 0,
                };
            }
        } catch {}
        finally { repayInfoLoading.value = false; }
    };

    const openRepayModal = async (req: any) => {
        repayTarget.value       = req;
        repayNote.value         = '';
        repayError.value        = '';
        selectedPoItemIds.value = [];
        repayInfo.value         = { total_repaid: 0, remaining: 0, repayments: [], po_items: [], factoring_rate: 0 };
        isRepayOpen.value       = true;
        await fetchRepayInfo(req.id);
    };
    const closeRepayModal = () => { isRepayOpen.value = false; };

    const submitRepay = async () => {
        if (repayLoading.value) return;
        if (selectedPoItemIds.value.length === 0) {
            repayError.value = 'กรุณาเลือกใบ invoice อย่างน้อย 1 ใบ';
            return;
        }
        repayLoading.value = true;
        repayError.value   = '';
        try {
            const jwt = authStore.accessToken;
            const res = await fetch(REPAY_URL, {
                method : 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body   : JSON.stringify({
                    application_id: repayTarget.value.id,
                    po_item_ids   : selectedPoItemIds.value,
                    note          : repayNote.value || null,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

            const paidLabels = (json.paid_invoices ?? []).join(', ');

            if (json.fully_repaid) {
                closeRepayModal();
                await Swal.fire({
                    icon             : 'success',
                    title            : 'คืนวงเงินครบถ้วน!',
                    html             : `FACT นี้ถูกปิดเรียบร้อยแล้ว<br>ใบที่จ่าย: <strong>${paidLabels}</strong><br>วงเงิน ฿${formatAmount(json.repay_amount)} ถูกคืนกลับ Credit Line`,
                    confirmButtonColor: '#4361ee',
                });
                fetchRequests();
            } else {
                // Partial — refresh info and stay open
                const remaining = json.remaining ?? 0;
                await Swal.fire({
                    icon             : 'success',
                    title            : 'บันทึกการคืนวงเงินสำเร็จ',
                    html             : `ใบที่จ่าย: <strong>${paidLabels}</strong><br>คืนแล้ว ฿${formatAmount(json.repay_amount)}<br>คงค้างอีก <strong>฿${formatAmount(remaining)}</strong>`,
                    confirmButtonColor: '#4361ee',
                });
                repayNote.value         = '';
                selectedPoItemIds.value = [];
                await fetchRepayInfo(repayTarget.value.id);
                fetchRequests();
            }
        } catch (err: any) {
            repayError.value = err.message || 'เกิดข้อผิดพลาด';
        } finally {
            repayLoading.value = false;
        }
    };

    const formatRepayDate = (d: string) =>
        new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });

    onMounted(fetchRequests);
</script>
