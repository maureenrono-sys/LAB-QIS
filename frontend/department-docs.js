const DEPT_API_URL = 'http://localhost:5000/api';
const DEPT_TOKEN = localStorage.getItem('token');
const DEPT_ROLE_KEY = localStorage.getItem('roleKey') || '';
const DEPARTMENT_NAME = window.DEPARTMENT_NAME || '';
const DEPT_ORIGIN = 'http://localhost:5000';

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
        return `<div class="dept-doc-empty text-muted">${emptyMessage}</div>`;
    }

    return items.map((doc) => {
        const path = (doc.filePath || '').replace(/\\/g, '/');
        const title = doc.title || 'Untitled Document';
        const version = doc.version || '1.0';
        return `
            <article class="dept-doc-card">
                <div class="dept-doc-cover">
                    <div class="dept-doc-cover-title">${title}</div>
                </div>
                <div class="dept-doc-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-secondary">v${version}</span>
                        <span class="badge bg-success">Active</span>
                    </div>
                    <div class="d-flex gap-2">
                        <a href="${DEPT_ORIGIN}/${path}" target="_blank" class="btn btn-sm btn-outline-primary flex-fill"><i class="bi bi-eye"></i> View</a>
                        <button class="btn btn-sm btn-outline-success flex-fill" onclick="printSOP('${DEPT_ORIGIN}/${path}')"><i class="bi bi-printer"></i> Print</button>
                    </div>
                </div>
            </article>
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
            sopBody.innerHTML = `<div class="dept-doc-empty text-danger">Failed to load SOPs.</div>`;
            jobAidBody.innerHTML = `<div class="dept-doc-empty text-danger">Failed to load Job Aids.</div>`;
            return;
        }

        const departmentDocs = docs.filter((doc) => normalizeDepartment(doc.department || '') === DEPARTMENT_NAME);
        const sopDocs = departmentDocs.filter((doc) => !isJobAidDocument(doc));
        const jobAidDocs = departmentDocs.filter((doc) => isJobAidDocument(doc));

        sopBody.innerHTML = renderDocRows(sopDocs, `No ${DEPARTMENT_NAME} SOPs uploaded yet.`);
        jobAidBody.innerHTML = renderDocRows(jobAidDocs, `No ${DEPARTMENT_NAME} Job Aids uploaded yet.`);
    } catch (error) {
        sopBody.innerHTML = `<div class="dept-doc-empty text-danger">Unable to reach server.</div>`;
        jobAidBody.innerHTML = `<div class="dept-doc-empty text-danger">Unable to reach server.</div>`;
    }
}

window.printSOP = printSOP;
loadDepartmentDocs();
