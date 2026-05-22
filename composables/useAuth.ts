import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

export const useAuth = () => {
    const { $supabase } = useNuxtApp();
    const authStore = useAuthStore();
    const router = useRouter();
    const isLoading = ref(false);
    const errorMessage = ref('');

    const fetchProfile = async (userId: string) => {
        const { data, error } = await ($supabase as any)
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data;
    };

    const login = async (email: string, password: string) => {
        isLoading.value = true;
        errorMessage.value = '';
        try {
            const { data, error } = await ($supabase as any).auth.signInWithPassword({ email, password });
            if (error) throw error;

            const profile = await fetchProfile(data.user.id);
            authStore.setUser(data.user);
            authStore.setProfile(profile);

            // Redirect by role
            if (profile.status === 'pending') {
                return router.push('/auth/pending');
            }
            if (profile.role === 'lender') {
                return router.push('/lender/request-list');
            }
            if (profile.role === 'supplier') {
                return router.push('/supplier/request-list');
            }
            return router.push('/dashboard');
        } catch (err: any) {
            errorMessage.value = err.message === 'Invalid login credentials'
                ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
                : err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        } finally {
            isLoading.value = false;
        }
    };

    const register = async (email: string, password: string, fullName: string, companyName: string) => {
        isLoading.value = true;
        errorMessage.value = '';
        try {
            const { data, error } = await ($supabase as any).auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName, company_name: companyName },
                },
            });
            if (error) throw error;
            // Profile auto-created by trigger with status='pending'
            if (data.user) {
                authStore.setUser(data.user);
                // Fetch profile (trigger should have created it)
                try {
                    const profile = await fetchProfile(data.user.id);
                    authStore.setProfile(profile);
                } catch {
                    // Profile may not be ready instantly — redirect to pending anyway
                }
                return router.push('/auth/pending');
            }
        } catch (err: any) {
            errorMessage.value = err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        } finally {
            isLoading.value = false;
        }
    };

    const currentUser = authStore.user;

    const logout = async () => {
        await ($supabase as any).auth.signOut();
        authStore.clearAuth();
        router.push('/auth/cover-login');
    };

    const restoreSession = async () => {
        const { data: { session } } = await ($supabase as any).auth.getSession();
        if (session?.user) {
            try {
                const profile = await fetchProfile(session.user.id);
                authStore.setUser(session.user);
                authStore.setProfile(profile);
            } catch {
                authStore.clearAuth();
            }
        }
    };

    return { login, register, logout, restoreSession, currentUser, isLoading, errorMessage };
};
