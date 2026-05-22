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
                <NuxtLink to="/supplier/request-list" class="btn btn-outline-white border-white text-white hover:bg-white hover:text-primary transition-colors">
                    ← Back
                </NuxtLink>
                <button @click="onSaveDraft" class="btn btn-outline-white border-white text-white hover:bg-white hover:text-primary transition-colors">
                    Save Draft
                </button>
                <button @click="onSubmit" :disabled="!isFormValid || isSubmitting || (maxRequestAmount > 0 && form.requestedAmount > maxRequestAmount)" class="btn bg-white text-primary font-bold shadow-lg hover:bg-gray-100 disabled:opacity-50 transition-all">
                    <span v-if="isSubmitting" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-l-transparent mr-2"></span>
                    {{ isSubmitting ? 'Submitting...' : 'Submit Request' }}
                </button>
            </div>
        </div>

        <!-- Credit Facility Summary -->
        <div class="mb-5">
            <!-- Loading skeleton -->
            <div v-if="isLoadingCredit" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div v-for="i in 3" :key="i" class="rounded-xl p-4 bg-gray-100 dark:bg-[#1b2e4b] animate-pulse h-20"></div>
            </div>

            <!-- Error loading credit -->
            <div v-else-if="creditError" class="rounded-xl border border-dashed border-danger/50 bg-danger/5 px-5 py-4 text-sm text-danger flex items-center gap-2">
                <span class="text-lg">⚠</span>
                โหลดข้อมูลวงเงินไม่สำเร็จ: {{ creditError }}
            </div>

            <!-- No facility -->
            <div v-else-if="!credit.has_facility" class="rounded-xl border border-dashed border-warning/50 bg-warning/5 px-5 py-4 text-sm text-white-dark flex items-center gap-2">
                <span class="text-warning text-lg">⚠</span>
                ยังไม่มีวงเงิน Credit กรุณาติดต่อ GEC เพื่อขอวงเงิน
            </div>

            <!-- Credit cards -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <!-- Total Credit Limit -->
                <div class="rounded-xl bg-[#7c6ef5] text-white px-5 py-4 flex items-center justify-between shadow-md">
                    <span class="text-sm font-medium opacity-90">Total Credit Limit</span>
                    <span class="text-lg font-black tracking-tight">{{ formatNumber(credit.credit_limit) }} THB</span>
                </div>
                <!-- Already Used -->
                <div class="rounded-xl bg-[#f5a623] text-white px-5 py-4 flex items-center justify-between shadow-md">
                    <span class="text-sm font-medium opacity-90">Already Used</span>
                    <span class="text-lg font-black tracking-tight">{{ formatNumber(credit.already_used) }} THB</span>
                </div>
                <!-- Remaining -->
                <div class="rounded-xl px-5 py-4 flex items-center justify-between shadow-md"
                    :class="credit.remaining <= 0 ? 'bg-danger' : 'bg-[#27ae60]'">
                    <span class="text-sm font-medium text-white opacity-90">Remaining</span>
                    <span class="text-lg font-black tracking-tight text-white">{{ formatNumber(credit.remaining) }} THB</span>
                </div>
                <!-- % Factoring -->
                <div class="rounded-xl bg-[#1b7bdb] text-white px-5 py-4 flex items-center justify-between shadow-md">
                    <span class="text-sm font-medium opacity-90">% Factoring</span>
                    <span class="text-lg font-black tracking-tight">
                        {{ credit.factoring_rate != null ? credit.factoring_rate + ' %' : '-' }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Section 1 — Select Items -->
        <div class="panel mb-5">
            <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                Section 1 — Select {{ form.drawdownType === 'po' ? 'Purchase Orders' : 'Invoices' }}
            </h5>

            <!-- Drawdown Type Selector -->
            <div class="mb-5">
                <div class="flex items-center gap-3 flex-wrap">
                    <span class="text-sm font-medium text-white-dark">ประเภทเอกสาร:</span>

                    <!-- Locked by facility -->
                    <template v-if="credit.has_facility">
                        <span class="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
                            <span class="font-semibold text-primary">
                                {{ form.drawdownType === 'po' ? 'Purchase Order (PO)' : 'Invoice' }}
                            </span>
                            <span class="badge bg-primary/20 text-primary text-[10px]">กำหนดโดย LINE Facility</span>
                        </span>
                    </template>

                    <!-- Free selection (no facility yet) -->
                    <template v-else>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="drawdownType"
                                value="invoice"
                                v-model="form.drawdownType"
                                @change="form.selectedInvoiceIds = []"
                                class="form-radio text-primary"
                            />
                            <span class="font-medium">Invoice</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="drawdownType"
                                value="po"
                                v-model="form.drawdownType"
                                @change="form.selectedInvoiceIds = []"
                                class="form-radio text-primary"
                            />
                            <span class="font-medium">Purchase Order (PO)</span>
                        </label>
                    </template>
                </div>
                <p v-if="credit.has_facility" class="mt-1 text-xs text-white-dark">
                    ประเภทเอกสารถูกกำหนดโดย Line Credit Facility ที่ได้รับการอนุมัติ
                </p>
            </div>

            <div class="mb-4">
                <p class="text-sm text-white-dark mb-4">
                    Please select the {{ form.drawdownType === 'po' ? 'Purchase Orders' : 'Invoices' }} you would like to include in this factoring request.
                </p>

                <!-- Loading -->
                <div v-if="form.drawdownType === 'invoice' ? isLoadingInvoice : isLoadingPO"
                    class="flex items-center justify-center py-10 text-white-dark gap-3">
                    <span class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
                    กำลังโหลดรายการ {{ form.drawdownType === 'po' ? 'PO' : 'Invoice' }}...
                </div>

                <!-- Error -->
                <div v-else-if="form.drawdownType === 'invoice' ? invoiceError : poError"
                    class="py-6 text-center text-danger text-sm">
                    โหลดข้อมูลไม่สำเร็จ: {{ form.drawdownType === 'invoice' ? invoiceError : poError }}
                </div>

                <!-- Empty -->
                <div v-else-if="activeItems.length === 0" class="py-10 text-center text-white-dark text-sm">
                    ไม่พบรายการ {{ form.drawdownType === 'po' ? 'PO' : 'Invoice' }} ที่พร้อมใช้งาน
                </div>

                <!-- Table -->
                <div v-else class="table-responsive">
                    <table class="table-hover table">
                        <thead>
                            <tr>
                                <th class="w-10"></th>
                                <th>{{ form.drawdownType === 'po' ? 'PO No' : 'Invoice No' }}</th>
                                <th>{{ form.drawdownType === 'po' ? 'PO Date' : 'Invoice Date' }}</th>
                                <th>Buyer</th>
                                <th class="text-right">Amount (THB)</th>
                                <th class="text-center">{{ form.drawdownType === 'po' ? 'Invoice Reference' : 'PO Reference' }}</th>
                                <th class="text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="inv in activeItems" :key="inv.id">
                                <td>
                                    <input type="checkbox" :value="inv.id" v-model="form.selectedInvoiceIds" class="form-checkbox" />
                                </td>
                                <td class="font-semibold text-primary">{{ inv.invoiceNo }}</td>
                                <td class="text-white-dark text-sm">{{ inv.invoiceDate }}</td>
                                <td>{{ inv.buyer }}</td>
                                <td class="text-right font-bold">{{ formatNumber(inv.amount) }}</td>
                                <td class="text-center text-white-dark text-sm">{{ inv.poNo }}</td>
                                <td class="text-center">
                                    <span class="badge badge-outline-info text-[10px]">{{ inv.status }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Selection Summary -->
            <div v-if="form.selectedInvoiceIds.length > 0" class="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h6 class="font-bold text-primary mb-1">Selection Summary</h6>
                        <p class="text-sm text-white-dark">
                            {{ form.selectedInvoiceIds.length }} {{ form.drawdownType === 'po' ? 'PO(s)' : 'Invoice(s)' }} selected:
                            <span class="font-medium text-black dark:text-white">{{ selectedInvoiceRefs }}</span>
                        </p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs uppercase text-white-dark font-semibold">
                            Total {{ form.drawdownType === 'po' ? 'PO' : 'Invoice' }} Value
                        </p>
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
                    <input type="text" :value="form.drawdownType === 'po' ? 'PO Factoring' : 'Invoice Factoring'" class="form-input bg-gray-100 dark:bg-[#1b2e4b]" readonly />
                </div>
                <div>
                    <label>Selected {{ form.drawdownType === 'po' ? 'PO' : 'Invoice' }} Reference</label>
                    <input type="text" :value="selectedInvoiceRefs" class="form-input bg-gray-100 dark:bg-[#1b2e4b]" readonly :placeholder="`Select ${form.drawdownType === 'po' ? 'PO' : 'Invoice'} above`" />
                </div>
                <div>
                    <label>Buyer Name</label>
                    <input type="text" :value="selectedBuyerNames" class="form-input bg-gray-100 dark:bg-[#1b2e4b]" readonly placeholder="Auto-fill from selected POs" />
                </div>
                <div>
                    <label>Requested Amount (THB) <span class="text-danger">*</span></label>
                    <div class="relative">
                        <input
                            type="number"
                            class="form-input"
                            :class="{ 'border-danger': form.requestedAmount > maxRequestAmount && maxRequestAmount > 0 }"
                            v-model="form.requestedAmount"
                            :max="maxRequestAmount"
                            placeholder="0.00"
                        />
                        <span v-if="totalSelectedAmount > 0" class="absolute right-3 top-2 text-xs text-white-dark">
                            Max: {{ formatNumber(maxRequestAmount) }}
                            <template v-if="credit.factoring_rate != null"> ({{ credit.factoring_rate }}%)</template>
                        </span>
                    </div>
                    <p v-if="form.requestedAmount > maxRequestAmount && maxRequestAmount > 0"
                        class="mt-1 text-xs text-danger">
                        จำนวนเกินวงเงินที่อนุมัติ ({{ credit.factoring_rate }}% ของ {{ formatNumber(totalSelectedAmount) }})
                    </p>
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

        <!-- Sticky Bottom Bar -->
        <div class="sticky bottom-0 bg-white dark:bg-[#0e1726] border-t dark:border-[#191e3a] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] p-4 z-10 -mx-6 px-10">
            <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-6">
                    <div class="flex flex-col">
                        <span class="text-xs uppercase text-white-dark font-semibold">Total Requested Amount</span>
                        <span class="text-xl font-bold text-primary">฿ {{ formatNumber(form.requestedAmount || 0) }}</span>
                    </div>
                    <div v-if="credit.has_facility" class="hidden md:flex items-center gap-4 border-l pl-6 dark:border-[#191e3a]">
                        <div class="flex flex-col">
                            <span class="text-xs uppercase text-white-dark font-semibold">Remaining Credit</span>
                            <span class="text-xl font-bold" :class="credit.remaining <= 0 ? 'text-danger' : 'text-success'">
                                ฿ {{ formatNumber(credit.remaining) }}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button @click="onSaveDraft" class="btn btn-outline-secondary">Save Draft</button>
                    <button @click="onSubmit" :disabled="!isFormValid || isSubmitting || (maxRequestAmount > 0 && form.requestedAmount > maxRequestAmount)" class="btn btn-primary px-8 shadow-md hover:shadow-lg disabled:opacity-50 transition-all">
                        <span v-if="isSubmitting" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent mr-2"></span>
                        {{ isSubmitting ? 'Submitting...' : 'Submit Request' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, watch } from 'vue';
    import { useSupplierFactoringRequest } from '@/composables/useSupplierFactoringRequest';
    import { useAuthStore } from '@/stores/auth';
    import Swal from 'sweetalert2';

    useHead({ title: 'New Factoring Request - IFS Finance' });
    definePageMeta({ layout: 'default' });

    const { form, pendingInvoices, pendingPOs, activeItems, isLoadingInvoice, isLoadingPO, invoiceError, poError, totalSelectedAmount, selectedBuyerNames, selectedInvoiceRefs, isFormValid, saveDraft, submitRequest } = useSupplierFactoringRequest();

    const authStore = useAuthStore();
    const lastSaved = ref('');

    // ── Credit Facility ────────────────────────────────────────────
    const CREDIT_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/getcreditfacility';

    const isLoadingCredit = ref(true);
    const creditError     = ref('');
    const credit = ref({
        has_facility  : false,
        credit_limit  : 0,
        already_used  : 0,
        remaining     : 0,
        credit_period : null as number | null,
        interest_rate : null as number | null,
        factoring_rate: null as number | null,
        drawdown_type : 'invoice' as 'po' | 'invoice',
    });

    const fetchCredit = async () => {
        isLoadingCredit.value = true;
        creditError.value     = '';
        try {
            // Always use fresh session token
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;

            const res  = await fetch(CREDIT_URL, { headers: { Authorization: `Bearer ${jwt}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
            const factoringRate  = data.factoring_rate != null ? Number(data.factoring_rate) : null;
            const facilityDrawdownType: 'po' | 'invoice' = data.drawdown_type === 'po' ? 'po' : 'invoice';
            credit.value = {
                has_facility  : data.has_facility  ?? false,
                credit_limit  : Number(data.credit_limit  ?? 0),
                already_used  : Number(data.already_used  ?? 0),
                remaining     : Number(data.remaining     ?? 0),
                credit_period : data.credit_period ?? null,
                interest_rate : data.interest_rate ?? null,
                factoring_rate: factoringRate,
                drawdown_type : facilityDrawdownType,
            };
            // Snapshot factoring_rate and drawdown_type into form for payload
            form.value.factoringRate = factoringRate;
            if (data.has_facility) {
                // Lock the type to whatever was approved in the LINE facility
                form.value.drawdownType = facilityDrawdownType;
            }
        } catch (err: any) {
            creditError.value = err.message;
            console.error('[getcreditfacility] error:', err.message);
        } finally {
            isLoadingCredit.value = false;
        }
    };

    onMounted(fetchCredit);

    // ── Max requestable amount = floor(total invoice × factoring_rate / 100) — integer THB ──
    const maxRequestAmount = computed(() => {
        if (!totalSelectedAmount.value) return 0;
        if (credit.value.factoring_rate == null) return Math.floor(totalSelectedAmount.value);
        return Math.floor(totalSelectedAmount.value * credit.value.factoring_rate / 100);
    });

    // Auto-default requestedAmount to max. Only overwrite when the user hasn't manually
    // typed a custom value — detected by comparing current amount to the previous max.
    watch(maxRequestAmount, (newMax, oldMax) => {
        const current = form.value.requestedAmount;
        if (current === oldMax || current === 0 || current == null) {
            form.value.requestedAmount = newMax;
        }
    });

    // ── Helpers ────────────────────────────────────────────────────
    const formatNumber = (num: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.floor(num || 0));

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'approved': return 'badge badge-outline-success text-[10px]';
            case 'rejected': return 'badge badge-outline-danger text-[10px]';
            case 'draft':    return 'badge badge-outline-secondary text-[10px]';
            default:         return 'badge badge-outline-warning text-[10px]';
        }
    };

    const onSaveDraft = async () => {
        const result = await saveDraft();
        if (result.success) {
            lastSaved.value = result.timestamp!;
            const toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            toast.fire({ icon: 'success', title: 'Draft saved successfully', padding: '10px 20px' });
        } else {
            Swal.fire({ icon: 'error', title: 'Save Failed', text: result.message, confirmButtonColor: '#e7515a' });
        }
    };

    const isSubmitting = ref(false);

    const onSubmit = async () => {
        if (isSubmitting.value) return;
        isSubmitting.value = true;
        try {
            const result = await submitRequest();
            if (result.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Request Submitted!',
                    text: 'Your factoring request has been received and is under review.',
                    confirmButtonColor: '#4361ee',
                });
                navigateTo('/supplier/request-list');
            } else {
                Swal.fire({ icon: 'error', title: 'Submission Failed', text: result.message, confirmButtonColor: '#e7515a' });
            }
        } finally {
            isSubmitting.value = false;
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
