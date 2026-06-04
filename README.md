# Inventra — Intelligent Inventory Management System

<p align="center">
  <img src="docs/banner.png" alt="Inventra" width="600" />
</p>

> A production-grade, full-stack inventory management platform powered by AI insights, real-time analytics, and secure multi-factor authentication.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + OTP (Email/SMS) |
| Charts | Recharts |
| Export | PDF (pdfkit) + Excel (exceljs) |
| AI Module | Google Gemini API |
| Containerization | Docker + Docker Compose |

---

## 📁 Project Structure

```
inventra/
├── frontend/          # React + Vite SPA
├── backend/           # Node.js + Express API
├── database/          # Migrations & Seeds
├── docs/              # API Documentation
├── docker/            # Docker configs
├── docker-compose.yml
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB >= 6
- Docker (optional)

### Development

```bash
# Clone and install
git clone https://github.com/yourorg/inventra.git
cd inventra

# Install all dependencies
npm run install:all

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start development servers
npm run dev
```

### Docker

```bash
docker-compose up --build
```

---

## 🌐 Endpoints

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **API Docs**: http://localhost:5000/api/docs

---

## 🔐 Environment Variables

See `backend/.env.example` and `frontend/.env.example` for required variables.

---

## 📖 Documentation

Full API documentation is available in [`/docs/API.md`](docs/API.md).

---

## 🧠 AI Features

Inventra uses Google Gemini to:
- Predict stock shortages before they happen
- Suggest optimal reorder quantities
- Generate natural-language inventory summaries
- Detect anomalies in purchasing patterns

---

## 📄 License

MIT © 2025 Inventra
