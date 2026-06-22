<template>
    <div>
        <div class="absolute inset-0">
            <img src="/assets/images/auth/bg-gradient.png" alt="image" class="h-full w-full object-cover" />
        </div>
        <div
            class="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16"
        >
            <img src="/assets/images/auth/coming-soon-object1.png" alt="image" class="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
            <img src="/assets/images/auth/coming-soon-object2.png" alt="image" class="absolute left-24 top-0 h-40 md:left-[30%]" />
            <img src="/assets/images/auth/coming-soon-object3.png" alt="image" class="absolute right-0 top-0 h-[300px]" />
            <img src="/assets/images/auth/polygon-object.svg" alt="image" class="absolute bottom-0 end-[28%]" />
            <div
                class="relative flex w-full max-w-[1502px] flex-col justify-between overflow-hidden rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px] lg:flex-row lg:gap-10 xl:gap-0"
            >
                <!-- Left panel -->
                <div
                    class="relative hidden w-full items-center justify-center bg-[linear-gradient(225deg,rgba(239,18,98,1)_0%,rgba(67,97,238,1)_100%)] p-5 lg:inline-flex lg:max-w-[835px] xl:-ms-28 ltr:xl:skew-x-[14deg] rtl:xl:skew-x-[-14deg]"
                >
                    <div
                        class="absolute inset-y-0 w-8 from-primary/10 via-transparent to-transparent ltr:-right-10 ltr:bg-gradient-to-r rtl:-left-10 rtl:bg-gradient-to-l xl:w-16 ltr:xl:-right-20 rtl:xl:-left-20"
                    ></div>
                    <div class="ltr:xl:-skew-x-[14deg] rtl:xl:skew-x-[14deg]">
                        <div class="ms-10 block">
                            <h2 class="text-4xl font-extrabold text-white">NEX Finance</h2>
                            <p class="mt-2 text-lg text-white/80">Supply Chain Finance System</p>
                        </div>
                        <div class="mt-24 hidden w-full max-w-[430px] lg:block">
                            <img src="/assets/images/auth/login.svg" alt="Cover Image" class="w-full" />
                        </div>
                    </div>
                </div>

                <!-- Right panel -->
                <div class="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                    <!-- Language selector -->
                    <div class="flex w-full max-w-[440px] items-center gap-2 lg:absolute lg:end-6 lg:top-6 lg:max-w-full">
                        <NuxtLink to="/" class="block lg:hidden">
                            <NexLogo icon-only size="lg" />
                        </NuxtLink>
                        <div class="dropdown ms-auto w-max">
                            <client-only>
                                <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-start' : 'bottom-end'" offsetDistance="8">
                                    <button
                                        type="button"
                                        class="flex items-center gap-2.5 rounded-lg border border-white-dark/30 bg-white px-2 py-1.5 text-white-dark hover:border-primary hover:text-primary dark:bg-black"
                                    >
                                        <img :src="currentFlag" alt="flag" class="h-5 w-5 rounded-full object-cover" />
                                        <div class="text-base font-bold uppercase">{{ store.locale }}</div>
                                        <span class="shrink-0"><icon-caret-down /></span>
                                    </button>
                                    <template #content="{ close }">
                                        <ul class="grid w-[280px] grid-cols-2 gap-2 !px-2 font-semibold text-dark dark:text-white-dark">
                                            <template v-for="item in store.languageList" :key="item.code">
                                                <li>
                                                    <button
                                                        type="button"
                                                        class="w-full hover:text-primary"
                                                        :class="{ 'bg-primary/10 text-primary': store.locale === item.code }"
                                                        @click="changeLanguage(item), close()"
                                                    >
                                                        <img class="h-5 w-5 rounded-full object-cover" :src="`/assets/images/flags/${item.code.toUpperCase()}.svg`" alt="" />
                                                        <span class="ltr:ml-3 rtl:mr-3">{{ item.name }}</span>
                                                    </button>
                                                </li>
                                            </template>
                                        </ul>
                                    </template>
                                </Popper>
                            </client-only>
                        </div>
                    </div>

                    <!-- Form -->
                    <div class="w-full max-w-[440px] lg:mt-16">
                        <div class="mb-10">
                            <h1 class="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Sign In</h1>
                            <p class="text-base font-bold leading-normal text-white-dark">เข้าสู่ระบบ NEX Finance System</p>
                        </div>

                        <!-- Error message -->
                        <div v-if="errorMessage" class="mb-4 rounded border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                            {{ errorMessage }}
                        </div>

                        <form class="space-y-5 dark:text-white" @submit.prevent="handleLogin">
                            <div>
                                <label for="Email">Email</label>
                                <div class="relative text-white-dark">
                                    <input
                                        id="Email"
                                        v-model="form.email"
                                        type="email"
                                        placeholder="กรอก Email"
                                        class="form-input ps-10 placeholder:text-white-dark"
                                        required
                                        :disabled="isLoading"
                                    />
                                    <span class="absolute start-4 top-1/2 -translate-y-1/2">
                                        <icon-mail :fill="true" />
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label for="Password">Password</label>
                                <div class="relative text-white-dark">
                                    <input
                                        id="Password"
                                        v-model="form.password"
                                        type="password"
                                        placeholder="กรอก Password"
                                        class="form-input ps-10 placeholder:text-white-dark"
                                        required
                                        :disabled="isLoading"
                                    />
                                    <span class="absolute start-4 top-1/2 -translate-y-1/2">
                                        <icon-lock-dots :fill="true" />
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                class="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
                                :disabled="isLoading"
                            >
                                <span v-if="isLoading" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-l-transparent ltr:mr-2 rtl:ml-2"></span>
                                {{ isLoading ? 'กำลังเข้าสู่ระบบ...' : 'Sign In' }}
                            </button>
                        </form>

                        <div class="mt-8 text-center dark:text-white">
                            ยังไม่มีบัญชี?
                            <NuxtLink to="/auth/cover-register" class="uppercase text-primary underline transition hover:text-black dark:hover:text-white">
                                สมัครสมาชิก
                            </NuxtLink>
                        </div>
                    </div>
                    <p class="absolute bottom-6 w-full text-center dark:text-white">© {{ new Date().getFullYear() }} NEX Finance System. All Rights Reserved.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { ref, computed } from 'vue';
    import appSetting from '@/app-setting';
    import { useAppStore } from '@/stores/index';
    import { useAuth } from '@/composables/useAuth';

    useHead({ title: 'Login - NEX Finance System' });
    definePageMeta({ layout: 'auth-layout' });

    const store = useAppStore();
    const { setLocale } = useI18n();
    const { login, isLoading, errorMessage } = useAuth();

    const form = ref({ email: '', password: '' });

    const handleLogin = async () => {
        await login(form.value.email, form.value.password);
    };

    const changeLanguage = (item: any) => {
        appSetting.toggleLanguage(item, setLocale);
    };

    const currentFlag = computed(() => {
        return `/assets/images/flags/${store.locale?.toUpperCase()}.svg`;
    });
</script>
