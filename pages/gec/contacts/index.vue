<template>
    <div>
        <!-- Page Header -->
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-dark dark:text-white">Contacts</h2>
                <p class="mt-1 text-sm text-white-dark">CRM contacts owned by you (GEC sees all)</p>
            </div>
            <NuxtLink to="/gec/contacts/new" class="btn btn-primary gap-1">
                <icon-plus class="h-4 w-4" />
                New Contact
            </NuxtLink>
        </div>

        <!-- Filter Bar -->
        <div class="panel mb-4">
            <div class="flex flex-wrap items-center gap-3">
                <div class="relative min-w-[240px] flex-1">
                    <input
                        v-model="searchText"
                        type="text"
                        class="form-input ps-9"
                        placeholder="Search name, company, email…"
                    />
                    <span class="absolute start-3 top-1/2 -translate-y-1/2 text-white-dark">
                        <icon-search class="h-4 w-4" />
                    </span>
                </div>
                <select v-model="filterStatus" class="form-select w-44">
                    <option value="all">All statuses</option>
                    <option v-for="s in CONTACT_STATUSES" :key="s" :value="s">{{ CONTACT_STATUS_LABEL[s] }}</option>
                </select>
                <button @click="fetchContacts" class="btn btn-outline-primary btn-sm gap-1 ml-auto">
                    Refresh
                </button>
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

            <div v-else-if="contacts.length === 0" class="py-16 text-center">
                <p class="text-white-dark">No contacts yet.</p>
                <NuxtLink to="/gec/contacts/new" class="btn btn-primary btn-sm mt-4 gap-1">
                    <icon-plus class="h-4 w-4" />
                    Create your first contact
                </NuxtLink>
            </div>

            <div v-else class="table-responsive">
                <table class="table-hover table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Company</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th class="text-center">Status</th>
                            <th>Last contacted</th>
                            <th class="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="c in contacts" :key="c.id">
                            <td class="font-semibold text-primary">{{ c.name }}</td>
                            <td>{{ c.company_name || '-' }}</td>
                            <td class="text-sm">{{ c.email || '-' }}</td>
                            <td class="text-sm">{{ c.phone || '-' }}</td>
                            <td class="text-center">
                                <span :class="CONTACT_STATUS_BADGE[c.status]">{{ CONTACT_STATUS_LABEL[c.status] }}</span>
                            </td>
                            <td class="text-sm text-white-dark">{{ formatDate(c.last_contacted_at) }}</td>
                            <td class="text-center">
                                <div class="flex items-center justify-center gap-2">
                                    <NuxtLink :to="`/gec/contacts/${c.id}`" class="btn btn-outline-primary btn-sm gap-1 px-3">
                                        <icon-edit class="h-4 w-4" />
                                        Edit
                                    </NuxtLink>
                                    <button
                                        @click="openActivitiesDrawer(c)"
                                        class="btn btn-outline-success btn-sm gap-1 px-3"
                                        :title="`Manage activities for ${c.name}`"
                                    >
                                        <icon-notes class="h-4 w-4" />
                                        Activities
                                    </button>
                                    <button
                                        v-if="c.status === 'lead'"
                                        @click="openDeleteModal(c)"
                                        class="btn btn-outline-danger btn-sm gap-1 px-3"
                                        :disabled="actionLoading === c.id"
                                    >
                                        <icon-trash-lines class="h-4 w-4" />
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Pagination -->
                <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between border-t border-[#e0e6ed] pt-4 dark:border-[#1b2e4b]">
                    <span class="text-sm text-white-dark">Total {{ totalItems }} contacts</span>
                    <div class="flex items-center gap-1">
                        <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1" class="btn btn-outline-primary btn-sm px-3">&lt;</button>
                        <span class="px-3 text-sm">{{ currentPage }} / {{ totalPages }}</span>
                        <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= totalPages" class="btn btn-outline-primary btn-sm px-3">&gt;</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
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
                                    <DialogTitle class="text-lg font-bold dark:text-white">Delete contact</DialogTitle>
                                </div>
                                <p class="mb-2 text-sm text-white-dark">
                                    Contact: <span class="font-semibold text-dark dark:text-white">{{ targetContact?.name }}</span>
                                </p>
                                <p class="mb-4 text-sm text-white-dark">
                                    This will also remove all activities for this contact. This action cannot be undone.
                                </p>
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

        <!-- Activities Side Drawer -->
        <ContactActivitiesDrawer
            :open="isDrawerOpen"
            :contact="drawerContact"
            @close="closeActivitiesDrawer"
            @updated="fetchContacts"
        />
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import {
    useContact,
    CONTACT_STATUSES,
    CONTACT_STATUS_LABEL,
    CONTACT_STATUS_BADGE,
    type Contact,
    type ContactStatus,
} from '@/composables/useContact';
import { useAuthStore } from '@/stores/auth';

useHead({ title: 'Contacts - IFS Finance' });
definePageMeta({ layout: 'default' });

const authStore = useAuthStore();
const router = useRouter();
const { listContacts, deleteContact } = useContact();

const contacts = ref<Contact[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const actionLoading = ref<number | null>(null);

const searchText = ref('');
const filterStatus = ref<'all' | ContactStatus>('all');

const currentPage = ref(1);
const pageSize = 25;
const totalItems = ref(0);
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)));

const isDeleteModalOpen = ref(false);
const targetContact = ref<Contact | null>(null);

// Activities side drawer
const isDrawerOpen = ref(false);
const drawerContact = ref<Contact | null>(null);
const openActivitiesDrawer = (c: Contact) => {
    drawerContact.value = c;
    isDrawerOpen.value = true;
};
const closeActivitiesDrawer = () => {
    isDrawerOpen.value = false;
    drawerContact.value = null;
};

const fetchContacts = async () => {
    isLoading.value = true;
    errorMessage.value = '';
    try {
        const res = await listContacts({
            limit: pageSize,
            offset: (currentPage.value - 1) * pageSize,
            status: filterStatus.value === 'all' ? undefined : filterStatus.value,
            q: searchText.value.trim() || undefined,
        });
        contacts.value = res.data;
        totalItems.value = res.total;
    } catch (err: any) {
        if (err?.status === 401) {
            authStore.clearAuth();
            router.push('/auth/cover-login');
            return;
        }
        errorMessage.value = err?.message || 'Failed to load contacts';
    } finally {
        isLoading.value = false;
    }
};

const goToPage = (page: number) => {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    fetchContacts();
};

// Debounce search
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchText, () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        currentPage.value = 1;
        fetchContacts();
    }, 400);
});
watch(filterStatus, () => {
    currentPage.value = 1;
    fetchContacts();
});

const openDeleteModal = (c: Contact) => {
    if (c.status !== 'lead') return; // defensive — button shouldn't render in this case
    targetContact.value = c;
    isDeleteModalOpen.value = true;
};
const closeDeleteModal = () => {
    isDeleteModalOpen.value = false;
    targetContact.value = null;
};

const confirmDelete = async () => {
    if (!targetContact.value) return;
    if (targetContact.value.status !== 'lead') {
        errorMessage.value = 'Delete is only allowed when status is "lead"';
        closeDeleteModal();
        return;
    }
    actionLoading.value = targetContact.value.id;
    try {
        await deleteContact(targetContact.value.id);
        closeDeleteModal();
        await fetchContacts();
    } catch (err: any) {
        errorMessage.value = err?.message || 'Failed to delete contact';
    } finally {
        actionLoading.value = null;
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

onMounted(() => fetchContacts());
</script>
