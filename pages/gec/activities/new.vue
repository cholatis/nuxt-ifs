<template>
    <div>
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-dark dark:text-white">New Activity</h2>
                <p class="mt-1 text-sm text-white-dark">Log a call, meeting, follow-up, or note</p>
            </div>
            <NuxtLink to="/gec/activities" class="btn btn-outline-secondary gap-1">
                <icon-arrow-left class="h-4 w-4" />
                Back to list
            </NuxtLink>
        </div>

        <div class="panel">
            <div v-if="errorMessage" class="mb-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                {{ errorMessage }}
            </div>

            <form @submit.prevent="onSubmit" class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label class="mb-1 block text-sm font-semibold">Contact <span class="text-danger">*</span></label>
                    <select v-model="form.contact_id" class="form-select" :class="{ 'border-danger': v$.contact_id.$error }">
                        <option :value="null">— Select a contact —</option>
                        <option v-for="c in contactOptions" :key="c.id" :value="c.id">
                            {{ c.name }}<span v-if="c.company_name"> — {{ c.company_name }}</span>
                        </option>
                    </select>
                    <p v-if="v$.contact_id.$error" class="mt-1 text-xs text-danger">Contact is required.</p>
                </div>

                <div>
                    <label class="mb-1 block text-sm font-semibold">Type <span class="text-danger">*</span></label>
                    <select v-model="form.activity_type" class="form-select" :class="{ 'border-danger': v$.activity_type.$error }">
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
                        Save
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue';
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

useHead({ title: 'New Activity - IFS Finance' });
definePageMeta({ layout: 'default' });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { createActivity } = useActivity();
const { listContacts } = useContact();

const contactOptions = ref<Contact[]>([]);

const localNow = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const form = reactive({
    contact_id: null as number | null,
    activity_type: 'call' as ActivityType,
    subject: '',
    description: '',
    activity_date: localNow(),
    status: 'pending' as ActivityStatus,
    result: null as ActivityResult | null,
    next_action: '',
    next_action_date: '',
});

const rules = {
    contact_id: { required },
    activity_type: { required },
    activity_date: { required },
    description: { maxLength: maxLength(2000) },
};
const v$ = useVuelidate(rules, form);

const isSaving = ref(false);
const errorMessage = ref('');

const loadContacts = async () => {
    try {
        const res = await listContacts({ limit: 200 });
        contactOptions.value = res.data;
        // Preselect contact from ?contact_id query param if provided
        const qContactId = route.query.contact_id;
        if (qContactId && !form.contact_id) {
            const id = Number(qContactId);
            if (!Number.isNaN(id)) form.contact_id = id;
        }
    } catch {
        // Non-fatal
    }
};

const onSubmit = async () => {
    errorMessage.value = '';
    const ok = await v$.value.$validate();
    if (!ok) return;

    isSaving.value = true;
    try {
        await createActivity({
            contact_id: form.contact_id as number,
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
        errorMessage.value = err?.message || 'Failed to create activity';
    } finally {
        isSaving.value = false;
    }
};

onMounted(loadContacts);
</script>
