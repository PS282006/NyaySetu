# ⚖️ NyaySetu (न्यायसेतु) — Autonomous AI Legal Aid Assistant

[![Live Web App](https://img.shields.io/badge/Live_Web_App-nyay--setu--omega.vercel.app-blue?style=for-the-badge&logo=vercel)](https://nyay-setu-omega.vercel.app)
[![Download Android APK](https://img.shields.io/badge/Download-Android_APK-green?style=for-the-badge&logo=android)](apk/NyaySetu.apk)
[![Backend API](https://img.shields.io/badge/Backend_API-Render_Live-purple?style=for-the-badge&logo=fastapi)](https://nyaysetu-1qbc.onrender.com)

**NyaySetu** is an AI-powered legal empowerment platform built to democratize access to justice in India. It translates complex Indian statutory laws into plain, actionable guidance in English, Hindi, and Marathi, computes precise financial interests/penalties, and automatically drafts court-ready **Legal Demand Notices** and **Police FIR Complaints (BNSS 2023)**.

---

## 📱 Mobile App (Android APK)

The official **NyaySetu Android App** is compiled natively for Android:

* **File:** [`apk/NyaySetu.apk`](apk/NyaySetu.apk) (4.2 MB)
* **Package Name:** `com.nyaysetu.app`
* **Compatibility:** Android 7.0+ (Nougat) up to Android 15 (Target SDK 36)
* **Features:** 100% feature parity with web (Google OAuth, Wolfram Alpha calculations, ReportLab PDF generation, Audio Readout TTS, History drawer, Light/Dark themes).

### 📥 How to Install:
1. Download [`NyaySetu.apk`](apk/NyaySetu.apk) onto your Android phone.
2. Tap the downloaded file and select **Install** (allow *Install from Unknown Sources* if prompted).
3. Open **NyaySetu** and log in with Google to access your legal workspace!

---

## 🌟 Key Features

1. **🏛️ Statutory RAG Knowledge Engine:**
   * Semantically indexes and cites bare acts (*Bharatiya Nyaya Sanhita 2023*, *Maharashtra Rent Control Act 1999*, *Consumer Protection Act 2019*, *POSH Act 2013*, *Transfer of Property Act 1882*, etc.).
   * Displays **Cited Authorities** and verified **Match Confidence %** on all legal responses.

2. **🧮 Wolfram Alpha Computational Math Engine:**
   * Automatically isolates financial queries (e.g. security deposit interest, salary severance, compensation penalties) and computes exact statutory amounts.

3. **📄 Automated PDF Document Drafters:**
   * **Civil Disputes:** Generates downloadable **Legal Demand Notices** formatted with a 15-day compliance deadline.
   * **Criminal Incidents:** Generates formal **Police Complaints / FIR Applications** addressed to the Station House Officer (SHO) under **Section 173/175 of the Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023** and **BNS 2023**.

4. **🔊 Multilingual Audio Readout (TTS):**
   * Listen to legal advice read aloud in Indian English, Hindi, or Marathi with one tap.

5. **💬 ChatGPT-Style History Drawer:**
   * Real-time session history, timestamped past consultations, and instant `+ New Chat` reset.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Web & Mobile** | Next.js 15 (App Router, Tailwind CSS, Lucide Icons) + Capacitor 7 Native Android |
| **Backend API** | FastAPI (Python 3.11+), Uvicorn |
| **Inference Engine** | Groq Cloud LPUs (`groq/compound` + `groq/compound-mini` failover) |
| **Vector Database** | ChromaDB with FastEmbed (`BAAI/bge-small-en-v1.5`) |
| **Relational Database** | SQLite with SQLAlchemy ORM (User Auth, Google OAuth, Audit Logs) |
| **Computational Engine** | Wolfram Alpha REST API |
| **PDF Generation** | ReportLab Document Engine |

---

## 👥 Contributors
Developed with ❤️ for Indian citizens by **Parth Singh**.
