const OPS_API_URL = 'http://localhost:5000/api';
const opsToken = localStorage.getItem('token');

function resolveRoleKey() {
    const map = {
        'System Administrator': 'ADMIN',
        'Laboratory Manager': 'LAB_MANAGER',
        'Quality Officer': 'QUALITY_ASSURANCE_MANAGER',
        'Laboratory Technologist': 'LAB_TECHNOLOGIST'
    };
    return localStorage.getItem('roleKey') || map[localStorage.getItem('userRole') || ''] || '';
}

function opsHeaders(json = true) {
    const headers = { Authorization: `Bearer ${opsToken}` };
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
}

async function opsRequest(path, options = {}) {
    const response = await fetch(`${OPS_API_URL}${path}`, options);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(body.message || `Request failed (${response.status})`);
        throw error;
    }
    return body;
}

function setOpsStatus(message, type = 'light') {
    const el = document.getElementById('opsStatus');
    if (!el) return;
    el.className = `alert alert-${type} mt-3 mb-0`;
    el.textContent = message;
}

function renderOpsTable(headers, rows) {
    if (!rows.length) return '<div class="alert alert-light border mb-0">No records found.</div>';
    const head = headers.map((h) => `<th>${h}</th>`).join('');
    const body = rows.map((cells) => `<tr>${cells.map((cell) => `<td>${cell ?? ''}</td>`).join('')}</tr>`).join('');
    return `<table class="table table-sm table-striped mb-0"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function daysUntil(dateValue) {
    if (!dateValue) return null;
    const target = new Date(dateValue).getTime();
    const now = Date.now();
    return Math.floor((target - now) / (24 * 60 * 60 * 1000));
}

function buildCompetencyIndex(competencies) {
    const index = new Map();
    (competencies || []).forEach((item) => {
        const key = item.testCode;
        if (!key) return;
        const existing = index.get(key);
        if (!existing) {
            index.set(key, item);
            return;
        }

        const existingExpiry = existing.expiresAt ? new Date(existing.expiresAt).getTime() : 0;
        const currentExpiry = item.expiresAt ? new Date(item.expiresAt).getTime() : 0;
        if (currentExpiry >= existingExpiry) {
            index.set(key, item);
        }
    });
    return index;
}

function competencyCell(competency) {
    if (!competency) {
        return { label: 'Not Trained', className: 'bg-danger-subtle text-danger-emphasis', title: 'No competency record' };
    }

    const status = String(competency.status || '').trim();
    const days = daysUntil(competency.expiresAt);

    if (status !== 'Competent') {
        return { label: status || 'Not Competent', className: 'bg-danger-subtle text-danger-emphasis', title: 'Requires retraining or expired status' };
    }

    if (days !== null && days < 0) {
        return { label: 'Expired', className: 'bg-danger-subtle text-danger-emphasis', title: 'Competency has expired' };
    }

    if (days !== null && days <= 30) {
        return { label: `Due ${days}d`, className: 'bg-warning-subtle text-warning-emphasis', title: 'Competency expires within 30 days' };
    }

    return { label: 'Competent', className: 'bg-success-subtle text-success-emphasis', title: 'Competency valid' };
}

function renderSkillHeatmap(staffRows) {
    if (!staffRows.length) {
        return '<div class="alert alert-light border mb-0">No active staff records found.</div>';
    }

    const methods = Array.from(new Set(
        staffRows.flatMap((staff) => (staff.Competencies || []).map((item) => item.testCode).filter(Boolean))
    )).sort((a, b) => a.localeCompare(b));

    if (!methods.length) {
        return '<div class="alert alert-warning mb-0">No competency methods captured yet. Add competencies to generate heatmap.</div>';
    }

    const headCells = methods.map((method) => `<th class="text-nowrap">${method}</th>`).join('');
    const bodyRows = staffRows.map((staff) => {
        const index = buildCompetencyIndex(staff.Competencies || []);
        const cells = methods.map((method) => {
            const state = competencyCell(index.get(method));
            return `<td class="text-center align-middle ${state.className}" title="${state.title}">${state.label}</td>`;
        }).join('');

        return `
            <tr>
                <td class="text-nowrap fw-semibold">${staff.fullName}</td>
                <td class="text-nowrap">${staff.staffNo}</td>
                <td class="text-nowrap">${staff.roleName}</td>
                ${cells}
            </tr>
        `;
    }).join('');

    return `
        <div class="d-flex flex-wrap gap-2 mb-2 small">
            <span class="badge bg-success-subtle text-success-emphasis border">Green: Competent</span>
            <span class="badge bg-warning-subtle text-warning-emphasis border">Yellow: Due in 30 days</span>
            <span class="badge bg-danger-subtle text-danger-emphasis border">Red: Expired / Not Trained</span>
        </div>
        <table class="table table-sm table-bordered align-middle mb-0">
            <thead class="table-light">
                <tr>
                    <th>Staff</th>
                    <th>Staff No</th>
                    <th>Role</th>
                    ${headCells}
                </tr>
            </thead>
            <tbody>${bodyRows}</tbody>
        </table>
    `;
}

async function refreshSopMetrics() {
    try {
        const [compliance, expiring] = await Promise.all([
            opsRequest('/sops/compliance', { headers: opsHeaders(false) }),
            opsRequest('/sops/expiring', { headers: opsHeaders(false) })
        ]);

        const metrics = document.getElementById('sopMetrics');
        if (metrics) {
            metrics.innerHTML = `
                Required Versions: <strong>${compliance.requiredCount}</strong> |
                Acknowledgements: <strong>${compliance.ackCount}</strong> |
                Compliance: <strong>${compliance.sopCompliance}%</strong>
            `;
        }

        const table = document.getElementById('expiringSopsTable');
        if (table) {
            table.innerHTML = renderOpsTable(
                ['Version ID', 'SOP ID', 'Version', 'Effective Date', 'Expiry Date'],
                expiring.map((item) => [
                    item.id,
                    item.sopId,
                    item.versionNo,
                    item.effectiveDate ? new Date(item.effectiveDate).toLocaleDateString() : '-',
                    item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'
                ])
            );
        }
    } catch (error) {
        setOpsStatus(`SOP metrics failed: ${error.message}`, 'danger');
    }
}

async function refreshStaffMetrics() {
    try {
        const [compliance, expiry, matrix] = await Promise.all([
            opsRequest('/staff/competency-compliance', { headers: opsHeaders(false) }),
            opsRequest('/staff/competency-expiry', { headers: opsHeaders(false) }),
            opsRequest('/staff/skill-matrix', { headers: opsHeaders(false) })
        ]);

        const metrics = document.getElementById('staffMetrics');
        if (metrics) {
            metrics.innerHTML = `
                Active Staff: <strong>${compliance.activeStaff}</strong> |
                Competent Staff: <strong>${compliance.compliantStaff}</strong> |
                Compliance: <strong>${compliance.competencyCompliance}%</strong>
            `;
        }

        const expiryList = document.getElementById('staffExpiryList');
        if (expiryList) {
            if (!expiry.length) {
                expiryList.innerHTML = '<span class="text-success">No competencies expiring in the next 30 days.</span>';
            } else {
                expiryList.innerHTML = expiry.map((item) => `
                    <div><strong>${item.Staff?.fullName || 'Unknown'}</strong> (${item.testCode}) expires on ${new Date(item.expiresAt).toLocaleDateString()}</div>
                `).join('');
            }
        }

        const table = document.getElementById('skillMatrixTable');
        if (table) {
            table.innerHTML = renderSkillHeatmap(matrix);
        }
    } catch (error) {
        setOpsStatus(`Staff metrics failed: ${error.message}`, 'danger');
    }
}

async function refreshRiskMatrix() {
    try {
        const matrix = await opsRequest('/risks/matrix', { headers: opsHeaders(false) });
        const table = document.getElementById('riskMatrixTable');
        if (table) {
            table.innerHTML = renderOpsTable(
                ['Risk ID', 'Title', 'Likeli.', 'Impact', 'Inherent', 'Residual', 'Status', 'Owner'],
                matrix.map((risk) => [
                    risk.id,
                    risk.title,
                    risk.likelihood,
                    risk.impact,
                    risk.inherentScore,
                    risk.residualScore,
                    risk.status,
                    risk.ownerName || '-'
                ])
            );
        }
    } catch (error) {
        setOpsStatus(`Risk matrix failed: ${error.message}`, 'danger');
    }
}

function bindSopForms() {
    document.getElementById('createSopForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const sop = await opsRequest('/sops', {
                method: 'POST',
                headers: opsHeaders(),
                body: JSON.stringify({
                    code: document.getElementById('sopCode').value.trim(),
                    title: document.getElementById('sopTitle').value.trim(),
                    isoClause: document.getElementById('sopIsoClause').value.trim() || null
                })
            });
            document.getElementById('versionSopId').value = sop.id;
            document.getElementById('submitSopId').value = sop.id;
            setOpsStatus(`SOP created (${sop.id}).`, 'success');
        } catch (error) {
            setOpsStatus(`Create SOP failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('uploadSopVersionForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const sopId = document.getElementById('versionSopId').value.trim();
            const version = await opsRequest(`/sops/${sopId}/versions`, {
                method: 'POST',
                headers: opsHeaders(),
                body: JSON.stringify({
                    versionNo: document.getElementById('versionNo').value.trim(),
                    filePath: document.getElementById('versionFilePath').value.trim(),
                    effectiveDate: document.getElementById('versionEffectiveDate').value || null,
                    expiryDate: document.getElementById('versionExpiryDate').value || null,
                    changeSummary: document.getElementById('versionChangeSummary').value.trim() || null
                })
            });
            document.getElementById('submitSopVersionId').value = version.id;
            setOpsStatus(`SOP version created (${version.id}).`, 'success');
            refreshSopMetrics();
        } catch (error) {
            setOpsStatus(`Upload version failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('submitSopApprovalForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const sopId = document.getElementById('submitSopId').value.trim();
            await opsRequest(`/sops/${sopId}/submit`, {
                method: 'POST',
                headers: opsHeaders(),
                body: JSON.stringify({
                    sopVersionId: document.getElementById('submitSopVersionId').value.trim(),
                    approverName: document.getElementById('submitApproverName').value.trim() || undefined
                })
            });
            setOpsStatus('SOP submitted for approval.', 'success');
        } catch (error) {
            setOpsStatus(`Submit approval failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('sopApprovalActionForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const approvalId = document.getElementById('approvalId').value.trim();
            const result = await opsRequest(`/sops/approvals/${approvalId}/action`, {
                method: 'POST',
                headers: opsHeaders(),
                body: JSON.stringify({
                    action: document.getElementById('approvalAction').value,
                    comment: document.getElementById('approvalComment').value.trim() || undefined
                })
            });
            setOpsStatus(`Approval updated (${result.status}).`, 'success');
            refreshSopMetrics();
        } catch (error) {
            setOpsStatus(`Approval action failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('refreshSopMetricsBtn')?.addEventListener('click', refreshSopMetrics);
}

function bindStaffForms() {
    document.getElementById('createStaffForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const staff = await opsRequest('/staff', {
                method: 'POST',
                headers: opsHeaders(),
                body: JSON.stringify({
                    staffNo: document.getElementById('staffNo').value.trim(),
                    fullName: document.getElementById('staffFullName').value.trim(),
                    roleName: document.getElementById('staffRoleName').value.trim()
                })
            });
            document.getElementById('competencyStaffId').value = staff.id;
            setOpsStatus(`Staff created (${staff.id}).`, 'success');
            refreshStaffMetrics();
        } catch (error) {
            setOpsStatus(`Create staff failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('addCompetencyForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const staffId = document.getElementById('competencyStaffId').value.trim();
            await opsRequest(`/staff/${staffId}/competencies`, {
                method: 'POST',
                headers: opsHeaders(),
                body: JSON.stringify({
                    testCode: document.getElementById('competencyTestCode').value.trim(),
                    assessedAt: document.getElementById('competencyAssessedAt').value,
                    expiresAt: document.getElementById('competencyExpiresAt').value,
                    status: document.getElementById('competencyStatus').value
                })
            });
            setOpsStatus('Competency saved.', 'success');
            refreshStaffMetrics();
        } catch (error) {
            setOpsStatus(`Add competency failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('recordTrainingForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const staffIds = (document.getElementById('trainingStaffIds').value || '')
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean);
            await opsRequest('/staff/trainings', {
                method: 'POST',
                headers: opsHeaders(),
                body: JSON.stringify({
                    title: document.getElementById('trainingTitle').value.trim(),
                    trainingDate: document.getElementById('trainingDate').value,
                    trainerName: document.getElementById('trainingTrainerName').value.trim() || undefined,
                    staffIds
                })
            });
            setOpsStatus('Training recorded.', 'success');
        } catch (error) {
            setOpsStatus(`Record training failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('refreshStaffMetricsBtn')?.addEventListener('click', refreshStaffMetrics);
}

function bindRiskForms() {
    document.getElementById('createRiskForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const risk = await opsRequest('/risks', {
                method: 'POST',
                headers: opsHeaders(),
                body: JSON.stringify({
                    title: document.getElementById('riskTitle').value.trim(),
                    hazard: document.getElementById('riskHazard').value.trim(),
                    likelihood: Number(document.getElementById('riskLikelihood').value),
                    impact: Number(document.getElementById('riskImpact').value),
                    controlEffectiveness: Number(document.getElementById('riskControlEffectiveness').value || 0),
                    ownerName: document.getElementById('riskOwnerName').value.trim() || undefined,
                    sourceType: document.getElementById('riskSourceType').value
                })
            });
            document.getElementById('updateRiskId').value = risk.id;
            setOpsStatus(`Risk created (${risk.id}).`, 'success');
            refreshRiskMatrix();
        } catch (error) {
            setOpsStatus(`Create risk failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('updateRiskForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const riskId = document.getElementById('updateRiskId').value.trim();
            const payload = {};
            const likelihood = document.getElementById('updateLikelihood').value;
            const impact = document.getElementById('updateImpact').value;
            const controlEffectiveness = document.getElementById('updateControlEffectiveness').value;
            const status = document.getElementById('updateRiskStatus').value;

            if (likelihood !== '') payload.likelihood = Number(likelihood);
            if (impact !== '') payload.impact = Number(impact);
            if (controlEffectiveness !== '') payload.controlEffectiveness = Number(controlEffectiveness);
            if (status) payload.status = status;

            await opsRequest(`/risks/${riskId}/score`, {
                method: 'PUT',
                headers: opsHeaders(),
                body: JSON.stringify(payload)
            });
            setOpsStatus('Risk updated.', 'success');
            refreshRiskMatrix();
        } catch (error) {
            setOpsStatus(`Update risk failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('refreshRiskMatrixBtn')?.addEventListener('click', refreshRiskMatrix);
}

function bindAutomationForms() {
    document.getElementById('createSliptaAssessmentForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const assessment = await opsRequest('/slipta/assessments', {
                method: 'POST',
                headers: opsHeaders(),
                body: JSON.stringify({
                    assessmentDate: document.getElementById('sliptaAssessmentDate').value || undefined,
                    items: JSON.parse(document.getElementById('sliptaItemsJson').value)
                })
            });
            document.getElementById('getSliptaAssessmentId').value = assessment.id;
            setOpsStatus(`SLIPTA assessment created (${assessment.id}).`, 'success');
        } catch (error) {
            setOpsStatus(`Create assessment failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('getSliptaAssessmentForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const id = document.getElementById('getSliptaAssessmentId').value.trim();
            const assessment = await opsRequest(`/slipta/assessments/${id}`, { headers: opsHeaders(false) });
            const gaps = (assessment.SliptaAssessmentItems || []).filter((item) => item.gapFlag);
            const panel = document.getElementById('sliptaAssessmentPanel');
            panel.innerHTML = `
                <div>Total Score: <strong>${assessment.totalScore}</strong>, Percentage: <strong>${assessment.percentage}%</strong>, Stars: <strong>${assessment.starLevel}</strong></div>
                <div>Gap Item IDs: ${gaps.length ? gaps.map((item) => `<code>${item.id}</code>`).join(', ') : 'None'}</div>
            `;
            setOpsStatus('Assessment loaded.', 'success');
        } catch (error) {
            setOpsStatus(`Get assessment failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('linkGapToCapaForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const itemId = document.getElementById('gapItemId').value.trim();
            await opsRequest(`/slipta/gaps/${itemId}/link-capa`, {
                method: 'POST',
                headers: opsHeaders(),
                body: JSON.stringify({
                    ownerName: document.getElementById('gapOwnerName').value.trim() || undefined,
                    dueDate: document.getElementById('gapDueDate').value,
                    ncId: document.getElementById('gapNcId').value.trim() || undefined
                })
            });
            setOpsStatus('Gap linked to CAPA.', 'success');
        } catch (error) {
            setOpsStatus(`Link GAP failed: ${error.message}`, 'danger');
        }
    });
}

function bindReportButtons() {
    document.getElementById('loadManagementReviewBtn')?.addEventListener('click', async () => {
        try {
            const review = await opsRequest('/reports/management-review', { headers: opsHeaders(false) });
            document.getElementById('managementReviewPanel').innerHTML = `
                Date: <strong>${new Date(review.summaryDate).toLocaleString()}</strong> |
                QIs: <strong>${review.statistics?.totalQualityIndicators ?? 0}</strong> |
                Open NC: <strong>${review.statistics?.pendingCorrectiveActions ?? 0}</strong> |
                Star: <strong>${review.statistics?.currentStarLevel ?? '-'}</strong>
            `;
            setOpsStatus('Management review loaded.', 'success');
        } catch (error) {
            setOpsStatus(`Management review failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('generateMonthlyReportForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const period = document.getElementById('monthlyPeriod').value.trim();
            const report = await opsRequest('/analytics-engine/reports/monthly', {
                method: 'POST',
                headers: opsHeaders(),
                body: JSON.stringify({ period: period || undefined })
            });
            document.getElementById('monthlyReportPanel').innerHTML = renderOpsTable(
                ['Metric', 'Value'],
                [
                    ['Report Type', report.reportType],
                    ['Period', report.period],
                    ['Generated', new Date(report.generatedAt).toLocaleString()]
                ]
            );
            setOpsStatus('Monthly report generated.', 'success');
        } catch (error) {
            setOpsStatus(`Monthly report failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('loadDepartmentCompareBtn')?.addEventListener('click', async () => {
        try {
            const comparison = await opsRequest('/analytics-engine/department-compare', { headers: opsHeaders(false) });
            document.getElementById('departmentComparePanel').innerHTML = renderOpsTable(
                ['Department', 'KPI Average'],
                comparison.map((row) => [row.department, row.kpiAverage])
            );
            setOpsStatus('Department compare loaded.', 'success');
        } catch (error) {
            setOpsStatus(`Department compare failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('loadTrendProjectionsBtn')?.addEventListener('click', async () => {
        try {
            const projections = await opsRequest('/analytics-engine/projections', { headers: opsHeaders(false) });
            document.getElementById('trendProjectionsPanel').innerHTML = renderOpsTable(
                ['Period', 'Observed LQI', 'Projected LQI'],
                projections.map((row) => [row.period, row.observedLqi, row.projectedLqi])
            );
            setOpsStatus('Trend projections loaded.', 'success');
        } catch (error) {
            setOpsStatus(`Trend projections failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('downloadMonthlyPdfBtn')?.addEventListener('click', async () => {
        const period = (document.getElementById('monthlyPeriod')?.value || '').trim();
        const reportId = period || 'latest';
        const url = `${OPS_API_URL}/analytics-engine/reports/${encodeURIComponent(reportId)}/pdf${period ? `?period=${encodeURIComponent(period)}` : ''}`;
        try {
            const response = await fetch(url, { headers: opsHeaders(false) });
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.message || `PDF request failed (${response.status})`);
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
            setOpsStatus('Monthly quality PDF generated.', 'success');
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60 * 1000);
        } catch (error) {
            setOpsStatus(`PDF generation failed: ${error.message}`, 'danger');
        }
    });
}

function bindSystemLogButtons() {
    document.getElementById('loadLoginLogsBtn')?.addEventListener('click', async () => {
        try {
            const logs = await opsRequest('/system-logs/logins?limit=100', { headers: opsHeaders(false) });
            document.getElementById('loginLogsPanel').innerHTML = renderOpsTable(
                ['Time', 'User', 'Role', 'Email', 'Status', 'IP'],
                logs.map((row) => [
                    row.loggedAt ? new Date(row.loggedAt).toLocaleString() : '-',
                    row.userName || '-',
                    row.roleName || '-',
                    row.userEmail || '-',
                    row.status || '-',
                    row.ipAddress || '-'
                ])
            );
            setOpsStatus('Login logs loaded.', 'success');
        } catch (error) {
            setOpsStatus(`Load login logs failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('loadErrorLogsBtn')?.addEventListener('click', async () => {
        try {
            const logs = await opsRequest('/system-logs/errors?limit=100', { headers: opsHeaders(false) });
            document.getElementById('errorLogsPanel').innerHTML = renderOpsTable(
                ['Time', 'Scope', 'Route', 'Method', 'Code', 'Message'],
                logs.map((row) => [
                    row.errorAt ? new Date(row.errorAt).toLocaleString() : '-',
                    row.scope || '-',
                    row.route || '-',
                    row.method || '-',
                    row.statusCode || '-',
                    String(row.message || '-').slice(0, 120)
                ])
            );
            setOpsStatus('Error logs loaded.', 'success');
        } catch (error) {
            setOpsStatus(`Load error logs failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('loadRequestLogsBtn')?.addEventListener('click', async () => {
        try {
            const logs = await opsRequest('/system-logs/requests?limit=150', { headers: opsHeaders(false) });
            document.getElementById('requestLogsPanel').innerHTML = renderOpsTable(
                ['Time', 'Method', 'Route', 'Code', 'Duration', 'IP'],
                logs.map((row) => [
                    row.createdAt ? new Date(row.createdAt).toLocaleString() : '-',
                    row.method || '-',
                    row.route || '-',
                    row.statusCode || '-',
                    `${row.durationMs || 0} ms`,
                    row.ipAddress || '-'
                ])
            );
            setOpsStatus('Request audit logs loaded.', 'success');
        } catch (error) {
            setOpsStatus(`Load request logs failed: ${error.message}`, 'danger');
        }
    });
}

function bindProductionControls() {
    document.getElementById('enableMaintenanceBtn')?.addEventListener('click', async () => {
        try {
            const reason = (document.getElementById('maintenanceReason')?.value || '').trim();
            await opsRequest('/system/maintenance', {
                method: 'PUT',
                headers: opsHeaders(),
                body: JSON.stringify({ enabled: true, reason })
            });
            setOpsStatus('Maintenance mode enabled.', 'warning');
        } catch (error) {
            setOpsStatus(`Enable maintenance failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('disableMaintenanceBtn')?.addEventListener('click', async () => {
        try {
            await opsRequest('/system/maintenance', {
                method: 'PUT',
                headers: opsHeaders(),
                body: JSON.stringify({ enabled: false, reason: '' })
            });
            setOpsStatus('Maintenance mode disabled.', 'success');
        } catch (error) {
            setOpsStatus(`Disable maintenance failed: ${error.message}`, 'danger');
        }
    });

    document.getElementById('exportBackupBtn')?.addEventListener('click', async () => {
        try {
            const data = await opsRequest('/system/backup/export?scope=lab', { headers: opsHeaders(false) });
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lab-qis-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setOpsStatus('Backup exported.', 'success');
        } catch (error) {
            setOpsStatus(`Export backup failed: ${error.message}`, 'danger');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!opsToken) {
        window.location.href = 'index.html';
        return;
    }

    applyRoleNavigation();
    setLabNameHeading();

    const roleKey = resolveRoleKey();
    const badge = document.getElementById('opsRoleBadge');
    if (badge) badge.textContent = roleKey || 'Unknown';

    if (!['ADMIN', 'LAB_MANAGER', 'QUALITY_ASSURANCE_MANAGER'].includes(roleKey)) {
        document.getElementById('accessGuard').innerHTML = '<div class="alert alert-danger">Access denied: this page is available to Admin, Lab Manager, and QA Manager only.</div>';
        return;
    }

    document.getElementById('opsContent').classList.remove('d-none');
    bindSopForms();
    bindStaffForms();
    bindRiskForms();
    bindAutomationForms();
    bindReportButtons();
    bindSystemLogButtons();
    bindProductionControls();

    refreshSopMetrics();
    refreshStaffMetrics();
    refreshRiskMatrix();
});
