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

from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings, ChatOllama
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
print("Loading local vector database & Llama 3.2...")
embeddings = OllamaEmbeddings(model="nomic-embed-text")
vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
llm = ChatOllama(model="llama3.2", temperature=0.1)

chat_prompt = ChatPromptTemplate.from_template("""
You are NyaySetu, an AI legal assistant providing plain-language legal information under Indian Law.
Answer the user's question using ONLY the provided context. If the context does not contain enough information, state that clearly.

CRITICAL RULE: If the context includes a "Computational Result" from Wolfram_Alpha_Engine, YOU MUST STATE THAT EXACT NUMBER AS THE FINAL CALCULATION. DO NOT attempt to perform any additional math, division, or alterations on the Wolfram result.

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
async def chat_endpoint(req: NyaySetuRequest):
    user_text = req.message if req.message else req.query
    
    # 1. Fetch Legal Law Context (ChromaDB)
    docs = retriever.invoke(user_text)
    
    context_text = ""
    citations = []
    
    for doc in docs:
        source = doc.metadata.get("source", "Unknown")
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
    response = rag_chain.invoke({"context": context_text, "question": user_text})
    
    return {
        "reply": response.content,
        "citations": citations
    }

@app.post("/api/generate-notice")
async def web_generate_notice(req: NyaySetuNoticeRequest):
    filename = "NyaySetu_Demand_Notice.pdf"
    doc = SimpleDocTemplate(filename, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet()
    
    title_style = styles['Heading1']
    title_style.alignment = 1 
    
    normal_style = styles['Normal']
    normal_style.fontSize = 11
    normal_style.spaceAfter = 12
    normal_style.leading = 16 
    
    clean_text = req.issue_description.replace('₹', 'Rs. ').replace('\n', ' ')
    
    story = []
    story.append(Paragraph("<b>LEGAL DEMAND NOTICE</b>", title_style))
    story.append(Spacer(1, 20))
    
    date_str = datetime.now().strftime("%B %d, %Y")
    story.append(Paragraph(f"<b>Date:</b> {date_str}", normal_style))
    story.append(Paragraph("<b>To,</b><br/>[Insert Landlord Name]<br/>[Insert Landlord Address]", normal_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("<b>Subject: Formal Demand for Resolution</b>", normal_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("Sir/Madam,", normal_style))
    body_intro = "I am writing to formally demand the resolution of the following matter based on my statutory rights:"
    story.append(Paragraph(body_intro, normal_style))
    
    story.append(Paragraph(f"<i>{clean_text}</i>", normal_style))
    
    warning = "You are hereby called upon to rectify this issue and remit the requested amount within <b>15 days</b> of receiving this notice. Failure to comply will leave me with no choice but to initiate appropriate legal proceedings against you in the competent courts, entirely at your risk, cost, and consequence."
    story.append(Paragraph(warning, normal_style))
    story.append(Spacer(1, 30))
    
    story.append(Paragraph("Sincerely,", normal_style))
    story.append(Paragraph("<b>Parth Singh</b><br/>Panvel, Maharashtra<br/>[Insert Phone Number]", normal_style))
    
    doc.build(story)
    return FileResponse(filename, media_type='application/pdf', filename=filename)


# ==========================================
# 6. WHATSAPP ENDPOINTS
# ==========================================
@app.get("/api/whatsapp")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    if hub_mode == "subscribe" and hub_verify_token == "nyaysetu_hackathon":
        return PlainTextResponse(content=hub_challenge, status_code=200)
    return PlainTextResponse(content="Verification failed", status_code=403)

@app.post("/api/whatsapp")
async def handle_whatsapp_message(request: Request):
    try:
        body = await request.json()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error"}

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
