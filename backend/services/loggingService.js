const fs = require('fs/promises');
const path = require('path');
const { LoginLog, ErrorLog, RequestAuditLog } = require('../models');

const LOG_DIR = path.join(__dirname, '../../logs');
const LOGIN_LOG_FILE = path.join(LOG_DIR, 'system-login.log');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'system-error.log');
const REQUEST_LOG_FILE = path.join(LOG_DIR, 'system-request.log');

async function appendJsonLine(filePath, payload) {
    await fs.mkdir(LOG_DIR, { recursive: true });
    await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, 'utf8');
}

async function logLoginEvent(payload) {
    const record = {
        labId: payload.labId || null,
        userId: payload.userId || null,
        userEmail: payload.userEmail || null,
        userName: payload.userName || null,
        roleName: payload.roleName || null,
        status: payload.status,
        failureReason: payload.failureReason || null,
        ipAddress: payload.ipAddress || null,
        userAgent: payload.userAgent || null,
        loggedAt: payload.loggedAt || new Date()
    };

    try {
        await LoginLog.create(record);
    } catch (error) {
        // Keep service resilient: file logging still runs.
    }

    await appendJsonLine(LOGIN_LOG_FILE, record);
}

async function logErrorEvent(payload) {
    const record = {
        labId: payload.labId || null,
        userId: payload.userId || null,
        scope: payload.scope || 'UNSPECIFIED',
        route: payload.route || null,
        method: payload.method || null,
        statusCode: payload.statusCode || null,
        message: payload.message || 'Unknown server error',
        stack: payload.stack || null,
        ipAddress: payload.ipAddress || null,
        userAgent: payload.userAgent || null,
        errorAt: payload.errorAt || new Date()
    };

    try {
        await ErrorLog.create(record);
    } catch (error) {
        // Keep service resilient: file logging still runs.
    }

    await appendJsonLine(ERROR_LOG_FILE, record);
}

async function logRequestAuditEvent(payload) {
    const record = {
        requestId: payload.requestId || `req_${Date.now()}`,
        labId: payload.labId || null,
        userId: payload.userId || null,
        method: payload.method || 'GET',
        route: payload.route || '/',
        statusCode: Number(payload.statusCode || 0),
        durationMs: Number(payload.durationMs || 0),
        ipAddress: payload.ipAddress || null,
        userAgent: payload.userAgent || null
    };

    try {
        await RequestAuditLog.create(record);
    } catch (error) {
        // Keep service resilient: file logging still runs.
    }

    await appendJsonLine(REQUEST_LOG_FILE, { ...record, createdAt: new Date().toISOString() });
}

module.exports = {
    logLoginEvent,
    logErrorEvent,
    logRequestAuditEvent
};
