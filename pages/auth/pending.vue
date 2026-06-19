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
            
            <div class="relative w-full max-w-[800px] rounded-2xl bg-white/60 p-8 text-black backdrop-blur-lg dark:bg-black/50 text-center">
                <div class="mb-8 flex justify-center">
                    <div class="rounded-full bg-primary/20 p-6">
                        <icon-clock class="h-20 w-20 text-primary" />
                    </div>
                </div>
                
                <h2 class="text-4xl font-black leading-tight mb-4 text-primary">บัญชีอยู่ระหว่างรอการอนุมัติ</h2>
                <p class="text-lg font-medium opacity-80 mb-8 max-w-[600px] mx-auto text-white-dark">
                    ขอบคุณที่ลงทะเบียนกับ NEX Finance System บัญชีของคุณ ({{ currentUser?.email }}) กำลังอยู่ระหว่างการตรวจสอบและอนุมัติโดยผู้ดูแลระบบ 
                    <br/><br/>
                    คุณจะสามารถเข้าใช้งานระบบได้หลังจากได้รับการอนุมัติแล้ว หากมีข้อสงสัยกรุณาติดต่อเจ้าหน้าที่
                </p>
                
                <div class="pt-4">
                    <button @click="handleLogout" class="btn btn-outline-primary mx-auto">
                        <span v-if="isLoading" class="flex items-center gap-2">
                            <icon-loader class="animate-spin w-4 h-4" /> Processing...
                        </span>
                        <span v-else class="flex items-center gap-2">
                            <icon-logout class="w-5 h-5" /> Sign Out
                        </span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useAuth } from '@/composables/useAuth';

    definePageMeta({
        layout: 'auth-layout',
    });

    useHead({ title: 'Account Pending — NEX Finance System' });

    const { currentUser, logout, isLoading } = useAuth();

    const handleLogout = async () => {
        await logout();
    };
</script>
