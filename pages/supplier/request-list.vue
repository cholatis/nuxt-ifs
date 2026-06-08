<template>
    <div>
        <!-- Page Header -->
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-dark dark:text-white">My Factoring Requests</h2>
                <p class="mt-1 text-sm text-white-dark">รายการคำขอ Factoring ของฉัน</p>
            </div>
            <div class="flex items-center gap-3">
                <span class="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    {{ authStore.displayName }}
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
                <p class="text-2xl font-bold text-secondary">{{ stats.draft }}</p>
                <p class="text-sm text-white-dark">Draft</p>
            </div>
            <div class="panel rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-warning">{{ stats.under_review }}</p>
                <p class="text-sm text-white-dark">รอพิจารณา</p>
            </div>
            <div class="panel rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-success">{{ stats.approved }}</p>
                <p class="text-sm text-white-dark">อนุมัติแล้ว</p>
            </div>
            <div class="panel rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-danger">{{ stats.rejected }}</p>
                <p class="text-sm text-white-dark">ปฏิเสธ</p>
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
                    />
                    <span class="absolute start-3 top-1/2 -translate-y-1/2 text-white-dark">
                        <icon-search class="h-4 w-4" />
                    </span>
                </div>
                <select v-model="filterStatus" class="form-select w-44">
                    <option value="all">ทุกสถานะ</option>
                    <option value="draft">Draft</option>
                    <option value="under_review">รอพิจารณา</option>
                    <option value="approved">อนุมัติแล้ว</option>
                    <option value="rejected">ปฏิเสธ</option>
                </select>
                <select v-model="filterType" class="form-select w-44">
                    <option value="all">ทุกประเภท</option>
                    <option value="credit_line">Credit Line</option>
                    <option value="drawdown">Drawdown</option>
                </select>
                <div class="flex gap-2 ml-auto">
                    <NuxtLink to="/supplier/new-line-application" class="btn btn-info btn-sm gap-1">
                        <icon-plus class="h-4 w-4" />
                        New Line Application
                    </NuxtLink>
                    <NuxtLink to="/supplier/new-factoring-request" class="btn btn-primary btn-sm gap-1">
                        <icon-plus class="h-4 w-4" />
                        New Factoring Request
                    </NuxtLink>
                </div>
            </div>
        </div>

        <!-- Fetch error banner -->
        <div v-if="fetchError" class="panel mb-4 flex items-center justify-between gap-3 border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <span>{{ fetchError }}</span>
            <button @click="fetchRequests()" class="btn btn-outline-danger btn-sm">ลองใหม่</button>
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
                            <th>จำนวนเงิน (บาท)</th>
                            <th>ระยะเครดิต</th>
                            <th>วันที่ยื่น</th>
                            <th class="text-center">สถานะ</th>
                            <th class="text-center">การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="req in requests" :key="req.id">
                            <td class="font-semibold text-primary">{{ req.id }}</td>
                            <td>
                                <span :class="req.document_type === 'credit_line' ? 'badge bg-info/20 text-info' : 'badge bg-warning/20 text-warning'">
                                    {{ req.document_type === 'credit_line' ? 'Credit Line'
                                        : req.drawdown_type === 'po' ? 'Factoring (PO)'
                                        : 'Factoring (Invoice)' }}
                                </span>
                            </td>
                            <td>{{ req.company_name }}</td>
                            <td class="text-sm text-white-dark">{{ req.buyer_name || '-' }}</td>
                            <td class="font-semibold">{{ formatAmount(req.requested_amount ?? req.requested_credit_limit) }}</td>
                            <td>{{ req.credit_period }} วัน</td>
                            <td class="text-white-dark text-sm">{{ formatDate(req.submit_date || req.created_at) }}</td>
                            <td class="text-center">
                                <span :class="statusClass(req.status)">{{ statusLabel(req.status) }}</span>
                            </td>
                            <td class="text-center">
                                <!-- Draft: Edit + Submit + Delete -->
                                <div v-if="req.status === 'draft'" class="flex items-center justify-center gap-2">
                                    <NuxtLink
                                        :to="req.document_type === 'drawdown'
                                            ? `/supplier/new-factoring-request?draft=${req.id}`
                                            : `/supplier/new-line-application?draft=${req.id}`"
                                        class="btn btn-outline-primary btn-sm gap-1 px-3"
                                    >
                                        <icon-edit class="h-4 w-4" />
                                        Edit
                                    </NuxtLink>
                                    <button
                                        @click="openSubmitModal(req)"
                                        class="btn btn-success btn-sm gap-1 px-3"
                                        :disabled="actionLoading === req.id"
                                    >
                                        <icon-send class="h-4 w-4" />
                                        Submit
                                    </button>
                                    <button
                                        @click="openDeleteModal(req)"
                                        class="btn btn-danger btn-sm gap-1 px-3"
                                        :disabled="actionLoading === req.id"
                                    >
                                        <icon-trash-lines class="h-4 w-4" />
                                        Delete
                                    </button>
                                </div>
                                <!-- Rejected: Edit + Resubmit -->
                                <div v-else-if="req.status === 'rejected'" class="flex items-center justify-center gap-2">
                                    <NuxtLink
                                        :to="req.document_type === 'drawdown'
                                            ? `/supplier/new-factoring-request?draft=${req.id}`
                                            : `/supplier/new-line-application?draft=${req.id}`"
                                        class="btn btn-outline-primary btn-sm gap-1 px-3"
                                    >
                                        <icon-edit class="h-4 w-4" />
                                        Edit
                                    </NuxtLink>
                                    <button
                                        @click="openSubmitModal(req)"
                                        class="btn btn-success btn-sm gap-1 px-3"
                                        :disabled="actionLoading === req.id"
                                    >
                                        <icon-send class="h-4 w-4" />
                                        Submit
                                    </button>
                                </div>
                                <!-- under_review / verified / approved: View -->
                                <NuxtLink v-else
                                    :to="`/supplier/view-request/${req.id}`"
                                    class="btn btn-outline-primary btn-sm gap-1 px-3"
                                >
                                    <icon-eye class="h-4 w-4" />
                                    View
                                </NuxtLink>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Pagination -->
                <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between border-t border-[#e0e6ed] pt-4 dark:border-[#1b2e4b]">
                    <span class="text-sm text-white-dark">ทั้งหมด {{ totalItems }} รายการ</span>
                    <div class="flex items-center gap-1">
                        <button @click="currentPage--; fetchRequests()" :disabled="currentPage <= 1" class="btn btn-outline-primary btn-sm px-3">&lt;</button>
                        <span class="px-3 text-sm">{{ currentPage }} / {{ totalPages }}</span>
                        <button @click="currentPage++; fetchRequests()" :disabled="currentPage >= totalPages" class="btn btn-outline-primary btn-sm px-3">&gt;</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Submit Confirmation Modal -->
        <TransitionRoot appear :show="isSubmitModalOpen" as="template">
            <Dialog as="div" @close="closeModals" class="relative z-50">
                <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                    leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-black/60" />
                </TransitionChild>
                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                            enter-to="opacity-100 scale-100" leave="duration-200 ease-in" leave-from="opacity-100 scale-100"
                            leave-to="opacity-0 scale-95">
                            <DialogPanel class="w-full max-w-md rounded-xl bg-white p-6 dark:bg-[#1b2e4b]">
                                <div class="mb-4 flex items-center gap-3">
                                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-success/20 text-success">
                                        <icon-send class="h-5 w-5" />
                                    </div>
                                    <DialogTitle class="text-lg font-bold dark:text-white">ยืนยันการส่งคำขอ</DialogTitle>
                                </div>
                                <p class="mb-2 text-sm text-white-dark">
                                    คำขอ: <span class="font-semibold text-dark dark:text-white">{{ selectedRequest?.id }}</span>
                                </p>
                                <p class="mb-4 text-sm text-white-dark">
                                    เมื่อส่งแล้วจะไม่สามารถแก้ไขหรือลบได้ ยืนยันหรือไม่?
                                </p>
                                <p v-if="submitError" class="mb-3 text-sm text-danger">{{ submitError }}</p>
                                <div class="flex justify-end gap-3">
                                    <button @click="closeModals" class="btn btn-outline-secondary">ยกเลิก</button>
                                    <button @click="submitRequest" class="btn btn-success" :disabled="!!actionLoading">
                                        <span v-if="actionLoading" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                        ยืนยันส่งคำขอ
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>

        <!-- Delete Confirmation Modal -->
        <TransitionRoot appear :show="isDeleteModalOpen" as="template">
            <Dialog as="div" @close="closeModals" class="relative z-50">
                <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                    leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-black/60" />
                </TransitionChild>
                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                            enter-to="opacity-100 scale-100" leave="duration-200 ease-in" leave-from="opacity-100 scale-100"
                            leave-to="opacity-0 scale-95">
                            <DialogPanel class="w-full max-w-md rounded-xl bg-white p-6 dark:bg-[#1b2e4b]">
                                <div class="mb-4 flex items-center gap-3">
                                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-danger/20 text-danger">
                                        <icon-trash-lines class="h-5 w-5" />
                                    </div>
                                    <DialogTitle class="text-lg font-bold dark:text-white">ยืนยันการลบ</DialogTitle>
                                </div>
                                <p class="mb-2 text-sm text-white-dark">
                                    คำขอ: <span class="font-semibold text-dark dark:text-white">{{ selectedRequest?.id }}</span>
                                </p>
                                <p class="mb-4 text-sm text-white-dark">การลบไม่สามารถยกเลิกได้ ยืนยันหรือไม่?</p>
                                <div class="flex justify-end gap-3">
                                    <button @click="closeModals" class="btn btn-outline-secondary">ยกเลิก</button>
                                    <button @click="deleteRequest" class="btn btn-danger" :disabled="!!actionLoading">
                                        <span v-if="actionLoading" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                        ยืนยันลบ
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>
    </div>
</template>

<script lang="ts" setup>
    import { ref, watch, onMounted } from 'vue';
    import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
    import { useAuthStore } from '@/stores/auth';
    import { useAuth } from '@/composables/useAuth';

    useHead({ title: 'My Requests - IFS Finance' });
    definePageMeta({ layout: 'default' });

    const authStore = useAuthStore();
    const { logout } = useAuth();

    const getJwt = async (): Promise<string> => {
        const { $supabase } = useNuxtApp();
        const { data: { session } } = await ($supabase as any).auth.getSession();
        const jwt = session?.access_token || authStore.accessToken;
        if (!jwt) throw new Error('กรุณาเข้าสู่ระบบใหม่');
        return jwt;
    };

    const LIST_URL   = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/listapplication';
    const UPDATE_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/updateapplication';
    const DELETE_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/deleteapplication';

    const requests      = ref<any[]>([]);
    const stats         = ref({ draft: 0, under_review: 0, approved: 0, rejected: 0 });
    const isLoading     = ref(false);
    const actionLoading = ref<string | null>(null);
    const fetchError    = ref<string | null>(null);
    const submitError   = ref<string | null>(null);
    const searchText   = ref('');
    const filterStatus = ref('all');
    const filterType   = ref('all');

    // Pagination
    const currentPage  = ref(1);
    const totalItems   = ref(0);
    const pageSize     = ref(20);
    const totalPages   = ref(0);

    const isSubmitModalOpen = ref(false);
    const isDeleteModalOpen = ref(false);
    const selectedRequest   = ref<any>(null);

    // ── Fetch from Edge Function ───────────────────────────────────
    const fetchRequests = async () => {
        isLoading.value  = true;
        fetchError.value = null;
        try {
            const jwt = await getJwt();

            const params = new URLSearchParams();
            params.set('submitted_by', authStore.user?.id ?? '');
            params.set('page',  String(currentPage.value));
            params.set('limit', String(pageSize.value));
            if (filterStatus.value !== 'all') params.set('status',        filterStatus.value);
            if (filterType.value   !== 'all') params.set('document_type', filterType.value);
            if (searchText.value.trim())      params.set('search',        searchText.value.trim());

            const res  = await fetch(`${LIST_URL}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const text = await res.text();
            let json: any = {};
            try { json = JSON.parse(text); } catch {}
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

            requests.value   = json.data       ?? [];
            totalItems.value = json.pagination?.total      ?? 0;
            totalPages.value = json.pagination?.totalPages ?? 0;
            stats.value      = json.stats ?? { draft: 0, under_review: 0, approved: 0, rejected: 0 };
        } catch (err: any) {
            fetchError.value = err.message;
            console.error('Error fetching requests:', err);
        } finally {
            isLoading.value = false;
        }
    };

    // Debounce search
    let searchTimer: ReturnType<typeof setTimeout> | null = null;
    watch(searchText, () => {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => { currentPage.value = 1; fetchRequests(); }, 400);
    });

    watch([filterStatus, filterType], () => { currentPage.value = 1; fetchRequests(); });

    // ── Modal helpers ──────────────────────────────────────────────
    const openSubmitModal = (req: any) => { selectedRequest.value = req; isSubmitModalOpen.value = true; };
    const openDeleteModal = (req: any) => { selectedRequest.value = req; isDeleteModalOpen.value = true; };
    const closeModals = () => {
        isSubmitModalOpen.value = false;
        isDeleteModalOpen.value = false;
        selectedRequest.value   = null;
        submitError.value       = null;
    };

    // ── Submit via updateapplication PATCH ────────────────────────
    const submitRequest = async () => {
        if (!selectedRequest.value) return;
        actionLoading.value = selectedRequest.value.id;
        submitError.value   = null;
        try {
            const jwt = await getJwt();

            const res = await fetch(UPDATE_URL, {
                method : 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body   : JSON.stringify({ id: selectedRequest.value.id, status: 'under_review' }),
            });
            const text = await res.text();
            let json: any = {};
            try { json = JSON.parse(text); } catch {}
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
            closeModals();
            await fetchRequests();
        } catch (err: any) {
            submitError.value = err.message;
            console.error('Error submitting request:', err);
        } finally {
            actionLoading.value = null;
        }
    };

    // ── Delete via deleteapplication Edge Function ─────────────────
    const deleteRequest = async () => {
        if (!selectedRequest.value) return;
        actionLoading.value = selectedRequest.value.id;
        try {
            const jwt = await getJwt();
            const res = await fetch(`${DELETE_URL}?id=${encodeURIComponent(selectedRequest.value.id)}`, {
                method : 'DELETE',
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
            closeModals();
            await fetchRequests();
        } catch (err: any) {
            console.error('Error deleting request:', err.message);
        } finally {
            actionLoading.value = null;
        }
    };

    // ── Helpers ────────────────────────────────────────────────────
    const formatAmount = (amount: number | null) =>
        amount != null
            ? new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.floor(amount))
            : '-';

    const formatDate = (date: string | null) =>
        date ? new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

    const statusLabel = (status: string) => {
        const map: Record<string, string> = {
            draft: 'Draft', under_review: 'รอพิจารณา', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ',
        };
        return map[status] || status;
    };

    const statusClass = (status: string) => {
        const map: Record<string, string> = {
            draft: 'badge bg-secondary/20 text-secondary',
            under_review: 'badge bg-warning/20 text-warning',
            approved: 'badge bg-success/20 text-success',
            rejected: 'badge bg-danger/20 text-danger',
        };
        return map[status] || 'badge';
    };

    onMounted(() => fetchRequests());
</script>
