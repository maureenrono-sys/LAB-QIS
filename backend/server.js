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

// Load config
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
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

// Test Route
app.get('/', (req, res) => {
    res.send('Lab QIS API (MySQL) is running...');
});

// Sync Database and Start Server
const PORT = process.env.PORT || 5000;

// This syncs your models to the database (creates tables)
sequelize.sync({ force: false })
    .then(() => {
        console.log('MySQL Database connected & Models synced.');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });