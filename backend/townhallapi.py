from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, Session
import bcrypt
from datetime import datetime, timedelta
from jose import jwt
import urllib.parse
import random
import json

# --- Configuration ---
# URL encode the password because it contains '@'
password_encoded = urllib.parse.quote_plus("SecureHasuo77@")
DATABASE_URL = f"mssql+pyodbc://townhall_admin:{password_encoded}@townhall-server-s198229.database.windows.net/townhall_db?driver=ODBC+Driver+17+for+SQL+Server"

SECRET_KEY = "CHANGE_THIS_TO_A_ROBUST_KEY_IN_ENV"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- Database Setup ---
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

# --- Database Models ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=False)
    pesel = Column(String(11), nullable=False)
    phone_number = Column(String(20), nullable=False)
    password_hash = Column(String(255), nullable=False)

class RequestEntry(Base):
    __tablename__ = "request"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    subcategory = Column(String)
    status = Column(String)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    description = Column(Text)
    citizen_ID = Column(Integer, ForeignKey("users.id"))


# --- Pydantic Models ---
class UserAuth(BaseModel):
    name: str
    middleName: str | None = None
    surname: str
    pesel: str
    phone: str
    email: EmailStr
    password: str

class LoginModel(BaseModel):
    email: EmailStr
    password: str

class RequestModel(BaseModel):
    type: str
    subcategory: str
    status: str
    submitted_at: datetime
    completed_at: datetime
    description: str
    citizen_ID: int

# --- Security Utils ---
def verify_password(plain, hashed):
    if isinstance(plain, str): plain = plain.encode('utf-8')
    if isinstance(hashed, str): hashed = hashed.encode('utf-8')
    return bcrypt.checkpw(plain, hashed)

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- App & CORS ---
app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:3000",
    "http://localhost:63342",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Endpoints ---

@app.post("/api/register", status_code=201)
def register(user: UserAuth, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    new_user = User(
        email=user.email,
        password_hash=get_password_hash(user.password),
        first_name=user.name,
        middle_name=user.middleName,
        last_name=user.surname,
        pesel=user.pesel,
        phone_number=user.phone
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        print(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "User registered successfully!"}

@app.post("/api/login")
def login(user: LoginModel, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/api/requests", status_code=201)
def submit_request(req: RequestModel, db: Session = Depends(get_db)):
    # Generate ID
    now = datetime.now()
    date_str = now.strftime("%Y%m%d")
    new_req = RequestEntry(
        type = req.type,
        subcategory = req.subcategory,
        status = req.status,
        category=req.category,
        description=req.description,
        submitted_at = Column(DateTime, default=datetime.utcnow),
        completed_at = date_str,
        citizen_ID = Column(Integer, ForeignKey("users.id"))
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    
    return {"message": "Request submitted", "request_id": new_req.id}

# Ensure tables exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Error creating tables: {e}")