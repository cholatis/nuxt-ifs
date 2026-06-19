<template>
    <div>
        <!-- Page Header -->
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-dark dark:text-white">Profile List</h2>
                <p class="mt-1 text-sm text-white-dark">รายการผู้ใช้งานทั้งหมดในระบบ</p>
            </div>
            <span class="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">GEC Admin</span>
        </div>

        <!-- Stats Cards -->
        <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div class="panel rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-primary">{{ countByRole('supplier') }}</p>
                <p class="text-sm text-white-dark">Supplier</p>
            </div>
            <div class="panel rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-info">{{ countByRole('gec') }}</p>
                <p class="text-sm text-white-dark">GEC</p>
            </div>
            <div class="panel rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-warning">{{ countByRole('lender') }}</p>
                <p class="text-sm text-white-dark">Lender</p>
            </div>
            <div class="panel rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-success">{{ profiles.length }}</p>
                <p class="text-sm text-white-dark">ทั้งหมด</p>
            </div>
        </div>

        <!-- Filter Bar -->
        <div class="panel mb-4">
            <div class="flex flex-wrap items-center gap-3">
                <div class="relative flex-1 min-w-[200px]">
                    <input
                        v-model="searchText"
                        @input="onSearchInput"
                        type="text"
                        class="form-input ps-9"
                        placeholder="ค้นหาชื่อ, บริษัท, Email, Supplier Code..."
                    />
                    <span class="absolute start-3 top-1/2 -translate-y-1/2 text-white-dark">
                        <icon-search class="h-4 w-4" />
                    </span>
                </div>
                <select v-model="filterRole" @change="fetchProfiles" class="form-select w-40">
                    <option value="">ทุก Role</option>
                    <option value="supplier">Supplier</option>
                    <option value="gec">GEC</option>
                    <option value="lender">Lender</option>
                </select>
                <select v-model="filterStatus" @change="fetchProfiles" class="form-select w-40">
                    <option value="">ทุกสถานะ</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                </select>
                <button @click="fetchProfiles" class="btn btn-primary gap-1">
                    <icon-refresh class="h-4 w-4" />
                    รีเฟรช
                </button>
            </div>
        </div>

        <!-- Table -->
        <div class="panel">
            <div v-if="isLoading" class="flex items-center justify-center py-20">
                <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
                <span class="ml-3 text-white-dark">กำลังโหลด...</span>
            </div>

            <div v-else-if="loadError" class="py-20 text-center text-danger text-sm">
                โหลดข้อมูลไม่สำเร็จ: {{ loadError }}
            </div>

            <div v-else-if="profiles.length === 0" class="py-20 text-center text-white-dark">
                ไม่พบรายการผู้ใช้งาน
            </div>

            <div v-else class="table-responsive">
                <table class="table-hover table">
                    <thead>
                        <tr>
                            <th>ชื่อ</th>
                            <th>บริษัท</th>
                            <th>Email</th>
                            <th class="text-center">Role</th>
                            <th class="text-center">สถานะ</th>
                            <th class="text-center">Supplier Code</th>
                            <th>Supplier Name</th>
                            <th>วันที่สมัคร</th>
                            <th class="text-center">การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="profile in profiles" :key="profile.id">
                            <td class="font-semibold">{{ profile.full_name || '-' }}</td>
                            <td>{{ profile.company_name || '-' }}</td>
                            <td class="text-white-dark text-sm">{{ profile.email }}</td>
                            <td class="text-center">
                                <span :class="roleClass(profile.role)">{{ profile.role }}</span>
                            </td>
                            <td class="text-center">
                                <span :class="statusClass(profile.status)">{{ statusLabel(profile.status) }}</span>
                            </td>
                            <td class="text-center">
                                <span v-if="profile.supplier_code" class="badge bg-primary/20 text-primary font-mono">
                                    {{ profile.supplier_code }}
                                </span>
                                <span v-else class="text-white-dark text-sm">—</span>
                            </td>
                            <td>{{ profile.supplier_name || '-' }}</td>
                            <td class="text-white-dark text-sm">{{ formatDate(profile.created_at) }}</td>
                            <td class="text-center">
                                <button
                                    @click="openEditModal(profile)"
                                    class="btn btn-outline-primary btn-sm px-3"
                                >
                                    แก้ไข
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between px-2">
                <p class="text-sm text-white-dark">
                    แสดง {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, totalCount) }} จาก {{ totalCount }} รายการ
                </p>
                <div class="flex items-center gap-2">
                    <button
                        @click="goToPage(currentPage - 1)"
                        :disabled="currentPage <= 1"
                        class="btn btn-outline-secondary btn-sm"
                    >← ก่อนหน้า</button>
                    <span class="text-sm font-semibold">{{ currentPage }} / {{ totalPages }}</span>
                    <button
                        @click="goToPage(currentPage + 1)"
                        :disabled="currentPage >= totalPages"
                        class="btn btn-outline-secondary btn-sm"
                    >ถัดไป →</button>
                </div>
            </div>
        </div>

        <!-- Edit Supplier Modal -->
        <TransitionRoot appear :show="isEditModalOpen" as="template">
            <Dialog as="div" @close="closeEditModal" class="relative z-50">
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
                                <div class="mb-5 flex items-center gap-3">
                                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                                        <icon-user class="h-5 w-5" />
                                    </div>
                                    <DialogTitle class="text-lg font-bold dark:text-white">
                                        แก้ไขข้อมูล Supplier
                                    </DialogTitle>
                                </div>

                                <!-- Profile Info (read-only) -->
                                <div class="mb-4 rounded-lg bg-gray-50 dark:bg-[#0e1726] p-3 text-sm space-y-1">
                                    <p class="text-white-dark">ชื่อ: <span class="font-semibold text-dark dark:text-white">{{ editingProfile?.full_name }}</span></p>
                                    <p class="text-white-dark">บริษัท: <span class="font-semibold text-dark dark:text-white">{{ editingProfile?.company_name }}</span></p>
                                    <p class="text-white-dark">Email: <span class="font-semibold text-dark dark:text-white">{{ editingProfile?.email }}</span></p>
                                </div>

                                <!-- Supplier Search -->
                                <div class="mb-4">
                                    <label class="mb-1 block text-sm font-medium dark:text-white">เลือก Supplier <span class="text-danger">*</span></label>
                                    <div class="relative">
                                        <input
                                            v-model="supplierSearch"
                                            @input="onSupplierSearch"
                                            @focus="onSupplierFocus"
                                            @blur="onSupplierBlur"
                                            type="text"
                                            class="form-input"
                                            placeholder="ค้นหา Supplier Code หรือชื่อ..."
                                            autocomplete="off"
                                        />
                                        <div v-if="showSupplierDropdown && supplierOptions.length > 0"
                                            class="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-xl dark:border-[#191e3a] dark:bg-[#1b2e4b] max-h-56 overflow-y-auto">
                                            <button
                                                v-for="s in supplierOptions"
                                                :key="s.supplier_code"
                                                @mousedown.prevent="selectSupplier(s)"
                                                :class="[
                                                    'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                                                    selectedSupplier?.supplier_code === s.supplier_code
                                                        ? 'bg-primary/10'
                                                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                                ]"
                                                type="button"
                                            >
                                                <span class="badge bg-primary/20 text-primary font-mono text-xs shrink-0 min-w-[52px] text-center">{{ s.supplier_code }}</span>
                                                <span class="text-sm text-dark dark:text-white truncate">{{ s.supplier_name }}</span>
                                                <icon-circle-check v-if="selectedSupplier?.supplier_code === s.supplier_code" class="ml-auto h-4 w-4 text-primary shrink-0" />
                                            </button>
                                        </div>
                                        <div v-if="isLoadingSuppliers" class="absolute right-3 top-1/2 -translate-y-1/2">
                                            <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-l-transparent"></span>
                                        </div>
                                    </div>
                                    <!-- Selected Supplier Badge -->
                                    <div v-if="selectedSupplier" class="mt-2 flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5">
                                        <icon-circle-check class="h-4 w-4 text-primary shrink-0" />
                                        <div class="flex items-center gap-2 flex-1 min-w-0">
                                            <span class="badge bg-primary/20 text-primary font-mono text-xs shrink-0">{{ selectedSupplier.supplier_code }}</span>
                                            <span class="text-sm font-semibold text-dark dark:text-white truncate">{{ selectedSupplier.supplier_name }}</span>
                                        </div>
                                        <button @click="clearSupplier" type="button" class="text-white-dark hover:text-danger transition-colors shrink-0" title="ล้างการเลือก">
                                            <icon-x class="h-4 w-4" />
                                        </button>
                                    </div>
                                    <p v-else-if="!isLoadingSuppliers && supplierOptions.length === 0 && supplierSearch" class="mt-1.5 text-xs text-white-dark">
                                        ไม่พบ Supplier ที่ตรงกับ "{{ supplierSearch }}"
                                    </p>
                                </div>

                                <div class="flex justify-end gap-3 mt-6">
                                    <button @click="closeEditModal" class="btn btn-outline-secondary">ยกเลิก</button>
                                    <button
                                        @click="submitEdit"
                                        class="btn btn-primary"
                                        :disabled="!selectedSupplier || isSaving"
                                    >
                                        <span v-if="isSaving" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                        บันทึก
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
    import Swal from 'sweetalert2';

    useHead({ title: 'Profile List - NEX Finance (GEC)' });
    definePageMeta({ layout: 'default' });

    const authStore = useAuthStore();

    const LISTPROFILE_URL  = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/listprofile';
    const UPDATEPROFILE_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/updateprofile';
    const LISTSUPPLIERS_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/listsuppliers';

    // ── State ─────────────────────────────────────────────────────
    const profiles   = ref<any[]>([]);
    const isLoading  = ref(false);
    const loadError  = ref('');

    const searchText  = ref('');
    const filterRole   = ref('');
    const filterStatus = ref('');

    const currentPage = ref(1);
    const pageSize    = ref(20);
    const totalCount  = ref(0);
    const totalPages  = computed(() => Math.ceil(totalCount.value / pageSize.value));

    // Edit modal
    const isEditModalOpen = ref(false);
    const editingProfile  = ref<any>(null);
    const isSaving        = ref(false);

    // Supplier search (inside modal)
    const supplierSearch       = ref('');
    const supplierOptions      = ref<any[]>([]);
    const selectedSupplier     = ref<any>(null);
    const showSupplierDropdown = ref(false);
    const isLoadingSuppliers   = ref(false);
    let   supplierDebounce: ReturnType<typeof setTimeout> | null = null;

    // ── Fetch profiles ────────────────────────────────────────────
    const fetchProfiles = async () => {
        isLoading.value = true;
        loadError.value = '';
        try {
            const jwt = authStore.accessToken;
            const params = new URLSearchParams();
            if (filterRole.value)   params.set('role',   filterRole.value);
            if (filterStatus.value) params.set('status', filterStatus.value);
            if (searchText.value)   params.set('search', searchText.value);
            params.set('page',  String(currentPage.value));
            params.set('limit', String(pageSize.value));

            const res = await fetch(`${LISTPROFILE_URL}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

            profiles.value   = json.data   ?? [];
            totalCount.value = json.total   ?? profiles.value.length;
        } catch (err: any) {
            loadError.value = err.message;
            console.error('[listprofile] error:', err.message);
        } finally {
            isLoading.value = false;
        }
    };

    onMounted(fetchProfiles);

    // ── Search debounce ───────────────────────────────────────────
    let searchDebounce: ReturnType<typeof setTimeout> | null = null;
    const onSearchInput = () => {
        if (searchDebounce) clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            currentPage.value = 1;
            fetchProfiles();
        }, 350);
    };

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages.value) return;
        currentPage.value = page;
        fetchProfiles();
    };

    // ── Computed counts ───────────────────────────────────────────
    const countByRole = (role: string) => profiles.value.filter((p) => p.role === role).length;

    // ── Formatters ────────────────────────────────────────────────
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const roleClass = (role: string) => {
        switch (role) {
            case 'supplier': return 'badge bg-warning/20 text-warning';
            case 'gec':      return 'badge bg-info/20 text-info';
            case 'lender':   return 'badge bg-success/20 text-success';
            default:         return 'badge bg-gray-100 text-gray-600';
        }
    };

    const statusClass = (status: string) => {
        switch (status) {
            case 'active':   return 'badge badge-outline-success text-xs';
            case 'pending':  return 'badge badge-outline-warning text-xs';
            case 'inactive': return 'badge badge-outline-danger text-xs';
            default:         return 'badge badge-outline-secondary text-xs';
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case 'active':   return 'Active';
            case 'pending':  return 'Pending';
            case 'inactive': return 'Inactive';
            default:         return status || '-';
        }
    };

    // ── Edit modal ────────────────────────────────────────────────
    const openEditModal = async (profile: any) => {
        editingProfile.value       = profile;
        selectedSupplier.value     = profile.supplier_code
            ? { supplier_code: profile.supplier_code, supplier_name: profile.supplier_name }
            : null;
        supplierSearch.value       = '';
        supplierOptions.value      = [];
        showSupplierDropdown.value = false;
        isEditModalOpen.value      = true;
        // Preload all suppliers immediately when modal opens
        await fetchSupplierOptions('');
        showSupplierDropdown.value = !selectedSupplier.value && supplierOptions.value.length > 0;
    };

    const closeEditModal = () => {
        isEditModalOpen.value      = false;
        editingProfile.value       = null;
        selectedSupplier.value     = null;
        supplierSearch.value       = '';
        supplierOptions.value      = [];
        showSupplierDropdown.value = false;
    };

    // ── Supplier search (inside modal) ────────────────────────────
    const fetchSupplierOptions = async (search: string) => {
        isLoadingSuppliers.value = true;
        try {
            const params = new URLSearchParams({ limit: '50' });
            if (search) params.set('search', search);
            const res  = await fetch(`${LISTSUPPLIERS_URL}?${params.toString()}`);
            const data = await res.json();
            supplierOptions.value = data.data ?? [];
        } catch (err: any) {
            console.error('[listsuppliers] error:', err.message);
        } finally {
            isLoadingSuppliers.value = false;
        }
    };

    const onSupplierSearch = () => {
        selectedSupplier.value     = null;
        showSupplierDropdown.value = true;
        if (supplierDebounce) clearTimeout(supplierDebounce);
        supplierDebounce = setTimeout(async () => {
            await fetchSupplierOptions(supplierSearch.value.trim());
            showSupplierDropdown.value = supplierOptions.value.length > 0;
        }, 300);
    };

    const onSupplierFocus = () => {
        if (supplierOptions.value.length > 0) {
            showSupplierDropdown.value = true;
        } else if (!isLoadingSuppliers.value) {
            fetchSupplierOptions(supplierSearch.value.trim()).then(() => {
                showSupplierDropdown.value = supplierOptions.value.length > 0;
            });
        }
    };

    const onSupplierBlur = () => {
        // Delay to allow click on dropdown item to fire first
        setTimeout(() => { showSupplierDropdown.value = false; }, 200);
    };

    const selectSupplier = (s: any) => {
        selectedSupplier.value     = s;
        supplierSearch.value       = '';
        showSupplierDropdown.value = false;
    };

    const clearSupplier = () => {
        selectedSupplier.value     = null;
        supplierSearch.value       = '';
        showSupplierDropdown.value = supplierOptions.value.length > 0;
    };

    // ── Submit edit ───────────────────────────────────────────────
    const submitEdit = async () => {
        if (!selectedSupplier.value || !editingProfile.value) return;
        isSaving.value = true;
        try {
            const jwt = authStore.accessToken;
            const res = await fetch(UPDATEPROFILE_URL, {
                method : 'PATCH',
                headers: {
                    'Content-Type' : 'application/json',
                    'Authorization': `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    target_user_id: editingProfile.value.id,
                    supplier_code : selectedSupplier.value.supplier_code,
                    supplier_name : selectedSupplier.value.supplier_name,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

            closeEditModal();
            await Swal.fire({
                icon             : 'success',
                title            : 'อัพเดตสำเร็จ',
                text             : 'ข้อมูล Supplier ของผู้ใช้ถูกอัพเดตเรียบร้อยแล้ว',
                confirmButtonColor: '#4361ee',
                timer            : 2500,
                showConfirmButton: false,
            });
            fetchProfiles();
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message, confirmButtonColor: '#e7515a' });
        } finally {
            isSaving.value = false;
        }
    };
</script>
