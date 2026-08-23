from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

# ---------------------------------------------------------
# NYAYSETU DATABASE ARCHITECTURE (Slide 7)
# ---------------------------------------------------------
# In production, uncomment the PostgreSQL URL:
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/nyaysetu"
# For zero-config local hackathon deployment, we use SQLite.
# SQLAlchemy seamlessly switches between both.
# ---------------------------------------------------------
SQLALCHEMY_DATABASE_URL = "sqlite:///./nyaysetu.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    """
    Satisfies 'audit logging of model decisions' (Slide 6 & 7).
    Every AI transaction is permanently recorded.
    """
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    query = Column(Text)
    response = Column(Text)
    citations = Column(String)
    confidence_score = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
