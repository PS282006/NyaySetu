import os
import requests
import urllib.parse

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from pydantic import BaseModel


from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db, User, AuditLog
from auth import get_password_hash, create_access_token, get_current_user, verify_password

from fastapi import FastAPI, BackgroundTasks, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel
from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime

app = FastAPI(title="NyaySetu Legal API")

@app.get("/")
def health_check():
    return {"status": "NyaySetu AI is alive and running!"}


# ==========================================
# 1. CORS CONFIGURATION (For Next.js UI)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
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
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
llm = ChatGroq(model="openai/gpt-oss-20b", temperature=0.1)

chat_prompt = ChatPromptTemplate.from_template("""
You are NyaySetu, an AI legal assistant providing plain-language legal information under Indian Law.
Answer the user's question using the provided context. If the context does not fully cover the issue, use your general knowledge of Indian Law to give a helpful, educational answer.

CRITICAL RULES:
1. You MUST answer the user in the language specified: {language}. For example, if it says 'hi', reply in pure Hindi. If 'mr', reply in pure Marathi. If the user's question is written in Hinglish (Hindi in English letters), you should also reply in Hinglish!
2. If the context includes a "Computational Result" from Wolfram_Alpha_Engine, YOU MUST STATE THAT EXACT NUMBER AS THE FINAL CALCULATION.

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
    issue_description: str

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
async def chat_endpoint(req: NyaySetuRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_text = req.message if req.message else req.query
    
    # 0. Translate Query to English for better Vector Search if it's Hinglish/Hindi/Marathi
    translation_prompt = f"Translate the following legal query to standard English. If it is already in English, just repeat it. Output ONLY the English translation and nothing else. Query: {user_text}"
    english_query = llm.invoke(translation_prompt).content.strip()
    
    # 1. Fetch Legal Law Context (ChromaDB) with scores using the English query
    results = vectorstore.similarity_search_with_score(english_query, k=3)
    
    context_text = ""
    citations = []
    
    # 1.5 Filter out irrelevant conversational queries (distance > 0.68)
    best_score = results[0][1] if results else 1.0
    
    # If the best match is worse than 0.68, it's not a legal query (e.g. "hey", "hello")
    if best_score > 0.68:
        confidence = 0
    else:
        # Scale 0.40 distance to ~95%, 0.65 distance to ~60%
        confidence = max(55, min(99, int((0.75 - best_score) * 160)))
    
    for doc, score in results:
        # Only include citations that are actually relevant (distance <= 0.68)
        if score <= 0.68:
            source = doc.metadata.get("source", "Unknown")
            # Clean up the citation name to just the filename without the path
            if "/" in source:
                source = source.split("/")[-1]
            if source not in citations:
                citations.append(source)
            context_text += f"\n--- Source: {source} ---\n{doc.page_content}\n"
        
    # 2. INTERCEPT & EXTRACT MATH
    # Llama quickly isolates the math so Wolfram doesn't crash on conversational words
    extract_prompt = f"You are a math extractor. Extract ONLY the core mathematical calculation from this text to send to a calculator (e.g., 'calculate 12% annual interest on 33750 for 14 months'). If there is no math, reply with exactly 'NONE'. Text: {user_text}"
    
    clean_math = llm.invoke(extract_prompt).content.strip()
    
    if "NONE" not in clean_math.upper():
        print(f"[DEBUG] Llama extracted math: {clean_math}")
        math_result = get_wolfram_answer(clean_math)
        
        if math_result:
            context_text += f"\n--- Source: Wolfram_Alpha_Engine ---\nComputational Result: {math_result}\n"
            citations.append("Wolfram_Alpha_Engine")
        
    # 3. Generate the final answer using BOTH law and math
    response = rag_chain.invoke({"context": context_text, "question": user_text, "language": req.language})
    
    
    # Save Chat to History
    try:
        import json
        log = AuditLog(
            user_id=current_user.id,
            query=user_text,
            response=response.content,
            citations=json.dumps(citations),
            confidence_score=confidence
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Error saving chat history: {e}")

    return {
        "reply": response.content,
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


# ==========================================
# 6. WHATSAPP ENDPOINTS (TWILIO SANDBOX)
# ==========================================
@app.post("/api/whatsapp")
async def handle_whatsapp_message(request: Request, background_tasks: BackgroundTasks):
    try:
        form_data = await request.form()
        
        phone_number = form_data.get("From")
        twilio_number = form_data.get("To") or "whatsapp:+17372212163"
        user_text = form_data.get("Body", "")
        media_url = form_data.get("MediaUrl0")
        
        if media_url:
            background_tasks.add_task(process_twilio_audio, phone_number, media_url, twilio_number)
        elif user_text:
            background_tasks.add_task(process_twilio_reply, phone_number, user_text, twilio_number)
            
        return PlainTextResponse(content="<Response></Response>", media_type="application/xml")
    except Exception as e:
        print(f"[Twilio Error] {e}")
        return PlainTextResponse(content="<Response></Response>", media_type="application/xml")

def process_twilio_audio(phone_number: str, media_url: str, twilio_number: str = 'whatsapp:+17372212163'):
    try:
        import os, requests, tempfile
        from groq import Groq
        
        # Download Audio from Twilio
        audio_data = requests.get(media_url).content
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".ogg") as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name
            
        # Transcribe
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        with open(tmp_path, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=("audio.ogg", file.read()),
                model="whisper-large-v3",
            )
            
        os.unlink(tmp_path)
        user_text = transcription.text
        print(f"[Twilio Audio] Transcribed: {user_text}")
        
        # Pass to standard text processor
        process_twilio_reply(phone_number, user_text, twilio_number)
        
    except Exception as e:
        print(f"[Twilio Audio Error] {e}")

def process_twilio_reply(phone_number: str, user_text: str, twilio_number: str = 'whatsapp:+17372212163'):
    try:
        import os, requests
        from requests.auth import HTTPBasicAuth
        
        # 1. RAG pipeline
        translation_prompt = f"Translate to English. If English, repeat it. Output ONLY English. Query: {user_text}"
        english_query = llm.invoke(translation_prompt).content.strip()
        
        results = vectorstore.similarity_search_with_score(english_query, k=3)
        context_text = ""
        for doc, score in results:
            if score <= 0.68:
                context_text += f"\n{doc.page_content}\n"
                
        ai_response = rag_chain.invoke({"context": context_text, "question": user_text, "language": "en"})
        reply_text = ai_response.content.strip()
        
        # 2. Send via Twilio
        TWILIO_SID = os.getenv("TWILIO_SID")
        TWILIO_AUTH = os.getenv("TWILIO_AUTH")
        
        if not TWILIO_SID or not TWILIO_AUTH:
            print("[Twilio] Missing credentials")
            return
            
        url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_SID}/Messages.json"
        auth = HTTPBasicAuth(TWILIO_SID, TWILIO_AUTH)
        payload = {
            "From": twilio_number,
            "To": phone_number,
            "Body": reply_text
        }
        
        requests.post(url, data=payload, auth=auth)
        print(f"[Twilio] Replied to {phone_number}")
        
    except Exception as e:
        print(f"[Twilio Background Error] {e}")

@app.post("/api/auth/google")
def google_auth(token_data: GoogleToken, db: Session = Depends(get_db)):
    try:
        # Verify the Google token
        client_id = "611241590650-in5gn85q6nmn1g7kctd6vp08udgume1b.apps.googleusercontent.com"
        idinfo = id_token.verify_oauth2_token(token_data.token, google_requests.Request(), client_id)
        
        email = idinfo.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Google token did not contain an email")

        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Create a new user with a dummy password since they use Google to login
            hashed_pw = get_password_hash("GOOGLE_AUTH_DUMMY_PASSWORD_" + email)
            user = User(email=email, hashed_password=hashed_pw)
            db.add(user)
            db.commit()
            db.refresh(user)

        # Generate our own JWT token for the session
        access_token = create_access_token(data={"sub": str(user.id)})
        return {"access_token": access_token, "token_type": "bearer"}
    except ValueError:
        # Invalid token
        raise HTTPException(status_code=401, detail="Invalid Google authentication token")



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
            "query": log.query,
            "reply": log.response,
            "citations": cits,
            "confidence_score": log.confidence_score
        })
    return res
