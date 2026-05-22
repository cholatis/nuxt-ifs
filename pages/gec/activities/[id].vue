<template>
    <div>
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-dark dark:text-white">Edit Activity</h2>
                <p class="mt-1 text-sm text-white-dark">Activity #{{ route.params.id }}</p>
            </div>
            <NuxtLink to="/gec/activities" class="btn btn-outline-secondary gap-1">
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
            <div v-if="willBumpLastContacted" class="mb-4 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">
                Marking this activity as Done will bump the contact's <span class="font-semibold">last_contacted_at</span> to the activity date.
            </div>

            <form @submit.prevent="onSubmit" class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label class="mb-1 block text-sm font-semibold">Contact</label>
                    <div class="flex h-[42px] items-center rounded-md border border-[#e0e6ed] bg-[#fafafa] px-3 text-sm dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                        {{ contactLabel }}
                        <span class="ml-2 text-xs text-white-dark">(cannot be changed)</span>
                    </div>
                </div>

                <div>
                    <label class="mb-1 block text-sm font-semibold">Type</label>
                    <select v-model="form.activity_type" class="form-select">
                        <option v-for="t in ACTIVITY_TYPES" :key="t" :value="t">{{ ACTIVITY_TYPE_LABEL[t] }}</option>
                    </select>
                </div>

                <div class="md:col-span-2">
                    <label class="mb-1 block text-sm font-semibold">Subject</label>
                    <input v-model.trim="form.subject" type="text" class="form-input" maxlength="255" />
                </div>

                <div class="md:col-span-2">
                    <label class="mb-1 block text-sm font-semibold">Description</label>
                    <textarea v-model="form.description" rows="3" class="form-textarea" maxlength="2000" :class="{ 'border-danger': v$.description.$error }"></textarea>
                    <p v-if="v$.description.$error" class="mt-1 text-xs text-danger">Keep it under 2000 characters.</p>
                </div>

                <div>
                    <label class="mb-1 block text-sm font-semibold">Activity date <span class="text-danger">*</span></label>
                    <input v-model="form.activity_date" type="datetime-local" class="form-input" :class="{ 'border-danger': v$.activity_date.$error }" />
                    <p v-if="v$.activity_date.$error" class="mt-1 text-xs text-danger">Date is required.</p>
                </div>

                <div>
                    <label class="mb-1 block text-sm font-semibold">Status</label>
                    <select v-model="form.status" class="form-select">
                        <option v-for="s in ACTIVITY_STATUSES" :key="s" :value="s">{{ ACTIVITY_STATUS_LABEL[s] }}</option>
                    </select>
                </div>

                <div>
                    <label class="mb-1 block text-sm font-semibold">Result</label>
                    <select v-model="form.result" class="form-select">
                        <option :value="null">— None —</option>
                        <option v-for="r in ACTIVITY_RESULTS" :key="r" :value="r">{{ ACTIVITY_RESULT_LABEL[r] }}</option>
                    </select>
                </div>

                <div>
                    <label class="mb-1 block text-sm font-semibold">Next action date</label>
                    <input v-model="form.next_action_date" type="datetime-local" class="form-input" />
                </div>

                <div class="md:col-span-2">
                    <label class="mb-1 block text-sm font-semibold">Next action</label>
                    <textarea v-model="form.next_action" rows="2" class="form-textarea"></textarea>
                </div>

                <div class="md:col-span-2 mt-2 flex justify-end gap-3">
                    <NuxtLink to="/gec/activities" class="btn btn-outline-secondary">Cancel</NuxtLink>
                    <button type="submit" class="btn btn-primary" :disabled="isSaving">
                        <span v-if="isSaving" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                        Save changes
                    </button>
                </div>

                <div class="md:col-span-2 mt-2 border-t border-[#e0e6ed] pt-3 text-xs text-white-dark dark:border-[#1b2e4b]">
                    Created {{ formatDate(metadata.created_at) }}
                </div>
            </form>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, onMounted } from 'vue';
import useVuelidate from '@vuelidate/core';
import { required, maxLength } from '@vuelidate/validators';
import {
    useActivity,
    ACTIVITY_TYPES,
    ACTIVITY_STATUSES,
    ACTIVITY_RESULTS,
    ACTIVITY_TYPE_LABEL,
    ACTIVITY_STATUS_LABEL,
    ACTIVITY_RESULT_LABEL,
    type ActivityType,
    type ActivityStatus,
    type ActivityResult,
} from '@/composables/useActivity';
import { useContact, type Contact } from '@/composables/useContact';
import { useAuthStore } from '@/stores/auth';

useHead({ title: 'Edit Activity - IFS Finance' });
definePageMeta({ layout: 'default' });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { getActivity, updateActivity } = useActivity();
const { getContact } = useContact();

const isLoading = ref(true);
const loadingError = ref('');
const isSaving = ref(false);
const errorMessage = ref('');

const originalStatus = ref<ActivityStatus | null>(null);
const contact = ref<Contact | null>(null);

const toLocalInput = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const form = reactive({
    contact_id: 0 as number,
    activity_type: 'call' as ActivityType,
    subject: '',
    description: '',
    activity_date: '',
    status: 'pending' as ActivityStatus,
    result: null as ActivityResult | null,
    next_action: '',
    next_action_date: '',
});

const metadata = reactive({ created_at: '' });

const rules = {
    activity_date: { required },
    description: { maxLength: maxLength(2000) },
};
const v$ = useVuelidate(rules, form);

const contactLabel = computed(() => {
    if (!contact.value) return `#${form.contact_id}`;
    const company = contact.value.company_name ? ` — ${contact.value.company_name}` : '';
    return `${contact.value.name}${company}`;
});

const willBumpLastContacted = computed(
    () => originalStatus.value !== 'done' && form.status === 'done'
);

const load = async () => {
    isLoading.value = true;
    loadingError.value = '';
    try {
        const a = await getActivity(route.params.id as string);
        form.contact_id = a.contact_id;
        form.activity_type = a.activity_type;
        form.subject = a.subject ?? '';
        form.description = a.description ?? '';
        form.activity_date = toLocalInput(a.activity_date);
        form.status = a.status;
        form.result = a.result;
        form.next_action = a.next_action ?? '';
        form.next_action_date = toLocalInput(a.next_action_date);
        metadata.created_at = a.created_at;
        originalStatus.value = a.status;

        // Best-effort lookup for the contact name shown above the form.
        try {
            contact.value = await getContact(a.contact_id);
        } catch {
            contact.value = null;
        }
    } catch (err: any) {
        if (err?.status === 401) {
            authStore.clearAuth();
            router.push('/auth/cover-login');
            return;
        }
        loadingError.value = err?.status === 404
            ? 'Activity not found or you do not have permission to view it.'
            : err?.message || 'Failed to load activity';
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
        await updateActivity(route.params.id as string, {
            activity_type: form.activity_type,
            subject: form.subject || null,
            description: form.description || null,
            activity_date: new Date(form.activity_date).toISOString(),
            status: form.status,
            result: form.result,
            next_action: form.next_action || null,
            next_action_date: form.next_action_date ? new Date(form.next_action_date).toISOString() : null,
        });
        router.push('/gec/activities');
    } catch (err: any) {
        if (err?.status === 401) {
            authStore.clearAuth();
            router.push('/auth/cover-login');
            return;
        }
        errorMessage.value = err?.message || 'Failed to save activity';
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
