const fs = require('fs/promises');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');
const STATE_FILE = path.join(LOG_DIR, 'system-state.json');

const DEFAULT_STATE = Object.freeze({
    maintenanceMode: false,
    maintenanceReason: '',
    updatedAt: null,
    updatedBy: null
});

async function readState() {
    try {
        const raw = await fs.readFile(STATE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return {
            ...DEFAULT_STATE,
            ...parsed
        };
    } catch (error) {
        return { ...DEFAULT_STATE };
    }
}

async function writeState(nextState) {
    await fs.mkdir(LOG_DIR, { recursive: true });
    await fs.writeFile(STATE_FILE, JSON.stringify(nextState, null, 2), 'utf8');
}

async function getSystemState() {
    return readState();
}

async function setMaintenanceMode({ enabled, reason = '', updatedBy = null }) {
    const current = await readState();
    const next = {
        ...current,
        maintenanceMode: Boolean(enabled),
        maintenanceReason: String(reason || '').trim().slice(0, 500),
        updatedAt: new Date().toISOString(),
        updatedBy
    };
    await writeState(next);
    return next;
}

module.exports = {
    getSystemState,
    setMaintenanceMode
};
