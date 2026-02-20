const ROLE_KEYS = Object.freeze({
    ADMIN: 'ADMIN',
    LAB_MANAGER: 'LAB_MANAGER',
    QUALITY_ASSURANCE_MANAGER: 'QUALITY_ASSURANCE_MANAGER',
    LAB_TECHNOLOGIST: 'LAB_TECHNOLOGIST',
    AUDITOR: 'AUDITOR'
});

const ROLE_LABELS_BY_KEY = Object.freeze({
    [ROLE_KEYS.ADMIN]: 'System Administrator',
    [ROLE_KEYS.LAB_MANAGER]: 'Laboratory Manager',
    [ROLE_KEYS.QUALITY_ASSURANCE_MANAGER]: 'Quality Officer',
    [ROLE_KEYS.LAB_TECHNOLOGIST]: 'Laboratory Technologist',
    [ROLE_KEYS.AUDITOR]: 'Auditor'
});

const ROLE_KEY_BY_LABEL = Object.freeze(
    Object.entries(ROLE_LABELS_BY_KEY).reduce((acc, [key, label]) => {
        acc[label] = key;
        return acc;
    }, {})
);

function getRoleKey(roleLabel) {
    return ROLE_KEY_BY_LABEL[roleLabel] || null;
}

module.exports = {
    ROLE_KEYS,
    ROLE_LABELS_BY_KEY,
    getRoleKey
};
