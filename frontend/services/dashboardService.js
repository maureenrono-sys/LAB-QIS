async function loadDashboardSummary(period) {
    const query = period ? `?period=${encodeURIComponent(period)}` : '';
    return window.labQisApi.apiGet(`/dashboard/summary${query}`);
}

async function loadDashboardAlerts() {
    return window.labQisApi.apiGet('/dashboard/alerts');
}

async function loadRiskHeatMap() {
    return window.labQisApi.apiGet('/dashboard/heatmap');
}

async function recomputeDashboard(period) {
    return window.labQisApi.apiPost('/dashboard/recompute', { period });
}

window.dashboardService = {
    loadDashboardSummary,
    loadDashboardAlerts,
    loadRiskHeatMap,
    recomputeDashboard
};
