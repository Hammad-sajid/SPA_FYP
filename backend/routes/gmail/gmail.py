from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import httpx
import json
import base64
import email
import re  # Add re import for HTML cleaning
from datetime import datetime, timedelta
import os
import sys
import logging
# logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import bleach # HTML sanitization for Gmail content
from bleach.css_sanitizer import CSSSanitizer

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from models import models
from schemas import schemas
from database import get_db
from routes.auth.session import get_user_id
from config.google import google_config

router = APIRouter(prefix="/gmail")
logger = logging.getLogger(__name__)

class OAuthCallbackRequest(BaseModel):
    code: str

def get_current_user_id(request: Request) -> int:
    """Extract user ID from session cookie"""
    session_id = request.cookies.get("session_id")
    logger.info(f"Gmail - Session ID from cookie: {session_id}")
    
    if not session_id:
        logger.warning("Gmail - No session_id cookie found")
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Use the proper session validation function
    user_id = get_user_id(session_id)
    logger.info(f"Gmail - User ID from session: {user_id}")
    
    if not user_id:
        logger.warning(f"Gmail - Invalid or expired session: {session_id}")
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    
    return user_id

@router.get("/auth-url")
def get_auth_url():
    """Get Google OAuth URL for Gmail access"""
    if not google_config.is_gmail_configured():
        raise HTTPException(status_code=500, detail="Gmail OAuth not configured")
    
    # Build the OAuth URL
    auth_url = (
        f"{google_config.GOOGLE_AUTH_URL}?"
        f"client_id={google_config.get_gmail_client_id()}&"
        f"redirect_uri={google_config.GOOGLE_GMAIL_REDIRECT_URI}&"
        f"scope={google_config.get_gmail_scopes()}&"
        f"response_type=code&"
        f"access_type=offline&"
        f"prompt=consent&"
        f"state=gmail"
    )
    
    return {
        "auth_url": auth_url,
        "auth_required": True
    }

@router.get("/callback")
async def handle_oauth_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    current_user_id = get_current_user_id(request)
    """Handle OAuth callback and redirect to frontend for token exchange"""
    logger.info(f"Gmail - OAuth callback received for user {current_user_id}")
    logger.info(f"Gmail - Request URL: {request.url}")
    logger.info(f"Gmail - Redirect URI: {google_config.GOOGLE_GMAIL_REDIRECT_URI}")
    
    # Parse query parameters
    code = request.query_params.get('code')
    error = request.query_params.get('error')
    state = request.query_params.get('state')
    
    logger.info(f"Gmail - Code: {code[:10] if code else 'None'}...")
    logger.info(f"Gmail - Error: {error}")
    logger.info(f"Gmail - State: {state}")
    
    if error:
        logger.error(f"Gmail - OAuth error: {error}")
        # Redirect to frontend with error
        error_url = f"{google_config.GOOGLE_GMAIL_REDIRECT_URI}?error={error}"
        logger.info(f"Gmail - Redirecting to error URL: {error_url}")
        return RedirectResponse(url=error_url)
    
    if not code:
        logger.error("Gmail - No authorization code received")
        # Redirect to frontend with error
        error_url = f"{google_config.GOOGLE_GMAIL_REDIRECT_URI}?error=no_code"
        logger.info(f"Gmail - Redirecting to error URL: {error_url}")
        return RedirectResponse(url=error_url)
    
    logger.info(f"Gmail - Authorization code received: {code[:10]}...")
    
    # Redirect to frontend with the code and state
    success_url = f"{google_config.GOOGLE_GMAIL_REDIRECT_URI}?code={code}&state={state}"
    logger.info(f"Gmail - Redirecting to success URL: {success_url}")
    return RedirectResponse(url=success_url)

@router.post("/exchange-token")
async def exchange_token_for_gmail(
    oauth_request: OAuthCallbackRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    current_user_id = get_current_user_id(request)
    """Exchange authorization code for tokens (called by frontend)"""
    logger.info(f"Gmail - Token exchange requested for user {current_user_id}")
    logger.info(f"Gmail - Authorization code: {oauth_request.code[:10]}...")
    
    # Validate configuration
    if not google_config.is_gmail_configured():
        logger.error("Gmail - Gmail OAuth not configured")
        raise HTTPException(status_code=500, detail="Gmail OAuth not configured")
    
    # Exchange authorization code for tokens
    token_data = {
        "client_id": google_config.get_gmail_client_id(),
        "client_secret": google_config.get_gmail_client_secret(),
        "code": oauth_request.code,
        "grant_type": "authorization_code",
        "redirect_uri": google_config.GOOGLE_GMAIL_REDIRECT_URI
    }
    
    logger.info("Gmail - Exchanging code for tokens...")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(google_config.GOOGLE_TOKEN_URL, data=token_data)
        
        if response.status_code != 200:
            logger.error(f"Gmail - Token exchange failed: {response.status_code} - {response.text}")
            raise HTTPException(status_code=400, detail="Failed to exchange code for tokens")
        
        tokens = response.json()
        logger.info("Gmail - Tokens received successfully")
        
        # Verify that we received the necessary scopes
        if 'scope' in tokens:
            granted_scopes = tokens['scope'].split(' ')
            logger.info(f"Gmail - Granted scopes: {granted_scopes}")
            
            # Check if we have Gmail access
            required_scopes = [
                "https://www.googleapis.com/auth/gmail.readonly",
                "https://www.googleapis.com/auth/gmail.modify",
                "https://www.googleapis.com/auth/gmail.compose",
                "https://www.googleapis.com/auth/gmail.send"
            ]
            
            has_gmail_access = any(scope in granted_scopes for scope in required_scopes)
            if not has_gmail_access:
                logger.warning("Gmail - OAuth granted but missing Gmail permissions")
                logger.warning(f"Required scopes: {required_scopes}")
                logger.warning(f"Granted scopes: {granted_scopes}")
                raise HTTPException(
                    status_code=400, 
                    detail="OAuth completed but Gmail permissions were not granted. Please try again and ensure you grant Gmail access permission."
                )
        else:
            logger.warning("Gmail - No scope information in token response")
            raise HTTPException(
                status_code=400, 
                detail="OAuth completed but no permission information received. Please try again."
            )
        
        # Calculate token expiry
        expires_in = tokens.get("expires_in", 3600)
        token_expiry = datetime.now() + timedelta(seconds=expires_in)
        
        # Save or update connection in database
        existing_connection = db.query(models.GmailConnection).filter(
            models.GmailConnection.user_id == current_user_id
        ).first()
        
        if existing_connection:
            logger.info(f"Gmail - Updating existing connection for user {current_user_id}")
            existing_connection.access_token = tokens["access_token"]
            existing_connection.refresh_token = tokens.get("refresh_token", existing_connection.refresh_token)
            existing_connection.token_expiry = token_expiry
            existing_connection.updated_at = datetime.now()
        else:
            logger.info(f"Gmail - Creating new connection for user {current_user_id}")
            new_connection = models.GmailConnection(
                user_id=current_user_id,
                access_token=tokens["access_token"],
                refresh_token=tokens.get("refresh_token", ""),
                token_expiry=token_expiry
            )
            db.add(new_connection)
        
        db.commit()
        logger.info(f"Gmail - Connection saved successfully for user {current_user_id}")
        
        return {"message": "Successfully connected to Gmail"}



@router.get("/emails/{email_id}/body")
async def get_email_body(
    email_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    current_user_id = get_current_user_id(request)
    """Fetch full email body on-demand with attachment handling"""
    logger.info(f"Gmail - Fetching email body for email {email_id}, user {current_user_id}")
    
    try:
        # Get email from database
        email = db.query(models.Email).filter(
            models.Email.id == email_id,
            models.Email.user_id == current_user_id
        ).first()
        
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        
        # Check if body is already cached
        if email.body_cached and email.body:
            logger.info(f"Gmail - Email body already cached for email {email_id}")
            return {
                "body": email.body,
                "cached": True,
                "cached_at": email.body_cached_at
            }
        
        # Get Gmail connection
        connection = db.query(models.GmailConnection).filter(
            models.GmailConnection.user_id == current_user_id
        ).first()
        
        if not connection:
            raise HTTPException(status_code=404, detail="Gmail not connected")
        
        # Check if token is expired and refresh if needed
        if connection.token_expiry <= datetime.now():
            logger.info(f"Gmail - Refreshing expired token for user {current_user_id}")
            try:
                connection = refresh_gmail_access_token(db, connection)
            except Exception as e:
                logger.error(f"Gmail - Failed to refresh token for user {current_user_id}: {str(e)}")
                raise HTTPException(
                    status_code=401, 
                    detail="Authentication failed. Please reconnect your Gmail account."
                )
        
        # Fetch full message from Gmail API
        headers = {"Authorization": f"Bearer {connection.access_token}"}
        
        with httpx.Client() as client:
            response = client.get(
                f"{google_config.GOOGLE_GMAIL_API}/messages/{email.gmail_id}",
                headers=headers,
                params={"format": "full"}  # Get full message content
            )
            
            if response.status_code != 200:
                logger.error(f"Gmail - Failed to fetch message body: {response.status_code}")
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch email body")
            
            message_data = response.json()
            
            # Extract and process body content
            body = ""
            payload = message_data.get("payload", {})
            
            # 🔥 Extract attachments for CID replacement
            attachments = {}
            if "parts" in payload:
                attachments = extract_attachments_from_parts(payload["parts"], connection.access_token, client)
            
            logger.info(f"Gmail - Processing email body for email {email_id}, payload mimeType: {payload.get('mimeType')}")
            logger.info(f"Gmail - Payload structure: {list(payload.keys())}")
            logger.info(f"Gmail - Found {len(attachments)} attachments for CID replacement")
            
            # Update attachment records with inline image data
            if attachments:
                try:
                    for cid, attachment_info in attachments.items():
                        # Find existing attachment record
                        existing_attachment = db.query(models.EmailAttachment).filter(
                            models.EmailAttachment.email_id == email_id,
                            models.EmailAttachment.content_id == cid
                        ).first()
                        
                        if existing_attachment:
                            # Update with inline image data
                            existing_attachment.data = attachment_info["data"]
                            existing_attachment.size = attachment_info["size"]
                            logger.debug(f"Gmail - Updated inline image data for attachment {existing_attachment.filename}")
                        else:
                            logger.warning(f"Gmail - No attachment record found for CID {cid}")
                    
                    # Commit attachment updates
                    db.commit()
                    logger.info(f"Gmail - Updated {len(attachments)} attachment records with inline image data")
                    
                except Exception as attachment_update_error:
                    logger.warning(f"Gmail - Failed to update attachment records: {str(attachment_update_error)}")
                    db.rollback()
                    # Continue without failing the entire request
            
            if "parts" in payload:
                # Multipart message
                logger.info(f"Gmail - Multipart message detected for email {email_id}, parts count: {len(payload['parts'])}")
                body = extract_body_from_parts(payload["parts"], attachments=attachments)
                logger.info(f"Gmail - Multipart body extracted, length: {len(body) if body else 0}")
            else:
                # Simple message
                logger.info(f"Gmail - Simple message for email {email_id}, mimeType: {payload.get('mimeType')}")
                if payload.get("mimeType") == "text/plain":
                    body_data = payload.get("body", {}).get("data", "")
                    if body_data:
                        body = base64.urlsafe_b64decode(body_data).decode("utf-8", errors="ignore")
                        logger.info(f"Gmail - Plain text body extracted for email {email_id}, length: {len(body)}")
                elif payload.get("mimeType") == "text/html":
                    html_data = payload.get("body", {}).get("data", "")
                    if html_data:
                        html_content = base64.urlsafe_b64decode(html_data).decode("utf-8", errors="ignore")
                        logger.info(f"Gmail - HTML content extracted for email {email_id}, raw length: {len(html_content)}")
                        logger.info(f"Gmail - HTML content preview: {html_content[:200]}...")
                        body = extract_body_from_html(html_content, attachments)
                        logger.info(f"Gmail - HTML body extracted for email {email_id}, extracted length: {len(body)}")
                        logger.info(f"Gmail - Extracted body preview: {body[:200]}...")
            
            # If still no body, use snippet
            if not body:
                logger.warning(f"Gmail - No body content extracted for email {email_id}, using snippet")
                body = email.snippet or "No content available"
            
            logger.info(f"Gmail - Final body for email {email_id}, length: {len(body)}, is_html: {'<html' in body.lower() or '<!doctype' in body.lower()}")
            
            # Cache the body in database
            email.body = body
            email.body_cached = True
            email.body_cached_at = datetime.now()
            db.commit()
            
            logger.info(f"Gmail - Successfully cached email body for email {email_id}")
            
            return {
                "body": body,
                "cached": False,
                "cached_at": email.body_cached_at
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gmail - Failed to fetch email body for email {email_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch email body: {str(e)}")

@router.post("/sync-native-labels")
async def sync_gmail_native_labels(
    request: Request,
    db: Session = Depends(get_db)
):
    """Sync emails using Gmail's native label system (store labels directly in emails table)"""
    current_user_id = get_current_user_id(request)
    
    connection = db.query(models.GmailConnection).filter(
        models.GmailConnection.user_id == current_user_id
    ).first()
    
    if not connection:
        raise HTTPException(
            status_code=404, 
            detail="Gmail not connected. Please connect your Gmail account first."
        )
    
    # Check if token is expired and refresh if needed
    if connection.token_expiry <= datetime.now():
        try:
            connection = refresh_gmail_access_token(db, connection)
        except Exception as e:
            raise HTTPException(
                status_code=401, 
                detail="Authentication failed. Please reconnect your Gmail account."
            )
    
    try:
        headers = {"Authorization": f"Bearer {connection.access_token}"}
        
        # Gmail System Labels (Sidebar navigation) with specific counts as requested
        SYSTEM_LABELS = {
            "INBOX": 100,        # Main inbox - total emails (will be distributed across categories)
            "SENT": 20,          # Sent emails - shows in sidebar
            "DRAFT": 10,         # Draft messages - shows in sidebar
            "TRASH": 10,         # Deleted emails - shows in sidebar
            "SPAM": 10,          # Spam emails - shows in sidebar
            "STARRED": 10,       # Starred messages - shows in sidebar
            "IMPORTANT": 20,     # Important messages - shows in sidebar
            "ALL": 10       # ALL emails - shows in sidebar (correct Gmail label ID)
        }
        
        # Gmail Categories (Top tabs - sub-labels of Inbox) with specific counts as requested
        GMAIL_CATEGORIES = {                     # Primary tab - 100 emails
            "CATEGORY_SOCIAL": 10,       # Social tab - 10 emails
            "CATEGORY_PROMOTIONS": 15,   # Promotions tab - 15 emails
            "CATEGORY_UPDATES": 10,      # Updates tab - 15 emails
            "CATEGORY_FORUMS": 10        # Forums tab - 10 emails
        }
        
        total_emails_synced = 0
        label_sync_results = {}
        
        # Step 1: Sync Local → Gmail FIRST (handle deletions and local changes)
        try:
            logger.info("Gmail - Step 1: Syncing Local → Gmail changes")
            local_sync_result = await sync_local_to_gmail(db, connection, current_user_id, headers)
            logger.info(f"Gmail - Local → Gmail sync completed: {local_sync_result}")
        except Exception as e:
            logger.error(f"Gmail - Local → Gmail sync failed: {str(e)}")
            # Don't fail the entire sync, just log the error
            local_sync_result = {"error": str(e)}
        
        with httpx.Client() as client:
            # Step 2: Sync System Labels (Sidebar items)
            logger.info("Gmail - Step 2: Syncing System Labels (Sidebar navigation)")
            for label_name, limit in SYSTEM_LABELS.items():
                logger.info(f"Gmail - Syncing {label_name} label (limit: {limit})")
                
                try:
                    # Use Gmail's native label query: labelIds=INBOX
                    # Order by internalDate to get newest emails first
                    params = {
                        "maxResults": limit,
                        "labelIds": [label_name],  # Direct label ID query
                        "orderBy": "internalDate"  # Get newest emails first
                    }
                    
                    # Fetch emails with this label
                    response = client.get(
                        f"{google_config.GOOGLE_GMAIL_API}/messages",
                        headers=headers,
                        params=params,
                        timeout=30.0
                    )
                    
                    if response.status_code != 200:
                        logger.warning(f"Gmail - Failed to fetch {label_name} messages: {response.status_code}")
                        continue
                    
                    messages_data = response.json()
                    messages = messages_data.get("messages", [])
                    logger.info(f"Gmail - Fetched {len(messages)} messages from {label_name} label")
                    
                    label_emails_synced = 0
                    new_emails = []
                    skipped_duplicates = 0
                    
                    # Process each message
                    for msg in messages:
                        try:
                            # Check if email already exists
                            existing_email = db.query(models.Email).filter(
                                models.Email.gmail_id == msg['id'],
                                models.Email.user_id == current_user_id
                            ).first()
                            
                            if not existing_email:
                                # Fetch full message details with format=full
                                msg_response = client.get(
                                    f"{google_config.GOOGLE_GMAIL_API}/messages/{msg['id']}?format=full",
                                    headers=headers,
                                    timeout=45.0
                                )
                                
                                if msg_response.status_code == 200:
                                    msg_detail = msg_response.json()
                                    parsed_email = parse_gmail_message(msg_detail, connection.access_token, client)
                                    
                                    # Get all labels for this email
                                    gmail_labels = msg_detail.get("labelIds", [])
                                    
                                    # Create new email record
                                    new_email = models.Email(
                                        gmail_id=parsed_email["id"],
                                        thread_id=parsed_email["thread_id"],
                                        sender=parsed_email["sender"],
                                        to_recipients=parsed_email["to_recipients"],
                                        subject=parsed_email["subject"],
                                        snippet=parsed_email["snippet"],
                                        body=parsed_email["body"],
                                        has_attachment=parsed_email["has_attachment"],
                                        received_at=parsed_email["received_at"],
                                        auto_reply="",
                                        user_id=current_user_id
                                    )
                                    
                                    # Store all labels as JSON in the labels field
                                    # Convert Gmail label IDs to our label names
                                    label_names = []
                                    for gmail_label in gmail_labels:
                                        if gmail_label.startswith("CATEGORY_"):
                                            # Convert Gmail categories to our label format
                                            category_name = gmail_label.replace("CATEGORY_", "").lower()
                                            label_names.append(f"category_{category_name}")
                                        elif gmail_label in ["INBOX", "SENT", "DRAFT", "TRASH", "SPAM", "STARRED", "IMPORTANT", "UNREAD"]:
                                            # System labels
                                            label_names.append(gmail_label.lower())
                                        else:
                                            # Custom labels
                                            label_names.append(gmail_label.lower())
                                    
                                    # Store labels as JSON string
                                    new_email.labels = json.dumps(label_names)
                                    
                                    # Store parsed email data for attachment processing
                                    new_email._parsed_data = parsed_email
                                    
                                    new_emails.append(new_email)
                                    label_emails_synced += 1
                                    logger.debug(f"Gmail - Added email {parsed_email['id']} to {label_name} queue with labels: {label_names}")
                                else:
                                    logger.warning(f"Gmail - Failed to fetch message {msg['id']} details: {msg_response.status_code}")
                            else:
                                skipped_duplicates += 1
                                
                        except Exception as e:
                            logger.warning(f"Gmail - Failed to process message {msg['id']} in {label_name}: {str(e)}")
                            continue
                    
                    # Add new emails to database
                    if new_emails:
                        try:
                            for email in new_emails:
                                db.add(email)
                            
                            db.commit()
                            logger.info(f"Gmail - Successfully committed {len(new_emails)} emails to {label_name}")
                            
                            # Store attachments if available
                            for email in new_emails:
                                if hasattr(email, '_parsed_data'):
                                    parsed_data = email._parsed_data
                                    logger.info(f"Gmail - Processing attachments for email {email.id}: has_attachment={parsed_data.get('has_attachment')}, attachment_count={len(parsed_data.get('attachment_metadata', []))}")
                                    
                                    # Debug: Log the entire parsed_data structure
                                    logger.info(f"Gmail - Full parsed_data keys: {list(parsed_data.keys())}")
                                    logger.info(f"Gmail - parsed_data['has_attachment']: {parsed_data.get('has_attachment')}")
                                    logger.info(f"Gmail - parsed_data['attachment_metadata']: {parsed_data.get('attachment_metadata')}")
                                    logger.info(f"Gmail - parsed_data['attachment_metadata'] type: {type(parsed_data.get('attachment_metadata'))}")
                                    logger.info(f"Gmail - parsed_data['attachment_metadata'] length: {len(parsed_data.get('attachment_metadata', []))}")
                                    
                                    # Debug: Log the actual attachment data structure
                                    if parsed_data.get("attachment_metadata"):
                                        for i, att in enumerate(parsed_data.get("attachment_metadata", [])):
                                            logger.info(f"Gmail - Attachment {i+1}: filename={att.get('filename')}, mime_type={att.get('mime_type')}, size={att.get('size')}, gmail_id={att.get('gmail_attachment_id')}")
                                    
                                    if parsed_data.get("has_attachment") and parsed_data.get("attachment_metadata"):
                                        try:
                                            logger.info(f"Gmail - Storing {len(parsed_data.get('attachment_metadata', []))} attachments for email {email.id}")
                                            store_email_attachments(db, email.id, parsed_data.get("attachment_metadata", []),current_user_id)
                                            logger.info(f"Gmail - Successfully stored attachments for email {email.id}")
                                        except Exception as attachment_error:
                                            logger.error(f"Gmail - Failed to store attachments for email {email.id}: {str(attachment_error)}")
                                            logger.error(f"Gmail - Attachment error details: {type(attachment_error).__name__}")
                                            continue
                                    else:
                                        logger.info(f"Gmail - No attachments to store for email {email.id}")
                                        logger.info(f"Gmail - Condition check: has_attachment={parsed_data.get('has_attachment')}, attachment_metadata={bool(parsed_data.get('attachment_metadata'))}")
                                else:
                                    logger.warning(f"Gmail - Email {email.id} has no _parsed_data attribute")
                            
                            # Clean up the temporary data AFTER attachment processing
                            for email in new_emails:
                                if hasattr(email, '_parsed_data'):
                                    delattr(email, '_parsed_data')
                            
                        except Exception as add_error:
                            logger.error(f"Gmail - Failed to add emails to {label_name}: {str(add_error)}")
                            db.rollback()
                            continue
                    
                    total_emails_synced += label_emails_synced
                    label_sync_results[label_name] = {
                        "synced": label_emails_synced,
                        "skipped_duplicates": skipped_duplicates,
                        "total_processed": len(messages)
                    }
                    
                except Exception as e:
                    logger.error(f"Gmail - Failed to sync {label_name} label: {str(e)}")
                    label_sync_results[label_name] = {"error": str(e)}
                    continue
            
            # Step 3: Sync Category Labels (Top tabs - sub-labels of Inbox) with specific counts
            logger.info("Gmail - Step 3: Syncing Category Labels (Top tabs - sub-labels of Inbox)")
            for category, limit in GMAIL_CATEGORIES.items():
                logger.info(f"Gmail - Syncing {category} category with limit {limit}")
                
                try:
                    # For categories, we need INBOX + CATEGORY (like Gmail does)
                    # Get the latest emails first by ordering by internalDate
                    params = {
                        "maxResults": limit,
                        "labelIds": ["INBOX", category],  # Both INBOX and category label
                        "orderBy": "internalDate"  # Get newest emails first
                    }
                    
                    # Fetch emails with both labels
                    response = client.get(
                        f"{google_config.GOOGLE_GMAIL_API}/messages",
                        headers=headers,
                        params=params,
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        messages_data = response.json()
                        messages = messages_data.get("messages", [])
                        logger.info(f"Gmail - Found {len(messages)} emails with {category} category")
                        
                        # For categories, we ensure the category labels are properly set in the labels field
                        # The emails should already be synced from INBOX step
                        category_emails_updated = 0
                        
                        for msg in messages:
                            try:
                                # Find the email in our database
                                email = db.query(models.Email).filter(
                                    models.Email.gmail_id == msg['id'],
                                    models.Email.user_id == current_user_id
                                ).first()
                                
                                if email:
                                    # Parse existing labels
                                    current_labels = []
                                    if email.labels:
                                        try:
                                            current_labels = json.loads(email.labels)
                                        except (json.JSONDecodeError, TypeError):
                                            current_labels = []
                                    
                                    # Add category label if not present
                                    category_label = f"category_{category.replace('CATEGORY_', '').lower()}"
                                    if category_label not in current_labels:
                                        current_labels.append(category_label)
                                        email.labels = json.dumps(current_labels)
                                        category_emails_updated += 1
                                
                            except Exception as e:
                                logger.warning(f"Gmail - Failed to update category {category} for message {msg['id']}: {str(e)}")
                                continue
                        
                        if category_emails_updated > 0:
                            db.commit()
                            logger.info(f"Gmail - Updated {category_emails_updated} emails with {category} category label")
                        
                        label_sync_results[category] = {
                            "category_emails_updated": category_emails_updated,
                            "total_found": len(messages),
                            "limit": limit
                        }
                    
                except Exception as e:
                    logger.error(f"Gmail - Failed to sync {category} category: {str(e)}")
                    label_sync_results[category] = {"error": str(e)}
                    continue
        
        # Update connection with sync time
        connection.last_sync = datetime.now()
        db.commit()
        
        return {
            "message": "Gmail two-way sync completed successfully - categories as sub-labels of Inbox",
            "total_emails_synced": total_emails_synced,
            "label_results": label_sync_results,
            "local_to_gmail_sync": local_sync_result,
            "last_sync": connection.last_sync,
            "sync_method": "Categories as sub-labels of Inbox with specific counts + Local→Gmail sync",
            "system_labels": SYSTEM_LABELS,
            "category_limits": GMAIL_CATEGORIES
        }
        
    except Exception as e:
        logger.error(f"Gmail - Native label sync failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

@router.post("/disconnect")
async def disconnect_gmail(
    request: Request,
    db: Session = Depends(get_db)
):
    current_user_id = get_current_user_id(request)
    """Disconnect Gmail account and remove connection"""
    logger.info(f"Gmail - Disconnect request from user {current_user_id}")
    
    try:
        # Find and remove the Gmail connection
        connection = db.query(models.GmailConnection).filter(
            models.GmailConnection.user_id == current_user_id
        ).first()
        
        if not connection:
            logger.warning(f"Gmail - No connection found for user {current_user_id}")
            return {
                "status": "success",
                "message": "Gmail was not connected"
            }
        
        # Remove ONLY the Gmail connection from database (no token revocation)
        db.delete(connection)
        db.commit()
        
        logger.info(f"Gmail - Successfully disconnected user {current_user_id}")
        
        return {
            "status": "success",
            "message": "Gmail disconnected successfully"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Gmail - Disconnect failed for user {current_user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to disconnect: {str(e)}")


@router.get("/connection-status")
async def get_gmail_connection_status(
    request: Request,
    db: Session = Depends(get_db)
):
    current_user_id = get_current_user_id(request)
    """Get current Gmail connection status"""
    logger.info(f"Gmail - Connection status request from user {current_user_id}")
    
    try:
        connection = db.query(models.GmailConnection).filter(
            models.GmailConnection.user_id == current_user_id
        ).first()
        
        if not connection:
            return {
                "connected": False,
                "message": "Gmail not connected"
            }
        
        # Check if token is expired
        is_expired = connection.token_expiry <= datetime.now()
        
        return {
            "connected": True,
            "is_expired": is_expired,
            "last_sync": connection.last_sync,
            "updated_at": connection.updated_at
        }
        
    except Exception as e:
        logger.error(f"Gmail - Failed to get connection status for user {current_user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get connection status: {str(e)}")


def refresh_gmail_access_token(db: Session, connection: models.GmailConnection) -> models.GmailConnection:
    """Refresh Gmail access token"""
    logger.info(f"Gmail - Refreshing access token for user {connection.user_id}")
    
    # Refresh the access token
    token_data = {
        "client_id": google_config.get_gmail_client_id(),
        "client_secret": google_config.get_gmail_client_secret(),
        "refresh_token": connection.refresh_token,
        "grant_type": "refresh_token"
    }
    
    with httpx.Client() as client:
        response = client.post(google_config.GOOGLE_TOKEN_URL, data=token_data)
        
        if response.status_code != 200:
            logger.error(f"Gmail - Token refresh failed: {response.status_code} - {response.text}")
            raise HTTPException(status_code=401, detail="Failed to refresh Gmail access token")
        
        tokens = response.json()
        
        # Update connection with new token
        connection.access_token = tokens["access_token"]
        if "refresh_token" in tokens:
            connection.refresh_token = tokens["refresh_token"]
        
        expires_in = tokens.get("expires_in", 3600)
        connection.token_expiry = datetime.now() + timedelta(seconds=expires_in)
        connection.updated_at = datetime.now()
        
        db.commit()
        logger.info(f"Gmail - Token refreshed successfully for user {connection.user_id}")
        
        return connection

def extract_attachments_from_parts(parts, access_token: str, client) -> dict:
    """Extract attachments from Gmail message parts and create CID mapping"""
    attachments = {}
    
    try:
        for part in parts:
            # Check if this part is an attachment
            if part.get("filename") and part.get("body", {}).get("attachmentId"):
                attachment_id = part["body"]["attachmentId"]
                content_id = part.get("headers", [])
                filename = part.get("filename", "")
                mime_type = part.get("mimeType", "")
                
                # Find Content-ID header
                cid = None
                for header in content_id:
                    if header.get("name", "").lower() == "content-id":
                        cid = header.get("value", "").strip("<>")  # Remove < > brackets
                        break
                
                if cid:
                    try:
                        # Fetch attachment data
                        attachment_response = client.get(
                            f"{google_config.GOOGLE_GMAIL_API}/messages/{part.get('messageId', '')}/attachments/{attachment_id}",
                            headers={"Authorization": f"Bearer {access_token}"}
                        )
                        
                        if attachment_response.status_code == 200:
                            attachment_data = attachment_response.json()
                            data = attachment_data.get("data", "")
                            
                            if data:
                                # Store attachment info with metadata
                                attachments[cid] = {
                                    "data": data,
                                    "filename": filename,
                                    "mime_type": mime_type,
                                    "size": len(data) * 3 // 4,  # Approximate size (base64 is ~33% larger)
                                    "attachment_id": attachment_id
                                }
                                logger.info(f"Gmail - Extracted attachment {cid} -> {filename} ({mime_type}) - {len(data)} chars")
                    
                    except Exception as e:
                        logger.warning(f"Gmail - Failed to fetch attachment {cid}: {str(e)}")
                        continue
            
            # Recursively check nested parts
            if part.get("parts"):
                nested_attachments = extract_attachments_from_parts(part["parts"], access_token, client)
                attachments.update(nested_attachments)
    
    except Exception as e:
        logger.error(f"Gmail - Failed to extract attachments: {str(e)}")
    
    return attachments


def extract_body_from_parts(parts, prefer_plain=True, attachments: dict = None):
    """Recursively extract body content from multipart message parts"""
    body = ""
    
    for part in parts:
        mime_type = part.get("mimeType", "")
        
        if mime_type == "text/plain":
            body_data = part.get("body", {}).get("data", "")
            if body_data:
                body = base64.urlsafe_b64decode(body_data).decode("utf-8", errors="ignore")
                if prefer_plain:
                    return body  # Prefer plain text
        elif mime_type == "text/html":
            html_data = part.get("body", {}).get("data", "")
            if html_data and not body:
                html_content = base64.urlsafe_b64decode(html_data).decode("utf-8", errors="ignore")
                # Extract only the body content, not the entire HTML document
                body = extract_body_from_html(html_content, attachments)
        elif mime_type.startswith("multipart/"):
            # Recursively handle nested multipart
            nested_parts = part.get("parts", [])
            if nested_parts:
                nested_body = extract_body_from_parts(nested_parts, prefer_plain, attachments)
                if nested_body:
                    body = nested_body
                    if prefer_plain and "text/plain" in mime_type:
                        return body
    
    return body


def extract_body_from_html(html_content: str, attachments: dict = None) -> str:
    """Extract only the body content from HTML, removing document structure"""
    try:
        # Handle the specific case where content contains DOCTYPE and HTML wrapper
        if 'html PUBLIC' in html_content or '<!DOCTYPE' in html_content:
            logger.info(f"Gmail - Detected DOCTYPE/HTML wrapper, using aggressive extraction")
            return extract_body_aggressive(html_content, attachments)
        
        # First, try to find the actual email content
        # Gmail often wraps content in specific divs or structures
        
        # Look for common Gmail content containers
        content_patterns = [
            r'<div[^>]*class="[^"]*gmail_[^"]*"[^>]*>(.*?)</div>',  # Gmail-specific classes
            r'<div[^>]*id="[^"]*gmail_[^"]*"[^>]*>(.*?)</div>',    # Gmail-specific IDs
            r'<div[^>]*class="[^"]*email[^"]*"[^>]*>(.*?)</div>',  # Email-related classes
            r'<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)</div>', # Content classes
            r'<div[^>]*class="[^"]*body[^"]*"[^>]*>(.*?)</div>',   # Body classes
        ]
        
        for pattern in content_patterns:
            matches = re.findall(pattern, html_content, re.DOTALL | re.IGNORECASE)
            if matches:
                logger.info(f"Gmail - Found content using pattern: {pattern[:50]}...")
                # Use the first match and sanitize it
                return sanitize_gmail_html(matches[0], attachments)
        
        # If no patterns match, sanitize the entire content
        logger.info(f"Gmail - No specific patterns found, sanitizing entire content")
        return sanitize_gmail_html(html_content, attachments)
            
    except Exception as e:
        logger.error(f"Gmail - Failed to extract body from HTML: {str(e)}")
        # Fallback to sanitization
        return sanitize_gmail_html(html_content, attachments)


def extract_body_aggressive(html_content: str, attachments: dict = None) -> str:
    """Aggressively extract body content from malformed HTML with DOCTYPE/HTML wrapper"""
    try:
        logger.info(f"Gmail - Using aggressive body extraction for malformed HTML")
        
        # Remove DOCTYPE declarations
        content = re.sub(r'<!DOCTYPE[^>]*>', '', html_content)
        content = re.sub(r'DOCTYPE[^>]*>', '', content)
        
        # Remove HTML wrapper tags but keep their content
        content = re.sub(r'<html[^>]*>', '', content)
        content = re.sub(r'</html>', '', content)
        content = re.sub(r'<head[^>]*>.*?</head>', '', content, flags=re.DOTALL)
        content = re.sub(r'<body[^>]*>', '', content)
        content = re.sub(r'</body>', '', content)
        
        # Remove any remaining HTML structure tags
        content = re.sub(r'<div[^>]*>html PUBLIC[^<]*</div>', '', content)
        
        # Clean up whitespace
        content = re.sub(r'\n+', '\n', content)
        content = re.sub(r'\s+', ' ', content)
        content = content.strip()
        
        # If we still have meaningful content, sanitize it
        if content and len(content) > 10:
            logger.info(f"Gmail - Aggressive extraction successful, content length: {len(content)}")
            return sanitize_gmail_html(content, attachments)
        else:
            logger.warning(f"Gmail - Aggressive extraction resulted in no meaningful content")
            return '<p>Content could not be extracted</p>'
            
    except Exception as e:
        logger.error(f"Gmail - Aggressive extraction failed: {str(e)}")
        return '<p>Content extraction failed</p>'



def sanitize_gmail_html(html_content: str, attachments: dict = None) -> str:
    """
    Sanitize Gmail HTML and replace CID references with base64 inline images.
    attachments: dict mapping content_id -> base64 data (already fetched from Gmail API)
    """
    if not html_content:
        return ""

    try:
        # Define allowed tags
        allowed_tags = [
            'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'a', 'img', 'table', 'tr', 'td', 'th', 'tbody', 'thead',
            'ul', 'ol', 'li', 'br', 'hr', 'blockquote', 'strong', 'b',
            'em', 'i', 'u', 'strike', 'code', 'pre', 'font'
        ]

        # Allowed attributes
        allowed_attributes = {
            '*': ['class', 'id', 'style', 'title'],
            'a': ['href', 'target', 'rel'],
            'img': ['src', 'alt', 'width', 'height', 'border'],
            'table': [
                'width', 'height', 'border', 'cellpadding', 'cellspacing', 'align',
                'bgcolor', 'background', 'frame', 'rules', 'summary', 'dir', 'lang'
            ],
            'td': [
                'width', 'height', 'align', 'valign', 'bgcolor', 'colspan', 'rowspan',
                'background', 'char', 'charoff', 'dir', 'lang', 'nowrap', 'scope'
            ],
            'th': [
                'width', 'height', 'align', 'valign', 'bgcolor', 'colspan', 'rowspan',
                'background', 'char', 'charoff', 'dir', 'lang', 'nowrap', 'scope'
            ],
            'tr': ['align', 'valign', 'bgcolor', 'background', 'char', 'charoff', 'dir', 'lang'],
            'tbody': ['align', 'valign', 'char', 'charoff', 'dir', 'lang'],
            'thead': ['align', 'valign', 'char', 'charoff', 'dir', 'lang'],
            'tfoot': ['align', 'valign', 'char', 'charoff', 'dir', 'lang'],
            'colgroup': ['align', 'valign', 'char', 'charoff', 'span', 'width', 'dir', 'lang'],
            'col': ['align', 'valign', 'char', 'charoff', 'span', 'width', 'dir', 'lang'],
            'div': ['width', 'height', 'align', 'bgcolor', 'background', 'dir', 'lang'],
            'span': ['width', 'height', 'align', 'bgcolor', 'background', 'dir', 'lang'],
            'p': ['width', 'height', 'align', 'bgcolor', 'background', 'dir', 'lang'],
            'font': ['color', 'size', 'face', 'dir', 'lang']
        }

        # Allowed CSS properties
        allowed_styles = [
            'color', 'background-color', 'background-image', 'background',
            'font-family', 'font-size', 'font-weight', 'font-style',
            'text-align', 'text-decoration', 'line-height',
            'margin', 'padding', 'border', 'border-radius',
            'width', 'height', 'max-width', 'max-height',
            'display', 'position', 'top', 'left', 'right', 'bottom',
            'float', 'clear', 'overflow', 'z-index',
            # Table-specific CSS properties
            'border-collapse', 'border-spacing', 'table-layout',
            'vertical-align', 'text-align', 'white-space',
            'empty-cells', 'caption-side', 'border-style',
            'border-width', 'border-color', 'border-top',
            'border-right', 'border-bottom', 'border-left'
        ]

        # Setup bleach cleaner with CSS sanitizer
        css_sanitizer = CSSSanitizer(allowed_css_properties=allowed_styles)
        cleaner = bleach.Cleaner(
            tags=allowed_tags,
            attributes=allowed_attributes,
            css_sanitizer=css_sanitizer,
            strip=True,
            strip_comments=True
        )

        cleaned_html = cleaner.clean(html_content)

        # 🔥 Replace CID images with base64 inline images
        if attachments:
            def replace_cid(match):
                cid = match.group(1)  # the CID inside src="cid:..."
                if cid in attachments:
                    attachment = attachments[cid]
                    mime_type = attachment.get("mime_type", "image/png")
                    data = attachment.get("data", "")
                    
                    # Handle different file types
                    if mime_type.startswith("image/"):
                        return f'src="data:{mime_type};base64,{data}"'
                    else:
                        # For non-image files, create a download link instead
                        filename = attachment.get("filename", "attachment")
                        return f'href="data:{mime_type};base64,{data}" download="{filename}"'
                
                return match.group(0)  # leave as is if not found

            # Replace CID references in src attributes (for images)
            cleaned_html = re.sub(r'src="cid:([^"]+)"', replace_cid, cleaned_html)
            
            # Also replace any remaining CID references that might be in href attributes
            cleaned_html = re.sub(r'href="cid:([^"]+)"', replace_cid, cleaned_html)

        logger.info(f"Gmail - HTML sanitized successfully, original length: {len(html_content)}, cleaned length: {len(cleaned_html)}")
        return cleaned_html

    except Exception as e:
        logger.error(f"Gmail - Failed to sanitize HTML: {str(e)}")
        return html_content


def extract_attachment_metadata(parts, access_token: str = None, client = None, message_id: str = None) -> list:
    """Extract attachment metadata from Gmail message parts and optionally fetch data"""
    attachments = []
    
    logger.info(f"Gmail - Extracting attachment metadata from {len(parts)} parts for message {message_id}")
    
    try:
        for part in parts:
            logger.debug(f"Gmail - Processing part: filename={part.get('filename')}, mimeType={part.get('mimeType')}, has_body={bool(part.get('body'))}, has_attachmentId={bool(part.get('body', {}).get('attachmentId'))}")
            
            if part.get("filename") and part.get("body", {}).get("attachmentId"):
                # Find Content-ID header and check if it's truly inline
                content_id = None
                is_truly_inline = False
                for header in part.get("headers", []):
                    if header.get("name", "").lower() == "content-id":
                        content_id = header.get("value", "").strip("<>")
                        break
                
                # Check if this attachment is referenced in the email body (truly inline)
                # We'll determine this by checking if the attachment is actually used in the email content
                # For now, we'll use a more conservative approach
                mime_type = part.get("mimeType", "")
                
                # Consider an attachment inline only if:
                # 1. It has a Content-ID AND
                # 2. It's an image type that's likely to be displayed in the email body
                if content_id and mime_type.startswith('image/'):
                    is_truly_inline = True
                else:
                    is_truly_inline = False
                
                logger.debug(f"Gmail - Attachment {part.get('filename')}: content_id={content_id}, mime_type={mime_type}, is_inline={is_truly_inline}")
                
                # 🔥 IMPORTANT: Only add NON-INLINE attachments to the list
                # Inline images should stay embedded in the email body, not be treated as separate attachments
                if not is_truly_inline:
                    attachment_info = {
                        "gmail_attachment_id": part["body"]["attachmentId"],
                        "filename": part.get("filename", ""),
                        "mime_type": mime_type,
                        "size": part.get("body", {}).get("size", 0),
                        "content_id": content_id,
                        "is_inline": False,  # Force to False since we're only adding non-inline attachments
                        "data": None  # Will be populated if access_token and client are provided
                    }
                    
                    # If we have access_token and client, fetch the actual data for regular attachments
                    if access_token and client and message_id:
                        try:
                            attachment_response = client.get(
                                f"{google_config.GOOGLE_GMAIL_API}/messages/{message_id}/attachments/{part['body']['attachmentId']}",
                                headers={"Authorization": f"Bearer {access_token}"},
                                timeout=30.0
                            )
                            
                            if attachment_response.status_code == 200:
                                attachment_data = attachment_response.json()
                                raw_data = attachment_data.get("data", "")
                                
                                if raw_data:
                                    # Convert to proper base64 format
                                    try:
                                        # Gmail API returns base64 data, but we need to ensure it's valid
                                        # Remove any potential whitespace and validate
                                        cleaned_data = raw_data.strip()

                                        
                                        # Validate base64 format
                                        # import base64
                                        try:
                                            # Try to decode and re-encode to ensure valid base64
                                            
                                            attachment_info["data"] = cleaned_data
                                            logger.info(f"Gmail - Converted to valid base64 for attachment: {attachment_info['filename']} ({len(cleaned_data)} chars)")
                                        except Exception as base64_error:
                                            logger.warning(f"Gmail - Invalid base64 data for {attachment_info['filename']}, skipping data: {str(base64_error)}")
                                            attachment_info["data"] = None
                                    except Exception as conversion_error:
                                        logger.warning(f"Gmail - Failed to convert attachment data for {attachment_info['filename']}: {str(conversion_error)}")
                                        attachment_info["data"] = None
                                else:
                                    logger.warning(f"Gmail - No data received for attachment: {attachment_info['filename']}")
                                    attachment_info["data"] = None
                            else:
                                logger.warning(f"Gmail - Failed to fetch attachment data: {attachment_response.status_code}")
                        
                        except Exception as e:
                            logger.warning(f"Gmail - Failed to fetch attachment data for {attachment_info['filename']}: {str(e)}")
                            # Continue without data, attachment will still be stored with metadata
                    
                    attachments.append(attachment_info)
                    logger.info(f"Gmail - Added external attachment: {attachment_info['filename']} ({mime_type})")
                else:
                    logger.info(f"Gmail - Skipping inline image: {part.get('filename', '')} (Content-ID: {content_id}) - will stay embedded in email body")
            
            # Recursively check nested parts
            if part.get("parts"):
                nested_attachments = extract_attachment_metadata(part["parts"], access_token, client, message_id)
                attachments.extend(nested_attachments)
    
    except Exception as e:
        logger.error(f"Gmail - Failed to extract attachment metadata: {str(e)}")
    
    logger.info(f"Gmail - Extracted {len(attachments)} external attachments")
    return attachments


def parse_gmail_message(message_data: dict, access_token: str = None, client = None) -> dict:
    """Parse Gmail message data into our email format"""
    try:
        # Extract basic info
        message_id = message_data.get("id", "")
        thread_id = message_data.get("threadId", "")
        snippet = message_data.get("snippet", "")
        internal_date = message_data.get("internalDate", "")
        label_ids = message_data.get("labelIds", [])
        
        # Parse payload to get email details
        payload = message_data.get("payload", {})
        headers = payload.get("headers", [])
        
        # Extract email headers
        subject = ""
        sender = ""
        date = ""
        
        for header in headers:
            name = header.get("name", "").lower()
            value = header.get("value", "")
            
            if name == "subject":
                subject = value
            elif name == "from":
                sender = value
            elif name == "date":
                date = value
        
        # Parse body - Only store snippet during sync, full body on-demand
        body = ""  # Will be populated on-demand
        snippet = message_data.get("snippet", "")
        
        # Check for attachments in payload
        has_attachment = False
        attachment_metadata = []
        if "parts" in payload:
            attachment_metadata = extract_attachment_metadata(payload["parts"], access_token, client, message_id)
            has_attachment = len(attachment_metadata) > 0
            logger.info(f"Gmail - Parsed message {message_id}: parts found, has_attachment={has_attachment}, attachment_count={len(attachment_metadata)}")
        elif payload.get("filename") or payload.get("mimeType", "").startswith(("image/", "application/")):
            has_attachment = True
            attachment_metadata = [{
                "gmail_attachment_id": payload.get("body", {}).get("attachmentId"),
                "filename": payload.get("filename", ""),
                "mime_type": payload.get("mimeType", ""),
                "size": payload.get("body", {}).get("size", 0),
                "content_id": None,
                "is_inline": False,
                "data": None
            }]
            logger.info(f"Gmail - Parsed message {message_id}: direct attachment, has_attachment={has_attachment}, attachment_count={len(attachment_metadata)}")
        else:
            logger.info(f"Gmail - Parsed message {message_id}: no attachments found")
        
        # Extract to recipients
        to_recipients = ""
        for header in headers:
            if header.get("name", "").lower() == "to":
                to_recipients = header.get("value", "")
                break
        
        # If still no body, use snippet
        if not snippet:
            snippet = "No content available"
        
        # Convert date
        received_at = datetime.now()
        if date:
            try:
                # Parse various date formats and convert to local time
                parsed_date = email.utils.parsedate_to_datetime(date)
                # Convert UTC to local time if it's timezone-aware
                if parsed_date.tzinfo is not None:
                    received_at = parsed_date.replace(tzinfo=None)
                else:
                    received_at = parsed_date
            except:
                pass
        
        return {
            "id": message_id,
            "thread_id": thread_id,
            "sender": sender or "Unknown",
            "to_recipients": to_recipients,
            "subject": subject or "No Subject",
            "snippet": snippet,
            "body": body,  # Empty during sync, populated on-demand
            "has_attachment": has_attachment,
            "attachment_metadata": attachment_metadata,  # New field for attachment info
            "received_at": received_at,
            "label_ids": label_ids
        }
        
    except Exception as e:
        logger.error(f"Gmail - Failed to parse message: {str(e)}")
        return {
            "id": message_data.get("id", ""),
            "thread_id": message_data.get("threadId", ""),
            "sender": "Unknown",
            "subject": "Error parsing email",
            "body": "Failed to parse email content",
            "received_at": datetime.now(),
            "label_ids": []
        }

def create_email_labels(db: Session, email_id: int, folder_name: str, user_id: int):
    """Create proper labels for an email based on folder and Gmail labels using JSON labels field"""
    try:
        # Get the email to update its labels
        email = db.query(models.Email).filter(models.Email.id == email_id).first()
        if not email:
            logger.error(f"Gmail - Email {email_id} not found when creating labels")
            return
        
        # Map folder names to system labels
        folder_to_label = {
            "inbox": "inbox",
            "sent": "sent", 
            "drafts": "draft",
            "trash": "trash",
            "starred": "starred",
            "important": "important"
        }
        
        # Parse existing labels
        current_labels = []
        if email.labels:
            try:
                current_labels = json.loads(email.labels)
            except (json.JSONDecodeError, TypeError):
                current_labels = []
        
        # Get the system label for this folder
        system_label = folder_to_label.get(folder_name)
        
        if system_label and system_label not in current_labels:
            # Add the system label
            current_labels.append(system_label)
            logger.debug(f"Gmail - Created {system_label} label for email {email_id}")
        
        # Also add inbox label for all emails (except sent/drafts)
        if folder_name not in ["sent", "drafts"] and "inbox" not in current_labels:
            current_labels.append("inbox")
            logger.debug(f"Gmail - Created inbox label for email {email_id}")
        
        # Update the email's labels field
        email.labels = json.dumps(current_labels)
        
        # Commit the changes
        db.commit()
        logger.info(f"Gmail - Successfully updated labels for email {email_id}: {current_labels}")
        
    except Exception as e:
        logger.error(f"Gmail - Failed to create labels for email {email_id}: {str(e)}")
        db.rollback()
        raise e


def store_email_attachments(db: Session, email_id: int, attachment_metadata: list, user_id: int):
    """Store email attachments in the database"""
    try:
        # Debug: Check if EmailAttachment model is accessible
        logger.info(f"Gmail - EmailAttachment model accessible: {hasattr(models, 'EmailAttachment')}")
        logger.info(f"Gmail - EmailAttachment model: {getattr(models, 'EmailAttachment', 'NOT_FOUND')}")
        
        external_attachments = 0
        inline_images_skipped = 0
        
        logger.info(f"Gmail - Starting attachment storage for email {email_id}, {len(attachment_metadata)} attachments to process")
        
        for attachment_info in attachment_metadata:
            logger.info(f"Gmail - Processing attachment: {attachment_info.get('filename')}, mime_type: {attachment_info.get('mime_type')}, size: {attachment_info.get('size')}")
            
            # 🔥 IMPORTANT: Skip inline images - they should stay embedded in the email body
            # Only store external attachments that users can download separately
            if attachment_info.get("is_inline", False):
                logger.debug(f"Gmail - Skipping inline image {attachment_info['filename']} for email {email_id} - will stay embedded in body")
                inline_images_skipped += 1
                continue
            
            # Check if attachment already exists
            existing_attachment = db.query(models.EmailAttachment).filter(
                models.EmailAttachment.email_id == email_id,
                models.EmailAttachment.gmail_attachment_id == attachment_info["gmail_attachment_id"]
            ).first()
            
            if not existing_attachment:
                # Create new attachment record for external attachment only
                logger.info(f"Gmail - Creating new attachment record for {attachment_info.get('filename')}")
                new_attachment = models.EmailAttachment(
                    email_id=email_id,
                    gmail_attachment_id=attachment_info["gmail_attachment_id"],
                    filename=attachment_info["filename"],
                    mime_type=attachment_info["mime_type"],
                    size=attachment_info["size"],
                    content_id=attachment_info["content_id"],
                    is_inline=False,  # Force to False since we're only storing external attachments
                    data=attachment_info.get("data")  # Store the base64 data if available
                )
                db.add(new_attachment)
                external_attachments += 1
                logger.info(f"Gmail - Added external attachment {attachment_info['filename']} for email {email_id}")
            else:
                # Update existing attachment
                logger.info(f"Gmail - Updating existing attachment {attachment_info.get('filename')}")
                existing_attachment.filename = attachment_info["filename"]
                existing_attachment.mime_type = attachment_info["mime_type"]
                existing_attachment.size = attachment_info["size"]
                existing_attachment.content_id = attachment_info["content_id"]
                existing_attachment.is_inline = False  # Force to False since we're only storing external attachments
                # Update data if new data is available
                if attachment_info.get("data"):
                    existing_attachment.data = attachment_info["data"]
                logger.info(f"Gmail - Updated external attachment {attachment_info['filename']} for email {email_id}")
        
        # Commit attachments
        logger.info(f"Gmail - Committing {external_attachments} attachments to database for email {email_id}")
        db.commit()
        logger.info(f"Gmail - Successfully stored {external_attachments} external attachments for email {email_id} (skipped {inline_images_skipped} inline images)")
        
    except Exception as e:
        logger.error(f"Gmail - Failed to store attachments for email {email_id}: {str(e)}")
        logger.error(f"Gmail - Error type: {type(e).__name__}")
        logger.error(f"Gmail - Error details: {e}")
        db.rollback()
        raise e


# new function for attachment getting 
@router.get("/emails/{email_id}/attachments")
async def get_email_attachments(
    email_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    current_user_id = get_current_user_id(request)
    try:
        email = db.query(models.Email).filter(
            models.Email.id == email_id,
            models.Email.user_id == current_user_id
        ).first()
        
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        
        attachments = db.query(models.EmailAttachment).filter(
            models.EmailAttachment.email_id == email_id,
            models.EmailAttachment.is_inline == False
        ).all()
        
        response_attachments = []
        for att in attachments:
            data = att.data or ""

            # Fix padding and normalize
            if data:
                # Gmail gives urlsafe base64, normalize it
                data_bytes = base64.urlsafe_b64decode(data + '=' * (-len(data) % 4))
                # Re-encode to standard base64 (safe for frontend preview)
                safe_data = base64.b64encode(data_bytes).decode("utf-8")
            else:
                safe_data = ""

            response_attachments.append({
                "id": att.id,
                "filename": att.filename,
                "mime_type": att.mime_type,
                "size": att.size,
                "is_inline": att.is_inline,
                "content_id": att.content_id,
                "data": safe_data,  # ✅ Always consistent base64
                "created_at": att.created_at
            })

        return {"email_id": email_id, "attachments": response_attachments}

    except Exception as e:
        logger.error(f"Gmail - Failed to get attachments for email {email_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch attachments")


@router.get("/emails/{email_id}/attachments/{attachment_id}/download")
async def download_attachment(
    email_id: int,
    attachment_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    current_user_id = get_current_user_id(request)
    """Download a specific attachment"""
    try:
        # Verify email exists and belongs to user
        email = db.query(models.Email).filter(
            models.Email.id == email_id,
            models.Email.user_id == current_user_id
        ).first()
        
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        
        # Get attachment
        attachment = db.query(models.EmailAttachment).filter(
            models.EmailAttachment.id == attachment_id,
            models.EmailAttachment.email_id == email_id
        ).first()
        
        if not attachment:
            raise HTTPException(status_code=404, detail="Attachment not found")
        
        # For attachments with stored data (inline images or cached regular attachments)
        if attachment.data:
            from fastapi.responses import Response
            import base64
            
            # Decode base64 data
            try:
                file_data = base64.urlsafe_b64decode(attachment.data)
                return Response(
                    content=file_data,
                    media_type=attachment.mime_type,
                    headers={
                        "Content-Disposition": f"attachment; filename={attachment.filename}",
                        "Content-Length": str(len(file_data))
                    }
                )
            except Exception as decode_error:
                logger.error(f"Gmail - Failed to decode attachment {attachment_id}: {str(decode_error)}")
                raise HTTPException(status_code=500, detail="Failed to decode attachment")
        
        # For regular attachments without stored data, we need to fetch from Gmail API
        else:
            # Get Gmail connection
            connection = db.query(models.GmailConnection).filter(
                models.GmailConnection.user_id == current_user_id
            ).first()
            
            if not connection:
                raise HTTPException(status_code=404, detail="Gmail connection not found")
            
            # Check if token is expired
            if connection.token_expiry and connection.token_expiry < datetime.now():
                raise HTTPException(status_code=401, detail="Gmail token expired")
            
            # Fetch attachment from Gmail API
            try:
                with httpx.Client() as client:
                    attachment_response = client.get(
                        f"{google_config.GOOGLE_GMAIL_API}/messages/{email.gmail_id}/attachments/{attachment.gmail_attachment_id}",
                        headers={"Authorization": f"Bearer {connection.access_token}"},
                        timeout=30.0
                    )
                    
                    if attachment_response.status_code == 200:
                        attachment_data = attachment_response.json()
                        data = attachment_data.get("data", "")
                        
                        if data:
                            # Decode base64 data
                            file_data = base64.urlsafe_b64decode(data)
                            from fastapi.responses import Response
                            
                            return Response(
                                content=file_data,
                                media_type=attachment.mime_type,
                                headers={
                                    "Content-Disposition": f"attachment; filename={attachment.filename}",
                                    "Content-Length": str(len(file_data))
                                }
                            )
                        else:
                            raise HTTPException(status_code=500, detail="No attachment data received")
                    else:
                        raise HTTPException(status_code=attachment_response.status_code, detail="Failed to fetch attachment from Gmail")
                        
            except Exception as api_error:
                logger.error(f"Gmail - Failed to fetch attachment {attachment_id} from Gmail API: {str(api_error)}")
                raise HTTPException(status_code=500, detail="Failed to fetch attachment from Gmail")
        
    except Exception as e:
        logger.error(f"Gmail - Failed to download attachment {attachment_id} for email {email_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to download attachment")


async def sync_local_to_gmail(db: Session, connection: models.GmailConnection, user_id: int, headers: dict):
    """Sync local email changes back to Gmail"""
    logger.info(f"Gmail - Syncing Local → Gmail for user {user_id}")
    
    try:
        updates_sent = 0
        errors = 0
        update_results = []
        emails_deleted = 0
        
        # Step 1: Handle deletions first (emails marked as deleted)
        deleted_emails = db.query(models.Email).filter(
            models.Email.user_id == user_id,
            models.Email.is_deleted == True,
            models.Email.gmail_id.isnot(None),
            models.Email.needs_gmail_sync == True
        ).all()
        
        logger.info(f"Gmail - Found {len(deleted_emails)} deleted emails to sync to Gmail")
        
        for email in deleted_emails:
            try:
                # Move email to trash in Gmail (Gmail doesn't have a true delete, only trash)
                with httpx.Client() as client:
                    # Add TRASH label to the email
                    response = client.post(
                        f"{google_config.GOOGLE_GMAIL_API}/messages/{email.gmail_id}/modify",
                        headers=headers,
                        json={"addLabelIds": ["TRASH"]}
                    )
                    
                    if response.status_code == 200:
                        logger.info(f"Gmail - Successfully moved deleted email '{email.subject}' to trash")
                        emails_deleted += 1
                        
                        # Mark as synced and delete from local DB
                        email.needs_gmail_sync = False
                        email.last_gmail_sync = datetime.now()
                        db.delete(email)
                    else:
                        logger.error(f"Gmail - Failed to move deleted email '{email.subject}' to trash: {response.status_code}")
                        # Mark as not needing sync to avoid retry loops
                        email.needs_gmail_sync = False
                        
            except Exception as e:
                logger.error(f"Gmail - Error moving deleted email '{email.subject}' to trash: {str(e)}")
                # Mark as not needing sync to avoid retry loops
                email.needs_gmail_sync = False
                continue
        
        # Step 2: Handle regular updates (non-deleted emails)
        pending_updates = db.query(models.Email).filter(
            models.Email.user_id == user_id,
            models.Email.gmail_id.isnot(None),
            models.Email.needs_gmail_sync == True,
            models.Email.is_deleted == False  # Only sync non-deleted emails
        ).all()
        
        if not pending_updates:
            logger.info(f"Gmail - No pending Gmail updates for user {user_id}")
            return {
                "message": f"Gmail sync completed - {emails_deleted} emails deleted",
                "updates_sent": 0,
                "errors": 0,
                "emails_deleted": emails_deleted
            }
        
        logger.info(f"Gmail - Found {len(pending_updates)} emails with pending Gmail updates")
        
        with httpx.Client() as client:
            for email in pending_updates:
                try:
                    # Get current labels for this email
                    current_labels = get_email_gmail_labels(db, email.id)
                    
                    # Determine what actions need to be performed
                    actions_needed = determine_gmail_actions(email, current_labels)
                    
                    if actions_needed:
                        # Apply actions to Gmail
                        success = apply_gmail_actions(client, headers, email.gmail_id, actions_needed)
                        
                        if success:
                            # Mark as synced
                            email.needs_gmail_sync = False
                            email.last_gmail_sync = datetime.now()
                            updates_sent += 1
                            
                            update_results.append({
                                "email_id": email.id,
                                "gmail_id": email.gmail_id,
                                "actions": actions_needed,
                                "status": "success"
                            })
                            
                            logger.info(f"Gmail - Successfully synced email {email.id} to Gmail")
                        else:
                            errors += 1
                            update_results.append({
                                "email_id": email.id,
                                "gmail_id": email.gmail_id,
                                "actions": actions_needed,
                                "status": "failed"
                            })
                            
                            logger.warning(f"Gmail - Failed to sync email {email.id} to Gmail")
                    else:
                        # No actions needed, mark as synced
                        email.needs_gmail_sync = False
                        email.last_gmail_sync = datetime.now()
                        
                except Exception as e:
                    logger.error(f"Gmail - Error processing email {email.id} for Gmail sync: {str(e)}")
                    errors += 1
                    continue
        
        # Commit all changes
        try:
            db.commit()
            logger.info(f"Gmail - Successfully synced {updates_sent} emails to Gmail for user {user_id}")
        except Exception as commit_error:
            logger.error(f"Gmail - Failed to commit sync results: {str(commit_error)}")
            db.rollback()
            raise commit_error
        
        return {
            "message": f"Local → Gmail sync completed - {emails_deleted} emails deleted",
            "updates_sent": updates_sent,
            "errors": errors,
            "emails_deleted": emails_deleted,
            "update_results": update_results
        }
        
    except Exception as e:
        logger.error(f"Gmail - Local → Gmail sync failed: {str(e)}")
        raise e


def get_email_gmail_labels(db: Session, email_id: int) -> list:
    """Get current Gmail labels for an email from JSON labels field"""
    try:
        # Get the email to access its labels field
        email = db.query(models.Email).filter(models.Email.id == email_id).first()
        if not email or not email.labels:
            return []
        
        # Parse the JSON labels field
        try:
            labels = json.loads(email.labels)
            if isinstance(labels, list):
                return labels
            else:
                return []
        except (json.JSONDecodeError, TypeError):
            logger.warning(f"Gmail - Failed to parse labels for email {email_id}: {email.labels}")
            return []
            
    except Exception as e:
        logger.error(f"Gmail - Failed to get labels for email {email_id}: {str(e)}")
        return []


def determine_gmail_actions(email: models.Email, current_labels: list) -> dict:
    """Determine what Gmail actions need to be performed based on email state"""
    actions = {}
    
    try:
        # Check if email needs to be starred/unstarred
        is_starred = any(label == 'starred' for label in current_labels)
        if email.starred != is_starred:
            actions['star'] = email.starred
        
        # Check if email needs to be moved to trash
        if email.category == 'trash' and 'trash' not in current_labels:
            actions['move_to_trash'] = True
        
        # Check if email needs to be archived
        if email.category == 'archived' and 'archived' not in current_labels:
            actions['archive'] = True
        
        # Check if email needs to be moved to inbox
        if email.category == 'inbox' and 'inbox' not in current_labels:
            actions['move_to_inbox'] = True
        
        # Check if email needs to be marked as read/unread
        if hasattr(email, 'read') and email.read is not None:
            actions['mark_read'] = email.read
        
        logger.debug(f"Gmail - Determined actions for email {email.id}: {actions}")
        return actions
        
    except Exception as e:
        logger.error(f"Gmail - Failed to determine actions for email {email.id}: {str(e)}")
        return {}


def apply_gmail_actions(client, headers: dict, gmail_id: str, actions: dict) -> bool:
    """Apply actions to Gmail via API"""
    try:
        success = True
        
        for action, value in actions.items():
            try:
                if action == 'star':
                    # Add/remove star label
                    if value:
                        # Add star
                        success &= add_gmail_label(client, headers, gmail_id, 'STARRED')
                    else:
                        # Remove star
                        success &= remove_gmail_label(client, headers, gmail_id, 'STARRED')
                
                elif action == 'move_to_trash':
                    # Move to trash
                    success &= add_gmail_label(client, headers, gmail_id, 'TRASH')
                    success &= remove_gmail_label(client, headers, gmail_id, 'INBOX')
                
                elif action == 'archive':
                    # Archive (remove from inbox)
                    success &= remove_gmail_label(client, headers, gmail_id, 'INBOX')
                
                elif action == 'move_to_inbox':
                    # Move to inbox
                    success &= add_gmail_label(client, headers, gmail_id, 'INBOX')
                    success &= remove_gmail_label(client, headers, gmail_id, 'TRASH')
                
                elif action == 'mark_read':
                    # Mark as read/unread
                    if value:
                        success &= remove_gmail_label(client, headers, gmail_id, 'UNREAD')
                    else:
                        success &= add_gmail_label(client, headers, gmail_id, 'UNREAD')
                
            except Exception as action_error:
                logger.error(f"Gmail - Failed to apply action {action} to email {gmail_id}: {str(action_error)}")
                success = False
        
        return success
        
    except Exception as e:
        logger.error(f"Gmail - Failed to apply Gmail actions: {str(e)}")
        return False


def add_gmail_label(client, headers: dict, gmail_id: str, label_id: str) -> bool:
    """Add a label to a Gmail message"""
    try:
        response = client.post(
            f"{google_config.GOOGLE_GMAIL_API}/messages/{gmail_id}/modify",
            headers=headers,
            json={"addLabelIds": [label_id]},
            timeout=30.0
        )
        
        if response.status_code == 200:
            logger.debug(f"Gmail - Successfully added label {label_id} to message {gmail_id}")
            return True
        else:
            logger.warning(f"Gmail - Failed to add label {label_id} to message {gmail_id}: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"Gmail - Error adding label {label_id} to message {gmail_id}: {str(e)}")
        return False


def remove_gmail_label(client, headers: dict, gmail_id: str, label_id: str) -> bool:
    """Remove a label from a Gmail message"""
    try:
        response = client.post(
            f"{google_config.GOOGLE_GMAIL_API}/messages/{gmail_id}/modify",
            headers=headers,
            json={"removeLabelIds": [label_id]},
            timeout=30.0
        )
        
        if response.status_code == 200:
            logger.debug(f"Gmail - Successfully removed label {label_id} from message {gmail_id}")
            return True
        else:
            logger.warning(f"Gmail - Failed to remove label {label_id} from message {gmail_id}: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"Gmail - Error removing label {label_id} from message {gmail_id}: {str(e)}")
        return False



def create_gmail_labels(db: Session, email_id: int, gmail_label_ids: list, user_id: int):
    """Create labels based on Gmail's actual label IDs"""
    try:
        # Map Gmail label IDs to our label names
        label_mapping = {
            "INBOX": "inbox",
            "SENT": "sent",
            "DRAFT": "draft", 
            "TRASH": "trash",
            "STARRED": "starred",
            "IMPORTANT": "important",
            "UNREAD": "unread",
            "CATEGORY_PRIMARY": "primary",
            "CATEGORY_SOCIAL": "social",
            "CATEGORY_PROMOTIONS": "promotions",
            "CATEGORY_UPDATES": "updates",
            "CATEGORY_FORUMS": "forums"
        }
        
        labels_created = 0
        
        for gmail_label_id in gmail_label_ids:
            # Map to our label name
            label_name = label_mapping.get(gmail_label_id, gmail_label_id.lower())
            
            # Determine label type
            if gmail_label_id.startswith("CATEGORY_"):
                label_type = "category"
            elif gmail_label_id in ["INBOX", "SENT", "DRAFT", "TRASH", "STARRED", "IMPORTANT", "UNREAD"]:
                label_type = "system"
            else:
                label_type = "custom"
            
            # Get the email to update its labels
            email = db.query(models.Email).filter(models.Email.id == email_id).first()
            if not email:
                logger.warning(f"Gmail - Email {email_id} not found when creating labels")
                continue
            
            # Parse existing labels
            current_labels = []
            if email.labels:
                try:
                    current_labels = json.loads(email.labels)
                except (json.JSONDecodeError, TypeError):
                    current_labels = []
            
            # Check if label already exists
            if label_name not in current_labels:
                # Add the label
                current_labels.append(label_name)
                labels_created += 1
                logger.debug(f"Gmail - Created {label_name} label for email {email_id}")
                
                # Update the email's labels field
                email.labels = json.dumps(current_labels)
        
        # Commit the changes
        db.commit()
        logger.info(f"Gmail - Successfully updated labels for email {email_id}, {labels_created} new labels added")
        
    except Exception as e:
        logger.error(f"Gmail - Failed to create Gmail labels for email {email_id}: {str(e)}")
        db.rollback()
        raise e


