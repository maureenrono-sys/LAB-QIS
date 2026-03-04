const ROLE_KEYS = Object.freeze({
    ADMIN: 'ADMIN',
    LAB_MANAGER: 'LAB_MANAGER',
    QUALITY_ASSURANCE_MANAGER: 'QUALITY_ASSURANCE_MANAGER',
    LAB_SCIENTIST: 'LAB_SCIENTIST'
});

const ROLE_LABELS_BY_KEY = Object.freeze({
    [ROLE_KEYS.ADMIN]: 'Administrator',
    [ROLE_KEYS.LAB_MANAGER]: 'Laboratory Manager',
    [ROLE_KEYS.QUALITY_ASSURANCE_MANAGER]: 'Quality Assurance Manager',
    [ROLE_KEYS.LAB_SCIENTIST]: 'Laboratory Scientist'
});

const ROLE_KEY_BY_LABEL = Object.freeze({
    Administrator: ROLE_KEYS.ADMIN,
    'System Administrator': ROLE_KEYS.ADMIN,
    Admin: ROLE_KEYS.ADMIN,
    'Laboratory Manager': ROLE_KEYS.LAB_MANAGER,
    'Lab Manager': ROLE_KEYS.LAB_MANAGER,
    'Quality Assurance Manager': ROLE_KEYS.QUALITY_ASSURANCE_MANAGER,
    'Quality Assurance Officer': ROLE_KEYS.QUALITY_ASSURANCE_MANAGER,
    'Quality Officer': ROLE_KEYS.QUALITY_ASSURANCE_MANAGER,
    'Laboratory Scientist': ROLE_KEYS.LAB_SCIENTIST,
    'Laboratory Technologist': ROLE_KEYS.LAB_SCIENTIST,
    'Lab Technologist': ROLE_KEYS.LAB_SCIENTIST,
    Auditor: ROLE_KEYS.LAB_SCIENTIST
});

function getRoleKey(roleLabel) {
    return ROLE_KEY_BY_LABEL[roleLabel] || null;
}

module.exports = {
    ROLE_KEYS,
    ROLE_LABELS_BY_KEY,
    getRoleKey
};
