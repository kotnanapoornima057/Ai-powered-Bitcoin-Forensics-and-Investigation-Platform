# Bitcoin Forensics Backend

Node.js + PostgreSQL backend for the offline Bitcoin Forensics investigation console.

## Setup
1. In pgAdmin create/use database `bitcoin_forensics`.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL`, for example:
   `postgresql://postgres:YOUR_PASSWORD@localhost:5432/bitcoin_forensics`
4. Run `npm install`.
5. Run `npm run dev`.

The server checks PostgreSQL and creates the schema automatically.

API: http://localhost:5000/api

Endpoints:
- POST /auth/register
- POST /auth/login
- GET /auth/me
- GET /dashboard/summary
- GET /dashboard/transactions
- POST /datasets/upload (multipart field: file; CSV/JSON/XML)
- GET /datasets
- GET /wallets
- GET /wallets/:address
- GET /wallets/:address/transactions
- GET /wallets/:address/graph
- GET /alerts
- GET /alerts/:id
- GET /entities
- GET /graph

The ML layer is a dependency-free Isolation Forest implementation. Wallet behavioral features include transaction count, transaction velocity, amounts, IP correlation, counterparties, timing span and value variation. The backend returns anomaly score, risk score, confidence and feature-based explanations.

The application is designed for local/offline operation: no live Bitcoin API or cloud service is required.

Optional offline GeoIP enrichment uses a local CSV configured by `GEOIP_DB_PATH`.
The file format is `network,country,asn`, for example:

```csv
network,country,asn
8.8.8.0/24,US,AS15169
```

Values supplied directly in an uploaded dataset take precedence over lookup values.
