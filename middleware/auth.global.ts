import { useAuthStore } from '@/stores/auth';

const PUBLIC_ROUTES = ['/auth/cover-login', '/auth/cover-register', '/auth/pending', '/register', '/login', '/auth/change-password', '/auth/set-password'];

export default defineNuxtRouteMiddleware(async (to) => {
    // Supabase plugin is client-only — skip during SSR to avoid "Cannot read properties of undefined"
    if (import.meta.server) return;

    // Skip public routes
    if (PUBLIC_ROUTES.includes(to.path)) return;

    const authStore = useAuthStore();
    const { $supabase } = useNuxtApp();

    // Guard: plugin not yet available
    if (!$supabase) return;

    // Always fetch fresh session to keep access token up-to-date (handles expiry + auto-refresh)
    const { data: { session } } = await ($supabase as any).auth.getSession();

    if (!session?.user) {
        authStore.clearAuth();
        return navigateTo('/auth/cover-login');
    }

    // Always update the token (Supabase client auto-refreshes it)
    authStore.setAccessToken(session.access_token);

    // Full profile restore only when first loading
    if (!authStore.isAuthenticated) {
        const { data: profile } = await ($supabase as any)
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (!profile) return navigateTo('/auth/cover-login');
        authStore.setUser(session.user);
        authStore.setProfile(profile);
    }

    const profile = authStore.profile;
    if (!profile) return navigateTo('/auth/cover-login');

    // Pending supplier → pending page
    if (profile.status === 'pending' && to.path !== '/auth/pending') {
        return navigateTo('/auth/pending');
    }

    // Force password change on first login
    const mustChange = profile.must_change_password === true
        || session.user.user_metadata?.must_change_password === true;
    if (mustChange && to.path !== '/auth/change-password') {
        return navigateTo('/auth/change-password');
    }

    // Lender: can only access /lender/* routes
    if (profile.role === 'lender' && !to.path.startsWith('/lender')) {
        return navigateTo('/lender/request-list');
    }

    // Supplier: can only access /supplier/* routes
    if (profile.role === 'supplier' && !to.path.startsWith('/supplier')) {
        return navigateTo('/supplier/request-list');
    }
});
