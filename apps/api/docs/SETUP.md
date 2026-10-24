# ProjectsHub API — Environment Setup & Runbook

This guide walks you through setting up, configuring environment variables, seeding the database, and running the **ProjectsHub API** service locally.

---

## 1. Prerequisites

Before starting, ensure you have the following installed on your machine:

| Tool | Required Version | Verification Command | Description |
|---|---|---|---|
| **Node.js** | `>= 14.0.0` (v18+ recommended) | `node -v` | JavaScript runtime environment |
| **npm** | `>= 6.0.0` | `npm -v` | Package manager |
| **MongoDB** | `>= 4.2.0` | `mongod --version` or `docker -v` | Local service or Docker container |
| **Bruno** | Latest (optional) | Extension in VS Code | In-IDE API client for testing endpoints |

---

## 2. Step-by-Step Installation

### Step 1: Navigate to the API Directory
All backend commands must be run from inside the `apps/api` directory:
```bash
cd apps/api
```

### Step 2: Install Dependencies
```bash
npm install
```

---

## 3. Environment Variables Configuration

The API requires environment variables for MongoDB connection, JWT token authentication, and email delivery.

### Step 3.1: Create Your `.env` File
Copy the example environment file:
```bash
cp .env.example .env
```

### Step 3.2: Environment Variables Reference Dictionary

Open `.env` in your editor and configure the following parameters:

| Variable | Required | Default / Example | Description |
|---|:---:|---|---|
| `PORT` | No | `4500` | Port on which the Express server listens. |
| `MONGODB_URL` | **Yes** | `mongodb://127.0.0.1:27017/projects-hub` | MongoDB connection URI. |
| `JWT_SECRET` | **Yes** | *(Generate a secure key)* | Secret key used to sign and verify JWT authentication tokens. |
| `JWT_ACCESS_EXPIRATION_MINUTES` | No | `30` | Minutes before an access token expires. |
| `JWT_REFRESH_EXPIRATION_DAYS` | No | `30` | Days before a refresh token expires. |
| `JWT_RESET_PASSWORD_EXPIRATION_MINUTES` | No | `10` | Minutes before a password reset token expires. |
| `JWT_VERIFY_EMAIL_EXPIRATION_MINUTES` | No | `10` | Minutes before an email verification token expires. |
| `CLIENT_URL` | No | `http://localhost:5173` | Frontend portal base URL (used to generate password reset links sent via email). |
| `SMTP_HOST` | No* | `smtp.gmail.com` | SMTP email gateway host (*required for email delivery). |
| `SMTP_PORT` | No* | `587` | SMTP gateway port (587 for STARTTLS). |
| `SMTP_USERNAME` | No* | `your-email@gmail.com` | Your email address or SMTP username. |
| `SMTP_PASSWORD` | No* | `your-16-char-app-password` | 16-character Google App Password (do not use your regular account password). |
| `EMAIL_FROM` | No* | `Projects Hub <your-email@gmail.com>` | Sender name and email address appearing in outgoing emails. |

> **Security Tip — Generating a Cryptographically Secure `JWT_SECRET`:**
> Run this one-liner in your terminal to generate a strong 256-bit random key:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
> Copy the output and paste it into `JWT_SECRET` inside `.env`.

---

## 4. Configuring Gmail SMTP (For Password Resets & Emails)

To test features like **Forgot Password** or **Verify Email**, configure Gmail SMTP with an **App Password**:

1. Log into your Google Account and navigate to [Google Account Security](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned **ON**.
3. In the search bar at the top of Google Account, search for **App passwords** (or go directly to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
4. Enter an app name (e.g., `ProjectsHub API`) and click **Create**.
5. Copy the generated **16-character password** (e.g., `abcd efgh ijkl mnop`).
6. Update your `.env` file:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-actual-email@gmail.com
   SMTP_PASSWORD=abcdefghijklmnop
   EMAIL_FROM="Projects Hub <your-actual-email@gmail.com>"
   ```

*(Note: If you don't configure SMTP immediately, the server will still boot normally. Only email-sending endpoints will log an error upon execution).*

---

## 5. Starting MongoDB

Ensure MongoDB is running before launching the API. Choose one of the following methods:

### Option A: Via Docker (Quickest)
If you have Docker installed, start a local MongoDB container:
```bash
docker run -d -p 27017:27017 --name projectshub-mongo mongo:4.2
```
To stop or start it later:
```bash
docker stop projectshub-mongo
docker start projectshub-mongo
```

### Option B: Via Homebrew (macOS)
```bash
brew services start mongodb-community
```

---

## 6. Seeding the Database (Initial Data)

Once MongoDB is running, populate the database with universities, faculties, technology tags, sample projects, and default users:

```bash
# Seed initial sample data:
npm run seed

# To reset and re-seed from scratch at any time:
npm run seed:clean
```

### Seeded Test Credentials
All seeded users share the same default password: **`Password123!`**

| Role | Email | Password |
|---|---|---|
| **Super Administrator** | `admin@projectshub.com` | `Password123!` |
| **Faculty Dean** | `dean.cs.kdun@kdun.edu.af` | `Password123!` |
| **Teacher** | *(Check seed console output for teacher emails)* | `Password123!` |
| **Student** | `student_101@kdun.edu.af` | `Password123!` |

---

## 7. Starting the API

### Development Mode (with hot-reload via nodemon)
```bash
npm run dev
```

When successfully started, you will see:
```text
Connected to MongoDB
Listening to port 4500
```

---

## 8. Verifying Your Setup

### 1. Interactive Swagger API Documentation
Open your browser and navigate to:
```
http://localhost:4500/v1/docs
```
You can view all endpoints, inspect request schemas, and send test requests directly in your browser.

### 2. In-IDE API Testing with Bruno
The project includes a pre-configured Bruno collection in `bruno/`:
1. Copy the Bruno environment secrets template:
   ```bash
   cp bruno/.env.example bruno/.env
   ```
2. Open the Bruno extension in your IDE sidebar.
3. Open collection and select the `apps/api/bruno` directory.
4. Select the **Local** environment from the top-right environment picker.
5. Execute `auth/01-Login` using `admin@projectshub.com` and `Password123!`. The access token and user ID will automatically chain to all subsequent requests.

### 3. Run Automated Endpoint Contract Tests via CLI
```bash
npm run test:bruno
```

### 4. Run Unit & Integration Test Suite
```bash
npm test
```

---

## 9. Troubleshooting & FAQ

### `Config validation error: "JWT_SECRET" is required`
- **Cause:** The `.env` file does not exist or `JWT_SECRET` is missing.
- **Fix:** Make sure you ran `cp .env.example .env` and that `JWT_SECRET` contains a non-empty string.

### `MongoNetworkError: failed to connect to server [127.0.0.1:27017]`
- **Cause:** MongoDB service is not running on port `27017`.
- **Fix:** Start MongoDB using `docker start projectshub-mongo` or `brew services start mongodb-community`.

### `Error: listen EADDRINUSE: address already in use :::4500`
- **Cause:** Another process is already running on port `4500`.
- **Fix:** Kill the existing process:
  ```bash
  lsof -ti:4500 | xargs kill -9
  ```
  Or change `PORT=4501` in your `.env` file.

### `Invalid login: 535-5.7.8 Username and Password not accepted`
- **Cause:** Gmail rejected the SMTP credentials.
- **Fix:** Ensure 2-Step Verification is enabled on your Google account and you are using a generated 16-character **App Password**, not your regular personal password.
