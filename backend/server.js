const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

const models = require('./models'); // This triggers the associations
const authRoutes = require('./routes/authRoutes');
const qiRoutes = require('./routes/qiRoutes');
const ncRoutes = require('./routes/ncRoutes'); // 1. Import
const docRoutes = require('./routes/docRoutes');
const path = require('path');
const auditRoutes = require('./routes/auditRoutes');
const benchmarkRoutes = require('./routes/benchmarkRoutes')
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const sopRoutes = require('./routes/sopRoutes');
const qcIntelligenceRoutes = require('./routes/qcIntelligenceRoutes');
const ncCapaIntelligenceRoutes = require('./routes/ncCapaIntelligenceRoutes');
const riskRoutes = require('./routes/riskRoutes');
const staffRoutes = require('./routes/staffRoutes');
const sliptaAutomationRoutes = require('./routes/sliptaAutomationRoutes');
const analyticsEngineRoutes = require('./routes/analyticsEngineRoutes');
const systemLogRoutes = require('./routes/systemLogRoutes');
const adminRoutes = require('./routes/adminRoutes');
const clientFeedbackRoutes = require('./routes/clientFeedbackRoutes');
const systemRoutes = require('./routes/systemRoutes');
const { initWorkflowListeners } = require('./services/workflowListener');
const { logErrorEvent } = require('./services/loggingService');
const { requestAuditTrail } = require('./middleware/requestAuditTrailMiddleware');
const { enforceMaintenanceMode } = require('./middleware/maintenanceModeMiddleware');

// Load config
dotenv.config();

const app = express();
const FRONTEND_DIR = path.join(__dirname, '../frontend');

// Middleware
app.use(express.json());
app.use(cors());
app.use(requestAuditTrail);
app.use(enforceMaintenanceMode);

app.use((req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (res.statusCode >= 500) {
            logErrorEvent({
                labId: req.user?.labId || null,
                userId: req.user?.id || null,
                scope: 'API_RESPONSE',
                route: req.originalUrl,
                method: req.method,
                statusCode: res.statusCode,
                message: body?.message || 'Internal server error',
                stack: body?.stack || null,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }).catch(() => {});
        }
        return originalJson(body);
    };
    next();
});
// app.use(models);
app.use('/api/auth', authRoutes);
app.use('/api/qi', qiRoutes);
app.use('/api/nc', ncRoutes); // 2. Use
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/docs', docRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/benchmarks', benchmarkRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sops', sopRoutes);
app.use('/api/qc-intelligence', qcIntelligenceRoutes);
app.use('/api/nc-intelligence', ncCapaIntelligenceRoutes);
app.use('/api/risks', riskRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/slipta', sliptaAutomationRoutes);
app.use('/api/analytics-engine', analyticsEngineRoutes);
app.use('/api/system-logs', systemLogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client-feedback', clientFeedbackRoutes);
app.use('/api/system', systemRoutes);
app.use(express.static(FRONTEND_DIR));

// Frontend entry route (same host as API)
app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
    logErrorEvent({
        labId: req.user?.labId || null,
        userId: req.user?.id || null,
        scope: 'UNHANDLED_MIDDLEWARE',
        route: req.originalUrl,
        method: req.method,
        statusCode: err.status || 500,
        message: err.message || 'Unhandled server error',
        stack: err.stack || null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    }).catch(() => {});

    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// Sync Database and Start Server
const PORT = process.env.PORT || 5000;

// MySQL + Sequelize alter can repeatedly create keys across restarts.
// Keep default sync safe; opt into alter explicitly when needed.
const syncOptions = process.env.DB_SYNC_ALTER === 'true'
    ? { alter: true }
    : { force: false };

// This syncs your models to the database (creates/updates tables)
sequelize.sync(syncOptions)
    .then(() => {
        initWorkflowListeners();
        console.log('MySQL Database connected & Models synced.');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        logErrorEvent({
            scope: 'SERVER_STARTUP',
            route: 'sequelize.sync',
            method: 'INIT',
            statusCode: 500,
            message: err.message || 'Unable to connect to the database',
            stack: err.stack || null
        }).catch(() => {});
        console.error('Unable to connect to the database:', err.message);
    });

process.on('unhandledRejection', (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : null;
    logErrorEvent({
        scope: 'PROCESS_UNHANDLED_REJECTION',
        method: 'PROCESS',
        statusCode: 500,
        message,
        stack
    }).catch(() => {});
});

process.on('uncaughtException', (error) => {
    logErrorEvent({
        scope: 'PROCESS_UNCAUGHT_EXCEPTION',
        method: 'PROCESS',
        statusCode: 500,
        message: error.message,
        stack: error.stack
    }).catch(() => {});
});
