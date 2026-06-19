<template>
    <div>
        <!-- Header Bar -->
        <div class="bg-primary text-white rounded-xl p-4 flex items-center justify-between mb-5 shadow-lg">
            <div class="flex items-center gap-3">
                <div class="p-2 bg-white/20 rounded-lg">
                    <icon-menu-invoice class="w-6 h-6" />
                </div>
                <div>
                    <h4 class="text-xl font-bold">Invoice List</h4>
                    <p class="text-white/70 text-xs mt-0.5">{{ totalRows }} รายการทั้งหมด</p>
                </div>
            </div>
            <button @click="exportExcel" class="btn btn-sm border-white/40 border text-white hover:bg-white hover:text-primary transition-all rounded-lg flex items-center gap-2">
                <icon-download class="w-4 h-4" />
                <span>Export Excel</span>
            </button>
        </div>

        <!-- Filter Toolbar -->
        <div class="panel mb-4 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex-grow max-w-md relative">
                    <input v-model="search" type="text" class="form-input ltr:pr-10 rtl:pl-10"
                        placeholder="Invoice No / Supplier / Buyer / PO No"
                        @keyup.enter="doSearch" />
                    <button @click="doSearch" class="absolute ltr:right-2 rtl:left-2 top-1/2 -translate-y-1/2 text-white-dark hover:text-primary">
                        <icon-search class="w-4 h-4" />
                    </button>
                </div>
                <div class="flex items-center gap-3">
                    <select v-model="filterStatus" @change="doSearch" class="form-select w-36">
                        <option value="">ทุกสถานะ</option>
                        <option value="New">New</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    <button @click="resetAndFetch" class="btn btn-outline-secondary p-2 rounded-lg" title="Refresh">
                        <icon-refresh class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="panel flex items-center justify-center py-16 gap-3 text-white-dark">
            <span class="inline-block h-7 w-7 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
            กำลังโหลดข้อมูล Invoice...
        </div>

        <!-- Error -->
        <div v-else-if="fetchError" class="panel py-10 text-center text-danger">
            <p class="text-lg mb-1">⚠ โหลดข้อมูลไม่สำเร็จ</p>
            <p class="text-sm text-white-dark">{{ fetchError }}</p>
            <button @click="resetAndFetch" class="btn btn-outline-danger btn-sm mt-4">ลองใหม่</button>
        </div>

        <!-- Table -->
        <div v-else class="panel pb-0 shadow-sm overflow-hidden">
            <!-- Empty -->
            <div v-if="invoiceList.length === 0" class="py-16 text-center text-white-dark text-sm">
                ไม่พบรายการ Invoice ที่ตรงกับเงื่อนไข
            </div>

            <div v-else>
                <div class="table-responsive">
                    <table class="table-hover table whitespace-nowrap">
                        <thead>
                            <tr>
                                <th @click="setSort('invoice_no')" class="cursor-pointer select-none">
                                    Invoice No <span class="ml-1 text-xs">{{ sortIcon('invoice_no') }}</span>
                                </th>
                                <th @click="setSort('invoice_date')" class="cursor-pointer select-none">
                                    Invoice Date <span class="ml-1 text-xs">{{ sortIcon('invoice_date') }}</span>
                                </th>
                                <th @click="setSort('supplier_name')" class="cursor-pointer select-none">
                                    Supplier <span class="ml-1 text-xs">{{ sortIcon('supplier_name') }}</span>
                                </th>
                                <th @click="setSort('buyer_name')" class="cursor-pointer select-none">
                                    Buyer <span class="ml-1 text-xs">{{ sortIcon('buyer_name') }}</span>
                                </th>
                                <th @click="setSort('po_no')" class="cursor-pointer select-none">
                                    PO Number <span class="ml-1 text-xs">{{ sortIcon('po_no') }}</span>
                                </th>
                                <th @click="setSort('amount_incl_vat')" class="cursor-pointer select-none text-right">
                                    Total Amount <span class="ml-1 text-xs">{{ sortIcon('amount_incl_vat') }}</span>
                                </th>
                                <th class="text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="inv in sortedList" :key="inv.id">
                                <td class="font-semibold text-primary">{{ inv.invoice_no }}</td>
                                <td class="text-white-dark text-sm">{{ formatDate(inv.invoice_date) }}</td>
                                <td>{{ inv.supplier_name ?? '-' }}</td>
                                <td>{{ inv.buyer_name ?? '-' }}</td>
                                <td class="text-white-dark text-sm">{{ inv.po_no ?? '-' }}</td>
                                <td class="text-right font-bold text-primary">{{ formatCurrency(inv.amount_incl_vat) }}</td>
                                <td class="text-center">
                                    <span :class="['badge capitalize', getStatusColor(inv.status)]">{{ inv.status }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t dark:border-[#191e3a]">
                    <div class="flex items-center gap-2 text-sm text-white-dark">
                        <span>Showing</span>
                        <select v-model="pageSize" @change="currentPage = 1" class="form-select py-1 w-16 text-sm">
                            <option :value="10">10</option>
                            <option :value="25">25</option>
                            <option :value="50">50</option>
                            <option :value="100">100</option>
                        </select>
                        <span>of {{ totalRows }} entries</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <button @click="goPage(1)" :disabled="currentPage === 1" class="btn btn-sm btn-outline-secondary p-1.5 rounded disabled:opacity-40">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M13 19L7 12L13 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path opacity=".5" d="M17 19L11 12L17 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                        </button>
                        <button @click="goPage(currentPage - 1)" :disabled="currentPage === 1" class="btn btn-sm btn-outline-secondary p-1.5 rounded disabled:opacity-40">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M15 5L9 12L15 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                        </button>
                        <template v-for="p in visiblePages" :key="p">
                            <span v-if="p === '...'" class="px-2 text-white-dark">…</span>
                            <button v-else @click="goPage(Number(p))"
                                :class="['btn btn-sm rounded px-3', currentPage === Number(p) ? 'btn-primary' : 'btn-outline-secondary']">
                                {{ p }}
                            </button>
                        </template>
                        <button @click="goPage(currentPage + 1)" :disabled="currentPage === totalPages" class="btn btn-sm btn-outline-secondary p-1.5 rounded disabled:opacity-40">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M9 5L15 12L9 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                        </button>
                        <button @click="goPage(totalPages)" :disabled="currentPage === totalPages" class="btn btn-sm btn-outline-secondary p-1.5 rounded disabled:opacity-40">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M11 19L17 12L11 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path opacity=".5" d="M7 19L13 12L7 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted } from 'vue';
    import { useAuthStore } from '@/stores/auth';
    import Swal from 'sweetalert2';

    useHead({ title: 'Invoice List - NEX Finance' });
    definePageMeta({ layout: 'default' });

    const LISTINVOICES_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/listinvoices';

    const authStore = useAuthStore();

    // ── State ──────────────────────────────────────────────────────
    const isLoading   = ref(false);
    const fetchError  = ref('');
    const invoiceList = ref<any[]>([]);
    const totalRows   = ref(0);

    const search       = ref('');
    const filterStatus = ref('');
    const currentPage  = ref(1);
    const pageSize     = ref(10);

    const sortField = ref('invoice_date');
    const sortDir   = ref<'asc' | 'desc'>('desc');

    // ── Fetch ──────────────────────────────────────────────────────
    const fetchInvoices = async () => {
        isLoading.value  = true;
        fetchError.value = '';
        try {
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;

            const params = new URLSearchParams({
                limit : String(pageSize.value),
                offset: String((currentPage.value - 1) * pageSize.value),
            });
            if (search.value.trim())  params.set('search', search.value.trim());
            if (filterStatus.value)   params.set('status', filterStatus.value);

            const res  = await fetch(`${LISTINVOICES_URL}?${params}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

            invoiceList.value = json.data  ?? [];
            totalRows.value   = json.total ?? 0;
        } catch (err: any) {
            fetchError.value = err.message;
            console.error('[listinvoices] error:', err.message);
        } finally {
            isLoading.value = false;
        }
    };

    const doSearch = () => { currentPage.value = 1; fetchInvoices(); };
    const resetAndFetch = () => {
        search.value       = '';
        filterStatus.value = '';
        currentPage.value  = 1;
        fetchInvoices();
    };

    watch([currentPage, pageSize], fetchInvoices);
    onMounted(fetchInvoices);

    // ── Sort (client-side on current page) ────────────────────────
    const setSort = (field: string) => {
        if (sortField.value === field) {
            sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
        } else {
            sortField.value = field;
            sortDir.value   = 'asc';
        }
    };

    const sortIcon = (field: string) => {
        if (sortField.value !== field) return '↕';
        return sortDir.value === 'asc' ? '↑' : '↓';
    };

    const sortedList = computed(() => {
        const list = [...invoiceList.value];
        return list.sort((a, b) => {
            const va = a[sortField.value] ?? '';
            const vb = b[sortField.value] ?? '';
            if (va < vb) return sortDir.value === 'asc' ? -1 : 1;
            if (va > vb) return sortDir.value === 'asc' ? 1  : -1;
            return 0;
        });
    });

    // ── Pagination ─────────────────────────────────────────────────
    const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / pageSize.value)));

    const goPage = (p: number) => {
        const clamped = Math.max(1, Math.min(p, totalPages.value));
        if (clamped !== currentPage.value) currentPage.value = clamped;
    };

    const visiblePages = computed(() => {
        const total = totalPages.value;
        const cur   = currentPage.value;
        const pages: (number | string)[] = [];
        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            if (cur > 3)           pages.push('...');
            for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
            if (cur < total - 2)   pages.push('...');
            pages.push(total);
        }
        return pages;
    });

    // ── Helpers ────────────────────────────────────────────────────
    const formatCurrency = (val: number | null) => {
        if (val == null) return '-';
        return '฿' + new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(val);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('th-TH');
    };

    const getStatusColor = (status: string) => {
        const s = (status ?? '').toLowerCase();
        if (s === 'paid')      return 'badge-outline-success';
        if (s === 'overdue')   return 'badge-outline-danger';
        if (s === 'cancelled') return 'badge-outline-danger';
        if (s === 'new')       return 'badge-outline-info';
        return 'badge-outline-warning';
    };

    // ── Export CSV ────────────────────────────────────────────────
    const exportExcel = async () => {
        try {
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;

            const params = new URLSearchParams({ limit: '500', offset: '0' });
            if (search.value.trim())  params.set('search', search.value.trim());
            if (filterStatus.value)   params.set('status', filterStatus.value);

            const res  = await fetch(`${LISTINVOICES_URL}?${params}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

            const rows: any[] = json.data ?? [];
            const headers = ['Invoice No', 'Invoice Date', 'Supplier Code', 'Supplier Name', 'Buyer Code', 'Buyer Name', 'PO Number', 'PO Date', 'Amount (excl. VAT)', 'VAT', 'Amount (incl. VAT)', 'Status'];
            const csvRows = rows.map((r) => [
                r.invoice_no,
                r.invoice_date ? new Date(r.invoice_date).toLocaleDateString('th-TH') : '',
                r.supplier_code ?? '',
                r.supplier_name ?? '',
                r.buyer_code ?? '',
                r.buyer_name ?? '',
                r.po_no ?? '',
                r.po_date ? new Date(r.po_date).toLocaleDateString('th-TH') : '',
                r.amount_excl_vat ?? 0,
                r.amount_vat ?? 0,
                r.amount_incl_vat ?? 0,
                r.status ?? '',
            ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));

            const csv  = [headers.join(','), ...csvRows].join('\n');
            const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `invoice_list_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);

            const toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
            toast.fire({ icon: 'success', title: `Exported ${rows.length} records`, padding: '10px 20px' });
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'Export Failed', text: err.message, confirmButtonColor: '#e7515a' });
        }
    };
</script>

<style scoped>
    th { user-select: none; }
</style>
