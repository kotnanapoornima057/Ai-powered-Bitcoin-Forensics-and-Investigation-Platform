# Bitcoin Transaction Forensics & Intelligence Platform

## 🔎 Overview

The Bitcoin Transaction Forensics & Intelligence Platform is an offline-first cybersecurity and blockchain analysis system designed to analyze Bitcoin transaction traffic and network metadata, identify unusual wallet behavior, correlate blockchain activity with network activity, generate explainable risk alerts, and visualize relationships between wallets, transactions, IP addresses, countries, and ASNs.

The platform combines blockchain-level information such as transaction IDs, wallet addresses, transaction amounts, and transaction timestamps with network-level information such as source IP, destination IP, source port, destination port, geographic information, and ASN data.

Instead of analyzing these data sources separately, the system creates a unified investigation environment where analysts can upload datasets, process and normalize the data, perform machine-learning-based anomaly detection, investigate suspicious wallets, explore transaction relationships through graphs, review alerts, and export investigation evidence.

The complete system is designed to perform its core processing locally without depending on live blockchain APIs, cloud-based machine-learning services, or external databases.

---

## 🎯 Objectives

The main objectives of the project are:

- Analyze large Bitcoin transaction datasets efficiently.
- Support CSV, JSON, and XML input files.
- Normalize different data formats into a common structure.
- Analyze Bitcoin wallet and transaction behavior.
- Analyze network-level IP, port, and timing information.
- Correlate network activity with blockchain transactions.
- Detect unusual wallet behavior using machine learning.
- Generate explainable risk scores and confidence values.
- Generate prioritized alerts for unusual activity.
- Identify relationships between wallets, transactions, and network entities.
- Visualize relationships using an interactive transaction graph.
- Provide detailed wallet-level investigation.
- Support local GeoIP and ASN enrichment.
- Export alerts, transactions, wallet evidence, and graph data.
- Maintain an offline-first architecture for sensitive forensic analysis.

---

## ✨ Key Features

### 1. Multi-Format Data Ingestion

The platform accepts forensic datasets in:

- CSV
- JSON
- XML

The ingestion pipeline validates uploaded files, detects the input format, extracts the required fields, normalizes the records, and stores the processed information in PostgreSQL.

Supported information includes:

- Timestamp
- Source IP
- Destination IP
- Source Port
- Destination Port
- Transaction ID
- Input Wallet Addresses
- Output Wallet Addresses
- Input Amounts
- Output Amounts
- Country
- ASN

---

### 2. Network Layer Analysis

The network analysis component examines communication-level information such as:

- Source IP addresses
- Destination IP addresses
- Source ports
- Destination ports
- Timestamps
- IP diversity
- Port diversity
- Network activity frequency
- Timing patterns
- Geographic distribution
- ASN distribution

This information can provide additional context around blockchain transactions.

---

### 3. Blockchain Layer Analysis

The blockchain analysis component processes:

- Bitcoin transaction IDs
- Input wallet addresses
- Output wallet addresses
- Input amounts
- Output amounts
- Transaction timestamps
- Wallet relationships
- Transaction frequency
- Transaction volume
- Counterparty relationships

The system converts transaction-level information into wallet-level behavioral information for further analysis.

---

### 4. Network and Blockchain Correlation

One of the major capabilities of the platform is connecting network-layer activity with blockchain-layer activity.

The correlation process can use available information such as:

- Timestamps
- IP addresses
- Network activity
- Transaction IDs
- Wallet addresses
- Transaction relationships

The basic relationship is:

Network Activity → IP / Port / Time → Transaction → TXID → Wallet → Wallet Behavior

This combined analysis provides more context than examining network or blockchain data independently.

---

## 🤖 Machine Learning

The platform uses an unsupervised machine-learning approach based on the Isolation Forest algorithm for anomaly detection.

Isolation Forest is suitable for identifying observations that are statistically different from the normal behavioral patterns within a dataset.

The system first creates wallet-level behavioral feature vectors and then passes those features through the anomaly detection pipeline.

The general process is:

Raw Transactions  
↓  
Wallet Feature Extraction  
↓  
Feature Normalization  
↓  
Isolation Forest  
↓  
Anomaly Score  
↓  
Risk Analysis  
↓  
Explainable Alert

The machine-learning system does not require every transaction to be manually labeled as malicious or legitimate.

---

## 🧮 Behavioral Features

The platform extracts multiple behavioral characteristics from wallet activity.

Important features include:

- Transaction Count – total number of transactions associated with a wallet.
- Input Volume – total value received through transaction inputs.
- Output Volume – total value sent through transaction outputs.
- IP Diversity – number of unique IP addresses associated with activity.
- Port Diversity – number of different network ports observed.
- Counterparty Diversity – number of different wallets interacting with the wallet.
- Address Reuse – frequency of repeated wallet/address relationships.
- Transaction Velocity – rate at which transactions occur.
- Timing Variability – variation in the time intervals between transactions.
- Geographic Diversity – number of different countries associated with observed activity.
- ASN Diversity – number of different autonomous systems associated with observed IPs.

These features provide a numerical representation of wallet behavior for anomaly detection.

---

## 📊 Risk Analysis

Machine-learning results are combined with behavioral indicators to produce an understandable risk assessment.

The analysis can consider:

- ML anomaly score
- Transaction behavior
- Amount behavior
- Transaction velocity
- Address reuse
- IP correlation
- Timing behavior
- IP diversity
- Counterparty diversity
- Geographic diversity
- ASN diversity

The platform displays both the resulting risk information and the factors contributing to it.

For example:

Wallet Risk: 87%

Contributing indicators:

- High transaction velocity
- Unusual transaction amounts
- High IP diversity
- Repeated address relationships
- Unusual transaction timing
- Strong network correlation

A high anomaly or risk score represents unusual behavior within the analyzed dataset and should be treated as an investigation indicator rather than proof of malicious or illegal activity.

---

## 🚨 Alert Generation

The platform generates alerts for wallets or activities that require further investigation.

Each alert can contain:

- Wallet address
- Severity
- Risk score
- Confidence
- Transaction ID
- Detection reason
- Timestamp

Example:

Wallet: bc1qxxxxxxxx  
Severity: HIGH  
Risk Score: 87  
Confidence: 91%

Reason:

Unusual transaction velocity combined with high IP diversity and abnormal transaction behavior.

The Alerts module provides analysts with a centralized location for reviewing and investigating detected anomalies.

---

## 🕸️ Entity Analysis

The platform identifies and connects different types of entities.

Entities include:

- Wallets
- Transactions
- IP addresses
- Countries
- ASNs

Relationships can include:

Wallet → Transaction  
Transaction → Wallet  
Wallet → IP Address  
IP Address → Country  
IP Address → ASN

Entity analysis allows analysts to move from one object to related objects during an investigation.

---

## 🕸️ Transaction Graph

The graph module provides a visual representation of relationships between wallets, transactions, IP addresses, and other entities.

Example relationship:

Wallet A  
↓  
Transaction 1  
↓  
Wallet B  
↓  
Transaction 2  
↓  
Wallet C

Network information can also be connected:

Wallet → IP Address → Country / ASN

The graph can be used to investigate:

- Wallet relationships
- Transaction paths
- Shared infrastructure
- Shared IP addresses
- Counterparty relationships
- Address reuse
- Connected entities
- Suspicious activity clusters

The frontend uses Cytoscape.js for graph visualization.

---

## 👤 Wallet Investigation

The wallet investigation module provides a detailed view of an individual wallet.

### Overview

Displays information such as:

- Wallet address
- Risk score
- Confidence
- Transaction count
- Input volume
- Output volume
- Unique IP addresses
- Counterparties

### Graph

Displays relationships between the selected wallet and other entities.

### Risk Analysis

Displays:

- Machine-learning anomaly information
- Behavioral indicators
- Risk contributors
- Confidence information

### Transactions

Displays transactions associated with the selected wallet.

### Network Activity

Displays:

- IP addresses
- Ports
- Timestamps
- Country
- ASN

### Evidence

Displays supporting transaction and network information related to the investigation.

---

## 📊 Dashboard

The dashboard provides a high-level summary of the analyzed dataset.

Important statistics can include:

- Total Transactions
- Total Wallets
- Suspicious Wallets
- Total Alerts
- Total Entities
- Unique IP Addresses
- Transaction Activity
- Risk Distribution

The dashboard gives analysts a quick overview before moving into detailed investigation pages.

---

## 🗺️ GeoIP and ASN Analysis

The platform supports local IP enrichment using a locally available GeoIP/ASN dataset.

The basic process is:

IP Address  
↓  
Local GeoIP Database  
↓  
Country  
↓  
ASN  
↓  
Behavioral Analysis

This information can be used to calculate geographic and ASN diversity for wallets.

For offline operation, the GeoIP/ASN database can be downloaded beforehand and stored locally.

Example:

backend/data/geoip.csv

Example format:

network,country,asn

1.0.0.0/24,AU,13335  
8.8.8.0/24,US,15169

The GeoIP/ASN dataset used with the project must have a license that permits the intended use and redistribution.

---

## 🔄 Complete Data Processing Pipeline

The complete workflow of the platform is:

Raw CSV / JSON / XML Dataset  
↓  
File Upload  
↓  
File Validation  
↓  
Format Detection  
↓  
Data Parsing  
↓  
Data Normalization  
↓  
Database Storage  
↓  
Network Analysis  
↓  
Blockchain Analysis  
↓  
Network-Blockchain Correlation  
↓  
Wallet Feature Extraction  
↓  
Machine Learning  
↓  
Anomaly Detection  
↓  
Risk Analysis  
↓  
Alert Generation  
↓  
Entity Analysis  
↓  
Graph Construction  
↓  
Wallet Investigation  
↓  
Evidence Review  
↓  
Reports and Export

---

## 🏗️ System Architecture

The project follows a three-layer full-stack architecture.

### Frontend

The frontend is responsible for:

- User interface
- Authentication screens
- Dashboard
- Dataset ingestion
- Alerts
- Entities
- Graph visualization
- Wallet investigation
- Reports
- Settings

### Backend

The backend is responsible for:

- REST APIs
- Authentication
- Dataset processing
- Data validation
- Data normalization
- Database operations
- Network analysis
- Blockchain analysis
- Machine learning
- Risk scoring
- Alert generation
- Graph generation
- Wallet investigation

### Database

PostgreSQL stores:

- Users
- Datasets
- Transactions
- Wallets
- Entities
- Alerts
- Activity information
- Investigation-related data

Architecture:

Frontend  
↓  
React + Vite  
↓  
REST API  
↓  
Node.js + Express  
↓  
PostgreSQL

The machine-learning and forensic analysis processes run locally within the backend environment.

---

## 🛠️ Technology Stack

### Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- Lucide React
- Cytoscape.js

### Backend

- Node.js
- Express.js
- JavaScript

### Database

- PostgreSQL
- pgAdmin

### Machine Learning

- Isolation Forest
- Unsupervised anomaly detection
- Behavioral feature engineering

### Security

- bcrypt
- JSON Web Tokens (JWT)
- Protected routes
- Password hashing

### Data Processing

- CSV parsing
- JSON parsing
- XML parsing
- Data validation
- Data normalization
- Feature extraction

---

## 📁 Project Structure

bitcoin-forensics/

├── README.md

├── backend/  
│   ├── src/  
│   │   ├── config.js  
│   │   ├── server.js  
│   │   ├── db/  
│   │   │   ├── init.js  
│   │   │   ├── pool.js  
│   │   │   └── schema.sql  
│   │   ├── middleware/  
│   │   │   └── auth.js  
│   │   ├── routes/  
│   │   │   ├── alerts.js  
│   │   │   ├── auth.js  
│   │   │   ├── dashboard.js  
│   │   │   ├── datasets.js  
│   │   │   ├── entities.js  
│   │   │   ├── graph.js  
│   │   │   └── wallets.js  
│   │   └── services/  
│   │       ├── analysisService.js  
│   │       ├── geoIpService.js  
│   │       ├── ingestionService.js  
│   │       ├── mlService.js  
│   │       └── parsers.js  
│   ├── sample-data.csv  
│   ├── package.json  
│   └── .env.example

├── frontend/  
│   ├── src/  
│   │   ├── api/  
│   │   ├── components/  
│   │   ├── hooks/  
│   │   ├── pages/  
│   │   ├── App.jsx  
│   │   ├── main.jsx  
│   │   └── index.css  
│   ├── public/  
│   │   └── datasets/  
│   ├── package.json  
│   └── .env.example

└── docs/  
    └── screenshots/

---

## 🗄️ Database

PostgreSQL is used as the main relational database.

The database schema is maintained in:

backend/src/db/schema.sql

The database is responsible for persistent storage of application and forensic analysis data.

Typical logical entities include:

- Users
- Datasets
- Transactions
- Wallets
- Alerts
- Entities
- Activity Logs

The database allows the frontend to retrieve processed analysis results without repeatedly processing the original dataset.

---

## 🔐 Authentication and Security

The platform includes local authentication.

The authentication workflow is:

Register  
↓  
Password Hashing  
↓  
User Storage  
↓  
Login  
↓  
Password Verification  
↓  
JWT Generation  
↓  
Protected API Access

Passwords are hashed using bcrypt.

JWT authentication is used to protect application routes and API requests.

Sensitive information should never be stored directly in source code.

---

## 🔒 Offline-First Design

A major design principle of the platform is offline operation.

The core architecture is:

Local Browser  
↓  
React Frontend  
↓  
Local Express Backend  
↓  
Local PostgreSQL Database  
↓  
Local Machine Learning  
↓  
Local Forensic Analysis

The application does not require continuous internet access for its main analysis workflow.

External reference data such as GeoIP information can be downloaded before analysis and then used locally.

---

## 🔒 Why Offline?

Forensic datasets can contain sensitive information such as:

- IP addresses
- Wallet addresses
- Transaction IDs
- Network activity
- Transaction relationships
- Investigation evidence

An offline architecture provides several advantages:

### Privacy

Sensitive forensic information can remain inside the controlled environment.

### Controlled Investigation Environment

The application can operate in environments where internet connectivity is restricted.

### Evidence Control

Data can be processed locally without automatically sending it to third-party services.

### Reproducibility

The same dataset and configuration can be analyzed repeatedly.

### Reduced External Dependencies

The analysis does not depend on live blockchain APIs, cloud ML services, or external transaction services.

---

## 📥 Dataset Format

A transaction record can contain:

- timestamp
- src_ip
- dst_ip
- src_port
- dst_port
- txid
- input_addresses
- output_addresses
- input_amounts
- output_amounts
- geo_country
- asn

---

## 📄 CSV Example

timestamp,src_ip,dst_ip,src_port,dst_port,txid,input_addresses,output_addresses,input_amounts,output_amounts,geo_country,asn

2026-01-01T10:00:00,192.168.1.10,8.8.8.8,5000,8333,tx001,"walletA","walletB","1.2","1.1","US",15169

2026-01-01T10:05:00,192.168.1.20,8.8.4.4,5001,8333,tx002,"walletB","walletC","2.5","2.3","US",15169

---

## 📄 JSON Example

[
  {
    "timestamp": "2026-01-01T10:00:00",
    "src_ip": "192.168.1.10",
    "dst_ip": "8.8.8.8",
    "src_port": 5000,
    "dst_port": 8333,
    "txid": "tx001",
    "input_addresses": ["walletA"],
    "output_addresses": ["walletB"],
    "input_amounts": [1.2],
    "output_amounts": [1.1],
    "geo_country": "US",
    "asn": 15169
  }
]

---

## 📄 XML Example

<transactions>

    <transaction>

        <timestamp>2026-01-01T10:00:00</timestamp>

        <src_ip>192.168.1.10</src_ip>

        <dst_ip>8.8.8.8</dst_ip>

        <src_port>5000</src_port>

        <dst_port>8333</dst_port>

        <txid>tx001</txid>

        <input_addresses>
            <address>walletA</address>
        </input_addresses>

        <output_addresses>
            <address>walletB</address>
        </output_addresses>

        <input_amounts>
            <amount>1.2</amount>
        </input_amounts>

        <output_amounts>
            <amount>1.1</amount>
        </output_amounts>

        <geo_country>US</geo_country>

        <asn>15169</asn>

    </transaction>

</transactions>

---

## 🚀 Installation

### Prerequisites

Install:

- Node.js 20+
- npm
- PostgreSQL
- Git

Check versions:

node --version

npm --version

psql --version

git --version

---

## 🐘 PostgreSQL Setup

Start PostgreSQL on Ubuntu:

sudo systemctl start postgresql

Open PostgreSQL:

sudo -u postgres psql

Create the database:

CREATE DATABASE bitcoin_forensics;

Exit:

\q

---

## ⚙️ Backend Setup

Navigate to the backend:

cd backend

Install dependencies:

npm install

Create the environment file:

cp .env.example .env

Configure the PostgreSQL credentials in the `.env` file.

Initialize the database:

npm run db:init

Start the backend:

npm run dev

The backend normally runs on:

http://localhost:5000

---

## 💻 Frontend Setup

Open another terminal.

Navigate to the frontend:

cd frontend

Install dependencies:

npm install

Create the environment file:

cp .env.example .env

Start the frontend:

npm run dev

The frontend normally runs on:

http://localhost:5173

---

## 🔧 Environment Variables

Example backend configuration:

PORT=5000

DB_HOST=localhost

DB_PORT=5432

DB_NAME=bitcoin_forensics

DB_USER=postgres

DB_PASSWORD=your_password

JWT_SECRET=your_secret_key

GEOIP_DB_PATH=data/geoip.csv

Example frontend configuration:

VITE_API_BASE_URL=/api

Never commit real passwords, secret keys, API keys, or other credentials.

---

## ▶️ Running the Application

Start PostgreSQL:

sudo systemctl start postgresql

Start the backend:

cd backend

npm run dev

Start the frontend in another terminal:

cd frontend

npm run dev

Then open:

http://localhost:5173

---

## 🔄 Application Workflow

The user workflow is:

1. Register or log in.
2. Open the dashboard.
3. Upload a CSV, JSON, or XML dataset.
4. The system validates the uploaded data.
5. The parser extracts the required fields.
6. The system normalizes the records.
7. Records are stored in PostgreSQL.
8. Network and blockchain information are analyzed.
9. Wallet behavioral features are extracted.
10. Isolation Forest analyzes the feature vectors.
11. Risk indicators are calculated.
12. Suspicious or unusual activity generates alerts.
13. Entities and relationships are constructed.
14. The graph provides visual investigation.
15. Individual wallets can be investigated.
16. Supporting evidence can be reviewed.
17. Investigation information can be exported.

---

## 🔌 API Structure

The backend is organized into REST API modules.

### Authentication

/api/auth

Handles:

- Registration
- Login
- Authentication

### Dashboard

/api/dashboard

Provides:

- Summary statistics
- Transaction statistics
- Wallet statistics
- Alert statistics

### Datasets

/api/datasets

Handles:

- Dataset upload
- Dataset processing
- Dataset information

### Alerts

/api/alerts

Provides:

- Alert information
- Risk information
- Detection reasons

### Entities

/api/entities

Provides:

- Entity information
- Wallet relationships
- Entity analysis

### Graph

/api/graph

Provides:

- Graph nodes
- Graph edges
- Entity relationships

### Wallets

/api/wallets

Provides:

- Wallet overview
- Transactions
- Network activity
- Risk information
- Evidence

---

## 🧪 Testing

The project should be tested at multiple levels.

### Backend Syntax Testing

node --check src/server.js

Individual JavaScript files can also be checked using:

node --check path/to/file.js

### Database Testing

Check PostgreSQL:

sudo systemctl status postgresql

### Frontend Testing

Verify that the frontend loads:

http://localhost:5173

### Dataset Testing

Test the application with:

- Small CSV files
- JSON files
- XML files
- Larger datasets
- Missing fields
- Empty values
- Multiple wallet addresses
- Multiple transaction amounts

### ML Testing

Test with datasets containing:

- Normal wallet behavior
- High transaction frequency
- Unusual transaction amounts
- High IP diversity
- High counterparty diversity
- Repeated addresses
- Unusual timing

---

## 🐧 Linux Setup

The application can be installed on Linux environments such as Ubuntu.

Install required software:

sudo apt update

sudo apt install git nodejs npm postgresql

Clone the repository:

git clone <repository-url>

Enter the project:

cd bitcoin-forensics

Install backend dependencies:

cd backend

npm install

Install frontend dependencies:

cd ../frontend

npm install

### Important

Do not copy `node_modules` from Windows to Linux.

Install dependencies directly on the Linux system:

npm install

This prevents platform-specific dependency and native package problems.

---

## 🔒 Security Considerations

The following information should never be committed to GitHub:

- `.env`
- Database passwords
- JWT secrets
- API keys
- Private credentials
- Sensitive forensic datasets
- `node_modules`

Use `.env.example` to document required environment variables without exposing secrets.

Uploaded forensic data should be stored in controlled directories.

---

## ⚡ Performance Considerations

Performance depends on:

- Number of transactions
- Number of wallets
- Number of IP addresses
- Number of graph relationships
- Database configuration
- Available RAM
- CPU resources
- Dataset size
- ML processing requirements

For larger datasets, future performance improvements can include:

- Batch database insertion
- Database indexing
- Pagination
- Streaming file processing
- Background processing
- Feature caching
- Incremental graph construction
- Dataset partitioning

---

## ⚠️ Limitations

### Data Dependency

The quality of the analysis depends on the quality and completeness of the input dataset.

### Machine Learning Limitations

Isolation Forest identifies statistical anomalies. An anomaly does not automatically mean that the wallet is malicious or involved in illegal activity.

### Correlation Limitations

Network-to-blockchain correlation depends on available metadata and timestamp accuracy.

### GeoIP Limitations

Geographic and ASN results depend on the local GeoIP/ASN database.

### Dataset Limitations

Synthetic datasets are useful for testing but may not accurately represent real-world Bitcoin network behavior.

### Live Monitoring

The current system analyzes supplied datasets rather than continuously monitoring the live Bitcoin network.

### False Positives and False Negatives

Anomaly detection can produce both false positives and false negatives. Results should therefore be reviewed together with the underlying evidence.

---

## 🔮 Future Enhancements

Future versions can include:

### Machine Learning

- DBSCAN
- HDBSCAN
- Autoencoders
- Graph Neural Networks
- Temporal anomaly detection
- Ensemble anomaly detection

### Graph Analytics

- Community detection
- Graph centrality
- Shortest-path analysis
- Temporal graph analysis
- Advanced wallet clustering
- Transaction path analysis

### Correlation

- Advanced temporal correlation
- Network session reconstruction
- Multi-event correlation
- Improved IP-to-wallet correlation

### Investigation

- Case management
- Investigation notes
- Evidence tagging
- Investigation timelines
- Analyst collaboration
- Case history

### Reporting

- PDF report generation
- Automated investigation summaries
- Custom report templates
- Evidence packages

### Scalability

- Streaming ingestion
- Background workers
- Large-scale dataset processing
- Distributed analysis

---

## 🎯 Use Cases

The platform can be used for:

### Blockchain Forensics

Analyze Bitcoin transaction relationships and wallet behavior.

### Cybersecurity Research

Study unusual transaction and network patterns.

### Network Investigation

Correlate network metadata with blockchain activity.

### Wallet Investigation

Examine individual wallets and their related entities.

### Graph Analysis

Explore relationships between wallets, transactions, IP addresses, and other entities.

### Machine Learning Research

Experiment with unsupervised anomaly detection on blockchain transaction behavior.

### Academic Projects

Study the combination of:

- Blockchain
- Cybersecurity
- Machine Learning
- Network Forensics
- Graph Analytics
- Data Engineering

---

## 📷 Screenshots

Recommended screenshots for the repository:

- Login page
- Dashboard
- Dataset ingestion page
- Alerts page
- Entities page
- Graph page
- Wallet investigation page
- Risk analysis page
- Reports page

Store screenshots in:

docs/screenshots/

Example:

![Dashboard](docs/screenshots/dashboard.png)

---

## 🧠 Design Principles

### Offline First

Core processing should not depend on external services.

### Explainable Analysis

Anomaly results should be accompanied by understandable behavioral indicators.

### Modular Architecture

Frontend, backend, database, ingestion, ML, and graph processing are separated into logical modules.

### Reproducibility

The same dataset and configuration should allow the analysis to be repeated.

### Data Privacy

Sensitive forensic information should remain inside the controlled environment whenever possible.

### Human-in-the-Loop

Machine learning provides analytical indicators, while final interpretation should be performed by a human investigator using the available evidence.

---

## 📌 Project Status

### Implemented

- React frontend
- Vite frontend environment
- Node.js backend
- Express REST API
- PostgreSQL database
- User registration
- User login
- JWT authentication
- Password hashing
- Protected routes
- CSV ingestion
- JSON ingestion
- XML ingestion
- Data parsing
- Data normalization
- Transaction analysis
- Wallet analysis
- Network analysis
- Network-blockchain correlation
- Isolation Forest anomaly detection
- Behavioral feature extraction
- Risk analysis
- Explainability indicators
- Alert generation
- Entity analysis
- Graph visualization
- Wallet investigation
- Reports and exports
- Local GeoIP/ASN support

### Planned Improvements

- Larger benchmark datasets
- Extended ML validation
- Advanced entity clustering
- Advanced temporal analysis
- Advanced graph analytics
- PDF report generation
- Case management
- Large-scale performance optimization
- Additional forensic data sources

---





## ⭐ Project Summary

The Bitcoin Transaction Forensics & Intelligence Platform provides a unified offline environment for analyzing Bitcoin transaction and network metadata.

It combines:

Blockchain Analysis  
+  
Network Forensics  
+  
Machine Learning  
+  
Behavioral Analysis  
+  
Risk Scoring  
+  
Explainable Alerts  
+  
Entity Analysis  
+  
Graph Visualization  
+  
Wallet Investigation  
+  
Evidence Reporting

The overall workflow is:

Raw Transaction and Network Data  
↓  
Data Ingestion  
↓  
Parsing and Normalization  
↓  
Network + Blockchain Correlation  
↓  
Wallet Feature Extraction  
↓  
Machine Learning  
↓  
Anomaly Detection  
↓  
Risk Analysis  
↓  
Alert Generation  
↓  
Entity and Graph Analysis  
↓  
Wallet Investigation  
↓  
Evidence and Reports

The platform is designed to transform large volumes of raw transaction and network metadata into structured, explainable, and investigator-friendly information while keeping the core analysis within a controlled local environment.
