import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

export interface AppNotification {
    id: number;
    user_id: string;
    title: string;
    body: string | null;
    type: 'info' | 'success' | 'warning' | 'danger';
    link: string | null;
    is_read: boolean;
    created_at: string;
}

export const useNotification = () => {
    const { $supabase } = useNuxtApp();
    const authStore = useAuthStore();

    const items = ref<AppNotification[]>([]);
    const unreadCount = computed(() => items.value.filter(n => !n.is_read).length);

    let channel: any = null;

    const fetchNotifications = async () => {
        const userId = authStore.user?.id;
        if (!userId) return;
        const { data } = await ($supabase as any)
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(30);
        items.value = (data as AppNotification[]) ?? [];
    };

    const init = async () => {
        await fetchNotifications();
        const userId = authStore.user?.id;
        if (!userId) return;

        channel = ($supabase as any)
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
                (payload: any) => {
                    items.value.unshift(payload.new as AppNotification);
                },
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
                (payload: any) => {
                    const idx = items.value.findIndex(n => n.id === payload.new.id);
                    if (idx !== -1) items.value[idx] = payload.new as AppNotification;
                },
            )
            .subscribe();
    };

    const dispose = () => {
        if (channel) {
            ($supabase as any).removeChannel(channel);
            channel = null;
        }
    };

    const markRead = async (id: number) => {
        const n = items.value.find(x => x.id === id);
        if (!n || n.is_read) return;
        n.is_read = true;
        await ($supabase as any).from('notifications').update({ is_read: true }).eq('id', id);
    };

    const markAllRead = async () => {
        const unread = items.value.filter(n => !n.is_read);
        if (!unread.length) return;
        unread.forEach(n => { n.is_read = true; });
        const ids = unread.map(n => n.id);
        await ($supabase as any).from('notifications').update({ is_read: true }).in('id', ids);
    };

    const formatTime = (dt: string): string => {
        const d = new Date(dt);
        const diffMs = Date.now() - d.getTime();
        const diffMin = Math.floor(diffMs / 60_000);
        if (diffMin < 1) return 'เมื่อกี้';
        if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `${diffH} ชั่วโมงที่แล้ว`;
        const diffD = Math.floor(diffH / 24);
        if (diffD < 7) return `${diffD} วันที่แล้ว`;
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    };

    return { items, unreadCount, init, dispose, markRead, markAllRead, formatTime, fetchNotifications };
};
