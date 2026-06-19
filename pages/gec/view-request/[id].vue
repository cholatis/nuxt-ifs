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
            <NuxtLink to="/gec/request-list" class="btn btn-primary">← กลับสู่รายการ</NuxtLink>
        </div>

        <template v-else>
            <!-- Header — View Only (no approve/reject) -->
            <div class="bg-primary text-white rounded-lg p-4 flex items-center justify-between mb-5 shadow-md">
                <div class="flex items-center gap-4">
                    <div class="p-2 bg-white/20 rounded-lg">
                        <icon-menu-invoice class="w-6 h-6" />
                    </div>
                    <div>
                        <h4 class="text-xl font-bold">
                            {{ app.document_type === 'credit_line' ? 'Credit Line Application' : 'PO Factoring Request' }}
                        </h4>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-white/80 text-sm">ID: {{ app.id }}</span>
                            <span :class="statusBadgeClass(app.status)">{{ statusLabel(app.status) }}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <NuxtLink to="/gec/request-list" class="btn btn-outline-white">← Back</NuxtLink>
                </div>
            </div>

            <!-- GEC Verify action banner for LINE under_review -->
            <div v-if="app.status === 'under_review' && app.document_type === 'credit_line'"
                class="mb-5 rounded-lg border border-warning/30 bg-warning/5 px-5 py-3 flex items-center justify-between gap-3 text-sm">
                <div class="flex items-center gap-2 text-warning">
                    <icon-info-circle class="w-5 h-5 flex-none" />
                    <span>คำขอนี้รอการ <strong>Verify</strong> จาก GEC — กรุณาตรวจสอบเอกสารให้ครบถ้วนก่อนดำเนินการ</span>
                </div>
                <div class="flex items-center gap-2 flex-none">
                    <button @click="openRejectModal" class="btn btn-outline-danger btn-sm px-4">
                        <icon-x class="w-4 h-4 mr-1" /> Reject
                    </button>
                    <button @click="openVerifyModal" class="btn btn-warning btn-sm px-4 text-white">
                        <icon-circle-check class="w-4 h-4 mr-1" /> Verify
                    </button>
                </div>
            </div>

            <!-- Read-only notice for non-LINE under_review -->
            <div v-else-if="app.status === 'under_review'"
                class="mb-5 rounded-lg border border-info/30 bg-info/5 px-5 py-3 flex items-center gap-3 text-sm text-info">
                <icon-info-circle class="w-5 h-5 flex-none" />
                คำขอนี้อยู่ระหว่างการพิจารณาโดย Lender — GEC สามารถดูข้อมูลได้เท่านั้น
            </div>

            <!-- Verified notice -->
            <div v-if="app.status === 'verified'"
                class="mb-5 rounded-lg border border-success/30 bg-success/5 px-5 py-3 flex items-center gap-3 text-sm text-success">
                <icon-circle-check class="w-5 h-5 flex-none" />
                GEC ได้ทำการ Verify เอกสารเรียบร้อยแล้ว — รอ Lender พิจารณาอนุมัติ
            </div>

            <!-- Verify note -->
            <div v-if="app.status === 'verified' && app.verify_note"
                class="mb-5 rounded-lg border border-success/30 bg-success/5 px-5 py-3 text-sm">
                <p class="font-semibold text-success mb-1">หมายเหตุ Verify</p>
                <p class="text-white-dark">{{ app.verify_note }}</p>
            </div>

            <!-- Rejected note -->
            <div v-if="app.status === 'rejected' && (app.review_note || app.verify_note)"
                class="mb-5 rounded-lg border border-danger/30 bg-danger/5 px-5 py-3 text-sm">
                <p class="font-semibold text-danger mb-1">เหตุผลที่ปฏิเสธ</p>
                <p class="text-white-dark">{{ app.verify_note || app.review_note }}</p>
            </div>

            <!-- ── Application Info ────────────────────────────────── -->
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
                            {{ app.document_type === 'credit_line' ? 'Credit Line' : 'PO Factoring (Drawdown)' }}
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

            <!-- ── CREDIT LINE Details ─────────────────────────────── -->
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
                            <p class="font-semibold dark:text-white">{{ app.credit_period }} วัน</p>
                        </div>
                    </div>

                    <!-- Approved Facility Summary -->
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

            <!-- ── DRAWDOWN Details ────────────────────────────────── -->
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
                            <p class="font-semibold dark:text-white">{{ app.credit_period }} วัน</p>
                        </div>
                        <div>
                            <p class="text-white-dark mb-1">ประเภทการชำระ</p>
                            <p class="font-semibold dark:text-white capitalize">{{ app.payment_type || '-' }}</p>
                        </div>
                        <div class="md:col-span-2">
                            <p class="text-white-dark mb-1">หมายเหตุ</p>
                            <p class="font-semibold dark:text-white">{{ app.remark || '-' }}</p>
                        </div>
                    </div>
                </div>

                <!-- PO Items -->
                <div class="panel mb-5" v-if="app.application_po_items?.length">
                    <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">3</span>
                        Purchase Orders
                    </h5>
                    <div class="table-responsive">
                        <table class="table-hover table">
                            <thead>
                                <tr>
                                    <th>PO Number</th>
                                    <th>PO Date</th>
                                    <th>Buyer</th>
                                    <th class="text-right">Amount (THB)</th>
                                    <th class="text-center">Term (Days)</th>
                                    <th class="text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="po in app.application_po_items" :key="po.id">
                                    <td class="font-semibold text-primary">{{ po.po_number }}</td>
                                    <td class="text-white-dark text-sm">{{ po.po_date }}</td>
                                    <td>{{ po.buyer }}</td>
                                    <td class="text-right font-bold">{{ formatAmount(po.amount) }}</td>
                                    <td class="text-center">{{ po.term }}</td>
                                    <td class="text-center">
                                        <span class="badge badge-outline-warning text-[10px]">{{ po.po_status }}</span>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr class="font-bold bg-gray-50 dark:bg-dark/20">
                                    <td colspan="3" class="text-right text-white-dark">Total PO Value</td>
                                    <td class="text-right text-primary text-base">฿ {{ formatAmount(totalPoAmount) }}</td>
                                    <td colspan="2"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- ── Repayment Section (read-only) ── -->
                <div class="panel mb-5">
                    <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                        <span class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">4</span>
                        การคืนวงเงิน
                    </h5>

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

            <!-- Credit Facility Info (if approved) -->
            <div class="panel mb-5" v-if="app.status === 'approved' && creditFacility">
                <h5 class="mb-4 text-lg font-semibold flex items-center gap-2">
                    <span class="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center text-sm">✓</span>
                    วงเงินที่อนุมัติ
                </h5>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p class="text-white-dark mb-1">วงเงินที่อนุมัติ</p>
                        <p class="text-xl font-black text-success">฿ {{ formatAmount(creditFacility.approved_limit) }}</p>
                    </div>
                    <div>
                        <p class="text-white-dark mb-1">อัตราดอกเบี้ย</p>
                        <p class="font-semibold dark:text-white">
                            {{ creditFacility.interest_rate != null ? (creditFacility.interest_rate * 100).toFixed(2) + ' %' : '-' }}
                        </p>
                    </div>
                    <div>
                        <p class="text-white-dark mb-1">ระยะเวลาเครดิต</p>
                        <p class="font-semibold dark:text-white">{{ creditFacility.credit_period ?? '-' }} วัน</p>
                    </div>
                    <div>
                        <p class="text-white-dark mb-1">วันหมดอายุ</p>
                        <p class="font-semibold dark:text-white">
                            {{ creditFacility.expiry_date ? formatDate(creditFacility.expiry_date) : '-' }}
                        </p>
                    </div>
                </div>
            </div>
        </template>

        <!-- Sticky Bottom Bar (LINE + under_review only) -->
        <div v-if="app && app.status === 'under_review' && app.document_type === 'credit_line'"
            class="sticky bottom-0 bg-white dark:bg-[#0e1726] border-t dark:border-[#191e3a] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] p-4 z-10 -mx-6 px-10">
            <div class="flex items-center justify-between gap-4">
                <p class="text-sm text-white-dark">กรุณาตรวจสอบเอกสารทั้งหมดก่อน Verify</p>
                <div class="flex items-center gap-3">
                    <button @click="openRejectModal" class="btn btn-outline-danger px-6">
                        <icon-x class="w-4 h-4 mr-1" /> Reject
                    </button>
                    <button @click="openVerifyModal" class="btn btn-warning px-8 text-white shadow-md">
                        <icon-circle-check class="w-4 h-4 mr-1" /> Verify
                    </button>
                </div>
            </div>
        </div>

        <!-- ─── Verify Modal ───────────────────────────────────── -->
        <TransitionRoot appear :show="isVerifyOpen" as="template">
            <Dialog as="div" @close="closeVerifyModal" class="relative z-50">
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
                                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20 text-warning">
                                        <icon-circle-check class="h-5 w-5" />
                                    </div>
                                    <DialogTitle class="text-lg font-bold dark:text-white">ยืนยัน Verify เอกสาร</DialogTitle>
                                </div>
                                <div class="mb-4 rounded-lg bg-gray-50 dark:bg-dark/30 p-3 text-sm space-y-1.5">
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">คำขอ</span>
                                        <span class="font-semibold text-primary">{{ app?.id }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">บริษัท</span>
                                        <span class="font-semibold dark:text-white">{{ app?.company_name }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-white-dark">วงเงินที่ขอ</span>
                                        <span class="font-black text-primary">฿ {{ formatAmount(app?.requested_credit_limit ?? 0) }}</span>
                                    </div>
                                </div>
                                <div class="mb-4">
                                    <label class="mb-1 block text-sm font-medium dark:text-white">หมายเหตุ (ไม่บังคับ)</label>
                                    <textarea v-model="verifyNote" rows="2" class="form-textarea w-full"
                                        placeholder="บันทึกหมายเหตุการ verify (ถ้ามี)"></textarea>
                                </div>
                                <div v-if="actionError" class="mb-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{{ actionError }}</div>
                                <div class="flex justify-end gap-3">
                                    <button @click="closeVerifyModal" class="btn btn-outline-secondary" :disabled="actionLoading">ยกเลิก</button>
                                    <button @click="submitVerify" class="btn btn-warning px-6 text-white" :disabled="actionLoading">
                                        <span v-if="actionLoading" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                        ยืนยัน Verify
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
                                <div v-if="actionError" class="mb-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{{ actionError }}</div>
                                <div class="flex justify-end gap-3">
                                    <button @click="closeRejectModal" class="btn btn-outline-secondary" :disabled="actionLoading">ยกเลิก</button>
                                    <button @click="submitReject" class="btn btn-danger px-6" :disabled="actionLoading || !rejectNote.trim()">
                                        <span v-if="actionLoading" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
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
    import { ref, computed, onMounted } from 'vue';
    import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
    import { useAuthStore } from '@/stores/auth';
    import Swal from 'sweetalert2';

    useHead({ title: 'View Request - NEX Finance (GEC)' });
    definePageMeta({ layout: 'default' });

    const GET_URL       = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/getapplication';
    const VERIFY_URL    = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/verifyapplication';
    const SIGNEDURL_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/getsignedurl';
    const REPAY_URL     = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/repaydrawdown';

    const authStore = useAuthStore();
    const route     = useRoute();
    const router    = useRouter();

    // ── State ──────────────────────────────────────────────────────
    const isLoading      = ref(true);
    const fetchError     = ref('');
    const app            = ref<any>(null);
    const creditFacility = ref<any>(null);
    const actionLoading  = ref(false);
    const actionError    = ref('');

    // Verify Modal
    const isVerifyOpen = ref(false);
    const verifyNote   = ref('');

    // Reject Modal
    const isRejectOpen = ref(false);
    const rejectNote   = ref('');

    // Repay Info (read-only)
    const repayInfoLoading = ref(false);
    const repayInfo = ref<{ total_repaid: number; remaining: number; repayments: any[] }>({
        total_repaid: 0,
        remaining   : 0,
        repayments  : [],
    });

    // ── Computed ───────────────────────────────────────────────────
    const totalPoAmount = computed(() =>
        (app.value?.application_po_items ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
    );

    // ── Fetch ──────────────────────────────────────────────────────
    const fetchApp = async () => {
        isLoading.value  = true;
        fetchError.value = '';
        try {
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;

            const res  = await fetch(`${GET_URL}?id=${encodeURIComponent(String(route.params.id))}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const json = await res.json();

            if (!res.ok) {
                fetchError.value = `[${res.status}] ${json.error ?? JSON.stringify(json)}`;
                app.value = null;
            } else {
                app.value = json.data ?? null;
                // Pull credit facility from nested data if present
                creditFacility.value = json.data?.credit_facility ?? null;
            }
        } catch (err: any) {
            fetchError.value = err.message;
            app.value = null;
        } finally {
            isLoading.value = false;
        }
    };

    // ── Verify ────────────────────────────────────────────────────
    const openVerifyModal  = () => { verifyNote.value = ''; actionError.value = ''; isVerifyOpen.value = true; };
    const closeVerifyModal = () => { isVerifyOpen.value = false; };

    const submitVerify = async () => {
        actionLoading.value = true;
        actionError.value   = '';
        try {
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;
            const res  = await fetch(VERIFY_URL, {
                method : 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body   : JSON.stringify({ id: app.value.id, action: 'verify', note: verifyNote.value || undefined }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
            closeVerifyModal();
            await Swal.fire({ icon: 'success', title: 'Verify สำเร็จ!', text: `คำขอ ${app.value.id} ผ่านการ Verify แล้ว รอ Lender พิจารณา`, confirmButtonColor: '#4361ee' });
            router.push('/gec/request-list');
        } catch (err: any) {
            actionError.value = err.message || 'เกิดข้อผิดพลาด';
        } finally {
            actionLoading.value = false;
        }
    };

    // ── Reject ─────────────────────────────────────────────────────
    const openRejectModal  = () => { rejectNote.value = ''; actionError.value = ''; isRejectOpen.value = true; };
    const closeRejectModal = () => { isRejectOpen.value = false; };

    const submitReject = async () => {
        if (!rejectNote.value.trim()) return;
        actionLoading.value = true;
        actionError.value   = '';
        try {
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;
            const res  = await fetch(VERIFY_URL, {
                method : 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                body   : JSON.stringify({ id: app.value.id, action: 'reject', note: rejectNote.value }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
            closeRejectModal();
            await Swal.fire({ icon: 'warning', title: 'ปฏิเสธคำขอแล้ว', text: `คำขอ ${app.value.id} ถูกปฏิเสธเรียบร้อยแล้ว`, confirmButtonColor: '#e7515a' });
            router.push('/gec/request-list');
        } catch (err: any) {
            actionError.value = err.message || 'เกิดข้อผิดพลาด';
        } finally {
            actionLoading.value = false;
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

    // ── Repay Info ────────────────────────────────────────────────
    const fetchRepayInfo = async () => {
        if (!app.value?.id) return;
        repayInfoLoading.value = true;
        try {
            const { $supabase } = useNuxtApp();
            const { data: { session } } = await ($supabase as any).auth.getSession();
            const jwt = session?.access_token || authStore.accessToken;
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

    // ── Helpers ────────────────────────────────────────────────────
    const formatAmount = (n: number) =>
        new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.floor(n || 0));

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    const formatRepayDate = (d: string) =>
        new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

    const statusLabel = (s: string) =>
        ({ under_review: 'รอ Verify', verified: 'Verified', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ', draft: 'Draft', repaid: 'คืนวงเงินแล้ว' }[s] ?? s);

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
            await fetchRepayInfo();
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
