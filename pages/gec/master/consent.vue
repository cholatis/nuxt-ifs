<template>
    <div>
        <!-- Header -->
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-dark dark:text-white">จัดการ Consent</h2>
                <p class="mt-1 text-sm text-white-dark">PDPA / NOA — กำหนด consent detail และ version ที่ใช้งาน</p>
            </div>
            <button class="btn btn-primary gap-2" @click="openCreate">
                <icon-plus class="h-4 w-4" />
                เพิ่ม Consent
            </button>
        </div>

        <!-- Filter -->
        <div class="panel mb-4">
            <div class="flex flex-wrap items-center gap-3">
                <select v-model="filterType" class="form-select w-40">
                    <option value="">ทุกประเภท</option>
                    <option value="PDPA">PDPA</option>
                    <option value="NOA">NOA</option>
                </select>
                <select v-model="filterActive" class="form-select w-40">
                    <option value="">ทุกสถานะ</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
                <button class="btn btn-outline-primary btn-sm" @click="fetchConsents">
                    <icon-refresh class="h-4 w-4" />
                </button>
            </div>
        </div>

        <!-- Table -->
        <div class="panel">
            <div v-if="isLoading" class="flex items-center justify-center py-20">
                <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
                <span class="ml-3 text-white-dark">กำลังโหลด...</span>
            </div>

            <div v-else-if="consents.length === 0" class="py-20 text-center text-white-dark">
                ไม่พบรายการ Consent
            </div>

            <div v-else class="table-responsive">
                <table class="table-hover table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>ประเภท</th>
                            <th>Version</th>
                            <th class="text-center">สถานะ</th>
                            <th>วันที่สร้าง</th>
                            <th>แก้ไขล่าสุด</th>
                            <th class="text-center">การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, idx) in filteredConsents" :key="item.id">
                            <td class="text-white-dark">{{ idx + 1 }}</td>
                            <td>
                                <span :class="item.consent_type === 'PDPA' ? 'badge bg-primary/10 text-primary' : 'badge bg-warning/10 text-warning'"
                                      class="rounded-full px-2.5 py-1 text-xs font-semibold">
                                    {{ item.consent_type }}
                                </span>
                            </td>
                            <td class="font-mono font-semibold">v{{ item.consent_version }}</td>
                            <td class="text-center">
                                <button
                                    class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                                    :class="item.is_active ? 'bg-success' : 'bg-gray-300 dark:bg-gray-600'"
                                    :disabled="togglingId === item.id"
                                    @click="toggleActive(item)"
                                    :title="item.is_active ? 'Active — คลิกเพื่อ Deactivate' : 'Inactive — คลิกเพื่อ Activate'"
                                >
                                    <span
                                        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                                        :class="item.is_active ? 'translate-x-5' : 'translate-x-0'"
                                    ></span>
                                </button>
                            </td>
                            <td class="text-sm text-white-dark">{{ formatDate(item.created_at) }}</td>
                            <td class="text-sm text-white-dark">{{ formatDate(item.updated_at) }}</td>
                            <td class="text-center">
                                <div class="flex items-center justify-center gap-2">
                                    <button class="btn btn-outline-info btn-sm px-2" title="ดูรายละเอียด" @click="openPreview(item)">
                                        <icon-eye class="h-4 w-4" />
                                    </button>
                                    <button class="btn btn-outline-primary btn-sm px-2" title="แก้ไข" @click="openEdit(item)">
                                        <icon-edit class="h-4 w-4" />
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm px-2" title="ลบ" @click="confirmDelete(item)">
                                        <icon-trash-lines class="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ── Create / Edit Modal ──────────────────────────────────── -->
        <transition name="fade">
            <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                <div class="w-full max-w-2xl rounded-xl bg-white shadow-2xl dark:bg-[#1b2e4b]">
                    <!-- Modal Header -->
                    <div class="flex items-center justify-between border-b border-[#ebedf2] px-6 py-4 dark:border-[#191e3a]">
                        <h4 class="text-lg font-semibold dark:text-white">
                            {{ isEditing ? 'แก้ไข Consent' : 'เพิ่ม Consent ใหม่' }}
                        </h4>
                        <button class="text-gray-400 hover:text-gray-600" @click="closeModal">
                            <icon-x class="h-5 w-5" />
                        </button>
                    </div>

                    <!-- Modal Body -->
                    <div class="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
                        <!-- Error -->
                        <div v-if="modalError" class="rounded border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                            {{ modalError }}
                        </div>

                        <!-- Row 1: Type + Version + Active -->
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="mb-1 block text-sm font-medium dark:text-white">
                                    ประเภท <span class="text-danger">*</span>
                                </label>
                                <select v-model="form.consent_type" class="form-select" :disabled="isEditing">
                                    <option value="">-- เลือก --</option>
                                    <option value="PDPA">PDPA</option>
                                    <option value="NOA">NOA</option>
                                </select>
                            </div>
                            <div>
                                <label class="mb-1 block text-sm font-medium dark:text-white">
                                    Version <span class="text-danger">*</span>
                                </label>
                                <input
                                    v-model="form.consent_version"
                                    type="text"
                                    class="form-input"
                                    placeholder="เช่น 1.0, 2.1"
                                />
                            </div>
                            <div class="flex flex-col justify-end pb-1">
                                <label class="mb-2 block text-sm font-medium dark:text-white">Active</label>
                                <div class="flex items-center gap-2">
                                    <button
                                        type="button"
                                        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                                        :class="form.is_active ? 'bg-success' : 'bg-gray-300'"
                                        @click="form.is_active = !form.is_active"
                                    >
                                        <span
                                            class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out"
                                            :class="form.is_active ? 'translate-x-5' : 'translate-x-0'"
                                        ></span>
                                    </button>
                                    <span class="text-sm" :class="form.is_active ? 'text-success font-semibold' : 'text-white-dark'">
                                        {{ form.is_active ? 'Active' : 'Inactive' }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Consent Detail (Quill) -->
                        <div>
                            <label class="mb-1 block text-sm font-medium dark:text-white">
                                รายละเอียด Consent <span class="text-danger">*</span>
                            </label>
                            <client-only>
                                <QuillEditor
                                    :key="quillKey"
                                    v-model:content="form.consent_detail"
                                    content-type="html"
                                    theme="snow"
                                    :toolbar="quillToolbar"
                                    style="min-height: 240px"
                                />
                            </client-only>
                        </div>

                        <!-- Info note when activating -->
                        <p v-if="form.is_active" class="text-xs text-warning">
                            ⚠ การ Activate จะ Deactivate {{ form.consent_type || 'Consent' }} version ที่ active อยู่ก่อนหน้าอัตโนมัติ
                        </p>
                    </div>

                    <!-- Modal Footer -->
                    <div class="flex items-center justify-end gap-3 border-t border-[#ebedf2] px-6 py-4 dark:border-[#191e3a]">
                        <button class="btn btn-outline-danger" @click="closeModal" :disabled="isSaving">ยกเลิก</button>
                        <button
                            class="btn btn-primary gap-2"
                            @click="saveConsent"
                            :disabled="isSaving || !form.consent_type || !form.consent_version || !form.consent_detail?.trim()"
                        >
                            <span v-if="isSaving" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                            {{ isSaving ? 'กำลังบันทึก...' : 'บันทึก' }}
                        </button>
                    </div>
                </div>
            </div>
        </transition>

        <!-- ── Preview Modal ───────────────────────────────────────── -->
        <transition name="fade">
            <div v-if="showPreview && previewItem" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                <div class="w-full max-w-2xl rounded-xl bg-white shadow-2xl dark:bg-[#1b2e4b]">
                    <div class="flex items-center justify-between border-b border-[#ebedf2] px-6 py-4 dark:border-[#191e3a]">
                        <div class="flex items-center gap-3">
                            <span :class="previewItem.consent_type === 'PDPA' ? 'badge bg-primary/10 text-primary' : 'badge bg-warning/10 text-warning'"
                                  class="rounded-full px-3 py-1 text-sm font-semibold">
                                {{ previewItem.consent_type }}
                            </span>
                            <span class="font-mono text-sm text-white-dark">v{{ previewItem.consent_version }}</span>
                            <span :class="previewItem.is_active ? 'text-success' : 'text-danger'" class="text-xs font-semibold">
                                ● {{ previewItem.is_active ? 'Active' : 'Inactive' }}
                            </span>
                        </div>
                        <button class="text-gray-400 hover:text-gray-600" @click="showPreview = false">
                            <icon-x class="h-5 w-5" />
                        </button>
                    </div>
                    <div class="max-h-[65vh] overflow-y-auto px-6 py-5">
                        <div class="prose max-w-none dark:prose-invert" v-html="previewItem.consent_detail"></div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- ── Delete Confirm Modal ────────────────────────────────── -->
        <transition name="fade">
            <div v-if="showDeleteModal && deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                <div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-[#1b2e4b]">
                    <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 mx-auto">
                        <icon-trash-lines class="h-7 w-7 text-danger" />
                    </div>
                    <h4 class="mb-2 text-center text-lg font-semibold dark:text-white">ยืนยันการลบ</h4>
                    <p class="mb-1 text-center text-sm text-white-dark">
                        ลบ <strong>{{ deleteTarget.consent_type }}</strong> v{{ deleteTarget.consent_version }}?
                    </p>
                    <p class="mb-6 text-center text-xs text-danger">ข้อมูลจะถูกลบถาวร ไม่สามารถกู้คืนได้</p>
                    <div class="flex gap-3">
                        <button class="btn btn-outline-primary flex-1" @click="showDeleteModal = false" :disabled="isDeleting">ยกเลิก</button>
                        <button class="btn btn-danger flex-1 gap-2" @click="deleteConsent" :disabled="isDeleting">
                            <span v-if="isDeleting" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                            ลบ
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

useHead({ title: 'จัดการ Consent — NEX Finance' });
definePageMeta({ layout: 'default' });

const CONSENT_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/consent';

// ── State ──────────────────────────────────────────────────────────
const consents       = ref<any[]>([]);
const isLoading      = ref(false);
const filterType     = ref('');
const filterActive   = ref('');

// Modal
const showModal  = ref(false);
const isEditing  = ref(false);
const isSaving   = ref(false);
const modalError = ref('');
const editingId  = ref<string | null>(null);

const form = ref({
    consent_type   : '',
    consent_detail : '',
    consent_version: '1.0',
    is_active      : false,
});

// Preview
const showPreview  = ref(false);
const previewItem  = ref<any>(null);

// Delete
const showDeleteModal = ref(false);
const deleteTarget    = ref<any>(null);
const isDeleting      = ref(false);

// Toggle active
const togglingId = ref<string | null>(null);

// Force Quill remount after data is ready
const quillKey = ref(0);

// Quill toolbar config
const quillToolbar = [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link'],
    ['clean'],
];

// ── Computed ───────────────────────────────────────────────────────
const filteredConsents = computed(() => {
    return consents.value.filter((c) => {
        if (filterType.value   && c.consent_type !== filterType.value)                    return false;
        if (filterActive.value && String(c.is_active) !== filterActive.value)             return false;
        return true;
    });
});

// ── API ────────────────────────────────────────────────────────────
const fetchConsents = async () => {
    isLoading.value = true;
    try {
        const res  = await fetch(`${CONSENT_URL}?limit=100`);
        const json = await res.json();
        consents.value = json.data ?? [];
    } catch (e) {
        console.error('fetch consents error', e);
    } finally {
        isLoading.value = false;
    }
};

const saveConsent = async () => {
    modalError.value = '';
    if (!form.value.consent_type)           { modalError.value = 'กรุณาเลือกประเภท'; return; }
    if (!form.value.consent_version.trim()) { modalError.value = 'กรุณาระบุ Version'; return; }
    if (!form.value.consent_detail.trim())  { modalError.value = 'กรุณากรอกรายละเอียด'; return; }

    isSaving.value = true;
    try {
        const payload: any = {
            consent_type   : form.value.consent_type,
            consent_detail : form.value.consent_detail,
            consent_version: form.value.consent_version,
            is_active      : form.value.is_active,
        };

        let res: Response;
        if (isEditing.value && editingId.value) {
            res = await fetch(CONSENT_URL, {
                method : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({ id: editingId.value, ...payload }),
            });
        } else {
            res = await fetch(CONSENT_URL, {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify(payload),
            });
        }

        const json = await res.json();
        if (!res.ok) { modalError.value = json.error || 'เกิดข้อผิดพลาด'; return; }

        closeModal();
        await fetchConsents();
    } catch (e: any) {
        modalError.value = e.message || 'ไม่สามารถเชื่อมต่อได้';
    } finally {
        isSaving.value = false;
    }
};

const toggleActive = async (item: any) => {
    togglingId.value = item.id;
    try {
        const res  = await fetch(CONSENT_URL, {
            method : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ id: item.id, is_active: !item.is_active }),
        });
        const json = await res.json();
        if (!res.ok) { alert(json.error || 'เกิดข้อผิดพลาด'); return; }
        await fetchConsents();
    } finally {
        togglingId.value = null;
    }
};

const deleteConsent = async () => {
    if (!deleteTarget.value) return;
    isDeleting.value = true;
    try {
        const res  = await fetch(CONSENT_URL, {
            method : 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ id: deleteTarget.value.id, hard: true }),
        });
        const json = await res.json();
        if (!res.ok) { alert(json.error || 'ลบไม่สำเร็จ'); return; }
        showDeleteModal.value = false;
        deleteTarget.value    = null;
        await fetchConsents();
    } finally {
        isDeleting.value = false;
    }
};

// ── Modal helpers ──────────────────────────────────────────────────
const openCreate = async () => {
    isEditing.value   = false;
    editingId.value   = null;
    modalError.value  = '';
    form.value = { consent_type: '', consent_detail: '', consent_version: '1.0', is_active: false };
    showModal.value = true;
    await nextTick();
    quillKey.value++;
};

const openEdit = async (item: any) => {
    isEditing.value        = true;
    editingId.value        = item.id;
    modalError.value       = '';
    form.value = {
        consent_type   : item.consent_type,
        consent_detail : item.consent_detail,
        consent_version: item.consent_version,
        is_active      : item.is_active,
    };
    showModal.value = true;
    await nextTick();
    quillKey.value++;
};

const openPreview = (item: any) => {
    previewItem.value = item;
    showPreview.value = true;
};

const confirmDelete = (item: any) => {
    deleteTarget.value    = item;
    showDeleteModal.value = true;
};

const closeModal = () => {
    showModal.value  = false;
    modalError.value = '';
};

// ── Utils ──────────────────────────────────────────────────────────
const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

onMounted(fetchConsents);
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.prose :deep(h1) { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
.prose :deep(h2) { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
.prose :deep(h3) { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
.prose :deep(p)  { margin-bottom: 0.75rem; line-height: 1.7; }
.prose :deep(ul), .prose :deep(ol) { padding-left: 1.5rem; margin-bottom: 0.75rem; }
.prose :deep(li) { margin-bottom: 0.25rem; }
.prose :deep(strong) { font-weight: 700; }
</style>
