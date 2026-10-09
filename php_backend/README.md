# 🐘 LandLens PHP REST API Backend Engine

This directory contains the **Native PHP 8.x REST API Backend** for the **LandLens** platform. It provides a complete, drop-in replacement for all Spring Boot / Node.js API endpoints, connecting directly to the **Hostinger MySQL Database** (`srv1117.hstgr.io`) and **NVIDIA NIM AI Vision Services**.

---

## 🚀 1. How to Run the PHP Backend

### Option A: 1-Click Batch File (Windows)
Double click:
```cmd
php_backend\run_php_server.bat
```

### Option B: PHP Built-in Server CLI
```bash
cd php_backend
php -S 0.0.0.0:5000 router.php
```
The server will be live on `http://localhost:5000`.

### Option C: Apache / XAMPP / WAMP / Nginx
1. Place the `php_backend` folder inside `htdocs` or your web root.
2. Ensure `mod_rewrite` is enabled in Apache.
3. The `.htaccess` file will route all API requests automatically through `index.php`.

---

## 📑 2. Complete Converted API Endpoint Reference

### 🏥 System & Health Endpoints
| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | System status & AI model information |
| `GET` | `/api/health` | Health check & MySQL database connectivity status |
| `GET` | `/actuator/health` | Spring Boot Actuator standard health format |

### 🔐 Authentication & Profile Endpoints
| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | User login (returns Bearer access token & user role) |
| `POST` | `/api/auth/register` | Register new citizen / broker / officer with bcrypt hashing |
| `POST` | `/api/auth/logout` | Invalidate session / token |
| `GET` | `/api/users/me` | Fetch authenticated user profile via Bearer token |
| `GET` | `/api/users` | List registered platform users (Admin view) |

### 🏡 Property Management Endpoints
| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/properties` | List properties with query filters (`status`, `category`, `district`) |
| `GET` | `/api/properties/{id}` | Retrieve single property details by UUID |
| `POST` | `/api/properties` | Create new land parcel listing |
| `POST` | `/api/properties/{id}/visit` | Schedule physical site visit for a parcel |
| `GET` | `/api/properties/visits` | Fetch all scheduled property visits |
| `GET` | `/api/properties/saved` | Fetch buyer saved properties |

### 🔍 I3B Document Verification & Dual-Layer Engine
| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/verify/document` | **Stage 1**: Computes Tri-Tier Concordance Matrix $\Phi(D, B, R)$ |
| `POST` | `/api/verify/trigger-owner-verification` | **Stage 2**: Generates HMAC-SHA256 token and dispatches owner challenge |
| `POST` / `GET` | `/api/verify/owner-action` | **Stage 2**: Processes Owner APPROVE ($\alpha=1$) or REJECT ($\alpha=0$) action |
| `GET` | `/api/verification/timeline` | Fetch audit timeline for land deed verification |
| `POST` | `/api/government-verify` | Mandal Revenue Officer (MRO) verification sign-off |
| `POST` | `/api/ai-verification` | Multi-factor AI trust score evaluation |

### 🤖 NVIDIA AI & Automated Valuation Model (AVM)
| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ai/chat` | NVIDIA NIM Vision/LLM reasoning with markdown table support |
| `POST` | `/api/ai/message` | AI chat alias endpoint |
| `POST` | `/api/ai/estimate-price` | Algorithmic land price valuation based on area & district |

### 📊 Analytics, Keys & Citizen Fraud Reports
| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/analytics` | Summary metrics (total, verified, pending, accuracy) |
| `GET` | `/api/developer/keys` | API keys management for external integrations |
| `GET` | `/api/fraud-reports` | Citizen fraud reports and case status |
| `GET` | `/api/notifications` | User notifications list |

---

## 🗄️ 3. Database Architecture (Hostinger MySQL)
- **Host**: `srv1117.hstgr.io`
- **Database Name**: `u833088220_Priya_teamlead`
- **Port**: `3306`
- **Driver**: `PDO_MYSQL` with UTF-8mb4 character set

---

## 🧪 4. Testing the Endpoints
To verify all PHP endpoints and database connectivity:
```bash
php test_php_api.php
```
