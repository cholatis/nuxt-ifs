import { useAuthStore } from '@/stores/auth';

export type ContactStatus = 'lead' | 'contacted' | 'customer' | 'inactive';

export interface Contact {
    id: number;
    name: string;
    company_name: string | null;
    phone: string | null;
    email: string | null;
    status: ContactStatus;
    owner_user_id: string | null;
    last_contacted_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ContactCreate {
    name: string;
    company_name?: string | null;
    phone?: string | null;
    email?: string | null;
    status?: ContactStatus;
    owner_user_id?: string | null;
    last_contacted_at?: string | null;
}

export type ContactUpdate = Partial<ContactCreate>;

export interface ContactListParams {
    limit?: number;
    offset?: number;
    status?: ContactStatus;
    q?: string;
    owner_user_id?: string;
}

export interface ContactListResponse {
    data: Contact[];
    total: number;
    limit: number;
    offset: number;
}

export const CONTACT_STATUSES: ContactStatus[] = ['lead', 'contacted', 'customer', 'inactive'];

export const CONTACT_STATUS_LABEL: Record<ContactStatus, string> = {
    lead: 'Lead',
    contacted: 'Contacted',
    customer: 'Customer',
    inactive: 'Inactive',
};

export const CONTACT_STATUS_BADGE: Record<ContactStatus, string> = {
    lead: 'badge badge-outline-info',
    contacted: 'badge badge-outline-warning',
    customer: 'badge badge-outline-success',
    inactive: 'badge badge-outline-secondary',
};

export const useContact = () => {
    const authStore = useAuthStore();

    const baseUrl = () => {
        const config = useRuntimeConfig();
        return `${config.public.supabaseUrl}/functions/v1/contact`;
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

    const listContacts = async (params: ContactListParams = {}): Promise<ContactListResponse> => {
        const qs = new URLSearchParams();
        if (params.limit != null) qs.set('limit', String(params.limit));
        if (params.offset != null) qs.set('offset', String(params.offset));
        if (params.status) qs.set('status', params.status);
        if (params.q) qs.set('q', params.q);
        if (params.owner_user_id) qs.set('owner_user_id', params.owner_user_id);
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return callEdge<ContactListResponse>(suffix);
    };

    const getContact = async (id: number | string): Promise<Contact> => {
        const json = await callEdge<{ data: Contact }>(`/${id}`);
        return json.data;
    };

    const createContact = async (body: ContactCreate): Promise<Contact> => {
        const json = await callEdge<{ data: Contact }>('', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return json.data;
    };

    const updateContact = async (id: number | string, body: ContactUpdate): Promise<Contact> => {
        const json = await callEdge<{ data: Contact }>(`/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
        return json.data;
    };

    const deleteContact = async (id: number | string): Promise<void> => {
        await callEdge<{ id: string }>(`/${id}`, { method: 'DELETE' });
    };

    return { listContacts, getContact, createContact, updateContact, deleteContact };
};
