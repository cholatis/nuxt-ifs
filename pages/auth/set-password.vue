<template>
    <div>
        <div class="absolute inset-0">
            <img src="/assets/images/auth/bg-gradient.png" alt="image" class="h-full w-full object-cover" />
        </div>
        <div class="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
            <img src="/assets/images/auth/coming-soon-object1.png" alt="image" class="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
            <img src="/assets/images/auth/coming-soon-object2.png" alt="image" class="absolute left-24 top-0 h-40 md:left-[30%]" />
            <img src="/assets/images/auth/coming-soon-object3.png" alt="image" class="absolute right-0 top-0 h-[300px]" />
            <img src="/assets/images/auth/polygon-object.svg"      alt="image" class="absolute bottom-0 end-[28%]" />

            <div class="relative flex w-full max-w-[1502px] flex-col justify-between overflow-hidden rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px] lg:flex-row lg:gap-10 xl:gap-0">

                <!-- Left Banner -->
                <div class="relative hidden w-full items-center justify-center bg-[linear-gradient(225deg,rgba(239,18,98,1)_0%,rgba(67,97,238,1)_100%)] p-5 lg:inline-flex lg:max-w-[835px] xl:-ms-28 ltr:xl:skew-x-[14deg] rtl:xl:skew-x-[-14deg]">
                    <div class="absolute inset-y-0 w-8 from-primary/10 via-transparent to-transparent ltr:-right-10 ltr:bg-gradient-to-r rtl:-left-10 rtl:bg-gradient-to-l xl:w-16 ltr:xl:-right-20 rtl:xl:-left-20"></div>
                    <div class="ltr:xl:-skew-x-[14deg] rtl:xl:skew-x-[14deg]">
                        <NuxtLink to="/" class="ms-10 block w-48 lg:w-72">
                            <img src="/assets/images/auth/logo-white.svg" alt="Logo" class="w-full" />
                        </NuxtLink>
                        <div class="mt-24 hidden w-full max-w-[430px] lg:block">
                            <img src="/assets/images/auth/reset-password.svg" alt="Set Password" class="w-full" />
                        </div>
                    </div>
                </div>

                <!-- Right Form -->
                <div class="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                    <div class="flex w-full max-w-[440px] items-center gap-2 lg:absolute lg:end-6 lg:top-6 lg:max-w-full">
                        <NuxtLink to="/" class="block lg:hidden">
                            <img src="/assets/images/logo.svg" alt="Logo" class="mx-auto w-8" />
                        </NuxtLink>
                    </div>

                    <div class="w-full max-w-[440px]">

                        <!-- Error: link expired/invalid -->
                        <div v-if="linkError" class="text-center">
                            <div class="mb-6 flex justify-center">
                                <div class="flex h-20 w-20 items-center justify-center rounded-full bg-danger/20">
                                    <svg class="h-10 w-10 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                            </div>
                            <h2 class="mb-2 text-2xl font-bold text-dark dark:text-white">ลิงก์หมดอายุแล้ว</h2>
                            <p class="mb-6 text-white-dark">ลิงก์สำหรับตั้งรหัสผ่านนี้หมดอายุหรือใช้ไปแล้ว กรุณาติดต่อผู้ดูแลระบบเพื่อขอลิงก์ใหม่</p>
                            <NuxtLink to="/auth/cover-login" class="btn btn-primary w-full">
                                กลับสู่หน้าเข้าสู่ระบบ
                            </NuxtLink>
                        </div>

                        <!-- Success -->
                        <div v-else-if="success" class="text-center">
                            <div class="mb-6 flex justify-center">
                                <div class="flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
                                    <svg class="h-10 w-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <h2 class="mb-2 text-2xl font-bold text-dark dark:text-white">ตั้งรหัสผ่านสำเร็จ!</h2>
                            <p class="mb-6 text-white-dark">รหัสผ่านของคุณถูกตั้งค่าเรียบร้อยแล้ว กำลังพาไปหน้าเข้าสู่ระบบ...</p>
                            <div class="mx-auto h-1.5 w-40 overflow-hidden rounded-full bg-gray-200">
                                <div class="h-full animate-[progress_2s_linear_forwards] bg-primary rounded-full"></div>
                            </div>
                        </div>

                        <!-- Set Password Form -->
                        <template v-else-if="sessionReady">
                            <div class="mb-10">
                                <h1 class="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">ตั้งรหัสผ่าน</h1>
                                <p class="text-base font-bold leading-normal text-white-dark">
                                    ยินดีต้อนรับ <span class="text-primary">{{ userEmail }}</span><br/>
                                    กรุณาตั้งรหัสผ่านสำหรับเข้าสู่ระบบ NEX Finance
                                </p>
                            </div>

                            <form @submit.prevent="submitPassword" class="space-y-5">
                                <!-- Email (display only) -->
                                <div>
                                    <label class="dark:text-white">Email (Username)</label>
                                    <div class="relative mt-1">
                                        <input type="email" :value="userEmail" readonly
                                            class="form-input ps-10 bg-gray-50 dark:bg-dark/30 cursor-not-allowed" />
                                        <span class="absolute start-4 top-1/2 -translate-y-1/2 text-white-dark">
                                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>

                                <!-- New Password -->
                                <div>
                                    <label class="dark:text-white">รหัสผ่านใหม่ <span class="text-danger">*</span></label>
                                    <div class="relative mt-1">
                                        <input
                                            :type="showPassword ? 'text' : 'password'"
                                            v-model="password"
                                            class="form-input ps-10 pe-10"
                                            placeholder="อย่างน้อย 8 ตัวอักษร"
                                            required minlength="8"
                                        />
                                        <span class="absolute start-4 top-1/2 -translate-y-1/2 text-white-dark">
                                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </span>
                                        <button type="button" @click="showPassword = !showPassword"
                                            class="absolute end-4 top-1/2 -translate-y-1/2 text-white-dark hover:text-primary">
                                            <svg v-if="showPassword" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                                            </svg>
                                            <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <!-- Strength bar -->
                                    <div class="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                                        <div :class="strengthBarClass" :style="{ width: strengthPercent }" class="h-full rounded-full transition-all duration-300"></div>
                                    </div>
                                    <p class="mt-1 text-xs" :class="strengthTextClass">{{ strengthLabel }}</p>
                                </div>

                                <!-- Confirm Password -->
                                <div>
                                    <label class="dark:text-white">ยืนยันรหัสผ่าน <span class="text-danger">*</span></label>
                                    <div class="relative mt-1">
                                        <input
                                            :type="showConfirm ? 'text' : 'password'"
                                            v-model="confirmPassword"
                                            class="form-input ps-10 pe-10"
                                            :class="{ 'border-danger focus:border-danger': confirmPassword && password !== confirmPassword }"
                                            placeholder="กรอกรหัสผ่านอีกครั้ง"
                                            required
                                        />
                                        <span class="absolute start-4 top-1/2 -translate-y-1/2 text-white-dark">
                                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </span>
                                        <button type="button" @click="showConfirm = !showConfirm"
                                            class="absolute end-4 top-1/2 -translate-y-1/2 text-white-dark hover:text-primary">
                                            <svg v-if="showConfirm" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                                            </svg>
                                            <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p v-if="confirmPassword && password !== confirmPassword" class="mt-1 text-xs text-danger">
                                        รหัสผ่านไม่ตรงกัน
                                    </p>
                                    <p v-else-if="confirmPassword && password === confirmPassword" class="mt-1 text-xs text-success">
                                        ✓ รหัสผ่านตรงกัน
                                    </p>
                                </div>

                                <div v-if="formError" class="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                                    {{ formError }}
                                </div>

                                <button type="submit"
                                    class="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
                                    :disabled="isSubmitting || password !== confirmPassword || password.length < 8">
                                    <span v-if="isSubmitting" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent"></span>
                                    {{ isSubmitting ? 'กำลังบันทึก...' : 'ตั้งรหัสผ่านและเข้าสู่ระบบ' }}
                                </button>
                            </form>
                        </template>

                        <!-- Loading / parsing token -->
                        <div v-else class="text-center py-12">
                            <span class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-l-transparent"></span>
                            <p class="mt-4 text-white-dark">กำลังตรวจสอบลิงก์...</p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';

useHead({ title: 'ตั้งรหัสผ่าน - NEX Finance' });
definePageMeta({ layout: 'auth' });

const { $supabase } = useNuxtApp();
const router = useRouter();

// ── State ─────────────────────────────────────────────────────
const sessionReady    = ref(false);
const linkError       = ref(false);
const success         = ref(false);
const isSubmitting    = ref(false);
const formError       = ref('');
const userEmail       = ref('');

const password        = ref('');
const confirmPassword = ref('');
const showPassword    = ref(false);
const showConfirm     = ref(false);

// ── Password strength ──────────────────────────────────────────
const strength = computed(() => {
    const p = password.value;
    let score = 0;
    if (p.length >= 8)  score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
});

const strengthPercent  = computed(() => `${Math.min(100, strength.value * 20)}%`);
const strengthBarClass = computed(() => {
    if (strength.value <= 1) return 'bg-danger';
    if (strength.value <= 2) return 'bg-warning';
    if (strength.value <= 3) return 'bg-info';
    return 'bg-success';
});
const strengthLabel = computed(() => {
    if (!password.value) return '';
    if (strength.value <= 1) return 'อ่อนมาก';
    if (strength.value <= 2) return 'อ่อน';
    if (strength.value <= 3) return 'ปานกลาง';
    if (strength.value <= 4) return 'แข็งแรง';
    return 'แข็งแรงมาก';
});
const strengthTextClass = computed(() => {
    if (strength.value <= 1) return 'text-danger';
    if (strength.value <= 2) return 'text-warning';
    if (strength.value <= 3) return 'text-info';
    return 'text-success';
});

// ── Parse token on mount ───────────────────────────────────────
onMounted(async () => {
    await nextTick();

    // ── NEW FLOW: token in query params (?token=...&type=recovery)
    // Email link goes to localhost URL — email scanners cannot follow localhost,
    // so the one-time OTP is NOT consumed before the user clicks it.
    const queryParams  = new URLSearchParams(window.location.search);
    const tokenHash    = queryParams.get('token');
    const tokenType    = queryParams.get('type');

    if (tokenHash && (tokenType === 'recovery' || tokenType === 'invite')) {
        // Clean URL immediately
        window.history.replaceState(null, '', window.location.pathname);

        const { data, error: otpErr } = await ($supabase as any).auth.verifyOtp({
            token_hash: tokenHash,
            type      : tokenType as 'recovery' | 'invite',
        });

        if (otpErr || !data.session) {
            linkError.value = true;
            return;
        }

        // verifyOtp returns the session but does NOT always store it in the client.
        // Explicitly set it so updateUser() can use it later.
        await ($supabase as any).auth.setSession({
            access_token : data.session.access_token,
            refresh_token: data.session.refresh_token,
        });

        userEmail.value    = data.session.user?.email ?? '';
        sessionReady.value = true;
        return;
    }

    // ── OLD FLOW: tokens in URL hash (fallback)
    const hash   = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const error        = params.get('error');
    const errorCode    = params.get('error_code');
    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (error || errorCode) {
        linkError.value = true;
        return;
    }

    if (!accessToken || !refreshToken) {
        const { data: { session } } = await ($supabase as any).auth.getSession();
        if (session && session.user) {
            userEmail.value    = session.user.email ?? '';
            sessionReady.value = true;
        } else {
            linkError.value = true;
        }
        return;
    }

    const { data, error: sessionErr } = await ($supabase as any).auth.setSession({
        access_token : accessToken,
        refresh_token: refreshToken,
    });

    if (sessionErr || !data.session) {
        linkError.value = true;
        return;
    }

    userEmail.value    = data.session.user?.email ?? '';
    sessionReady.value = true;
    window.history.replaceState(null, '', window.location.pathname);
});

const ACTIVATE_URL = 'https://oyynkpgjmfntrrrnrzto.supabase.co/functions/v1/activateprofile';

// ── Submit new password ────────────────────────────────────────
const submitPassword = async () => {
    if (password.value !== confirmPassword.value) return;
    if (password.value.length < 8) return;

    isSubmitting.value = true;
    formError.value    = '';

    try {
        // 1. Set the new password
        const { error: pwErr } = await ($supabase as any).auth.updateUser({
            password: password.value,
        });
        if (pwErr) throw new Error(pwErr.message);

        // 2. Get current access token and call edge function to activate profile
        //    (uses service role internally to bypass RLS)
        const { data: { session } } = await ($supabase as any).auth.getSession();
        if (session?.access_token) {
            const res = await fetch(ACTIVATE_URL, {
                method : 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type' : 'application/json',
                },
            });
            if (!res.ok) {
                const json = await res.json();
                console.error('activateprofile error:', json);
            }
        }

        success.value = true;

        // 3. Sign out and redirect to login after 2s
        setTimeout(async () => {
            await ($supabase as any).auth.signOut();
            router.push('/auth/cover-login');
        }, 2000);
    } catch (err: any) {
        formError.value = err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style scoped>
.btn-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}
.btn-gradient:hover:not(:disabled) {
    background: linear-gradient(135deg, #5a6fd8 0%, #6a3f90 100%);
}
.btn-gradient:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

@keyframes progress {
    from { width: 0%; }
    to   { width: 100%; }
}
</style>
