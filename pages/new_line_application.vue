<template>
    <div>
        <!-- Header Bar -->
        <div class="bg-primary text-white rounded-lg p-4 flex items-center justify-between mb-5 shadow-md">
            <div class="flex items-center gap-4">
                <div class="p-2 bg-white/20 rounded-lg">
                    <icon-menu-invoice class="w-6 h-6" />
                </div>
                <div>
                    <h4 class="text-xl font-bold">Factoring Credit Line Application</h4>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-white/80 text-sm">ID: {{ application.applicationId }}</span>
                        <span :class="getStatusBadgeClass(application.status)">{{ application.status.toUpperCase() }}</span>
                        <span v-if="lastSaved" class="text-xs text-white/60 ml-2 italic">Last saved: {{ lastSaved }}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <button @click="onSaveDraft" class="btn btn-outline-white border-white text-white hover:bg-white hover:text-primary transition-colors">
                    Save Draft
                </button>
                <button @click="onSubmit" :disabled="!isFormValid" class="btn bg-white text-primary font-bold shadow-lg hover:bg-gray-100 disabled:opacity-50 transition-all">
                    Submit Application
                </button>
            </div>
        </div>

        <!-- Section 1 — Company Information & Requested Limit -->
        <div class="panel mb-5">
            <h5 class="mb-5 text-lg font-semibold flex items-center gap-2">
                <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                Section 1 — Company Information & Requested Limit
            </h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label>Company Name</label>
                    <input type="text" :value="application.companyName" class="form-input bg-gray-100 dark:bg-[#1b2e4b]" readonly />
                </div>
                <div>
                    <label>Tax ID</label>
                    <input type="text" :value="application.taxId" class="form-input bg-gray-100 dark:bg-[#1b2e4b]" readonly />
                </div>
                <div>
                    <label>Business Type <span class="text-danger">*</span></label>
                    <select class="form-select" v-model="application.businessType">
                        <option value="" disabled>Select Business Type</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Trade">Trade</option>
                        <option value="Services">Services</option>
                        <option value="Contractor">Contractor</option>
                        <option value="Others">Others</option>
                    </select>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label>Requested Credit Limit (THB) <span class="text-danger">*</span></label>
                        <input type="number" class="form-input" v-model="application.requestedCreditLimit" placeholder="0.00" />
                    </div>
                    <div>
                        <label>Credit Period (Days) <span class="text-danger">*</span></label>
                        <select class="form-select" v-model="application.creditPeriod">
                            <option :value="null" disabled>Select Period</option>
                            <option :value="30">30 วัน</option>
                            <option :value="45">45 วัน</option>
                            <option :value="60">60 วัน</option>
                            <option :value="90">90 วัน</option>
                            <option :value="120">120 วัน</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 2 — Billing & Payment Terms -->
        <div class="panel mb-5">
            <h5 class="mb-5 text-lg font-semibold flex items-center gap-2">
                <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                Section 2 — Billing & Payment Terms
            </h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label>Billing Schedule <span class="text-danger">*</span></label>
                    <input type="text" class="form-input" v-model="application.billingSchedule" placeholder="e.g. Every Friday" />
                </div>
                <div>
                    <label>Payment Due Date <span class="text-danger">*</span></label>
                    <input type="text" class="form-input" v-model="application.paymentDueDate" placeholder="e.g. 15th of next month" />
                </div>
                <div>
                    <label>Payment Type <span class="text-danger">*</span></label>
                    <select class="form-select" v-model="application.paymentType">
                        <option :value="null" disabled>Select Payment Type</option>
                        <option value="cheque">Cheque</option>
                        <option value="transfer">Transfer</option>
                    </select>
                </div>
                <div>
                    <label>Payment/Cheque Collection Location</label>
                    <input type="text" class="form-input" v-model="application.billingLocation" />
                </div>
                <div class="md:col-span-2">
                    <label>Billing/Payment Rules & Remarks</label>
                    <textarea class="form-textarea" rows="3" v-model="application.billingRemark"></textarea>
                </div>
            </div>
        </div>

        <!-- Section 3 — Document Upload -->
        <div class="panel mb-5">
            <h5 class="mb-5 text-lg font-semibold flex items-center gap-2">
                <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">3</span>
                Section 3 — Document Upload
            </h5>

            <!-- Tabs Header -->
            <div class="flex items-center border-b border-gray-200 dark:border-[#191e3a] mb-5">
                <button
                    v-for="tab in tabs"
                    :key="tab.id"
                    @click="activeTab = tab.id"
                    class="p-4 border-b-2 font-semibold transition-all hover:text-primary"
                    :class="activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-white-dark'"
                >
                    {{ tab.name }}
                    <span class="ml-2 badge badge-outline-primary text-xs">{{ getTabDocCount(tab.id) }}</span>
                </button>
            </div>

            <!-- Tab Content -->
            <div>
                <!-- Alert Notes for Specific Tabs -->
                <div v-if="activeTab === 'financial'" class="bg-warning/10 border border-warning/20 p-4 rounded-lg flex gap-3 mb-5">
                    <icon-info-circle class="text-warning w-5 h-5 flex-none" />
                    <p class="text-sm text-warning-dark font-medium">
                        Note: If 2023 financial statement is not yet closed, please attach P.P.30 (Jan-Dec 2023) instead.
                    </p>
                </div>
                <div v-if="activeTab === 'director'" class="bg-warning/10 border border-warning/20 p-4 rounded-lg flex gap-3 mb-5">
                    <icon-info-circle class="text-warning w-5 h-5 flex-none" />
                    <p class="text-sm text-warning-dark font-medium">
                        Credit Bureau documents must be no older than 1 month
                    </p>
                </div>

                <!-- Document List -->
                <div v-for="doc in filteredDocuments" :key="doc.docId" class="flex flex-wrap md:flex-nowrap items-center gap-4 border border-gray-200 dark:border-[#191e3a] rounded-lg p-4 mb-3 hover:bg-gray-50 dark:hover:bg-dark/20 transition-colors">
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

        <!-- Sticky Bottom Progress Bar -->
        <div class="sticky bottom-0 bg-white dark:bg-[#0e1726] border-t dark:border-[#191e3a] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] p-4 z-10 -mx-6 px-10">
            <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="w-full md:w-1/3">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-semibold dark:text-white-light">Application Progress</span>
                        <span class="text-xs font-bold text-primary">{{ uploadProgress.uploaded }} of {{ uploadProgress.total }} required items ({{ uploadProgress.percentage }}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-dark rounded-full h-2">
                        <div class="bg-primary h-2 rounded-full transition-all duration-500" :style="{ width: uploadProgress.percentage + '%' }"></div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button @click="onSaveDraft" class="btn btn-outline-secondary">Save Draft</button>
                    <button @click="onSubmit" :disabled="!isFormValid" class="btn btn-primary px-8 shadow-md hover:shadow-lg disabled:opacity-50 transition-all">
                        Submit Application
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue';
    import { useCreditLineApplication } from '@/composables/useCreditLineApplication';
    import Swal from 'sweetalert2';

    useHead({ title: 'New Line Application' });

    const { application, uploadProgress, isFormValid, saveDraft, submitApplication, handleFileUpload } = useCreditLineApplication();

    const activeTab = ref('company');
    const lastSaved = ref('');

    const tabs = [
        { id: 'company', name: 'Company Documents' },
        { id: 'financial', name: 'Financial Documents' },
        { id: 'director', name: 'Director Documents' },
    ];

    const filteredDocuments = computed(() => {
        return application.value.documents.filter((doc) => doc.docGroup === activeTab.value);
    });

    const getTabDocCount = (groupId: string) => {
        return application.value.documents.filter((doc) => doc.docGroup === groupId).length;
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
        const result = await submitApplication();
        if (result.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Application Submitted!',
                text: 'Your credit line application has been received and is under review.',
                confirmButtonColor: '#4361ee',
            });
            navigateTo('/credit_application/request_list');
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
