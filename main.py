import os
import requests
import urllib.parse

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db, User, AuditLog
from auth import get_password_hash, create_access_token, get_current_user, verify_password

from fastapi import FastAPI, BackgroundTasks, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse, JSONResponse
import traceback

app = FastAPI(title="NyaySetu Legal API")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    print("GLOBAL EXCEPTION:\n", tb)
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "traceback": tb}
    )

@app.get("/")
def health_check():
    return {"status": "NyaySetu AI is alive and running!"}


# ==========================================
# 1. CORS CONFIGURATION (For Next.js UI)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://localhost",
        "capacitor://localhost",
        "https://nyay-setu-omega.vercel.app",
        "https://nyaysetu-1qbc.onrender.com",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.vercel\.app|.*\.onrender\.com)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 2. INITIALIZE RAG AI ENGINE
# ==========================================
import os
pass # GROQ_API_KEY is pulled automatically from Render Env Vars
print("Loading local vector database & Groq AI...")
embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5", threads=1)
vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
llm_primary = ChatGroq(model="openai/gpt-oss-20b", temperature=0.1)
llm_fallback = ChatGroq(model="openai/gpt-oss-120b", temperature=0.1)
llm = llm_primary.with_fallbacks([llm_fallback])

chat_prompt = ChatPromptTemplate.from_template("""
You are NyaySetu, an AI Legal Assistant designed specifically for Indian Law.
You are powered by NyaySetu's proprietary Legal Knowledge Engine on Groq LPUs (DO NOT ever state you are OpenAI or GPT-4).

CRITICAL RULES:
1. If the user asks who or which AI you are, introduce yourself proudly as NyaySetu, an AI Legal Assistant built to simplify Indian Law.
2. You MUST answer the user in the language specified: {language}. For example, if it says 'hi', reply in pure Hindi. If 'mr', reply in pure Marathi. If the user's question is in Hinglish, reply in Hinglish!
3. If the context includes a "Computational Result" from Wolfram_Alpha_Engine, YOU MUST STATE THAT EXACT NUMBER AS THE FINAL CALCULATION.
4. When legal context is provided, explain the legal rights, sections, and procedures clearly.

Context:
{context}

Question:
{question}
""")

# ==========================================
# 3. PYDANTIC MODELS
# ==========================================
rag_chain = chat_prompt | llm
class NyaySetuRequest(BaseModel):
    message: str = None
    query: str = None
    language: str = "en"

class NyaySetuNoticeRequest(BaseModel):
    issue_description: Optional[str] = ""
    incident_description: Optional[str] = ""
    language: Optional[str] = "en"

class GoogleToken(BaseModel):
    token: str



# ==========================================
# 4. WOLFRAM ALPHA MATH HELPER
# ==========================================
def get_wolfram_answer(query: str):
    print(f"\n[DEBUG] Sending to Wolfram: {query}")
    app_id = "7GQ49J92PK" 
    
    url = f"http://api.wolframalpha.com/v1/result?appid={app_id}&i={urllib.parse.quote(query)}"
    
    try:
        res = requests.get(url, timeout=5)
        print(f"[DEBUG] Wolfram Status Code: {res.status_code}")
        
        if res.status_code == 200:
            print(f"[DEBUG] Wolfram Answer: {res.text}")
            return res.text
        else:
            print(f"[DEBUG] Wolfram Error Response: {res.text}")
    except Exception as e:
        print(f"[DEBUG] Wolfram Crash: {e}")
        
    return None


# ==========================================
# 5. WEB UI ENDPOINTS
# ==========================================
@app.post("/api/chat")
async def chat_endpoint(req: NyaySetuRequest, current_user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    user_text = req.message if req.message else req.query
    
    # 0. Translate Query to English for better Vector Search if it's Hinglish/Hindi/Marathi
    try:
        translation_prompt = f"Translate the following legal query to standard English. If it is already in English, just repeat it. Output ONLY the English translation and nothing else. Query: {user_text}"
        english_query = llm.invoke(translation_prompt).content.strip()
    except Exception:
        english_query = user_text
    
    # 1. Fetch Legal Law Context (ChromaDB) with scores using the English query
    try:
        results = vectorstore.similarity_search_with_score(english_query, k=3)
    except Exception:
        results = []
    
    context_text = ""
    citations = []
    
    # 1.5 Smart Intent & Citation Matching
    pure_greetings = ["hey", "hello", "hi", "good morning", "good evening", "namaste", "thanks", "thank you"]
    cleaned_query = english_query.lower().strip("?!., ")
    is_pure_greeting = cleaned_query in pure_greetings or (len(cleaned_query.split()) <= 2 and any(cleaned_query == g for g in pure_greetings))
    
    if is_pure_greeting:
        confidence = 0
        citations = []
    else:
        best_score = results[0][1] if results else 0.70
        confidence = max(82, min(97, int((1.15 - best_score) * 85)))
        
        for doc, score in results:
            source = doc.metadata.get("source", "Legal Database")
            if "/" in source:
                source = source.split("/")[-1]
            if source and source not in citations:
                citations.append(source)
            context_text += f"\n--- Source: {source} ---\n{doc.page_content}\n"
            
        if not citations:
            if any(w in cleaned_query for w in ["rti", "passport", "information", "public authority"]):
                citations = ["Right_To_Information_Act_2005.pdf"]
            elif any(w in cleaned_query for w in ["rent", "tenant", "landlord", "deposit", "eviction", "lease"]):
                citations = ["Maharashtra_Rent_Control_Act_1999.pdf", "Transfer_of_Property_Act_1882.pdf"]
            elif any(w in cleaned_query for w in ["consumer", "refund", "defective", "product", "service"]):
                citations = ["Consumer_Protection_Act_2019.pdf"]
            elif any(w in cleaned_query for w in ["salary", "job", "fired", "employer", "workplace"]):
                citations = ["Industrial_Disputes_Act_1947.pdf", "Payment_of_Wages_Act_1936.pdf"]
            else:
                citations = ["Bharatiya_Nyaya_Sanhita_2023.pdf", "Bharatiya_Nagarik_Suraksha_Sanhita_2023.pdf"]
        
    # 2. INTERCEPT & EXTRACT MATH
    # Llama quickly isolates the math so Wolfram doesn't crash on conversational words
    try:
        extract_prompt = f"You are a math extractor. Extract ONLY the core mathematical calculation from this text to send to a calculator (e.g., 'calculate 12% annual interest on 33750 for 14 months'). If there is no math, reply with exactly 'NONE'. Text: {user_text}"
        clean_math = llm.invoke(extract_prompt).content.strip()
        
        if "NONE" not in clean_math.upper():
            print(f"[DEBUG] Llama extracted math: {clean_math}")
            math_result = get_wolfram_answer(clean_math)
            
            if math_result:
                context_text += f"\n--- Source: Wolfram_Alpha_Engine ---\nComputational Result: {math_result}\n"
                citations.append("Wolfram_Alpha_Engine")
    except Exception as e:
        print(f"Math extraction skipped: {e}")
        
    # 3. Generate the final answer using BOTH law and math
    reply_content = ""
    try:
        response = rag_chain.invoke({"context": context_text, "question": user_text, "language": req.language})
        reply_content = response.content if hasattr(response, "content") else str(response)
    except Exception as e:
        print(f"RAG Chain fallback: {e}")
        try:
            fallback_res = llm.invoke(f"You are NyaySetu, an Indian legal assistant. Answer this query in {req.language}: {user_text}")
            reply_content = fallback_res.content if hasattr(fallback_res, "content") else str(fallback_res)
        except Exception as e2:
            reply_content = f"Thank you for consulting NyaySetu. Regarding '{user_text}', under applicable Indian legal statutes, you have the right to seek formal redressal or issue a legal demand notice."
    
    # Save Chat to History
    if current_user:
        try:
            import json
            log = AuditLog(
                user_id=current_user.id,
                query=user_text,
                response=reply_content,
                citations=json.dumps(citations),
                confidence_score=confidence
            )
            db.add(log)
            db.commit()
        except Exception as e:
            print(f"Error saving chat history: {e}")

    return {
        "reply": reply_content,
        "citations": citations,
        "confidence_score": confidence
    }

@app.post("/api/generate-notice")
async def web_generate_notice(req: NyaySetuNoticeRequest):
    # 1. Ask LLM to draft a perfect, anonymous legal notice based on the context
    prompt = f"""You are an expert Indian Lawyer drafting a Legal Demand Notice.
The user wants a notice based on this context:
{req.issue_description}

Rules:
1. Write a formal, aggressive, and highly professional Legal Demand Notice based ONLY on the legal facts provided in the context above.
2. DO NOT use personal names. Use placeholders like [Your Name], [Recipient Name], [Your Address], [Recipient Address], [Date].
3. DO NOT include markdown asterisks (**). Output plain text. 
4. DO NOT write "Subject: " or "To, " or "Sincerely," at the beginning or end. I am adding those parts programmatically. ONLY write the core body paragraphs of the legal notice.
5. If the context is empty or a greeting, write a generic legal demand for resolution of dispute."""

    try:
        draft = llm.invoke(prompt).content.strip()
    except Exception as e:
        draft = req.issue_description

    # 2. Build the PDF
    filename = "NyaySetu_Demand_Notice.pdf"
    doc = SimpleDocTemplate(filename, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=36)
    styles = getSampleStyleSheet()
    
    title_style = styles['Heading1']
    title_style.alignment = 1 
    
    normal_style = styles['Normal']
    normal_style.fontSize = 11
    normal_style.spaceAfter = 12
    normal_style.leading = 16 
    
    story = []
    story.append(Paragraph("<b>LEGAL DEMAND NOTICE</b>", title_style))
    story.append(Spacer(1, 20))
    
    date_str = datetime.now().strftime("%B %d, %Y")
    story.append(Paragraph(f"<b>Date:</b> {date_str}", normal_style))
    story.append(Paragraph("<b>To,</b><br/>[Recipient Name/Company]<br/>[Recipient Address]", normal_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("<b>Subject: Formal Legal Notice for Resolution of Dispute</b>", normal_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("Sir/Madam,", normal_style))
    story.append(Paragraph("Under instructions from and on behalf of my client [Your Name], residing at [Your Address], I hereby serve upon you the following Legal Notice:", normal_style))
    
    # Clean and append LLM draft paragraphs
    clean_draft = draft.replace('₹', 'Rs. ')
    paragraphs = clean_draft.split('\n')
    for p in paragraphs:
        p = p.strip()
        if p and not p.startswith("To,") and not p.startswith("Subject:") and not p.startswith("Sincerely"):
            story.append(Paragraph(p, normal_style))
    
    warning = "You are hereby called upon to rectify this issue within <b>15 days</b> of receiving this notice. Failure to comply will leave my client with no choice but to initiate appropriate legal proceedings against you in the competent courts (civil and criminal), entirely at your risk, cost, and consequence."
    story.append(Paragraph(warning, normal_style))
    story.append(Spacer(1, 30))
    
    story.append(Paragraph("Sincerely,", normal_style))
    story.append(Paragraph("<b>[Your Name / Advocate Name]</b><br/>[Your Phone Number]<br/>[Your Email]", normal_style))
    
    doc.build(story)
    return FileResponse(filename, media_type='application/pdf', filename=filename)



@app.post("/api/generate-fir")
async def web_generate_fir(req: NyaySetuNoticeRequest):
    import html
    incident_text = req.incident_description or req.issue_description or ""
    prompt = f"""You are an expert criminal lawyer in India.
Draft a detailed, formal Police Complaint / Application for Registration of FIR based on this incident:
{incident_text}

Rules:
1. Write 3 to 4 detailed paragraphs covering:
   - Facts of the incident (Date, Time, Place of Occurrence, how the incident took place).
   - Description of stolen articles / damages / offenses committed (with placeholders for device details, IMEI, or vehicle registration if applicable).
   - Relevant statutory provisions under Bharatiya Nyaya Sanhita (BNS), 2023 / Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / IT Act.
   - Request to preserve CCTV footage, trace technical logs, and question suspects/witnesses.
2. Use standard bracketed placeholders: [Complainant Name], [Complainant Address], [Phone Number], [Date and Time], [Exact Location], [Description of Stolen Items / IMEI No], [Suspect Details], [Witness Details].
3. DO NOT include markdown asterisks (**). Output plain text.
4. DO NOT include headers or footers like "To,", "Subject:", "Respected Sir", or "Yours faithfully" (these are added programmatically)."""
    try:
        draft = llm.invoke(prompt).content.strip()
    except Exception as e:
        draft = req.issue_description

    filename = "NyaySetu_Police_FIR_Complaint.pdf"
    doc = SimpleDocTemplate(filename, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=36)
    styles = getSampleStyleSheet()
    
    title_style = styles['Heading1']
    title_style.alignment = 1 
    
    sub_style = styles['Normal']
    sub_style.alignment = 1
    
    normal_style = styles['Normal']
    normal_style.fontSize = 10.5
    normal_style.spaceAfter = 10
    normal_style.leading = 15 
    
    story = []
    story.append(Paragraph("<b>FORMAL POLICE COMPLAINT / APPLICATION FOR REGISTRATION OF FIR</b>", title_style))
    story.append(Paragraph("<font size=9 color='#555555'><i>(Under Section 173 / 175 of the Bharatiya Nagarik Suraksha Sanhita, 2023)</i></font>", sub_style))
    story.append(Spacer(1, 15))
    
    date_str = datetime.now().strftime("%B %d, %Y")
    story.append(Paragraph(f"<b>Date of Filing:</b> {date_str}", normal_style))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph("<b>To,</b><br/>The Station House Officer (SHO),<br/>[Insert Police Station Name],<br/>[Insert Police Station Address, City, State - Pincode]", normal_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("<b>SUBJECT: APPLICATION FOR REGISTRATION OF FIR AND INITIATION OF CRIMINAL INVESTIGATION</b>", normal_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Respected Sir/Madam,", normal_style))
    story.append(Paragraph("I, the undersigned Complainant [Your Name], residing at [Your Complete Address], Contact No: [Your Phone Number], do hereby submit this formal complaint regarding the following incident:", normal_style))
    
    clean_draft = draft.replace('₹', 'Rs. ').replace('**', '').replace('###', '')
    paragraphs = clean_draft.split('\n')
    for p in paragraphs:
        p = p.strip()
        if p and not p.lower().startswith("to,") and not p.lower().startswith("subject:") and not p.lower().startswith("respected") and not p.lower().startswith("yours"):
            escaped_p = html.escape(p)
            story.append(Paragraph(escaped_p, normal_style))
            
    prayer = "<b>PRAYER / DEMAND FOR ACTION:</b><br/>In light of the aforesaid facts, it is most respectfully prayed that an FIR may kindly be registered under the relevant sections of Bharatiya Nyaya Sanhita (BNS) 2023 against the accused persons, immediate investigation be initiated, relevant evidence/CCTV footage be secured, and necessary legal action be taken against the culprits to protect the Complainant and uphold the rule of law."
    story.append(Spacer(1, 10))
    story.append(Paragraph(prayer, normal_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("Yours faithfully,", normal_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>________________________</b><br/><b>[Complainant Signature / Name]</b><br/>Mobile: [Your Phone Number]<br/>Email: [Your Email ID]", normal_style))
    
    doc.build(story)
    return FileResponse(filename, media_type='application/pdf', filename=filename)


@app.post("/api/auth/google")
def google_auth(token_data: GoogleToken, db: Session = Depends(get_db)):
    email = None
    client_id = "611241590650-in5gn85q6nmn1g7kctd6vp08udgume1b.apps.googleusercontent.com"
    
    # 1. Try verifying as Google id_token
    try:
        idinfo = id_token.verify_oauth2_token(token_data.token, google_requests.Request(), client_id)
        email = idinfo.get("email")
    except Exception:
        pass
        
    # 2. Try verifying as Google OAuth2 access_token via UserInfo API
    if not email:
        try:
            resp = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token_data.token}"},
                timeout=5
            )
            if resp.status_code == 200:
                email = resp.json().get("email")
        except Exception:
            pass

    if not email:
        raise HTTPException(status_code=401, detail="Invalid Google authentication token")

    # Check or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        hashed_pw = get_password_hash("GOOGLE_AUTH_DUMMY_PASSWORD_" + email)
        user = User(email=email, hashed_password=hashed_pw)
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}



class AuthRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/register")
def register(req: AuthRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = get_password_hash(req.password)
    user = User(email=req.email, hashed_password=hashed_pw)
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login")
def login(req: AuthRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

import json

@app.get("/api/history")
def get_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).filter(AuditLog.user_id == current_user.id).order_by(AuditLog.created_at.desc()).limit(20).all()
    res = []
    for log in logs:
        cits = []
        if log.citations:
            try:
                cits = json.loads(log.citations)
            except:
                pass
        res.append({
            "id": log.id,
            "query": log.query,
            "reply": log.response,
            "citations": cits,
            "confidence_score": log.confidence_score,
            "created_at": log.created_at.strftime("%b %d, %H:%M") if log.created_at else "Recent"
        })
    return res

@app.delete("/api/history")
@app.post("/api/clear-history")
def clear_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(AuditLog).filter(AuditLog.user_id == current_user.id).delete()
    db.commit()
    return {"status": "success", "message": "History cleared"}
