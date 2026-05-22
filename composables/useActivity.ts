import { useAuthStore } from '@/stores/auth';

export type ActivityType = 'call' | 'meeting' | 'email' | 'follow_up' | 'note';
export type ActivityStatus = 'pending' | 'done' | 'cancelled';
export type ActivityResult = 'success' | 'no_answer' | 'interested' | 'not_interested';

export interface Activity {
    id: number;
    contact_id: number;
    activity_type: ActivityType;
    subject: string | null;
    description: string | null;
    activity_date: string;
    status: ActivityStatus;
    result: ActivityResult | null;
    next_action: string | null;
    next_action_date: string | null;
    created_by: string | null;
    created_at: string;
}

export interface ActivityCreate {
    contact_id: number;
    activity_type: ActivityType;
    activity_date: string;
    subject?: string | null;
    description?: string | null;
    status?: ActivityStatus;
    result?: ActivityResult | null;
    next_action?: string | null;
    next_action_date?: string | null;
}

export type ActivityUpdate = Partial<Omit<ActivityCreate, 'contact_id'>>;

export interface ActivityListParams {
    limit?: number;
    offset?: number;
    contact_id?: number | string;
    activity_type?: ActivityType;
    status?: ActivityStatus;
    result?: ActivityResult;
    date_from?: string;
    date_to?: string;
    due?: boolean;
}

export interface ActivityListResponse {
    data: Activity[];
    total: number;
    limit: number;
    offset: number;
}

export const ACTIVITY_TYPES: ActivityType[] = ['call', 'meeting', 'email', 'follow_up', 'note'];
export const ACTIVITY_STATUSES: ActivityStatus[] = ['pending', 'done', 'cancelled'];
export const ACTIVITY_RESULTS: ActivityResult[] = ['success', 'no_answer', 'interested', 'not_interested'];

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
    call: 'Call',
    meeting: 'Meeting',
    email: 'Email',
    follow_up: 'Follow up',
    note: 'Note',
};

export const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
    pending: 'Pending',
    done: 'Done',
    cancelled: 'Cancelled',
};

export const ACTIVITY_RESULT_LABEL: Record<ActivityResult, string> = {
    success: 'Success',
    no_answer: 'No answer',
    interested: 'Interested',
    not_interested: 'Not interested',
};

export const ACTIVITY_TYPE_BADGE: Record<ActivityType, string> = {
    call: 'badge badge-outline-info',
    meeting: 'badge badge-outline-primary',
    email: 'badge badge-outline-secondary',
    follow_up: 'badge badge-outline-warning',
    note: 'badge badge-outline-dark',
};

export const ACTIVITY_STATUS_BADGE: Record<ActivityStatus, string> = {
    pending: 'badge badge-outline-warning',
    done: 'badge badge-outline-success',
    cancelled: 'badge badge-outline-danger',
};

export const useActivity = () => {
    const authStore = useAuthStore();

    const baseUrl = () => {
        const config = useRuntimeConfig();
        return `${config.public.supabaseUrl}/functions/v1/activity`;
    };

    const getJwt = async () => {
        const { $supabase } = useNuxtApp();
        const { data } = await ($supabase as any).auth.getSession();
        return data?.session?.access_token || authStore.accessToken;
    };

    const callEdge = async <T = any>(path: string, init: RequestInit = {}): Promise<T> => {
        const jwt = await getJwt();
        if (!jwt) throw new Error('No active session');
        const res = await fetch(`${baseUrl()}${path}`, {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${jwt}`,
                ...(init.headers || {}),
            },
        });
        const text = await res.text();
        const json = text ? JSON.parse(text) : {};
        if (!res.ok) {
            const err: any = new Error(json.error || `HTTP ${res.status}`);
            err.status = res.status;
            throw err;
        }
        return json as T;
    };

    const listActivities = async (params: ActivityListParams = {}): Promise<ActivityListResponse> => {
        const qs = new URLSearchParams();
        if (params.limit != null) qs.set('limit', String(params.limit));
        if (params.offset != null) qs.set('offset', String(params.offset));
        if (params.contact_id != null) qs.set('contact_id', String(params.contact_id));
        if (params.activity_type) qs.set('activity_type', params.activity_type);
        if (params.status) qs.set('status', params.status);
        if (params.result) qs.set('result', params.result);
        if (params.date_from) qs.set('date_from', params.date_from);
        if (params.date_to) qs.set('date_to', params.date_to);
        if (params.due) qs.set('due', 'true');
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return callEdge<ActivityListResponse>(suffix);
    };

    const getActivity = async (id: number | string): Promise<Activity> => {
        const json = await callEdge<{ data: Activity }>(`/${id}`);
        return json.data;
    };

    const createActivity = async (body: ActivityCreate): Promise<Activity> => {
        const json = await callEdge<{ data: Activity }>('', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return json.data;
    };

    const updateActivity = async (id: number | string, body: ActivityUpdate): Promise<Activity> => {
        const json = await callEdge<{ data: Activity }>(`/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
        return json.data;
    };

    const deleteActivity = async (id: number | string): Promise<void> => {
        await callEdge<{ id: string }>(`/${id}`, { method: 'DELETE' });
    };

    return { listActivities, getActivity, createActivity, updateActivity, deleteActivity };
};
