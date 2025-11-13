// --- Charts & Maps Module ---

let chartInstances = {}; // Store charts to destroy them before redrawing

// 1. Line Chart with Prediction
function renderTrendChart(ctxId, records) {
    const ctx = document.getElementById(ctxId);
    if(!ctx) return;

    // Aggregate Data by Month (YYYY-MM)
    const monthlyData = {};
    records.forEach(r => {
        const m = r.date.substring(0, 7);
        if (!monthlyData[m]) monthlyData[m] = 0;
        monthlyData[m] += r.total_co2e;
    });

    const labels = Object.keys(monthlyData).sort();
    const dataHistory = labels.map(m => monthlyData[m]);

    // Predict Next Value
    const nextVal = predictNextMonth(dataHistory);

    if (chartInstances[ctxId]) chartInstances[ctxId].destroy();

    chartInstances[ctxId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [...labels, 'Forecast'],
            datasets: [{
                label: 'Actual CO2e (kg)',
                data: [...dataHistory, null],
                borderColor: '#2c7a7b',
                tension: 0.2,
                fill: false
            }, {
                label: 'Predicted',
                data: [...Array(dataHistory.length - 1).fill(null), dataHistory[dataHistory.length-1], nextVal],
                borderColor: '#e53e3e',
                borderDash: [5, 5],
                fill: false
            }]
        },
        options: { responsive: true }
    });
}

// 2. Doughnut Chart (Gas Breakdown)
function renderGasBreakdown(ctxId, records) {
    const ctx = document.getElementById(ctxId);
    if(!ctx) return;

    let tCO2 = 0, tCH4 = 0, tN2O = 0;
    records.forEach(r => {
        tCO2 += r.co2_emission_kg * GWP.CO2;
        tCH4 += r.ch4_emission_kg * GWP.CH4;
        tN2O += r.n2o_emission_kg * GWP.N2O;
    });

    if (chartInstances[ctxId]) chartInstances[ctxId].destroy();

    chartInstances[ctxId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['CO2', 'CH4 (Eq)', 'N2O (Eq)'],
            datasets: [{
                data: [tCO2, tCH4, tN2O],
                backgroundColor: ['#319795', '#E53E3E', '#DD6B20']
            }]
        }
    });
}

// --- MAP & AQI LOGIC (Merged Here) ---

// Hardcoded Coordinates for Demo Locations
const LOCATION_COORDS = {
    'Okhla Industrial Area': [28.5272, 77.2837],
    'Manesar': [28.3524, 76.9355],
    'Sector 62 Noida': [28.6208, 77.3639],
    'New York': [40.7128, -74.0060], // Fallbacks for original sample data
    'Delhi': [28.6139, 77.2090]
};

async function initMap(elemId, userLocationName) {
    if (!document.getElementById(elemId)) return;

    // Get Coords
    const center = LOCATION_COORDS[userLocationName] || LOCATION_COORDS['Delhi'];

    // Init Leaflet
    const map = L.map(elemId).setView(center, 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap'
    }).addTo(map);

    // User Marker
    L.marker(center).addTo(map).bindPopup(`<b>${userLocationName}</b><br>Your Org`).openPopup();

    // Fetch OpenAQ Data (Realtime)
    // Using coordinates radius search around Delhi to find active sensors
    const url = `https://api.openaq.org/v2/measurements?coordinates=${center[0]},${center[1]}&radius=25000&parameter=pm25&limit=10`;

    try {
        const resp = await fetch(url);
        const json = await resp.json();

        json.results.forEach(pt => {
            const val = pt.value;
            const color = val > 100 ? '#E53E3E' : (val > 50 ? '#DD6B20' : '#38A169'); // Red, Orange, Green

            L.circleMarker([pt.coordinates.latitude, pt.coordinates.longitude], {
                radius: 8,
                fillColor: color,
                color: "#fff",
                weight: 1,
                fillOpacity: 0.8
            }).addTo(map).bindPopup(`
                <b>AQI Sensor</b><br>
                PM2.5: ${val}<br>
                ${pt.location}
            `);
        });
    } catch (e) {
        console.warn("AQI Fetch failed (likely API limits or cors):", e);
    }
}
