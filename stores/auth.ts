import { defineStore } from 'pinia';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    company_name: string | null;
    role: 'gec' | 'lender' | 'supplier';
    status: 'pending' | 'active' | 'inactive';
    lender_code: string | null;
    lender_org: string | null;
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user           : null as any | null,
        profile        : null as UserProfile | null,
        isAuthenticated: false,
        accessToken    : '' as string,   // JWT — set by middleware on every session restore
    }),

    getters: {
        isGEC      : (state) => state.profile?.role === 'gec',
        isLender   : (state) => state.profile?.role === 'lender',
        isSupplier : (state) => state.profile?.role === 'supplier',
        isActive   : (state) => state.profile?.status === 'active',
        displayName: (state) => state.profile?.full_name || state.profile?.email || '',
        lenderCode : (state) => state.profile?.lender_code || '',
    },

    actions: {
        setUser(user: any) {
            this.user = user;
            this.isAuthenticated = !!user;
        },
        setProfile(profile: UserProfile) {
            this.profile = profile;
        },
        setAccessToken(token: string) {
            this.accessToken = token;
        },
        clearAuth() {
            this.user            = null;
            this.profile         = null;
            this.accessToken     = '';
            this.isAuthenticated = false;
        },
    },
});
