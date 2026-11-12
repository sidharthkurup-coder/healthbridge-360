# HEALTHBRIDGE 360
### Integrated Community Healthcare and Essential Services Platform

**Competition:** Socialthon 2026 — Round 3  
**Location:** Kantheru, Guntur District, Andhra Pradesh, India  
**Team:** Ctrl Alt Defeat  

---

## 1. Executive Product Overview

**HEALTHBRIDGE 360** is a unified public health and essential community operations platform engineered specifically for **Kantheru Gram Panchayat**, Andhra Pradesh. It consolidates six traditionally fragmented municipal and healthcare services into a single operational system.

The platform serves six stakeholder groups:
1. **Residents** (telephonic & online appointments, emergency requests, civic hazard reporting)
2. **Healthcare Staff** (Kantheru PHC & Tadikonda CHC medical officers, OPD triage, health camps)
3. **Medicine Inventory Staff** (pharmacists managing Essential Drug Lists with First-Expired-First-Out logic)
4. **Emergency Coordinators** (108 ambulance dispatch, hospital ICU/oxygen availability, live triage)
5. **Water & Sanitation Officers** (dedicated 5-section water distribution, BIS 10500 laboratory testing, civic desilting crews)
6. **Panchayat Administrators** (governance, RBAC permissions, audit logs, community intelligence)

---

## 2. The Six Interconnected Service Modules

### Module 1 — Healthcare Access
- **Health-Centre Directory:** Kantheru Primary Health Centre (PHC) and Community Health Centre (CHC) Tadikonda with operating hours, casualty desks, and service lists.
- **Doctor Profiles & OPD Schedules:** Days of duty, time slots, and specializations (General Medicine, Pediatrics, Obstetrics & Gynecology, AYUSH).
- **Appointment Request System:** Resident submits consultation request with priority level (`NORMAL`, `URGENT`, `SENIOR_CITIZEN`, `MATERNAL`).
- **Staff Approval & Rescheduling:** Healthcare staff review submissions, approve slots, reschedule with dates/notes, or mark completed.
- **Health Camp Announcements & Registration:** Free Non-Communicable Diseases (NCD) and pediatric screening camps with digital seat reservation.

### Module 2 — Medicine Management
- **Authentic Inventory System:** Search by brand or generic name, strength, category, and form.
- **Batch Tracking & Independent Accounting:** Each consignment batch tracks manufacturing date, supplier, and expiration.
- **Algorithmic FEFO Stock Deduction:** Automatically dispenses units from the batch closest to expiry while strictly quarantining expired units.
- **Zero Negative Balance Guarantee:** Stock deduction is atomic (`prisma.$transaction`) and rejects any request exceeding unexpired inventory.
- **Safety Threshold & Expiry Alerts:** Triggers automatic notifications when stock falls below configured minimum limits.
- **Audit Ledger:** Complete immutable history of all receipts, dispensations, and adjustments.
- *Strict Clinical Policy: Never provides automated prescriptions or dosage recommendations.*

### Module 3 — Emergency Assistance
- **Direct Emergency Hotlines:** High-visibility click-to-call buttons for **108 Ambulance Dispatch**, **104 Health Helpline**, Kantheru PHC 24/7 Desk (`+91 863 2234101`), Police (`100`), and Fire (`101`).
- **Hospital & Facility Directory:** Live ICU beds, oxygen availability, blood bank status, and distance (GGH Guntur, AIIMS Mangalagiri, CHC Tadikonda, Kantheru PHC).
- **Ambulance Fleet Tracker:** Stationed ALS & BLS vehicles with driver contacts and availability states (`AVAILABLE`, `ON_DUTY`).
- **Emergency Incident Submission:** Optional device GPS acquisition with explicit resident consent.
- **Coordinator Dashboard & Status Stepper:** 
  `SUBMITTED` → `ACKNOWLEDGED` → `CONTACTED` → `DISPATCHED` → `RESOLVED` (also `UNAVAILABLE` and `CANCELLED`).
- *Disclaimer: A website request is never represented as an automatically dispatched ambulance; phone calling is emphasized as primary.*

### Module 4 — Water Management
- **Dedicated Five-Section Interface:**
  - **Section 1:** North Kantheru (Old Village Core & Pedda Bazar)
  - **Section 2:** South Kantheru (Ramalayam & BC Colony)
  - **Section 3:** East Kantheru (SC Colony & ZP High School)
  - **Section 4:** West Kantheru (Bypass Road & Extension)
  - **Section 5:** Central Kantheru (Gram Panchayat Office & PHC)
- **Section Distribution Schedules & Supply Logs:** Daily start/end times, pumped volume (KL), duration, flow rate (Lpm), pressure (Bar), and interruption records.
- **Laboratory Water-Quality Test History:** Certified reports measuring individual parameters:
  - **Sodium (mg/L)** — WHO guideline ≤ 200 mg/L
  - **Fluoride (mg/L)** — Permissible limit ≤ 1.0 mg/L (Critical in Guntur groundwater basin)
  - **pH** — Neutrality range 6.5 to 8.5
  - **Total Dissolved Solids (TDS)** — Acceptable limit ≤ 500 ppm
  - **Microbial Coliform (CFU/100ml)** — Zero tolerance (0 CFU required for potable water)
- **Scientific Integrity Rules:**
  - *Never infers Sodium or Fluoride concentrations from TDS.*
  - *Never invents test results or declares water safe from incomplete data.*
- **Five-Section Comparison Dashboard:** Evaluates volume, average duration, flow rate, pressure, and interruption rate while distinguishing missing telemetry sensors from zero values.

### Module 5 — Sanitation Management
- **Civic Hazard Reporting:** Residents report Sewage Overflow, Blocked Drainage, Stagnant Wastewater, Improper Waste Disposal, Unhygienic Public Areas, or Suspected Water Contamination.
- **Deterministic Explainable Priority Engine:** Every complaint is scored (0-100) using transparent, deterministic rules:
  - Base public health weight (Water Contamination: 45 pts, Sewage: 35 pts, Stagnant Water: 25 pts, etc.)
  - Household impact multiplier (up to 25 pts)
  - Unresolved aging escalation (2.5 pts per 24 hours unresolved, up to 15 pts)
  - Prior recurrence penalty (reopening boost up to 15 pts)
  - Proximity to schools, Anganwadis, or drinking water cisterns (+10 pts)
  - Auto-escalation: Suspected water contamination is automatically flagged as **CRITICAL**.
- **Field Crew Workflow:** `SUBMITTED` → `UNDER REVIEW` → `ASSIGNED` → `IN PROGRESS` → `RESOLVED`.
- **Resident Reopen Workflow:** If a complaint is closed prematurely or recurs, residents can reopen it with a mandatory reason, applying mathematical penalty points and re-escalating the ticket to officers.

### Module 6 — Community Intelligence
- **Unified Operational Command Dashboard:** Aggregates live records from all five modules via direct database queries.
- **Resolution Analytics Engine:**
  - Average time from submission to acknowledgement (hours).
  - Average time from assignment to resolution (hours).
  - Average lifecycle turnaround (hours).
  - Pending issue age and backlog distribution.
  - Reopened recurrence rate.
  - Overall resolution percentage.
  - *Excludes unresolved cases from completed turnaround averages.*
- **Cross-Section Comparison & Category Trends:** Recurring categories, five-section water deliveries, and clinic OPD demand.

---

## 3. Technology Stack & Architecture

- **Frontend:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Lucide React icons.
- **Backend:** Next.js Server Components, Server Actions & API Route Handlers with Zod validation.
- **Database & ORM:** SQLite (`dev.db`) with Prisma ORM 5.22. Zero external daemon dependencies; fully self-contained on Windows and Linux.
- **Authentication & Security:** Bcrypt password hashing, signed cryptographic session tokens (`jose`), and server-enforced role permissions.
- **Testing:** Vitest for mathematical algorithm testing and end-to-end integration workflows.

---

## 4. Pre-Seeded Demonstration Accounts

For the Socialthon 2026 jury and evaluation team, HEALTHBRIDGE 360 includes pre-seeded accounts covering all six operational roles. You can log in using credentials or click the **"Test Roles"** 1-click switcher on `/login`:

| Role | Name | Email | Password | Primary Scope |
|---|---|---|---|---|
| **Administrator** | Smt. K. Bhavani | `admin@healthbridge360.in` | `Password@123` | Panchayat governance, user roles, audit trail |
| **Resident** | Venkata Ramana | `resident@healthbridge360.in` | `Password@123` | OPD booking, water schedules, sanitation reports |
| **Healthcare Staff** | Dr. P. Sandeep Kumar | `doctor.phc@healthbridge360.in` | `Password@123` | Doctor OPD queue, camp management |
| **Medicine Staff** | M. Lakshmi | `medicine.staff@healthbridge360.in` | `Password@123` | FEFO medicine dispensing, batch receipts |
| **Emergency Coord.** | K. Rajesh | `emergency.coord@healthbridge360.in` | `Password@123` | 108 ambulance dispatch, hospital ICU tracking |
| **Water & Sanitation** | G. Suresh Babu | `water.officer@healthbridge360.in` | `Password@123` | 5-section supply logs, lab report verification |

---

## 5. How to Run the Application

### Prerequisites
- Node.js 18+ or 20+ (Node v24 supported)
- npm or pnpm

### Quick Start
```bash
# 1. Navigate to the project directory
cd healthbridge-360

# 2. Install dependencies (if not already installed)
npm install

# 3. Synchronize database schema and seed Kantheru records
npx prisma db push
node prisma/seed.js

# 4. Run automated test suites (22/22 tests passing)
npm test

# 5. Build for production (verifies 0 TypeScript/build errors)
npm run build

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 6. Verification & Test Evidence

All 22 unit and integration test cases across 5 test suites pass:
1. `src/lib/algorithms/__tests__/medicine-inventory.test.ts` (6 tests)
2. `src/lib/algorithms/__tests__/water-distribution.test.ts` (6 tests)
3. `src/lib/algorithms/__tests__/complaint-prioritization.test.ts` (4 tests)
4. `src/lib/algorithms/__tests__/resolution-analytics.test.ts` (2 tests)
5. `src/lib/algorithms/__tests__/integration-workflows.test.ts` (4 tests)

Production build output:
```
Route (app)                              Size     First Load JS
┌ ƒ /                                    177 B          96.1 kB
├ ○ /admin                               5.67 kB        92.9 kB
├ ƒ /dashboard                           177 B          96.1 kB
├ ○ /emergency                           8.56 kB        95.8 kB
├ ○ /healthcare                          10 kB          97.3 kB
├ ○ /intelligence                        6.07 kB        93.3 kB
├ ○ /login                               5.48 kB         101 kB
├ ○ /medicines                           8.04 kB        95.3 kB
├ ○ /register                            3.85 kB        99.8 kB
├ ○ /sanitation                          8.76 kB          96 kB
└ ○ /water                               9.4 kB         96.7 kB
```
*Zero compilation errors. Zero lint errors. All routes compiled and optimized.*
