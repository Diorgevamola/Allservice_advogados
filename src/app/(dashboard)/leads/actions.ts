'use server';

import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function getLeads(startDate?: string, endDate?: string, area?: string, limit: number = 100, status?: string) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session || !session.value) {
        throw new Error("Usuário não autenticado");
    }

    const userId = session.value;
    const supabase = createClient();

    let query = supabase
        .from('Todos os clientes')
        .select('id, nome, telefone, Status, created_at, status, area', { count: 'exact' })
        .eq('ID_empresa', userId)
        .order('created_at', { ascending: false });

    if (startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate);
    }

    if (area && area !== 'all') {
        query = query.eq('area', area);
    }

    if (status && status !== 'all') {
        query = query.eq('Status', status);
    }

    // Capture total count before applying limit
    const totalQuery = query;

    if (limit > 0) {
        query = query.limit(limit);
    }

    const { data, count, error } = await query;

    if (error) {
        console.error("Erro ao carregar leads:", error);
        return { data: [], count: 0 };
    }

    return { data, count: count || 0 };
}

export async function exportLeadsToCsv(startDate?: string, endDate?: string, area?: string, limit: number = 0, status?: string) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session || !session.value) {
        throw new Error("Usuário não autenticado");
    }

    const userId = session.value;
    const supabase = createClient();

    let query = supabase
        .from('Todos os clientes')
        .select('id, nome, telefone, Status, created_at, status, area')
        .eq('ID_empresa', userId)
        .order('created_at', { ascending: false });

    if (startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate);
    }

    if (area && area !== 'all') {
        query = query.eq('area', area);
    }

    if (status && status !== 'all') {
        query = query.eq('Status', status);
    }

    if (limit > 0) {
        query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Erro ao exportar leads:", error);
        throw new Error("Falha ao exportar dados");
    }

    if (!data || data.length === 0) {
        return "";
    }

    // CSV Header
    const headers = ["Nome", "Telefone", "Status", "Data Criação", "Área"];
    const csvRows = [headers.join(";")]; // using semicolon for Excel compatibility in some locales, usually safer

    // CSV Rows
    data.forEach(row => {
        const values = [
            `"${(row.nome || "").replace(/"/g, '""')}"`,
            `"${(row.telefone || "").replace(/"/g, '""')}"`,
            `"${(row.Status || "").replace(/"/g, '""')}"`,
            `"${(row.created_at || "")}"`,
            `"${(row.area || "").replace(/"/g, '""')}"`,
        ];
        csvRows.push(values.join(";"));
    });

    return csvRows.join("\n");
}
