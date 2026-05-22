<template>
    <div>
        <!-- Page Header -->
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-dark dark:text-white">Supplier Registration List</h2>
                <p class="mt-1 text-sm text-white-dark">รายการคำขอสมัครสมาชิก Supplier ที่รอการอนุมัติ</p>
            </div>
            <span class="rounded-full bg-warning/10 px-3 py-1 text-sm font-semibold text-warning">
                รอพิจารณา {{ pendingCount }} ราย
            </span>
        </div>

        <!-- Filter Bar -->
        <div class="panel mb-4">
            <div class="flex flex-wrap items-center gap-3">
                <div class="relative flex-1 min-w-[200px]">
                    <input
                        v-model="searchText"
                        type="text"
                        class="form-input ps-9"
                        placeholder="ค้นหาชื่อ, บริษัท, อีเมล..."
                    />
                    <span class="absolute start-3 top-1/2 -translate-y-1/2 text-white-dark">
                        <icon-search class="h-4 w-4" />
                    </span>
                </div>
                <select v-model="filterStatus" class="form-select w-44">
                    <option value="all">ทุกสถานะ</option>
                    <option value="draft">Draft</option>
                    <option value="pending">รอพิจารณา</option>
                    <option value="approved">อนุมัติแล้ว</option>
                    <option value="rejected">ปฏิเสธ</option>
                </select>
            </div>
        </div>

        <!-- Table -->
        <div class="panel">
            <div v-if="isLoading" class="flex items-center justify-center py-20">
                <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
                <span class="ml-3 text-white-dark">กำลังโหลด...</span>
            </div>

            <div v-else-if="registrations.length === 0" class="py-20 text-center text-white-dark">
                ไม่พบรายการ
            </div>

            <div v-else class="table-responsive">
                <table class="table-hover table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>ชื่อ-นามสกุล</th>
                            <th>ชื่อบริษัท</th>
                            <th>Email</th>
                            <th>วันที่สมัคร</th>
                            <th class="text-center">สถานะ</th>
                            <th class="text-center">การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(reg, idx) in registrations" :key="reg.id">
                            <td class="text-white-dark">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
                            <td class="font-semibold">{{ reg.fullname || '—' }}</td>
                            <td>{{ reg.companyname || '—' }}</td>
                            <td class="text-white-dark">{{ reg.email }}</td>
                            <td class="text-sm text-white-dark">{{ formatDate(reg.created_at) }}</td>
                            <td class="text-center">
                                <span :class="statusClass(reg.status)">{{ statusLabel(reg.status) }}</span>
                            </td>
                            <td class="text-center">
                                <div v-if="reg.status === 'pending' || reg.status === 'draft'" class="flex items-center justify-center gap-2">
                                    <button
                                        @click="openActionModal(reg, 'approved')"
                                        class="btn btn-success btn-sm gap-1 px-3"
                                        :disabled="actionLoading === reg.id"
                                    >
                                        <icon-circle-check class="h-4 w-4" />
                                        Approve
                                    </button>
                                    <button
                                        @click="openActionModal(reg, 'rejected')"
                                        class="btn btn-danger btn-sm gap-1 px-3"
                                        :disabled="actionLoading === reg.id"
                                    >
                                        <icon-x class="h-4 w-4" />
                                        Reject
                                    </button>
                                </div>
                                <div v-else-if="reg.status === 'approved'" class="flex items-center justify-center">
                                    <button
                                        @click="openResendModal(reg)"
                                        class="btn btn-outline-info btn-sm gap-1 px-3"
                                        :disabled="resendLoading === reg.id"
                                    >
                                        <span v-if="resendLoading === reg.id" class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-info border-l-transparent"></span>
                                        <icon-mail v-else class="h-4 w-4" />
                                        ส่ง Email อีกครั้ง
                                    </button>
                                </div>
                                <span v-else class="text-sm text-white-dark">—</span>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Pagination -->
                <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between border-t border-[#e0e6ed] pt-4 dark:border-[#1b2e4b]">
                    <span class="text-sm text-white-dark">ทั้งหมด {{ totalItems }} รายการ</span>
                    <div class="flex items-center gap-1">
                        <button
                            @click="currentPage--; fetchRegistrations()"
                            :disabled="currentPage <= 1"
                            class="btn btn-outline-primary btn-sm px-3"
                        >&lt;</button>
                        <span class="px-3 text-sm">{{ currentPage }} / {{ totalPages }}</span>
                        <button
                            @click="currentPage++; fetchRegistrations()"
                            :disabled="currentPage >= totalPages"
                            class="btn btn-outline-primary btn-sm px-3"
                        >&gt;</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Resend Email Modal -->
        <TransitionRoot appear :show="isResendModalOpen" as="template">
            <Dialog as="div" @close="closeResendModal" class="relative z-50">
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
                                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-info/20 text-info">
                                        <icon-mail class="h-5 w-5" />
                                    </div>
                                    <DialogTitle class="text-lg font-bold dark:text-white">ส่ง Email ข้อมูลเข้าระบบอีกครั้ง</DialogTitle>
                                </div>

                                <p class="mb-1 text-sm text-white-dark">
                                    ชื่อ: <span class="font-semibold text-dark dark:text-white">{{ resendReg?.fullname }}</span>
                                </p>
                                <p class="mb-1 text-sm text-white-dark">
                                    บริษัท: <span class="font-semibold text-dark dark:text-white">{{ resendReg?.companyname }}</span>
                                </p>
                                <p class="mb-4 text-sm text-white-dark">
                                    Email: <span class="font-semibold text-dark dark:text-white">{{ resendReg?.email }}</span>
                                </p>

                                <p class="mb-4 rounded-lg bg-info/10 px-4 py-3 text-sm text-info">
                                    ระบบจะส่ง Email พร้อม Username และลิงก์ตั้งรหัสผ่านไปยัง <strong>{{ resendReg?.email }}</strong> อีกครั้ง
                                </p>

                                <div v-if="resendSuccess" class="mb-3 rounded border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                                    ✓ ส่ง Email เรียบร้อยแล้ว
                                </div>
                                <div v-if="resendError" class="mb-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                                    {{ resendError }}
                                </div>

                                <div class="flex justify-end gap-3">
                                    <button @click="closeResendModal" class="btn btn-outline-secondary">ยกเลิก</button>
                                    <button
                                        @click="submitResend"
                                        class="btn btn-info"
                                        :disabled="resendLoading === resendReg?.id || resendSuccess"
                                    >
                                        <span v-if="resendLoading === resendReg?.id" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                        <icon-mail v-else class="mr-1 h-4 w-4" />
                                        ยืนยันส่ง Email
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>

        <!-- Approve/Reject Modal -->
        <TransitionRoot appear :show="isModalOpen" as="template">
            <Dialog as="div" @close="closeModal" class="relative z-50">
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
                                    <div :class="selectedAction === 'approved' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'"
                                        class="flex h-10 w-10 items-center justify-center rounded-full">
                                        <icon-circle-check v-if="selectedAction === 'approved'" class="h-5 w-5" />
                                        <icon-x v-else class="h-5 w-5" />
                                    </div>
                                    <DialogTitle class="text-lg font-bold dark:text-white">
                                        {{ selectedAction === 'approved' ? 'ยืนยันการอนุมัติ' : 'ยืนยันการปฏิเสธ' }}
                                    </DialogTitle>
                                </div>

                                <p class="mb-1 text-sm text-white-dark">
                                    ชื่อ: <span class="font-semibold text-dark dark:text-white">{{ selectedReg?.fullname }}</span>
                                </p>
                                <p class="mb-1 text-sm text-white-dark">
                                    บริษัท: <span class="font-semibold text-dark dark:text-white">{{ selectedReg?.companyname }}</span>
                                </p>
                                <p class="mb-4 text-sm text-white-dark">
                                    Email: <span class="font-semibold text-dark dark:text-white">{{ selectedReg?.email }}</span>
                                </p>

                                <!-- Supplier mapping (approve only) -->
                                <div v-if="selectedAction === 'approved'" class="mb-4">
                                    <label class="mb-1 block text-sm font-medium dark:text-white">
                                        Map กับ Supplier <span class="text-danger">*</span>
                                    </label>
                                    <div class="relative">
                                        <input
                                            v-model="supplierSearch"
                                            @input="onSupplierSearch"
                                            type="text"
                                            class="form-input w-full"
                                            :placeholder="selectedSupplier ? `${selectedSupplier.supplier_code} — ${selectedSupplier.supplier_name}` : 'พิมพ์รหัสหรือชื่อ supplier...'"
                                            @focus="showSupplierDropdown = true"
                                        />
                                        <!-- Dropdown -->
                                        <div v-if="showSupplierDropdown && supplierOptions.length > 0"
                                            class="absolute z-50 mt-1 w-full rounded-lg border border-[#e0e6ed] bg-white shadow-lg dark:border-[#1b2e4b] dark:bg-[#1b2e4b] max-h-52 overflow-y-auto">
                                            <div v-if="isLoadingSuppliers" class="px-4 py-3 text-sm text-white-dark">กำลังโหลด...</div>
                                            <button
                                                v-else
                                                v-for="s in supplierOptions"
                                                :key="s.supplier_code"
                                                type="button"
                                                @click="selectSupplier(s)"
                                                class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-primary/10 dark:hover:bg-primary/20"
                                            >
                                                <span class="font-mono text-xs text-primary bg-primary/10 rounded px-1.5 py-0.5">{{ s.supplier_code }}</span>
                                                <span class="text-dark dark:text-white">{{ s.supplier_name }}</span>
                                            </button>
                                        </div>
                                    </div>
                                    <p v-if="selectedSupplier" class="mt-1.5 text-xs text-success">
                                        ✓ เลือกแล้ว: {{ selectedSupplier.supplier_code }} — {{ selectedSupplier.supplier_name }}
                                    </p>
                                    <p v-else class="mt-1 text-xs text-white-dark">กรุณาเลือก supplier ที่ผู้ใช้นี้เป็นตัวแทน</p>
                                </div>

                                <!-- Reject reason -->
                                <div v-if="selectedAction === 'rejected'" class="mb-4">
                                    <label class="mb-1 block text-sm font-medium dark:text-white">เหตุผล (ไม่บังคับ)</label>
                                    <textarea v-model="rejectNote" rows="2" class="form-textarea w-full" placeholder="ระบุเหตุผลที่ปฏิเสธ"></textarea>
                                </div>

                                <div v-if="actionError" class="mb-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                                    {{ actionError }}
                                </div>

                                <div class="flex justify-end gap-3">
                                    <button @click="closeModal" class="btn btn-outline-secondary">ยกเลิก</button>
                                    <button
                                        @click="submitAction"
                                        :class="selectedAction === 'approved' ? 'btn btn-success' : 'btn btn-danger'"
                                        :disabled="actionLoading === selectedReg?.id"
                                    >
                                        <span v-if="actionLoading === selectedReg?.id" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                        {{ selectedAction === 'approved' ? 'ยืนยันอนุมัติ' : 'ยืนยันปฏิเสธ' }}
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
    import { ref, computed, onMounted, watch } from 'vue';
    import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';

    useHead({ title: 'Registration List - IFS Finance' });
    definePageMeta({ layout: 'default' });

    const { $supabase } = useNuxtApp();

    const EDGE_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/listregistration';

    const registrations = ref<any[]>([]);
    const isLoading = ref(false);
    const actionLoading = ref<string | null>(null);
    const searchText = ref('');
    const filterStatus = ref('pending');

    // Pagination
    const currentPage = ref(1);
    const totalItems = ref(0);
    const pageSize = ref(20);
    const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));

    const isModalOpen = ref(false);
    const selectedReg = ref<any>(null);
    const selectedAction = ref<'approved' | 'rejected'>('approved');
    const rejectNote = ref('');

    // Supplier mapping
    const SUPPLIERS_URL       = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/listsuppliers';
    const supplierSearch      = ref('');
    const supplierOptions     = ref<any[]>([]);
    const selectedSupplier    = ref<any>(null);
    const showSupplierDropdown = ref(false);
    const isLoadingSuppliers  = ref(false);

    let supplierTimer: ReturnType<typeof setTimeout> | null = null;
    const onSupplierSearch = () => {
        selectedSupplier.value = null;
        if (supplierTimer) clearTimeout(supplierTimer);
        supplierTimer = setTimeout(() => fetchSupplierOptions(supplierSearch.value), 300);
    };

    const fetchSupplierOptions = async (search = '') => {
        isLoadingSuppliers.value = true;
        try {
            const res  = await fetch(`${SUPPLIERS_URL}${search ? `?search=${encodeURIComponent(search)}` : ''}`);
            const json = await res.json();
            supplierOptions.value = json.data ?? [];
            showSupplierDropdown.value = true;
        } catch {}
        finally { isLoadingSuppliers.value = false; }
    };

    const selectSupplier = (s: any) => {
        selectedSupplier.value    = s;
        supplierSearch.value      = '';
        showSupplierDropdown.value = false;
    };

    const pendingCount = ref(0);

    const fetchPendingCount = async () => {
        try {
            const res = await fetch(`${EDGE_URL}?status=pending&limit=1`);
            const json = await res.json();
            pendingCount.value = json.pagination?.total ?? 0;
        } catch {}
    };

    const fetchRegistrations = async () => {
        isLoading.value = true;
        try {
            const params = new URLSearchParams();
            if (filterStatus.value !== 'all') params.set('status', filterStatus.value);
            if (searchText.value.trim()) params.set('search', searchText.value.trim());
            params.set('page', String(currentPage.value));
            params.set('limit', String(pageSize.value));

            const res = await fetch(`${EDGE_URL}?${params.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            registrations.value = json.data || [];
            totalItems.value = json.pagination?.total ?? 0;
        } catch (err) {
            console.error('Error fetching registrations:', err);
            registrations.value = [];
        } finally {
            isLoading.value = false;
        }
    };

    // Debounce search
    let searchTimer: ReturnType<typeof setTimeout> | null = null;
    watch(searchText, () => {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            currentPage.value = 1;
            fetchRegistrations();
        }, 400);
    });

    watch(filterStatus, () => {
        currentPage.value = 1;
        fetchRegistrations();
    });

    const openActionModal = (reg: any, action: 'approved' | 'rejected') => {
        selectedReg.value         = reg;
        selectedAction.value      = action;
        rejectNote.value          = '';
        selectedSupplier.value    = null;
        supplierSearch.value      = '';
        supplierOptions.value     = [];
        showSupplierDropdown.value = false;
        isModalOpen.value         = true;
        // Pre-load supplier list when opening approve modal
        if (action === 'approved') fetchSupplierOptions();
    };

    const closeModal = () => {
        isModalOpen.value          = false;
        selectedReg.value          = null;
        actionError.value          = '';
        rejectNote.value           = '';
        selectedSupplier.value     = null;
        supplierSearch.value       = '';
        showSupplierDropdown.value = false;
    };

    const UPDATE_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/updateregistration';
    const actionError = ref('');

    // Resend email
    const isResendModalOpen = ref(false);
    const resendReg         = ref<any>(null);
    const resendLoading     = ref<string | null>(null);
    const resendError       = ref('');
    const resendSuccess     = ref(false);

    const openResendModal = (reg: any) => {
        resendReg.value         = reg;
        resendError.value       = '';
        resendSuccess.value     = false;
        isResendModalOpen.value = true;
    };

    const closeResendModal = () => {
        isResendModalOpen.value = false;
        resendReg.value         = null;
        resendError.value       = '';
        resendSuccess.value     = false;
    };

    const submitResend = async () => {
        if (!resendReg.value) return;
        resendLoading.value = resendReg.value.id;
        resendError.value   = '';
        resendSuccess.value = false;
        try {
            const res = await fetch(UPDATE_URL, {
                method : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({ id: resendReg.value.id, action: 'resend' }),
            });
            const json = await res.json();
            if (!res.ok) {
                resendError.value = json.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
                return;
            }
            resendSuccess.value = true;
            setTimeout(closeResendModal, 2000);
        } catch {
            resendError.value = 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่';
        } finally {
            resendLoading.value = null;
        }
    };

    const submitAction = async () => {
        if (!selectedReg.value) return;
        // Require supplier selection when approving
        if (selectedAction.value === 'approved' && !selectedSupplier.value) {
            actionError.value = 'กรุณาเลือก Supplier ก่อนอนุมัติ';
            return;
        }
        actionLoading.value = selectedReg.value.id;
        actionError.value = '';
        try {
            const body: Record<string, any> = {
                id    : selectedReg.value.id,
                action: selectedAction.value,
            };
            if (selectedAction.value === 'rejected' && rejectNote.value.trim()) {
                body.note = rejectNote.value.trim();
            }
            if (selectedAction.value === 'approved' && selectedSupplier.value) {
                body.supplier_code = selectedSupplier.value.supplier_code;
                body.supplier_name = selectedSupplier.value.supplier_name;
            }

            const res = await fetch(UPDATE_URL, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const json = await res.json();

            if (!res.ok) {
                actionError.value = json.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
                return;
            }

            closeModal();
            await fetchRegistrations();
            await fetchPendingCount();
        } catch (err) {
            console.error('Error updating registration:', err);
            actionError.value = 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่';
        } finally {
            actionLoading.value = null;
        }
    };

    const formatDate = (date: string) =>
        date ? new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

    const statusLabel = (status: string) => {
        const map: Record<string, string> = {
            draft: 'Draft',
            pending: 'รอพิจารณา',
            approved: 'อนุมัติแล้ว',
            rejected: 'ปฏิเสธ',
        };
        return map[status] || status;
    };

    const statusClass = (status: string) => {
        const map: Record<string, string> = {
            draft: 'badge bg-secondary/20 text-secondary',
            pending: 'badge bg-warning/20 text-warning',
            approved: 'badge bg-success/20 text-success',
            rejected: 'badge bg-danger/20 text-danger',
        };
        return map[status] || 'badge';
    };

    onMounted(async () => {
        await fetchPendingCount();
        await fetchRegistrations();
    });
</script>
