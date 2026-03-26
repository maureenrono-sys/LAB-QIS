# 🧪 Lab-QIS Professional
### Quality Intelligence System for Clinical Laboratories (ISO 15189:2022)

Lab-QIS is a "Quality Intelligence Layer" designed to bridge the gap between raw laboratory data and regulatory compliance. It provides real-time monitoring of Quality Indicators (QIs), Turnaround Times (TAT), and Non-Conformities (NC).

---

## 🚀 Key Features
* **Executive Dashboard**: Real-time visualization of laboratory performance (SLIPTA star levels).
* **Quality Indicators**: Automated tracking of Pre-analytical, Analytical, and Post-analytical metrics.
* **NC & CAPA Management**: Digital log for Non-Conformities and Corrective/Preventive Actions (ISO Clause 8.7).
* **Instrument Health**: Status monitoring for laboratory analyzers.
* **Departmental Views**: Specialized views for Hematology, Biochemistry, Microbiology, etc.

---

## 🛠️ Tech Stack
* **Frontend**: HTML5, Bootstrap 5 (UI Framework), Chart.js (Data Visualization)
* **Backend**: Node.js & Express
* **Database**: PostgreSQL / MySQL
* **Security**: JWT Authentication & Environment-based configuration

---

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone [https://github.com/maureenrono-sys/LAB-QIS.git](https://github.com/maureenrono-sys/LAB-QIS.git)
   cd lab-qis

1. **Install Dependencies**
    npm install

1. **Configure Environment**
    Create a `.env` file based on `.env.example`
    For PostgreSQL deployments, prefer `DATABASE_URL` plus `DB_DIALECT=postgres`
    Set `JWT_SECRET` and `PUBLIC_APP_URL` so auth and uploaded file links work correctly

## Render Deployment

Render Postgres exposes an internal PostgreSQL connection string. Use that value for `DATABASE_URL`.

- `DB_DIALECT=postgres`
- `DATABASE_URL=<Render internal connection string>`
- `JWT_SECRET=<long random secret>`
- `PUBLIC_APP_URL=https://<your-service>.onrender.com`

Render injects `PORT` automatically for the web service. `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, and `DB_NAME` are only needed if you decide not to use `DATABASE_URL`.
