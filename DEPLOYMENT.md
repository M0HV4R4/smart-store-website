# Smart Store — Production Deployment Guide
**Architecture**: React (Vite 7) + TypeScript + Tailwind CSS v4 + Vercel Serverless Functions + Neon PostgreSQL + Drizzle ORM + GitHub Releases

---

## 1. System Architecture & Topology

```
+-------------------------------------------------------------------------+
|                                VISITORS                                 |
+-------------------------------------------------------------------------+
       |                                              |
       | HTTPS (Static SPA)                           | HTTPS (API / Dynamic)
       v                                              v
+-----------------------------+        +----------------------------------+
|      VERCEL EDGE / CDN      |        |    VERCEL SERVERLESS FUNCTIONS   |
|   React 19 + Tailwind SPA   |        |   /api/download/*, /api/auth/*   |
| (Rewrites via vercel.json)  |        | /api/admin/*, /api/public/website|
+-----------------------------+        +----------------------------------+
                                                      |
                                                      | TLS / Transaction Pooler (Port 5432 / 6543)
                                                      | (max: 1 connection per serverless instance)
                                                      v
                                       +----------------------------------+
                                       |      NEON POSTGRESQL CLOUD       |
                                       |        (Tables: admins,          |
                                       | admin_sessions, releases,        |
                                       | download_events, website_settings|
                                       |       activity_logs)             |
                                       +----------------------------------+
                                                      |
+-----------------------------+                       |
|       GITHUB RELEASES       |<----------------------+
|  Direct Binary Asset Hosting| (Server redirects visitor to signed/direct URL)
|  - Windows: SmartStore.exe  |
|  - Android: SmartStore.apk  |
+-----------------------------+
```

---

## 2. Prerequisites

Before deploying to production, ensure you have the following accounts and tools ready:

- **Node.js**: `v22.12.0` or higher (`node -v`)
- **npm**: `v10.0.0` or higher (`npm -v`)
- **Git**: Installed and configured
- **GitHub Account**: To host the source repository and binary release files
- **Neon Account**: [https://neon.tech](https://neon.tech) (Free tier or Pro)
- **Vercel Account**: [https://vercel.com](https://vercel.com) (Hobby or Pro)

---

## 3. Database Setup (Neon PostgreSQL)

### Step 3.1: Create Project & Database
1. Log in to your [Neon Console](https://console.neon.tech).
2. Click **Create Project**.
3. Set **Project Name**: `smart-store-prod`.
4. Choose your preferred cloud region (e.g., `AWS eu-central-1` or `AWS us-east-1`, ideally close to your target audience).
5. Neon will display your connection details upon creation.

### Step 3.2: Obtain the Pooled Connection String
Neon offers two connection strings:
- **Direct**: `postgres://[user]:[password]@[host]/[database]`
- **Pooled (Recommended for Serverless)**: `postgres://[user]:[password]@[host]-pooler.neon.tech/[database]?sslmode=require`

> [!IMPORTANT]
> Always use the **Pooled** connection string (containing `-pooler.neon.tech` and `sslmode=require`) in Vercel. Serverless functions spin up and down concurrently; Neon's built-in connection pooler prevents connection exhaustion.

---

## 4. Local Environment Configuration for Setup

To run migrations and create the first administrator, you configure a temporary local `.env` file on your secure development machine.

1. Copy the template:
   ```powershell
   # PowerShell
   Copy-Item .env.example .env
   ```
   ```bash
   # Bash
   cp .env.example .env
   ```

2. Open `.env` and set:
   ```ini
   DATABASE_URL="postgres://<username>:<password>@<ep-pooler-id>.neon.tech/<dbname>?sslmode=require"
   SESSION_SECRET="<your-cryptographically-secure-random-string-at-least-32-chars>"
   NODE_ENV="production"
   ```

3. **Generate a Secure `SESSION_SECRET`**:
   Run this command in your terminal to generate a cryptographically strong 64-character hex secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

> [!CAUTION]
> Never commit `.env` to Git. Verify that `.gitignore` contains `.env` and `.env.*`.

---

## 5. Applying Database Migrations

Smart Store uses Drizzle ORM for schema and migration management. Run migrations from your terminal:

```powershell
# Run migrations against Neon production database
npm run db:migrate
```

**Expected Output:**
```
⏳ Connecting to PostgreSQL database...
📁 Applying migrations from: .../drizzle
✅ All migrations applied successfully!
```

This creates the following tables:
- `admins` (Administrator accounts)
- `admin_sessions` (Active sessions with sliding expiry)
- `releases` (Windows and Android releases history)
- `download_events` (Public download metrics)
- `website_settings` (Contact links: WhatsApp, Facebook, Instagram)
- `activity_logs` (Security and audit trails)

---

## 6. Bootstrapping the Initial Administrator

For security, **there is NO public HTTP endpoint or URL to create an admin account**. All admin bootstrapping occurs via the interactive CLI:

```powershell
npm run db:seed-admin
```

Follow the prompts:
1. **Username**: Enter the admin username (e.g. `admin` or your preferred handle).
2. **Email**: Enter your contact email.
3. **Password**: Enter a secure password (minimum 10 characters, at least 1 uppercase, 1 lowercase, 1 number). Input is masked in the terminal.
4. **Confirm**: Confirm your credentials.

The script hashes the password with **bcrypt (cost factor 12)** and stores the admin in Neon with active status.

---

## 7. Binary Release Hosting (GitHub Releases)

Smart Store serves Windows and Android installers via verified public redirects.

### Step 7.1: Upload Installers to GitHub Releases
1. In your GitHub repository, navigate to **Releases** -> **Draft a new release**.
2. Tag version: `v1.0.0` (or your current release version).
3. Title: `Smart Store v1.0.0`.
4. Attach your binaries:
   - `SmartStore-Setup.exe` (Windows installer)
   - `SmartStore.apk` (Android package)
5. Publish release.
6. Right-click the uploaded asset links and copy their direct download URLs:
   - Example Windows URL: `https://github.com/org/repo/releases/download/v1.0.0/SmartStore-Setup.exe`
   - Example Android URL: `https://github.com/org/repo/releases/download/v1.0.0/SmartStore.apk`

---

## 8. Git Repository Preparation & Push

1. Ensure Git is initialized:
   ```powershell
   git status
   ```
   If not initialized:
   ```powershell
   git init
   ```

2. Verify that no `.env` or build artifacts are staged:
   ```powershell
   git status --ignored
   ```
   Ensure `.env`, `node_modules/`, `dist/`, and `.vercel/` are ignored.

3. Stage and commit files:
   ```powershell
   git add .
   git commit -m "feat: complete Smart Store production codebase"
   ```

4. Push to your GitHub repository:
   ```powershell
   git remote add origin https://github.com/your-username/smart-store.git
   git branch -M main
   git push -u origin main
   ```

---

## 9. Vercel Production Deployment

### Step 9.1: Import Project
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your `smart-store` repository from GitHub.

### Step 9.2: Configure Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 9.3: Configure Production Environment Variables
Under **Settings** -> **Environment Variables**, add:

| Variable Name | Value | Target Environment |
|---|---|---|
| `DATABASE_URL` | `postgres://<username>:<password>@<ep-pooler-id>.neon.tech/<dbname>?sslmode=require` | Production, Preview |
| `SESSION_SECRET` | *(64-char hex random string)* | Production, Preview |
| `NODE_ENV` | `production` | Production |

> [!TIP]
> For preview environments, you may choose to create a dedicated Neon preview database branch, or reuse the primary database if preview isolation is not required.

### Step 9.4: Deploy
Click **Deploy**. Vercel will:
1. Build the Vite React frontend into `dist/`.
2. Compile and package `/api/*` into serverless edge lambdas.
3. Apply routing rewrites defined in `vercel.json` (routing `/((?!api/).*)` to `/index.html`).

---

## 10. Post-Deployment Verification (Smoke Test Checklist)

Once your production URL is live (e.g. `https://smartstore.vercel.app` or your custom domain):

### A. Public Website Health
- [ ] **Homepage**: Loads with status 200 OK, RTL (Arabic) / LTR (French) toggle functions smoothly.
- [ ] **Public Contact**: `GET /api/public/website` returns 200 with WhatsApp, Facebook, Instagram links.
- [ ] **Public Download Routing**:
  - `GET /api/download/windows` redirects (302) to the active Windows release URL.
  - `GET /api/download/android` redirects (302) to the active Android release URL.
  - Download event count increments in `download_events`.

### B. Admin Authentication & Security
- [ ] **Admin Login**: Navigate to `/admin/login`. Log in with seeded admin credentials.
- [ ] **Cookie Security**: Inspect the `admin_session` cookie in browser DevTools:
  - `HttpOnly`: Checked
  - `Secure`: Checked (HTTPS)
  - `SameSite`: `Lax`
- [ ] **CSRF Protection**: Non-GET mutations from foreign origins are rejected (403 Forbidden).

### C. Admin Dashboard Functionality
- [ ] **Downloads Management (`/admin/downloads`)**:
  - Windows & Android cards show status, version, and direct URL.
  - Can publish an update or toggle download availability.
- [ ] **Releases Management (`/admin/releases`)**:
  - Lists all past releases.
  - Filter by platform (Windows/Android).
- [ ] **Analytics Engine (`/admin/analytics`)**:
  - Total downloads, Windows/Android breakdown, and time-series metrics reflect real database counts.
- [ ] **Website CMS (`/admin/website`)**:
  - Update WhatsApp number or social channels; changes immediately reflect on the public download section.
- [ ] **Security & Activity (`/admin/security`, `/admin/activity`)**:
  - Current active session is marked.
  - Revoking other sessions or changing password works and logs to `activity_logs`.

---

## 11. Rollback & Disaster Recovery Procedures

### Instant Rollback (Vercel)
If an issue occurs after a deployment:
1. Go to Vercel Project -> **Deployments**.
2. Find the previous stable deployment.
3. Click **...** -> **Promote to Production**. Rollback takes under 5 seconds.

### Database Recovery (Neon)
Neon provides instantaneous point-in-time recovery (PITR):
1. In Neon Console, go to **Branches**.
2. Create a branch restored to a specific timestamp prior to the incident.
3. Update `DATABASE_URL` in Vercel to point to the restored branch if needed.

---

## 12. Security & Maintenance Summary

- **Secrets**: Never stored in repository code or client bundles.
- **Connection Limits**: Lambda pool is configured to `max: 1` to work synergistically with Neon's connection pooler.
- **Passwords**: Never plaintext; hashed with bcrypt (cost factor 12).
- **Session Tokens**: SHA-256 hashed before storage; raw tokens only transmitted in `HttpOnly` cookies.
- **Audit Logs**: All admin mutations (login, password change, release publish, download toggle, session revocation) are immutably logged with IP and User-Agent.

