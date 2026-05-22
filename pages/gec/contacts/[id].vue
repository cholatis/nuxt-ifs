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
        </div>
    </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue';
import useVuelidate from '@vuelidate/core';
import { required, email, helpers, maxLength } from '@vuelidate/validators';
import {
    useContact,
    CONTACT_STATUSES,
    CONTACT_STATUS_LABEL,
    type ContactStatus,
} from '@/composables/useContact';
import { useAuthStore } from '@/stores/auth';

useHead({ title: 'Edit Contact - IFS Finance' });
definePageMeta({ layout: 'default' });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { getContact, updateContact } = useContact();

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
});

const metadata = reactive({
    created_at: '',
    updated_at: '',
});

const phoneAllowed = helpers.regex(/^[\d+\-()\s]*$/);

const rules = {
    name: { required, maxLength: maxLength(255) },
    email: { email },
    phone: { phoneAllowed: helpers.withMessage('Phone may contain digits, spaces, +, -, ( ).', phoneAllowed) },
};
const v$ = useVuelidate(rules, form);

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
        metadata.created_at = c.created_at;
        metadata.updated_at = c.updated_at;
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

onMounted(load);
</script>
