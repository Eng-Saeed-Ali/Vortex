# 🌪️ Vortex Pipeline

> An Enterprise-Grade B2B Data Processing, Deduplication, & Enrichment Pipeline.

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

## 📖 Executive Summary
Vortex is an event-driven, highly scalable data refinery. It transforms raw, messy B2B leads (containing HTML tags, unstructured addresses, and inconsistent phone numbers) into clean, unified, and highly enriched profiles ready for CRM ingestion or analytics. Built strictly on **Clean Architecture** principles.

## ✨ Core Capabilities (The Problem It Solves)
- **🧹 Deep Cleansing:** Automatically sanitizes XSS payloads, strips HTML/JS tags, and removes null/empty values recursively with request-scoped correlation ID propagation.
- **🌍 Smart Normalization:**
  - Standardizes global phone numbers to strict **E.164** format using `google-libphonenumber`.
  - Normalizes **Arabic text** (NFKC, Tatweel removal, diacritic stripping) for accurate full-text search.
- **🧠 Intelligent Deduplication & Merging:**
  - Uses an exact match hierarchy (Google Place ID → OSM ID → Phone/Email) followed by a blocking strategy to limit candidate pools.
  - Applies advanced Fuzzy Matching (Jaro-Winkler > 0.85) via `pg_trgm` to merge duplicate companies inside atomic **Prisma Transactions**.
  - Features **Provenance Tracking** (`mergedSources`) and multi-tiered **Quality Scoring** (`low`, `medium`, `high`, `premium`).
- **🕵️‍♂️ Headless Enrichment:** Uses a containerized Playwright Stealth worker to scrape targeted websites for tech-stacks, social links, and emails.
- **🔒 Enterprise Security & Auditing:** Encrypts PII at rest using `AES-256-GCM` via `pgcrypto`. Features automated **Audit Logging** for every single destructive merge decision to maintain full data lineage.

## 🏗️ 7-Layer Architecture
The system operates through 9 isolated Redis/BullMQ queues, moving data through the following lifecycle:
1. **Ingestion API:** REST endpoint with strict DTO validation, Swagger docs, and source-level idempotency (409 Conflict handling).
2. **Cleansing Worker:** Sanitization, tag stripping, and object-graph flattening.
3. **Normalization Worker:** Parsing addresses into structural components, phone localization, and Arabic text indexing.
4. **Deduplication Worker:** Exact and fuzzy merging to Master Leads with automated audit updates.
5. **Enrichment Worker:** Playwright-based background data discovery.
6. **Validation Worker:** Real-time SMTP and DNS checks.
7. **Storage Layer:** PostgreSQL powered by PostGIS (for spatial data) and automated TTL re-enrichment crons.

## 🛠️ Tech Stack & Tooling
- **Core:** Node.js (v20), NestJS (Strict TypeScript)
- **Database:** PostgreSQL 16 + PostGIS + pgcrypto
- **Message Broker:** Redis 7 + BullMQ (Concurrency controlled processing)
- **Scraping Engine:** Playwright Stealth
- **Observability:** Winston + Elastic Common Schema (ECS) + Request-scoped Correlation IDs
- **Testing:** Jest, `@testcontainers/postgresql`, `@testcontainers/redis` (Full E2E automation)

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose V2

### Bootstrapping the Pipeline
1. Clone the repository:
   ```bash
   git clone [https://github.com/Eng-Saeed-Ali/Vortex.git](https://github.com/Eng-Saeed-Ali/Vortex.git)
   cd Vortex
   ```
2. Prepare the environment:
   ```bash
   cp .env.example .env
   ```
3. Spin up the infrastructure (DB & Cache):
   ```bash
   docker compose up -d postgres redis
   ```
4. Run migrations & generate Prisma client:
   ```bash
   npx prisma migrate dev
   ```
5. Start the pipeline (Development mode):
   ```bash
   npm run start:dev
   ```

## 🧪 Testing
The project uses Testcontainers to spin up ephemeral Docker instances for true Integration/E2E testing without mocking the database. This verifies idempotency, fuzzy merging, pipeline flow, and audit logging.

```bash
npm run test:e2e
```

## 📄 License
This project is licensed under the MIT License.