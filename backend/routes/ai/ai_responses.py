from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import logging
from utils.ai_utils import get_ai_response, test_openai_connection
from routes.auth.auth import get_user_id
from fastapi import Request
from models.models import AIResponse
from schemas.schemas import AIResponseCreate, AIResponseHistory
from database import get_db
from sqlalchemy.orm import Session

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai")

@router.post("/generate-response", response_model=AIResponseHistory)
async def generate_ai_response(
    request_data: AIResponseCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Generate AI response for email composition and store in database
    """
    try:
        # Get current user ID
        current_user_id = get_user_id(request.cookies.get("session_id"))
        
        if not current_user_id:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        logger.info(f"Generating AI response for user {current_user_id}")
        logger.info(f"Request data: {request_data}")
        
        # Generate AI response
        ai_response = await get_ai_response(
            prompt=request_data.prompt,
            tone=request_data.tone,
            length=request_data.length,
            email_context=request_data.email_context
        )
        
        # Check for errors in AI response
        if ai_response.startswith(("AI service is not configured", "Authentication failed", 
                                  "Rate limit exceeded", "API error occurred", 
                                  "An unexpected error occurred")):
            raise HTTPException(status_code=500, detail=ai_response)
        
        # Store AI response in database
        db_ai_response = AIResponse(
            user_id=current_user_id,
            prompt=request_data.prompt,
            tone=request_data.tone,
            length=request_data.length,
            email_context=request_data.email_context,
            generated_response=ai_response
        )
        
        db.add(db_ai_response)
        db.commit()
        db.refresh(db_ai_response)
        
        logger.info("AI response generated and stored successfully")
        
        # Return the stored response
        return AIResponseHistory(
            id=db_ai_response.id,
            user_id=db_ai_response.user_id,
            prompt=db_ai_response.prompt,
            tone=db_ai_response.tone,
            length=db_ai_response.length,
            email_context=db_ai_response.email_context,
            generated_response=db_ai_response.generated_response,
            created_at=db_ai_response.created_at,
            updated_at=db_ai_response.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating AI response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/history", response_model=List[AIResponseHistory])
async def get_ai_response_history(
    request: Request,
    db: Session = Depends(get_db),
    limit: int = 10,
    offset: int = 0
):
    """
    Get AI response history for the current user
    """
    try:
        current_user_id = get_user_id(request.cookies.get("session_id"))
        
        if not current_user_id:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        # Get AI responses for the user, ordered by most recent
        ai_responses = db.query(AIResponse)\
            .filter(AIResponse.user_id == current_user_id)\
            .order_by(AIResponse.created_at.desc())\
            .offset(offset)\
            .limit(limit)\
            .all()
        
        # Convert to response model
        history = []
        for response in ai_responses:
            history.append(AIResponseHistory(
                id=response.id,
                user_id=response.user_id,
                prompt=response.prompt,
                tone=response.tone,
                length=response.length,
                email_context=response.email_context,
                generated_response=response.generated_response,
                created_at=response.created_at,
                updated_at=response.updated_at
            ))
        
        return history
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching AI response history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/test-connection")
async def test_ai_connection():
    """
    Test OpenAI API connection
    """
    try:
        connection_status = await test_openai_connection()
        return connection_status
        
    except Exception as e:
        logger.error(f"Error testing AI connection: {str(e)}")
        return {
            "status": "error",
            "message": f"Connection test failed: {str(e)}",
            "configured": False,
            "error": str(e)
        }

@router.get("/health")
async def ai_health_check():
    """
    Health check endpoint for AI service
    """
    return {
        "status": "healthy",
        "service": "AI Response Generator",
        "message": "AI service is running"
    }
