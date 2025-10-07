import openai
import os
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# OpenAI Configuration
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Configure OpenAI client
if OPENAI_KEY:
    client = openai.OpenAI(api_key=OPENAI_KEY)
    logger.info("OpenAI API key loaded successfully")
else:
    logger.warning("OpenAI API key not found in environment variables")
    client = None

async def get_ai_response(
    prompt: str, 
    tone: str = "professional",
    length: str = "medium",
    email_context: Optional[str] = None
) -> str:
    """
    Generate AI response using OpenAI API
    
    Args:
        prompt (str): The main prompt/request
        tone (str): Desired tone (professional, friendly, formal, casual, enthusiastic)
        length (str): Desired length (short, medium, long)
        email_context (str, optional): Email context for better responses
    
    Returns:
        str: Generated AI response
    """
    if not OPENAI_KEY or not client:
        logger.error("OpenAI API key not configured")
        return "AI service is not configured. Please check your OpenAI API key."
    
    try:
        # Build the enhanced prompt
        enhanced_prompt = build_enhanced_prompt(prompt, tone, length, email_context)
        
        logger.info(f"Generating AI response with tone: {tone}, length: {length}")
        
        # Make API call to OpenAI using new API format
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {
                    "role": "system", 
                    "content": "You are a professional email assistant. Generate helpful, contextually appropriate email responses."
                },
                {
                    "role": "user", 
                    "content": enhanced_prompt
                }
            ],
            max_tokens=get_max_tokens(length),
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content.strip()
        logger.info("AI response generated successfully")
        
        return ai_response
        
    except openai.AuthenticationError:
        logger.error("OpenAI authentication failed - check your API key")
        return "Authentication failed. Please check your OpenAI API configuration."
        
    except openai.RateLimitError:
        logger.error("OpenAI rate limit exceeded")
        return "Rate limit exceeded. Please try again in a moment."
        
    except openai.APIError as e:
        logger.error(f"OpenAI API error: {str(e)}")
        return f"API error occurred: {str(e)}"
        
    except Exception as e:
        logger.error(f"Unexpected error in AI response generation: {str(e)}")
        return "An unexpected error occurred while generating the response."

def build_enhanced_prompt(prompt: str, tone: str, length: str, email_context: Optional[str] = None) -> str:
    """
    Build an enhanced prompt with tone, length, and context instructions
    """
    tone_instructions = {
        "professional": "Use a professional, business-like tone",
        "friendly": "Use a warm, approachable, and friendly tone",
        "formal": "Use a formal, respectful, and proper tone",
        "casual": "Use a relaxed, informal, and conversational tone",
        "enthusiastic": "Use an energetic, positive, and enthusiastic tone"
    }
    
    length_instructions = {
        "short": "Keep the response brief (1-2 sentences)",
        "medium": "Provide a moderate response (3-4 sentences)",
        "long": "Give a detailed response (5+ sentences)"
    }
    
    enhanced_prompt = f"""
    Please generate an email response with the following requirements:
    
    Tone: {tone_instructions.get(tone, 'professional')}
    Length: {length_instructions.get(length, 'medium')}
    
    User Request: {prompt}
    """
    
    if email_context:
        enhanced_prompt += f"\nEmail Context: {email_context}\n"
    
    enhanced_prompt += """
    Instructions:
    - Make the response appropriate for the specified tone
    - Ensure the length matches the requested format
    - Be helpful, clear, and professional
    - If this is a reply to an email, make it contextually relevant
    - End with an appropriate closing
    """
    
    return enhanced_prompt

def get_max_tokens(length: str) -> int:
    """
    Get appropriate max_tokens based on desired length
    """
    length_tokens = {
        "short": 100,
        "medium": 200,
        "long": 400
    }
    return length_tokens.get(length, 200)

async def get_task_importance(title: str, description: str, priority: str = None, category: str = None) -> int:
    """
    Analyze task importance using AI with enhanced context
    
    Args:
        title (str): Task title
        description (str): Task description
        priority (str, optional): User-specified priority (low/medium/high)
        category (str, optional): Task category (work, personal, meeting, etc.)
    
    Returns:
        int: Importance level (1 = Low, 2 = Medium, 3 = High)
    """
    # Build enhanced prompt with additional context
    prompt = f"""
    Analyze this task and assign importance (1 = Low, 2 = Medium, 3 = High):
    
    Task Title: {title}
    Task Description: {description}
    """
    
    if priority:
        prompt += f"User Priority: {priority}\n"
    
    if category:
        prompt += f"Task Category: {category}\n"
    
    prompt += """
    Instructions:
    - Consider the user's specified priority if provided
    - Factor in the task category and context
    - Analyze the urgency and impact of the task
    - You can override the user's priority if the AI analysis suggests otherwise
    - Only return 1, 2, or 3 as the answer.
    
    AI Analysis:"""
    
    try:
        if not OPENAI_KEY or not client:
            logger.warning("OpenAI API key not configured for task importance")
            return 2  # Default to medium (2)
        
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {
                    "role": "system", 
                    "content": "You are an intelligent task analyzer. Analyze the task context and assign appropriate importance. Only respond with 1, 2, or 3."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            max_tokens=20,
            temperature=0.2
        )
        
        result = response.choices[0].message.content.strip()
        logger.info(f"AI task importance analysis result: {result}")
        
        # Parse the result and validate
        if result in ['1', '2', '3']:
            return int(result)
        else:
            logger.warning(f"Invalid AI response for task importance: {result}, defaulting to 2")
            return 2
        
    except Exception as e:
        logger.error(f"Error in task importance analysis: {str(e)}")
        return 2  # Default to medium (2)

# Test function to verify OpenAI connection
async def test_openai_connection() -> Dict[str, Any]:
    """
    Test OpenAI API connection and return status
    """
    if not OPENAI_KEY or not client:
        return {
            "status": "error",
            "message": "OpenAI API key not configured",
            "configured": False
        }
    
    try:
        # Simple test call using new API format
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )
        
        return {
            "status": "success",
            "message": "OpenAI API connection successful",
            "configured": True,
            "model": OPENAI_MODEL
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"OpenAI API connection failed: {str(e)}",
            "configured": True,
            "error": str(e)
        }

def get_health_recommendations(health_data: dict) -> dict:
    """
    Generate personalized health recommendations based on user's health data
    """
    try:
        # Create a comprehensive prompt for health recommendations
        prompt = f"""
        As a certified health and wellness expert, analyze this user's health data and provide personalized, actionable recommendations.
        
        User Health Data:
        - BMI: {health_data.get('bmi', 'Not provided')}
        - Daily Water Intake: {health_data.get('water_intake', 0)} glasses (goal: 8 glasses)
        - Sleep Duration: {health_data.get('sleep_hours', 0)} hours (optimal: 7-9 hours)
        - Daily Steps: {health_data.get('steps', 0)} steps (goal: 10,000 steps)
        - Mood Score: {health_data.get('mood_score', 5)}/10
        - Overall Wellness Score: {health_data.get('wellness_score', 0)}/100
        
        Additional Context:
        - Age: {health_data.get('user_age', 'Not provided')}
        - Gender: {health_data.get('user_gender', 'Not provided')}
        - Activity Level: {health_data.get('user_activity_level', 'Not provided')}
        
        Please provide:
        1. A brief health assessment (2-3 sentences)
        2. 3-5 specific, actionable recommendations
        3. Priority level for each recommendation (high/medium/low)
        4. Expected benefits of following each recommendation
        
        Format your response as valid JSON with this structure:
        {{
            "health_assessment": "Brief assessment of current health status",
            "recommendations": [
                {{
                    "category": "nutrition|exercise|sleep|wellness|hydration|mental_health",
                    "title": "Short, actionable title",
                    "description": "Detailed explanation of the recommendation",
                    "priority": "high|medium|low",
                    "action_items": ["Specific action 1", "Specific action 2"],
                    "expected_benefits": "What the user will gain from this",
                    "difficulty": "easy|moderate|challenging"
                }}
            ],
            "overall_priority": "high|medium|low",
            "next_steps": "What the user should focus on first"
        }}
        
        Be encouraging, practical, and specific. Focus on small, achievable changes that can lead to significant improvements.
        """
        
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a certified health and wellness expert with expertise in nutrition, exercise, sleep, and mental health. Provide evidence-based, personalized recommendations that are practical and achievable."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=get_max_tokens("length")
        )
        
        # Extract the response content
        ai_response = response.choices[0].message.content.strip()
        
        # Try to parse JSON response
        try:
            import json
            recommendations = json.loads(ai_response)
            return {
                "success": True,
                "data": recommendations,
                "raw_ai_response": ai_response
            }
        except json.JSONDecodeError:
            # If JSON parsing fails, return the raw response
            return {
                "success": True,
                "data": {
                    "health_assessment": "AI analysis completed",
                    "recommendations": [],
                    "overall_priority": "medium",
                    "next_steps": "Review the detailed recommendations below"
                },
                "raw_ai_response": ai_response
            }
            
    except Exception as e:
        logging.error(f"Error generating health recommendations: {str(e)}")
        return {
            "success": False,
            "error": f"Failed to generate health recommendations: {str(e)}"
        }