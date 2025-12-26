'use server';

import { supabase } from './supabase';
import { startOfDay, subDays, startOfMonth, parseISO, isAfter } from 'date-fns';
import { cookies } from 'next/headers';

export type TimeRange = 'today' | 'yesterday' | '7days' | '30days';

export interface DashboardStats {
    qualified: number;
    inProgress: number; // New field
    total: number;
    disqualified: number;
    funnel: {
        question: string;
        count: number;
        total: number; // relative to total leads in range
        percentage: number;
    }[];
    stepConversion: {
        question: string;
        count: number;
        previousCount: number;
        percentage: number;
    }[];
}

export async function fetchDashboardData(startDate?: string, endDate?: string, area?: string): Promise<DashboardStats> {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session')?.value;

    if (!userId) {
        console.error("User ID not found in session");
        return { qualified: 0, inProgress: 0, total: 0, disqualified: 0, funnel: [], stepConversion: [] };
    }

    // Fetch 'Todos os clientes' based on created_at AND ID_empresa
    let query = supabase
        .from('Todos os clientes')
        .select('*')
        .eq('ID_empresa', userId);

    if (startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate);
    } else if (startDate) {
        query = query.gte('created_at', startDate);
    }

    if (area && area !== 'all') {
        query = query.eq('area', area);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching data:', error);
        return { qualified: 0, inProgress: 0, total: 0, disqualified: 0, funnel: [], stepConversion: [] };
    }

    const leads = data || [];
    const total = leads.length;

    let qualified = 0;
    let disqualified = 0;
    let inProgress = 0;

    leads.forEach((lead: any) => {
        // Qualified logic: Status column is 'Concluído'
        const status = (lead.Status || '').toLowerCase();

        if (status === 'concluído' || status === 'concluido') {
            qualified++;
        } else if (status === 'desqualificado') {
            disqualified++;
        } else {
            // Everything else is considered In Progress (Em andamento, empty, null)
            inProgress++;
        }
    });

    // Funnel Data
    const questions = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12'];

    const funnel = questions.map(q => {
        const count = leads.filter((l: any) => l[q] === true).length;
        return {
            question: q.toUpperCase(),
            count,
            total: total,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
        };
    });

    const stepConversion = questions.map((q, index) => {
        const count = leads.filter((l: any) => l[q] === true).length;
        const previousCount = index === 0 ? total : leads.filter((l: any) => l[questions[index - 1]] === true).length;

        return {
            question: q.toUpperCase(),
            count,
            previousCount,
            percentage: previousCount > 0 ? Math.round((count / previousCount) * 100) : 0
        };
    });

    return {
        qualified,
        inProgress,
        total,
        disqualified,
        funnel,
        stepConversion
    };
}

export async function getAvailableScripts() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session')?.value;

    if (!userId) {
        return [];
    }

    const { data, error } = await supabase
        .from('numero_dos_atendentes')
        .select('area_1, area_2, area_3, area_4, area_5, area_6')
        .eq('id', userId)
        .single();

    if (error) {
        console.error("Erro ao buscar scripts:", error);
        return [];
    }

    const areas = [
        data.area_1,
        data.area_2,
        data.area_3,
        data.area_4,
        data.area_5,
        data.area_6
    ].filter(a => a && a.trim() !== '');

    return Array.from(new Set(areas));
}

export interface AdminStats {
    totalCompanies: number;
    totalLeads: number;
    leadsByCompany: {
        id: string;
        name: string;
        office: string;
        phone: string;
        leadCount: number;
    }[];
}

export async function fetchAdminStats(): Promise<AdminStats> {
    // 1. Fetch all companies/users
    const { data: companies, error: companiesError } = await supabase
        .from('numero_dos_atendentes')
        .select('id, nome, Escritório, telefone');

    if (companiesError) {
        console.error('Error fetching companies:', companiesError);
        return { totalCompanies: 0, totalLeads: 0, leadsByCompany: [] };
    }

    // 2. Fetch all leads to aggregate counts
    // We fetch ID_empresa to group by
    const { data: leads, error: leadsError } = await supabase
        .from('Todos os clientes')
        .select('ID_empresa');

    if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        return { totalCompanies: companies?.length || 0, totalLeads: 0, leadsByCompany: [] };
    }

    const totalLeads = leads?.length || 0;

    // 3. Aggregate leads by company
    // Create a map for O(1) lookups or O(N) iteration
    const leadCounts: Record<string, number> = {};
    leads?.forEach((lead: any) => {
        const companyId = lead.ID_empresa;
        if (companyId) {
            leadCounts[companyId] = (leadCounts[companyId] || 0) + 1;
        }
    });

    const leadsByCompany = (companies || []).map((company: any) => ({
        id: company.id,
        name: company.nome || 'Sem Nome',
        office: company['Escritório'] || 'Sem Escritório', // Handle potential column name mapping
        phone: company.telefone || 'N/A',
        leadCount: leadCounts[company.id] || 0
    })).sort((a, b) => b.leadCount - a.leadCount); // Sort by most leads

    return {
        totalCompanies: companies?.length || 0,
        totalLeads,
        leadsByCompany
    };
}

export async function fetchGlobalLeads(offset: number = 0, limit: number = 20) {
    // Fetch paginated leads from 'Todos os clientes'
    const { data: leads, error, count } = await supabase
        .from('Todos os clientes')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching global leads:', error);
        return { leads: [], count: 0, hasMore: false };
    }

    // Fetch company names for enrichment
    const companyIds = [...new Set((leads || []).map((l: any) => l.ID_empresa).filter(Boolean))];
    let companyMap: Record<string, string> = {};

    if (companyIds.length > 0) {
        const { data: companies } = await supabase
            .from('numero_dos_atendentes')
            .select('id, Escritório, nome')
            .in('id', companyIds);

        if (companies) {
            companies.forEach((c: any) => {
                companyMap[String(c.id)] = c['Escritório'] || c.nome || 'Sem Nome';
            });
        }
    }

    // Enrich leads with company name
    const enrichedLeads = (leads || []).map((lead: any) => ({
        ...lead,
        companyName: companyMap[String(lead.ID_empresa)] || 'Desconhecido'
    }));

    return {
        leads: enrichedLeads,
        count: count || 0,
        hasMore: (offset + limit) < (count || 0)
    };
}

export async function fetchGlobalDistribuicao() {
    // Fetch ALL from 'TeuCliente'
    const { data, error } = await supabase
        .from('TeuCliente')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching global distribuicao:', error);
        return [];
    }
    return data || [];
}

export async function fetchAllOffices() {
    const { data, error } = await supabase
        .from('numero_dos_atendentes')
        .select('id, nome, Escritório')
        .order('Escritório', { ascending: true });

    if (error) return [];
    return data || [];
}
