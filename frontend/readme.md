# PharmaLogs - Drug Side-Effect Risk Assessment Platform

## Capstone Project - Clark University

---

## Project Overview

PharmaLogs is a web-based platform designed to help healthcare professionals make safer prescribing decisions by providing patient-specific drug risk information. The system leverages a comprehensive drug database (scraped from Drugs.com) and offers analytics, risk assessment, and patient management features. The project is built using React.js (frontend), Node.js with Express (backend), and PostgreSQL (database).

---

## Table of Contents

1. [Project Background](#project-background)
2. [Project Scope](#project-scope)
3. [Project Plan & Sprints](#project-plan--sprints)
4. [Technical Features](#technical-features)
5. [Project Organization](#project-organization)
6. [Project Budget](#project-budget)
7. [Appendix: Database Structure & Permissions](#appendix-database-structure--permissions)
8. [Sprint Action Items](#sprint-action-items)

---

## Project Background

- **Problem:** Adverse drug reactions cause significant harm and cost in healthcare. Current systems are fragmented and not patient-specific.
- **Solution:** pharmalogs provides a unified, patient-tailored risk assessment tool for drug side effects and interactions, improving safety and workflow.
- **Stakeholders:** Capstone advisor, team members, simulated healthcare users.

---

## Project Scope

- **Objectives:**
  1.  Drug Side Effects Analysis Engine
  2.  Drug Combination Risk Checker
  3.  Patient Records & Risk Tracking
  4.  Analytics Dashboard
  5.  Role-Based Access & Security
- **Out of Scope:** Real patient data, HIPAA certification, hospital system integration, mobile apps, etc.

---

## Project Plan & Sprints

| Sprint | Dates          | Focus                                     |
| ------ | -------------- | ----------------------------------------- |
| 1      | Feb 18 - Mar 7 | Foundation: Setup, DB, scraping, basic UI |
| 2      | Mar 8 - Mar 24 | Core Features: Side effects, risk engine  |
| 3      | Mar 25 - Apr 7 | Patient features, dashboard, analytics    |
| 4      | Apr 8 - Apr 22 | Polish: Testing, deployment, docs         |

---

## Technical Features

- Drug search and side effect risk classification
- Drug interaction detection
- Patient management (manual & PDF upload)
- Analytics dashboard (charts, trends, insights)
- Role-based access (Doctor, Nurse, Admin)
- Secure authentication (JWT)

---

## Project Organization

- **Arjun Vasu:** Backend, data scraping, risk engine, deployment
- **Uranbileg Enkhjargal:** Frontend, patient management, dashboard, auth UI
- **Both:** Documentation, integration, testing

---

## Project Budget

- **Estimated:** $45 - $60 (mainly domain, minor hosting, contingency)
- **Time Investment:** ~180-216 hours (combined)

---

## Appendix: Database Structure & Permissions

- See project charter for detailed table schemas and user role permissions.

---

## Sprint Action Items

### Sprint 1: Foundation (Feb 18 - Mar 7)

**Backend:**

- [ ] Project repo setup and environment config
- [ ] Design and implement PostgreSQL schema
- [ ] Develop web scraper for Drugs.com
- [ ] Clean and import scraped data into DB
- [ ] Set up Express server and basic API structure

**Frontend:**

- [ ] Initialize React project and folder structure
- [ ] Implement basic UI framework and navigation
- [ ] Connect frontend to backend API (test connection)
- [ ] Set up authentication UI (login/register forms)

---

### Sprint 2: Core Drug Safety Features (Mar 8 - Mar 24)

**Backend:**

- [ ] Side effect parsing and structuring logic
- [ ] Risk classification algorithm (High/Medium/Low)
- [ ] Drug search API endpoints
- [ ] Drug interaction detection logic

**Frontend:**

- [ ] Drug search interface (search bar, results display)
- [ ] Side effect risk visualization (color coding)
- [ ] Interaction alert UI components

---

### Sprint 3: Patient Management & Analytics (Mar 25 - Apr 7)

**Backend:**

- [ ] PDF parser for patient records
- [ ] Patient CRUD API (demographics, history, meds)
- [ ] Medication timeline and ADR tracking endpoints
- [ ] Analytics/statistics API endpoints

**Frontend:**

- [ ] Patient registration (manual entry form)
- [ ] PDF upload and parsing UI
- [ ] Medication timeline visualization
- [ ] ADR history tracking UI
- [ ] Analytics dashboard (charts, quick insights)

---

### Sprint 4: Finalization (Apr 8 - Apr 22)

**Backend:**

- [ ] Integration testing (API + DB + frontend)
- [ ] Bug fixes and performance tuning
- [ ] Prepare deployment scripts (AWS/Cloudflare)
- [ ] Audit trail and logging

**Frontend:**

- [ ] UI polish and bug fixes
- [ ] User guide and documentation
- [ ] Final presentation prep
- [ ] Test accounts for all roles

---
