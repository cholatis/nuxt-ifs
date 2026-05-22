<template>
    <div>
        <!-- Page Header -->
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-dark dark:text-white">Factoring Request List</h2>
                <p class="mt-1 text-sm text-white-dark">รายการคำขอ Factoring ทั้งหมดในระบบ</p>
            </div>
            <span class="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">GEC Admin</span>
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
                    <option value="draft">Draft</option>
                    <option value="under_review">รอ Verify</option>
                    <option value="verified">Verified</option>
                    <option value="approved">อนุมัติแล้ว</option>
                    <option value="rejected">ปฏิเสธ</option>
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
                            <th>Buyer / PO</th>
                            <th class="text-right">จำนวนเงิน (บาท)</th>
                            <th class="text-center">ระยะเครดิต</th>
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
                            <td class="text-center">{{ req.credit_period ?? '-' }} วัน</td>
                            <td class="text-white-dark text-sm">{{ formatDate(req.created_at) }}</td>
                            <td class="text-center">
                                <span :class="statusClass(req.status)">{{ statusLabel(req.status) }}</span>
                            </td>
                            <td class="text-center">
                                <div class="flex items-center justify-center gap-2">
                                    <NuxtLink
                                        :to="`/gec/view-request/${req.id}`"
                                        class="btn btn-outline-primary btn-sm gap-1 px-3"
                                    >
                                        <icon-eye class="h-4 w-4" />
                                        View
                                    </NuxtLink>
                                    <button
                                        v-if="req.status === 'draft'"
                                        @click="openDeleteModal(req)"
                                        class="btn btn-outline-danger btn-sm gap-1 px-3"
                                        :disabled="deleteLoading === req.id"
                                    >
                                        <span v-if="deleteLoading === req.id" class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-danger border-l-transparent"></span>
                                        <icon-trash v-else class="h-4 w-4" />
                                        ลบ
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
        <!-- Delete Confirm Modal -->
        <TransitionRoot appear :show="isDeleteModalOpen" as="template">
            <Dialog as="div" @close="closeDeleteModal" class="relative z-50">
                <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                    leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-black/60" />
                </TransitionChild>
                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                            enter-to="opacity-100 scale-100" leave="duration-200 ease-in" leave-from="opacity-100 scale-100"
                            leave-to="opacity-0 scale-95">
                            <DialogPanel class="w-full max-w-sm rounded-xl bg-white p-6 dark:bg-[#1b2e4b]">
                                <div class="mb-4 flex items-center gap-3">
                                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-danger/20 text-danger">
                                        <icon-trash class="h-5 w-5" />
                                    </div>
                                    <DialogTitle class="text-lg font-bold dark:text-white">ยืนยันการลบคำขอ</DialogTitle>
                                </div>
                                <p class="mb-1 text-sm text-white-dark">
                                    เลขที่คำขอ: <span class="font-semibold text-dark dark:text-white">{{ deleteTarget?.id }}</span>
                                </p>
                                <p class="mb-1 text-sm text-white-dark">
                                    บริษัท: <span class="font-semibold text-dark dark:text-white">{{ deleteTarget?.company_name }}</span>
                                </p>
                                <p class="mb-4 text-sm text-white-dark">
                                    จำนวนเงิน: <span class="font-semibold text-dark dark:text-white">{{ formatAmount(deleteTarget?.requested_amount ?? deleteTarget?.requested_credit_limit ?? 0) }} บาท</span>
                                </p>
                                <p class="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                                    การลบนี้ไม่สามารถย้อนกลับได้ คุณแน่ใจหรือไม่?
                                </p>
                                <div v-if="deleteError" class="mb-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                                    {{ deleteError }}
                                </div>
                                <div class="flex justify-end gap-3">
                                    <button @click="closeDeleteModal" class="btn btn-outline-secondary">ยกเลิก</button>
                                    <button
                                        @click="submitDelete"
                                        class="btn btn-danger"
                                        :disabled="deleteLoading === deleteTarget?.id"
                                    >
                                        <span v-if="deleteLoading === deleteTarget?.id" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                        <icon-trash v-else class="mr-1 h-4 w-4" />
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
    import { ref, computed, onMounted } from 'vue';
    import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
    import { useAuthStore } from '@/stores/auth';

    useHead({ title: 'Request List - IFS Finance (GEC)' });
    definePageMeta({ layout: 'default' });

    const LIST_URL   = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/listapplication';
    const DELETE_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/deleteapplication';

    const authStore = useAuthStore();

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
    const totalPages  = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)));

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
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;

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
            console.error('[gec/request-list] fetchRequests error:', err.message);
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
        ({ under_review: 'รอ Verify', verified: 'Verified', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ', draft: 'Draft' }[s] ?? s);

    const statusClass = (s: string) => ({
        under_review: 'badge bg-warning/20 text-warning',
        verified    : 'badge bg-info/20 text-info',
        approved    : 'badge bg-success/20 text-success',
        rejected    : 'badge bg-danger/20 text-danger',
        draft       : 'badge bg-secondary/20 text-secondary',
    }[s] ?? 'badge');

    // ── Delete ─────────────────────────────────────────────────────
    const isDeleteModalOpen = ref(false);
    const deleteTarget      = ref<any>(null);
    const deleteLoading     = ref<string | null>(null);
    const deleteError       = ref('');

    const openDeleteModal = (req: any) => {
        deleteTarget.value      = req;
        deleteError.value       = '';
        isDeleteModalOpen.value = true;
    };

    const closeDeleteModal = () => {
        isDeleteModalOpen.value = false;
        deleteTarget.value      = null;
        deleteError.value       = '';
    };

    const submitDelete = async () => {
        if (!deleteTarget.value) return;
        deleteLoading.value = deleteTarget.value.id;
        deleteError.value   = '';
        try {
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;

            const res = await fetch(DELETE_URL, {
                method : 'DELETE',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body   : JSON.stringify({ id: deleteTarget.value.id }),
            });
            const json = await res.json();
            if (!res.ok) {
                deleteError.value = json.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
                return;
            }
            closeDeleteModal();
            await fetchRequests();
        } catch {
            deleteError.value = 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่';
        } finally {
            deleteLoading.value = null;
        }
    };

    onMounted(fetchRequests);
</script>
