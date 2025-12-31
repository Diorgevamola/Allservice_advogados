
'use server';

import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function loginAction(formData: FormData) {
    let identifier = formData.get('phone') as string; // Named 'phone' in form but can be email
    const password = formData.get('password') as string;

    if (!identifier) {
        return { error: 'Telefone ou E-mail é obrigatório' };
    }

    // Sanitize phone number (remove non-digits) if it's not an email
    if (!identifier.includes('@')) {
        identifier = identifier.replace(/\D/g, '');
    }

    // Check if it's an email (Admin)
    if (identifier.includes('@')) {
        if (!password) {
            return { error: 'Senha é obrigatória para administradores' };
        }

        // Verify against admin_users table
        const { data, error } = await supabase
            .from('admin_users')
            .select('id, email')
            .eq('email', identifier)
            .eq('password', password) // In production, use hash comparison
            .single();

        if (error || !data) {
            return { error: 'E-mail ou senha do administrador inválidos' };
        }

        (await cookies()).set('session', `admin:${data.id}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        redirect('/admin');
    } else {
        // Verify phone against numero_dos_atendentes
        const { data, error } = await supabase
            .from('numero_dos_atendentes')
            .select('id, nome')
            .eq('telefone', identifier)
            .single();

        if (error || !data) {
            console.error("Login error:", error);
            const debugInfo = error ? ` (DB Error: ${error.code} - ${error.message})` : '';
            return { error: `Telefone não encontrado: "${identifier}"${debugInfo}` };
        }

        (await cookies()).set('session', data.id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        redirect('/');
    }
}

export async function logoutAction() {
    (await cookies()).delete('session');
    redirect('/login');
}

export async function checkIsAdmin(): Promise<boolean> {
    const session = (await cookies()).get('session')?.value;
    return !!session?.startsWith('admin:');
}
