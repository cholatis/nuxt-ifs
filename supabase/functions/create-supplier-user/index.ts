import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL              = Deno.env.get('APP_URL')!;

const corsHeaders = {
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // ── 1. ตรวจสอบ caller เป็น GEC admin ──────────────────
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return json({ error: 'Unauthorized' }, 401);
        }

        const callerClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
        if (callerErr || !caller) {
            return json({ error: 'Unauthorized' }, 401);
        }

        const { data: callerProfile, error: profileErr } = await callerClient
            .from('profiles')
            .select('role')
            .eq('id', caller.id)
            .single();

        if (profileErr || callerProfile?.role !== 'gec') {
            return json({ error: 'Forbidden: GEC role required' }, 403);
        }

        // ── 2. อ่าน request body ───────────────────────────────
        const { contact_id } = await req.json();
        if (!contact_id) {
            return json({ error: 'contact_id is required' }, 400);
        }

        // ── 3. service_role client สำหรับ admin operations ─────
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // ── 4. ดึง contact ────────────────────────────────────
        const { data: contact, error: contactErr } = await adminClient
            .from('contacts')
            .select('id, name, email, company_name, supplier_code, supplier_name, linked_user_id')
            .eq('id', contact_id)
            .single();

        if (contactErr || !contact) {
            return json({ error: 'Contact not found' }, 404);
        }

        // ── 5. Validate ────────────────────────────────────────
        if (!contact.email) {
            return json({ error: 'Contact has no email' }, 400);
        }
        if (!contact.supplier_code) {
            return json({ error: 'Contact has no supplier_code' }, 400);
        }
        if (contact.linked_user_id) {
            return json({ error: 'Account already exists for this contact' }, 409);
        }

        // ── 6. ตรวจว่า email ยังไม่มีใน auth.users ────────────
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const emailTaken = existingUsers?.users?.some((u: any) => u.email === contact.email);
        if (emailTaken) {
            return json({ error: 'Email already registered' }, 409);
        }

        // ── 7. Invite user (สร้าง account + ส่ง email) ─────────
        const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
            contact.email,
            {
                redirectTo: `${APP_URL}/auth/set-password`,
                data: {
                    full_name     : contact.name,
                    supplier_code : contact.supplier_code,
                    supplier_name : contact.supplier_name ?? '',
                },
            }
        );

        if (inviteErr || !inviteData?.user) {
            return json({ error: `Failed to create user: ${inviteErr?.message}` }, 500);
        }

        const userId = inviteData.user.id;

        // ── 8. INSERT profiles ─────────────────────────────────
        const { error: profileInsertErr } = await adminClient
            .from('profiles')
            .insert({
                id                   : userId,
                email                : contact.email,
                full_name            : contact.name,
                company_name         : contact.company_name ?? null,
                role                 : 'supplier',
                status               : 'pending',
                supplier_code        : contact.supplier_code,
                supplier_name        : contact.supplier_name ?? null,
                must_change_password : true,
            });

        if (profileInsertErr) {
            // rollback: ลบ user ที่เพิ่งสร้าง
            await adminClient.auth.admin.deleteUser(userId);
            return json({ error: `Failed to create profile: ${profileInsertErr.message}` }, 500);
        }

        // ── 9. UPDATE contacts.linked_user_id ─────────────────
        const { error: updateErr } = await adminClient
            .from('contacts')
            .update({ linked_user_id: userId })
            .eq('id', contact_id);

        if (updateErr) {
            return json({ error: `Failed to link contact: ${updateErr.message}` }, 500);
        }

        return json({ success: true, user_id: userId }, 200);

    } catch (err: any) {
        return json({ error: err.message ?? 'Internal server error' }, 500);
    }
});

function json(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}
