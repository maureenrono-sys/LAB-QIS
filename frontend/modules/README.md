# Lab-QIS Frontend Module Structure

This project currently uses static HTML pages. The structure below is prepared to modularize UI logic by intelligent module while keeping your existing pages.

## Suggested folders

- `frontend/modules/dashboard/`
- `frontend/modules/sop/`
- `frontend/modules/qc/`
- `frontend/modules/equipment/`
- `frontend/modules/nc-capa/`
- `frontend/modules/risk/`
- `frontend/modules/staff/`
- `frontend/modules/slipta/`
- `frontend/modules/analytics/`
- `frontend/components/`
- `frontend/services/`

## Shared components

- `KpiCard.js`
- `AlertsPanel.js`
- `RiskHeatMap.js`
- `ComplianceGauge.js`

## Shared services

- `api.js` for authenticated API requests
- `dashboardService.js` for dashboard summary and recompute
- `notificationsService.js` for alerts

