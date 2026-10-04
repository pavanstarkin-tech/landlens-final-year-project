# LandLens — AI-Powered Property Document Verification Platform

[![Domain](https://img.shields.io/badge/Domain-Land%20Verification%20%26%20Fraud%20Prevention-blueviolet.svg)](#)
[![Runtime](https://img.shields.io/badge/Runtime-Node.js%20%7C%20React%2018%20%7C%20Vite-68a063.svg)](#)
[![Database](https://img.shields.io/badge/Database-MySQL%208.0%20(58%20Properties)-4479A1.svg)](#)
[![Build Status](https://img.shields.io/badge/QA%20Tests-13%2F13%20Passed%20(100%25)-brightgreen.svg)](#)

> **Tagline:** *"LandLens: Making Land Verification Accessible, Transparent, and AI-Assisted for Every Citizen."*

<p align="center">
  <img src="./frontend-react/public/logo.png" alt="LandLens Logo" width="260"/>
</p>

---

## 📖 1. Project Overview

**LandLens** is a specialized property document verification and citizen fraud prevention platform. It enables a property buyer to verify land documents through automated AI parameter extraction and **separately confirm whether the genuine/original owner has authorized those documents**.

The core innovation of LandLens is its **Two-Layer Verification Architecture**:
1. **Stage 1: Document Verification** — Cross-compares parameters across (1) Uploaded Deeds, (2) Buyer-Entered Details, and (3) Official Reference Records.
2. **Stage 2: Original Owner Verification** — Directly notifies the registered title holder to confirm if they authorized the sale, stopping fraudulent and fake sellers even when documents are forged with authentic public numbers.

---

## 🛡️ 2. The Two Verification Layers

| Stage | Core Question | Verification Mechanism | Output / Result |
| :--- | :--- | :--- | :--- |
| **Stage 1: Document Verification** | *Do the documents and property information appear consistent?* | AI OCR extracts Survey No, Acreage, Owner, and SRO Office. Parameter matrix compares deed vs. buyer input vs. public registry. | **Explainable Verification Report** (Matches, Discrepancies, Missing Data, Risk Score) |
| **Stage 2: Original Owner Verification** | *Did the genuine/original owner provide or authorize the documents?* | Secure notification sent to registered title holder with digital confirmation. | **Approved / Rejected** (*If Rejected: Fake Seller Flagged & Blocked*) |

---

## ⚡ 3. Complete 12-Step Project Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 LANDLENS PROJECT WORKFLOW                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘
  [1. Search Property] ──► [2. Get Seller/Owner Contact] ──► [3. Receive Deed from Seller]
                                                                        │
                                                                        ▼
  [6. Cross-Comparison Matrix] ◄── [5. AI Parameter Extraction] ◄── [4. Upload to LandLens]
              │
              ▼
  [7. Flag Discrepancies & Risks] ──► [8. Generate Explainable Report] ──► [9. AI Chat Q&A]
                                                                                  │
                                                                                  ▼
  [12. Owner APPROVE / REJECT] ◄── [11. Email Notification] ◄── [10. Request Owner Verification]
              │
              ├─► IF APPROVED: Recorded in digital audit log -> Proceed to Sub-Registrar.
              └─► IF REJECTED: Suspicious / Fake Seller is immediately FLAGGED & BLOCKED!
```

1. **Property Search**: Buyer searches for a property by entering available property details (Property Code, Survey Number, Location, or Title).
2. **Seller/Owner Contact Lookup**: LandLens displays the registered seller and original owner contact information.
3. **External Document Exchange**: Buyer contacts the seller outside LandLens and receives the property documents.
4. **Document Ingestion & Input**: Buyer uploads the received documents (Patta, Sale Deed, Tax Receipts, 1B Records) and enters claimed details manually.
5. **AI Extraction**: LandLens reads and extracts key parameters (Owner Name, Survey Number, Area/Acreage, Location, SRO Office, Boundaries).
6. **Cross-Comparison Matrix**: The system cross-compares parameters across:
   - (A) Uploaded Deed Documents
   - (B) Buyer-Entered Claimed Information
   - (C) Registered Public Records Ledger
7. **Discrepancy Identification**: Flags mismatches in survey subdivisions, altered acreage numbers, boundary conflicts, or missing signatures.
8. **Explainable Verification Report**: Generates a clear, non-technical report explaining match factors, risk indicators, and why items were flagged.
9. **Contextual AI Chatbot Assistant**: Buyer can ask conversational questions in English or Indian languages (*"What does survey 104/2 mean?"*, *"Why was area flagged?"*).
10. **Request Original Owner Verification**: Buyer initiates Stage 2 confirmation with 1 click.
11. **Registered Owner Notification**: LandLens sends an authorization request notification to the registered owner.
12. **Owner Decision & Defense**:
    - **If APPROVED**: Digital authorization is logged on the audit timeline. Buyer can proceed with formal registration.
    - **If REJECTED**: The suspicious/fake seller is immediately **flagged and blocked** across the platform!

---

## 🚨 4. The Critical Fake-Seller Scenario Defense

> **Key Viva Demonstration Feature:**
> A fraudulent seller may obtain authentic public survey numbers and forge a clean deed containing accurate government details. 
> 
> * **In Stage 1**: The Document Verification Report shows **Consistent (95% Match)** because the numbers match public records.
> * **In Stage 2**: The buyer clicks **Request Original Owner Verification**. The genuine registered title holder receives the notification and clicks **REJECT** (*"I never authorized this seller or listed this land"*).
> * **Outcome**: LandLens instantly catches the fraud, flags the seller account, and protects the citizen from losing money!

---

## 💬 5. AI Assistant & Multilingual Chat Capabilities

The built-in conversational AI assistant empowers citizens to understand complex legal documents:
* **Explain Legal Jargon**: Clarifies Patta passbooks, Encumbrance Certificates (EC), 1B extracts, and cadastral survey subdivisions.
* **Explain Flagged Reasons**: Explains in plain language why a specific parameter or area discrepancy was flagged.
* **Identify Missing Information**: Outlines mandatory government forms required prior to final registration.
* **Multilingual Fluency**: Native support across **English, Telugu, Hindi, Tamil, Kannada, Marathi, and Bengali**.

---

## 🚫 6. What LandLens Does & Does Not Do

| What LandLens Does ✅ | What LandLens Does NOT Do ❌ |
| :--- | :--- |
| Pre-transaction document consistency validation | Does NOT execute final legal property registration |
| Parameter cross-comparison against public records | Does NOT replace the government Sub-Registrar Office (SRO) |
| Direct original owner authorization verification | Does NOT conduct police or judicial court proceedings |
| Explainable AI risk scoring and plain-language reports | Does NOT handle physical transfer of monetary funds |
| Digital flagging of fraudulent & suspicious sellers | Does NOT make definitive legal determinations of ownership |

---

## 🚀 7. How to Run Locally (1-Click Launch)

### Option 1: 1-Click Windows Launcher (Recommended)
Simply double-click the included batch file in Windows Explorer:
📁 **`run_locally.bat`**

### Option 2: Terminal / PowerShell
```bash
# In the project root directory:
npm start
# OR
node start.js
```

*This automatically boots:*
1. **Backend REST API Server** on `http://localhost:5000` (connected live to MySQL database).
2. **Frontend React Application** on `http://localhost:5173`.
3. **Automatically opens your web browser** directly to `http://localhost:5173`.

---

## 🔑 8. Demo Credentials & User Roles

| User Role | Email | Password | Access & Capabilities |
| :--- | :--- | :--- | :--- |
| **Citizen / Buyer** | `buyer@gmail.com` | `buyer123` | Search properties, upload deeds, view report, AI chat, trigger Stage 2 owner verification. |
| **Admin** | `admin@gmail.com` | `admin123` | System analytics, user governance, API developer key management, global dispute queue. |
| **Government Officer** | `govt@gmail.com` | `govt123` | Official verification review, ground survey scheduling, certificate issuance. |
| **Land Provider / Seller**| `seller@gmail.com` | `seller123` | Create property listings, upload deeds & 360° virtual tours, manage buyer visit requests. |

---

## 🧪 9. Automated QA Test Suite

To verify all system layers (Backend API, MySQL Database, JWT Auth, Verification Logic, UI Routes, and TypeScript Build):
```bash
npm test
```

**QA Test Results: 13/13 Passed (100% Success Rate):**
* ✅ Backend Service Health Check (`/api/health`)
* ✅ MySQL Database Connection (`/api/properties` - 58 Active Properties)
* ✅ Single Property Retrieval (`/api/properties/:id`)
* ✅ JWT Authentication (Buyer, Seller, Government Officer, Admin)
* ✅ Stage 1 Cross-Comparison Matrix Engine
* ✅ Stage 2 Registered Owner Defense Simulation
* ✅ Frontend UI Routing (`/` and `/verify`)
* ✅ React 18 Vite Production Compilation

---

## 📂 10. Technology Stack & Directory Architecture

```
LandLense/
├── frontend-react/               # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/shared/    # DocumentVerificationHub, Map, AI Assistant
│   │   ├── pages/                # VerifyPage, BuyerDashboard, Login, PropertyDetail
│   │   ├── services/             # verification.service.ts, api.ts, auth.service.ts
│   │   └── models/               # property.models.ts (TypeScript interfaces)
│   └── vite.config.ts            # Vite proxy & allowedHosts configuration
├── lambda_code/                  # Serverless microservices handler
│   └── index.js                  # REST API route handlers & MySQL bridge
├── backend_server.js             # Local Node.js Express server on Port 5000
├── start.js                      # Cross-platform all-in-one local launcher
├── run_locally.bat               # 1-Click Windows Explorer batch launcher
├── qa_test_suite.js              # Comprehensive 13-point automated test suite
├── package.json                  # Root npm scripts (start, dev, test, backend, frontend)
└── README.md                     # Project documentation & requirements guide
```

---

## 📜 11. Academic Project License
LandLens is developed as a **Final Year Major Project** for academic presentation, research, and institutional evaluation in AI-assisted citizen governance and fraud prevention.
