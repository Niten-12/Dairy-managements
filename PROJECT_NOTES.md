# Dairy Management System — Complete Project Record (2026-06-07)

**Location:** `D:\Dairy Management\`
**Status:** Boilerplate COMPLETE — ready for feature development

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React + Vite | React 18.3.1, Vite 5.4.11 |
| Routing | React Router DOM | 6.27.0 |
| HTTP Client | Axios | 1.7.7 |
| Backend | Spring Boot | 3.2.5 |
| Language | Java | 21 |
| Build Tool | Maven | 3.9.6 |
| ORM | Spring Data JPA + Hibernate | — |
| Security | Spring Security + JWT (jjwt 0.12.6) | — |
| Database | PostgreSQL (local Docker) | 16-alpine |
| Containerization | Docker + Docker Compose | — |
| Frontend Serve | Nginx (production) | alpine |
| Code Reduction | Lombok | — |

---

## Project Structure (41 files total)

```
D:\Dairy Management\
├── .env                          ← DB + JWT credentials (never commit)
├── docker-compose.yml            ← 3 services: postgres + backend + frontend
├── README.md
├── backend/
│   ├── Dockerfile                ← Multi-stage: maven:3.9.6 build → eclipse-temurin:21-jre run
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/dairy/management/
│       │   ├── DairyManagementApplication.java
│       │   ├── config/
│       │   │   ├── SecurityConfig.java      ← JWT filter, stateless, /api/auth/** public
│       │   │   └── CorsConfig.java          ← allows localhost:3000 + localhost:5173
│       │   ├── security/
│       │   │   ├── JwtUtil.java             ← generate/validate/extract JWT
│       │   │   ├── JwtAuthFilter.java       ← OncePerRequestFilter, Bearer token
│       │   │   └── UserDetailsServiceImpl.java ← loads user by email
│       │   ├── controller/
│       │   │   └── AuthController.java      ← POST /api/auth/register, /api/auth/login
│       │   ├── service/
│       │   │   └── AuthService.java         ← register + login logic
│       │   ├── repository/
│       │   │   └── UserRepository.java      ← findByEmail, existsByEmail
│       │   ├── entity/
│       │   │   └── User.java                ← id, name, email, password, role, timestamps
│       │   ├── dto/
│       │   │   ├── LoginRequest.java        ← email + password
│       │   │   ├── RegisterRequest.java     ← name + email + password
│       │   │   └── AuthResponse.java        ← token + email + name + role
│       │   └── exception/
│       │       ├── ApiException.java        ← RuntimeException with HttpStatus
│       │       └── GlobalExceptionHandler.java ← @RestControllerAdvice
│       └── resources/
│           └── application.yml
└── frontend/
    ├── Dockerfile                ← Multi-stage: node:20 build → nginx:alpine serve
    ├── nginx.conf                ← SPA routing + /api/ proxy to backend:8080
    ├── package.json
    ├── vite.config.js            ← dev proxy /api → localhost:8080
    ├── index.html
    ├── .env.example              ← VITE_API_URL=/api
    └── src/
        ├── main.jsx
        ├── App.jsx               ← BrowserRouter > AuthProvider > AppRoutes
        ├── api/
        │   ├── axiosInstance.js  ← baseURL /api, Bearer token interceptor, 401 redirect
        │   └── authApi.js        ← login(), register()
        ├── context/
        │   └── AuthContext.jsx   ← user state, login/logout, isAuthenticated
        ├── hooks/
        │   └── useAuth.js        ← re-export from AuthContext
        ├── routes/
        │   └── AppRoutes.jsx     ← /login public, /dashboard protected via ProtectedRoute
        ├── components/
        │   ├── ProtectedRoute.jsx ← Navigate to /login if not authenticated
        │   └── layout/
        │       ├── MainLayout.jsx ← Sidebar + Navbar + <Outlet />
        │       ├── Sidebar.jsx    ← NavLink with active highlight
        │       └── Navbar.jsx     ← Welcome user + Logout button
        ├── pages/
        │   ├── Login.jsx         ← email/password form, error display
        │   └── Dashboard.jsx     ← 4 stat cards (cattle, milk, farmers, collections)
        └── utils/
            └── tokenUtils.js     ← getToken/setToken/removeToken/isTokenPresent
```

---

## Docker Compose Services

| Service | Image | Port | Notes |
|---|---|---|---|
| postgres | postgres:16-alpine | 5432 | healthcheck: pg_isready |
| backend | ./backend Dockerfile | 8080 | depends_on postgres healthy |
| frontend | ./frontend Dockerfile | 3000→80 | nginx serves built React |

---

## Environment Variables (.env)

```
POSTGRES_DB=dairy_management
POSTGRES_USER=dairy_user
POSTGRES_PASSWORD=dairy_password
JWT_SECRET=dairy-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRATION=86400000   ← 24 hours in ms
```

---

## API Endpoints (implemented)

| Method | Endpoint | Access | Returns |
|---|---|---|---|
| POST | /api/auth/register | Public | AuthResponse (token + user info) |
| POST | /api/auth/login | Public | AuthResponse (token + user info) |
| ALL | /api/** (others) | JWT required | 401 if no/invalid token |

---

## Database

- **Current:** Local PostgreSQL in Docker (`postgres:16-alpine`)
- **Supabase Compatible:** Yes — just change `SPRING_DATASOURCE_URL` in .env to Supabase connection string
- **DDL:** `spring.jpa.hibernate.ddl-auto=update` — auto creates/updates tables
- **Tables auto-created:** `users`

## User Entity Fields

| Field | Type | Notes |
|---|---|---|
| id | Long | Auto-increment PK |
| name | String | Not null |
| email | String | Unique, not null |
| password | String | BCrypt encoded |
| role | String | Default: "USER" |
| createdAt | LocalDateTime | Auto |
| updatedAt | LocalDateTime | Auto |

---

## Run Commands

```powershell
# Docker (full stack)
cd "D:\Dairy Management"
docker compose up -d

# Frontend dev only
cd frontend && npm install && npm run dev   → http://localhost:5173

# Backend dev only
cd backend && mvn spring-boot:run           → http://localhost:8080
```

## Access URLs

| Service | URL |
|---|---|
| Frontend (Docker) | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

---

## Key Design Decisions

- JWT stored in localStorage (acceptable for internal tools)
- 401 response → auto redirect to /login via Axios interceptor
- Vite dev proxy `/api` → `localhost:8080` (no CORS issue in dev)
- Nginx production proxy `/api/` → `backend:8080` (Docker network)
- `ddl-auto=update` for dev — change to `validate` for production
- CORS allows both port 3000 (Docker) and 5173 (Vite dev)

---

## Supabase Migration (future)

Change in `.env`:
```
SPRING_DATASOURCE_URL=jdbc:postgresql://db.XXXX.supabase.co:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=<supabase-password>
```
Remove `postgres` service from `docker-compose.yml` and `depends_on`.
