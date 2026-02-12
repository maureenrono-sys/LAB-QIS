const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

// Redirect if not logged in
if (!token && !window.location.href.includes('index.html')) {
    window.location.href = 'index.html';
}

// Set dashboard heading to lab name if available
function setLabNameHeading() {
    const heading = document.getElementById('labNameHeading');
    if (!heading) return;
    const labName = localStorage.getItem('labName');
    if (labName && labName.trim().length > 0) {
        heading.textContent = labName;
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

async function loadHomeStats() {
    try {
        setLabNameHeading();
        const res = await fetch(`${API_URL}/benchmarks/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        const statsRow = document.getElementById('statsRow');
        
        // This maps your SLIPTA performance to the top cards
        statsRow.innerHTML = `
            <div class="col-md-3">
                <div class="card card-stat p-3">
                    <h6 class="text-muted small">My SLIPTA Star Level</h6>
                    <h2 class="fw-bold text-primary mb-0">${data.myPerformance} ⭐</h2>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card card-stat p-3">
                    <h6 class="text-muted small">Global Avg Performance</h6>
                    <h2 class="fw-bold text-success mb-0">${data.globalAverage} ⭐</h2>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card card-stat p-3">
                    <h6 class="text-muted small">Open Critical Alerts</h6>
                    <h2 class="fw-bold text-danger mb-0">5</h2>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card card-stat p-3">
                    <h6 class="text-muted small">Avg Turnaround Time</h6>
                    <h2 class="fw-bold text-navy mb-0">3.2h</h2>
                </div>
            </div>
        `;

        // IMPORTANT: Initialize the chart AFTER the HTML is ready
        initTestingChart();
        runServiceChecks();

    } catch (err) {
        console.error("Error loading stats:", err);
    }
}

function initTestingChart() {
    // Check if chart element exists to avoid errors
    const chartEl = document.getElementById('testingOverviewChart');
    if (!chartEl) return;

    const ctx = chartEl.getContext('2d');
    
    // Destroy existing chart if it exists (prevents overlap on reload)
    if (window.myTestingChart) {
        window.myTestingChart.destroy();
    }

    window.myTestingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Test Volume',
                data: [45, 80, 65, 90, 120, 110, 50],
                borderColor: '#1a2a6c',
                backgroundColor: 'rgba(26, 42, 108, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
                x: { grid: { display: false } }
            }
        }
    });
}
async function runServiceChecks() {
    await fetch(`${API_URL}/equipment/check-reminders`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    // Refresh notifications count if the badge exists
    checkNotifications(); 
}

// Initialize
if (document.getElementById('statsRow')) {
    loadHomeStats();
}

async function loadQI() {
    const contentArea = document.getElementById('contentArea');
    
    // 1. Render the HTML Structure (Form + Table)
    contentArea.innerHTML = `
        <h3>Quality Indicators Management</h3>
        <div class="card p-3 mb-4">
            <h5>Add New Indicator</h5>
            <form id="qiForm" class="row g-3">
                <div class="col-md-4">
                    <input type="text" id="qiName" class="form-control" placeholder="Indicator Name (e.g. TAT)" required>
                </div>
                <div class="col-md-3">
                    <select id="qiPhase" class="form-select">
                        <option value="Pre-analytical">Pre-analytical</option>
                        <option value="Analytical">Analytical</option>
                        <option value="Post-analytical">Post-analytical</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <input type="number" id="qiTarget" class="form-control" placeholder="Target %" required>
                </div>
                <div class="col-md-2">
                    <input type="number" id="qiActual" class="form-control" placeholder="Actual %" required>
                </div>
                <div class="col-md-1">
                    <button type="submit" class="btn btn-success">Add</button>
                </div>
            </form>
        </div>

        <table class="table table-hover bg-white shadow-sm">
            <thead class="table-dark">
                <tr>
                    <th>Indicator</th>
                    <th>Phase</th>
                    <th>Target</th>
                    <th>Actual</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody id="qiTableBody">
                </tbody>
        </table>
    `;

    // 2. Handle Form Submission
    document.getElementById('qiForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const qiData = {
            name: document.getElementById('qiName').value,
            phase: document.getElementById('qiPhase').value,
            targetPercentage: document.getElementById('qiTarget').value,
            actualPercentage: document.getElementById('qiActual').value,
            month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        };

        await fetch(`${API_URL}/qi`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(qiData)
        });
        loadQI(); // Refresh the table
    });

    // 3. Fetch and Display Data
    const res = await fetch(`${API_URL}/qi`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const tableBody = document.getElementById('qiTableBody');
    
    tableBody.innerHTML = data.map(qi => `
        <tr>
            <td>${qi.name}</td>
            <td>${qi.phase}</td>
            <td>${qi.targetPercentage}%</td>
            <td>${qi.actualPercentage}%</td>
            <td>
                <span class="badge ${qi.actualPercentage >= qi.targetPercentage ? 'bg-success' : 'bg-danger'}">
                    ${qi.actualPercentage >= qi.targetPercentage ? 'Met' : 'Not Met'}
                </span>
            </td>
            <td>${qi.month}</td>
        </tr>
    `).join('');
}

async function checkNotifications() {
    const res = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const unreadCount = data.filter(n => !n.isRead).length;
    
    // If you add an element with id='notifCount' in dashboard.html
    const countBadge = document.getElementById('notifCount');
    if(countBadge) {
        countBadge.innerText = unreadCount > 0 ? unreadCount : '';
        countBadge.className = unreadCount > 0 ? 'badge bg-danger' : '';
    }
}

// Call this every 30 seconds
setInterval(checkNotifications, 30000);
checkNotifications();

async function loadNC() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h3>Non-Conformance & CAPA Management</h3>
            <button class="btn btn-primary" onclick="showNCModal()">Log New Incident</button>
        </div>

        <div class="row" id="ncList">
            </div>

        <div class="modal fade" id="ncModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Log Non-Conformance</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="ncForm">
                            <div class="mb-3">
                                <label>Description of Incident</label>
                                <textarea id="ncDesc" class="form-control" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label>Severity</label>
                                <select id="ncSeverity" class="form-select">
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Root Cause Analysis</label>
                                <textarea id="ncRootCause" class="form-control" placeholder="Why did this happen?"></textarea>
                            </div>
                            <div class="mb-3">
                                <label>Corrective Action (CAPA)</label>
                                <textarea id="ncCAPA" class="form-control" placeholder="Action taken to prevent recurrence"></textarea>
                            </div>
                            <button type="submit" class="btn btn-success w-100">Save Incident</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Fetch and display NCs
    const res = await fetch(`${API_URL}/nc`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const ncList = document.getElementById('ncList');

    ncList.innerHTML = data.map(nc => `
        <div class="col-md-6 mb-3">
            <div class="card border-start border-4 ${getSeverityColor(nc.severity)} shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <h5 class="card-title">Incident #${nc.id.substring(0,8)}</h5>
                        <span class="badge bg-secondary">${nc.status}</span>
                    </div>
                    <p class="card-text"><strong>Description:</strong> ${nc.description}</p>
                    <p class="card-text"><small class="text-muted">Root Cause: ${nc.rootCause || 'Pending...'}</small></p>
                    <hr>
                    <p class="card-text"><strong>CAPA:</strong> ${nc.correctiveAction || 'Not defined'}</p>
                </div>
            </div>
        </div>
    `).join('');

    // Form submission logic
    document.getElementById('ncForm').onsubmit = async (e) => {
        e.preventDefault();
        const ncData = {
            description: document.getElementById('ncDesc').value,
            severity: document.getElementById('ncSeverity').value,
            rootCause: document.getElementById('ncRootCause').value,
            correctiveAction: document.getElementById('ncCAPA').value
        };

        await fetch(`${API_URL}/nc`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(ncData)
        });
        
        // Hide modal and refresh
        const modal = bootstrap.Modal.getInstance(document.getElementById('ncModal'));
        modal.hide();
        loadNC();
    };
}

// Helper for UI colors
function getSeverityColor(sev) {
    if (sev === 'Critical') return 'border-danger';
    if (sev === 'High') return 'border-warning';
    return 'border-info';
}

// Helper to open modal
function showNCModal() {
    new bootstrap.Modal(document.getElementById('ncModal')).show();
}
async function loadDocs() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="d-flex justify-content-between mb-4">
            <h3>Document Control</h3>
            <div class="card p-3 w-50 shadow-sm">
                <h6>Upload New SOP</h6>
                <form id="docForm">
                    <input type="text" id="docTitle" class="form-control mb-2" placeholder="SOP Title" required>
                    <select id="docDept" class="form-select mb-2">
                        <option value="Quality">Quality (General/Management)</option>
                        <option value="Reception">Reception</option>
                        <option value="Phlebotomy">Phlebotomy</option>
                        <option value="Hematology">Hematology</option>
                        <option value="Biochemistry">Biochemistry</option>
                        <option value="Serology">Serology</option>
                        <option value="Parasitology">Parasitology</option>
                        <option value="Bacteriology">Bacteriology</option>
                        <option value="TB Lab">TB Lab</option>
                        <option value="Blood Bank">Blood Bank</option>
                        <option value="Molecular">Molecular</option>
                    </select>
                    <input type="file" id="docFile" class="form-control mb-2" required>
                    <button type="submit" class="btn btn-primary btn-sm w-100">Upload SOP</button>
                </form>
            </div>
        </div>

        <div class="mb-3">
            <input type="text" id="docSearch" class="form-control" placeholder="Search SOPs by title or department..." onkeyup="filterDocs()">
        </div>

        <table class="table bg-white shadow-sm">
            <thead class="table-dark">
                <tr>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody id="docTableBody"></tbody>
        </table>
    `;

    // Fetch and Display with Filtering Logic
    const res = await fetch(`${API_URL}/docs`, { headers: { 'Authorization': `Bearer ${token}` } });
    window.allDocs = await res.json(); // Store globally for searching
    renderDocTable(window.allDocs);
}

function renderDocTable(docs) {
    document.getElementById('docTableBody').innerHTML = docs.map(doc => `
        <tr>
            <td>${doc.title}</td>
            <td><span class="badge bg-secondary">${doc.department}</span></td>
            <td>${new Date(doc.createdAt).toLocaleDateString()}</td>
            <td><a href="http://localhost:5000/${doc.filePath}" target="_blank" >Open File</a></td>
        </tr>
    `).join('');
}

function filterDocs() {
    const term = document.getElementById('docSearch').value.toLowerCase();
    const filtered = window.allDocs.filter(d => 
        d.title.toLowerCase().includes(term) || d.department.toLowerCase().includes(term)
    );
    renderDocTable(filtered);
}

async function checkNotifications() {
    const res = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const unread = data.filter(n => !n.isRead);
    
    const countBadge = document.getElementById('notifCount');
    if(countBadge) {
        countBadge.innerText = unread.length > 0 ? unread.length : '';
    }
}

function toggleNotifSidebar() {
    const sidebar = document.getElementById('notifSidebar');
    if (sidebar.style.right === '0px') {
        sidebar.style.right = '-350px';
    } else {
        sidebar.style.right = '0px';
        loadNotifsIntoSidebar(); // Refresh list when opening
    }
}

async function loadNotifsIntoSidebar() {
    const res = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const list = document.getElementById('notifList');
    
    list.innerHTML = data.map(n => `
        <div class="card mb-2 ${n.isRead ? 'opacity-75' : 'border-primary shadow-sm'}">
            <div class="card-body p-2">
                <p class="small mb-1">${n.message}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-light text-dark" style="font-size: 0.7rem;">${new Date(n.createdAt).toLocaleTimeString()}</span>
                    ${!n.isRead ? `<button class="btn btn-sm btn-link p-0" onclick="markRead('${n.id}')" style="font-size: 0.7rem;">Mark as read</button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

async function markRead(id) {
    await fetch(`${API_URL}/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    checkNotifications(); // Update the bell badge
    loadNotifsIntoSidebar(); // Update the list
}

// Check for notifications every 10 seconds
setInterval(checkNotifications, 10000);
checkNotifications();

async function loadAudits() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h3>SLIPTA / ISO 15189 Audit</h3>
            <button class="btn btn-primary" onclick="showAuditForm()">New Self-Assessment</button>
        </div>

        <div id="auditHistory" class="row">
            </div>

        <div id="auditFormContainer" class="card shadow p-4 d-none">
            <h4>New SLIPTA Assessment</h4>
            <hr>
            <form id="sliptaForm">
                <div class="mb-3">
                    <label class="form-label">Audit Type</label>
                    <select id="auditType" class="form-select w-25">
                        <option value="Internal">Internal Audit</option>
                        <option value="SLIPTA Baseline">SLIPTA Baseline</option>
                    </select>
                </div>

                <table class="table align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>SLIPTA Clause</th>
                            <th>Findings / Objective Evidence</th>
                            <th>Score (0-5)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1.0 Management Responsibility</td>
                            <td><input type="text" class="form-control finding" placeholder="Evidence found..."></td>
                            <td><input type="number" class="form-control score" min="0" max="5" value="0"></td>
                        </tr>
                        <tr>
                            <td>2.0 Documents & Records</td>
                            <td><input type="text" class="form-control finding" placeholder="Evidence found..."></td>
                            <td><input type="number" class="form-control score" min="0" max="5" value="0"></td>
                        </tr>
                        <tr>
                            <td>3.0 Facilities & Safety</td>
                            <td><input type="text" class="form-control finding" placeholder="Evidence found..."></td>
                            <td><input type="number" class="form-control score" min="0" max="5" value="0"></td>
                        </tr>
                    </tbody>
                </table>
                <div class="text-end">
                    <button type="button" class="btn btn-secondary" onclick="loadAudits()">Cancel</button>
                    <button type="submit" class="btn btn-success">Submit & Calculate Stars</button>
                </div>
            </form>
        </div>
    `;

    loadAuditHistory();
}

function showAuditForm() {
    document.getElementById('auditHistory').classList.add('d-none');
    document.getElementById('auditFormContainer').classList.remove('d-none');
}

// Handle Audit Submission
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'sliptaForm') {
        e.preventDefault();
        
        const clauses = ["1.0 Management Responsibility", "2.0 Documents & Records", "3.0 Facilities & Safety"];
        const findings = [];
        const scoreInputs = document.querySelectorAll('.score');
        const findingInputs = document.querySelectorAll('.finding');

        clauses.forEach((clause, index) => {
            findings.push({
                clause: clause,
                scoreObtained: parseInt(scoreInputs[index].value),
                maxScore: 5,
                findingNote: findingInputs[index].value
            });
        });

        const res = await fetch(`${API_URL}/audits`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                auditType: document.getElementById('auditType').value,
                findings: findings
            })
        });

        if (res.ok) {
            alert("Audit Completed Successfully!");
            loadAudits();
            loadHomeStats(); // Update the stars on the dashboard
        }
    }
});

async function loadAuditHistory() {
    const res = await fetch(`${API_URL}/audits`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    // Note: You might need to add a GET /api/audits route to your backend auditController
    // For now, we will display the result of the submission.
}

async function loadAnalytics() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <h3>Quality Performance Analytics</h3>
        <p class="text-muted">Comparing Actual Performance against ISO 15189 Targets</p>
        <div class="card shadow p-4">
            <canvas id="qiChart" width="400" height="150"></canvas>
        </div>
        <div id="riskAssessment" class="mt-4"></div>
    `;

    const res = await fetch(`${API_URL}/qi`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.length === 0) {
        document.getElementById('riskAssessment').innerHTML = `<div class="alert alert-warning">No data available to chart. Add Quality Indicators first.</div>`;
        return;
    }

    const labels = data.map(qi => qi.name);
    const actuals = data.map(qi => qi.actualPercentage);
    const targets = data.map(qi => qi.targetPercentage);

    const ctx = document.getElementById('qiChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Actual Performance (%)',
                    data: actuals,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'ISO Target (%)',
                    data: targets,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    type: 'line' // This makes the target look like a threshold line
                }
            ]
        },
        options: {
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });

    // Simple Risk Detection Logic (Section 10)
    const failing = data.filter(qi => parseFloat(qi.actualPercentage) < parseFloat(qi.targetPercentage));
    const riskDiv = document.getElementById('riskAssessment');
    if (failing.length > 0) {
        riskDiv.innerHTML = `
            <div class="alert alert-danger">
                <h5>⚠️ Risk Detected</h5>
                <p>${failing.length} Indicators are currently below the required ISO target. Priority: ${failing[0].phase} phase.</p>
            </div>
        `;
    } else {
        riskDiv.innerHTML = `<div class="alert alert-success">✅ All quality indicators are meeting or exceeding targets.</div>`;
    }
}

async function loadDeptView(deptName) {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <h2>${deptName} Department</h2>
            <div>
                <button class="btn btn-outline-dark btn-sm me-2" onclick="printEquipmentLog('${deptName}')">
                    🖨️ Print Equipment Log
                </button>
                <span class="badge bg-info p-2">ISO 15189 Section 5.0 - 6.0</span>
            </div>
        </div>
        <hr>
        
        <div class="row">
            <div class="col-md-7">
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-primary text-white d-flex justify-content-between">
                        <span>Standard Operating Procedures (SOPs)</span>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <thead><tr><th>Title</th><th>Action</th></tr></thead>
                            <tbody id="deptSopTable">
                                <tr><td colspan="2" class="text-center text-muted">Loading SOPs...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="col-md-5">
                <div class="card shadow-sm">
                    <div class="card-header bg-success text-white">Equipment Log & Maintenance</div>
                    <div class="card-body">
                        <div id="deptEquip">
                            <p class="text-muted small">Loading maintenance status...</p>
                        </div>
                        <div id="adminEquipmentControls"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 1. Fetch & Filter SOPs
    try {
        const docRes = await fetch(`${API_URL}/docs`, { headers: { 'Authorization': `Bearer ${token}` } });
        const allDocs = await docRes.json();
        const deptDocs = allDocs.filter(d => d.department === deptName);
        
        document.getElementById('deptSopTable').innerHTML = deptDocs.map(doc => `
            <tr>
                <td class="align-middle">${doc.title}</td>
                <td class="text-end">
                    <div class="btn-group shadow-sm">
                        <a href="http://localhost:5000/${doc.filePath}" target="_blank" class="btn btn-sm btn-outline-primary">
                            👁️ View
                        </a>
                        <button onclick="printSOP('http://localhost:5000/${doc.filePath}')" class="btn btn-sm btn-outline-secondary">
                            🖨️ Print
                        </button>
                    </div>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="2" class="text-center text-muted">No documents found for this department.</td></tr>';
    } catch (err) { console.error("SOP Fetch Error:", err); }

    // 2. Fetch & Filter Equipment
    try {
        const equipRes = await fetch(`${API_URL}/equipment/dept/${deptName}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const equip = await equipRes.json();
        
        document.getElementById('deptEquip').innerHTML = equip.map(e => `
            <div class="border-bottom p-2 mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <strong>${e.name}</strong>
                    <span class="badge ${e.status === 'Operational' ? 'bg-success' : 'bg-danger'}">${e.status}</span>
                </div>
                <small class="text-muted d-block">SN: ${e.serialNumber || 'N/A'}</small>
                <small class="d-block">Next Service: <b>${new Date(e.nextServiceDate).toLocaleDateString()}</b></small>
                
                ${(localStorage.getItem('userRole') === 'System Administrator' || localStorage.getItem('userRole') === 'Laboratory Manager') ? 
                    `<button class="btn btn-sm btn-outline-primary mt-2 py-0" style="font-size: 0.75rem;" 
                        onclick="showMaintenanceModal('${e.id}', '${e.name}')">Record Service</button>` 
                    : ''
                }
            </div>
        `).join('') || '<p class="text-muted">No equipment registered.</p>';
        
        // 3. Permission Check for "Add Equipment" button
        // Assuming user role is stored in localStorage or decoded from token
        const userRole = localStorage.getItem('userRole'); 
        if (userRole === 'Admin' || userRole === 'Lab Manager') {
            document.getElementById('adminEquipmentControls').innerHTML = `
                <button class="btn btn-sm btn-outline-success mt-3 w-100" onclick="showAddEquipModal('${deptName}')">
                    + Register New Equipment
                </button>
            `;
        }
    } catch (err) { console.error("Equip Fetch Error:", err); }
}

function loadAbout() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card shadow-lg p-5">
                    <h1 class="text-center text-primary mb-4">Laboratory Quality Commitment</h1>
                    <div class="mb-4">
                        <h4>Our Mission</h4>
                        <p class="lead">To provide accurate, timely, and clinically relevant laboratory results through innovative technology and a commitment to quality, ensuring superior patient care.</p>
                    </div>
                    <div class="mb-4">
                        <h4>Our Vision</h4>
                        <p class="lead">To be the regional leader in diagnostic excellence, recognized for our adherence to international ISO 15189 standards and community trust.</p>
                    </div>
                    <hr>
                    <div class="alert alert-secondary">
                        <h6>Quality Policy Statement</h6>
                        <p class="small">The laboratory management is committed to professional practice and the quality of its examinations. All personnel are familiar with the quality documentation and implement the policies and procedures in their work.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Function to show the modal and set the department automatically
function showAddEquipModal(deptName) {
    document.getElementById('equipDept').value = deptName;
    const myModal = new bootstrap.Modal(document.getElementById('equipModal'));
    myModal.show();
}

// Handle Equipment Form Submission
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'equipForm') {
        e.preventDefault();
        
        const equipData = {
            name: document.getElementById('equipName').value,
            serialNumber: document.getElementById('equipSN').value,
            nextServiceDate: document.getElementById('equipService').value,
            status: document.getElementById('equipStatus').value,
            department: document.getElementById('equipDept').value
        };

        try {
            const res = await fetch(`${API_URL}/equipment`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(equipData)
            });

            if (res.ok) {
                // Close modal
                const modalElement = document.getElementById('equipModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                modalInstance.hide();
                
                // Refresh the view
                loadDeptView(equipData.department);
            } else {
                const error = await res.json();
                alert(error.message);
            }
        } catch (err) {
            console.error("Error saving equipment:", err);
        }
    }
});

function printEquipmentLog(deptName) {
    const equipContent = document.getElementById('deptEquip').innerHTML;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Equipment Log - ${deptName}</title>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
                <style>
                    body { padding: 20px; }
                    .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h1>Laboratory Equipment Log</h1>
                    <h3>Department: ${deptName}</h3>
                    <p>Printed on: ${new Date().toLocaleString()}</p>
                </div>
                <div class="table-content">
                    ${equipContent}
                </div>
                <div class="mt-5">
                    <p>Verified By: ___________________________ Date: __________</p>
                </div>
                <script>
                    setTimeout(() => { window.print(); window.close(); }, 500);
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// Function to open modal and fill initial data
function showMaintenanceModal(equipId, equipName) {
    document.getElementById('maintEquipId').value = equipId;
    document.getElementById('maintTitle').innerText = `Record Service: ${equipName}`;
    document.getElementById('maintDate').valueAsDate = new Date(); // Default to today
    
    const modal = new bootstrap.Modal(document.getElementById('maintenanceModal'));
    modal.show();
}

// Handle Maintenance Form Submission
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'maintForm') {
        e.preventDefault();
        
        const payload = {
            equipmentId: document.getElementById('maintEquipId').value,
            serviceDate: document.getElementById('maintDate').value,
            nextServiceDate: document.getElementById('maintNextDate').value,
            technicianName: document.getElementById('maintTech').value,
            notes: document.getElementById('maintNotes').value
        };

        try {
            const res = await fetch(`${API_URL}/equipment/maintenance`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Maintenance record saved successfully!");
                bootstrap.Modal.getInstance(document.getElementById('maintenanceModal')).hide();
                // Refresh the current view to show updated service date
                loadHomeStats(); 
            } else {
                const err = await res.json();
                alert("Error: " + err.message);
            }
        } catch (error) {
            console.error("Maintenance save failed:", error);
        }
    }
});

function printSOP(pdfUrl) {
    // Opens the PDF in a new window/tab and triggers the print dialog
    const printWindow = window.open(pdfUrl, '_blank');
    printWindow.addEventListener('load', function() {
        printWindow.print();
    }, true);
}

document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('userRole');
    const uploadBtn = document.getElementById('uploadBtn');

    // Check if the button exists on the current page and if the user is NOT a QA_MANAGER
    if (uploadBtn && userRole !== 'QA_MANAGER') {
        uploadBtn.style.display = 'none';
        console.log("Access Control: Upload button hidden for role:", userRole);
    }
});

/**
 * Westgard Checker
 * @param {Array} data - Array of QC values
 * @param {Number} mean - The target Mean
 * @param {Number} sd - The Standard Deviation
 */
function checkWestgardRules(data, mean, sd) {
    const alertDiv = document.getElementById('westgardAlert');
    const lastValue = data[data.length - 1];
    const prevValue = data[data.length - 2];

    // Rule 1:3s (Violation if a single point is outside 3SD)
    if (Math.abs(lastValue - mean) > 3 * sd) {
        alertDiv.innerHTML = "⚠️ VIOLATION: Rule 1-3s (Point exceeds 3SD). Reject Run!";
        alertDiv.className = "text-danger fw-bold small mt-1";
        return "REJECT";
    }

    // Rule 2:2s (Violation if two consecutive points are outside 2SD on the same side)
    const lastDiff = lastValue - mean;
    const prevDiff = prevValue - mean;
    
    if (Math.abs(lastDiff) > 2 * sd && Math.abs(prevDiff) > 2 * sd) {
        // Check if they are on the same side of the mean
        if ((lastDiff > 0 && prevDiff > 0) || (lastDiff < 0 && prevDiff < 0)) {
            alertDiv.innerHTML = "⚠️ VIOLATION: Rule 2-2s (2 points outside 2SD). Reject Run!";
            alertDiv.className = "text-danger fw-bold small mt-1";
            return "REJECT";
        }
    }

    // Rule 1:2s (Warning if a point is outside 2SD)
    if (Math.abs(lastValue - mean) > 2 * sd) {
        alertDiv.innerHTML = "🔔 WARNING: Rule 1-2s (Point exceeds 2SD). Inspect data.";
        alertDiv.className = "text-warning fw-bold small mt-1";
        return "WARNING";
    }

    // If all pass
    alertDiv.innerHTML = "✓ System In Control (All Westgard rules passed).";
    alertDiv.className = "text-success fw-bold small mt-1";
    return "PASS";
}
