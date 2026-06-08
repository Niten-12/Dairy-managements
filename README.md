# Dairy Management System

Full-stack web application — React + Spring Boot + PostgreSQL + Docker.

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite + React Router + Axios |
| Backend   | Spring Boot 3.x + Java 21 + Maven   |
| Database  | PostgreSQL 16                       |
| Security  | Spring Security + JWT               |
| Container | Docker + Docker Compose             |

## Quick Start

### Prerequisites
- Docker Desktop installed and running

### Run with Docker

```bash
cd "D:\Dairy Management"
docker compose up -d
```

| Service    | URL                    | Notes           |
|------------|------------------------|-----------------|
| Frontend   | http://localhost:3000  | React app       |
| Backend    | http://localhost:8080  | Spring Boot API |
| PostgreSQL | localhost:5432         | DB              |

### Run Locally (Development)

**Backend:**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Frontend dev server: http://localhost:5173

## API Endpoints

| Method | Endpoint             | Access  |
|--------|----------------------|---------|
| POST   | /api/auth/register   | Public  |
| POST   | /api/auth/login      | Public  |

## Project Structure

```
Dairy Management/
├── frontend/          React + Vite
├── backend/           Spring Boot + Java 21
├── docker-compose.yml
├── .env               Credentials (never commit)
└── README.md
```
