function renderKpiCard({ title, value, unit = '', status = 'Good' }) {
    const statusClass = status === 'Critical' ? 'bg-danger' : status === 'Watch' ? 'bg-warning text-dark' : 'bg-success';
    return `
        <div class="card card-stat p-3">
            <h6 class="text-muted small mb-1">${title}</h6>
            <div class="d-flex justify-content-between align-items-center">
                <h3 class="fw-bold mb-0">${value}${unit}</h3>
                <span class="badge ${statusClass}">${status}</span>
            </div>
        </div>
    `;
}

window.renderKpiCard = renderKpiCard;
