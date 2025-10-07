from fastapi import APIRouter, Depends, HTTPException, Query, Body, Request
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import json
import logging

logger = logging.getLogger(__name__)

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from models import models
from schemas import schemas
from database import get_db
from routes.auth.session import get_user_id  # Add this import



router = APIRouter(prefix="/emails")


# Request models for specific operations
class EmailActionRequest(BaseModel):
    action: str
    data: Dict[str, Any] = {}


class BulkActionRequest(BaseModel):
    email_ids: List[int]
    action: str
    data: Dict[str, Any] = {}


class EmailSearchRequest(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    read: Optional[bool] = None
    starred: Optional[bool] = None
    page: int = 1
    page_size: int = 20




@router.get("/list", response_model=schemas.PaginatedEmailResponse)
def list_emails(
    request: Request,  # Add request parameter
    q: Optional[str] = Query(None, description="Search by subject, sender, or body"),
    label: Optional[str] = Query(None, description="Filter by label (inbox, starred, important, sent, etc.)"),
    category: Optional[str] = Query(None, description="Filter by Gmail category (Primary, Social, Promotions, etc.)"),
    read: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query("recent", description="Sort by: recent, oldest, subject, sender"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),  # Changed from 20 to 50 to match frontend
    db: Session = Depends(get_db),
):
    """List emails with filtering and pagination using the new label system"""
    # Get current user ID from session
    current_user_id = get_user_id(request.cookies.get("session_id"))
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Start with base query for user's emails
    query = db.query(models.Email).filter(models.Email.user_id == current_user_id)
    
    # Debug: Check what's in the database
    debug_emails = db.query(models.Email).filter(models.Email.user_id == current_user_id).limit(5).all()
    for debug_email in debug_emails:
        logger.info(f"Debug - Email {debug_email.id}: labels = {debug_email.labels} (type: {type(debug_email.labels)})")

    if q:
        like = f"%{q}%"
        query = query.filter(
            (models.Email.subject.ilike(like))
            | (models.Email.sender.ilike(like))
            | (models.Email.body.ilike(like))
        )

    # Filter by label (system labels like inbox, starred, important, sent, etc.)
    if label:
        # Check if this is a category label (starts with 'category_')
        if label.startswith('category_'):
            # For category labels, we need emails with BOTH 'inbox' AND the category label
            query = query.filter(
                models.Email.labels.contains('"inbox"'),
                models.Email.labels.contains(f'"{label}"')
            )
        else:
            # For system labels, just filter by the single label
            query = query.filter(
                models.Email.labels.contains(f'"{label}"')
            )

    # Filter by Gmail category (stored as labels like "category_primary", "category_social")
    if category:
        query = query.filter(
            models.Email.labels.isnot(None),
            models.Email.labels.contains(f'"category_{category}"')
        )

    if read is not None:
        query = query.filter(models.Email.read == read)

    # Get total count before pagination
    total_count = query.count()

    # Apply sorting based on user preference
    logger.info(f"🔍 Email listing: Applying sort_by = '{sort_by}'")
    
    if sort_by == "recent" or sort_by is None:
        # Default: Sort by most recent activity (updated_at or created_at)
        # This ensures newest emails appear at the top
        query = query.order_by(
            models.Email.updated_at.desc().nullslast(),
            models.Email.created_at.desc().nullslast()
        )
        logger.info("🔍 Email listing: Sorting by most recent (updated_at DESC, created_at DESC)")
    elif sort_by == "oldest":
        # Sort by oldest first
        query = query.order_by(
            models.Email.updated_at.asc().nullslast(),
            models.Email.created_at.asc().nullslast()
        )
        logger.info("🔍 Email listing: Sorting by oldest (updated_at ASC, created_at ASC)")
    elif sort_by == "subject":
        # Sort alphabetically by subject
        query = query.order_by(models.Email.subject.asc())
        logger.info("🔍 Email listing: Sorting by subject (ASC)")
    elif sort_by == "sender":
        # Sort alphabetically by sender
        query = query.order_by(models.Email.sender.asc())
        logger.info("🔍 Email listing: Sorting by sender (ASC)")
    elif sort_by == "received":
        # Sort by received date (newest first)
        query = query.order_by(models.Email.received_at.desc().nullslast())
        logger.info("🔍 Email listing: Sorting by received date (DESC)")
    else:
        # Fallback to recent sorting
        query = query.order_by(
            models.Email.updated_at.desc().nullslast(),
            models.Email.created_at.desc().nullslast()
        )
        logger.info("🔍 Email listing: Fallback sorting by most recent")

    # Apply pagination
    emails = query.offset((page - 1) * page_size).limit(page_size).all()

    # Parse JSON labels for each email
    for email in emails:
        if email.labels:
            try:
                # Parse the JSON string to get labels array
                email.labels = json.loads(email.labels)
            except (json.JSONDecodeError, TypeError):
                # If parsing fails, set to empty array
                email.labels = []
        else:
            email.labels = []

    return {
        "results": emails,
        "totalEmails": total_count,
        "currentPage": page,
        "pageSize": page_size,
        "totalPages": (total_count + page_size - 1) // page_size
    }


@router.get("/get/{email_id}", response_model=schemas.EmailResponse)
def get_email(email_id: int, db: Session = Depends(get_db)):
    """Get a specific email by ID"""
    email = db.query(models.Email).filter(models.Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    return email


@router.post("/create", response_model=schemas.EmailResponse)
def create_email(payload: schemas.EmailCreate, request: Request, db: Session = Depends(get_db)):
    """Create a new email"""
    logger.info(f"🔍 Backend: Creating email for user")
    logger.info(f"🔍 Backend: Payload received: {payload}")
    logger.info(f"🔍 Backend: Payload type: {type(payload)}")
    logger.info(f"🔍 Backend: Payload dict: {payload.dict()}")
    
    # Get current user ID from session
    current_user_id = get_user_id(request.cookies.get("session_id"))
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Use provided labels or initialize default labels
    if payload.labels and len(payload.labels) > 0:
        labels = payload.labels
    else:
        # Default labels based on email type
        if payload.status == "sent":
            labels = ["sent"]
        elif payload.status == "draft":
            labels = ["draft"]
        else:
            labels = ["inbox"]
    
    # Add category label if provided (but not for forward/reply emails)
    if hasattr(payload, "category") and payload.category and payload.status != "sent":
        category_label = f"category_{payload.category.lower()}"
        if category_label not in labels:
         labels.append(category_label)
    
    # Check if there are attachments
    has_attachments = hasattr(payload, 'attachments') and payload.attachments and len(payload.attachments) > 0
    
    # Debug logging for attachments
    logger.info(f"🔍 Backend Debug - payload.attachments exists: {hasattr(payload, 'attachments')}")
    logger.info(f"🔍 Backend Debug - payload.attachments value: {payload.attachments if hasattr(payload, 'attachments') else 'None'}")
    logger.info(f"🔍 Backend Debug - payload.attachments type: {type(payload.attachments) if hasattr(payload, 'attachments') else 'None'}")
    logger.info(f"🔍 Backend Debug - payload.attachments length: {len(payload.attachments) if hasattr(payload, 'attachments') and payload.attachments else 0}")
    logger.info(f"🔍 Backend Debug - has_attachments: {has_attachments}")
    
    # For locally created emails (forward/reply), we want to sync them to Gmail later
    # This ensures the email appears in the user's Gmail Sent folder
    
    email = models.Email(
        sender=payload.sender,
        to_recipients=payload.to_recipients,
        subject=payload.subject,
        body=payload.body,
        received_at=payload.received_at or datetime.now(),
        auto_reply=payload.auto_reply or "",
        labels=json.dumps(labels),
        in_reply_to=payload.in_reply_to,
        thread_id=payload.thread_id,
        forwarded_from=payload.forwarded_from,
        user_id=current_user_id,
        has_attachment=bool(has_attachments),  # Ensure it's a boolean
        needs_gmail_sync=True  # Set to True for locally created emails to sync to Gmail later
    )
    db.add(email)
    db.commit()
    db.refresh(email)
    
    # Handle attachments if present
    if has_attachments:
        logger.info(f"🔍 Backend Debug - Processing {len(payload.attachments)} attachments")
        try:
            for i, attachment_data in enumerate(payload.attachments):
                logger.info(f"🔍 Backend Debug - Processing attachment {i}: {attachment_data}")
                
                # Create attachment record
                attachment = models.EmailAttachment(
                    email_id=email.id,
                    filename=attachment_data.filename,
                    mime_type=attachment_data.mime_type,
                    size=attachment_data.size,
                    content_id=attachment_data.content_id,
                    is_inline=attachment_data.is_inline,
                    data=attachment_data.data  # Base64 encoded data
                )
                db.add(attachment)
                logger.info(f"🔍 Backend Debug - Added attachment {i} to database session")
            
            db.commit()
            logger.info(f"🔍 Backend Debug - Successfully committed {len(payload.attachments)} attachments for email {email.id}")
            
        except Exception as e:
            logger.error(f"🔍 Backend Debug - Error creating attachments for email {email.id}: {str(e)}")
            logger.error(f"🔍 Backend Debug - Exception type: {type(e)}")
            import traceback
            logger.error(f"🔍 Backend Debug - Full traceback: {traceback.format_exc()}")
            # Don't fail the email creation, just log the attachment error
    
    # If this is a sent email (reply or forward), actually send it
    if payload.status == "sent" and payload.to_recipients and payload.sender:
        try:
            # Import required functions at the top
            from utils.email_utils import send_email_via_gmail_api, send_email
            from routes.gmail.gmail import refresh_gmail_access_token
            
            # First, try to send via Gmail API if user has Gmail connection
            gmail_connection = db.query(models.GmailConnection).filter(
                models.GmailConnection.user_id == current_user_id
            ).first()
            
            if gmail_connection and gmail_connection.access_token:
                # Check if Gmail token is still valid by testing it
                try:
                    # Test Gmail API connection first
                    import httpx
                    test_url = "https://gmail.googleapis.com/gmail/v1/users/me/profile"
                    headers = {'Authorization': f'Bearer {gmail_connection.access_token}'}
                    
                    with httpx.Client() as client:
                        test_response = client.get(test_url, headers=headers)
                        
                    if test_response.status_code == 200:
                        # Token is valid, use Gmail API
                        logger.info(f"🔍 Backend: Sending email via Gmail API - sender: {payload.sender}, to: {payload.to_recipients}")
                        
                        gmail_success = send_email_via_gmail_api(
                            to_email=payload.to_recipients,
                            subject=payload.subject,
                            body=payload.body,
                            from_email=payload.sender,
                            access_token=gmail_connection.access_token,
                            attachments=payload.attachments if hasattr(payload, 'attachments') else None
                        )
                        
                        if gmail_success:
                            logger.info(f"Email sent successfully via Gmail API to {payload.to_recipients}")
                        else:
                            logger.warning(f"Gmail API failed, falling back to SMTP")
                            raise Exception("Gmail API failed")
                    else:
                        # Token is invalid/expired, try to refresh it
                        logger.warning(f"Gmail token invalid (status: {test_response.status_code}), attempting to refresh...")
                        try:
                            refreshed_connection = refresh_gmail_access_token(db, gmail_connection)
                            
                            # Verify the refreshed token works
                            test_refresh_url = "https://gmail.googleapis.com/gmail/v1/users/me/profile"
                            refresh_headers = {'Authorization': f'Bearer {refreshed_connection.access_token}'}
                            
                            with httpx.Client() as refresh_client:
                                refresh_test_response = refresh_client.get(test_refresh_url, headers=refresh_headers)
                            
                            if refresh_test_response.status_code == 200:
                                # Refreshed token is valid, try Gmail API again
                                logger.info(f"🔍 Backend: Retrying with refreshed token - sender: {payload.sender}, to: {payload.to_recipients}")
                                
                                gmail_success = send_email_via_gmail_api(
                                    to_email=payload.to_recipients,
                                    subject=payload.subject,
                                    body=payload.body,
                                    from_email=payload.sender,
                                    access_token=refreshed_connection.access_token,
                                    attachments=payload.attachments if hasattr(payload, 'attachments') else None
                                )
                                
                                if gmail_success:
                                    logger.info(f"Email sent successfully via Gmail API with refreshed token to {payload.to_recipients}")
                                else:
                                    logger.warning(f"Gmail API failed even with refreshed token, falling back to SMTP")
                                    raise Exception("Gmail API failed even with refreshed token")
                            else:
                                logger.warning(f"Refreshed token still invalid (status: {refresh_test_response.status_code}), falling back to SMTP")
                                raise Exception("Refreshed token invalid")
                                
                        except Exception as refresh_error:
                            logger.warning(f"Failed to refresh Gmail token: {str(refresh_error)}, falling back to SMTP")
                            raise Exception("Gmail token refresh failed")
                        
                except Exception as gmail_error:
                    logger.warning(f"Gmail API test failed: {str(gmail_error)}, falling back to SMTP")
                    raise Exception("Gmail API test failed")
                    
            else:
                # No Gmail connection, use SMTP
                raise Exception("No Gmail connection")
                
        except Exception as e:
            # Fall back to SMTP
            try:
                logger.info(f"🔍 Backend: Falling back to SMTP - sender: {payload.sender}, to: {payload.to_recipients}")
                
                # Send the email via SMTP with attachments
                smtp_success = send_email(
                    to_email=payload.to_recipients,
                    subject=payload.subject,
                    body=payload.body,
                    from_email=payload.sender,
                    attachments=payload.attachments if hasattr(payload, 'attachments') else None
                )
                
                if not smtp_success:
                    logger.warning(f"Email saved to database but failed to send via SMTP to {payload.to_recipients}")
                else:
                    logger.info(f"Email sent successfully via SMTP to {payload.to_recipients}")
                    
            except Exception as smtp_error:
                logger.error(f"Error sending email via SMTP: {str(smtp_error)}")
                # Don't fail the request, just log the error
    
    return email


@router.put("/update/{email_id}", response_model=schemas.EmailResponse)
def update_email(email_id: int, payload: schemas.EmailCreate, db: Session = Depends(get_db)):
    """Update an existing email"""
    email = db.query(models.Email).filter(models.Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    # Allow updating basic fields
    for field in ["sender", "subject", "body", "auto_reply", "read"]:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(email, field, val)
    
    # Handle category updates using labels
    if hasattr(payload, 'category') and payload.category:
        # Parse existing labels
        current_labels = []
        if email.labels:
            try:
                current_labels = json.loads(email.labels)
            except (json.JSONDecodeError, TypeError):
                current_labels = []
        
        # Remove existing category labels
        current_labels = [label for label in current_labels if not label.startswith("category_")]
        
        # Add new category label
        category_label = f"category_{payload.category.lower()}"
        if category_label not in current_labels:
            current_labels.append(category_label)
        
        # Update labels field
        email.labels = json.dumps(current_labels)
    
    # Handle starring using labels
    if hasattr(payload, 'starred') and payload.starred is not None:
        # Parse existing labels
        current_labels = []
        if email.labels:
            try:
                current_labels = json.loads(email.labels)
            except (json.JSONDecodeError, TypeError):
                current_labels = []
        
        if payload.starred:
            # Add starred label if not already present
            if "starred" not in current_labels:
                current_labels.append("starred")
        else:
            # Remove starred label if present
            if "starred" in current_labels:
                current_labels.remove("starred")
        
        # Update labels field
        email.labels = json.dumps(current_labels)
    
    # Mark for Gmail sync if email was previously synced
    if email.gmail_id:
        email.needs_gmail_sync = True

    db.commit()
    db.refresh(email)
    return email


@router.delete("/delete/{email_id}")
def delete_email(email_id: int, db: Session = Depends(get_db)):
    """Delete an email - marks for Gmail sync if it was synced"""
    from datetime import datetime
    
    email = db.query(models.Email).filter(models.Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    # If email was synced to Gmail, mark for deletion sync instead of immediate deletion
    if email.gmail_id:
        logger.info(f"Email '{email.subject}' was synced to Gmail, marking for deletion sync")
        email.is_deleted = True
        email.deleted_at = datetime.now()
        email.needs_gmail_sync = True
        db.commit()
        return {"message": "Email marked for deletion and will be removed from Gmail"}
    else:
        # Email was never synced, delete immediately
        db.delete(email)
        db.commit()
        return {"message": "Email deleted successfully"}


@router.post("/{email_id}/action")
async def perform_email_action(
    email_id: int,
    action_data: dict,
    request: Request,
    db: Session = Depends(get_db)
):
    """Perform an action on an email (star, categorize, archive, move to trash, mark read)"""
    current_user_id = get_user_id(request.cookies.get("session_id"))
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    email = db.query(models.Email).filter(
        models.Email.id == email_id,
        models.Email.user_id == current_user_id
    ).first()
    
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    action = action_data.get("action")
    data = action_data.get("data", {})
    
    try:
        if action == "star":
            # Handle starring/unstarring using labels
            starred = data.get("starred", False)
            
            # Parse existing labels
            current_labels = []
            if email.labels:
                try:
                    current_labels = json.loads(email.labels)
                except (json.JSONDecodeError, TypeError):
                    current_labels = []
            
            if starred:
                # Add starred label if not already present
                if "starred" not in current_labels:
                    current_labels.append("starred")
                    logger.info(f"Added starred label to email {email_id}")
            else:
                # Remove starred label if present
                if "starred" in current_labels:
                    current_labels.remove("starred")
                    logger.info(f"Removed starred label from email {email_id}")
            
            # Update labels field
            email.labels = json.dumps(current_labels)
            
            # Note: starred field removed, using labels instead
            
        elif action == "categorize":
            # Update Gmail category using labels
            category = data.get("category")
            if category:
                # Parse existing labels
                current_labels = []
                if email.labels:
                    try:
                        current_labels = json.loads(email.labels)
                    except (json.JSONDecodeError, TypeError):
                        current_labels = []
                
                # Remove existing category labels
                current_labels = [label for label in current_labels if not label.startswith("category_")]
                
                # Add new category label
                category_label = f"category_{category.lower()}"
                if category_label not in current_labels:
                    current_labels.append(category_label)
                
                # Update labels field
                email.labels = json.dumps(current_labels)
                logger.info(f"Updated email {email_id} category to {category} using labels")
        
        elif action == "archive":
            # Parse existing labels
            current_labels = []
            if email.labels:
                try:
                    current_labels = json.loads(email.labels)
                except (json.JSONDecodeError, TypeError):
                    current_labels = []
            
            # Add archived label if not already present
            if "archived" not in current_labels:
                current_labels.append("archived")
                logger.info(f"Added archived label to email {email_id}")
            
            # Remove from inbox if it was there
            if "inbox" in current_labels:
                current_labels.remove("inbox")
                logger.info(f"Removed inbox label from email {email_id}")
            
            # Update labels field
            email.labels = json.dumps(current_labels)
        
        elif action == "move_to_trash":
            # Parse existing labels
            current_labels = []
            if email.labels:
                try:
                    current_labels = json.loads(email.labels)
                except (json.JSONDecodeError, TypeError):
                    current_labels = []
            
            # Add trash label if not already present
            if "trash" not in current_labels:
                current_labels.append("trash")
                logger.info(f"Added trash label to email {email_id}")
            
            # Remove from inbox if it was there
            if "inbox" in current_labels:
                current_labels.remove("inbox")
                logger.info(f"Removed inbox label from email {email_id}")
            
            # Update labels field
            email.labels = json.dumps(current_labels)
        
        elif action == "restore_from_trash":
            # Restore email from trash to specified label
            previous_label = data.get("previous_label", "inbox")
            
            # Parse existing labels
            current_labels = []
            if email.labels:
                try:
                    current_labels = json.loads(email.labels)
                except (json.JSONDecodeError, TypeError):
                    current_labels = []
            
            # Remove trash label
            if "trash" in current_labels:
                current_labels.remove("trash")
                logger.info(f"Removed trash label from email {email_id}")
            
            # Add the previous label (inbox, spam, category_social, etc.)
            if previous_label not in current_labels:
                current_labels.append(previous_label)
                logger.info(f"Added {previous_label} label to email {email_id}")
            
            # Update labels field
            email.labels = json.dumps(current_labels)
        
        elif action == "mark_read":
            # Mark as read/unread
            read_status = data.get("read", True)
            email.read = read_status
            
            # Parse existing labels
            current_labels = []
            if email.labels:
                try:
                    current_labels = json.loads(email.labels)
                except (json.JSONDecodeError, TypeError):
                    current_labels = []
            
            # Update labels accordingly
            if read_status:
                # Remove unread label
                if "unread" in current_labels:
                    current_labels.remove("unread")
                    logger.info(f"Removed unread label from email {email_id}")
            else:
                # Add unread label
                if "unread" not in current_labels:
                    current_labels.append("unread")
                    logger.info(f"Added unread label to email {email_id}")
            
            # Update labels field
            email.labels = json.dumps(current_labels)
        
        # Mark email as needing Gmail sync if it has a Gmail ID
        if email.gmail_id:
            email.needs_gmail_sync = True
            logger.info(f"Marked email {email_id} as needing Gmail sync")
            
            # Note: Gmail sync will be handled by the dedicated sync endpoint
            # to avoid circular import issues
        
        db.commit()
        
        return {
            "message": f"Action {action} performed successfully",
            "email_id": email_id,
            "action": action,
            "needs_gmail_sync": email.needs_gmail_sync,
            "gmail_synced": not email.needs_gmail_sync
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to perform action {action} on email {email_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to perform action: {str(e)}")


@router.post("/bulk-action")
def perform_bulk_action(
    bulk_request: BulkActionRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Perform actions on multiple emails using the new label system"""
    # Get current user ID from session
    current_user_id = get_user_id(request.cookies.get("session_id"))
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    emails = db.query(models.Email).filter(models.Email.id.in_(bulk_request.email_ids)).all()
    if not emails:
        raise HTTPException(status_code=404, detail="No emails found")

    action = bulk_request.action.lower()
    data = bulk_request.data
    updated_count = 0

    for email in emails:
        if action == "mark_read":
            email.read = data.get("read", True)
        elif action == "star":
            # Add or remove 'starred' label
            # Parse existing labels
            current_labels = []
            if email.labels:
                try:
                    current_labels = json.loads(email.labels)
                except (json.JSONDecodeError, TypeError):
                    current_labels = []
            
            if data.get("starred", True):
                # Add starred label if not already present
                if "starred" not in current_labels:
                    current_labels.append("starred")
            else:
                # Remove starred label if present
                if "starred" in current_labels:
                    current_labels.remove("starred")
            
            # Update labels field
            email.labels = json.dumps(current_labels)
        elif action == "categorize":
            # Update Gmail category using labels
            category = data.get("category", "Primary")
            # Parse existing labels
            current_labels = []
            if email.labels:
                try:
                    current_labels = json.loads(email.labels)
                except (json.JSONDecodeError, TypeError):
                    current_labels = []
            
            # Remove existing category labels
            current_labels = [label for label in current_labels if not label.startswith("category_")]
            
            # Add new category label
            category_label = f"category_{category.lower()}"
            if category_label not in current_labels:
                current_labels.append(category_label)
            
            # Update labels field
            email.labels = json.dumps(current_labels)
        elif action == "archive":
            # Add archived label
            # Parse existing labels
            current_labels = []
            if email.labels:
                try:
                    current_labels = json.loads(email.labels)
                except (json.JSONDecodeError, TypeError):
                    current_labels = []
            
            # Add archived label if not already present
            if "archived" not in current_labels:
                current_labels.append("archived")
            
            # Update labels field
            email.labels = json.dumps(current_labels)
        elif action == "restore_from_trash":
            # Restore email from trash to specified label
            previous_label = data.get("previous_label", "inbox")
            
            # Parse existing labels
            current_labels = []
            if email.labels:
                try:
                    current_labels = json.loads(email.labels)
                except (json.JSONDecodeError, TypeError):
                    current_labels = []
            
            # Remove trash label
            if "trash" in current_labels:
                current_labels.remove("trash")
            
            # Add the previous label (inbox, spam, category_social, etc.)
            if previous_label not in current_labels:
                current_labels.append(previous_label)
            
            # Update labels field
            email.labels = json.dumps(current_labels)
        elif action == "move_to_trash":
            # Add trash label
            # Parse existing labels
            current_labels = []
            if email.labels:
                try:
                    current_labels = json.loads(email.labels)
                except (json.JSONDecodeError, TypeError):
                    current_labels = []
            
            # Add trash label if not already present
            if "trash" not in current_labels:
                current_labels.append("trash")
            
            # Update labels field
            email.labels = json.dumps(current_labels)
        elif action == "delete":
            db.delete(email)
        else:
            continue
        
        # Mark email as needing Gmail sync if it has a Gmail ID
        if hasattr(email, 'gmail_id') and email.gmail_id:
            email.needs_gmail_sync = True
            logger.info(f"Marked email {email.id} as needing Gmail sync")
            
            # Note: Gmail sync will be handled by the dedicated sync endpoint
            # to avoid circular import issues
        
        updated_count += 1

    db.commit()
    return {"message": f"Bulk action '{action}' performed on {updated_count} emails"}


@router.get("/stats")
def get_email_stats(db: Session = Depends(get_db)):
    """Get email statistics using the new label system"""
    total_emails = db.query(models.Email).count()
    unread_emails = db.query(models.Email).filter(models.Email.read == False).count()
    
    # Count emails by labels (using JSON labels field)
    starred_emails = db.query(models.Email).filter(
        models.Email.labels.contains('"starred"')
    ).count()
    
    archived_emails = db.query(models.Email).filter(
        models.Email.labels.contains('"archived"')
    ).count()
    
    trash_emails = db.query(models.Email).filter(
        models.Email.labels.contains('"trash"')
    ).count()
    
    # Category counts (Gmail categories stored as labels like "category_primary", "category_social")
    category_stats = {}
    category_labels = ["category_primary", "category_social", "category_promotions", "category_updates", "category_forums"]
    
    for cat_label in category_labels:
        count = db.query(models.Email).filter(
            models.Email.labels.contains(f'"{cat_label}"')
        ).count()
        category_name = cat_label.replace("category_", "").title()
        category_stats[category_name] = count
    
    return {
        "total": total_emails,
        "unread": unread_emails,
        "starred": starred_emails,
        "archived": archived_emails,
        "trash": trash_emails,
        "categories": category_stats
    }


@router.get("/search")
def search_emails(
    q: str = Query(..., description="Search query"),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Advanced email search"""
    query = db.query(models.Email)
    
    if q:
        like = f"%{q}%"
        query = query.filter(
            (models.Email.subject.ilike(like))
            | (models.Email.sender.ilike(like))
            | (models.Email.body.ilike(like))
        )

    if category:
        query = query.filter(
            models.Email.labels.contains(f'"category_{category}"')
        )

    query = query.order_by(models.Email.received_at.desc())
    results = query.limit(50).all()
    
    return {
        "query": q,
        "results": results,
        "count": len(results)
    }


@router.post("/mark-all-read")
def mark_all_as_read(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Mark all emails in a category as read"""
    query = db.query(models.Email).filter(models.Email.read == False)
    
    if category:
        query = query.filter(
            models.Email.labels.contains(f'"category_{category}"')
        )
    
    emails = query.all()
    for email in emails:
        email.read = True
    
    db.commit()
    return {"message": f"Marked {len(emails)} emails as read"}


@router.get("/categories")
def get_email_categories(db: Session = Depends(get_db)):
    """Get all available email categories from labels"""
    # Get all emails and extract category labels
    all_emails = db.query(models.Email).all()
    categories = set()
    
    for email in all_emails:
        if email.labels:
            try:
                labels = json.loads(email.labels)
                if isinstance(labels, list):
                    for label in labels:
                        if label.startswith("category_"):
                            category_name = label.replace("category_", "").title()
                            categories.add(category_name)
            except (json.JSONDecodeError, TypeError):
                continue
    
    return list(categories)


@router.post("/{email_id}/labels")
async def add_label_to_email(
    email_id: int,
    label_data: dict,
    request: Request,
    db: Session = Depends(get_db)
):
    """Add a label to an email"""
    try:
        # Get current user ID from session
        current_user_id = get_user_id(request.cookies.get("session_id"))
        if not current_user_id:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Get the email
        email = db.query(models.Email).filter(
            models.Email.id == email_id,
            models.Email.user_id == current_user_id
        ).first()
        
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        
        # Parse existing labels
        current_labels = []
        if email.labels:
            try:
                current_labels = json.loads(email.labels)
            except (json.JSONDecodeError, TypeError):
                current_labels = []
        
        # Check if label already exists
        if label_data["label_name"] in current_labels:
            return {"message": "Label already exists", "email_id": email_id, "label": label_data["label_name"]}
        
        # Add new label
        current_labels.append(label_data["label_name"])
        email.labels = json.dumps(current_labels)
        
        db.commit()
        
        return {"message": "Label added successfully", "email_id": email_id, "label": label_data["label_name"]}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{email_id}/labels/{label_name}")
async def remove_label_from_email(
    email_id: int,
    label_name: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Remove a label from an email"""
    try:
        # Get current user ID from session
        current_user_id = get_user_id(request.cookies.get("session_id"))
        if not current_user_id:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Get the email
        email = db.query(models.Email).filter(
            models.Email.id == email_id,
            models.Email.user_id == current_user_id
        ).first()
        
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        
        # Parse existing labels
        current_labels = []
        if email.labels:
            try:
                current_labels = json.loads(email.labels)
            except (json.JSONDecodeError, TypeError):
                current_labels = []
        
        # Check if label exists
        if label_name not in current_labels:
            raise HTTPException(status_code=404, detail="Label not found")
        
        # Remove the label
        current_labels.remove(label_name)
        email.labels = json.dumps(current_labels)
        
        db.commit()
        
        return {"message": "Label removed successfully", "email_id": email_id, "label": label_name}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/labels")
async def get_user_labels(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all labels for the current user"""
    try:
        # Get current user ID from session
        current_user_id = get_user_id(request.cookies.get("session_id"))
        if not current_user_id:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Get all unique labels from the user's emails
        user_emails = db.query(models.Email).filter(models.Email.user_id == current_user_id).all()
        
        # Collect all labels from emails
        all_labels = set()
        for email in user_emails:
            if email.labels:
                try:
                    labels = json.loads(email.labels)
                    if isinstance(labels, list):
                        all_labels.update(labels)
                except (json.JSONDecodeError, TypeError):
                    continue
        
        # Group labels by type (simplified approach)
        system_labels = []
        category_labels = []
        custom_labels = []
        
        for label in all_labels:
            if label in ["inbox", "sent", "starred", "trash", "spam", "archived", "important", "unread", "draft"]:
                system_labels.append(label)
            elif label in ["primary", "social", "promotions", "updates", "forums"]:
                category_labels.append(label)
            else:
                custom_labels.append(label)
        
        return {
            "system_labels": system_labels,
            "category_labels": category_labels,
            "custom_labels": custom_labels
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




