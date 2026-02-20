const DEPT_API_URL = 'http://localhost:5000/api';
const DEPT_TOKEN = localStorage.getItem('token');
const DEPT_ROLE_KEY = localStorage.getItem('roleKey') || '';
const DEPARTMENT_NAME = window.DEPARTMENT_NAME || '';

if (!DEPT_TOKEN) {
    window.location.href = 'index.html';
}

function normalizeDepartment(dept) {
    return dept === 'Bacteriology' ? 'Microbiology' : dept;
}

function isJobAidDocument(doc) {
    const title = (doc.title || '').toLowerCase();
    return title.includes('job aid') || title.includes('job-aid') || title.includes('work instruction');
}

function printSOP(pdfUrl) {
    const printWindow = window.open(pdfUrl, '_blank');
    printWindow.addEventListener('load', function () {
        printWindow.print();
    }, true);
}

function renderDocRows(items, emptyMessage) {
    if (!items.length) {
        return `<tr><td colspan="4" class="text-muted">${emptyMessage}</td></tr>`;
    }

    return items.map((doc) => {
        const path = (doc.filePath || '').replace(/\\/g, '/');
        return `
            <tr>
                <td><strong>${doc.title}</strong></td>
                <td><span class="badge bg-secondary">v${doc.version || '1.0'}</span></td>
                <td><span class="badge bg-success">Active</span></td>
                <td class="text-end">
                    <a href="http://localhost:5000/${path}" target="_blank" class="btn btn-sm btn-outline-primary mx-1"><i class="bi bi-eye"></i> View</a>
                    <button class="btn btn-sm btn-outline-success mx-1" onclick="printSOP('http://localhost:5000/${path}')"><i class="bi bi-printer"></i> Print</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadDepartmentDocs() {
    const sopBody = document.getElementById('deptSopBody');
    const jobAidBody = document.getElementById('deptJobAidBody');
    const uploadBtn = document.querySelector('.dept-upload-sop-btn');

    if (uploadBtn && !['QUALITY_ASSURANCE_MANAGER', 'LAB_MANAGER', 'ADMIN'].includes(DEPT_ROLE_KEY)) {
        uploadBtn.style.display = 'none';
    }

    if (!sopBody || !jobAidBody) return;

    try {
        const res = await fetch(`${DEPT_API_URL}/docs`, {
            headers: { Authorization: `Bearer ${DEPT_TOKEN}` }
        });
        const docs = await res.json();

        if (!res.ok) {
            sopBody.innerHTML = `<tr><td colspan="4" class="text-danger">Failed to load SOPs.</td></tr>`;
            jobAidBody.innerHTML = `<tr><td colspan="4" class="text-danger">Failed to load Job Aids.</td></tr>`;
            return;
        }

        const departmentDocs = docs.filter((doc) => normalizeDepartment(doc.department || '') === DEPARTMENT_NAME);
        const sopDocs = departmentDocs.filter((doc) => !isJobAidDocument(doc));
        const jobAidDocs = departmentDocs.filter((doc) => isJobAidDocument(doc));

        sopBody.innerHTML = renderDocRows(sopDocs, `No ${DEPARTMENT_NAME} SOPs uploaded yet.`);
        jobAidBody.innerHTML = renderDocRows(jobAidDocs, `No ${DEPARTMENT_NAME} Job Aids uploaded yet.`);
    } catch (error) {
        sopBody.innerHTML = `<tr><td colspan="4" class="text-danger">Unable to reach server.</td></tr>`;
        jobAidBody.innerHTML = `<tr><td colspan="4" class="text-danger">Unable to reach server.</td></tr>`;
    }
}

window.printSOP = printSOP;
loadDepartmentDocs();
