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
                <div class="relative hidden w-full items-center justify-center bg-[linear-gradient(225deg,rgba(239,18,98,1)_0%,rgba(67,97,238,1)_100%)] p-5 lg:inline-flex lg:max-w-[835px] ltr:xl:skew-x-[10deg] rtl:xl:skew-x-[-10deg]">
                    <div class="absolute inset-y-0 w-full h-full bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat opacity-20"></div>
                    <div class="relative z-10 w-full max-w-[580px] text-white ltr:xl:-skew-x-[10deg] rtl:xl:skew-x-[10deg] lg:px-8">
                        <NuxtLink to="/" class="mb-10 block">
                            <img src="/assets/images/auth/logo-white.svg" alt="Logo" class="w-16" />
                        </NuxtLink>
                        <h2 class="text-4xl font-black leading-tight mb-4">NEX Finance System</h2>
                        <p class="text-lg font-medium opacity-80 mb-8">เข้าสู่ระบบเพื่อจัดการสินเชื่อแฟคตอริ่งและข้อมูลธุรกิจของคุณ</p>
                        <div class="mt-auto">
                            <img src="/assets/images/auth/login.svg" alt="Illustration" class="w-full max-w-[430px] mx-auto" />
                        </div>
                    </div>
                </div>

                <!-- Right Panel (Form) -->
                <div class="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-16 lg:max-w-[667px]">
                    <div class="flex w-full max-w-[440px] items-center gap-2 lg:absolute lg:end-6 lg:top-6 lg:max-w-full">
                        <NuxtLink to="/" class="block lg:hidden">
                            <img src="/assets/images/logo.svg" alt="Logo" class="mx-auto w-10" />
                        </NuxtLink>
                    </div>
                    
                    <div class="w-full max-w-[440px] lg:mt-16">
                        <div class="mb-10 text-center lg:text-start">
                            <h2 class="text-3xl font-black !leading-snug text-primary md:text-4xl">Sign In</h2>
                            <p class="text-base font-bold leading-normal text-white-dark">กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ</p>
                        </div>

                        <!-- Login Form -->
                        <div class="space-y-5">
                            <div>
                                <label for="email">Email Address <span class="text-danger">*</span></label>
                                <input id="email" v-model="email" type="email" class="form-input" placeholder="Enter your email" @keyup.enter="handleLogin" />
                            </div>
                            <div>
                                <label for="password">Password <span class="text-danger">*</span></label>
                                <input id="password" v-model="password" type="password" class="form-input" placeholder="Enter your password" @keyup.enter="handleLogin" />
                            </div>
                            
                            <!-- Error Message -->
                            <div v-if="error" class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mt-4">
                                <div class="font-semibold mb-1 flex items-center gap-2">
                                    <icon-circle-check class="w-4 h-4" />
                                    เกิดข้อผิดพลาด:
                                </div>
                                <div class="opacity-90">{{ error }}</div>
                            </div>

                            <div class="pt-4">
                                <button @click="handleLogin" class="btn btn-gradient w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]" :disabled="isLoading">
                                    <span v-if="isLoading" class="flex items-center gap-2">
                                        <icon-loader class="animate-spin w-4 h-4" /> Processing...
                                    </span>
                                    <span v-else>Sign In</span>
                                </button>
                            </div>
                        </div>

                        <div class="mt-10 text-center">
                            <p class="text-base font-semibold">
                                ยังไม่มีบัญชี?
                                <NuxtLink to="/register" class="uppercase text-primary underline transition-all hover:text-secondary">Register Here</NuxtLink>
                            </p>
                        </div>
                    </div>
                    <div class="mt-auto text-center text-xs text-white-dark">
                        &copy; {{ new Date().getFullYear() }} NEX Finance System. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { useAuth } from '@/composables/useAuth';

    definePageMeta({
        layout: 'auth-layout',
    });

    useHead({ title: 'Login — NEX Finance System' });

    const { login, isLoading, error } = useAuth();
    const email = ref('');
    const password = ref('');

    const handleLogin = async () => {
        if (!email.value || !password.value) {
            error.value = 'Please enter both email and password';
            return;
        }

        const result = await login(email.value, password.value);
        if (result.success) {
            if (result.profile?.status === 'pending') {
                navigateTo('/auth/pending');
            } else {
                navigateTo('/dashboard');
            }
        }
    };
</script>

<style scoped>
    .form-input {
        @apply transition-all duration-300 focus:border-primary focus:ring-primary;
    }
</style>
