<template>
    <div>
        <!-- Page Header -->
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-dark dark:text-white">Activities</h2>
                <p class="mt-1 text-sm text-white-dark">Calls, meetings, follow-ups, notes</p>
            </div>
            <NuxtLink to="/gec/activities/new" class="btn btn-primary gap-1">
                <icon-plus class="h-4 w-4" />
                New Activity
            </NuxtLink>
        </div>

        <!-- Filter Bar -->
        <div class="panel mb-4">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-6">
                <div class="md:col-span-2">
                    <label class="mb-1 block text-xs font-semibold text-white-dark">Contact</label>
                    <select v-model="filterContactId" class="form-select">
                        <option :value="null">All contacts</option>
                        <option v-for="c in contactOptions" :key="c.id" :value="c.id">
                            {{ c.name }}<span v-if="c.company_name"> — {{ c.company_name }}</span>
                        </option>
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-white-dark">Type</label>
                    <select v-model="filterType" class="form-select">
                        <option value="all">All types</option>
                        <option v-for="t in ACTIVITY_TYPES" :key="t" :value="t">{{ ACTIVITY_TYPE_LABEL[t] }}</option>
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-white-dark">Status</label>
                    <select v-model="filterStatus" class="form-select">
                        <option value="all">All statuses</option>
                        <option v-for="s in ACTIVITY_STATUSES" :key="s" :value="s">{{ ACTIVITY_STATUS_LABEL[s] }}</option>
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-white-dark">From</label>
                    <input v-model="filterDateFrom" type="date" class="form-input" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-white-dark">To</label>
                    <input v-model="filterDateTo" type="date" class="form-input" />
                </div>
            </div>
            <div class="mt-3 flex items-center gap-4">
                <label class="inline-flex items-center gap-2 text-sm">
                    <input v-model="filterDue" type="checkbox" class="form-checkbox" />
                    Due only (pending with next-action date ≤ today)
                </label>
                <button @click="fetchActivities" class="btn btn-outline-primary btn-sm gap-1 ml-auto">Refresh</button>
            </div>
        </div>

        <!-- Table -->
        <div class="panel">
            <div v-if="isLoading" class="flex items-center justify-center py-20">
                <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
                <span class="ml-3 text-white-dark">Loading…</span>
            </div>

            <div v-else-if="errorMessage" class="panel border border-danger/40 bg-danger/10 py-10 text-center text-danger">
                {{ errorMessage }}
            </div>

            <div v-else-if="activities.length === 0" class="py-16 text-center">
                <p class="text-white-dark">No activities match the current filters.</p>
                <NuxtLink to="/gec/activities/new" class="btn btn-primary btn-sm mt-4 gap-1">
                    <icon-plus class="h-4 w-4" />
                    Log an activity
                </NuxtLink>
            </div>

            <div v-else class="table-responsive">
                <table class="table-hover table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Subject</th>
                            <th>Contact</th>
                            <th class="text-center">Status</th>
                            <th>Result</th>
                            <th>Next action</th>
                            <th class="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="a in activities" :key="a.id">
                            <td class="text-sm text-white-dark">{{ formatDate(a.activity_date) }}</td>
                            <td><span :class="ACTIVITY_TYPE_BADGE[a.activity_type]">{{ ACTIVITY_TYPE_LABEL[a.activity_type] }}</span></td>
                            <td class="font-semibold">{{ a.subject || '-' }}</td>
                            <td class="text-sm">{{ contactName(a.contact_id) }}</td>
                            <td class="text-center"><span :class="ACTIVITY_STATUS_BADGE[a.status]">{{ ACTIVITY_STATUS_LABEL[a.status] }}</span></td>
                            <td class="text-sm">{{ a.result ? ACTIVITY_RESULT_LABEL[a.result] : '-' }}</td>
                            <td class="text-sm">
                                <div v-if="a.next_action || a.next_action_date">
                                    <div v-if="a.next_action" class="truncate max-w-[200px]">{{ a.next_action }}</div>
                                    <div v-if="a.next_action_date" class="text-xs text-white-dark">{{ formatDate(a.next_action_date) }}</div>
                                </div>
                                <span v-else>-</span>
                            </td>
                            <td class="text-center">
                                <div class="flex items-center justify-center gap-2">
                                    <NuxtLink :to="`/gec/activities/${a.id}`" class="btn btn-outline-primary btn-sm gap-1 px-3">
                                        <icon-edit class="h-4 w-4" />
                                        Edit
                                    </NuxtLink>
                                    <button
                                        v-if="a.status === 'pending'"
                                        @click="openDeleteModal(a)"
                                        class="btn btn-outline-danger btn-sm gap-1 px-3"
                                        :disabled="actionLoading === a.id"
                                    >
                                        <icon-trash-lines class="h-4 w-4" />
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between border-t border-[#e0e6ed] pt-4 dark:border-[#1b2e4b]">
                    <span class="text-sm text-white-dark">Total {{ totalItems }} activities</span>
                    <div class="flex items-center gap-1">
                        <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1" class="btn btn-outline-primary btn-sm px-3">&lt;</button>
                        <span class="px-3 text-sm">{{ currentPage }} / {{ totalPages }}</span>
                        <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= totalPages" class="btn btn-outline-primary btn-sm px-3">&gt;</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation -->
        <TransitionRoot appear :show="isDeleteModalOpen" as="template">
            <Dialog as="div" @close="closeDeleteModal" class="relative z-50">
                <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                    leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-black/60" />
                </TransitionChild>
                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                            enter-to="opacity-100 scale-100" leave="duration-200 ease-in" leave-from="opacity-100 scale-100"
                            leave-to="opacity-0 scale-95">
                            <DialogPanel class="w-full max-w-md rounded-xl bg-white p-6 dark:bg-[#1b2e4b]">
                                <div class="mb-4 flex items-center gap-3">
                                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-danger/20 text-danger">
                                        <icon-trash-lines class="h-5 w-5" />
                                    </div>
                                    <DialogTitle class="text-lg font-bold dark:text-white">Delete activity</DialogTitle>
                                </div>
                                <p class="mb-2 text-sm text-white-dark">
                                    Activity: <span class="font-semibold text-dark dark:text-white">{{ targetActivity?.subject || '#' + targetActivity?.id }}</span>
                                </p>
                                <p class="mb-4 text-sm text-white-dark">This action cannot be undone.</p>
                                <div class="flex justify-end gap-3">
                                    <button @click="closeDeleteModal" class="btn btn-outline-secondary">Cancel</button>
                                    <button @click="confirmDelete" class="btn btn-danger" :disabled="!!actionLoading">
                                        <span v-if="actionLoading" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                        Delete
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import {
    useActivity,
    ACTIVITY_TYPES,
    ACTIVITY_STATUSES,
    ACTIVITY_TYPE_LABEL,
    ACTIVITY_STATUS_LABEL,
    ACTIVITY_RESULT_LABEL,
    ACTIVITY_TYPE_BADGE,
    ACTIVITY_STATUS_BADGE,
    type Activity,
    type ActivityType,
    type ActivityStatus,
} from '@/composables/useActivity';
import { useContact, type Contact } from '@/composables/useContact';
import { useAuthStore } from '@/stores/auth';

useHead({ title: 'Activities - NEX Finance' });
definePageMeta({ layout: 'default' });

const authStore = useAuthStore();
const router = useRouter();
const { listActivities, deleteActivity } = useActivity();
const { listContacts } = useContact();

const activities = ref<Activity[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const actionLoading = ref<number | null>(null);

const contactOptions = ref<Contact[]>([]);
const contactsById = computed(() => {
    const m = new Map<number, Contact>();
    for (const c of contactOptions.value) m.set(c.id, c);
    return m;
});

const filterContactId = ref<number | null>(null);
const filterType = ref<'all' | ActivityType>('all');
const filterStatus = ref<'all' | ActivityStatus>('all');
const filterDateFrom = ref('');
const filterDateTo = ref('');
const filterDue = ref(false);

const currentPage = ref(1);
const pageSize = 25;
const totalItems = ref(0);
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)));

const isDeleteModalOpen = ref(false);
const targetActivity = ref<Activity | null>(null);

const loadContacts = async () => {
    try {
        const res = await listContacts({ limit: 200 });
        contactOptions.value = res.data;
    } catch (err) {
        // Non-fatal — the table will just show contact_id instead of names.
    }
};

const fetchActivities = async () => {
    isLoading.value = true;
    errorMessage.value = '';
    try {
        const res = await listActivities({
            limit: pageSize,
            offset: (currentPage.value - 1) * pageSize,
            contact_id: filterContactId.value ?? undefined,
            activity_type: filterType.value === 'all' ? undefined : filterType.value,
            status: filterStatus.value === 'all' ? undefined : filterStatus.value,
            date_from: filterDateFrom.value || undefined,
            date_to: filterDateTo.value || undefined,
            due: filterDue.value || undefined,
        });
        activities.value = res.data;
        totalItems.value = res.total;
    } catch (err: any) {
        if (err?.status === 401) {
            authStore.clearAuth();
            router.push('/auth/cover-login');
            return;
        }
        errorMessage.value = err?.message || 'Failed to load activities';
    } finally {
        isLoading.value = false;
    }
};

const goToPage = (page: number) => {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    fetchActivities();
};

watch([filterContactId, filterType, filterStatus, filterDateFrom, filterDateTo, filterDue], () => {
    currentPage.value = 1;
    fetchActivities();
});

const openDeleteModal = (a: Activity) => {
    if (a.status !== 'pending') return; // defensive
    targetActivity.value = a;
    isDeleteModalOpen.value = true;
};
const closeDeleteModal = () => {
    isDeleteModalOpen.value = false;
    targetActivity.value = null;
};

const confirmDelete = async () => {
    if (!targetActivity.value) return;
    if (targetActivity.value.status !== 'pending') {
        errorMessage.value = 'Delete is only allowed when status is "pending"';
        closeDeleteModal();
        return;
    }
    actionLoading.value = targetActivity.value.id;
    try {
        await deleteActivity(targetActivity.value.id);
        closeDeleteModal();
        await fetchActivities();
    } catch (err: any) {
        errorMessage.value = err?.message || 'Failed to delete activity';
    } finally {
        actionLoading.value = null;
    }
};

const contactName = (id: number) => {
    const c = contactsById.value.get(id);
    return c ? c.name : `#${id}`;
};

const formatDate = (value: string | null) => {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return value;
    }
};

onMounted(async () => {
    await loadContacts();
    fetchActivities();
});
</script>
