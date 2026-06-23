<template>
    <div>
        <div class="absolute inset-0">
            <img src="/assets/images/auth/bg-gradient.png" alt="image" class="h-full w-full object-cover" />
        </div>
        <div class="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
            <img src="/assets/images/auth/coming-soon-object1.png" alt="image" class="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
            <img src="/assets/images/auth/coming-soon-object2.png" alt="image" class="absolute left-24 top-0 h-40" />
            <img src="/assets/images/auth/coming-soon-object3.png" alt="image" class="absolute right-0 top-0 h-[300px]" />
            <img src="/assets/images/auth/polygon-object.svg" alt="image" class="absolute bottom-0 end-[28%]" />
            
            <div class="relative flex w-full max-w-[1502px] flex-col justify-between overflow-hidden rounded-2xl bg-white/60 text-black backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px] lg:flex-row lg:gap-10 lg:gap-y-0">
                <!-- Left Panel -->
                <div class="relative hidden w-full items-center justify-center bg-[linear-gradient(225deg,#16234d_0%,#2c5fe0_100%)] p-5 lg:inline-flex lg:max-w-[835px] ltr:xl:skew-x-[10deg] rtl:xl:skew-x-[-10deg]">
                    <div class="absolute inset-y-0 w-full h-full bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat opacity-20"></div>
                    <div class="relative z-10 w-full max-w-[580px] text-white ltr:xl:-skew-x-[10deg] rtl:xl:skew-x-[10deg] lg:px-8">
                        <NuxtLink to="/" class="mb-10 block">
                            <NexLogo dark size="lg" />
                        </NuxtLink>
                        <h2 class="text-4xl font-black leading-tight mb-4">IFS Customer Portal</h2>
                        <p class="text-lg font-medium opacity-80 mb-8">ยื่นคำขอวงเงินสินเชื่อแฟคตอริ่ง (Factoring) สำหรับธุรกิจของคุณ</p>
                        <div class="mt-auto">
                            <img src="/assets/images/auth/register.svg" alt="Illustration" class="w-full max-w-[430px] mx-auto" />
                        </div>
                    </div>
                </div>

                <!-- Right Panel (Form) -->
                <div class="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-16 lg:max-w-[667px]">
                    <div class="flex w-full max-w-[440px] items-center gap-2 lg:absolute lg:end-6 lg:top-6 lg:max-w-full">
                        <NuxtLink to="/" class="block lg:hidden">
                            <NexLogo size="lg" />
                        </NuxtLink>
                        <div class="dropdown ms-auto w-max">
                            <!-- Language dropdown if needed -->
                        </div>
                    </div>
                    
                    <div class="w-full max-w-[440px] lg:mt-16">
                        <div class="mb-10 text-center lg:text-start">
                            <h2 class="text-3xl font-black !leading-snug text-primary md:text-4xl">Create IFS Account</h2>
                            <p class="text-base font-bold leading-normal text-white-dark">กรอกข้อมูลเพื่อเริ่มต้นคำขอวงเงินสินเชื่อ</p>
                        </div>

                        <!-- Stepper Indicators -->
                        <div class="flex items-center justify-center lg:justify-start gap-4 mb-10">
                            <div v-for="(step, i) in steps" :key="i" class="flex items-center gap-2">
                                <div :class="stepCircleClass(i)">{{ i + 1 }}</div>
                                <span :class="stepLabelClass(i)">{{ step.title }}</span>
                                <div v-if="i < steps.length - 1" class="hidden sm:block w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
                            </div>
                        </div>

                        <!-- Step 1: Company Info -->
                        <div v-if="currentStep === 0" class="space-y-5">
                            <div>
                                <label for="companyName">Company Name <span class="text-danger">*</span></label>
                                <input id="companyName" v-model="form.companyName" type="text" class="form-input" placeholder="Enter company name" />
                                <span v-if="stepErrors.companyName" class="text-xs text-red-500 mt-1">{{ stepErrors.companyName }}</span>
                            </div>
                            <div>
                                <label for="taxId">เลขนิติบุคคล (13 หลัก)</label>
                                <input id="taxId" v-model="form.taxId" type="text" class="form-input" placeholder="Enter 13-digit tax ID" maxlength="13" />
                                <span v-if="stepErrors.taxId" class="text-xs text-red-500 mt-1">{{ stepErrors.taxId }}</span>
                            </div>
                            <div>
                                <label for="businessType">Business Type <span class="text-danger">*</span></label>
                                <select id="businessType" v-model="form.businessType" class="form-select">
                                    <option :value="null">Select Business Type</option>
                                    <option value="Manufacturing">Manufacturing</option>
                                    <option value="Trade">Trade</option>
                                    <option value="Services">Services</option>
                                    <option value="Contractor">Contractor</option>
                                    <option value="Others">Others</option>
                                </select>
                                <span v-if="stepErrors.businessType" class="text-xs text-red-500 mt-1">{{ stepErrors.businessType }}</span>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label for="requestedAmount">Requested Amount (THB) <span class="text-danger">*</span></label>
                                    <input id="requestedAmount" v-model="form.requestedAmount" type="number" class="form-input" placeholder="0.00" />
                                    <span v-if="stepErrors.requestedAmount" class="text-xs text-red-500 mt-1">{{ stepErrors.requestedAmount }}</span>
                                </div>
                                <div>
                                    <label for="buyer">Buyer / Main Customers <span class="text-danger">*</span></label>
                                    <input id="buyer" v-model="form.buyer" type="text" class="form-input" placeholder="Enter main customers" />
                                    <span v-if="stepErrors.buyer" class="text-xs text-red-500 mt-1">{{ stepErrors.buyer }}</span>
                                </div>
                            </div>
                            <button @click="validateStep1" class="btn btn-gradient w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(44,95,224,0.44)] mt-6">
                                Next Step
                            </button>
                        </div>

                        <!-- Step 2: Contact Info -->
                        <div v-if="currentStep === 1" class="space-y-5">
                            <div>
                                <label for="contactName">Contact Name <span class="text-danger">*</span></label>
                                <input id="contactName" v-model="form.contactName" type="text" class="form-input" placeholder="Enter contact person name" />
                                <span v-if="stepErrors.contactName" class="text-xs text-red-500 mt-1">{{ stepErrors.contactName }}</span>
                            </div>
                            <div>
                                <label for="phone">Phone Number <span class="text-danger">*</span></label>
                                <input id="phone" v-model="form.phone" type="text" class="form-input" placeholder="Enter 10-digit phone number" maxlength="10" />
                                <span v-if="stepErrors.phone" class="text-xs text-red-500 mt-1">{{ stepErrors.phone }}</span>
                            </div>
                            <div>
                                <label for="email">Email Address <span class="text-danger">*</span></label>
                                <input id="email" v-model="form.email" type="email" class="form-input" placeholder="Enter work email" />
                                <span v-if="stepErrors.email" class="text-xs text-red-500 mt-1">{{ stepErrors.email }}</span>
                                <div class="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 p-3 text-xs text-blue-700 dark:text-blue-300">
                                    <icon-info-circle class="w-4 h-4 shrink-0" />
                                    <span>ระบบจะส่ง One-Time Password (OTP) ไปยัง email นี้สำหรับการ login ครั้งแรก</span>
                                </div>
                            </div>
                            <div class="flex gap-4 mt-6">
                                <button @click="currentStep--" class="btn btn-outline-secondary w-full uppercase">Back</button>
                                <button @click="validateStep2" class="btn btn-gradient w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(44,95,224,0.44)]">
                                    Next Step
                                </button>
                            </div>
                        </div>

                        <!-- Step 3: Confirm -->
                        <div v-if="currentStep === 2" class="space-y-5">
                            <div class="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-5 mb-5 shadow-inner">
                                <h6 class="font-bold text-base mb-4 text-primary">Registration Summary</h6>
                                <div class="space-y-3">
                                    <div class="grid grid-cols-2 gap-x-2 text-sm">
                                        <span class="text-gray-500">Company:</span>
                                        <span class="font-semibold text-end">{{ form.companyName }}</span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-x-2 text-sm">
                                        <span class="text-gray-500">Tax ID:</span>
                                        <span class="font-semibold text-end">{{ form.taxId }}</span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-x-2 text-sm">
                                        <span class="text-gray-500">Business Type:</span>
                                        <span class="font-semibold text-end">{{ form.businessType }}</span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-x-2 text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                                        <span class="text-gray-500">Amount:</span>
                                        <span class="font-bold text-primary text-end">{{ formatAmount(form.requestedAmount) }} THB</span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-x-2 text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                                        <span class="text-gray-500">Contact:</span>
                                        <span class="font-semibold text-end">{{ form.contactName }}</span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-x-2 text-sm">
                                        <span class="text-gray-500">Email:</span>
                                        <span class="font-semibold text-end">{{ form.email }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="registrationError" class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                                <div class="font-semibold mb-1 flex items-center gap-2">
                                    <icon-circle-check class="w-4 h-4" />
                                    เกิดข้อผิดพลาด:
                                </div>
                                <div class="opacity-90">{{ registrationError }}</div>
                            </div>

                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" v-model="form.acceptTerms" class="form-checkbox" />
                                <span class="text-sm text-gray-600 dark:text-gray-400">
                                    ฉันยอมรับ <a href="#" class="text-primary underline">เงื่อนไขการใช้งาน</a> และ <a href="#" class="text-primary underline">นโยบายความเป็นส่วนตัว</a>
                                </span>
                            </label>

                            <div class="flex gap-4 mt-8">
                                <button @click="currentStep--" class="btn btn-outline-secondary w-full uppercase" :disabled="isSubmitting">Back</button>
                                <button @click="onSubmit" class="btn btn-gradient w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(44,95,224,0.44)]" :disabled="!form.acceptTerms || isSubmitting">
                                    <span v-if="isSubmitting" class="flex items-center gap-2">
                                        <icon-loader class="animate-spin w-4 h-4" /> กำลังส่ง...
                                    </span>
                                    <span v-else>ส่งข้อมูลและนัดหมาย</span>
                                </button>
                            </div>
                        </div>

                        <div class="mt-10 text-center">
                            <p class="text-base font-semibold">
                                                             </p>
                        </div>
                    </div>
                    <div class="mt-auto text-center text-xs text-white-dark">
                        &copy; {{ new Date().getFullYear() }} IFS Factoring Portal. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';

    definePageMeta({
        layout: 'auth-layout',
    });

    useHead({ title: 'Register — IFS Factoring Portal' });

    const currentStep = ref(0);
    const isSubmitting = ref(false);
    const registrationError = ref('');

    const steps = [
        { title: 'Company' },
        { title: 'Contact' },
        { title: 'Confirm' },
    ];

    const form = ref({
        companyName: '',
        taxId: '',
        businessType: null as string | null,
        requestedAmount: null as number | null,
        buyer: '',
        contactName: '',
        phone: '',
        email: '',
        acceptTerms: false,
    });

    const stepErrors = ref<Record<string, string>>({});

    const formatAmount = (v: number | null) => {
        if (v === null) return '0';
        return Number(v).toLocaleString('th-TH');
    };

    const validateStep1 = () => {
        stepErrors.value = {};
        if (!form.value.companyName) stepErrors.value.companyName = 'Required';
        if (form.value.taxId && form.value.taxId.length !== 13) stepErrors.value.taxId = 'Must be 13 digits';
        else if (form.value.taxId && !/^\d+$/.test(form.value.taxId)) stepErrors.value.taxId = 'Numbers only';
        if (!form.value.businessType) stepErrors.value.businessType = 'Required';
        if (!form.value.requestedAmount) stepErrors.value.requestedAmount = 'Required';
        if (!form.value.buyer) stepErrors.value.buyer = 'Required';

        if (Object.keys(stepErrors.value).length === 0) {
            currentStep.value++;
        }
    };

    const validateStep2 = () => {
        stepErrors.value = {};
        if (!form.value.contactName) stepErrors.value.contactName = 'Required';
        if (!form.value.phone) stepErrors.value.phone = 'Required';
        else if (form.value.phone.length !== 10) stepErrors.value.phone = 'Must be 10 digits';
        else if (!/^\d+$/.test(form.value.phone)) stepErrors.value.phone = 'Numbers only';
        if (!form.value.email) stepErrors.value.email = 'Required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) stepErrors.value.email = 'Invalid email';

        if (Object.keys(stepErrors.value).length === 0) {
            currentStep.value++;
        }
    };

    const SUPABASE_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co';
    const SUPABASE_REGISTER_URL = '/api/supabase/register';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0b3l1cmFhY25neXZnZHZ4dmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDMxNDAsImV4cCI6MjA3NzM3MjQ2OX0.zbWnxWTFTwzjRurN6QUYEXEHqfRLtMSjBiPJF1S8UDU';

    const onSubmit = async () => {
        if (!form.value.acceptTerms || isSubmitting.value) return;
        isSubmitting.value = true;
        registrationError.value = '';

        try {
            const res = await fetch(SUPABASE_REGISTER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                    apikey: SUPABASE_ANON_KEY,
                },
                body: JSON.stringify(form.value),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                registrationError.value = data.error || 'Registration failed';
                return;
            }

            // ส่ง email แจ้งเตือนไปยัง NexFinance@gec.co.th ผ่าน send-notification Edge Function
            const f = form.value;
            const amountFormatted = Number(f.requestedAmount).toLocaleString('th-TH');
            await $fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
                body: {
                    title: `[NEX Finance] คำขอสินเชื่อใหม่ — ${f.companyName}`,
                    notification_body: `บริษัท: ${f.companyName} | วงเงิน: ${amountFormatted} THB | ผู้ติดต่อ: ${f.contactName} | โทร: ${f.phone} | อีเมล: ${f.email}`,
                    email_to: 'NexFinance@gec.co.th',
                    email_subject: `[NEX Finance] คำขอสินเชื่อใหม่ — ${f.companyName}`,
                    email_html: `
                        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#14181F">
                          <div style="background:#14467F;padding:24px 32px;border-radius:12px 12px 0 0">
                            <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.03em">NEX<span style="color:#5B8DEF;font-weight:500">Finance</span></span>
                            <p style="color:rgba(255,255,255,.75);font-size:13px;margin:6px 0 0">คำขอสินเชื่อแฟคเตอริ่งใหม่จากพอร์ทัล</p>
                          </div>
                          <div style="background:#F4F6FA;padding:28px 32px;border-radius:0 0 12px 12px;border:1px solid #E7EAF0;border-top:none">
                            <h2 style="font-size:16px;font-weight:700;color:#14467F;margin:0 0 16px">ข้อมูลบริษัท</h2>
                            <table style="width:100%;border-collapse:collapse;font-size:14px">
                              <tr><td style="padding:8px 0;color:#5B6573;width:40%">ชื่อบริษัท</td><td style="padding:8px 0;font-weight:600">${f.companyName}</td></tr>
                              <tr style="border-top:1px solid #E7EAF0"><td style="padding:8px 0;color:#5B6573">เลขที่ผู้เสียภาษี</td><td style="padding:8px 0;font-weight:600">${f.taxId}</td></tr>
                              <tr style="border-top:1px solid #E7EAF0"><td style="padding:8px 0;color:#5B6573">ประเภทธุรกิจ</td><td style="padding:8px 0;font-weight:600">${f.businessType}</td></tr>
                              <tr style="border-top:1px solid #E7EAF0"><td style="padding:8px 0;color:#5B6573">ลูกค้าหลัก (Buyer)</td><td style="padding:8px 0;font-weight:600">${f.buyer}</td></tr>
                              <tr style="border-top:1px solid #E7EAF0"><td style="padding:8px 0;color:#5B6573">วงเงินที่ขอ</td><td style="padding:8px 0;font-weight:700;font-size:16px;color:#14467F">${amountFormatted} THB</td></tr>
                            </table>
                            <h2 style="font-size:16px;font-weight:700;color:#14467F;margin:24px 0 16px">ข้อมูลผู้ติดต่อ</h2>
                            <table style="width:100%;border-collapse:collapse;font-size:14px">
                              <tr><td style="padding:8px 0;color:#5B6573;width:40%">ชื่อผู้ติดต่อ</td><td style="padding:8px 0;font-weight:600">${f.contactName}</td></tr>
                              <tr style="border-top:1px solid #E7EAF0"><td style="padding:8px 0;color:#5B6573">เบอร์โทรศัพท์</td><td style="padding:8px 0;font-weight:600">${f.phone}</td></tr>
                              <tr style="border-top:1px solid #E7EAF0"><td style="padding:8px 0;color:#5B6573">อีเมล</td><td style="padding:8px 0;font-weight:600"><a href="mailto:${f.email}" style="color:#14467F">${f.email}</a></td></tr>
                            </table>
                            <div style="margin-top:24px;padding:16px;background:#fff;border-radius:10px;border:1px solid #E7EAF0;font-size:12px;color:#8A929E;line-height:1.5">
                              ส่งโดยอัตโนมัติจาก IFS Customer Portal · NEX Finance<br>
                              Reply ไปยัง <a href="mailto:${f.email}" style="color:#14467F">${f.email}</a> เพื่อติดต่อกลับผู้สมัคร
                            </div>
                          </div>
                        </div>`,
                },
            }).catch(() => {});

            navigateTo('/auth/cover-login');
        } catch (err) {
            registrationError.value = 'Network error — please try again';
        } finally {
            isSubmitting.value = false;
        }
    };

    const stepCircleClass = (i: number) => [
        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
        i < currentStep.value
            ? 'bg-green-500 text-white'
            : i === currentStep.value
            ? 'bg-primary text-white'
            : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
    ];

    const stepLabelClass = (i: number) => [
        'text-xs font-semibold hidden sm:block',
        i === currentStep.value ? 'text-primary' : 'text-gray-400'
    ];
</script>

<style scoped>
    .form-input, .form-select, .form-checkbox {
        @apply transition-all duration-300 focus:border-primary focus:ring-primary;
    }
</style>
