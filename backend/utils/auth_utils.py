from sqlalchemy.orm import Session
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from models import User
from passlib.context import CryptContext
import bcrypt

# Use a more compatible password hashing approach
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Fallback function for bcrypt compatibility
def hash_password(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception:
        # Fallback to direct bcrypt if passlib fails
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password_hash(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Fallback to direct bcrypt if passlib fails
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return hash_password(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return verify_password_hash(plain_password, hashed_password)

def get_user_by_email(db: Session, email: str):
    """Get user by email (case-insensitive)"""
    # Convert email to lowercase for case-insensitive search
    email_lower = email.lower()
    return db.query(User).filter(User.email == email_lower).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    # Try to find user by email (case-insensitive) or username
    user = get_user_by_email(db, username) or get_user_by_username(db, username)
    if not user:
        return False

    if not verify_password(password, user.password):
        return False
    return user

def create_user(db: Session, user_data: dict):
    """Create user with email stored in lowercase"""
    # Convert email to lowercase before storing
    if 'email' in user_data:
        user_data['email'] = user_data['email'].lower()
    
    hashed_password = get_password_hash(user_data.pop('password'))
    user = User(**user_data, password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user 