const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

const ROLE_KEYS = Object.freeze({
    ADMIN: 'ADMIN',
    LAB_MANAGER: 'LAB_MANAGER',
    QUALITY_ASSURANCE_MANAGER: 'QUALITY_ASSURANCE_MANAGER',
    LAB_TECHNOLOGIST: 'LAB_TECHNOLOGIST'
});

const ROLE_KEY_BY_LABEL = Object.freeze({
    'System Administrator': ROLE_KEYS.ADMIN,
    'Laboratory Manager': ROLE_KEYS.LAB_MANAGER,
    'Quality Officer': ROLE_KEYS.QUALITY_ASSURANCE_MANAGER,
    'Laboratory Technologist': ROLE_KEYS.LAB_TECHNOLOGIST
});

const ROLE_LABEL_BY_KEY = Object.freeze({
    [ROLE_KEYS.ADMIN]: 'Admin',
    [ROLE_KEYS.LAB_MANAGER]: 'Lab Manager',
    [ROLE_KEYS.QUALITY_ASSURANCE_MANAGER]: 'Quality Assurance Manager',
    [ROLE_KEYS.LAB_TECHNOLOGIST]: 'Lab Technologist'
});

const currentRoleLabel = localStorage.getItem('userRole') || '';
const loggedInRoleKey = localStorage.getItem('roleKey') || ROLE_KEY_BY_LABEL[currentRoleLabel] || null;
const previewRoleKey = localStorage.getItem('viewRoleKey') || '';
const isDemoMode = localStorage.getItem('isDemoMode') === 'true';
let currentRoleKey = (loggedInRoleKey === ROLE_KEYS.ADMIN && isDemoMode && previewRoleKey)
    ? previewRoleKey
    : loggedInRoleKey;

if (!token && !window.location.href.includes('index.html')) {
    window.location.href = 'index.html';
}

function isManagerOrAdmin() {
    return [ROLE_KEYS.ADMIN, ROLE_KEYS.LAB_MANAGER].includes(loggedInRoleKey);
}

function normalizeDepartmentLabel(department) {
    return department === 'Bacteriology' ? 'Microbiology' : department;
}

const DOCUMENT_DEPARTMENT_ORDER = [
    'Quality',
    'Reception',
    'Phlebotomy',
    'Hematology',
    'Biochemistry',
    'Serology',
    'Microbiology',
    'Blood Bank',
    'Molecular',
    'Histology',
    'Parasitology',
    'TB Lab'
];

const DASHBOARD_DEPARTMENTS = [
    'Hematology',
    'Biochemistry',
    'Serology',
    'Parasitology',
    'Microbiology',
    'TB Lab',
    'Blood Bank',
    'Molecular',
    'Histology',
    'Reception',
    'Phlebotomy',
    'Quality'
];

const SLIPTA_CHECKLIST = [
    { clause: '1.0 Organization & Personnel - Organizational structure and responsibilities', maxScore: 5 },
    { clause: '1.0 Organization & Personnel - Personnel files and competency records', maxScore: 5 },
    { clause: '1.0 Organization & Personnel - Staffing adequacy and duty rosters', maxScore: 3 },
    { clause: '1.0 Organization & Personnel - Orientation and continuing education', maxScore: 4 },
    { clause: '2.0 Documents & Records - Quality manual and policy documents', maxScore: 5 },
    { clause: '2.0 Documents & Records - SOP availability at point of use', maxScore: 5 },
    { clause: '2.0 Documents & Records - Version control and archival', maxScore: 4 },
    { clause: '2.0 Documents & Records - Record retention and traceability', maxScore: 4 },
    { clause: '3.0 Management Reviews - Review frequency and agenda coverage', maxScore: 4 },
    { clause: '3.0 Management Reviews - Actions tracked to closure', maxScore: 4 },
    { clause: '4.0 Client Management - Service agreements and feedback process', maxScore: 4 },
    { clause: '4.0 Client Management - Complaint handling and CAPA linkage', maxScore: 4 },
    { clause: '5.0 Equipment - Equipment inventory and unique identification', maxScore: 5 },
    { clause: '5.0 Equipment - Calibration and preventive maintenance', maxScore: 5 },
    { clause: '5.0 Equipment - Breakdown records and downtime mitigation', maxScore: 4 },
    { clause: '6.0 Internal Audit - Annual audit plan and scope', maxScore: 4 },
    { clause: '6.0 Internal Audit - Qualified auditors and impartiality', maxScore: 4 },
    { clause: '6.0 Internal Audit - Nonconformity follow-up and verification', maxScore: 5 },
    { clause: '7.0 Purchasing & Inventory - Approved suppliers list', maxScore: 3 },
    { clause: '7.0 Purchasing & Inventory - Reagent stock control and FEFO', maxScore: 5 },
    { clause: '7.0 Purchasing & Inventory - Lot verification before use', maxScore: 4 },
    { clause: '8.0 Process Control - Sample reception and rejection criteria', maxScore: 5 },
    { clause: '8.0 Process Control - Internal quality control performance', maxScore: 5 },
    { clause: '8.0 Process Control - EQA/PT participation and action plans', maxScore: 5 },
    { clause: '8.0 Process Control - Method validation and verification', maxScore: 5 },
    { clause: '9.0 Information Management - LIS access control and confidentiality', maxScore: 4 },
    { clause: '9.0 Information Management - Data backup and recovery testing', maxScore: 4 },
    { clause: '9.0 Information Management - Result authorization and amendments', maxScore: 4 },
    { clause: '10.0 Corrective Action - Root cause analysis quality', maxScore: 5 },
    { clause: '10.0 Corrective Action - CAPA timeliness and effectiveness', maxScore: 5 },
    { clause: '11.0 Occurrence Management - Incident logging completeness', maxScore: 4 },
    { clause: '11.0 Occurrence Management - Risk-based process improvement', maxScore: 4 },
    { clause: '12.0 Facilities & Safety - Biosafety program implementation', maxScore: 5 },
    { clause: '12.0 Facilities & Safety - Waste management and decontamination', maxScore: 4 },
    { clause: '12.0 Facilities & Safety - Fire and emergency preparedness', maxScore: 4 }
];

function getCoverClassByDepartment(department) {
    const slug = (normalizeDepartmentLabel(department || 'Quality') || 'Quality')
        .toLowerCase()
        .replace(/\s+/g, '-');
    return `cover-${slug}`;
}

function sortDocsByDepartment(docs) {
    const departmentIndex = new Map(
        DOCUMENT_DEPARTMENT_ORDER.map((dept, idx) => [dept, idx])
    );

    return [...docs].sort((a, b) => {
        const deptA = normalizeDepartmentLabel(a.department || 'Quality');
        const deptB = normalizeDepartmentLabel(b.department || 'Quality');
        const orderA = departmentIndex.has(deptA) ? departmentIndex.get(deptA) : 999;
        const orderB = departmentIndex.has(deptB) ? departmentIndex.get(deptB) : 999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.title || '').localeCompare(b.title || '');
    });
}

function setLabNameHeading() {
    const heading = document.getElementById('labNameHeading');
    if (!heading) return;

    const labName = localStorage.getItem('labName');
    if (labName && labName.trim().length > 0) {
        heading.textContent = labName;
    }

    const roleBadge = document.getElementById('roleBadge');
    if (roleBadge) {
        roleBadge.textContent = ROLE_LABEL_BY_KEY[currentRoleKey] || currentRoleLabel || 'User';
    }

    const welcomeBtn = document.getElementById('userWelcomeBtn');
    if (welcomeBtn) {
        const fullName = localStorage.getItem('fullName') || 'User';
        welcomeBtn.textContent = `Welcome, ${fullName}`;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('roleKey');
    localStorage.removeItem('viewRoleKey');
    localStorage.removeItem('labName');
    localStorage.removeItem('fullName');
    window.location.href = 'index.html';
}

function initRolePreviewControl() {
    const rolePreviewSelect = document.getElementById('rolePreviewSelect');
    if (!rolePreviewSelect) return;

    // Role preview switcher is demo-only and admin-only.
    if (!isDemoMode || loggedInRoleKey !== ROLE_KEYS.ADMIN) {
        rolePreviewSelect.classList.add('d-none');
        currentRoleKey = loggedInRoleKey;
        return;
    }

    rolePreviewSelect.classList.remove('d-none');
    rolePreviewSelect.value = localStorage.getItem('viewRoleKey') || ROLE_KEYS.ADMIN;
    currentRoleKey = rolePreviewSelect.value || ROLE_KEYS.ADMIN;

    rolePreviewSelect.addEventListener('change', () => {
        const selected = rolePreviewSelect.value || ROLE_KEYS.ADMIN;
        localStorage.setItem('viewRoleKey', selected);
        currentRoleKey = selected;
        loadHomeStats();
    });
}

function renderDashboardByRole(data) {
    const statsRow = document.getElementById('statsRow');
    const contentArea = document.getElementById('contentArea');
    const labNameDisplay = document.getElementById('labNameDisplay');
    const dashboardRoleHero = document.getElementById('dashboardRoleHero');

    if (!statsRow) return;

    const roleTitle = ROLE_LABEL_BY_KEY[currentRoleKey] || 'User';
    if (labNameDisplay) {
        labNameDisplay.textContent = `${localStorage.getItem('labName') || 'Welcome'} - ${roleTitle}`;
    }

    const dashboardConfigByRole = {
        [ROLE_KEYS.ADMIN]: {
            roleName: 'Admin',
            subtitle: 'System-wide quality governance and oversight actions.',
            metrics: { m1: 'My Star Level', m2: 'Global Avg', m3: 'Critical Alerts' },
            actions: [
                { href: 'analytics.html', label: 'View Analytics', btn: 'btn-primary' },
                { href: 'audits.html', label: 'Audit Oversight', btn: 'btn-warning' },
                { href: 'documents.html', label: 'Document Control', btn: 'btn-success' },
                { href: 'equipment.html', label: 'Equipment Governance', btn: 'btn-sidebar-primary' }
            ]
        },
        [ROLE_KEYS.LAB_MANAGER]: {
            roleName: 'Lab Manager',
            subtitle: 'Operational quality performance and management review actions.',
            metrics: { m1: 'Lab Star Level', m2: 'Peer Average', m3: 'Priority Alerts' },
            actions: [
                { href: 'audits.html', label: 'Run Self-Assessment', btn: 'btn-primary' },
                { href: 'analytics.html', label: 'Risk & Analytics', btn: 'btn-warning' },
                { href: 'documents.html', label: 'Approve SOPs', btn: 'btn-success' },
                { href: 'equipment.html', label: 'Equipment Planning', btn: 'btn-sidebar-primary' }
            ]
        },
        [ROLE_KEYS.QUALITY_ASSURANCE_MANAGER]: {
            roleName: 'Quality Assurance Manager',
            subtitle: 'Quality control, CAPA monitoring, and compliance assurance.',
            metrics: { m1: 'Current Star', m2: 'Quality Trend', m3: 'Open Alerts' },
            actions: [
                { href: 'qc.html', label: 'Monitor IQC', btn: 'btn-primary' },
                { href: 'nc-capa.html', label: 'NC & CAPA Tracker', btn: 'btn-warning' },
                { href: 'audits.html', label: 'Audit Records', btn: 'btn-sidebar-primary' },
                { href: 'documents.html', label: 'Controlled Documents', btn: 'btn-success' }
            ]
        },
        [ROLE_KEYS.LAB_TECHNOLOGIST]: {
            roleName: 'Lab Technologist',
            subtitle: 'Daily technical quality tasks and laboratory operations.',
            metrics: { m1: 'My Lab Star', m2: 'Peer Average', m3: 'Assigned Alerts' },
            actions: [
                { href: 'qc.html', label: 'Daily QC', btn: 'btn-primary' },
                { href: 'equipment.html', label: 'Maintenance Log', btn: 'btn-warning' },
                { href: 'indicators.html', label: 'Record Indicators', btn: 'btn-sidebar-primary' },
                { href: 'nc-capa.html', label: 'Report NC/CAPA', btn: 'btn-success' }
            ]
        }
    };

    const dashboardConfig = dashboardConfigByRole[currentRoleKey] || dashboardConfigByRole[ROLE_KEYS.LAB_TECHNOLOGIST];
    const actionButtons = dashboardConfig.actions
        .map((action) => `<a class="btn ${action.btn}" href="${action.href}">${action.label}</a>`)
        .join('');

    if (dashboardRoleHero) {
        dashboardRoleHero.innerHTML = `
            <div class="card card-clinical p-3 mb-2">
                <h4 class="mb-1 text-navy">${dashboardConfig.roleName} Dashboard</h4>
                <p class="text-muted mb-2">${dashboardConfig.subtitle}</p>
                <div class="d-flex flex-wrap gap-2">
                    ${actionButtons}
                </div>
            </div>
        `;
    }

    statsRow.innerHTML = `
        <div class="col-md-3"><div class="card card-stat p-3"><h6 class="text-muted small">Role</h6><h2 class="fw-bold text-navy mb-0">${dashboardConfig.roleName}</h2></div></div>
        <div class="col-md-3"><div class="card card-stat p-3"><h6 class="text-muted small">${dashboardConfig.metrics.m1}</h6><h2 class="fw-bold text-primary mb-0">${data.myPerformance} *</h2></div></div>
        <div class="col-md-3"><div class="card card-stat p-3"><h6 class="text-muted small">${dashboardConfig.metrics.m2}</h6><h2 class="fw-bold text-success mb-0">${data.globalAverage} *</h2></div></div>
        <div class="col-md-3"><div class="card card-stat p-3"><h6 class="text-muted small">${dashboardConfig.metrics.m3}</h6><h2 class="fw-bold text-danger mb-0">5</h2></div></div>
    `;

    if (contentArea) {
        const intelActions = dashboardConfig.actions
            .slice(0, 3)
            .map((action) => `<a class="btn btn-sm ${action.btn}" href="${action.href}">${action.label}</a>`)
            .join('');

        contentArea.innerHTML = `
            <h4 class="mb-3 operational-intel-title">Operational Intelligence</h4>
            <p class="text-muted mb-3">${dashboardConfig.subtitle}</p>
            <div class="row g-3 mb-3">
                <div class="col-md-4">
                    <div class="intel-mini-card h-100">
                        <div class="intel-mini-label">Immediate Focus</div>
                        <div class="intel-mini-value">Review unresolved CAPA and risk alerts.</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="intel-mini-card h-100">
                        <div class="intel-mini-label">SOP Governance</div>
                        <div class="intel-mini-value">Confirm all critical SOPs are current and acknowledged.</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="intel-mini-card h-100">
                        <div class="intel-mini-label">Equipment Readiness</div>
                        <div class="intel-mini-value">Track preventive maintenance and downtime trends.</div>
                    </div>
                </div>
            </div>
            <div class="card card-clinical p-3">
                <h6 class="mb-2 text-navy">Priority Actions</h6>
                <div class="d-flex flex-wrap gap-2 mb-2">
                    ${intelActions}
                </div>
                <ul class="small text-muted mb-0">
                    <li>Escalate overdue non-conformances older than 7 days.</li>
                    <li>Verify indicator failures have corrective action owners.</li>
                    <li>Validate critical instrument maintenance plans for this week.</li>
                </ul>
            </div>
        `;
    }
}

function applyRoleNavigation() {
    const links = Array.from(document.querySelectorAll('#sidebar a.nav-link'));
    if (!links.length) return;

    const effectiveRole = currentRoleKey || loggedInRoleKey;
    const allowedByRole = {
        [ROLE_KEYS.ADMIN]: null,
        [ROLE_KEYS.LAB_MANAGER]: new Set([
            'dashboard.html', 'departments.html', 'qc.html', 'indicators.html', 'equipment.html',
            'nc-capa.html', 'documents.html', 'audits.html', 'analytics.html'
        ]),
        [ROLE_KEYS.QUALITY_ASSURANCE_MANAGER]: new Set([
            'dashboard.html', 'departments.html', 'qc.html', 'indicators.html', 'equipment.html',
            'nc-capa.html', 'documents.html', 'audits.html', 'analytics.html'
        ]),
        [ROLE_KEYS.LAB_TECHNOLOGIST]: new Set([
            'dashboard.html', 'departments.html', 'qc.html', 'indicators.html',
            'equipment.html', 'nc-capa.html', 'documents.html'
        ])
    };

    const allowed = allowedByRole[effectiveRole];
    links.forEach((link) => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        link.style.display = !allowed || allowed.has(href) ? '' : 'none';
    });
}

function ensureRoleAccess(allowedRoleKeys, featureName) {
    const effectiveRole = currentRoleKey || loggedInRoleKey;
    if (allowedRoleKeys.includes(effectiveRole)) {
        return true;
    }

    const contentArea = document.getElementById('contentArea');
    if (contentArea) {
        contentArea.innerHTML = `<div class="alert alert-danger mb-0">Access denied: Your role cannot access ${featureName}.</div>`;
    }

    return false;
}

function countCriticalNotifications(notifications) {
    return notifications.filter((n) => {
        if (n.isRead) return false;
        const message = (n.message || '').toLowerCase();
        return message.includes('critical') || message.includes('reject') || message.includes('overdue') || message.includes('expired');
    }).length;
}

function renderDashboardOperationalCards(summary) {
    const opsRow = document.getElementById('opsAlertRow');
    if (!opsRow) return;

    const sopsLabel = summary.totalDocs === 0
        ? 'No SOP uploaded'
        : `${summary.upToDateDocs}/${summary.totalDocs}`;
    const equipmentLabel = summary.totalEquipment === 0
        ? 'No equipment'
        : `${summary.operationalEquipment}/${summary.totalEquipment}`;

    opsRow.innerHTML = `
        <div class="col-12 col-md-6 col-xl-3">
            <article class="ops-alert-card ops-alert-critical">
                <div class="ops-alert-badge"><i class="bi bi-exclamation-octagon-fill"></i></div>
                <div class="ops-alert-label">Critical Alerts</div>
                <div class="ops-alert-value">${summary.criticalAlerts}</div>
                <div class="ops-alert-note">Unread high-risk notifications needing immediate action.</div>
                <div class="ops-alert-footer">
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="toggleNotifSidebar()">Open Alerts</button>
                </div>
            </article>
        </div>
        <div class="col-12 col-md-6 col-xl-3">
            <article class="ops-alert-card ${summary.expiredDocs === 0 ? 'ops-alert-ok' : ''}">
                <div class="ops-alert-badge"><i class="bi bi-journal-check"></i></div>
                <div class="ops-alert-label">SOP Status</div>
                <div class="ops-alert-value">${sopsLabel}</div>
                <div class="ops-alert-note">${summary.expiredDocs} document(s) expired.</div>
                <div class="ops-alert-footer">
                    <a class="btn btn-sm btn-outline-primary" href="documents.html">Review SOPs</a>
                </div>
            </article>
        </div>
        <div class="col-12 col-md-6 col-xl-3">
            <article class="ops-alert-card ${summary.qiNotMet === 0 ? 'ops-alert-ok' : 'ops-alert-critical'}">
                <div class="ops-alert-badge"><i class="bi bi-clipboard2-pulse-fill"></i></div>
                <div class="ops-alert-label">Quality Indicators Not Met</div>
                <div class="ops-alert-value">${summary.qiNotMet}</div>
                <div class="ops-alert-note">${summary.totalQi} total indicator(s) reviewed.</div>
                <div class="ops-alert-footer">
                    <a class="btn btn-sm btn-outline-primary" href="indicators.html">Review Indicators</a>
                </div>
            </article>
        </div>
        <div class="col-12 col-md-6 col-xl-3">
            <article class="ops-alert-card ${summary.maintenanceDue === 0 ? 'ops-alert-ok' : ''}">
                <div class="ops-alert-badge"><i class="bi bi-cpu-fill"></i></div>
                <div class="ops-alert-label">Equipment Functional</div>
                <div class="ops-alert-value">${equipmentLabel}</div>
                <div class="ops-alert-note">${summary.maintenanceDue} item(s) due for service in 30 days.</div>
                <div class="ops-alert-footer">
                    <a class="btn btn-sm btn-outline-primary" href="equipment.html">Open Equipment Log</a>
                </div>
            </article>
        </div>
        <div class="col-12 col-md-6 col-xl-3">
            <article class="ops-alert-card ${summary.riskFlags > 0 ? 'ops-alert-critical' : 'ops-alert-ok'}">
                <div class="ops-alert-badge"><i class="bi bi-shield-exclamation"></i></div>
                <div class="ops-alert-label">Risk Flags (Alerts)</div>
                <div class="ops-alert-value">${summary.riskFlags}</div>
                <div class="ops-alert-note">Combined risk from QC, CAPA, and not-met indicators.</div>
                <div class="ops-alert-footer">
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="toggleNotifSidebar()">View Notifications</button>
                </div>
            </article>
        </div>
    `;
}

async function loadDashboardOperationalCards() {
    const opsRow = document.getElementById('opsAlertRow');
    if (!opsRow) return;

    const authHeader = { 'Authorization': `Bearer ${token}` };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inThirtyDays = new Date(today);
    inThirtyDays.setDate(inThirtyDays.getDate() + 30);

    const [docsRes, notifRes, qiRes, ncRes] = await Promise.all([
        fetch(`${API_URL}/docs`, { headers: authHeader }).catch(() => null),
        fetch(`${API_URL}/notifications`, { headers: authHeader }).catch(() => null),
        fetch(`${API_URL}/qi`, { headers: authHeader }).catch(() => null),
        fetch(`${API_URL}/nc`, { headers: authHeader }).catch(() => null)
    ]);

    const docs = docsRes && docsRes.ok ? await docsRes.json() : [];
    const notifications = notifRes && notifRes.ok ? await notifRes.json() : [];
    const qiItems = qiRes && qiRes.ok ? await qiRes.json() : [];
    const ncItems = ncRes && ncRes.ok ? await ncRes.json() : [];

    let equipmentItems = [];
    await Promise.all(DASHBOARD_DEPARTMENTS.map(async (dept) => {
        try {
            const res = await fetch(`${API_URL}/equipment/dept/${encodeURIComponent(dept)}`, { headers: authHeader });
            if (!res.ok) return;
            const items = await res.json();
            if (Array.isArray(items) && items.length) {
                equipmentItems = equipmentItems.concat(items);
            }
        } catch (error) {
            console.error(`Equipment summary error for ${dept}:`, error);
        }
    }));

    const uniqueEquipment = Array.from(new Map(equipmentItems.map((item) => [item.id, item])).values());
    const operationalEquipment = uniqueEquipment.filter((item) => (item.status || '').toLowerCase() === 'operational').length;
    const maintenanceDue = uniqueEquipment.filter((item) => {
        if (!item.nextServiceDate) return false;
        const serviceDate = new Date(item.nextServiceDate);
        return serviceDate >= today && serviceDate <= inThirtyDays;
    }).length;

    const expiredDocs = docs.filter((doc) => doc.expiryDate && new Date(doc.expiryDate) < today).length;
    const qiNotMet = qiItems.filter((qi) => Number(qi.actualPercentage) < Number(qi.targetPercentage)).length;
    const overdueCapa = ncItems.filter((nc) => nc.deadline && new Date(nc.deadline) < today && nc.status !== 'Closed').length;
    const stuckCapa = ncItems.filter((nc) => {
        const ageDays = Math.floor((Date.now() - new Date(nc.updatedAt || nc.createdAt).getTime()) / (24 * 60 * 60 * 1000));
        return (nc.status === 'Open' && ageDays > 2) || (nc.status === 'In Progress' && ageDays > 7);
    }).length;
    const criticalAlerts = countCriticalNotifications(notifications);
    const summary = {
        criticalAlerts,
        unreadNotifications: notifications.filter((n) => !n.isRead).length,
        totalDocs: docs.length,
        expiredDocs,
        upToDateDocs: Math.max(docs.length - expiredDocs, 0),
        totalEquipment: uniqueEquipment.length,
        operationalEquipment,
        maintenanceDue,
        totalQi: qiItems.length,
        qiNotMet,
        riskFlags: criticalAlerts + qiNotMet + overdueCapa + stuckCapa
    };

    renderDashboardOperationalCards(summary);
}

function renderWeeklyCapaReview(ncItems) {
    const container = document.getElementById('capaReviewRow');
    if (!container) return;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const openItems = ncItems.filter((nc) => nc.status === 'Open');
    const inProgressItems = ncItems.filter((nc) => nc.status === 'In Progress');
    const overdueItems = ncItems.filter((nc) => nc.deadline && new Date(nc.deadline) < now && nc.status !== 'Closed');
    const newThisWeek = ncItems.filter((nc) => new Date(nc.createdAt) >= weekStart).length;
    const stuckItems = ncItems.filter((nc) => {
        const ageDays = Math.floor((now.getTime() - new Date(nc.updatedAt || nc.createdAt).getTime()) / (24 * 60 * 60 * 1000));
        return (nc.status === 'Open' && ageDays > 2) || (nc.status === 'In Progress' && ageDays > 7);
    });

    const hotList = [...overdueItems, ...stuckItems]
        .filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx)
        .slice(0, 5);

    container.innerHTML = `
        <section class="card card-clinical p-3">
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                    <h5 class="fw-bold text-navy mb-1">Weekly CAPA Review</h5>
                    <p class="small text-muted mb-0">Track stuck, overdue, and newly logged CAPAs for weekly management review.</p>
                </div>
                <a class="btn btn-sm btn-outline-primary" href="nc-capa.html">Open NC & CAPA Register</a>
            </div>
            <div class="row g-3 mb-3">
                <div class="col-6 col-lg-3"><div class="capa-mini-card"><div class="label">New this week</div><div class="value">${newThisWeek}</div></div></div>
                <div class="col-6 col-lg-3"><div class="capa-mini-card"><div class="label">Open</div><div class="value">${openItems.length}</div></div></div>
                <div class="col-6 col-lg-3"><div class="capa-mini-card"><div class="label">In Progress</div><div class="value">${inProgressItems.length}</div></div></div>
                <div class="col-6 col-lg-3"><div class="capa-mini-card capa-mini-risk"><div class="label">Overdue / Stuck</div><div class="value">${overdueItems.length + stuckItems.length}</div></div></div>
            </div>
            <div class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th class="capa-th-purple">NC Ref</th>
                            <th class="capa-th-purple">Status</th>
                            <th class="capa-th-purple">Severity</th>
                            <th class="capa-th-purple">Owner</th>
                            <th class="capa-th-purple">Deadline</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hotList.length ? hotList.map((nc) => `
                            <tr>
                                <td class="capa-purple-cell">#${nc.id.substring(0, 8)}</td>
                                <td><span class="badge ${getNcStatusBadgeClass(nc.status)}">${nc.status}</span></td>
                                <td><span class="badge ${getNcSeverityBadgeClass(nc.severity)}">${nc.severity}</span></td>
                                <td class="capa-purple-cell">${nc.assignedTo || 'Unassigned'}</td>
                                <td class="capa-purple-cell">${nc.deadline ? new Date(nc.deadline).toLocaleDateString() : 'Not set'}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="5" class="text-muted">No stuck/overdue CAPAs this week.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

async function loadWeeklyCapaReview() {
    const container = document.getElementById('capaReviewRow');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/nc`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            throw new Error('Failed to load CAPA review data');
        }
        const data = await res.json();
        renderWeeklyCapaReview(data);
    } catch (error) {
        container.innerHTML = `
            <section class="card card-clinical p-3">
                <h5 class="fw-bold text-navy mb-1">Weekly CAPA Review</h5>
                <p class="small text-danger mb-0">Unable to load CAPA review data right now.</p>
            </section>
        `;
    }
}

async function loadHomeStats() {
    try {
        if (loggedInRoleKey === ROLE_KEYS.ADMIN) {
            currentRoleKey = localStorage.getItem('viewRoleKey') || ROLE_KEYS.ADMIN;
        } else {
            currentRoleKey = loggedInRoleKey;
        }

        setLabNameHeading();
        applyRoleNavigation();

        const res = await fetch(`${API_URL}/benchmarks/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch benchmark summary');
        }

        const data = await res.json();
        renderDashboardByRole(data);
        loadDashboardOperationalCards();
        loadWeeklyCapaReview();
        initTestingChart();
        runServiceChecks();
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

if (document.getElementById('statsRow')) {
    loadHomeStats();
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
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.12)',
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
            <button class="btn btn-primary" onclick="showNCModal()">Log New NC</button>
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
            <div class="card nc-capa-card border-start border-4 ${getSeverityColor(nc.severity)} shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <h5 class="card-title">Incident #${nc.id.substring(0,8)}</h5>
                        <span class="badge ${getNcStatusBadgeClass(nc.status)}">${nc.status}</span>
                    </div>
                    <p class="small text-muted mb-1">Severity: <span class="badge ${getNcSeverityBadgeClass(nc.severity)}">${nc.severity}</span></p>
                    <p class="card-text"><strong>Description:</strong> ${nc.description}</p>
                    <p class="card-text"><small class="text-muted">Root Cause: ${nc.rootCause || 'Pending...'}</small></p>
                    <hr>
                    <p class="card-text"><strong>CAPA:</strong> ${nc.correctiveAction || 'Not defined'}</p>
                    <div class="d-flex gap-2 flex-wrap mb-2">
                        <span class="badge text-bg-light border">Due: ${nc.deadline ? new Date(nc.deadline).toLocaleDateString() : 'Not set'}</span>
                        <span class="badge text-bg-light border">Owner: ${nc.assignedTo || 'Unassigned'}</span>
                    </div>
                    ${nc.effectivenessEvidence ? `<p class="small text-muted mb-2">Effectiveness: ${nc.effectivenessEvidence}</p>` : ''}
                    <div class="d-flex gap-2 flex-wrap">
                        <button class="btn btn-sm btn-outline-primary" onclick="openCapaUpdate('${encodeURIComponent(JSON.stringify({
                            id: nc.id,
                            status: nc.status,
                            rootCause: nc.rootCause || '',
                            correctiveAction: nc.correctiveAction || '',
                            deadline: nc.deadline ? new Date(nc.deadline).toISOString().split('T')[0] : '',
                            assignedTo: nc.assignedTo || '',
                            overdueJustification: nc.overdueJustification || '',
                            effectivenessEvidence: nc.effectivenessEvidence || ''
                        }))}')">Update CAPA</button>
                        ${nc.status !== 'Closed'
                            ? `<button class="btn btn-sm btn-outline-success" onclick="advanceNCStatus('${nc.id}','${nc.status}')">Advance to ${getNextNcStatusLabel(nc.status)}</button>`
                            : ''
                        }
                    </div>
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

function getNcStatusBadgeClass(status) {
    if (status === 'Open') return 'bg-danger';
    if (status === 'In Progress') return 'bg-warning text-dark';
    if (status === 'Verified') return 'bg-info text-dark';
    if (status === 'Closed') return 'bg-success';
    return 'bg-secondary';
}

function getNcSeverityBadgeClass(severity) {
    if (severity === 'Critical') return 'bg-danger';
    if (severity === 'High') return 'bg-warning text-dark';
    if (severity === 'Medium') return 'bg-primary';
    return 'bg-success';
}

function getNextNcStatus(currentStatus) {
    const statusFlow = {
        Open: 'In Progress',
        'In Progress': 'Verified',
        Verified: 'Closed'
    };
    return statusFlow[currentStatus] || null;
}

function getNextNcStatusLabel(currentStatus) {
    return getNextNcStatus(currentStatus) || 'Next Stage';
}

async function advanceNCStatus(id, currentStatus) {
    const nextStatus = getNextNcStatus(currentStatus);
    if (!nextStatus) return;

    const proceed = confirm(`Move this NC from "${currentStatus}" to "${nextStatus}"?`);
    if (!proceed) return;

    const res = await fetch(`${API_URL}/nc/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
    });

    const data = await res.json();
    if (!res.ok) {
        alert(data.message || 'Failed to update NC status');
        return;
    }

    loadNC();
}

async function openCapaUpdate(encodedNc) {
    const nc = JSON.parse(decodeURIComponent(encodedNc));
    const rootCause = prompt('Root Cause Analysis', nc.rootCause);
    if (rootCause === null) return;

    const correctiveAction = prompt('Corrective / Preventive Action', nc.correctiveAction);
    if (correctiveAction === null) return;

    const deadline = prompt('Deadline (YYYY-MM-DD)', nc.deadline);
    if (deadline === null) return;

    const assignedTo = prompt('Assigned To (optional)', nc.assignedTo);
    if (assignedTo === null) return;

    const overdueJustification = prompt('Overdue Justification (required if overdue and moving to Verified)', nc.overdueJustification);
    if (overdueJustification === null) return;

    const effectivenessEvidence = prompt('Effectiveness Evidence (required to close CAPA)', nc.effectivenessEvidence);
    if (effectivenessEvidence === null) return;

    const statusInput = prompt('Status (Open | In Progress | Verified | Closed)', nc.status);
    if (statusInput === null) return;

    const res = await fetch(`${API_URL}/nc/${nc.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            rootCause: rootCause.trim(),
            correctiveAction: correctiveAction.trim(),
            deadline: deadline.trim(),
            assignedTo: assignedTo.trim(),
            overdueJustification: overdueJustification.trim(),
            effectivenessEvidence: effectivenessEvidence.trim(),
            status: statusInput.trim()
        })
    });

    const data = await res.json();
    if (!res.ok) {
        alert(data.message || 'Failed to update CAPA');
        return;
    }

    loadNC();
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
    if (!ensureRoleAccess([ROLE_KEYS.ADMIN, ROLE_KEYS.QUALITY_ASSURANCE_MANAGER, ROLE_KEYS.LAB_MANAGER, ROLE_KEYS.LAB_TECHNOLOGIST], 'Document Control')) return;
    const canManageDocs = [ROLE_KEYS.ADMIN, ROLE_KEYS.LAB_MANAGER, ROLE_KEYS.QUALITY_ASSURANCE_MANAGER].includes(loggedInRoleKey);
    const signedInRoleLabel = ROLE_LABEL_BY_KEY[loggedInRoleKey] || currentRoleLabel || 'User';
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="mb-0">Document Control</h3>
            <div class="d-flex gap-2">
                <span class="badge bg-success">Signed in as: ${signedInRoleLabel}</span>
                <span class="badge bg-primary">ISO 15189 Controlled SOP Library</span>
            </div>
        </div>

        <div class="docs-toolbar mb-3">
            <div class="doc-upload-panel p-3 ${canManageDocs ? '' : 'd-none'}">
                <h6 class="fw-bold mb-2">Upload Document</h6>
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
                        <option value="Microbiology">Microbiology</option>
                        <option value="TB Lab">TB Lab</option>
                        <option value="Blood Bank">Blood Bank</option>
                        <option value="Molecular">Molecular</option>
                        <option value="Histology">Histology</option>
                    </select>
                    <input type="text" id="docVersion" class="form-control mb-2" placeholder="Version (e.g. 1.0)" value="1.0">
                    <input type="text" id="docIsoClause" class="form-control mb-2" placeholder="ISO Clause (optional)">
                    <input type="file" id="docFile" class="form-control mb-2" required>
                    <button type="submit" class="btn btn-primary btn-sm w-100">Upload SOP</button>
                </form>
            </div>
            ${canManageDocs ? '' : '<div class="alert alert-info mb-0 py-2">View and print access enabled for Laboratory Technologist.</div>'}
        </div>

        <div class="mb-3">
            <div class="small text-muted mb-1">Use search to find SOPs quickly by title or department.</div>
            <div class="input-group">
                <input type="text" id="docSearch" class="form-control" placeholder="Search SOP title or department..." onkeyup="filterDocs()">
                <button class="btn btn-outline-primary" type="button" onclick="filterDocs()">Search</button>
            </div>
        </div>

        <div id="docCardsContainer" class="doc-catalog"></div>
    `;

    if (canManageDocs) {
        const docForm = document.getElementById('docForm');
        docForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('docFile');
            const file = fileInput.files[0];
            if (!file) {
                alert('Please select a file.');
                return;
            }

            const payload = new FormData();
            payload.append('title', document.getElementById('docTitle').value.trim());
            payload.append('department', document.getElementById('docDept').value);
            payload.append('version', document.getElementById('docVersion').value.trim() || '1.0');
            payload.append('isoClause', document.getElementById('docIsoClause').value.trim());
            payload.append('file', file);

            const uploadRes = await fetch(`${API_URL}/docs`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: payload
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) {
                alert(uploadData.message || 'Document upload failed');
                return;
            }

            docForm.reset();
            document.getElementById('docVersion').value = '1.0';
            loadDocs();
        });
    }

    // Fetch and Display with Filtering Logic
    const res = await fetch(`${API_URL}/docs`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const message = err.message || 'Unable to load documents.';
        document.getElementById('docCardsContainer').innerHTML = `<div class="alert alert-danger mb-0">${message}</div>`;
        return;
    }
    window.allDocs = await res.json(); // Store globally for searching
    renderDocTable(sortDocsByDepartment(window.allDocs));
}

function renderDocTable(docs) {
    const canManageDocs = [ROLE_KEYS.ADMIN, ROLE_KEYS.LAB_MANAGER, ROLE_KEYS.QUALITY_ASSURANCE_MANAGER].includes(loggedInRoleKey);
    const container = document.getElementById('docCardsContainer');
    if (!container) return;

    if (!docs.length) {
        container.innerHTML = `<div class="col-12"><div class="alert alert-light border mb-0">No documents found.</div></div>`;
        return;
    }

    const grouped = docs.reduce((acc, doc) => {
        const dept = normalizeDepartmentLabel(doc.department || 'Quality');
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(doc);
        return acc;
    }, {});

    const departmentNames = Object.keys(grouped).sort((a, b) => {
        const iA = DOCUMENT_DEPARTMENT_ORDER.indexOf(a);
        const iB = DOCUMENT_DEPARTMENT_ORDER.indexOf(b);
        const oA = iA === -1 ? 999 : iA;
        const oB = iB === -1 ? 999 : iB;
        if (oA !== oB) return oA - oB;
        return a.localeCompare(b);
    });

    container.innerHTML = departmentNames.map((department) => {
        const cards = grouped[department].map((doc) => {
            const safePath = (doc.filePath || '').replace(/\\/g, '/');
            const encodedDoc = encodeURIComponent(JSON.stringify({
                id: doc.id,
                title: doc.title || '',
                version: doc.version || '1.0',
                isoClause: doc.isoClause || '',
                department: doc.department || 'Quality'
            }));

            return `
                <article class="sop-book-card">
                    <div class="sop-cover ${getCoverClassByDepartment(department)}">
                        <div class="sop-cover-title">${doc.title}</div>
                    </div>
                    <div class="sop-meta">
                        <div class="meta-row"><span>Version</span><strong>${doc.version || '1.0'}</strong></div>
                        <div class="meta-row"><span>ISO Clause</span><strong>${doc.isoClause || 'N/A'}</strong></div>
                        <div class="meta-row"><span>Uploaded</span><strong>${new Date(doc.createdAt).toLocaleDateString()}</strong></div>
                        <div class="sop-actions">
                            <a href="http://localhost:5000/${safePath}" target="_blank" class="btn btn-outline-primary">View</a>
                            <button class="btn btn-outline-success" onclick="printSOP('http://localhost:5000/${safePath}')">Print</button>
                            ${canManageDocs ? `<button class="btn btn-outline-warning" onclick="editDocFromPayload('${encodedDoc}')">Edit</button>` : ''}
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        return `
            <section class="dept-doc-section">
                <div class="dept-doc-header">
                    <h6 class="mb-0">${department}</h6>
                    <span class="badge bg-secondary">${grouped[department].length} SOP(s)</span>
                </div>
                <div class="dept-doc-grid">
                    ${cards}
                </div>
            </section>
        `;
    }).join('');
}

function editDocFromPayload(encodedDoc) {
    const doc = JSON.parse(decodeURIComponent(encodedDoc));
    editDoc(doc.id, doc.title, doc.version, doc.isoClause, doc.department);
}

async function editDoc(id, currentTitle, currentVersion, currentIsoClause, currentDepartment) {
    const title = prompt('Update document title:', currentTitle);
    if (title === null) return;
    const version = prompt('Update version:', currentVersion);
    if (version === null) return;
    const isoClause = prompt('Update ISO clause (optional):', currentIsoClause || '');
    if (isoClause === null) return;
    const department = prompt('Update department:', currentDepartment || 'Quality');
    if (department === null) return;

    const res = await fetch(`${API_URL}/docs/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, version, isoClause, department })
    });

    const data = await res.json();
    if (!res.ok) {
        alert(data.message || 'Failed to update document');
        return;
    }
    loadDocs();
}

function filterDocs() {
    const term = (document.getElementById('docSearch')?.value || '').toLowerCase();
    const filtered = (window.allDocs || []).filter(d => 
        (d.title || '').toLowerCase().includes(term) || normalizeDepartmentLabel(d.department || '').toLowerCase().includes(term)
    );
    renderDocTable(sortDocsByDepartment(filtered));
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
    
    const renderedData = data.length ? data : [{
        id: 'sample-notification',
        isRead: false,
        message: 'Sample Alert: Daily QC review pending for Chemistry control level 2.',
        createdAt: new Date().toISOString(),
        sample: true
    }];

    list.innerHTML = renderedData.map(n => `
        <div class="card mb-2 ${n.isRead ? 'opacity-75' : 'border-primary shadow-sm'}">
            <div class="card-body p-2 ${n.sample ? 'notif-sample' : ''}">
                <p class="small mb-1">${n.message}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-light text-dark" style="font-size: 0.7rem;">${new Date(n.createdAt).toLocaleTimeString()}</span>
                    ${(!n.isRead && !n.sample) ? `<button class="btn btn-sm btn-link p-0" onclick="markRead('${n.id}')" style="font-size: 0.7rem;">Mark as read</button>` : ''}
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
    if (!ensureRoleAccess([ROLE_KEYS.ADMIN, ROLE_KEYS.LAB_MANAGER, ROLE_KEYS.QUALITY_ASSURANCE_MANAGER], 'SLIPTA Audits')) return;
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
                    <tbody id="sliptaChecklistBody">
                        ${SLIPTA_CHECKLIST.map((item) => `
                            <tr>
                                <td>${item.clause}</td>
                                <td><input type="text" class="form-control finding" placeholder="Evidence found..."></td>
                                <td><input type="number" class="form-control score" min="0" max="${item.maxScore}" value="0"></td>
                            </tr>
                        `).join('')}
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
        
        const checklistItems = SLIPTA_CHECKLIST;
        const findings = [];
        const scoreInputs = document.querySelectorAll('.score');
        const findingInputs = document.querySelectorAll('.finding');

        checklistItems.forEach((item, index) => {
            const score = parseInt(scoreInputs[index].value, 10) || 0;
            findings.push({
                clause: item.clause,
                scoreObtained: Math.min(score, item.maxScore),
                maxScore: item.maxScore,
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
    if (!res.ok) return;

    const data = await res.json();
    const historyEl = document.getElementById('auditHistory');
    if (!historyEl) return;

    if (!data.length) {
        historyEl.innerHTML = `<div class="col-12"><div class="alert alert-light border mb-0">No audits recorded yet.</div></div>`;
        return;
    }

    historyEl.innerHTML = data.map((audit) => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card card-clinical h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="mb-0">${audit.auditType}</h6>
                        <span class="badge bg-primary">${audit.starLevel || 0} Star</span>
                    </div>
                    <p class="small text-muted mb-1">Status: ${audit.status}</p>
                    <p class="small text-muted mb-1">Total Score: ${audit.totalScore || 0}</p>
                    <p class="small text-muted mb-0">Date: ${new Date(audit.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadAnalytics() {
    if (!ensureRoleAccess([ROLE_KEYS.ADMIN, ROLE_KEYS.LAB_MANAGER, ROLE_KEYS.QUALITY_ASSURANCE_MANAGER], 'Risk & Analytics')) return;
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
                    backgroundColor: 'rgba(26, 188, 156, 0.65)',
                    borderColor: '#1abc9c',
                    borderWidth: 1
                },
                {
                    label: 'ISO Target (%)',
                    data: targets,
                    backgroundColor: 'rgba(241, 196, 15, 0.35)',
                    borderColor: '#e67e22',
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
        const deptDocs = allDocs.filter(d => normalizeDepartmentLabel(d.department) === deptName);
        
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
                
                ${isManagerOrAdmin() ? 
                    `<button class="btn btn-sm btn-outline-primary mt-2 py-0" style="font-size: 0.75rem;" 
                        onclick="showMaintenanceModal('${e.id}', '${e.name}')">Record Service</button>` 
                    : ''
                }
            </div>
        `).join('') || '<p class="text-muted">No equipment registered.</p>';
        
        // 3. Permission Check for "Add Equipment" button
        // Assuming user role is stored in localStorage or decoded from token
        const userRole = localStorage.getItem('userRole'); 
        if (isManagerOrAdmin()) {
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
    applyRoleNavigation();
    setLabNameHeading();
    initRolePreviewControl();

    const userRole = localStorage.getItem('userRole');
    const uploadBtn = document.getElementById('uploadBtn');

    // Check if the button exists on the current page and if the user is NOT a QA_MANAGER
    if (uploadBtn && ![ROLE_KEYS.ADMIN, ROLE_KEYS.LAB_MANAGER, ROLE_KEYS.QUALITY_ASSURANCE_MANAGER].includes(loggedInRoleKey)) {
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


