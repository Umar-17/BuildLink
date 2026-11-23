<div align="center">

# BuildLink

**Next-Generation Infrastructure & Home Services Network**

A unified digital platform connecting clients with verified trade specialists, local hardware supply stores, and on-demand delivery couriers.

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Cloud-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)

</div>

---

## 🌟 Overview

**BuildLink** bridges the gap between home and commercial project execution. It provides a multi-role architecture where a single user account can operate as a **Client**, **Trade Specialist**, **Store Merchant**, or **Delivery Courier** without logging out.

### Core Pillars
* **Direct Hire & Open Bidding:** Hire individual verified plumbers, electricians, carpenters, painters, and masons directly, or post open projects for competitive proposals.
* **Local Supply Store Sourcing:** Browse live inventories from nearby hardware outlets with operating hours and instant courier dispatch.
* **Courier Fulfillment:** On-demand delivery dispatch connecting supply stores with active project sites.
* **Verified Reviews:** Anti-fraud review mechanism ensuring only completed contracts and verified deliveries can publish ratings.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19, Server Actions |
| **Styling** | Tailwind CSS v4, Google Fonts (*Plus Jakarta Sans*, *Inter*, *JetBrains Mono*) |
| **Icons** | Lucide React (Monochrome vectors) |
| **Database & ORM** | PostgreSQL (Neon Serverless), Prisma ORM v7 |
| **Authentication** | Cryptographic session cookies via `jose` (JWT) + `bcryptjs` password hashing |

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/your-username/buildlink.git
cd buildlink
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the template and configure your connection strings:
```bash
cp .env.example .env
```

Set the following in `.env`:
* `DATABASE_URL`: PostgreSQL connection string (Neon, Supabase, or local).
* `SESSION_SECRET`: Random string (min 16 chars) for cookie signing.
* `ADMIN_EMAIL` & `ADMIN_PASSWORD`: Optional initial admin credentials.

### 4. Database initialization & seed
```bash
npx prisma generate
npm run db:seed
```

### 5. Start development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Multi-Role Ecosystem

* **Customer / Client:** Direct project booking, bidding broadcast, supply orders, job completion confirmation, and verified reviews.
* **Trade Specialist:** Direct contract inbox, trade bidding board with proposals, profile management, and verified client testimonials.
* **Store Merchant:** Custom catalog categories, inventory item pricing, operating hours, and order pickup prep.
* **Delivery Courier:** Live dispatch board, atomic order claiming, and real-time site fulfillment.
* **Administrator:** Network KPI metrics, incident dispute moderation, and account suspension controls.

---

## 📦 Production Deployment

BuildLink is pre-configured for instant zero-configuration deployment on **Vercel**:
1. Push your repository to GitHub.
2. Import the project on [Vercel](https://vercel.com).
3. Add `DATABASE_URL` and `SESSION_SECRET` in **Environment Variables**.
4. Deploy!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
