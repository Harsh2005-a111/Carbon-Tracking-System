// --- API Layer ---

// 1. Fetch Dashboard Stats (from View)
async function getDashboardStats(orgId) {
    const { data, error } = await sbClient
        .from('net_emissions_per_org')
        .select('*')
        .eq('org_id', orgId)
        .maybeSingle();

    if (error) console.error("Stats Error:", error);
    // Return zeros if no data found (e.g., new org)
    return data || { total_co2e_kg: 0, net_co2e_kg: 0, total_offset_kg: 0 };
}

// 2. Fetch Emission Records (Joined Data)
async function getEmissionRecords(orgId) {
    // We filter by filtering the nested department->org connection
    const { data, error } = await sbClient
        .from('emission_record')
        .select(`
            *,
            emission_source!inner (
                source_name,
                source_type,
                dept_id,
                department!inner ( org_id )
            ),
            activity ( activity_name )
        `)
        .eq('emission_source.department.org_id', orgId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Fetch Records Error:', error);
        return [];
    }

    // Calculate total_co2e for frontend display
    return data.map(r => ({
        ...r,
        total_co2e: calculateTotalCO2e(r.co2_emission_kg, r.ch4_emission_kg, r.n2o_emission_kg)
    }));
}

// 3. Add New Record
async function addEmissionRecord(record) {
    const { data, error } = await sbClient
        .from('emission_record')
        .insert([record]);
    return { data, error };
}

// 4. Fetch Sources for Dropdown
async function getSources(orgId) {
    const { data } = await sbClient
        .from('emission_source')
        .select(`
            source_id, source_name, source_type,
            department!inner (org_id)
        `)
        .eq('department.org_id', orgId);
    return data || [];
}

// 5. Fetch Org Location Name
async function getOrgLocation(orgId) {
    const { data } = await sbClient
        .from('organization_location')
        .select('location')
        .eq('org_id', orgId)
        .maybeSingle();
    return data ? data.location : 'Delhi';
}

// 6. Realtime Listener
function subscribeToEmissions(callback) {
    sbClient
        .channel('public:emission_record')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'emission_record' }, () => {
            console.log('Data updated!');
            callback();
        })
        .subscribe();
}
