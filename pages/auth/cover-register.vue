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
                <div class="relative hidden w-full items-center justify-center bg-[linear-gradient(225deg,#16234d_0%,#2c5fe0_100%)] p-5 lg:inline-flex lg:max-w-[835px] xl:-ms-28 ltr:xl:skew-x-[14deg] rtl:xl:skew-x-[-14deg]">
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
                        <NuxtLink to="/">
                            <NexLogo size="lg" />
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
                                        <label class="text-sm font-medium">เลขนิติบุคคล</label>
                                        <input
                                            v-model="form.taxId"
                                            type="text"
                                            placeholder="เลขนิติบุคคล 13 หลัก"
                                            class="form-input mt-1 placeholder:text-white-dark"
                                            maxlength="13"
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

                                <!-- Submit -->
                                <button
                                    type="submit"
                                    class="btn w-full border-0 py-3 text-base font-bold text-white shadow-[0_10px_20px_-10px_rgba(44,95,224,0.5)] transition-all hover:opacity-90 disabled:opacity-60"
                                    style="background: linear-gradient(90deg, #4361ee 0%, #22c55e 100%)"
                                    :disabled="isLoading"
                                >
                                    <span v-if="isLoading" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent ltr:mr-2 rtl:ml-2"></span>
                                    {{ isLoading ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูล และรอรับการติดต่อกลับ' }}
                                </button>

                                <p class="text-center text-sm dark:text-white">
                                     
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
                                        <p class="text-sm text-white-dark">คุณต้น · 089-185-8327</p>
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
                                        <p class="text-sm text-white-dark">nexfinance@gec.co.th</p>
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

                    <p class="text-center text-xs text-white-dark">© {{ new Date().getFullYear() }} General Electronic Commerce Services Co., Ltd.   All Rights Reserved.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { ref, computed } from 'vue';

    useHead({ title: 'ลงทะเบียน - NEX Finance System' });
    definePageMeta({ layout: 'auth-layout' });

    const REGISTER_URL     = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/createregister';
    const NOTIFICATION_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/send-notification';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95eW5rcGdqbWZudHJycm5yenRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTgyOTgsImV4cCI6MjA5MzA3NDI5OH0.hRZRTB_OdVYK617rXg6Qg3ySeXF91UdYELCKxaeeSxs';

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

    // ── Validation ────────────────────────────────────────────────
    const taxIdError = computed(() => {
        if (!form.value.taxId) return '';
        return /^\d{13}$/.test(form.value.taxId) ? '' : 'ต้องเป็นตัวเลข 13 หลัก';
    });

    // ── Submit ────────────────────────────────────────────────────
    const handleRegister = async () => {
        errorMessage.value = '';

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

            // ส่ง email แจ้งเตือนไปยัง nexfinance@gec.co.th
            const f = form.value;
            const fullName = `${f.title !== 'อื่นๆ' ? f.title : f.titleOther} ${f.firstname} ${f.lastname}`.trim();
            fetch(NOTIFICATION_URL, {
                method : 'POST',
                headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
                body   : JSON.stringify({
                    title             : `[NEX Finance] ติดต่อใหม่ — ${f.companyName || fullName}`,
                    notification_body : `ผู้ติดต่อ: ${fullName} | บริษัท: ${f.companyName} | โทร: ${f.phone} | อีเมล: ${f.email}`,
                    email_to          : 'nexfinance@gec.co.th',
                    email_subject     : '[NEX Finance] Customer Interested – Please Follow Up',
                    email_html        : `
                        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#14181F">
                          <div style="background:#14467F;padding:24px 32px;border-radius:12px 12px 0 0">
                            <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.03em">NEX<span style="color:#5B8DEF;font-weight:500">Finance</span></span>
                            <p style="color:rgba(255,255,255,.75);font-size:13px;margin:6px 0 0">คำขอติดต่อจาก NEX Finance</p>
                          </div>
                          <div style="background:#F4F6FA;padding:28px 32px;border-radius:0 0 12px 12px;border:1px solid #E7EAF0;border-top:none">
                            <h2 style="font-size:16px;font-weight:700;color:#14467F;margin:0 0 16px">ข้อมูลผู้ติดต่อ</h2>
                            <table style="width:100%;border-collapse:collapse;font-size:14px">
                              <tr><td style="padding:8px 0;color:#5B6573;width:40%">ชื่อ-นามสกุล</td><td style="padding:8px 0;font-weight:600">${fullName}</td></tr>
                              <tr style="border-top:1px solid #E7EAF0"><td style="padding:8px 0;color:#5B6573">อีเมล</td><td style="padding:8px 0;font-weight:600"><a href="mailto:${f.email}" style="color:#14467F">${f.email}</a></td></tr>
                              <tr style="border-top:1px solid #E7EAF0"><td style="padding:8px 0;color:#5B6573">เบอร์โทร</td><td style="padding:8px 0;font-weight:600">${f.phone || '-'}</td></tr>
                              <tr style="border-top:1px solid #E7EAF0"><td style="padding:8px 0;color:#5B6573">บริษัท</td><td style="padding:8px 0;font-weight:600">${f.companyName || '-'}</td></tr>
                              <tr style="border-top:1px solid #E7EAF0"><td style="padding:8px 0;color:#5B6573">เลขนิติบุคคล</td><td style="padding:8px 0;font-weight:600">${f.taxId || '-'}</td></tr>
                              <tr style="border-top:1px solid #E7EAF0"><td style="padding:8px 0;color:#5B6573">ตำแหน่ง</td><td style="padding:8px 0;font-weight:600">${f.position || '-'}</td></tr>
                            </table>
                            ${f.message ? `
                            <h2 style="font-size:16px;font-weight:700;color:#14467F;margin:24px 0 12px">ข้อความ/คำถาม</h2>
                            <div style="background:#fff;border-radius:8px;border:1px solid #E7EAF0;padding:16px;font-size:14px;line-height:1.6">${f.message}</div>` : ''}
                            <div style="margin-top:24px;padding:16px;background:#fff;border-radius:10px;border:1px solid #E7EAF0;font-size:12px;color:#8A929E;line-height:1.5">
                              ส่งอัตโนมัติ (no-reply) ให้ติดต่อลูกค้าตามรายละเอียดด้านบน
                            </div>
                          </div>
                        </div>`,
                }),
            }).catch(() => {});

            isSuccess.value = true;
        } catch {
            errorMessage.value = 'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
        } finally {
            isLoading.value = false;
        }
    };


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
