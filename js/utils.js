// Global Warming Potential (GWP) Constants
const GWP = {
    CO2: 1,
    CH4: 28,
    N2O: 265
};

// Calculate CO2 Equivalent
function calculateTotalCO2e(co2, ch4, n2o) {
    const c = parseFloat(co2) || 0;
    const m = parseFloat(ch4) || 0;
    const n = parseFloat(n2o) || 0;
    return (c * GWP.CO2) + (m * GWP.CH4) + (n * GWP.N2O);
}

// Linear Regression Algorithm for Prediction
function predictNextMonth(dataPoints) {
    // dataPoints = array of Y values (emissions)
    // We assume X values are 0, 1, 2... (months)
    const n = dataPoints.length;
    if (n < 2) return dataPoints[n-1] || 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    dataPoints.forEach((y, x) => {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict for x = n (the next month index)
    const prediction = slope * n + intercept;
    return Math.max(0, prediction); // No negative emissions
}

// Format Numbers
const formatNum = (num) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
