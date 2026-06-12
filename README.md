<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-v5-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MySQL-v8-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Gemini_AI-Powered-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
</p>

# 🔍 The Unfound Registry

> **A global platform for tracking, reporting, and recovering stolen, missing, and lost art & cultural artifacts.**

The Unfound Registry is a full-stack web application that enables collectors, institutions, and law enforcement to catalog missing artwork, search a shared database, and generate AI-powered sighting reports — all through a sleek, modern dark-mode interface.

---

## ✨ Features

### Core
- **Artifact Registry** — Create, edit, and delete records for stolen/missing/lost art with images, descriptions, and provenance details
- **Advanced Search** — Full-text search across title, artist, period, and description with status filtering
- **Image Uploads** — Multer-powered file uploads with server-side MIME validation (JPEG, PNG, WebP)
- **Responsive Masonry Grid** — Pinterest-style layout with shimmer loading skeletons and card animations

### AI-Powered (Google Gemini)
- **🤖 Image Analysis** — Upload an artifact photo and let Gemini AI identify the style, period, and materials automatically
- **📝 Report Generation** — Generate formal sighting reports suitable for museums, insurance companies, or law enforcement — all processed server-side for security

### Security & Auth
- **JWT Authentication** — Secure token-based login with 3-hour expiry
- **Bcrypt Password Hashing** — Industry-standard salted hashing
- **Role-Based Access** — Separate `collector` and `admin` roles
- **Rate Limiting** — Brute-force protection on auth endpoints (20 requests/15 min per IP)
- **Input Validation** — Server-side validation on all user inputs

### Admin Dashboard
- **📊 Platform Statistics** — Total users, artifacts, and stolen items at a glance
- **👥 User Management** — View all users and remove accounts (with self-deletion protection)
- **Full Edit Control** — Admins can edit or delete any artifact

---

## 🏗️ Architecture

The codebase follows a **modular, layered architecture** — each concern (config, middleware, routes, queries, errors) lives in its own file under `src/`.

```
unfound-registry-api/
├── server.js                        # Entry point — wires middleware, routes & startup
├── src/
│   ├── config/
│   │   └── db.js                    # MySQL pool + promise wrapper
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication & admin authorization
│   │   ├── rateLimiter.js           # In-memory rate limiting (auth endpoints)
│   │   └── upload.js                # Multer disk storage, file filter & size limits
│   ├── queries/
│   │   ├── artifactQueries.js       # All artifact SQL (CRUD, search, report)
│   │   ├── userQueries.js           # User SQL (register, login lookup)
│   │   └── adminQueries.js          # Admin SQL (stats, user list, delete)
│   ├── routes/
│   │   ├── index.js                 # Central router — mounts all sub-routers
│   │   ├── healthRoutes.js          # GET  /api/health
│   │   ├── authRoutes.js            # POST /api/register, POST /api/login
│   │   ├── artifactRoutes.js        # CRUD /api/artifacts
│   │   ├── aiRoutes.js              # POST /api/analyze-image, /api/generate-report
│   │   └── adminRoutes.js           # GET/DELETE /api/admin/*
│   └── errors/
│       └── errorHandler.js          # Centralized error handler (multer + unhandled)
├── Public/
│   └── index.html                   # Single-page frontend (Tailwind CSS + vanilla JS)
├── uploads/                         # User-uploaded artifact images (git-ignored)
├── .env                             # Environment variables (git-ignored)
├── .env.example                     # Template for required environment variables
├── package.json
└── .gitignore
```

### Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| **Backend**  | Node.js, Express 5, mysql2             |
| **Frontend** | HTML5, Tailwind CSS (CDN), Vanilla JS  |
| **Database** | MySQL 8                                |
| **Auth**     | JWT (jsonwebtoken), bcrypt             |
| **AI**       | Google Gemini API (2.5 Flash)          |
| **Uploads**  | Multer (disk storage)                  |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MySQL](https://dev.mysql.com/downloads/) v8 or higher
- A [Google AI Studio](https://aistudio.google.com/) API key (for Gemini features)

### 1. Clone the repository

```bash
git clone https://github.com/qxzy-24/Unfound_Registry_Project.git
cd Unfound_Registry_Project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

Create the MySQL database and tables:

```sql
CREATE DATABASE unfound_registry;
USE unfound_registry;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('collector', 'admin') DEFAULT 'collector'
);

CREATE TABLE artifacts (
    artifact_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    artist VARCHAR(255),
    period VARCHAR(255),
    materials VARCHAR(255),
    dimensions VARCHAR(255),
    owner_id INT,
    FOREIGN KEY (owner_id) REFERENCES users(user_id)
);

CREATE TABLE artifact_status (
    status_id INT AUTO_INCREMENT PRIMARY KEY,
    artifact_id INT,
    status ENUM('Stolen', 'Missing', 'Lost', 'Recovered') NOT NULL,
    last_seen_date DATE,
    last_seen_location VARCHAR(255),
    FOREIGN KEY (artifact_id) REFERENCES artifacts(artifact_id) ON DELETE CASCADE
);

CREATE TABLE artifact_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    artifact_id INT,
    image_url VARCHAR(500) NOT NULL,
    is_primary_image BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (artifact_id) REFERENCES artifacts(artifact_id) ON DELETE CASCADE
);

-- Add full-text index for search
ALTER TABLE artifacts ADD FULLTEXT(title, description, artist, period);
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=unfound_registry
JWT_SECRET=your-secure-random-secret
GEMINI_API_KEY=your-google-ai-studio-key
PORT=3000
```

### 5. Start the server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/artifacts` | List/search artifacts (supports `?search=`, `?status=`, `?period=`) |
| `GET` | `/api/artifacts/:id` | Get artifact details |

### Auth Endpoints (Rate Limited)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/register` | Create a new account |
| `POST` | `/api/login` | Login & receive JWT token |

### Protected Endpoints (Requires `x-auth-token` header)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/artifacts` | Create artifact (multipart form) |
| `PUT` | `/api/artifacts/:id` | Update artifact (owner or admin) |
| `DELETE` | `/api/artifacts/:id` | Delete artifact (owner or admin) |
| `POST` | `/api/analyze-image` | AI image analysis |
| `POST` | `/api/generate-report` | AI sighting report generation |

### Admin Endpoints (Requires admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Platform statistics |
| `GET` | `/api/admin/users` | List all users |
| `DELETE` | `/api/admin/users/:id` | Delete a user |

---

## 🔐 Security

- All secrets are stored in `.env` (never committed to git)
- Gemini API calls are proxied through the backend — API keys are never exposed to the client
- Passwords are salted and hashed with bcrypt (10 rounds)
- JWT tokens expire after 3 hours
- File uploads are validated server-side (MIME type + 5MB size limit)
- Auth endpoints are rate-limited (20 requests per 15-minute window per IP)
- All route parameters are sanitized before database queries

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ☕ and a passion for cultural heritage preservation.
</p>
