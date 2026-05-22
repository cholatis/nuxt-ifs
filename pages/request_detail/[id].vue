<template>
    <div>
        <div class="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div class="flex items-center gap-3">
                <NuxtLink to="/request_list" class="btn btn-outline-secondary p-2 rounded-full">
                    <icon-arrow-left class="w-5 h-5" />
                </NuxtLink>
                <div class="flex flex-col">
                    <h2 class="text-2xl font-bold">Request Detail</h2>
                    <p class="text-white-dark text-sm">{{ request?.id }}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span :class="['badge badge-outline-' + getStatusColor(request?.status || ''), 'capitalize py-2 px-4 text-sm']">
                    {{ request?.status.replace('_', ' ') }}
                </span>
            </div>
        </div>

        <div v-if="request" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main Content -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Request Summary Card -->
                <div class="panel shadow-sm border-t-4" :style="{ borderTopColor: getStatusHex(request.status) }">
                    <div class="flex items-center justify-between mb-5">
                        <div class="flex items-center gap-2">
                            <span :class="request.type === 'LINE' ? 'text-warning' : 'text-primary'">
                                <icon-circle-check v-if="request.type === 'LINE'" class="w-6 h-6" />
                                <icon-menu-invoice v-else class="w-6 h-6" />
                            </span>
                            <h5 class="font-bold text-lg">{{ request.type === 'LINE' ? 'Credit Line Application' : 'Factoring PO Request' }}</h5>
                        </div>
                        <p class="text-xs text-white-dark">Created: {{ formatDate(request.createdDate) }}</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                        <div class="space-y-1">
                            <p class="text-white-dark text-xs uppercase font-bold">Company</p>
                            <p class="font-bold text-lg">{{ request.companyName }}</p>
                        </div>
                        <div class="space-y-1">
                            <p class="text-white-dark text-xs uppercase font-bold">Requested Amount</p>
                            <p class="font-black text-2xl text-primary">฿ {{ formatCurrency(request.requestedAmount) }}</p>
                        </div>
                        <div class="space-y-1" v-if="request.type === 'PO'">
                            <p class="text-white-dark text-xs uppercase font-bold">PO Number</p>
                            <p class="font-semibold">{{ request.poNumber }}</p>
                        </div>
                        <div class="space-y-1">
                            <p class="text-white-dark text-xs uppercase font-bold">Buyer / Purpose</p>
                            <p class="font-semibold">{{ request.buyerName }}</p>
                        </div>
                        <div class="space-y-1">
                            <p class="text-white-dark text-xs uppercase font-bold">Credit Period</p>
                            <p class="font-semibold">{{ request.creditPeriod }} Days</p>
                        </div>
                        <div class="space-y-1" v-if="request.submittedDate">
                            <p class="text-white-dark text-xs uppercase font-bold">Submitted Date</p>
                            <p class="font-semibold">{{ formatDate(request.submittedDate) }}</p>
                        </div>
                    </div>
                </div>

                <!-- PO List if PO type -->
                <div v-if="request.type === 'PO'" class="panel shadow-sm">
                    <h5 class="font-bold text-lg mb-4">Linked Documents</h5>
                    <div class="table-responsive">
                        <table class="table-auto w-full text-sm">
                            <thead>
                                <tr class="bg-gray-50 dark:bg-black/20 text-left">
                                    <th class="p-3">Doc Number</th>
                                    <th class="p-3">Buyer</th>
                                    <th class="p-3 text-right">Amount (THB)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="border-t border-gray-100 dark:border-gray-800">
                                    <td class="p-3 font-semibold">{{ request.poNumber }}</td>
                                    <td class="p-3">{{ request.buyerName }}</td>
                                    <td class="p-3 text-right font-bold">฿ {{ formatCurrency(request.requestedAmount) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
                <!-- Status Workflow -->
                <div class="panel shadow-sm">
                    <h5 class="font-bold text-lg mb-6">Workflow Status</h5>
                    <div class="relative space-y-8 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-gray-200 dark:before:bg-gray-700">
                        <div class="relative pl-8">
                            <div class="absolute left-0 top-1 w-4 h-4 rounded-full bg-success ring-4 ring-success/20"></div>
                            <p class="text-sm font-bold text-success">Request Created</p>
                            <p class="text-xs text-white-dark">{{ formatDate(request.createdDate) }}</p>
                        </div>
                        <div v-if="request.status !== 'draft'" class="relative pl-8">
                            <div class="absolute left-0 top-1 w-4 h-4 rounded-full bg-info ring-4 ring-info/20"></div>
                            <p class="text-sm font-bold text-info">Application Submitted</p>
                            <p class="text-xs text-white-dark">{{ request.submittedDate ? formatDate(request.submittedDate) : 'Processing...' }}</p>
                        </div>
                        <div v-if="request.status === 'under_review' || request.status === 'approved' || request.status === 'rejected'" class="relative pl-8">
                            <div class="absolute left-0 top-1 w-4 h-4 rounded-full bg-warning ring-4 ring-warning/20"></div>
                            <p class="text-sm font-bold text-warning">Under Review</p>
                            <p class="text-xs text-white-dark">Credit officer assigned</p>
                        </div>
                        <div v-if="request.status === 'approved'" class="relative pl-8">
                            <div class="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-primary/20"></div>
                            <p class="text-sm font-bold text-primary text-uppercase">Approved</p>
                            <p class="text-xs text-white-dark font-bold">Ready for disbursement</p>
                        </div>
                    </div>
                </div>

                <!-- Admin Action Card -->
                <div v-if="request.status === 'submitted' || request.status === 'under_review'" class="panel shadow-sm bg-warning/5 border-warning/20">
                    <h6 class="font-bold text-warning mb-3">Admin Actions</h6>
                    <div class="space-y-2">
                        <button class="btn btn-sm btn-primary w-full">Mark as Reviewed</button>
                        <button class="btn btn-sm btn-outline-danger w-full">Request More Info</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="panel text-center py-20">
            <icon-loader class="animate-spin w-10 h-10 mx-auto text-primary mb-4" />
            <p class="text-white-dark">Loading request details...</p>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue';
    import { useRoute } from 'vue-router';
    import { useFactoringRequestList } from '@/composables/useFactoringRequestList';

    const route = useRoute();
    const { filteredRequests } = useFactoringRequestList();
    const request = ref<any>(null);

    onMounted(() => {
        const id = route.params.id;
        // Search in mock data
        request.value = filteredRequests.value.find((r: any) => r.id === id);
        
        if (!request.value) {
            // Default mock for preview if ID not found
            request.value = {
                id: id,
                type: 'PO',
                companyName: 'Sample Company Ltd.',
                poNumber: 'PO-TEST-001',
                buyerName: 'Sample Buyer Corp',
                requestedAmount: 1250000,
                creditPeriod: 60,
                status: 'submitted',
                createdDate: new Date().toISOString(),
                submittedDate: new Date().toISOString()
            };
        }
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'secondary';
            case 'submitted': return 'info';
            case 'under_review': return 'warning';
            case 'additional_required': return 'warning';
            case 'approved': return 'success';
            case 'rejected': return 'danger';
            default: return 'primary';
        }
    };

    const getStatusHex = (status: string) => {
        switch (status) {
            case 'approved': return '#00ab55';
            case 'rejected': return '#e7515a';
            case 'under_review': return '#e2a03f';
            case 'submitted': return '#2196f3';
            default: return '#e0e6ed';
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(val);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
</script>
