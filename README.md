# 🏋️‍♂️ PulseForge Gym OS — Gym & Fitness Management System

> **Brolf Tech Remote Internship Challenge 2026 — Project 1 Submission**  
> A full-stack, role-restricted Gym Operations, Member Intelligence, and Safe AI Coaching platform built with **React 18, TypeScript, Vite, Tailwind CSS, Supabase PostgreSQL, and Google Gemini AI**.

---

## 📌 1. Executive Overview & Problem Solved

Fitness centers in Ethiopia and emerging markets frequently rely on fragmented spreadsheets or paper ledgers to track member subscriptions, front-desk check-ins, trainer routines, and equipment maintenance. This leads to revenue leakage from expired memberships, overcrowded classes, unmonitored machine faults, and generic workout plans.

**PulseForge Gym OS** solves this with a unified, real-time cloud platform that connects **4 distinct user roles** (`Admin`, `Reception`, `Trainer`, and `Member`) over an **11-table PostgreSQL relational database**, localized for Ethiopian payment channels (**Telebirr** and **CBE Birr**) and enhanced with a **domain-locked Google Gemini AI Fitness Coach** featuring pre-flight clinical injury guardrails.

---

## ✨ 2. Core Features & Business Logic Guardrails

### 🔐 Authentication & Strict Role-Based Access Control (RBAC)
* **Dual Evaluation Architecture:**
  * **Real Supabase JWT Authentication:** Users signing in via email/password (or the 1-click Real Auth Role Testers) are strictly locked to their assigned role in `public.profiles`. Navigation tabs, actions, and member identity selectors are isolated per role.
  * **1-Click Evaluator Sandbox Mode:** Allows Brolf Tech judges to seamlessly switch between `Admin`, `Reception`, `Trainer`, and `Member` views to inspect the entire system without re-entering credentials.
* **Automated Database Triggers:** PostgreSQL `SECURITY DEFINER` triggers auto-confirm accounts on signup, create linked `profiles` records, and automatically bind `member` accounts to their corresponding `members` table pass via email matching.

### 📊 Executive Admin Command Center
* **Live PostgreSQL Telemetry:** Real-time KPI cards tracking Active Members, Expiring/Expired Subscriptions, Total Revenue (ETB), and Equipment Readiness.
* **Visual Analytics (Recharts):** Bar and Area charts visualizing revenue distribution across **Telebirr**, **CBE Birr**, **Cash**, and **Card**, alongside weekly gym floor occupancy trends.
* **1-Click Subscription Renewal Watchlist:** Identifies `Expiring Soon` and `Expired` members and processes instant +30-day extensions while logging invoices to `public.payments` and dispatching system alerts.

### 📲 Reception QR Check-In Terminal
* **Instant Pass Verification:** Validates member QR codes (`PF-1001`, etc.) against live subscription status.
* **Access Guardrails:** Immediately blocks `Expired` members with a red alert banner while granting entry to `Active` and `Expiring Soon` passes.
* **Anti-Streak-Farming Protection:** Detects if a member has already checked in on the current calendar day—permitting re-entry without logging duplicate attendance rows or artificially inflating `streak_days`.

### 👥 Member Directory & Billing CRM
* **Sequential QR Code Generator:** Automatically assigns clean sequential member codes (`PF-1007`, `PF-1008`) upon walk-in registration.
* **Duplicate Prevention:** Validates unique email and phone numbers before inserting new members and automatically logs their initial subscription invoice.

### 🏋️ Trainer Roster & JSONB Workout Builder
* **PostgreSQL JSONB Storage:** Coaches author structured multi-exercise routines (`name`, `sets`, `reps`, `rest`, `completed`) stored directly in a PostgreSQL `JSONB` column (`workout_plans.exercises`).
* **Smart Upsert Logic:** Updating a routine with the same program title for a member updates their existing plan rather than creating duplicate entries.

### 📅 Group Class Timetable & Capacity Enforcement
* **1-Spot-Per-Member Validation:** Prevents any member from double-booking the same class.
* **Subscription Verification:** Automatically blocks `Expired` members from reserving studio spots.
* **Live Unenroll & Capacity Reset:** Enrolled members can cancel their reservation in 1 click to free up capacity, and staff can reset class capacities at the end of a cycle.

### 🛠️ Equipment Telemetry & Maintenance Tracker
* **Mechanical Health Scoring (0–100%):** Tracks equipment across gym zones (`Cardio Deck`, `Free Weights`, `Strength Zone`).
* **Automated Fault Escalation:** Marking any station as `Out of Order` updates technician service notes and automatically dispatches a high-priority `maintenance` alert to the Admin notification bell.

### 🪪 Member Self-Service Portal & Digital QR Pass
* **Scannable Vector QR Pass (`qrcode.react`):** Displays the member's live tier badge (`VIP`/`Pro`/`Basic`), active streak, enrolled class count, and validity date.
* **Interactive JSONB Workout Checklist:** Members can check off completed exercise sets, persisting state directly back to the PostgreSQL `workout_plans` table.
* **Biometric & Strength PR Logger:** Tracks body weight, Bench Press, and Back Squat personal records over time.

### 🤖 Safe AI Fitness Coach (Google Gemini API + Clinical Guardrails)
* **Live Multi-Turn Gemini Integration:** Powered by Google's low-latency `gemini-3.5-flash-lite` / `gemini-3.8-flash` API with strict system instructions locking the persona to PulseForge Gym operations and Ethiopian sports nutrition.
* **Pre-Flight Clinical & Medical Safety Guardrail:** Intercepts any prompt mentioning acute pain, injury, tears, dizziness, or medical symptoms *before* workout generation—halting exercise advice and directing the member to a licensed physician.
* **Off-Topic Refusal:** Politely declines non-fitness queries (e.g., coding, homework, politics) and redirects users back to their training goals.

### 🔔 Role-Isolated Actionable Notifications
* **Strict `target_role` Filtering:** Each role (`admin`, `reception`, `trainer`, `member`) only sees notifications targeted to their workspace.
* **Deep-Link Navigation:** Clicking any notification automatically marks it as read in Supabase and navigates the user directly to the page where the event occurred.

---

## 🗄️ 3. Database Architecture (11 PostgreSQL Tables)

| # | Table Name | Primary Purpose | Key Columns & Relationships |
| :--- | :--- | :--- | :--- |
| 1 | `profiles` | Role-based user identity linked to `auth.users` | `id (PK, FK)`, `full_name`, `email`, `role (admin/reception/trainer/member)` |
| 2 | `trainers` | Coaching staff roster & specialties | `id (PK)`, `full_name`, `specialty`, `rating`, `experience_years` |
| 3 | `members` | Gym member directory & subscription state | `id (PK)`, `user_id (FK)`, `member_code (UNIQUE)`, `plan_tier`, `status`, `expiry_date`, `streak_days` |
| 4 | `workout_plans` | Custom trainer routines using PostgreSQL JSONB | `id (PK)`, `member_id (FK)`, `trainer_id (FK)`, `title`, `exercises (JSONB)` |
| 5 | `classes` | Group fitness studio timetable & capacity | `id (PK)`, `title`, `trainer_id (FK)`, `schedule_day`, `capacity`, `enrolled_count` |
| 6 | `class_bookings` | Member class reservations | `id (PK)`, `class_id (FK)`, `member_id (FK)`, `booking_status` |
| 7 | `attendance_logs` | Front-desk QR check-in audit trail | `id (PK)`, `member_id (FK)`, `check_in_time`, `check_in_method` |
| 8 | `payments` | Telebirr, CBE Birr, Cash & Card invoices | `id (PK)`, `member_id (FK)`, `invoice_no`, `amount`, `payment_method` |
| 9 | `member_progress` | Member strength PRs & body weight history | `id (PK)`, `member_id (FK)`, `weight_kg`, `bench_press_kg`, `squat_kg` |
| 10 | `equipment` | Gym machine health telemetry & service logs | `id (PK)`, `serial_code (UNIQUE)`, `health_score`, `status`, `notes` |
| 11 | `notifications` | Role-isolated actionable system alerts | `id (PK)`, `target_role`, `title`, `type`, `is_read` |

---

## 🛠️ 4. Technology Stack & Third-Party Libraries

* **Frontend Framework:** React 18 + TypeScript (`.tsx`) + Vite
* **Styling & UI:** Tailwind CSS + Lucide React Icons
* **Backend & Database:** Supabase (PostgreSQL 15, Supabase Auth, Row-Level Security, Pl/pgSQL Triggers)
* **Data Visualization:** Recharts (`BarChart`, `AreaChart`, `ResponsiveContainer`)
* **QR Code Generation:** `qrcode.react` (`QRCodeSVG`)
* **AI / LLM Integration:** Google Gemini REST API (`gemini-3.5-flash-lite` / `gemini-3.8-flash`)

---

## 🚀 5. Local Setup & Installation Instructions

### Prerequisites
* **Node.js** (v18+ recommended) and **npm**
* A **Supabase** project and a **Google Gemini API Key**

### 1. Clone the Repository & Install Dependencies
```bash
git clone <https://github.com/KHALIDKHELIL/pulseforge-gym>
cd pulseforge-gym
npm install