<template>
    <!-- Force Rebuild -->
    <div>
        <div class="panel mb-5">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h5 class="text-lg font-semibold dark:text-white-light">Registration Management</h5>
                    <p class="text-white-dark mt-1">แสดงรายการผู้ใช้ที่ยื่นสมัครเข้าระบบ IFS</p>
                </div>
            </div>
        </div>

        <div class="panel p-4 mb-5">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="relative">
                    <input type="text" placeholder="Search Email / Name / Company" class="form-input ltr:pr-11 rtl:pl-11" v-model="search" />
                    <div class="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white-dark">
                        <icon-search />
                    </div>
                </div>
                <div>
                    <select class="form-select text-white-dark" v-model="statusFilter">
                        <option value="ALL">All Status</option>
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="panel pb-0">
            <div class="datatable">
                <vue3-datatable
                    :rows="filteredRegistrations"
                    :columns="cols"
                    :totalRows="filteredRegistrations.length"
                    skin="whitespace-nowrap bh-table-hover"
                    :loading="isLoading"
                    firstArrow='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 rtl:rotate-180"> <path d="M13 19L7 12L13 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> <path opacity="0.5" d="M16.9998 19L10.9998 12L16.9998 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> </svg>'
                    lastArrow='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 rtl:rotate-180"> <path d="M11 19L17 12L11 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> <path opacity="0.5" d="M6.99976 19L12.9998 12L6.99976 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> </svg> '
                    previousArrow='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 rtl:rotate-180"> <path d="M15 5L9 12L15 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> </svg>'
                    nextArrow='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 rtl:rotate-180"> <path d="M9 5L15 12L9 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> </svg>'
                >
                    <template #email="data">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs uppercase">
                                {{ data.value.full_name?.charAt(0) || 'U' }}
                            </div>
                            <span class="font-semibold">{{ data.value.email }}</span>
                        </div>
                    </template>
                    <template #registration_status="data">
                        <span :class="getStatusBadgeClass(data.value.registration_status)">
                            {{ data.value.registration_status }}
                        </span>
                    </template>
                    <template #created_time="data">
                        {{ formatDate(data.value.created_time) }}
                    </template>
                    <template #actions="data">
                        <div class="flex items-center">
                            <NuxtLink :to="`/registration_list/${data.value.user_id}`" class="btn btn-sm btn-outline-primary p-1">
                                <icon-eye class="w-4.5 h-4.5" />
                            </NuxtLink>
                        </div>
                    </template>
                </vue3-datatable>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue';
    import Vue3Datatable from '@bhplugin/vue3-datatable';
    import { useRegistrationManagement } from '@/composables/useRegistrationManagement';

    useHead({ title: 'Registration List' });

    const { registrations, isLoading, fetchRegistrations } = useRegistrationManagement();

    const search = ref('');
    const statusFilter = ref('ALL');

    const cols = ref([
        { field: 'email', title: 'Email' },
        { field: 'full_name', title: 'Full Name' },
        { field: 'company_name', title: 'Company' },
        { field: 'registration_status', title: 'Status' },
        { field: 'created_time', title: 'Created At' },
        { field: 'actions', title: 'Actions', sort: false },
    ]);

    const filteredRegistrations = computed(() => {
        return registrations.value.filter((item) => {
            const matchesSearch =
                item.email.toLowerCase().includes(search.value.toLowerCase()) ||
                item.full_name.toLowerCase().includes(search.value.toLowerCase()) ||
                item.company_name.toLowerCase().includes(search.value.toLowerCase());

            const matchesStatus = statusFilter.value === 'ALL' || item.registration_status === statusFilter.value;

            return matchesSearch && matchesStatus;
        });
    });

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'badge badge-outline-success';
            case 'REJECTED':
                return 'badge badge-outline-danger';
            case 'PENDING':
                return 'badge badge-outline-warning';
            default:
                return 'badge badge-outline-primary';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    };

    onMounted(() => {
        fetchRegistrations();
    });
</script>
