# ⚖️ NyaySetu (न्यायसेतु) — AI Legal Aid & Document Drafting Assistant

<div align="center">

[![Live Web App](https://img.shields.io/badge/Live_Web_App-nyay--setu--omega.vercel.app-0070F3?style=for-the-badge&logo=vercel&logoColor=white)](https://nyay-setu-omega.vercel.app)
[![Download Android APK](https://img.shields.io/badge/Download_Android_APK-NyaySetu.apk-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/PS282006/NyaySetu/raw/main/apk/NyaySetu.apk)
[![Backend API](https://img.shields.io/badge/API_Status-Online-46E3B7?style=for-the-badge&logo=fastapi&logoColor=white)](https://nyaysetu-1qbc.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-F7B93E?style=for-the-badge)](LICENSE)

**An intelligent legal assistant built to make Indian law simple, accessible, and actionable for every citizen.**

[🌐 Open Web App](https://nyay-setu-omega.vercel.app) • [📱 Download Android App](https://github.com/PS282006/NyaySetu/raw/main/apk/NyaySetu.apk) • [📖 API Docs](https://nyaysetu-1qbc.onrender.com/docs)

</div>

---

## 🌟 What is NyaySetu?

**NyaySetu (Bridge to Justice)** is an AI-powered legal assistant designed specifically for Indian citizens. It takes complex statutory legal acts, translates them into plain language, calculates exact compensation/interest amounts, and automatically drafts official, court-ready **Legal Demand Notices** and **Police FIR Complaints** in seconds.

Whether you are dealing with an unpaid security deposit, workplace harassment, a defective consumer product, or filing an RTI, NyaySetu provides verified legal steps with statutory backing.

---

## 🎯 Problems We Solve

* **Complex Legal Language:** Simplifies dense legal sections into plain English, Hindi, and Marathi.
* **Expensive Preliminary Consultation:** Gives citizens instant, free preliminary legal clarity before hiring a lawyer.
* **New Criminal Codes Confusion:** Full support for the newly enacted **Bharatiya Nyaya Sanhita (BNS) 2023** and **Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023**.
* **Zero Math Hallucinations:** Calculates exact compound interest on withheld dues using computational engines.

---

## ✨ Key Features

### 🏛️ 1. Statutory Legal Knowledge Base (RAG)
* Indexes major Indian Bare Acts:
  * **Bharatiya Nyaya Sanhita (BNS) 2023** & **BNSS 2023**
  * **Right to Information (RTI) Act 2005**
  * **Consumer Protection Act 2019**
  * **Maharashtra Rent Control Act 1999 & Transfer of Property Act 1882**
  * **POSH Act 2013** & **IT Act 2000**
* Displays **Cited Authorities** and verified **Match Confidence %** on every response.

### 🧮 2. Precise Financial Calculations (Wolfram Alpha)
* Automatically detects financial queries (e.g., *“Calculate 12% interest on ₹50,000 security deposit for 14 months”*).
* Uses the **Wolfram Alpha API** to calculate accurate statutory compensation and interest amounts.

### 📄 3. 1-Click Court-Ready PDF Generation
* **Civil Demand Notices:** Generates a formal PDF legal notice with a standard 15-day compliance deadline.
* **Police FIR Complaints:** Generates an official written complaint addressed to the Station House Officer (SHO) under **Section 173/175 of the BNSS 2023**.

### 🔊 4. Multilingual & Voice Enabled
* Full support in **English, Hindi (हिंदी), and Marathi (मराठी)**.
* Includes **Text-to-Speech (TTS)** audio readout for low-literacy or visually impaired users.

### 📱 5. Web & Native Android App
* Fully responsive web application on Vercel.
* Standalone **Android APK** featuring 1-tap Google Authentication and direct document download/sharing.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons |
| **Mobile App** | Capacitor 7 Native Android (SDK 36, Java 17) |
| **Backend API** | FastAPI (Python 3.11+), Uvicorn |
| **AI & LLM** | Groq Cloud LPUs (`openai/gpt-oss-20b` with failover) |
| **Vector DB** | ChromaDB with FastEmbed (`BAAI/bge-small-en-v1.5`) |
| **Math Engine** | Wolfram Alpha API |
| **PDF Engine** | ReportLab Document Engine |
| **Database** | SQLite + SQLAlchemy ORM (Auth & Audit Logs) |

---

## 🚀 Easy Local Setup

### 1. Backend Setup
```bash
# Clone repository
git clone https://github.com/PS282006/NyaySetu.git
cd NyaySetu

# Set up Python environment
python3 -m venv venv
source venv/bin/activate

# Install requirements & start backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend will run at `http://localhost:8000` (API Docs at `/docs`).

### 2. Frontend Setup
```bash
cd nyaysetu-web
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📱 Download Android APK

* 📦 **Direct Download:** [`apk/NyaySetu.apk`](https://github.com/PS282006/NyaySetu/raw/main/apk/NyaySetu.apk)
* 📱 **Package Name:** `com.nyaysetu.app`
* ⚡ **Compatibility:** Android 7.0+ up to Android 15

---

## ⚖️ Disclaimer

*NyaySetu is an AI-assisted legal empowerment tool created for educational and informational purposes. It provides statutory guidance and preliminary drafting assistance, but does not constitute formal attorney-client representation.*
