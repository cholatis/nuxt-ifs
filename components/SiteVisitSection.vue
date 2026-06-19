<template>
    <div class="mt-8 border-t border-[#e0e6ed] pt-6 dark:border-[#1b2e4b]">
        <!-- Section Header -->
        <div class="mb-5 flex items-center justify-between">
            <h3 class="flex items-center gap-2 text-base font-bold text-dark dark:text-white">
                <icon-map-pin class="h-4 w-4 text-primary" />
                Site Visits
                <span v-if="visits.length" class="badge badge-outline-secondary ml-1 text-xs">{{ visits.length }}</span>
            </h3>
            <button v-if="visits.length > 0" @click="openForm(null)" class="btn btn-primary btn-sm gap-1">
                <icon-plus class="h-4 w-4" />
                เพิ่ม
            </button>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-12">
            <span class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
        </div>

        <!-- Empty state -->
        <div v-else-if="visits.length === 0"
            class="rounded-xl border border-dashed border-[#e0e6ed] py-14 text-center dark:border-[#1b2e4b]">
            <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <icon-map-pin class="h-6 w-6 text-primary/50" />
            </div>
            <p class="text-sm font-medium text-white-dark">ยังไม่มีบันทึก Site Visit</p>
            <p class="mt-0.5 text-xs text-white-dark/60">บันทึกการเข้าเยี่ยมลูกค้าเพื่อติดตามความคืบหน้า</p>
            <button @click="openForm(null)" class="btn btn-primary btn-sm mt-4 gap-1">
                <icon-plus class="h-4 w-4" />
                เพิ่ม Site Visit ครั้งแรก
            </button>
        </div>

        <!-- Timeline -->
        <div v-else class="relative pl-6">
            <!-- Vertical line -->
            <div class="absolute left-[7px] top-2 bottom-2 w-px bg-[#e0e6ed] dark:bg-[#1b2e4b]"></div>

            <div v-for="visit in visits" :key="visit.id" class="relative mb-5 last:mb-0">
                <!-- Dot -->
                <div class="absolute -left-6 top-3 h-3.5 w-3.5 rounded-full border-2 border-primary bg-white dark:bg-[#0e1726]"></div>

                <!-- Card -->
                <div class="rounded-xl border border-[#e0e6ed] bg-white p-4 dark:border-[#1b2e4b] dark:bg-[#0e1726]">
                    <!-- Top row: date + actions -->
                    <div class="mb-2 flex items-start justify-between gap-3">
                        <div>
                            <p class="text-sm font-semibold text-dark dark:text-white">
                                {{ formatVisitDate(visit.visit_date) }}
                            </p>
                            <p class="mt-0.5 text-xs text-white-dark">
                                {{ relativeDate(visit.visit_date) }}
                            </p>
                        </div>
                        <!-- Always-visible action buttons -->
                        <div class="flex shrink-0 items-center gap-1">
                            <button
                                @click="openForm(visit)"
                                type="button"
                                title="แก้ไข"
                                class="flex h-7 w-7 items-center justify-center rounded-md border border-[#e0e6ed] text-white-dark transition-colors hover:border-primary hover:text-primary dark:border-[#1b2e4b]">
                                <icon-edit class="h-3.5 w-3.5" />
                            </button>
                            <button
                                @click="confirmDelete(visit)"
                                type="button"
                                title="ลบ"
                                class="flex h-7 w-7 items-center justify-center rounded-md border border-[#e0e6ed] text-white-dark transition-colors hover:border-danger hover:text-danger dark:border-[#1b2e4b]">
                                <icon-trash-lines class="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    <!-- Details -->
                    <p v-if="visit.details"
                        :class="['text-sm leading-relaxed text-white-dark', expandedIds.has(visit.id) ? '' : 'line-clamp-3']">
                        {{ visit.details }}
                    </p>
                    <button v-if="visit.details && visit.details.length > 140"
                        @click="toggleExpand(visit.id)"
                        type="button"
                        class="mt-1 text-xs text-primary hover:underline">
                        {{ expandedIds.has(visit.id) ? 'ย่อ' : 'ดูเพิ่มเติม' }}
                    </button>

                    <!-- File attachments -->
                    <div v-if="visit.site_visit_documents?.length" class="mt-3 flex flex-wrap gap-1.5">
                        <button v-for="doc in visit.site_visit_documents" :key="doc.id"
                            @click="downloadDoc(doc)"
                            type="button"
                            :title="`ดาวน์โหลด ${doc.file_name}`"
                            class="flex items-center gap-1.5 rounded-md border border-[#e0e6ed] bg-[#fafafa] px-2.5 py-1.5 text-xs text-dark transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary dark:border-[#1b2e4b] dark:bg-transparent dark:text-white-dark">
                            <icon-file class="h-3.5 w-3.5 shrink-0 text-primary" />
                            <span class="max-w-[160px] truncate font-medium">{{ doc.file_name }}</span>
                            <span v-if="doc.file_size" class="shrink-0 text-white-dark/70">{{ formatFileSize(doc.file_size) }}</span>
                            <icon-download class="h-3 w-3 shrink-0 text-white-dark/50" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Add / Edit Modal ──────────────────────────────────── -->
        <TransitionRoot appear :show="showModal" as="template">
            <Dialog as="div" @close="closeForm" class="relative z-50">
                <TransitionChild as="template"
                    enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                    leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-black/60" />
                </TransitionChild>
                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <TransitionChild as="template"
                            enter="duration-300 ease-out" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100"
                            leave="duration-200 ease-in" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
                            <DialogPanel class="w-full max-w-lg rounded-xl bg-white dark:bg-[#1b2e4b]">
                                <!-- Modal Header -->
                                <div class="flex items-center gap-2 border-b border-[#e0e6ed] px-6 py-4 dark:border-[#1b2e4b]">
                                    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                        <icon-map-pin class="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <DialogTitle class="text-base font-bold dark:text-white">
                                            {{ editingVisit ? 'แก้ไข Site Visit' : 'เพิ่ม Site Visit' }}
                                        </DialogTitle>
                                        <p v-if="editingVisit" class="text-xs text-white-dark">
                                            {{ formatVisitDate(editingVisit.visit_date) }}
                                        </p>
                                    </div>
                                </div>

                                <div class="p-6">
                                    <div v-if="formError"
                                        class="mb-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                                        {{ formError }}
                                    </div>

                                    <form @submit.prevent="saveVisit" class="space-y-4">
                                        <!-- Date + Time -->
                                        <div class="grid grid-cols-2 gap-3">
                                            <div>
                                                <label class="mb-1 block text-sm font-semibold">วันที่ <span class="text-danger">*</span></label>
                                                <input type="date" v-model="form.date" required class="form-input" />
                                            </div>
                                            <div>
                                                <label class="mb-1 block text-sm font-semibold">เวลา <span class="text-danger">*</span></label>
                                                <input type="time" v-model="form.time" required class="form-input" />
                                            </div>
                                        </div>

                                        <!-- Details -->
                                        <div>
                                            <label class="mb-1 block text-sm font-semibold">รายละเอียด</label>
                                            <textarea v-model="form.details" rows="4" class="form-textarea"
                                                placeholder="บันทึกรายละเอียดการเข้าเยี่ยม เช่น ผลการพูดคุย ข้อตกลง..."></textarea>
                                        </div>

                                        <!-- Existing documents (edit mode) -->
                                        <div v-if="existingDocs.length">
                                            <label class="mb-1.5 block text-sm font-semibold text-dark dark:text-white">
                                                ไฟล์ที่มีอยู่
                                                <span class="ml-1 font-normal text-white-dark">({{ existingDocs.length - docsToDelete.length }} ไฟล์)</span>
                                            </label>
                                            <div class="space-y-1.5">
                                                <div v-for="doc in existingDocs" :key="doc.id"
                                                    :class="['flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all',
                                                        docsToDelete.includes(doc.id)
                                                            ? 'border-danger/20 bg-danger/5 opacity-50'
                                                            : 'border-[#e0e6ed] dark:border-[#1b2e4b]']">
                                                    <span class="flex min-w-0 items-center gap-2">
                                                        <icon-file class="h-4 w-4 shrink-0 text-primary" />
                                                        <span :class="['truncate', docsToDelete.includes(doc.id) ? 'line-through text-white-dark' : '']">
                                                            {{ doc.file_name }}
                                                        </span>
                                                        <span class="shrink-0 text-xs text-white-dark">
                                                            {{ doc.file_size ? formatFileSize(doc.file_size) : '' }}
                                                        </span>
                                                    </span>
                                                    <button type="button" @click="toggleDocDelete(doc.id)"
                                                        class="ml-3 shrink-0 rounded px-1.5 py-0.5 text-xs transition-colors">
                                                        <span v-if="docsToDelete.includes(doc.id)" class="text-primary hover:underline">คืนค่า</span>
                                                        <span v-else class="text-danger hover:underline">ลบ</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- File upload -->
                                        <div>
                                            <label class="mb-1.5 block text-sm font-semibold">
                                                {{ existingDocs.length ? 'เพิ่มไฟล์ใหม่' : 'แนบไฟล์' }}
                                            </label>

                                            <!-- Drag-and-drop zone -->
                                            <div
                                                @dragover.prevent="isDragging = true"
                                                @dragleave.prevent="isDragging = false"
                                                @drop.prevent="onDrop"
                                                :class="['relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all',
                                                    isDragging
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-[#e0e6ed] hover:border-primary/40 hover:bg-primary/5 dark:border-[#1b2e4b]']">
                                                <icon-paperclip class="mb-2 h-6 w-6 text-white-dark/50" />
                                                <p class="text-sm text-white-dark">
                                                    ลากไฟล์มาวางที่นี่ หรือ
                                                    <label class="cursor-pointer text-primary hover:underline">
                                                        คลิกเพื่อเลือก
                                                        <input type="file" ref="fileInputRef" @change="onFileSelect" multiple
                                                            accept=".pdf,.jpg,.jpeg,.png,.webp" class="hidden" />
                                                    </label>
                                                </p>
                                                <p class="mt-1 text-xs text-white-dark/60">PDF, JPG, PNG, WebP · สูงสุด 10 MB ต่อไฟล์</p>
                                            </div>

                                            <!-- Pending files preview -->
                                            <div v-if="pendingFiles.length" class="mt-2 space-y-1.5">
                                                <div v-for="(f, i) in pendingFiles" :key="i"
                                                    class="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                                                    <span class="flex min-w-0 items-center gap-2">
                                                        <icon-file class="h-4 w-4 shrink-0 text-primary" />
                                                        <span class="truncate font-medium">{{ f.name }}</span>
                                                        <span class="shrink-0 text-xs text-white-dark">{{ formatFileSize(f.size) }}</span>
                                                    </span>
                                                    <button type="button" @click="pendingFiles.splice(i, 1)"
                                                        class="ml-3 shrink-0 text-danger/70 transition-colors hover:text-danger">
                                                        <icon-x class="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Upload progress -->
                                        <div v-if="uploadProgress.total > 0" class="rounded-lg bg-primary/5 px-4 py-3">
                                            <div class="mb-1.5 flex justify-between text-xs text-white-dark">
                                                <span>กำลังอัปโหลด...</span>
                                                <span>{{ uploadProgress.done }} / {{ uploadProgress.total }}</span>
                                            </div>
                                            <div class="h-1.5 rounded-full bg-[#e0e6ed] dark:bg-[#1b2e4b]">
                                                <div class="h-1.5 rounded-full bg-primary transition-all duration-300"
                                                    :style="{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }">
                                                </div>
                                            </div>
                                        </div>

                                        <div class="flex justify-end gap-3 border-t border-[#e0e6ed] pt-4 dark:border-[#1b2e4b]">
                                            <button type="button" @click="closeForm" class="btn btn-outline-secondary"
                                                :disabled="isSaving">ยกเลิก</button>
                                            <button type="submit" :disabled="isSaving" class="btn btn-primary min-w-[90px] gap-1">
                                                <span v-if="isSaving"
                                                    class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                                <span v-else>บันทึก</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>

        <!-- ── Delete Confirm Modal ──────────────────────────────── -->
        <TransitionRoot appear :show="showDeleteModal" as="template">
            <Dialog as="div" @close="closeDeleteModal" class="relative z-50">
                <TransitionChild as="template"
                    enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                    leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-black/60" />
                </TransitionChild>
                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <TransitionChild as="template"
                            enter="duration-300 ease-out" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100"
                            leave="duration-200 ease-in" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
                            <DialogPanel class="w-full max-w-md rounded-xl bg-white p-6 dark:bg-[#1b2e4b]">
                                <div class="mb-4 flex items-center gap-3">
                                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
                                        <icon-trash-lines class="h-5 w-5" />
                                    </div>
                                    <div>
                                        <DialogTitle class="text-base font-bold dark:text-white">ลบ Site Visit</DialogTitle>
                                        <p v-if="targetVisit" class="text-xs text-white-dark">
                                            {{ formatVisitDate(targetVisit.visit_date) }}
                                        </p>
                                    </div>
                                </div>
                                <p class="mb-5 rounded-lg bg-danger/5 px-4 py-3 text-sm text-danger">
                                    ไฟล์แนบทั้งหมด {{ targetVisit?.site_visit_documents?.length ? `(${targetVisit.site_visit_documents.length} ไฟล์) ` : '' }}จะถูกลบถาวร ไม่สามารถกู้คืนได้
                                </p>
                                <div class="flex justify-end gap-3">
                                    <button @click="closeDeleteModal" class="btn btn-outline-secondary">ยกเลิก</button>
                                    <button @click="deleteVisit" :disabled="isDeleting" class="btn btn-danger min-w-[72px] gap-1">
                                        <span v-if="isDeleting"
                                            class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                        <span v-else>ลบ</span>
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
import { ref, reactive, onMounted } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';

interface SiteVisitDocument {
    id: number;
    visit_id: number;
    file_name: string;
    file_path: string;
    file_size: number | null;
    mime_type: string | null;
    uploaded_at: string;
}

interface SiteVisit {
    id: number;
    contact_id: number;
    visit_date: string;
    details: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    site_visit_documents: SiteVisitDocument[];
}

const props = defineProps<{ contactId: number }>();

const { $supabase } = useNuxtApp();
const sb = $supabase as any;

// ── State ──────────────────────────────────────────────────────────
const visits = ref<SiteVisit[]>([]);
const isLoading = ref(false);
const expandedIds = ref<Set<number>>(new Set());
const isDragging = ref(false);

// Modal states
const showModal = ref(false);
const showDeleteModal = ref(false);
const editingVisit = ref<SiteVisit | null>(null);
const targetVisit = ref<SiteVisit | null>(null);
const isSaving = ref(false);
const isDeleting = ref(false);
const formError = ref('');

// Form fields
const form = reactive({ date: '', time: '', details: '' });

// Document management
const existingDocs = ref<SiteVisitDocument[]>([]);
const docsToDelete = ref<number[]>([]);
const pendingFiles = ref<File[]>([]);
const fileInputRef = ref<HTMLInputElement | null>(null);
const uploadProgress = reactive({ done: 0, total: 0 });

// ── Fetch ──────────────────────────────────────────────────────────
const fetchVisits = async () => {
    isLoading.value = true;
    try {
        const { data, error } = await sb
            .from('site_visits')
            .select('*, site_visit_documents(*)')
            .eq('contact_id', props.contactId)
            .order('visit_date', { ascending: false });
        if (!error) visits.value = data ?? [];
    } finally {
        isLoading.value = false;
    }
};

onMounted(fetchVisits);

// ── Modal helpers ──────────────────────────────────────────────────
const openForm = (visit: SiteVisit | null) => {
    editingVisit.value = visit;
    formError.value = '';
    docsToDelete.value = [];
    pendingFiles.value = [];
    uploadProgress.done = 0;
    uploadProgress.total = 0;
    isDragging.value = false;

    if (visit) {
        const d = new Date(visit.visit_date);
        form.date = d.toISOString().slice(0, 10);
        form.time = d.toTimeString().slice(0, 5);
        form.details = visit.details ?? '';
        existingDocs.value = [...(visit.site_visit_documents ?? [])];
    } else {
        const now = new Date();
        form.date = now.toISOString().slice(0, 10);
        form.time = now.toTimeString().slice(0, 5);
        form.details = '';
        existingDocs.value = [];
    }
    showModal.value = true;
};

const closeForm = () => {
    if (isSaving.value) return;
    showModal.value = false;
    isDragging.value = false;
};

const confirmDelete = (visit: SiteVisit) => {
    targetVisit.value = visit;
    showDeleteModal.value = true;
};

const closeDeleteModal = () => {
    showDeleteModal.value = false;
    targetVisit.value = null;
};

// ── Save visit ─────────────────────────────────────────────────────
const saveVisit = async () => {
    formError.value = '';
    isSaving.value = true;
    try {
        for (const f of pendingFiles.value) {
            if (f.size > 10 * 1024 * 1024) {
                formError.value = `ไฟล์ "${f.name}" มีขนาดเกิน 10 MB`;
                return;
            }
        }

        const visitDate = new Date(`${form.date}T${form.time}:00`).toISOString();
        let visitId: number;

        if (editingVisit.value) {
            const { data, error } = await sb
                .from('site_visits')
                .update({ visit_date: visitDate, details: form.details || null, updated_at: new Date().toISOString() })
                .eq('id', editingVisit.value.id)
                .select('id')
                .single();
            if (error) throw new Error(error.message);
            visitId = data.id;

            for (const docId of docsToDelete.value) {
                const doc = existingDocs.value.find(d => d.id === docId);
                if (doc) {
                    await sb.storage.from('site-visits').remove([doc.file_path]);
                    await sb.from('site_visit_documents').delete().eq('id', docId);
                }
            }
        } else {
            const { data: sessionData } = await sb.auth.getSession();
            const userId = sessionData?.session?.user?.id ?? null;
            const { data, error } = await sb
                .from('site_visits')
                .insert({ contact_id: props.contactId, visit_date: visitDate, details: form.details || null, created_by: userId })
                .select('id')
                .single();
            if (error) throw new Error(error.message);
            visitId = data.id;
        }

        if (pendingFiles.value.length) {
            uploadProgress.total = pendingFiles.value.length;
            uploadProgress.done = 0;
            const { data: sessionData } = await sb.auth.getSession();
            const userId = sessionData?.session?.user?.id ?? null;

            for (const file of pendingFiles.value) {
                const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                const filePath = `contacts/${props.contactId}/${visitId}/${Date.now()}_${safeName}`;
                const { error: uploadError } = await sb.storage.from('site-visits').upload(filePath, file);
                if (!uploadError) {
                    await sb.from('site_visit_documents').insert({
                        visit_id: visitId,
                        file_name: file.name,
                        file_path: filePath,
                        file_size: file.size,
                        mime_type: file.type,
                        uploaded_by: userId,
                    });
                }
                uploadProgress.done++;
            }
        }

        showModal.value = false;
        await fetchVisits();
    } catch (err: any) {
        formError.value = err?.message || 'เกิดข้อผิดพลาด';
    } finally {
        isSaving.value = false;
        uploadProgress.total = 0;
        uploadProgress.done = 0;
    }
};

// ── Delete visit ───────────────────────────────────────────────────
const deleteVisit = async () => {
    if (!targetVisit.value) return;
    isDeleting.value = true;
    try {
        const docs = targetVisit.value.site_visit_documents ?? [];
        if (docs.length) {
            await sb.storage.from('site-visits').remove(docs.map((d: SiteVisitDocument) => d.file_path));
        }
        await sb.from('site_visits').delete().eq('id', targetVisit.value.id);
        closeDeleteModal();
        await fetchVisits();
    } catch (err: any) {
        console.error('[SiteVisitSection] deleteVisit:', err.message);
    } finally {
        isDeleting.value = false;
    }
};

// ── File helpers ───────────────────────────────────────────────────
const toggleDocDelete = (id: number) => {
    const idx = docsToDelete.value.indexOf(id);
    if (idx === -1) docsToDelete.value.push(id);
    else docsToDelete.value.splice(idx, 1);
};

const addFiles = (files: File[]) => {
    for (const f of files) {
        if (!pendingFiles.value.find(p => p.name === f.name && p.size === f.size)) {
            pendingFiles.value.push(f);
        }
    }
};

const onFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    addFiles(Array.from(input.files ?? []));
    if (fileInputRef.value) fileInputRef.value.value = '';
};

const onDrop = (e: DragEvent) => {
    isDragging.value = false;
    const files = Array.from(e.dataTransfer?.files ?? []).filter(f =>
        ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    );
    addFiles(files);
};

const downloadDoc = async (doc: SiteVisitDocument) => {
    const { data, error } = await sb.storage
        .from('site-visits')
        .createSignedUrl(doc.file_path, 3600);
    if (!error && data?.signedUrl) {
        window.open(data.signedUrl, '_blank', 'noopener');
    }
};

// ── Expand/collapse ────────────────────────────────────────────────
const toggleExpand = (id: number) => {
    if (expandedIds.value.has(id)) expandedIds.value.delete(id);
    else expandedIds.value.add(id);
    expandedIds.value = new Set(expandedIds.value);
};

// ── Formatters ─────────────────────────────────────────────────────
const formatVisitDate = (dt: string): string => {
    const d = new Date(dt);
    const date = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${date}  ${time} น.`;
};

const relativeDate = (dt: string): string => {
    const now = new Date();
    const d = new Date(dt);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'วันนี้';
    if (diffDays === 1) return 'เมื่อวาน';
    if (diffDays <= 7) return `${diffDays} วันที่แล้ว`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} สัปดาห์ที่แล้ว`;
    if (diffDays <= 365) return `${Math.floor(diffDays / 30)} เดือนที่แล้ว`;
    return `${Math.floor(diffDays / 365)} ปีที่แล้ว`;
};

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
</script>
