<template>
    <TransitionRoot appear :show="open" as="template">
        <Dialog as="div" @close="requestClose" class="relative z-50">
            <!-- Backdrop -->
            <TransitionChild as="template"
                enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                <div class="fixed inset-0 bg-black/60" />
            </TransitionChild>

            <!-- Sliding panel from right -->
            <div class="fixed inset-0 overflow-hidden">
                <div class="absolute inset-0 overflow-hidden">
                    <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
                        <TransitionChild as="template"
                            enter="transform transition ease-in-out duration-300"
                            enter-from="translate-x-full" enter-to="translate-x-0"
                            leave="transform transition ease-in-out duration-200"
                            leave-from="translate-x-0" leave-to="translate-x-full">
                            <DialogPanel class="pointer-events-auto w-screen max-w-2xl">
                                <div class="flex h-full flex-col bg-white shadow-xl dark:bg-[#0e1726]">
                                    <!-- Header -->
                                    <div class="border-b border-[#e0e6ed] px-6 py-4 dark:border-[#1b2e4b]">
                                        <div class="flex items-start justify-between">
                                            <div>
                                                <DialogTitle class="text-lg font-bold text-dark dark:text-white">
                                                    Activities — {{ contact?.name }}
                                                </DialogTitle>
                                                <p v-if="contact?.company_name" class="text-sm text-white-dark">{{ contact.company_name }}</p>
                                            </div>
                                            <button @click="requestClose" class="text-white-dark transition hover:text-danger" aria-label="Close">
                                                <icon-x-circle class="h-6 w-6" />
                                            </button>
                                        </div>
                                        <div class="mt-3 flex items-center gap-3">
                                            <button v-if="!formMode" @click="openCreate" class="btn btn-primary btn-sm gap-1">
                                                <icon-plus class="h-4 w-4" />
                                                New activity
                                            </button>
                                            <span v-if="activities.length" class="text-sm text-white-dark">
                                                {{ activities.length }} {{ activities.length === 1 ? 'activity' : 'activities' }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Form section (create / edit) -->
                                    <div v-if="formMode" class="border-b border-[#e0e6ed] bg-[#fafafa] px-6 py-4 dark:border-[#1b2e4b] dark:bg-[#1b2e4b]/30">
                                        <div class="mb-3 flex items-center justify-between">
                                            <h3 class="font-semibold dark:text-white">
                                                {{ formMode === 'create' ? 'New activity' : `Edit #${editingId}` }}
                                            </h3>
                                            <button @click="closeForm" class="text-xs text-white-dark hover:text-danger">Cancel</button>
                                        </div>
                                        <div v-if="formError" class="mb-3 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                                            {{ formError }}
                                        </div>
                                        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div>
                                                <label class="mb-1 block text-xs font-semibold text-white-dark">Type <span class="text-danger">*</span></label>
                                                <select v-model="form.activity_type" class="form-select">
                                                    <option v-for="t in ACTIVITY_TYPES" :key="t" :value="t">{{ ACTIVITY_TYPE_LABEL[t] }}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label class="mb-1 block text-xs font-semibold text-white-dark">Date <span class="text-danger">*</span></label>
                                                <input v-model="form.activity_date" type="datetime-local" class="form-input" />
                                            </div>
                                            <div class="md:col-span-2">
                                                <label class="mb-1 block text-xs font-semibold text-white-dark">Subject</label>
                                                <input v-model.trim="form.subject" type="text" class="form-input" maxlength="255" />
                                            </div>
                                            <div class="md:col-span-2">
                                                <label class="mb-1 block text-xs font-semibold text-white-dark">Description</label>
                                                <textarea v-model="form.description" rows="2" class="form-textarea" maxlength="2000"></textarea>
                                            </div>
                                            <div>
                                                <label class="mb-1 block text-xs font-semibold text-white-dark">Status</label>
                                                <select v-model="form.status" class="form-select">
                                                    <option v-for="s in ACTIVITY_STATUSES" :key="s" :value="s">{{ ACTIVITY_STATUS_LABEL[s] }}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label class="mb-1 block text-xs font-semibold text-white-dark">Result</label>
                                                <select v-model="form.result" class="form-select">
                                                    <option :value="null">— None —</option>
                                                    <option v-for="r in ACTIVITY_RESULTS" :key="r" :value="r">{{ ACTIVITY_RESULT_LABEL[r] }}</option>
                                                </select>
                                            </div>
                                            <div class="md:col-span-2 mt-1 flex justify-end gap-2">
                                                <button @click="closeForm" class="btn btn-outline-secondary btn-sm">Cancel</button>
                                                <button @click="saveForm" class="btn btn-primary btn-sm" :disabled="isSaving">
                                                    <span v-if="isSaving" class="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                                    {{ formMode === 'create' ? 'Create' : 'Save' }}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- List section -->
                                    <div class="flex-1 overflow-y-auto px-6 py-4">
                                        <div v-if="isLoading" class="flex items-center justify-center py-10">
                                            <span class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
                                            <span class="ml-3 text-sm text-white-dark">Loading…</span>
                                        </div>

                                        <div v-else-if="listError" class="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                                            {{ listError }}
                                        </div>

                                        <div v-else-if="activities.length === 0" class="py-10 text-center text-sm text-white-dark">
                                            No activities yet for this contact.
                                        </div>

                                        <ul v-else class="space-y-3">
                                            <li v-for="a in activities" :key="a.id"
                                                class="rounded-lg border border-[#e0e6ed] bg-white p-3 dark:border-[#1b2e4b] dark:bg-[#0e1726]/40">
                                                <div class="flex items-start justify-between gap-3">
                                                    <div class="flex-1 min-w-0">
                                                        <div class="flex flex-wrap items-center gap-2">
                                                            <span :class="ACTIVITY_TYPE_BADGE[a.activity_type]">{{ ACTIVITY_TYPE_LABEL[a.activity_type] }}</span>
                                                            <span :class="ACTIVITY_STATUS_BADGE[a.status]">{{ ACTIVITY_STATUS_LABEL[a.status] }}</span>
                                                            <span v-if="a.result" class="text-xs text-white-dark">{{ ACTIVITY_RESULT_LABEL[a.result] }}</span>
                                                        </div>
                                                        <p class="mt-1 font-semibold text-dark dark:text-white truncate">{{ a.subject || '(no subject)' }}</p>
                                                        <p v-if="a.description" class="mt-1 text-sm text-white-dark whitespace-pre-wrap">{{ a.description }}</p>
                                                        <p class="mt-1 text-xs text-white-dark">{{ formatDate(a.activity_date) }}</p>
                                                        <p v-if="a.next_action" class="mt-1 text-xs">
                                                            <span class="font-semibold text-warning">Next: </span>
                                                            <span class="text-white-dark">{{ a.next_action }}</span>
                                                            <span v-if="a.next_action_date" class="ml-1 text-white-dark">({{ formatDate(a.next_action_date) }})</span>
                                                        </p>
                                                    </div>
                                                    <div class="flex shrink-0 flex-col gap-1">
                                                        <button @click="openEdit(a)"
                                                                class="btn btn-outline-primary btn-sm gap-1 px-2"
                                                                :disabled="rowAction === a.id">
                                                            <icon-edit class="h-3 w-3" />
                                                            Edit
                                                        </button>
                                                        <button v-if="a.status === 'pending'"
                                                                @click="markDone(a)"
                                                                class="btn btn-outline-success btn-sm gap-1 px-2"
                                                                :disabled="rowAction === a.id">
                                                            <icon-circle-check class="h-3 w-3" />
                                                            Done
                                                        </button>
                                                        <button v-if="a.status === 'pending'"
                                                                @click="confirmDelete(a)"
                                                                class="btn btn-outline-danger btn-sm gap-1 px-2"
                                                                :disabled="rowAction === a.id">
                                                            <icon-trash-lines class="h-3 w-3" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>

                                    <!-- Footer info -->
                                    <div class="border-t border-[#e0e6ed] bg-[#fafafa] px-6 py-3 text-xs text-white-dark dark:border-[#1b2e4b] dark:bg-[#1b2e4b]/30">
                                        Delete is available only on <code class="px-1 rounded bg-warning/10 text-warning">pending</code> activities.
                                        Marking <code class="px-1 rounded bg-success/10 text-success">Done</code> bumps the contact's last-contacted date.
                                    </div>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import {
    useActivity,
    ACTIVITY_TYPES,
    ACTIVITY_STATUSES,
    ACTIVITY_RESULTS,
    ACTIVITY_TYPE_LABEL,
    ACTIVITY_STATUS_LABEL,
    ACTIVITY_RESULT_LABEL,
    ACTIVITY_TYPE_BADGE,
    ACTIVITY_STATUS_BADGE,
    type Activity,
    type ActivityType,
    type ActivityStatus,
    type ActivityResult,
} from '@/composables/useActivity';
import type { Contact } from '@/composables/useContact';

const props = defineProps<{
    open: boolean;
    contact: Contact | null;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'updated'): void;
}>();

const { listActivities, createActivity, updateActivity, deleteActivity } = useActivity();

const activities = ref<Activity[]>([]);
const isLoading = ref(false);
const listError = ref('');
const rowAction = ref<number | null>(null);

// form state
type FormMode = null | 'create' | 'edit';
const formMode = ref<FormMode>(null);
const editingId = ref<number | null>(null);
const isSaving = ref(false);
const formError = ref('');

const localNow = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toLocalInput = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const blankForm = () => ({
    activity_type: 'call' as ActivityType,
    subject: '',
    description: '',
    activity_date: localNow(),
    status: 'pending' as ActivityStatus,
    result: null as ActivityResult | null,
});

const form = reactive(blankForm());

// Reset form helpers
const resetForm = () => {
    Object.assign(form, blankForm());
    formError.value = '';
    editingId.value = null;
};

// Fetch when drawer opens / contact changes
watch(() => [props.open, props.contact?.id], async ([isOpen, _]) => {
    if (isOpen && props.contact) {
        resetForm();
        formMode.value = null;
        await fetchActivities();
    } else if (!isOpen) {
        // Cleanup on close
        activities.value = [];
        listError.value = '';
        resetForm();
        formMode.value = null;
    }
});

const fetchActivities = async () => {
    if (!props.contact) return;
    isLoading.value = true;
    listError.value = '';
    try {
        const res = await listActivities({ contact_id: props.contact.id, limit: 200 });
        activities.value = res.data;
    } catch (err: any) {
        listError.value = err?.message || 'Failed to load activities';
    } finally {
        isLoading.value = false;
    }
};

const openCreate = () => {
    resetForm();
    formMode.value = 'create';
};

const openEdit = (a: Activity) => {
    resetForm();
    editingId.value = a.id;
    form.activity_type = a.activity_type;
    form.subject = a.subject ?? '';
    form.description = a.description ?? '';
    form.activity_date = toLocalInput(a.activity_date) || localNow();
    form.status = a.status;
    form.result = a.result;
    formMode.value = 'edit';
};

const closeForm = () => {
    formMode.value = null;
    resetForm();
};

const saveForm = async () => {
    if (!props.contact) return;
    formError.value = '';
    if (!form.activity_type) { formError.value = 'Type is required.'; return; }
    if (!form.activity_date) { formError.value = 'Date is required.'; return; }

    isSaving.value = true;
    try {
        const payload = {
            activity_type: form.activity_type,
            subject: form.subject || null,
            description: form.description || null,
            activity_date: new Date(form.activity_date).toISOString(),
            status: form.status,
            result: form.result,
        };
        if (formMode.value === 'create') {
            await createActivity({ contact_id: props.contact.id, ...payload });
        } else if (formMode.value === 'edit' && editingId.value != null) {
            await updateActivity(editingId.value, payload);
        }
        formMode.value = null;
        resetForm();
        await fetchActivities();
        emit('updated');
    } catch (err: any) {
        formError.value = err?.message || 'Failed to save activity';
    } finally {
        isSaving.value = false;
    }
};

const markDone = async (a: Activity) => {
    if (a.status !== 'pending') return;
    rowAction.value = a.id;
    try {
        await updateActivity(a.id, { status: 'done' });
        await fetchActivities();
        emit('updated');
    } catch (err: any) {
        listError.value = err?.message || 'Failed to mark done';
    } finally {
        rowAction.value = null;
    }
};

const confirmDelete = async (a: Activity) => {
    if (a.status !== 'pending') return;
    if (!confirm(`Delete this activity?\n\n${a.subject || a.activity_type} — ${formatDate(a.activity_date)}\n\nThis action cannot be undone.`)) return;
    rowAction.value = a.id;
    try {
        await deleteActivity(a.id);
        await fetchActivities();
        emit('updated');
    } catch (err: any) {
        listError.value = err?.message || 'Failed to delete activity';
    } finally {
        rowAction.value = null;
    }
};

const requestClose = () => {
    if (isSaving.value) return; // don't close mid-save
    emit('close');
};

const formatDate = (value: string | null) => {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return value;
    }
};
</script>
