# Health Hub PMS

Health Hub PMS (Patient Management System) is a comprehensive healthcare application designed to manage patient data, consent records, and access logs. It features a modern React-based frontend and a robust Flask-based backend, ensuring secure and efficient data handling.

## Tech Stack

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite 7
- **Styling:** TailwindCSS 4
- **Routing:** React Router v7
- **Icons:** Lucide React

### Backend
- **Framework:** Flask (Python)
- **API:** Flask-RESTful
- **Database ORM:** SQLALchemy
- **Authentication:** Flask-JWT-Extended
- **Migrations:** Flask-Migrate
- **Package Manager:** uv

### Database
- **Engine:** MariaDB

## Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (v18+ recommended)
- **Python** (v3.13+)
- **uv** (Python package manager)
- **MariaDB** Server

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd health-hub-pms
```

### 2. Backend Setup
Navigate to the backend directory and set up the environment.

```bash
cd backend

# Create virtual environment and install dependencies
uv sync

# Create .env file
cp .example.env .env
# Edit .env with your database credentials and secret keys
```

**Database Setup:**
```bash
# Initialize DB migrations (if not already done)
uv run flask db upgrade

# Seed the database with default data
uv run python seed.py
```

**Run the Server:**
```bash
uv run flask run
```
The backend API will start at `http://localhost:5000`.

### 3. Frontend Setup
Navigate to the frontend directory.

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
The application will be accessible at `http://localhost:5173`.

## Default Test Credentials

Use the following credentials to log in and test different user roles:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@test.com` | `Test123!` |
| **Patient** | `patient@test.com` | `Test123!` |
| **Doctor** | `doctor@test.com` | `Test123!` |

  > **Note**: The admin can only view access logs. They cannot currently manage users. Future improvements will allow admins to manage users.

## API Endpoints List

### Authentication
- `POST /login` - User login & token generation
  > **Note**: The current implementation does not get user data on the patient side if "Remember Me" is unset

- `POST /register` - User registration

  >  **Note**: The current implementation does not retreive user information if not already in the central registry. Future improvements will allow users to register and login using their national ID.

- `POST /auth/token-refresh` - Refresh access token

### Consents
- `POST /api/consents` - Create new consent record
- `GET /api/consents/patient/<url_id>` - Get consents for a specific patient
- `PATCH /api/consents/<consent_id>/revoke` - Revoke an existing consent
- `POST /api/consents/check` - Check specific consent validity

  > **Note:** The current implementation allows a patient to grant consent more than once, but when searching by National ID, the healthcare worker can only see the first active consent record found. Future improvements will allow selecting from multiple valid consents.

### Facilities & Logs
- `GET /facilities` - List healthcare facilities
- `GET /api/consents/facility` - Get all consents for a specific facility
- `GET /api/access-logs/user/<user_id>` - Get access logs for a user
- `GET /api/admin/access-logs` - Get all access logs (Admin only)

## Security Measures Implemented

- **JWT Authentication:** Secure access and refresh token mechanism with expiration policies (15m access, 7d refresh).
- **Password Hashing:** Passwords are hashed using `bcrypt` before storage.
- **RBAC (Role-Based Access Control):** distinct roles (Admin, Patient, Healthcare Worker) restrict access to specific resources.
- **Data Encryption:** Sensitive identifiers (like National ID) are encrypted at rest.
- **CORS Configuration:** Controlled Cross-Origin Resource Sharing settings.
- **Environment Variables:** Sensitive configuration stored in `.env` files.
