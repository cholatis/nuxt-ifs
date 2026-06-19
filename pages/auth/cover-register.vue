<template>
    <div>
        <div class="absolute inset-0">
            <img src="/assets/images/auth/bg-gradient.png" alt="image" class="h-full w-full object-cover" />
        </div>
        <div class="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
            <img src="/assets/images/auth/coming-soon-object1.png" alt="image" class="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
            <img src="/assets/images/auth/coming-soon-object2.png" alt="image" class="absolute left-24 top-0 h-40 md:left-[30%]" />
            <img src="/assets/images/auth/coming-soon-object3.png" alt="image" class="absolute right-0 top-0 h-[300px]" />
            <img src="/assets/images/auth/polygon-object.svg" alt="image" class="absolute bottom-0 end-[28%]" />

            <div class="relative flex w-full max-w-[1502px] flex-col justify-between overflow-hidden rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px] lg:flex-row lg:gap-10 xl:gap-0">
                <!-- Left panel (branding) -->
                <div class="relative hidden w-full items-center justify-center bg-[linear-gradient(225deg,rgba(239,18,98,1)_0%,rgba(67,97,238,1)_100%)] p-5 lg:inline-flex lg:max-w-[835px] xl:-ms-28 ltr:xl:skew-x-[14deg] rtl:xl:skew-x-[-14deg]">
                    <div class="absolute inset-y-0 w-8 from-primary/10 via-transparent to-transparent ltr:-right-10 ltr:bg-gradient-to-r rtl:-left-10 rtl:bg-gradient-to-l xl:w-16 ltr:xl:-right-20 rtl:xl:-left-20"></div>
                    <div class="ltr:xl:-skew-x-[14deg] rtl:xl:skew-x-[14deg]">
                        <div class="ms-10 block">
                            <h2 class="text-4xl font-extrabold text-white">NEX Finance</h2>
                            <p class="mt-2 text-lg text-white/80">Supply Chain Finance System</p>
                        </div>
                        <div class="mt-24 hidden w-full max-w-[430px] lg:block">
                            <img src="/assets/images/auth/register.svg" alt="Cover Image" class="w-full" />
                        </div>
                    </div>
                </div>

                <!-- Right panel -->
                <div class="relative flex w-full flex-col justify-center gap-3 px-6 pb-6 pt-4 sm:px-10">
                    <!-- Logo (mobile only) -->
                    <div class="flex lg:hidden">
                        <NuxtLink to="/" class="block w-8">
                            <img src="/assets/images/logo.svg" alt="Logo" class="mx-auto w-10" />
                        </NuxtLink>
                    </div>

                    <!-- Error banner -->
                    <div v-if="errorMessage" class="rounded border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                        {{ errorMessage }}
                    </div>

                    <!-- Success state -->
                    <div v-if="isSuccess" class="flex flex-col items-center justify-center py-16 text-center">
                        <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                            <svg class="h-10 w-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold text-success">ส่งข้อมูลเรียบร้อยแล้ว!</h3>
                        <p class="mt-2 text-white-dark">ทีมงานจะติดต่อกลับเร็วๆ นี้</p>
                        <NuxtLink to="/auth/cover-login" class="btn btn-gradient mt-6 border-0 px-8">
                            กลับหน้าเข้าสู่ระบบ
                        </NuxtLink>
                    </div>

                    <!-- Two-column layout: Form + Contact Info -->
                    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-2">

                        <!-- ── Left: Form ── -->
                        <div>
                            <h2 class="mb-3 text-xl font-bold text-dark dark:text-white">ติดต่อเรา</h2>

                            <form class="space-y-3 dark:text-white" @submit.prevent="handleRegister">

                                <!-- คำนำหน้า / ชื่อ / นามสกุล -->
                                <template v-if="form.title !== 'อื่นๆ'">
                                    <div class="grid grid-cols-3 gap-3">
                                        <div>
                                            <label class="text-sm font-medium">คำนำหน้า <span class="text-danger">*</span></label>
                                            <select v-model="form.title" class="form-select mt-1" required :disabled="isLoading">
                                                <option value="" disabled>เลือก</option>
                                                <option value="นาย">นาย</option>
                                                <option value="นาง">นาง</option>
                                                <option value="นางสาว">นางสาว</option>
                                                <option value="อื่นๆ">อื่นๆ</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium">ชื่อ <span class="text-danger">*</span></label>
                                            <input v-model="form.firstname" type="text" placeholder="ชื่อ" class="form-input mt-1 placeholder:text-white-dark" required :disabled="isLoading" />
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium">นามสกุล <span class="text-danger">*</span></label>
                                            <input v-model="form.lastname" type="text" placeholder="นามสกุล" class="form-input mt-1 placeholder:text-white-dark" required :disabled="isLoading" />
                                        </div>
                                    </div>
                                </template>

                                <!-- อื่นๆ mode: คำนำหน้า + custom field on row 1, ชื่อ + นามสกุล on row 2 -->
                                <template v-else>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="text-sm font-medium">คำนำหน้า <span class="text-danger">*</span></label>
                                            <select v-model="form.title" class="form-select mt-1" required :disabled="isLoading">
                                                <option value="" disabled>เลือก</option>
                                                <option value="นาย">นาย</option>
                                                <option value="นาง">นาง</option>
                                                <option value="นางสาว">นางสาว</option>
                                                <option value="อื่นๆ">อื่นๆ</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium">กรุณาระบุคำนำหน้า <span class="text-danger">*</span></label>
                                            <input v-model="form.titleOther" type="text" placeholder="ระบุคำนำหน้า" class="form-input mt-1 placeholder:text-white-dark" required :disabled="isLoading" />
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="text-sm font-medium">ชื่อ <span class="text-danger">*</span></label>
                                            <input v-model="form.firstname" type="text" placeholder="ชื่อ" class="form-input mt-1 placeholder:text-white-dark" required :disabled="isLoading" />
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium">นามสกุล <span class="text-danger">*</span></label>
                                            <input v-model="form.lastname" type="text" placeholder="นามสกุล" class="form-input mt-1 placeholder:text-white-dark" required :disabled="isLoading" />
                                        </div>
                                    </div>
                                </template>

                                <!-- อีเมล / บริษัท -->
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="text-sm font-medium">อีเมล <span class="text-danger">*</span></label>
                                        <input v-model="form.email" type="email" placeholder="your@email.com" class="form-input mt-1 placeholder:text-white-dark" required :disabled="isLoading" />
                                    </div>
                                    <div>
                                        <label class="text-sm font-medium">บริษัท <span class="text-danger">*</span></label>
                                        <input v-model="form.companyName" type="text" placeholder="ชื่อบริษัท" class="form-input mt-1 placeholder:text-white-dark" required :disabled="isLoading" />
                                    </div>
                                </div>

                                <!-- เลขนิติบุคคล / เบอร์โทร -->
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="text-sm font-medium">เลขนิติบุคคล <span class="text-danger">*</span></label>
                                        <input
                                            v-model="form.taxId"
                                            type="text"
                                            placeholder="เลขนิติบุคคล 13 หลัก"
                                            class="form-input mt-1 placeholder:text-white-dark"
                                            maxlength="13"
                                            pattern="\d{13}"
                                            required
                                            :disabled="isLoading"
                                        />
                                        <p v-if="taxIdError" class="mt-1 text-xs text-danger">{{ taxIdError }}</p>
                                    </div>
                                    <div>
                                        <label class="text-sm font-medium">เบอร์โทร <span class="text-danger">*</span></label>
                                        <input v-model="form.phone" type="tel" placeholder="08XXXXXXXX" class="form-input mt-1 placeholder:text-white-dark" required :disabled="isLoading" />
                                    </div>
                                </div>

                                <!-- ตำแหน่ง/บทบาท -->
                                <div>
                                    <label class="text-sm font-medium">ตำแหน่ง/บทบาท</label>
                                    <select v-model="form.position" class="form-select mt-1" :disabled="isLoading">
                                        <option value="" disabled>เลือกตำแหน่ง</option>
                                        <option value="เจ้าของกิจการ">เจ้าของกิจการ</option>
                                        <option value="CEO/MD">CEO/MD</option>
                                        <option value="CFO">CFO</option>
                                        <option value="ฝ่ายการเงิน">ฝ่ายการเงิน</option>
                                        <option value="ฝ่ายจัดซื้อ">ฝ่ายจัดซื้อ</option>
                                        <option value="อื่น ๆ">อื่น ๆ</option>
                                    </select>
                                </div>

                                <!-- ข้อความ/คำถาม -->
                                <div>
                                    <label class="text-sm font-medium">ข้อความ/คำถาม</label>
                                    <textarea
                                        v-model="form.message"
                                        rows="2"
                                        placeholder="บอกเราเกี่ยวกับความต้องการของคุณ..."
                                        class="form-textarea mt-1 placeholder:text-white-dark"
                                        :disabled="isLoading"
                                    ></textarea>
                                </div>

                                <!-- PDPA Checkbox -->
                                <div class="rounded-lg border border-[#ebedf2] bg-white/60 p-3 dark:border-[#191e3a] dark:bg-black/20">
                                    <label class="flex cursor-pointer items-start gap-3">
                                        <input
                                            type="checkbox"
                                            class="form-checkbox mt-0.5 h-4 w-4 flex-shrink-0"
                                            :checked="pdpaAccepted"
                                            @click.prevent="openPdpaModal"
                                            :disabled="isLoading"
                                        />
                                        <span class="text-sm text-dark dark:text-white">
                                            ข้าพเจ้าได้อ่าน ทำความเข้าใจ และยอมรับหนังสือรับทราบและให้ความยินยอมเกี่ยวกับการคุ้มครองข้อมูลส่วนบุคคล (PDPA) นโยบายการจัดการข้อมูล (Data Policy) และเงื่อนไขการใช้บริการของ NEX Finance Platform แล้วทุกประการ
                                            <button type="button" class="font-semibold text-primary underline hover:text-primary/80" @click.stop="openPdpaModal">
                                                นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)
                                            </button>
                                            <span class="text-danger"> *</span>
                                        </span>
                                    </label>
                                    <p v-if="pdpaAccepted" class="mt-2 flex items-center gap-1.5 text-xs text-success">
                                        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        ยอมรับแล้ว — PDPA v{{ pdpaConsent?.consent_version }}
                                    </p>
                                </div>

                                <!-- Data Disclosure Consent Checkbox -->
                                <div class="rounded-lg border border-[#ebedf2] bg-white/60 p-3 dark:border-[#191e3a] dark:bg-black/20">
                                    <label class="flex cursor-pointer items-start gap-3">
                                        <input
                                            type="checkbox"
                                            v-model="noaAccepted"
                                            class="form-checkbox mt-0.5 h-4 w-4 flex-shrink-0"
                                            :disabled="isLoading"
                                        />
                                        <span class="text-sm text-dark dark:text-white">
                                            ข้าพเจ้ายินยอม ให้ NEX Finance เปิดเผยข้อมูลที่เกี่ยวข้องแก่สถาบันการเงินและพันธมิตรทางธุรกิจเพื่อการพิจารณา และ ให้บริการทางการเงินที่เกี่ยวข้องกับธุรกรรมของข้าพเจ้าและ/หรือบริษัทที่ข้าพเจ้าเป็นผู้แทน
                                            <span class="text-danger"> *</span>
                                        </span>
                                    </label>
                                </div>

                                <!-- Submit -->
                                <button
                                    type="submit"
                                    class="btn w-full border-0 py-3 text-base font-bold text-white shadow-[0_10px_20px_-10px_rgba(67,97,238,0.5)] transition-all hover:opacity-90 disabled:opacity-60"
                                    style="background: linear-gradient(90deg, #4361ee 0%, #22c55e 100%)"
                                    :disabled="isLoading || !pdpaAccepted || !noaAccepted"
                                >
                                    <span v-if="isLoading" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent ltr:mr-2 rtl:ml-2"></span>
                                    {{ isLoading ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลและนัดหมาย' }}
                                </button>

                                <p class="text-center text-sm dark:text-white">
                                    มีบัญชีแล้ว?
                                    <NuxtLink to="/auth/cover-login" class="font-semibold text-primary underline hover:text-black dark:hover:text-white">
                                        เข้าสู่ระบบ
                                    </NuxtLink>
                                </p>
                            </form>
                        </div>

                        <!-- ── Right: Contact Info ── -->
                        <div class="flex flex-col justify-center">
                            <h2 class="mb-3 text-xl font-bold text-dark dark:text-white">ติดต่อโดยตรง</h2>

                            <div class="space-y-3">
                                <!-- Phone -->
                                <div class="flex items-center gap-3">
                                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                        <svg class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="text-sm font-semibold text-dark dark:text-white">โทรศัพท์</p>
                                        <p class="text-sm text-white-dark">085 872 9728, 02 275 5551</p>
                                    </div>
                                </div>

                                <!-- Email -->
                                <div class="flex items-center gap-3">
                                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                        <svg class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="text-sm font-semibold text-dark dark:text-white">อีเมล</p>
                                        <p class="text-sm text-white-dark">NexFinance@gec.co.th</p>
                                    </div>
                                </div>

                                <!-- Address -->
                                <div class="flex items-start gap-3">
                                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                        <svg class="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="text-sm font-semibold text-dark dark:text-white">ที่อยู่</p>
                                        <p class="text-xs text-white-dark leading-relaxed">
                                            บมจ. เจเนอรัล อิเลคทรอนิค คอมเมอร์ซ เซอร์วิสเซส (GEC)<br />
                                            989 ชั้น 16 อาคารสยามพิวรรธน์ทาวเวอร์ ถ.พระราม 1 แขวงปทุมวัน กรุงเทพฯ 10330
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div><!-- end two-column grid -->

                    <!-- ── PDPA Modal ─────────────────────────────────────── -->
                    <transition name="fade">
                        <div v-if="showPdpaModal" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4">
                            <div class="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-[#1b2e4b]" style="max-height: 90vh">
                                <!-- Header -->
                                <div class="flex items-center justify-between border-b border-[#ebedf2] px-6 py-4 dark:border-[#191e3a]">
                                    <div>
                                        <h4 class="text-lg font-bold dark:text-white">นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)</h4>
                                        <p v-if="pdpaConsent" class="text-xs text-white-dark">เวอร์ชัน {{ pdpaConsent.consent_version }}</p>
                                    </div>
                                    <button class="text-gray-400 hover:text-gray-600" @click="closePdpaModal">
                                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <!-- Scrollable content -->
                                <div
                                    ref="pdpaScrollEl"
                                    class="flex-1 overflow-y-auto px-6 py-5"
                                    @scroll="onPdpaScroll"
                                    style="min-height: 0"
                                >
                                    <div v-if="!pdpaConsent" class="flex items-center justify-center py-16 text-white-dark">
                                        <span class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary border-l-transparent mr-3"></span>
                                        กำลังโหลด...
                                    </div>
                                    <div v-else class="pdpa-content" v-html="pdpaConsent.consent_detail"></div>
                                </div>

                                <!-- Scroll hint -->
                                <div v-if="!hasScrolledToBottom && pdpaConsent" class="border-t border-[#ebedf2] bg-warning/5 px-6 py-2 text-center text-xs text-warning dark:border-[#191e3a]">
                                    ↓ กรุณาเลื่อนอ่านจนครบก่อนยอมรับ
                                </div>

                                <!-- Footer -->
                                <div class="flex items-center justify-end gap-3 border-t border-[#ebedf2] px-6 py-4 dark:border-[#191e3a]">
                                    <button class="btn btn-outline-danger" @click="closePdpaModal">ไม่ยอมรับ</button>
                                    <button
                                        class="btn btn-success gap-2 disabled:opacity-50"
                                        :disabled="!hasScrolledToBottom || !pdpaConsent"
                                        @click="acceptPdpa"
                                    >
                                        <svg v-if="hasScrolledToBottom" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        ยอมรับ PDPA
                                    </button>
                                </div>
                            </div>
                        </div>
                    </transition>

                    <p class="text-center text-xs text-white-dark">© {{ new Date().getFullYear() }} NEX Finance System. All Rights Reserved.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { ref, computed, onMounted, nextTick } from 'vue';

    useHead({ title: 'ลงทะเบียน - NEX Finance System' });
    definePageMeta({ layout: 'auth-layout' });

    const CONSENT_URL     = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/consent';
    const CONSENT_TX_URL  = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/consent-transaction';
    const REGISTER_URL    = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/createregister';

    const form = ref({
        title      : '',
        titleOther : '',
        firstname  : '',
        lastname   : '',
        email      : '',
        companyName: '',
        taxId      : '',
        phone      : '',
        position   : '',
        message    : '',
    });

    const isLoading    = ref(false);
    const errorMessage = ref('');
    const isSuccess    = ref(false);

    // ── PDPA ──────────────────────────────────────────────────────
    const pdpaConsent         = ref<any>(null);
    const showPdpaModal       = ref(false);
    const pdpaAccepted        = ref(false);
    const noaAccepted         = ref(false);
    const hasScrolledToBottom = ref(false);
    const pdpaScrollEl        = ref<HTMLElement | null>(null);

    const fetchPdpaConsent = async () => {
        try {
            const res  = await fetch(`${CONSENT_URL}?type=PDPA&active=true`);
            const json = await res.json();
            pdpaConsent.value = json.data?.[0] ?? null;
        } catch (e) {
            console.error('fetch PDPA consent error', e);
        }
    };

    const openPdpaModal = async () => {
        if (pdpaAccepted.value) {
            // Allow toggle off
            pdpaAccepted.value = false;
            return;
        }
        hasScrolledToBottom.value = false;
        showPdpaModal.value = true;
        await nextTick();
        // Check if content is short enough to not need scrolling
        if (pdpaScrollEl.value) {
            const el = pdpaScrollEl.value;
            if (el.scrollHeight <= el.clientHeight + 10) {
                hasScrolledToBottom.value = true;
            }
        }
    };

    const closePdpaModal = () => {
        showPdpaModal.value = false;
    };

    const acceptPdpa = () => {
        pdpaAccepted.value  = true;
        showPdpaModal.value = false;
    };

    const onPdpaScroll = () => {
        if (!pdpaScrollEl.value) return;
        const el = pdpaScrollEl.value;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
            hasScrolledToBottom.value = true;
        }
    };

    const recordConsentTransaction = async () => {
        if (!pdpaConsent.value) return;
        try {
            await fetch(CONSENT_TX_URL, {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({
                    email          : form.value.email.trim(),
                    tax_id         : form.value.taxId || null,
                    consent_type   : pdpaConsent.value.consent_type,
                    consent_version: pdpaConsent.value.consent_version,
                    consent_value  : true,
                }),
            });
        } catch (e) {
            console.error('consent transaction error', e);
        }
    };

    // ── Validation ────────────────────────────────────────────────
    const taxIdError = computed(() => {
        if (!form.value.taxId) return '';
        return /^\d{13}$/.test(form.value.taxId) ? '' : 'ต้องเป็นตัวเลข 13 หลัก';
    });

    // ── Submit ────────────────────────────────────────────────────
    const handleRegister = async () => {
        errorMessage.value = '';

        if (!pdpaAccepted.value) {
            errorMessage.value = 'กรุณายอมรับนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) ก่อน';
            return;
        }
        if (!noaAccepted.value) {
            errorMessage.value = 'กรุณายินยอมการเปิดเผยข้อมูลแก่สถาบันการเงินและพันธมิตร';
            return;
        }
        if (taxIdError.value) {
            errorMessage.value = taxIdError.value;
            return;
        }
        if (form.value.title === 'อื่นๆ' && !form.value.titleOther.trim()) {
            errorMessage.value = 'กรุณาระบุคำนำหน้า';
            return;
        }

        isLoading.value = true;

        try {
            const response = await fetch(REGISTER_URL, {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({
                    title      : form.value.title,
                    title_other: form.value.titleOther || null,
                    firstname  : form.value.firstname.trim(),
                    lastname   : form.value.lastname.trim(),
                    email      : form.value.email.trim(),
                    companyname: form.value.companyName.trim(),
                    tax_id     : form.value.taxId    || null,
                    phone      : form.value.phone    || null,
                    position   : form.value.position || null,
                    message    : form.value.message  || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                errorMessage.value = response.status === 409
                    ? 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น'
                    : data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
                return;
            }

            // Record consent transaction after successful registration
            await recordConsentTransaction();

            isSuccess.value = true;
        } catch {
            errorMessage.value = 'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
        } finally {
            isLoading.value = false;
        }
    };

    onMounted(fetchPdpaConsent);
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.pdpa-content :deep(h2) { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; }
.pdpa-content :deep(h3) { font-size: 1.05rem; font-weight: 600; margin: 0.75rem 0 0.4rem; }
.pdpa-content :deep(p)  { margin-bottom: 0.6rem; line-height: 1.7; color: #4a5568; }
.pdpa-content :deep(ul), .pdpa-content :deep(ol) { padding-left: 1.5rem; margin-bottom: 0.6rem; }
.pdpa-content :deep(li) { margin-bottom: 0.25rem; color: #4a5568; }
.pdpa-content :deep(strong) { font-weight: 700; color: #1a1f36; }
</style>
