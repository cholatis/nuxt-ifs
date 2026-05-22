<template>
    <div>
        <!-- Header Bar -->
        <div class="bg-primary text-white rounded-xl p-4 flex items-center justify-between mb-5 shadow-lg">
            <div class="flex items-center gap-3">
                <div class="p-2 bg-white/20 rounded-lg">
                    <icon-menu-invoice class="w-6 h-6" />
                </div>
                <h4 class="text-xl font-bold">Factoring Credit Application Request</h4>
            </div>
            <div class="flex items-center gap-2">
                <button class="btn btn-sm btn-outline-white border-white/40 hover:bg-white hover:text-primary transition-all p-2 rounded-lg">
                    <icon-download class="w-5 h-5" />
                </button>
                <button class="btn btn-sm btn-outline-white border-white/40 hover:bg-white hover:text-primary transition-all p-2 rounded-lg">
                    <icon-settings class="w-5 h-5" />
                </button>
            </div>
        </div>

        <!-- Action Toolbar -->
        <div class="panel mb-4 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-2">
                    <NuxtLink to="/new_line_application" class="btn btn-primary shadow-md">
                        <icon-plus class="w-4.5 h-4.5 mr-2" />
                        Create Credit Line
                    </NuxtLink>
                    <NuxtLink to="/new_factoring_request" class="btn btn-outline-primary">
                        <icon-plus class="w-4.5 h-4.5 mr-2" />
                        Create Factoring
                    </NuxtLink>
                </div>
                <div class="flex items-center gap-2">
                    <button @click="refreshData" class="btn btn-outline-secondary p-2 rounded-lg" title="Refresh">
                        <icon-refresh class="w-5 h-5" />
                    </button>
                    <button @click="toggleFilter" :class="['btn p-2 rounded-lg transition-all', isFilterVisible ? 'btn-primary' : 'btn-outline-primary']" title="Toggle Filter">
                        <icon-filter class="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Filter Panel -->
        <transition name="fade">
            <div v-show="isFilterVisible" class="panel mb-4 bg-gray-50 dark:bg-black/10 border-dashed border-2 border-gray-200 dark:border-gray-800">
                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                        <label class="text-xs font-bold uppercase text-white-dark mb-1">Search</label>
                        <input type="text" v-model="filters.search" placeholder="Request ID / Company / PO" class="form-input" />
                    </div>
                    <div>
                        <label class="text-xs font-bold uppercase text-white-dark mb-1">Status</label>
                        <select v-model="filters.status" class="form-select">
                            <option value="all">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="under_review">Under Review</option>
                            <option value="additional_required">Additional Required</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-xs font-bold uppercase text-white-dark mb-1">Amount Range (THB)</label>
                        <div class="flex items-center gap-2">
                            <input type="number" v-model="filters.minAmount" placeholder="Min" class="form-input" />
                            <span class="text-white-dark">-</span>
                            <input type="number" v-model="filters.maxAmount" placeholder="Max" class="form-input" />
                        </div>
                    </div>
                    <div>
                        <label class="text-xs font-bold uppercase text-white-dark mb-1">Date Range</label>
                        <div class="flex items-center gap-2">
                            <input type="date" v-model="filters.dateFrom" class="form-input" />
                            <input type="date" v-model="filters.dateTo" class="form-input" />
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <button @click="clearFilters" class="btn btn-outline-danger btn-sm">Clear Filter</button>
                    <button @click="isFilterVisible = false" class="btn btn-primary btn-sm px-8">Search</button>
                </div>
            </div>
        </transition>

        <!-- Data Table -->
        <div class="panel pb-0 shadow-sm overflow-hidden">
            <div class="datatable">
                <vue3-datatable
                    :rows="filteredRequests"
                    :columns="cols"
                    :totalRows="filteredRequests.length"
                    skin="whitespace-nowrap bh-table-hover"
                    :sortable="true"
                    firstArrow='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 rtl:rotate-180"> <path d="M13 19L7 12L13 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> <path opacity="0.5" d="M16.9998 19L10.9998 12L16.9998 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> </svg>'
                    lastArrow='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 rtl:rotate-180"> <path d="M11 19L17 12L11 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> <path opacity="0.5" d="M6.99976 19L12.9998 12L6.99976 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> </svg> '
                    previousArrow='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 rtl:rotate-180"> <path d="M15 5L9 12L15 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> </svg>'
                    nextArrow='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 rtl:rotate-180"> <path d="M9 5L15 12L9 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> </svg>'
                >
                    <template #action="data">
                        <div class="flex items-center gap-2">
                            <button @click="viewDetail(data.value.id)" class="btn btn-sm btn-outline-primary p-1.5" title="View Detail">
                                <icon-eye class="w-4.5 h-4.5" />
                            </button>
                            <button v-if="userRole === 'admin' && (data.value.status === 'submitted' || data.value.status === 'under_review')" 
                                @click="reviewRequest(data.value.id)" class="btn btn-sm btn-outline-warning p-1.5" title="Review">
                                <icon-clipboard-check class="w-4.5 h-4.5" />
                            </button>
                        </div>
                    </template>
                    <template #type="data">
                        <span :class="data.value.type === 'LINE' ? 'badge badge-outline-warning' : 'badge badge-outline-primary'">
                            {{ data.value.type === 'LINE' ? 'Credit Line' : 'Factoring' }}
                        </span>
                    </template>
                    <template #requestedAmount="data">
                        <span class="font-bold text-primary">฿ {{ formatCurrency(data.value.requestedAmount) }}</span>
                    </template>
                    <template #creditPeriod="data">
                        {{ data.value.creditPeriod }} วัน
                    </template>
                    <template #status="data">
                        <span :class="['badge badge-outline-' + getStatusColor(data.value.status), 'capitalize']">
                            {{ data.value.status.replace('_', ' ') }}
                        </span>
                    </template>
                    <template #submittedDate="data">
                        {{ formatDate(data.value.submittedDate) }}
                    </template>
                    <template #edit_delete="data">
                        <div v-if="data.value.status === 'draft'" class="flex items-center gap-2">
                            <button @click="editRequest(data.value.id)" class="text-primary hover:text-primary/70">
                                <icon-pencil class="w-4.5 h-4.5" />
                            </button>
                            <button @click="handleDelete(data.value.id)" class="text-danger hover:text-danger/70">
                                <icon-trash-lines class="w-4.5 h-4.5" />
                            </button>
                        </div>
                        <span v-else class="text-xs text-white-dark flex items-center gap-1">
                            <icon-lock class="w-3.5 h-3.5" /> Locked
                        </span>
                    </template>
                </vue3-datatable>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue';
    import Vue3Datatable from '@bhplugin/vue3-datatable';
    import { useFactoringRequestList } from '@/composables/useFactoringRequestList';
    import Swal from 'sweetalert2';

    useHead({ title: 'Request List' });

    const { 
        userRole, 
        filters, 
        isFilterVisible, 
        toggleFilter, 
        clearFilters, 
        filteredRequests, 
        deleteRequest 
    } = useFactoringRequestList();

    const cols = ref([
        { field: 'action', title: 'Action', sort: false, width: '90px' },
        { field: 'id', title: 'Request ID' },
        { field: 'type', title: 'Type' },
        ...(userRole.value === 'admin' ? [{ field: 'companyName', title: 'Company' }] : []),
        { field: 'poNumber', title: 'PO / Ref' },
        { field: 'buyerName', title: 'Buyer / Purpose' },
        { field: 'requestedAmount', title: 'Requested Amount', textAlign: 'right' },
        { field: 'creditPeriod', title: 'Period', textAlign: 'center' },
        { field: 'status', title: 'Status' },
        { field: 'submittedDate', title: 'Submitted At' },
        { field: 'edit_delete', title: 'Manage', sort: false },
    ]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'secondary';
            case 'submitted': return 'info';
            case 'under_review': return 'warning';
            case 'additional_required': return 'warning'; // map to warning for yellow-ish
            case 'approved': return 'success';
            case 'rejected': return 'danger';
            default: return 'primary';
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(value);
    };

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const refreshData = () => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
        });
        toast.fire({
            icon: 'success',
            title: 'Data refreshed',
        });
    };

    const viewDetail = (id: string) => {
        navigateTo(`/request_detail/${id}`);
    };

    const reviewRequest = (id: string) => {
        navigateTo(`/request_review/${id}`);
    };

    const editRequest = (id: string) => {
        const req = filteredRequests.value.find(r => r.id === id);
        if (req?.type === 'PO') {
            navigateTo(`/new_factoring_request?id=${id}`);
        } else {
            navigateTo(`/new_line_application?id=${id}`);
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4361ee',
            cancelButtonColor: '#e7515a',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            if (deleteRequest(id)) {
                Swal.fire('Deleted!', 'Request has been deleted.', 'success');
            } else {
                Swal.fire('Error!', 'Cannot delete non-draft request.', 'error');
            }
        }
    };
</script>

<style scoped>
    .btn-outline-white {
        @apply bg-transparent border border-white/20 text-white;
    }
    .btn-outline-white:hover {
        @apply bg-white text-primary;
    }
    .fade-enter-active, .fade-leave-active {
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .fade-enter-from, .fade-leave-to {
        opacity: 0;
        transform: translateY(-10px);
    }
</style>
