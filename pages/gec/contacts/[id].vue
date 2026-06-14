<template>
    <div>
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-dark dark:text-white">Edit Contact</h2>
                <p class="mt-1 text-sm text-white-dark">Contact #{{ route.params.id }}</p>
            </div>
            <NuxtLink to="/gec/contacts" class="btn btn-outline-secondary gap-1">
                <icon-arrow-left class="h-4 w-4" />
                Back to list
            </NuxtLink>
        </div>

        <div v-if="loadingError" class="panel border border-danger/40 bg-danger/10 py-10 text-center text-danger">
            {{ loadingError }}
        </div>

        <div v-else-if="isLoading" class="panel flex items-center justify-center py-20">
            <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
            <span class="ml-3 text-white-dark">Loading…</span>
        </div>

        <div v-else class="panel">
            <div v-if="errorMessage" class="mb-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                {{ errorMessage }}
            </div>

            <form @submit.prevent="onSubmit" class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label class="mb-1 block text-sm font-semibold">Name <span class="text-danger">*</span></label>
                    <input v-model.trim="form.name" type="text" class="form-input" :class="{ 'border-danger': v$.name.$error }" maxlength="255" />
                    <p v-if="v$.name.$error" class="mt-1 text-xs text-danger">Name is required.</p>
                </div>

                <div>
                    <label class="mb-1 block text-sm font-semibold">Company</label>
                    <input v-model.trim="form.company_name" type="text" class="form-input" maxlength="255" />
                </div>

                <div>
                    <label class="mb-1 block text-sm font-semibold">Email</label>
                    <input v-model.trim="form.email" type="email" class="form-input" :class="{ 'border-danger': v$.email.$error }" />
                    <p v-if="v$.email.$error" class="mt-1 text-xs text-danger">Enter a valid email address.</p>
                </div>

                <div>
                    <label class="mb-1 block text-sm font-semibold">Phone</label>
                    <input v-model.trim="form.phone" type="text" class="form-input" :class="{ 'border-danger': v$.phone.$error }" />
                    <p v-if="v$.phone.$error" class="mt-1 text-xs text-danger">Phone may contain digits, spaces, +, -, ( ).</p>
                </div>

                <div>
                    <label class="mb-1 block text-sm font-semibold">Status</label>
                    <select v-model="form.status" class="form-select">
                        <option v-for="s in CONTACT_STATUSES" :key="s" :value="s">{{ CONTACT_STATUS_LABEL[s] }}</option>
                    </select>
                </div>

                <div>
                    <label class="mb-1 block text-sm font-semibold">Last contacted</label>
                    <div class="flex h-[42px] items-center rounded-md border border-[#e0e6ed] bg-[#fafafa] px-3 text-sm dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                        {{ formatDate(form.last_contacted_at) }}
                    </div>
                </div>

                <!-- Register form fields (read-only if source = register_form) -->
                <div>
                    <label class="mb-1 block text-sm font-semibold">เลขนิติบุคคล / Tax ID</label>
                    <input v-if="metadata.source !== 'register_form'" v-model.trim="form.tax_id" type="text" class="form-input" maxlength="13" placeholder="13 หลัก" />
                    <div v-else class="flex h-[42px] items-center rounded-md border border-[#e0e6ed] bg-[#fafafa] px-3 text-sm dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                        {{ form.tax_id || '-' }}
                    </div>
                </div>

                <div>
                    <label class="mb-1 block text-sm font-semibold">ตำแหน่ง</label>
                    <input v-if="metadata.source !== 'register_form'" v-model.trim="form.position" type="text" class="form-input" maxlength="255" />
                    <div v-else class="flex h-[42px] items-center rounded-md border border-[#e0e6ed] bg-[#fafafa] px-3 text-sm dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                        {{ form.position || '-' }}
                    </div>
                </div>

                <div v-if="form.message" class="md:col-span-2">
                    <label class="mb-1 block text-sm font-semibold">ข้อความจากลูกค้า <span class="ml-1 text-xs font-normal text-white-dark">(read-only)</span></label>
                    <textarea class="form-textarea" rows="3" readonly :value="form.message"></textarea>
                </div>

                <!-- Account status -->
                <div class="md:col-span-2">
                    <!-- มี Account แล้ว -->
                    <div v-if="metadata.linked_user_id" class="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
                        <icon-check class="h-5 w-5 text-success shrink-0" />
                        <div>
                            <p class="text-sm font-semibold text-success">มี Account แล้ว</p>
                            <p class="text-xs text-white-dark">User ID: {{ metadata.linked_user_id }}</p>
                        </div>
                    </div>

                    <!-- ยังไม่มี Account — แสดงเมื่อ eligible -->
                    <div
                        v-else-if="selectedSupplier && form.email && !metadata.linked_user_id"
                        class="flex items-center justify-between rounded-lg border border-[#e0e6ed] bg-[#fafafa] px-4 py-3 dark:border-[#1b2e4b] dark:bg-[#1b2e4b]"
                    >
                        <div class="flex items-center gap-2">
                            <icon-user class="h-5 w-5 text-white-dark shrink-0" />
                            <p class="text-sm text-white-dark">ยังไม่มี Account</p>
                        </div>
                        <button
                            type="button"
                            class="btn btn-outline-primary btn-sm gap-1"
                            @click="showCreateUserDialog = true"
                        >
                            <icon-user-plus class="h-4 w-4" />
                            สร้าง User Account
                        </button>
                    </div>
                </div>

                <!-- Confirmation Dialog -->
                <Teleport to="body">
                    <TransitionRoot appear :show="showCreateUserDialog" as="template">
                        <Dialog as="div" @close="showCreateUserDialog = false" class="relative z-50">
                            <TransitionChild as="template"
                                enter="duration-200 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                                leave="duration-150 ease-in"  leave-from="opacity-100" leave-to="opacity-0">
                                <div class="fixed inset-0 bg-black/60" />
                            </TransitionChild>

                            <div class="fixed inset-0 flex items-center justify-center p-4">
                                <TransitionChild as="template"
                                    enter="duration-200 ease-out" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100"
                                    leave="duration-150 ease-in"  leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
                                    <DialogPanel class="w-full max-w-md rounded-xl bg-white p-6 dark:bg-[#1b2e4b]">
                                        <DialogTitle class="mb-4 text-lg font-bold dark:text-white">
                                            ยืนยันการสร้าง User Account
                                        </DialogTitle>

                                        <div class="mb-5 space-y-2 rounded-lg bg-gray-50 dark:bg-[#0e1726] p-4 text-sm">
                                            <p class="text-white-dark">ชื่อ: <span class="font-semibold text-dark dark:text-white">{{ form.name }}</span></p>
                                            <p class="text-white-dark">Email: <span class="font-semibold text-dark dark:text-white">{{ form.email }}</span></p>
                                            <p class="text-white-dark">Supplier Code: <span class="font-mono font-semibold text-primary">{{ selectedSupplier?.supplier_code }}</span></p>
                                        </div>

                                        <p class="mb-5 text-sm text-white-dark">
                                            ระบบจะส่ง email ไปยัง <span class="font-semibold text-dark dark:text-white">{{ form.email }}</span> เพื่อให้ตั้งรหัสผ่าน
                                        </p>

                                        <div v-if="createUserError" class="mb-4 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                                            {{ createUserError }}
                                        </div>

                                        <div class="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                class="btn btn-outline-secondary"
                                                :disabled="isCreatingUser"
                                                @click="showCreateUserDialog = false; createUserError = ''"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                type="button"
                                                class="btn btn-primary"
                                                :disabled="isCreatingUser"
                                                @click="createUserAccount"
                                            >
                                                <span v-if="isCreatingUser" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                                {{ isCreatingUser ? 'กำลังสร้าง...' : 'ยืนยัน สร้าง Account' }}
                                            </button>
                                        </div>
                                    </DialogPanel>
                                </TransitionChild>
                            </div>
                        </Dialog>
                    </TransitionRoot>
                </Teleport>

                <!-- Supplier mapping (optional) -->
                <div class="md:col-span-2">
                    <label class="mb-1 block text-sm font-semibold">Supplier <span class="text-white-dark font-normal">(optional)</span></label>
                    <div class="relative">
                        <input
                            v-model="supplierSearch"
                            @input="onSupplierSearch"
                            @focus="onSupplierFocus"
                            @blur="onSupplierBlur"
                            type="text"
                            class="form-input"
                            placeholder="ค้นหา Supplier Code หรือชื่อ…"
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
                                        : 'hover:bg-gray-50 dark:hover:bg-white/5',
                                ]"
                                type="button"
                            >
                                <span class="badge bg-primary/20 text-primary font-mono text-xs shrink-0 min-w-[52px] text-center">{{ s.supplier_code }}</span>
                                <span class="text-sm text-dark dark:text-white truncate">{{ s.supplier_name }}</span>
                            </button>
                        </div>
                        <div v-if="isLoadingSuppliers" class="absolute right-3 top-1/2 -translate-y-1/2">
                            <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-l-transparent"></span>
                        </div>
                    </div>
                    <div v-if="selectedSupplier" class="mt-2 flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5">
                        <span class="badge bg-primary/20 text-primary font-mono text-xs shrink-0">{{ selectedSupplier.supplier_code }}</span>
                        <span class="text-sm font-semibold text-dark dark:text-white truncate flex-1">{{ selectedSupplier.supplier_name }}</span>
                        <button @click="clearSupplier" type="button" class="text-white-dark hover:text-danger transition-colors shrink-0" title="ล้างการเลือก">
                            <icon-x class="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div class="md:col-span-2 mt-2 flex justify-end gap-3">
                    <NuxtLink to="/gec/contacts" class="btn btn-outline-secondary">Cancel</NuxtLink>
                    <button type="submit" class="btn btn-primary" :disabled="isSaving">
                        <span v-if="isSaving" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                        Save changes
                    </button>
                </div>

                <div class="md:col-span-2 mt-2 border-t border-[#e0e6ed] pt-3 text-xs text-white-dark dark:border-[#1b2e4b]">
                    Created {{ formatDate(metadata.created_at) }} · Updated {{ formatDate(metadata.updated_at) }}
                </div>
            </form>

            <!-- Site Visits Section -->
            <SiteVisitSection :contact-id="Number(route.params.id)" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue';
import useVuelidate from '@vuelidate/core';
import { required, email, helpers, maxLength } from '@vuelidate/validators';
import {
    useContact,
    CONTACT_STATUSES,
    CONTACT_STATUS_LABEL,
    type ContactStatus,
} from '@/composables/useContact';
import { useAuthStore } from '@/stores/auth';

useHead({ title: 'Edit Contact - NEX Finance' });
definePageMeta({ layout: 'default' });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { getContact, updateContact } = useContact();

const LISTSUPPLIERS_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/listsuppliers';
const CREATE_USER_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/create-supplier-user';

// ── Create User Dialog ────────────────────────────────────
const showCreateUserDialog = ref(false);
const isCreatingUser       = ref(false);
const createUserError      = ref('');

const isLoading = ref(true);
const loadingError = ref('');
const isSaving = ref(false);
const errorMessage = ref('');

const form = reactive({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    status: 'lead' as ContactStatus,
    last_contacted_at: null as string | null,
    tax_id: '',
    position: '',
    message: null as string | null,
});

const metadata = reactive({
    created_at: '',
    updated_at: '',
    source: 'manual' as 'manual' | 'register_form',
    linked_user_id: null as string | null,
});

const phoneAllowed = helpers.regex(/^[\d+\-()\s]*$/);

const rules = {
    name: { required, maxLength: maxLength(255) },
    email: { email },
    phone: { phoneAllowed: helpers.withMessage('Phone may contain digits, spaces, +, -, ( ).', phoneAllowed) },
};
const v$ = useVuelidate(rules, form);

// ── Supplier search ───────────────────────────────────────────
const supplierSearch       = ref('');
const supplierOptions      = ref<any[]>([]);
const selectedSupplier     = ref<any>(null);
const showSupplierDropdown = ref(false);
const isLoadingSuppliers   = ref(false);
let   supplierDebounce: ReturnType<typeof setTimeout> | null = null;

const fetchSupplierOptions = async (search: string) => {
    isLoadingSuppliers.value = true;
    try {
        const params = new URLSearchParams({ limit: '50' });
        if (search) params.set('search', search);
        const res  = await fetch(`${LISTSUPPLIERS_URL}?${params.toString()}`);
        const data = await res.json();
        supplierOptions.value = data.data ?? [];
    } catch (err: any) {
        console.error('[listsuppliers]', err.message);
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
    showSupplierDropdown.value = false;
};

const load = async () => {
    isLoading.value = true;
    loadingError.value = '';
    try {
        const c = await getContact(route.params.id as string);
        form.name = c.name;
        form.company_name = c.company_name ?? '';
        form.email = c.email ?? '';
        form.phone = c.phone ?? '';
        form.status = c.status;
        form.last_contacted_at = c.last_contacted_at;
        form.tax_id = c.tax_id ?? '';
        form.position = c.position ?? '';
        form.message = c.message ?? null;
        metadata.created_at = c.created_at;
        metadata.updated_at = c.updated_at;
        metadata.source = c.source ?? 'manual';
        metadata.linked_user_id = c.linked_user_id ?? null;
        if (c.supplier_code) {
            selectedSupplier.value = {
                supplier_code: c.supplier_code,
                supplier_name: c.supplier_name ?? '',
            };
        }
    } catch (err: any) {
        if (err?.status === 401) {
            authStore.clearAuth();
            router.push('/auth/cover-login');
            return;
        }
        loadingError.value = err?.status === 404
            ? 'Contact not found or you do not have permission to view it.'
            : err?.message || 'Failed to load contact';
    } finally {
        isLoading.value = false;
    }
};

const onSubmit = async () => {
    errorMessage.value = '';
    const ok = await v$.value.$validate();
    if (!ok) return;

    isSaving.value = true;
    try {
        await updateContact(route.params.id as string, {
            name: form.name,
            company_name: form.company_name || null,
            email: form.email || null,
            phone: form.phone || null,
            status: form.status,
            supplier_code: selectedSupplier.value?.supplier_code ?? null,
            supplier_name: selectedSupplier.value?.supplier_name ?? null,
            tax_id: form.tax_id || null,
            position: form.position || null,
        });
        router.push('/gec/contacts');
    } catch (err: any) {
        if (err?.status === 401) {
            authStore.clearAuth();
            router.push('/auth/cover-login');
            return;
        }
        errorMessage.value = err?.message || 'Failed to save contact';
    } finally {
        isSaving.value = false;
    }
};

const formatDate = (value: string | null) => {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return value;
    }
};

const createUserAccount = async () => {
    isCreatingUser.value  = true;
    createUserError.value = '';
    try {
        const res = await fetch(CREATE_USER_URL, {
            method : 'POST',
            headers: {
                'Authorization': `Bearer ${authStore.accessToken}`,
                'Content-Type' : 'application/json',
            },
            body: JSON.stringify({ contact_id: Number(route.params.id) }),
        });

        const data = await res.json();
        if (!res.ok) {
            createUserError.value = data.error ?? 'เกิดข้อผิดพลาด';
            return;
        }

        metadata.linked_user_id = data.user_id;
        showCreateUserDialog.value = false;
    } catch (err: any) {
        createUserError.value = err.message ?? 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
    } finally {
        isCreatingUser.value = false;
    }
};

onMounted(load);
</script>
