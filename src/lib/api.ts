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

export async function fetchDashboardData(startDate?: string, endDate?: string, area?: string, dateColumn: 'created_at' | 'qualificacao_data' = 'created_at'): Promise<DashboardStats> {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session')?.value;

    if (!userId) {
        console.error("User ID not found in session");
        return { qualified: 0, inProgress: 0, total: 0, disqualified: 0, funnel: [], stepConversion: [] };
    }

    // Common filter function
    const applyAreaFilter = (q: any) => {
        if (area && area !== 'all') {
            return q.eq('area', area);
        }
        return q;
    };

    let leads: any[] = [];
    let totalLeadsCount = 0;

    if (dateColumn === 'created_at') {
        // --- STANDARD MODE (Total) ---
        // Single query based on created_at for everything
        let query = supabase
            .from('Todos os clientes')
            .select('*')
            .eq('ID_empresa', userId);

        query = applyAreaFilter(query);

        if (startDate && endDate) {
            query = query.gte('created_at', startDate).lte('created_at', endDate);
        } else if (startDate) {
            query = query.gte('created_at', startDate);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching data (created_at):', error);
            return { qualified: 0, inProgress: 0, total: 0, disqualified: 0, funnel: [], stepConversion: [] };
        }
        leads = data || [];
        totalLeadsCount = leads.length;

    } else {
        // --- DIÁRIO MODE (Conversion) ---
        // 1. Fetch Total Count (Based on last_message as requested)
        let totalQuery = supabase
            .from('Todos os clientes')
            .select('id', { count: 'exact', head: true })
            .eq('ID_empresa', userId);

        totalQuery = applyAreaFilter(totalQuery);

        if (startDate && endDate) {
            totalQuery = totalQuery.gte('last_message', startDate).lte('last_message', endDate);
        } else if (startDate) {
            totalQuery = totalQuery.gte('last_message', startDate);
        }

        const { count: totalCount, error: totalError } = await totalQuery;
        if (!totalError) {
            totalLeadsCount = totalCount || 0;
        }

        // 2. Fetch Active Data (Mixed Criteria)
        // Part A: Qualified leads (based on qualificacao_data)
        let qualifiedQuery = supabase
            .from('Todos os clientes')
            .select('*')
            .eq('ID_empresa', userId)
            .ilike('Status', 'Concluído'); // Case insensitive check just in case

        qualifiedQuery = applyAreaFilter(qualifiedQuery);

        if (startDate && endDate) {
            qualifiedQuery = qualifiedQuery.gte('qualificacao_data', startDate).lte('qualificacao_data', endDate);
        }

        // Part B: Other leads (In Progress / Disqualified - based on last_message)
        // We exclude 'Concluído' to avoid duplication if ranges overlap weirdly, though unlikely logic-wise
        // Actually, safer to just query everything NOT Concluído matching last_message
        let othersQuery = supabase
            .from('Todos os clientes')
            .select('*')
            .eq('ID_empresa', userId)
            .not('Status', 'ilike', 'Concluído');

        othersQuery = applyAreaFilter(othersQuery);

        if (startDate && endDate) {
            othersQuery = othersQuery.gte('last_message', startDate).lte('last_message', endDate);
        }

        const [qualifiedRes, othersRes] = await Promise.all([qualifiedQuery, othersQuery]);

        if (qualifiedRes.error) console.error("Error fetching qualified:", qualifiedRes.error);
        if (othersRes.error) console.error("Error fetching others:", othersRes.error);

        const qualifiedLeads = qualifiedRes.data || [];
        const otherLeads = othersRes.data || [];

        // Combine for metrics calculation
        leads = [...qualifiedLeads, ...otherLeads];
    }

    // --- METRICS CALCULATION (Shared Logic) ---
    // Note: 'total' in the return object will be 'totalLeadsCount' (created_at based)
    // BUT the funnel/conversion percentages usually rely on the "relevant total" for that context.
    // User said: "interfere apenas nos cards de qualificados... taxa de conversão".
    // If 'total' displayed on card is Created, but Conversion Rate = Qualified / Total... 
    // If Total is Created Today (e.g. 10) and Qualified is Closed Today (e.g. 5), rate is 50%.
    // This makes sense.

    let qualified = 0;
    let disqualified = 0;
    let inProgress = 0;

    leads.forEach((lead: any) => {
        const status = (lead.Status || '').toLowerCase();

        if (status === 'concluído' || status === 'concluido') {
            qualified++;
        } else if (status === 'desqualificado') {
            disqualified++;
        } else {
            inProgress++;
        }
    });

    // Funnel Data (Based on the 'leads' set - i.e., Active/Closed today)
    // The 'total' denominator for percentages inside funnel:
    // Usually funnel % is step-based. 
    // The 'total' field in DashboardStats is often used for the "Total Leads" card.
    // However, the FunnelChart might use 'total' lead count of the *set* to calculate initial drop-off?
    // Let's use leads.length (The Active Set) as the base for funnel percentages if we want to show "Of the leads active today, X% did Y".
    // OR should we use 'totalLeadsCount' (Created)? 
    // If we use Created, and we closed 100 leads today but created 0, percentage > 100%. Bad.
    // So Funnel/Steps should be relative to the *fetched leads* (active/closed).

    // BUT the return object has a single 'total' property used for the Card.
    // We will return totalLeadsCount as 'total' for the Card.
    // For Funnel calculation, we use 'leads.length' (the active set count).

    const activeTotal = leads.length;
    const questions = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12'];

    const funnel = questions.map(q => {
        const count = leads.filter((l: any) => l[q] === true).length;
        return {
            question: q.toUpperCase(),
            count,
            total: activeTotal,
            percentage: activeTotal > 0 ? Math.round((count / activeTotal) * 100) : 0
        };
    });

    const stepConversion = questions.map((q, index) => {
        const count = leads.filter((l: any) => l[q] === true).length;
        const previousCount = index === 0 ? activeTotal : leads.filter((l: any) => l[questions[index - 1]] === true).length;

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
        total: totalLeadsCount, // Keeps the Created count for the Card
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
