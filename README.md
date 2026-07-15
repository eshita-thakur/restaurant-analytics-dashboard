# 🌸 Bloom & Table — Restaurant Business Analytics Dashboard

A full-stack restaurant management and analytics platform built with React, Flask, MySQL, and Pandas.

## Features

- **Authentication & RBAC** — JWT-based login with owner/manager/staff role permissions
- **Operations** — Menu, Customers, Employees, Inventory (with stock ledger), Suppliers, Purchase Orders, Orders, Payments, Reservations, Feedback, Coupons, Expenses
- **Analytics** — Revenue trends, sales growth, top/least selling items, inventory turnover, peak hours, customer retention, employee performance, food waste analysis (powered by Pandas & NumPy)
- **Reports** — Downloadable Excel and PDF reports (openpyxl, Matplotlib, ReportLab), wired into the UI
- **Custom design system** — a bespoke "blooming petals" visual identity built with Tailwind CSS
- **Automated testing** — 26 pytest tests covering auth, RBAC, and core business logic, with an isolated test database

## Tech Stack

**Frontend:** React, React Router, Axios, Tailwind CSS, Recharts
**Backend:** Python, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Bcrypt
**Database:** MySQL (18 normalized tables, 3NF)
**Analytics/Reports:** Pandas, NumPy, Matplotlib, openpyxl, ReportLab
**Testing:** Pytest
**Tools:** Git, GitHub, Postman, VS Code

## Project Structure
```
restaurant-analytics-dashboard/
├── backend/        # Flask REST API
├── frontend/       # React application
├── database/       # SQL schema
└── README.md
```
## Local Setup

### Database
```bash
mysql -u root -p < database/schema.sql
```

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
# create a .env file (see below)
python run.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create `backend/.env`:
```
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost/restaurant_analytics
TEST_DATABASE_URL=mysql+pymysql://root:yourpassword@localhost/restaurant_analytics_test
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_EXPIRES_HOURS=24
```
## Running Tests

```bash
cd backend
pytest tests/ -v
```

Tests run against a separate `restaurant_analytics_test` database, never against production data.

## Status

Backend, frontend, analytics, and reports are complete and fully tested. Deployment is in progress.

## Author

Built by Eshita Thakur as a full-stack learning project, developed module by module with a focus on real-world architecture: layered backend design, role-based access control, a normalized database schema, and a tested REST API.