<template>
    <div>
        <!-- Header Bar -->
        <div class="bg-primary text-white rounded-lg p-4 flex items-center justify-between mb-5 shadow-md">
            <div class="flex items-center gap-4">
                <div class="p-2 bg-white/20 rounded-lg">
                    <icon-menu-invoice class="w-6 h-6" />
                </div>
                <div>
                    <h4 class="text-xl font-bold">New Factoring Request</h4>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-white/80 text-sm">ID: {{ form.requestId }}</span>
                        <span :class="getStatusBadgeClass(form.status)">{{ form.status.toUpperCase() }}</span>
                        <span v-if="lastSaved" class="text-xs text-white/60 ml-2 italic">Last saved: {{ lastSaved }}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <button @click="onSaveDraft" class="btn btn-outline-white border-white text-white hover:bg-white hover:text-primary transition-colors">
                    Save Draft
                </button>
                <button @click="onSubmit" :disabled="!isFormValid" class="btn bg-white text-primary font-bold shadow-lg hover:bg-gray-100 disabled:opacity-50 transition-all">
                    Submit Request
                </button>
            </div>
        </div>

        <!-- Section 1 — Select PO -->
        <div class="panel mb-5">
            <h5 class="mb-5 text-lg font-semibold flex items-center gap-2">
                <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                Section 1 — Select Purchase Order
            </h5>

            <div class="mb-4">
                <p class="text-sm text-white-dark mb-4">Please select the Purchase Orders you would like to include in this factoring request.</p>
                
                <div class="datatable">
                    <vue3-datatable
                        :rows="pendingPOs"
                        :columns="cols"
                        :totalRows="pendingPOs.length"
                        :sortable="true"
                        skin="whitespace-nowrap bh-table-hover"
                        firstArrow='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 rtl:rotate-180"> <path d="M13 19L7 12L13 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> <path opacity="0.5" d="M16.9998 19L10.9998 12L16.9998 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> </svg>'
                        lastArrow='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 rtl:rotate-180"> <path d="M11 19L17 12L11 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> <path opacity="0.5" d="M7.00024 19L13.0002 12L7.00024 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> </svg>'
                        previousArrow='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 rtl:rotate-180"> <path d="M15 5L9 12L15 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> </svg>'
                        nextArrow='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 rtl:rotate-180"> <path d="M9 5L15 12L9 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/> </svg>'
                    >
                        <template #id="data">
                            <input type="checkbox" :value="data.value.id" v-model="form.selectedPoIds" class="form-checkbox" />
                        </template>
                        <template #amount="data">
                            <span class="font-bold">{{ formatNumber(data.value.amount) }}</span>
                        </template>
                        <template #status="data">
                            <span class="badge badge-outline-warning text-[10px]">{{ data.value.status }}</span>
                        </template>
                    </vue3-datatable>
                </div>
            </div>

            <!-- Selection Summary -->
            <div v-if="form.selectedPoIds.length > 0" class="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h6 class="font-bold text-primary mb-1">Selection Summary</h6>
                        <p class="text-sm text-white-dark">{{ form.selectedPoIds.length }} PO(s) selected: <span class="font-medium text-black dark:text-white">{{ selectedPoRefs }}</span></p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs uppercase text-white-dark font-semibold">Total PO Value</p>
                        <p class="text-2xl font-black text-primary">฿ {{ formatNumber(totalSelectedAmount) }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 2 — Request Details -->
        <div class="panel mb-5">
            <h5 class="mb-5 text-lg font-semibold flex items-center gap-2">
                <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                Section 2 — Request Details
            </h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label>Request Type</label>
                    <input type="text" value="PO Factoring" class="form-input bg-gray-100 dark:bg-[#1b2e4b]" readonly />
                </div>
                <div>
                    <label>Selected PO Reference</label>
                    <input type="text" :value="selectedPoRefs" class="form-input bg-gray-100 dark:bg-[#1b2e4b]" readonly placeholder="Select PO above" />
                </div>
                <div>
                    <label>Buyer Name</label>
                    <input type="text" :value="selectedBuyerNames" class="form-input bg-gray-100 dark:bg-[#1b2e4b]" readonly placeholder="Auto-fill" />
                </div>
                <div>
                    <label>Requested Amount (THB) <span class="text-danger">*</span></label>
                    <div class="relative">
                        <input type="number" class="form-input" v-model="form.requestedAmount" :max="totalSelectedAmount" placeholder="0.00" />
                        <span class="absolute right-3 top-2 text-xs text-white-dark" v-if="totalSelectedAmount > 0">Max: {{ formatNumber(totalSelectedAmount) }}</span>
                    </div>
                </div>
                <div>
                    <label>Credit Period (Days) <span class="text-danger">*</span></label>
                    <select class="form-select" v-model="form.creditPeriod">
                        <option :value="null" disabled>Select Period</option>
                        <option :value="30">30 วัน</option>
                        <option :value="45">45 วัน</option>
                        <option :value="60">60 วัน</option>
                        <option :value="90">90 วัน</option>
                        <option :value="120">120 วัน</option>
                    </select>
                </div>
                <div>
                    <label>Payment Type <span class="text-danger">*</span></label>
                    <select class="form-select" v-model="form.paymentType">
                        <option :value="null" disabled>Select Payment Type</option>
                        <option value="cheque">Cheque</option>
                        <option value="transfer">Transfer</option>
                    </select>
                </div>
                <div class="md:col-span-2">
                    <label>Remark / Additional Notes</label>
                    <textarea class="form-textarea" rows="3" v-model="form.remark" placeholder="Any special instructions..."></textarea>
                </div>
            </div>
        </div>

        <!-- Section 3 — Document Upload -->
        <div class="panel mb-5">
            <h5 class="mb-5 text-lg font-semibold flex items-center gap-2">
                <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">3</span>
                Section 3 — Document Upload
            </h5>
            
            <div class="space-y-3">
                <div v-for="doc in form.documents" :key="doc.docId" class="flex flex-wrap md:flex-nowrap items-center gap-4 border border-gray-200 dark:border-[#191e3a] rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-dark/20 transition-colors">
                    <div class="flex-grow">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-semibold dark:text-white-light text-base">{{ doc.docName }}</span>
                            <span v-if="doc.required" class="badge badge-outline-danger text-[10px] py-0.5 px-1.5 uppercase">Required</span>
                            <span v-else class="badge badge-outline-secondary text-[10px] py-0.5 px-1.5 uppercase">Optional</span>
                        </div>
                        <p class="text-xs text-white-dark" v-if="doc.files.length > 0">
                            Files: {{ doc.files.map(f => f.name).join(', ') }}
                        </p>
                    </div>
                    <div class="flex items-center gap-3 flex-none">
                        <div v-if="doc.uploadStatus === 'uploaded'" class="flex items-center gap-1 text-success text-sm font-bold bg-success/10 px-3 py-1 rounded-full">
                            <icon-circle-check class="w-4 h-4" />
                            Uploaded
                        </div>
                        <input
                            type="file"
                            class="hidden"
                            :id="'file-' + doc.docId"
                            @change="(e) => handleFileUpload(doc.docId, (e.target as HTMLInputElement).files)"
                            accept="application/pdf,image/*"
                            multiple
                        />
                        <label :for="'file-' + doc.docId" class="btn btn-sm btn-outline-primary cursor-pointer mb-0">
                            {{ doc.uploadStatus === 'uploaded' ? 'Change Files' : 'Upload Files' }}
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sticky Bottom Bar -->
        <div class="sticky bottom-0 bg-white dark:bg-[#0e1726] border-t dark:border-[#191e3a] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] p-4 z-10 -mx-6 px-10">
            <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="flex flex-col">
                    <span class="text-xs uppercase text-white-dark font-semibold">Total Requested Amount</span>
                    <span class="text-xl font-bold text-primary">฿ {{ formatNumber(form.requestedAmount || 0) }}</span>
                </div>
                <div class="flex items-center gap-3">
                    <button @click="onSaveDraft" class="btn btn-outline-secondary">Save Draft</button>
                    <button @click="onSubmit" :disabled="!isFormValid" class="btn btn-primary px-8 shadow-md hover:shadow-lg disabled:opacity-50 transition-all">
                        Submit Request
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import Vue3Datatable from '@bhplugin/vue3-datatable';
    import { useFactoringRequest } from '@/composables/useFactoringRequest';
    import Swal from 'sweetalert2';

    useHead({ title: 'New Factoring Request' });

    const { 
        form, 
        pendingPOs, 
        totalSelectedAmount, 
        selectedBuyerNames, 
        selectedPoRefs, 
        isFormValid, 
        handleFileUpload, 
        saveDraft, 
        submitRequest 
    } = useFactoringRequest();

    const lastSaved = ref('');

    const cols = ref([
        { field: 'id', title: '', sort: false, width: '40px' },
        { field: 'poNumber', title: 'PO Number' },
        { field: 'poDate', title: 'PO Date' },
        { field: 'buyer', title: 'Buyer' },
        { field: 'amount', title: 'Amount', textAlign: 'right' },
        { field: 'term', title: 'Term (Days)', textAlign: 'center' },
        { field: 'status', title: 'Status' },
    ]);

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(num);
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'approved': return 'badge badge-outline-success text-[10px]';
            case 'rejected': return 'badge badge-outline-danger text-[10px]';
            case 'draft': return 'badge badge-outline-secondary text-[10px]';
            default: return 'badge badge-outline-warning text-[10px]';
        }
    };

    const onSaveDraft = async () => {
        const result = await saveDraft();
        if (result.success) {
            lastSaved.value = result.timestamp;
            const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
            });
            toast.fire({
                icon: 'success',
                title: 'Draft saved successfully',
                padding: '10px 20px',
            });
        }
    };

    const onSubmit = async () => {
        const result = await submitRequest();
        if (result.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Request Submitted!',
                text: 'Your factoring request has been received and is under review.',
                confirmButtonColor: '#4361ee',
            });
            navigateTo('/request_list');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: result.message,
                confirmButtonColor: '#e7515a',
            });
        }
    };
</script>

<style scoped>
    .btn-outline-white {
        @apply bg-transparent border-2 border-white text-white;
    }
    .btn-outline-white:hover {
        @apply bg-white text-primary;
    }
</style>
