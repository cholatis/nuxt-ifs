<template>
    <div>
        <!-- Loading -->
        <div v-if="isLoading" class="flex items-center justify-center py-32">
            <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
            <span class="ml-3 text-white-dark">กำลังโหลด...</span>
        </div>

        <!-- Not found -->
        <div v-else-if="!app" class="panel py-20 text-center">
            <p class="text-white-dark mb-2">ไม่พบคำขอนี้</p>
            <p v-if="fetchError" class="text-danger text-sm mb-4 font-mono">{{ fetchError }}</p>
            <NuxtLink to="/lender/request-list" class="btn btn-primary">← กลับสู่รายการ</NuxtLink>
        </div>

        <template v-else>
            <!-- Header -->
            <div class="bg-primary text-white rounded-lg p-4 flex items-center justify-between mb-5 shadow-md">
                <div class="flex items-center gap-4">
                    <div class="p-2 bg-white/20 rounded-lg">
                        <icon-menu-invoice class="w-6 h-6" />
                    </div>
                    <div>
                        <h4 class="text-xl font-bold">
                            {{ app.document_type === 'credit_line' ? 'Credit Line Application'
                                : app.drawdown_type === 'po' ? 'PO Factoring Request'
                                : 'Invoice Factoring Request' }}
                        </h4>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-white/80 text-sm">ID: {{ app.id }}</span>
                            <span :class="statusBadgeClass(app.status)">{{ statusLabel(app.status) }}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <NuxtLink to="/lender/request-list" class="btn btn-outline-white">← Back</NuxtLink>
                    <template v-if="app.status === 'under_review' || app.status === 'verified'">
                        <button @click="openRejectModal" class="btn border-2 border-white bg-transparent text-white hover:bg-danger hover:border-danger transition-colors">
                            <icon-x class="w-4 h-4 mr-1" /> Reject
                        </button>
                        <button @click="openApproveModal" class="btn bg-white text-primary font-bold hover:bg-gray-100 shadow-lg">
                            <icon-circle-check class="w-4 h-4 mr-1" /> Approve
                        </button>
                    </template>
                </div>
            </div>

            <!-- ── Application Info ─────────────────────────────────── -->
            <div class="panel mb-5">
                <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                    <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                    ข้อมูลผู้ยื่นคำขอ
                </h5>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p class="text-white-dark mb-1">บริษัท</p>
                        <p class="font-semibold dark:text-white">{{ app.company_name }}</p>
                    </div>
                    <div>
                        <p class="text-white-dark mb-1">ประเภทคำขอ</p>
                        <p class="font-semibold dark:text-white">
                            {{ app.document_type === 'credit_line' ? 'Credit Line'
                                : app.drawdown_type === 'po' ? 'PO Factoring (Drawdown)'
                                : 'Invoice Factoring (Drawdown)' }}
                        </p>
                    </div>
                    <div>
                        <p class="text-white-dark mb-1">วันที่ยื่น</p>
                        <p class="font-semibold dark:text-white">{{ formatDate(app.created_at) }}</p>
                    </div>
                    <div>
                        <p class="text-white-dark mb-1">สถานะ</p>
                        <span :class="statusBadgeClass(app.status)">{{ statusLabel(app.status) }}</span>
                    </div>
                </div>
            </div>

            <!-- ── CREDIT LINE Details ──────────────────────────────── -->
            <template v-if="app.document_type === 'credit_line'">
                <div class="panel mb-5">
                    <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                        รายละเอียดคำขอวงเงิน
                    </h5>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p class="text-white-dark mb-1">Tax ID</p>
                            <p class="font-semibold dark:text-white">{{ app.tax_id || '-' }}</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">ประเภทธุรกิจ</p>
                            <p class="font-semibold dark:text-white">{{ app.business_type || '-' }}</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">วงเงินที่ขอ (THB)</p>
                            <p class="text-xl font-black text-primary">฿ {{ formatAmount(app.requested_credit_limit) }}</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">ระยะเวลาเครดิต</p>
                            <p class="font-semibold dark:text-white">{{ app.credit_period ?? '-' }} วัน</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">% Factoring</p>
                            <p class="font-semibold dark:text-white">
                                {{ app.factoring_rate != null ? app.factoring_rate + ' %' : '-' }}
                            </p>
                        </div>
                    </div>

                    <!-- Approved Facility Summary (shown only when facility exists) -->
                    <template v-if="app.credit_facility">
                        <div class="mt-5 pt-5 border-t dark:border-[#191e3a]">
                            <p class="text-sm font-semibold text-white-dark mb-3 uppercase tracking-wide">วงเงินที่อนุมัติ</p>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div class="rounded-xl bg-primary/10 px-5 py-4 flex items-center justify-between">
                                    <span class="text-sm font-medium text-primary">วงเงินอนุมัติ</span>
                                    <span class="text-lg font-black text-primary">฿ {{ formatAmount(app.credit_facility.approved_limit) }}</span>
                                </div>
                                <div class="rounded-xl bg-warning/10 px-5 py-4 flex items-center justify-between">
                                    <span class="text-sm font-medium text-warning-dark">ใช้ไปแล้ว</span>
                                    <span class="text-lg font-black text-warning-dark">฿ {{ formatAmount(app.credit_facility.used_balance ?? 0) }}</span>
                                </div>
                                <div class="rounded-xl px-5 py-4 flex items-center justify-between"
                                    :class="(app.credit_facility.available_balance ?? 0) <= 0 ? 'bg-danger/10' : 'bg-success/10'">
                                    <span class="text-sm font-medium" :class="(app.credit_facility.available_balance ?? 0) <= 0 ? 'text-danger' : 'text-success'">วงเงินคงเหลือ</span>
                                    <span class="text-lg font-black" :class="(app.credit_facility.available_balance ?? 0) <= 0 ? 'text-danger' : 'text-success'">
                                        ฿ {{ formatAmount(app.credit_facility.available_balance ?? 0) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Documents -->
                <div class="panel mb-5" v-if="app.application_documents?.length">
                    <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">3</span>
                        เอกสารแนบ
                    </h5>
                    <div class="space-y-2">
                        <div v-for="doc in app.application_documents" :key="doc.doc_id"
                            class="flex items-center justify-between border border-gray-200 dark:border-[#191e3a] rounded-lg p-3">
                            <div class="flex items-center gap-3">
                                <div :class="doc.upload_status === 'uploaded'
                                    ? 'w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center'
                                    : 'w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center'">
                                    <icon-circle-check v-if="doc.upload_status === 'uploaded'" class="w-4 h-4" />
                                    <icon-x v-else class="w-4 h-4" />
                                </div>
                                <div>
                                    <p class="font-semibold text-sm dark:text-white">{{ doc.doc_name }}</p>
                                    <p class="text-xs text-white-dark">{{ doc.file_name || 'ยังไม่อัปโหลด' }}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span v-if="doc.required" class="badge badge-outline-danger text-[10px]">Required</span>
                                <span v-else class="badge badge-outline-secondary text-[10px]">Optional</span>
                                <button v-if="doc.file_path"
                                    @click="openFile(doc.file_path)"
                                    :disabled="fileLoading[doc.file_path]"
                                    class="btn btn-sm btn-outline-primary disabled:opacity-60">
                                    <span v-if="fileLoading[doc.file_path]"
                                        class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-l-transparent mr-1"></span>
                                    ดูไฟล์
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- ── DRAWDOWN Details ─────────────────────────────────── -->
            <template v-else>
                <div class="panel mb-5">
                    <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                        รายละเอียดคำขอ Factoring
                    </h5>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p class="text-white-dark mb-1">Buyer Name</p>
                            <p class="font-semibold dark:text-white">{{ app.buyer_name || '-' }}</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">จำนวนที่ขอ (THB)</p>
                            <p class="text-xl font-black text-primary">฿ {{ formatAmount(app.requested_amount) }}</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">ระยะเวลาเครดิต</p>
                            <p class="font-semibold dark:text-white">{{ app.credit_period ?? '-' }} วัน</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">% Factoring</p>
                            <p class="font-semibold dark:text-white">
                                {{ app.factoring_rate != null ? app.factoring_rate + ' %' : '-' }}
                            </p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">ประเภทการชำระ</p>
                            <p class="font-semibold dark:text-white capitalize">{{ app.payment_type || '-' }}</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">หมายเหตุ</p>
                            <p class="font-semibold dark:text-white">{{ app.remark || '-' }}</p>
                        </div>
                        <!-- Total value (from po_items) -->
                        <div v-if="app.application_po_items?.length" class="md:col-span-3 border-t pt-3 dark:border-[#191e3a]">
                            <p class="text-white-dark mb-1">ยอดรวม {{ app.drawdown_type === 'po' ? 'PO' : 'Invoice' }} ทั้งหมด (THB)</p>
                            <p class="text-2xl font-black text-success">฿ {{ formatAmount(totalPoAmount) }}</p>
                        </div>
                    </div>
                </div>

                <!-- Invoice / PO Items -->
                <div class="panel mb-5">
                    <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">3</span>
                        {{ app.drawdown_type === 'po' ? 'รายการ Purchase Order' : 'รายการ Invoice' }}
                    </h5>
                    <div v-if="!app.application_po_items?.length" class="py-6 text-center text-white-dark text-sm">
                        ไม่มีรายการ {{ app.drawdown_type === 'po' ? 'PO' : 'Invoice' }}
                    </div>
                    <div v-else class="table-responsive">
                        <table class="table-hover table">
                            <thead>
                                <tr>
                                    <th>{{ app.drawdown_type === 'po' ? 'PO No' : 'Invoice No' }}</th>
                                    <th>{{ app.drawdown_type === 'po' ? 'PO Date' : 'Invoice Date' }}</th>
                                    <th>Buyer</th>
                                    <th class="text-right">Amount (THB)</th>
                                    <th class="text-center">{{ app.drawdown_type === 'po' ? 'Invoice Reference' : 'PO Reference' }}</th>
                                    <th class="text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="po in app.application_po_items" :key="po.id">
                                    <td class="font-semibold text-primary">{{ po.po_number }}</td>
                                    <td class="text-white-dark text-sm">{{ po.po_date }}</td>
                                    <td>{{ po.buyer }}</td>
                                    <td class="text-right font-bold">{{ formatAmount(po.amount) }}</td>
                                    <td class="text-center text-white-dark text-sm">{{ po.term || '-' }}</td>
                                    <td class="text-center">
                                        <span class="badge badge-outline-info text-[10px]">{{ po.po_status }}</span>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr class="font-bold bg-gray-50 dark:bg-dark/20">
                                    <td colspan="3" class="text-right text-white-dark">
                                        Total {{ app.drawdown_type === 'po' ? 'PO' : 'Invoice' }} Value
                                    </td>
                                    <td class="text-right text-primary text-base">฿ {{ formatAmount(totalPoAmount) }}</td>
                                    <td colspan="2"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <!-- ── เอกสารแนบ (invoice files) ── -->
                <div class="panel mb-5">
                    <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">4</span>
                        เอกสารแนบ
                    </h5>

                    <div v-if="docsLoading" class="flex items-center gap-2 py-4 text-white-dark text-sm">
                        <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-l-transparent"></span>
                        กำลังโหลดเอกสาร...
                    </div>

                    <div v-else-if="invoiceDocs.length === 0" class="py-6 text-center text-white-dark text-sm">
                        ไม่มีเอกสารแนบ
                    </div>

                    <ul v-else class="space-y-2">
                        <li
                            v-for="doc in invoiceDocs"
                            :key="doc.name"
                            class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-[#191e3a] px-4 py-2.5 text-sm"
                        >
                            <div class="flex items-center gap-2 min-w-0">
                                <svg class="w-4 h-4 text-primary flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span class="truncate font-medium dark:text-white-light">{{ doc.name }}</span>
                                <span class="text-white-dark flex-none text-xs">({{ (doc.size / 1024).toFixed(1) }} KB)</span>
                            </div>
                            <a
                                v-if="doc.signedUrl"
                                :href="doc.signedUrl"
                                target="_blank"
                                class="btn btn-sm btn-outline-primary flex-none"
                            >
                                ดาวน์โหลด
                            </a>
                            <span v-else class="text-xs text-white-dark flex-none">URL ไม่พร้อม</span>
                        </li>
                    </ul>
                </div>

                <!-- ── Repayment Section (drawdown only) ── -->
                <div class="panel mb-5">
                    <h5 class="mb-4 text-lg font-semibold flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">5</span>
                            การคืนวงเงิน
                        </div>
                        <button
                            v-if="app.status === 'approved'"
                            @click="openRepayModal"
                            class="btn btn-success btn-sm gap-1"
                        >
                            <icon-refresh class="w-4 h-4" />
                            คืนวงเงิน
                        </button>
                    </h5>

                    <!-- Loading -->
                    <div v-if="repayInfoLoading" class="flex items-center gap-2 py-4 text-white-dark text-sm">
                        <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-l-transparent"></span>
                        กำลังโหลด...
                    </div>

                    <template v-else>
                        <!-- Summary cards -->
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div class="rounded-xl bg-primary/10 px-4 py-3 flex items-center justify-between">
                                <span class="text-sm text-primary font-medium">วงเงินตามเอกสาร</span>
                                <span class="font-black text-primary">฿ {{ formatAmount(app.requested_amount) }}</span>
                            </div>
                            <div class="rounded-xl bg-success/10 px-4 py-3 flex items-center justify-between">
                                <span class="text-sm text-success font-medium">คืนแล้ว</span>
                                <span class="font-black text-success">฿ {{ formatAmount(repayInfo.total_repaid) }}</span>
                            </div>
                            <div class="rounded-xl px-4 py-3 flex items-center justify-between"
                                :class="repayInfo.remaining <= 0 ? 'bg-gray-100 dark:bg-dark/20' : 'bg-warning/10'">
                                <span class="text-sm font-medium" :class="repayInfo.remaining <= 0 ? 'text-white-dark' : 'text-warning-dark'">คงค้าง</span>
                                <span class="font-black" :class="repayInfo.remaining <= 0 ? 'text-white-dark' : 'text-warning-dark'">
                                    ฿ {{ formatAmount(repayInfo.remaining) }}
                                </span>
                            </div>
                        </div>

                        <!-- Progress bar -->
                        <div class="mb-4">
                            <div class="flex justify-between text-xs text-white-dark mb-1">
                                <span>{{ app.requested_amount > 0 ? ((repayInfo.total_repaid / app.requested_amount) * 100).toFixed(1) : 0 }}% คืนแล้ว</span>
                                <span :class="repayInfo.remaining <= 0 ? 'text-success font-semibold' : ''">
                                    {{ repayInfo.remaining <= 0 ? '✓ คืนครบถ้วน' : `คงค้าง ฿${formatAmount(repayInfo.remaining)}` }}
                                </span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-dark rounded-full h-3">
                                <div class="h-3 rounded-full transition-all duration-700"
                                    :class="repayInfo.remaining <= 0 ? 'bg-success' : 'bg-primary'"
                                    :style="{ width: Math.min(100, app.requested_amount > 0 ? (repayInfo.total_repaid / app.requested_amount) * 100 : 0) + '%' }">
                                </div>
                            </div>
                        </div>

                        <!-- Repayment history -->
                        <div v-if="repayInfo.repayments?.length">
                            <p class="text-xs font-semibold text-white-dark uppercase tracking-wide mb-2">ประวัติการคืนวงเงิน</p>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th class="text-center w-10">#</th>
                                            <th>วันที่</th>
                                            <th class="text-right">จำนวน (THB)</th>
                                            <th>หมายเหตุ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(r, i) in repayInfo.repayments" :key="r.id">
                                            <td class="text-center text-white-dark text-sm">{{ i + 1 }}</td>
                                            <td class="text-white-dark text-sm">{{ formatRepayDate(r.repaid_at) }}</td>
                                            <td class="text-right font-bold text-success">฿ {{ formatAmount(r.amount) }}</td>
                                            <td class="text-white-dark text-sm">{{ r.note || '-' }}</td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr class="font-bold bg-gray-50 dark:bg-dark/20">
                                            <td colspan="2" class="text-right text-white-dark">รวมคืนทั้งหมด</td>
                                            <td class="text-right text-success">฿ {{ formatAmount(repayInfo.total_repaid) }}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        <div v-else class="py-4 text-center text-white-dark text-sm">
                            ยังไม่มีการคืนวงเงิน
                        </div>
                    </template>
                </div>
            </template>

            <!-- Sticky Bottom Action Bar (under_review or verified) -->
            <div v-if="app.status === 'under_review' || app.status === 'verified'"
                class="sticky bottom-0 bg-white dark:bg-[#0e1726] border-t dark:border-[#191e3a] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] p-4 z-10 -mx-6 px-10">
                <div class="flex items-center justify-between gap-4">
                    <p class="text-sm text-white-dark">กรุณาตรวจสอบข้อมูลข้างต้นก่อนดำเนินการ</p>
                    <div class="flex items-center gap-3">
                        <button @click="openRejectModal" class="btn btn-outline-danger px-6">
                            <icon-x class="w-4 h-4 mr-1" /> Reject
                        </button>
                        <button @click="openApproveModal" class="btn btn-success px-8 shadow-md">
                            <icon-circle-check class="w-4 h-4 mr-1" /> Approve
                        </button>
                    </div>
                </div>
            </div>
        </template>

        <!-- ─── Approve Modal ──────────────────────────────────── -->
        <TransitionRoot appear :show="isApproveOpen" as="template">
            <Dialog as="div" @close="closeApproveModal" class="relative z-50">
                <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                    leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-black/60" />
                </TransitionChild>
                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                            enter-to="opacity-100 scale-100" leave="duration-200 ease-in"
                            leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
                            <DialogPanel class="w-full max-w-lg rounded-xl bg-white p-6 dark:bg-[#1b2e4b]">
                                <div class="mb-5 flex items-center gap-3">
                                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-success/20 text-success">
                                        <icon-circle-check class="h-5 w-5" />
                                    </div>
                                    <DialogTitle class="text-lg font-bold dark:text-white">กำหนดเงื่อนไขการอนุมัติ</DialogTitle>
                                </div>

                                <!-- Summary -->
                                <div class="mb-5 rounded-lg bg-gray-50 dark:bg-dark/30 p-3 text-sm space-y-1.5">
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">คำขอ</span>
                                        <span class="font-semibold text-primary">{{ app?.id }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">บริษัท</span>
                                        <span class="font-semibold dark:text-white">{{ app?.company_name }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">จำนวนที่ขอ</span>
                                        <span class="font-black text-primary">
                                            ฿ {{ formatAmount(app?.requested_amount ?? app?.requested_credit_limit ?? 0) }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Approve Fields -->
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <!-- วงเงินที่อนุมัติ — always shown -->
                                    <div class="col-span-2">
                                        <label class="mb-1 block text-sm font-medium dark:text-white">
                                            วงเงินที่อนุมัติ (THB) <span class="text-danger">*</span>
                                        </label>
                                        <input type="number" v-model="approveForm.approved_limit" class="form-input" placeholder="0.00" />
                                    </div>

                                    <!-- Fields only for credit_line -->
                                    <template v-if="app?.document_type === 'credit_line'">
                                        <div class="col-span-2">
                                            <label class="mb-1 block text-sm font-medium dark:text-white">
                                                % Factoring <span class="text-danger">*</span>
                                            </label>
                                            <div class="relative">
                                                <input type="number" v-model="approveForm.factoring_rate" class="form-input pr-8" step="0.01" min="0" max="100" placeholder="เช่น 80" />
                                                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-white-dark text-sm">%</span>
                                            </div>
                                        </div>
                                        <div class="col-span-2">
                                            <label class="mb-2 block text-sm font-medium dark:text-white">
                                                ประเภทเอกสาร Drawdown <span class="text-danger">*</span>
                                            </label>
                                            <div class="flex items-center gap-6">
                                                <label class="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="approveDrawdownType" value="invoice"
                                                        v-model="approveForm.drawdown_type" class="form-radio text-primary" />
                                                    <span class="font-medium dark:text-white">Invoice</span>
                                                </label>
                                                <label class="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="approveDrawdownType" value="po"
                                                        v-model="approveForm.drawdown_type" class="form-radio text-primary" />
                                                    <span class="font-medium dark:text-white">Purchase Order (PO)</span>
                                                </label>
                                            </div>
                                            <p class="mt-1 text-xs text-white-dark">
                                                กำหนดว่า supplier จะใช้เอกสารประเภทใดในการทำ Factoring Drawdown
                                            </p>
                                        </div>
                                        <div>
                                            <label class="mb-1 block text-sm font-medium dark:text-white">วันที่มีผล</label>
                                            <input type="date" v-model="approveForm.effective_date" class="form-input" />
                                        </div>
                                        <div>
                                            <label class="mb-1 block text-sm font-medium dark:text-white">วันหมดอายุ</label>
                                            <input type="date" v-model="approveForm.expiry_date" class="form-input" />
                                        </div>
                                    </template>

                                    <!-- หมายเหตุ — always shown -->
                                    <div class="col-span-2">
                                        <label class="mb-1 block text-sm font-medium dark:text-white">หมายเหตุ</label>
                                        <textarea v-model="approveForm.note" rows="2" class="form-textarea"
                                            placeholder="ระบุเงื่อนไขหรือหมายเหตุ (ถ้ามี)"></textarea>
                                    </div>
                                </div>

                                <div v-if="actionError" class="mb-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                                    {{ actionError }}
                                </div>

                                <div class="flex justify-end gap-3">
                                    <button @click="closeApproveModal" class="btn btn-outline-secondary" :disabled="actionLoading">ยกเลิก</button>
                                    <button @click="submitApprove" class="btn btn-success px-6"
                                        :disabled="actionLoading || !approveForm.approved_limit">
                                        <span v-if="actionLoading"
                                            class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                        ยืนยันอนุมัติ
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>

        <!-- ─── Repay Modal ───────────────────────────────────── -->
        <TransitionRoot appear :show="isRepayOpen" as="template">
            <Dialog as="div" @close="isRepayOpen = false" class="relative z-50">
                <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                    leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-black/60" />
                </TransitionChild>
                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                            enter-to="opacity-100 scale-100" leave="duration-200 ease-in"
                            leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
                            <DialogPanel class="w-full max-w-md rounded-xl bg-white p-6 dark:bg-[#1b2e4b]">
                                <div class="mb-5 flex items-center gap-3">
                                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-success/20 text-success">
                                        <icon-refresh class="h-5 w-5" />
                                    </div>
                                    <DialogTitle class="text-lg font-bold dark:text-white">คืนวงเงิน</DialogTitle>
                                </div>

                                <!-- Summary -->
                                <div class="mb-4 rounded-lg bg-gray-50 dark:bg-dark/30 p-3 text-sm space-y-1.5">
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">คำขอ</span>
                                        <span class="font-semibold text-primary">{{ app?.id }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">วงเงินตามเอกสาร</span>
                                        <span class="font-black text-primary">฿ {{ formatAmount(app?.requested_amount ?? 0) }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">คืนแล้ว</span>
                                        <span class="font-semibold text-success">฿ {{ formatAmount(repayInfo.total_repaid) }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">คงค้าง</span>
                                        <span class="font-bold text-warning-dark">฿ {{ formatAmount(repayInfo.remaining) }}</span>
                                    </div>
                                </div>

                                <!-- Progress bar -->
                                <div class="mb-4">
                                    <div class="w-full bg-gray-200 dark:bg-dark rounded-full h-2">
                                        <div class="h-2 rounded-full bg-success transition-all duration-500"
                                            :style="{ width: Math.min(100, (app?.requested_amount ?? 0) > 0 ? (repayInfo.total_repaid / (app?.requested_amount ?? 1)) * 100 : 0) + '%' }">
                                        </div>
                                    </div>
                                </div>

                                <!-- Repayment history (compact) -->
                                <div v-if="repayInfo.repayments?.length" class="mb-4">
                                    <p class="text-xs font-semibold text-white-dark uppercase tracking-wide mb-2">ประวัติการคืน</p>
                                    <div class="max-h-32 overflow-y-auto space-y-1.5">
                                        <div v-for="(r, i) in repayInfo.repayments" :key="r.id"
                                            class="flex items-center justify-between text-sm px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-dark/30">
                                            <span class="text-white-dark text-xs">{{ i + 1 }}. {{ formatRepayDate(r.repaid_at) }}</span>
                                            <span class="font-semibold text-success">฿ {{ formatAmount(r.amount) }}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Input -->
                                <div class="mb-3">
                                    <label class="mb-1 block text-sm font-medium dark:text-white">
                                        จำนวนที่คืน (THB) <span class="text-danger">*</span>
                                    </label>
                                    <div class="relative">
                                        <input type="number" v-model="repayAmount" class="form-input pr-16"
                                            :max="repayInfo.remaining" min="1" placeholder="0.00" />
                                        <button type="button"
                                            @click="repayAmount = repayInfo.remaining"
                                            class="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors">
                                            เต็ม
                                        </button>
                                    </div>
                                    <p class="mt-1 text-xs text-white-dark">สูงสุด ฿{{ formatAmount(repayInfo.remaining) }}</p>
                                </div>

                                <div class="mb-4">
                                    <label class="mb-1 block text-sm font-medium dark:text-white">หมายเหตุ</label>
                                    <input type="text" v-model="repayNote" class="form-input" placeholder="เช่น Buyer ชำระค่าสินค้า งวด 1" />
                                </div>

                                <!-- Partial success msg -->
                                <div v-if="repaySuccessMsg" class="mb-3 rounded border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                                    {{ repaySuccessMsg }}
                                </div>

                                <div v-if="repayError" class="mb-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                                    {{ repayError }}
                                </div>

                                <div class="flex justify-end gap-3">
                                    <button @click="isRepayOpen = false" class="btn btn-outline-secondary" :disabled="repayLoading">ปิด</button>
                                    <button @click="submitRepay" class="btn btn-success px-6"
                                        :disabled="repayLoading || !repayAmount || Number(repayAmount) <= 0">
                                        <span v-if="repayLoading"
                                            class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                        ยืนยันคืนวงเงิน
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>

        <!-- ─── Reject Modal ───────────────────────────────────── -->
        <TransitionRoot appear :show="isRejectOpen" as="template">
            <Dialog as="div" @close="closeRejectModal" class="relative z-50">
                <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                    leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-black/60" />
                </TransitionChild>
                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                            enter-to="opacity-100 scale-100" leave="duration-200 ease-in"
                            leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
                            <DialogPanel class="w-full max-w-md rounded-xl bg-white p-6 dark:bg-[#1b2e4b]">
                                <div class="mb-4 flex items-center gap-3">
                                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-danger/20 text-danger">
                                        <icon-x class="h-5 w-5" />
                                    </div>
                                    <DialogTitle class="text-lg font-bold dark:text-white">ยืนยันการปฏิเสธ</DialogTitle>
                                </div>

                                <div class="mb-4 rounded-lg bg-gray-50 dark:bg-dark/30 p-3 text-sm space-y-1">
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">คำขอ</span>
                                        <span class="font-semibold text-primary">{{ app?.id }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">บริษัท</span>
                                        <span class="font-semibold dark:text-white">{{ app?.company_name }}</span>
                                    </div>
                                </div>

                                <div class="mb-4">
                                    <label class="mb-1 block text-sm font-medium dark:text-white">
                                        เหตุผลที่ปฏิเสธ <span class="text-danger">*</span>
                                    </label>
                                    <textarea v-model="rejectNote" rows="3" class="form-textarea w-full"
                                        placeholder="ระบุเหตุผลที่ปฏิเสธ"></textarea>
                                </div>

                                <div v-if="actionError" class="mb-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                                    {{ actionError }}
                                </div>

                                <div class="flex justify-end gap-3">
                                    <button @click="closeRejectModal" class="btn btn-outline-secondary" :disabled="actionLoading">ยกเลิก</button>
                                    <button @click="submitReject" class="btn btn-danger px-6"
                                        :disabled="actionLoading || !rejectNote.trim()">
                                        <span v-if="actionLoading"
                                            class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                        ยืนยันปฏิเสธ
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
    import { ref, computed, onMounted, watch } from 'vue';
    import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
    import { useAuthStore } from '@/stores/auth';
    import Swal from 'sweetalert2';

    useHead({ title: 'View Request - NEX Finance' });
    definePageMeta({ layout: 'default' });

    const GET_URL        = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/getapplication';
    const CREDIT_URL     = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/createcredit';
    const REJECT_URL     = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/rejectapplication';
    const SIGNEDURL_URL  = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/getsignedurl';
    const REPAY_URL      = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/repaydrawdown';

    const authStore = useAuthStore();
    const route     = useRoute();
    const router    = useRouter();

    // ── State ──────────────────────────────────────────────────────
    const isLoading   = ref(true);
    const actionLoading = ref(false);
    const actionError = ref('');
    const fetchError  = ref('');
    const app         = ref<any>(null);

    // Approve Modal
    const isApproveOpen = ref(false);
    const approveForm   = ref({
        approved_limit : null as number | null,
        factoring_rate : 80 as number | null,
        drawdown_type  : 'invoice' as 'po' | 'invoice',
        effective_date : '',
        expiry_date    : '',
        note           : '',
    });

    // Rule: facility valid for 1 year — expiry_date auto-syncs to effective_date + 1 year.
    // Watcher fires when effective_date changes (incl. when the whole form is reassigned in openApproveModal).
    const addOneYear = (dateStr: string): string => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-').map(Number);
        // Date constructor handles leap-year roll-over (e.g. Feb 29 + 1y → Mar 1) in local time
        const date = new Date(y + 1, m - 1, d);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };
    watch(() => approveForm.value.effective_date, (newVal) => {
        approveForm.value.expiry_date = addOneYear(newVal);
    });

    // Reject Modal
    const isRejectOpen = ref(false);
    const rejectNote   = ref('');

    // Repay Modal
    const isRepayOpen     = ref(false);
    const repayInfoLoading = ref(false);
    const repayInfo       = ref<{ total_repaid: number; remaining: number; repayments: any[] }>({
        total_repaid: 0,
        remaining   : 0,
        repayments  : [],
    });
    const repayAmount     = ref<number | null>(null);
    const repayNote       = ref('');
    const repayLoading    = ref(false);
    const repayError      = ref('');
    const repaySuccessMsg = ref('');

    // ── Computed ───────────────────────────────────────────────────
    const totalPoAmount = computed(() =>
        (app.value?.application_po_items ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
    );

    // ── Fetch ──────────────────────────────────────────────────────
    const fetchApp = async () => {
        isLoading.value = true;
        fetchError.value = '';
        try {
            const jwt = authStore.accessToken;

            const res  = await fetch(`${GET_URL}?id=${encodeURIComponent(String(route.params.id))}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();

            if (!res.ok) {
                fetchError.value = `[${res.status}] ${json.error ?? JSON.stringify(json)}`;
                app.value = null;
            } else {
                app.value = json.data ?? null;
            }
        } catch (err: any) {
            fetchError.value = err.message;
            app.value = null;
        } finally {
            isLoading.value = false;
        }
    };

    // ── Approve ────────────────────────────────────────────────────
    const openApproveModal = () => {
        actionError.value = '';
        const today = new Date().toISOString().split('T')[0];
        approveForm.value = {
            approved_limit : app.value?.requested_amount ?? app.value?.requested_credit_limit ?? null,
            factoring_rate : 80,
            drawdown_type  : 'invoice',
            effective_date : today,
            expiry_date    : addOneYear(today),
            note           : '',
        };
        isApproveOpen.value = true;
    };

    const closeApproveModal = () => { isApproveOpen.value = false; };

    const submitApprove = async () => {
        if (!approveForm.value.approved_limit) return;
        actionLoading.value = true;
        actionError.value   = '';
        try {
            const jwt = authStore.accessToken;
            const payload: Record<string, any> = {
                supplier_id   : app.value.submitted_by,
                company_name  : app.value.company_name,
                application_id: app.value.id,
                facility_type : app.value.document_type,
                approved_limit: approveForm.value.approved_limit,
                drawdown_type : approveForm.value.drawdown_type,
            };
            if (approveForm.value.factoring_rate != null) payload.factoring_rate = approveForm.value.factoring_rate;
            if (approveForm.value.effective_date) payload.effective_date = approveForm.value.effective_date;
            if (approveForm.value.expiry_date)    payload.expiry_date    = approveForm.value.expiry_date;
            if (approveForm.value.note)           payload.note           = approveForm.value.note;

            const res  = await fetch(CREDIT_URL, {
                method : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body   : JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

            closeApproveModal();
            await Swal.fire({
                icon             : 'success',
                title            : 'อนุมัติสำเร็จ!',
                text             : `สร้างวงเงิน ฿${formatAmount(approveForm.value.approved_limit)} ให้กับ ${app.value.company_name} แล้ว`,
                confirmButtonColor: '#4361ee',
            });
            router.push('/lender/request-list');
        } catch (err: any) {
            actionError.value = err.message || 'เกิดข้อผิดพลาด';
        } finally {
            actionLoading.value = false;
        }
    };

    // ── Reject ─────────────────────────────────────────────────────
    const openRejectModal = () => {
        rejectNote.value  = '';
        actionError.value = '';
        isRejectOpen.value = true;
    };

    const closeRejectModal = () => { isRejectOpen.value = false; };

    const submitReject = async () => {
        if (!rejectNote.value.trim()) return;
        actionLoading.value = true;
        actionError.value   = '';
        try {
            const jwt = authStore.accessToken;
            const res = await fetch(REJECT_URL, {
                method : 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body   : JSON.stringify({ id: app.value.id, note: rejectNote.value }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

            closeRejectModal();
            await Swal.fire({
                icon             : 'warning',
                title            : 'ปฏิเสธคำขอแล้ว',
                text             : `คำขอ ${app.value.id} ถูกปฏิเสธเรียบร้อยแล้ว`,
                confirmButtonColor: '#e7515a',
            });
            router.push('/lender/request-list');
        } catch (err: any) {
            actionError.value = err.message || 'เกิดข้อผิดพลาด';
        } finally {
            actionLoading.value = false;
        }
    };

    // ── Invoice docs (drawdown attachments) ───────────────────────
    type InvoiceDoc = { name: string; size: number; signedUrl: string | null };
    const invoiceDocs = ref<InvoiceDoc[]>([]);
    const docsLoading = ref(false);

    const fetchInvoiceDocs = async () => {
        if (!app.value?.id) return;
        docsLoading.value = true;
        try {
            const { $supabase } = useNuxtApp();

            const { data: docs, error } = await ($supabase as any)
                .from('application_documents')
                .select('file_name, file_size, file_path')
                .eq('application_id', app.value.id)
                .eq('doc_id', 'invoice_files');

            if (error || !docs?.length) return;

            const paths = docs.map((d: any) => d.file_path);
            const { data: signedData } = await ($supabase as any)
                .storage
                .from('document')
                .createSignedUrls(paths, 3600);

            invoiceDocs.value = docs.map((d: any) => {
                const signed = (signedData ?? []).find((s: any) => s.path === d.file_path);
                return {
                    name     : d.file_name,
                    size     : d.file_size ?? 0,
                    signedUrl: signed?.signedUrl ?? null,
                };
            });
        } finally {
            docsLoading.value = false;
        }
    };

    // ── Signed URL ────────────────────────────────────────────────
    const fileLoading = ref<Record<string, boolean>>({});

    const openFile = async (filePath: string | null) => {
        if (!filePath) return;
        fileLoading.value[filePath] = true;
        try {
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;

            const res  = await fetch(`${SIGNEDURL_URL}?path=${encodeURIComponent(filePath)}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
            window.open(json.signed_url, '_blank');
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'ไม่สามารถเปิดไฟล์ได้', text: err.message, confirmButtonColor: '#e7515a' });
        } finally {
            fileLoading.value[filePath] = false;
        }
    };

    // ── Repay ──────────────────────────────────────────────────────
    const fetchRepayInfo = async () => {
        if (!app.value?.id) return;
        repayInfoLoading.value = true;
        try {
            const jwt = authStore.accessToken;
            const res  = await fetch(`${REPAY_URL}?application_id=${encodeURIComponent(app.value.id)}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();
            if (res.ok) {
                repayInfo.value = {
                    total_repaid: json.total_repaid ?? 0,
                    remaining   : json.remaining    ?? 0,
                    repayments  : json.repayments   ?? [],
                };
            }
        } catch { /* silent */ } finally {
            repayInfoLoading.value = false;
        }
    };

    const openRepayModal = async () => {
        repayAmount.value     = null;
        repayNote.value       = '';
        repayError.value      = '';
        repaySuccessMsg.value = '';
        isRepayOpen.value     = true;
        await fetchRepayInfo();
    };

    const submitRepay = async () => {
        const amount = Number(repayAmount.value);
        if (!amount || amount <= 0) return;
        repayLoading.value    = true;
        repayError.value      = '';
        repaySuccessMsg.value = '';
        try {
            const jwt = authStore.accessToken;
            const res  = await fetch(REPAY_URL, {
                method : 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body   : JSON.stringify({
                    application_id: app.value.id,
                    amount,
                    note: repayNote.value || undefined,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

            if (json.fully_repaid) {
                isRepayOpen.value = false;
                await Swal.fire({
                    icon             : 'success',
                    title            : 'คืนวงเงินครบแล้ว!',
                    text             : `คืนวงเงินทั้งหมด ฿${formatAmount(amount)} เรียบร้อย`,
                    confirmButtonColor: '#4361ee',
                });
                // Refresh app data to reflect repaid status
                await fetchApp();
            } else {
                repaySuccessMsg.value = `คืนวงเงิน ฿${formatAmount(amount)} สำเร็จ — คงค้าง ฿${formatAmount(json.remaining)}`;
                repayAmount.value = null;
                repayNote.value   = '';
                await fetchRepayInfo();
                // Also refresh app data in background
                fetchApp();
            }
        } catch (err: any) {
            repayError.value = err.message || 'เกิดข้อผิดพลาด';
        } finally {
            repayLoading.value = false;
        }
    };

    const formatRepayDate = (d: string) =>
        new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

    // ── Helpers ────────────────────────────────────────────────────
    const formatAmount = (n: number) =>
        new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.floor(n || 0));

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    const statusLabel = (s: string) =>
        ({ under_review: 'รอพิจารณา', verified: 'Verified (รอ Lender)', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ', draft: 'Draft', repaid: 'คืนวงเงินแล้ว' }[s] ?? s);

    const statusBadgeClass = (s: string) => ({
        under_review: 'badge badge-outline-warning text-[10px]',
        verified    : 'badge badge-outline-info text-[10px]',
        approved    : 'badge badge-outline-success text-[10px]',
        rejected    : 'badge badge-outline-danger text-[10px]',
        draft       : 'badge badge-outline-secondary text-[10px]',
        repaid      : 'badge bg-primary/20 text-primary text-[10px]',
    }[s] ?? 'badge');

    onMounted(async () => {
        await fetchApp();
        if (app.value?.document_type === 'drawdown') {
            await Promise.all([fetchRepayInfo(), fetchInvoiceDocs()]);
        }
    });
</script>

<style scoped>
    .btn-outline-white {
        @apply bg-transparent border-2 border-white text-white;
    }
    .btn-outline-white:hover {
        @apply bg-white text-primary;
    }
</style>
