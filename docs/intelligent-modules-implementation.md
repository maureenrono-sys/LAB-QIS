# Lab-QIS Intelligent Modules Implementation (Scaffold)

This scaffold is implemented in your current Express + Sequelize codebase and wired through `backend/server.js`.

## New backend routes

- `/api/dashboard/*`
- `/api/sops/*`
- `/api/qc-intelligence/*`
- `/api/nc-intelligence/*`
- `/api/risks/*`
- `/api/staff/*`
- `/api/slipta/*`
- `/api/analytics-engine/*`

## Event-driven module linkage

Implemented with:

- `backend/services/eventBus.js`
- `backend/services/workflowListener.js`
- `backend/services/kpiService.js`
- `backend/services/alertService.js`

Flow:

1. QC reject/failure streak emits `qc:failed`.
2. Listener auto-creates NC + Risk + Alert.
3. NC/CAPA updates emit `nc:updated` / `capa:updated`.
4. KPI snapshot recalculates for dashboard updates.

## KPI logic (implemented)

- `QC Pass Rate = PASS runs / total runs * 100`
- `Competency Compliance = competent active staff / active staff * 100`
- `Lab Quality Index` weighted from QC pass, NC load, calibration alerts, SLIPTA stars, competency.

## Validators added

- `backend/validators/common.js`
- `backend/validators/qcValidator.js`
- `backend/validators/riskValidator.js`
- `backend/validators/sopValidator.js`
- `backend/validators/staffValidator.js`
- `backend/validators/sliptaValidator.js`

