
'use server';

import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function loginAction(formData: FormData) {
    const phone = formData.get('phone') as string;

    if (!phone) {
        return { error: 'Telefone é obrigatório' };
    }

    // Verify phone against database
    const { data, error } = await supabase
        .from('numero_dos_atendentes')
        .select('id, nome')
        .eq('telefone', phone)
        .single();

    if (error || !data) {
        return { error: 'Telefone não encontrado' };
    }

    // Set session cookie with user ID as string
    (await cookies()).set('session', data.id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    });

    redirect('/');
}

export async function logoutAction() {
    (await cookies()).delete('session');
    redirect('/login');
}
