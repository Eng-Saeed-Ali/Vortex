# 🌪️ Vortex Pipeline

> An Enterprise-Grade B2B Data Processing & Enrichment Pipeline.

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

## 📖 Overview
Vortex is a highly scalable, idempotent backend pipeline designed to ingest, cleanse, normalize, deduplicate, and enrich B2B leads data. It is built using **Clean Architecture** principles and leverages message queues to handle heavy background processing asynchronously.

## 🏗️ System Architecture
The pipeline consists of 7 isolated processing layers:
1. **Ingestion Layer:** REST API with strict DTO validation and idempotency checks.
2. **Cleansing Layer:** XSS sanitization, null-stripping, and Unicode normalization.
3. **Normalization Layer:** Phone formatting (Strict E.164) and Arabic text standardization.
4. **Deduplication Layer:** Fuzzy matching and Master Lead merging using Prisma Transactions.
5. **Enrichment Layer:** Headless browser scraping (Playwright) for deep data discovery.
6. **Validation Layer:** Live SMTP verification and proxy rotation.
7. **Storage Layer:** PostgreSQL with PostGIS for spatial data and pgcrypto for AES-256-GCM encryption.

## 🛠️ Tech Stack
- **Framework:** Node.js, NestJS (Strict TypeScript)
- **Database:** PostgreSQL (with `PostGIS` & `pgcrypto` extensions)
- **ORM:** Prisma
- **Message Broker:** Redis + BullMQ (9 distinct queues)
- **Scraping:** Playwright Stealth (Containerized)
- **Infrastructure:** Docker & Docker Compose
- **Logging:** Winston + ECS Format (Elasticsearch compatible)

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (v20+)

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/Eng-Saeed-Ali/Vortex.git](https://github.com/Eng-Saeed-Ali/Vortex.git)
   cd Vortex
