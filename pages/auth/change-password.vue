<template>
    <div>
        <div class="absolute inset-0">
            <img src="/assets/images/auth/bg-gradient.png" alt="image" class="h-full w-full object-cover" />
        </div>

        <div class="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
            <img src="/assets/images/auth/coming-soon-object1.png" alt="image" class="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
            <img src="/assets/images/auth/coming-soon-object3.png" alt="image" class="absolute right-0 top-0 h-[300px]" />

            <div class="relative w-full max-w-[480px] rounded-2xl bg-white/90 backdrop-blur-lg p-8 shadow-2xl dark:bg-black/60">

                <!-- Icon -->
                <div class="mb-6 flex justify-center">
                    <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <svg class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>

                <h1 class="mb-1 text-center text-2xl font-extrabold text-dark dark:text-white">ตั้งรหัสผ่านใหม่</h1>
                <p class="mb-6 text-center text-sm text-white-dark">เพื่อความปลอดภัย กรุณาตั้งรหัสผ่านใหม่ก่อนเริ่มใช้งาน</p>

                <!-- Loading state -->
                <div v-if="isInitializing" class="flex items-center justify-center py-8 gap-3 text-white-dark">
                    <span class="inline-block h-5 w-5 animate-spin rounded-full border-3 border-primary border-l-transparent"></span>
                    กำลังตรวจสอบ session...
                </div>

                <!-- No session error -->
                <div v-else-if="!hasSession" class="text-center py-6">
                    <p class="text-danger text-sm mb-4">ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาติดต่อ Admin</p>
                    <NuxtLink to="/auth/cover-login" class="btn btn-primary px-6">
                        กลับหน้า Login
                    </NuxtLink>
                </div>

                <!-- Change password form -->
                <template v-else>
                    <!-- Error -->
                    <div v-if="errorMessage" class="mb-4 rounded border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                        {{ errorMessage }}
                    </div>

                    <!-- Password strength bar -->
                    <div v-if="form.newPassword" class="mb-4">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs text-white-dark">ความแข็งแกร่ง</span>
                            <span class="text-xs font-semibold" :class="strengthColor">{{ strengthLabel }}</span>
                        </div>
                        <div class="h-1.5 w-full rounded-full bg-gray-200">
                            <div class="h-1.5 rounded-full transition-all" :class="strengthBarColor" :style="{ width: strengthPercent + '%' }"></div>
                        </div>
                    </div>

                    <form class="space-y-4" @submit.prevent="handleSubmit">
                        <!-- New Password -->
                        <div>
                            <label class="text-sm font-medium text-dark dark:text-white">
                                รหัสผ่านใหม่ <span class="text-danger">*</span>
                            </label>
                            <div class="relative mt-1">
                                <input
                                    v-model="form.newPassword"
                                    :type="showNew ? 'text' : 'password'"
                                    placeholder="อย่างน้อย 8 ตัวอักษร"
                                    class="form-input pe-10 placeholder:text-white-dark"
                                    minlength="8"
                                    required
                                    :disabled="isLoading"
                                />
                                <button type="button" class="absolute end-3 top-1/2 -translate-y-1/2" @click="showNew = !showNew">
                                    <svg v-if="!showNew" class="h-4 w-4 text-white-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                    </svg>
                                    <svg v-else class="h-4 w-4 text-white-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                                    </svg>
                                </button>
                            </div>
                            <ul class="mt-2 space-y-1 text-xs text-white-dark">
                                <li :class="checks.length ? 'text-success' : ''">{{ checks.length ? '✓' : '○' }} อย่างน้อย 8 ตัวอักษร</li>
                                <li :class="checks.upper  ? 'text-success' : ''">{{ checks.upper  ? '✓' : '○' }} ตัวพิมพ์ใหญ่ (A–Z)</li>
                                <li :class="checks.digit  ? 'text-success' : ''">{{ checks.digit  ? '✓' : '○' }} ตัวเลข (0–9)</li>
                                <li :class="checks.special? 'text-success' : ''">{{ checks.special? '✓' : '○' }} อักขระพิเศษ (@#$!%)</li>
                            </ul>
                        </div>

                        <!-- Confirm Password -->
                        <div>
                            <label class="text-sm font-medium text-dark dark:text-white">
                                ยืนยันรหัสผ่าน <span class="text-danger">*</span>
                            </label>
                            <div class="relative mt-1">
                                <input
                                    v-model="form.confirmPassword"
                                    :type="showConfirm ? 'text' : 'password'"
                                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                                    class="form-input pe-10 placeholder:text-white-dark"
                                    :class="{ 'border-danger focus:border-danger': mismatch }"
                                    required
                                    :disabled="isLoading"
                                />
                                <button type="button" class="absolute end-3 top-1/2 -translate-y-1/2" @click="showConfirm = !showConfirm">
                                    <svg v-if="!showConfirm" class="h-4 w-4 text-white-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                    </svg>
                                    <svg v-else class="h-4 w-4 text-white-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                                    </svg>
                                </button>
                            </div>
                            <p v-if="mismatch" class="mt-1 text-xs text-danger">รหัสผ่านไม่ตรงกัน</p>
                        </div>

                        <button
                            type="submit"
                            class="btn btn-gradient mt-2 w-full border-0 py-3 font-bold uppercase shadow-[0_10px_20px_-10px_rgba(44,95,224,0.44)] disabled:opacity-50"
                            :disabled="isLoading || mismatch || !isPasswordValid"
                        >
                            <span v-if="isLoading" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent ltr:mr-2 rtl:ml-2"></span>
                            {{ isLoading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่' }}
                        </button>
                    </form>
                </template>

            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { ref, computed, onMounted } from 'vue';
    import { useAuthStore } from '@/stores/auth';

    useHead({ title: 'ตั้งรหัสผ่านใหม่ - NEX Finance' });
    definePageMeta({ layout: 'auth-layout' });

    const { $supabase } = useNuxtApp();
    const authStore    = useAuthStore();
    const router       = useRouter();

    // ── State ──────────────────────────────────────────────────────
    const isInitializing = ref(true);
    const hasSession     = ref(false);
    const isLoading      = ref(false);
    const errorMessage   = ref('');
    const showNew        = ref(false);
    const showConfirm    = ref(false);

    const form = ref({ newPassword: '', confirmPassword: '' });

    // ── Computed ───────────────────────────────────────────────────
    const checks = computed(() => ({
        length : form.value.newPassword.length >= 8,
        upper  : /[A-Z]/.test(form.value.newPassword),
        digit  : /[0-9]/.test(form.value.newPassword),
        special: /[@#$!%^&*]/.test(form.value.newPassword),
    }));

    const isPasswordValid = computed(() => Object.values(checks.value).every(Boolean));

    const mismatch = computed(() =>
        form.value.confirmPassword.length > 0 && form.value.newPassword !== form.value.confirmPassword
    );

    const strengthScore = computed(() => Object.values(checks.value).filter(Boolean).length);

    const strengthLabel = computed(() => {
        const s = strengthScore.value;
        if (s <= 1) return 'อ่อนมาก';
        if (s === 2) return 'พอใช้';
        if (s === 3) return 'ดี';
        return 'แข็งแกร่ง';
    });

    const strengthPercent = computed(() => (strengthScore.value / 4) * 100);

    const strengthColor = computed(() => {
        const s = strengthScore.value;
        if (s <= 1) return 'text-danger';
        if (s === 2) return 'text-warning';
        if (s === 3) return 'text-info';
        return 'text-success';
    });

    const strengthBarColor = computed(() => {
        const s = strengthScore.value;
        if (s <= 1) return 'bg-danger';
        if (s === 2) return 'bg-warning';
        if (s === 3) return 'bg-info';
        return 'bg-success';
    });

    // ── Init: check session ────────────────────────────────────────
    onMounted(async () => {
        try {
            const { data: { session } } = await ($supabase as any).auth.getSession();
            hasSession.value = !!session?.user;
        } catch {
            hasSession.value = false;
        } finally {
            isInitializing.value = false;
        }
    });

    // ── Submit ─────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!isPasswordValid.value || mismatch.value) return;

        isLoading.value    = true;
        errorMessage.value = '';

        try {
            // 1. Update password + clear must_change_password flag
            const { data: updateData, error: updateErr } = await ($supabase as any).auth.updateUser({
                password: form.value.newPassword,
                data    : { must_change_password: false },
            });

            if (updateErr) throw new Error(updateErr.message);

            // 2. Update profiles — clear must_change_password; activate if still pending (invite flow)
            const userId = updateData?.user?.id;
            if (userId) {
                const currentStatus = authStore.profile?.status;
                await ($supabase as any)
                    .from('profiles')
                    .update({
                        must_change_password: false,
                        ...(currentStatus === 'pending' ? { status: 'active' } : {}),
                    })
                    .eq('id', userId);
            }

            // 3. Reload profile into store
            const { data: profile } = await ($supabase as any)
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profile) {
                authStore.setUser(updateData.user);
                authStore.setProfile(profile);
            }

            // 4. Redirect based on role
            const role = profile?.role ?? updateData?.user?.app_metadata?.role;
            if (role === 'supplier') {
                router.push('/supplier/request-list');
            } else if (role === 'lender') {
                router.push('/lender/request-list');
            } else {
                router.push('/');
            }
        } catch (err: any) {
            errorMessage.value = err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        } finally {
            isLoading.value = false;
        }
    };
</script>
