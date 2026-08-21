# Ria Hairline — Full-Stack E-commerce Platform

A MERN (MongoDB, Express, React, Node.js) e-commerce app for a hairline products store, written in TypeScript. It is split into three independent deployable folders that share a single backend:

| Folder              | Purpose                     | Port |
| ------------------- | --------------------------- | ---- |
| `backend/`          | Express + TypeScript REST API | 5000 |
| `frontend/`         | Customer storefront (Vite)  | 5173 |
| `admin-dashboard/`  | Admin/manager panel (Vite)  | 5174 |

## Features

- **Auth**: email/password (JWT, bcrypt), optional Google OAuth (via Google Identity Services), role-based access (`user` / `manager` / `admin`).
- **Products**: 1–4 multi-angle images uploaded to Cloudinary, categories, search, hidden/unpublished toggle, stock tracking with decrement on paid orders.
- **Reviews**: customers review products; admin approves/rejects; average rating recalculated.
- **Orders**: checkout from saved addresses; payment via **Paystack**. Orders are persisted server-side **only after** the HMAC-signed webhook confirms the payment — the redirect page just signals the order is in process (no client-side manual verification).
- **Transactions**: every payment attempt is recorded; the admin **Transactions** page shows the full log plus the cumulative total for accurate tracking.
- **Users**: profile, change password, multiple saved addresses.
- **Admin dashboard**: stats, product management (create/edit/images), orders status updates, user role/active management, review moderation.

## Prerequisites

- Node.js 18+ (built with Node 24)
- MongoDB running locally (`mongodb://127.0.0.1:27017`)
- Cloudinary account (for product images)
- Paystack test keys
- A Google OAuth Client (optional, for Google login)

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Fill `.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/ria_hairline
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
PORT=5000
```

### 2. Frontend (storefront)

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api (and optional VITE_GOOGLE_CLIENT_ID)
npm run dev
```

### 3. Admin dashboard

```bash
cd admin-dashboard
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm run dev            # http://localhost:5174
```

## Creating the first admin

Start the backend, then insert an admin directly (bcrypt-hashed), or register normally via the storefront and promote the role:

```js
// mongosh
use ria_hairline
db.users.updateOne(
  { email: "you@example.com" },
  { $set: { role: "admin" } }
)
```

The admin dashboard only grants access to `admin`/`manager` roles.

## Scripts

- `backend`: `npm run dev` (ts-node-dev), `npm run build`, `npm run typecheck`, `npm run start`
- `frontend` / `admin-dashboard`: `npm run dev`, `npm run build`, `npm run lint`

## API overview (`/api`)

- `POST /auth/register`, `/auth/login`, `/auth/google`, `GET /auth/me`, `POST /auth/logout`, `PATCH /auth/change-password`
- `GET|POST /products`, `GET /products/:id` (public), `GET|POST /products/admin/all`, `PATCH|DELETE /products/admin/:id` (admin)
- `POST /reviews`, `PATCH|DELETE /reviews/:id`, `GET /reviews/admin` (+ approve/reject)
- `GET /orders/my`, `POST /orders`, `GET /orders/:id`, `PATCH /orders/admin/:id/status`
- `POST /payments/initialize`, `GET /payments/verify/:reference`, `POST /payments/webhook` (public, raw body)
- `GET|PATCH /users/me`, address CRUD under `/users/me/addresses`, admin user management + `/users/admin/stats`