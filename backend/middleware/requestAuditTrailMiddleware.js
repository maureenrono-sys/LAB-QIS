const { randomUUID } = require('crypto');
const { logRequestAuditEvent } = require('../services/loggingService');

function requestAuditTrail(req, res, next) {
    const start = process.hrtime.bigint();
    const requestId = req.headers['x-request-id'] || randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number((end - start) / BigInt(1000000));
        logRequestAuditEvent({
            requestId,
            labId: req.user?.labId || null,
            userId: req.user?.id || null,
            method: req.method,
            route: req.originalUrl,
            statusCode: res.statusCode,
            durationMs,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        }).catch(() => {});
    });

    next();
}

module.exports = { requestAuditTrail };
