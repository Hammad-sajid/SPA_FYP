import smtplib
import random
import string
import time
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional
import logging


logger = logging.getLogger(__name__)

# Import email configuration
try:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from config.email_config import SMTP_SERVER, SMTP_PORT, EMAIL_USER, EMAIL_PASSWORD
except ImportError:
    # Fallback configuration (update these with your email provider details)
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    EMAIL_USER = "madikhan.1308@gmail.com"  # Update with your email
    EMAIL_PASSWORD = "voqgdhqfipxqphgd"  # Update with your app password

# In-memory storage for reset codes (use Redis in production)
reset_codes = {}
verification_codes = {}

def generate_reset_code() -> str:
    """Generate a 6-digit numeric reset code"""
    return ''.join(random.choices(string.digits, k=6))

def send_reset_email(email: str, reset_code: str) -> bool:
    """Send reset code to user's email"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = email
        msg['Subject'] = "Password Reset Code - Smart Personal Assistant"
        
        # Email body
        body = f"""
        Hello!
        
        You have requested to reset your password for your Smart Personal Assistant account.
        
        Your reset code is: {reset_code}
        
        Please enter this code in the application to reset your password.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        Smart Personal Assistant Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Create SMTP session
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        
        # Send email
        text = msg.as_string()
        server.sendmail(EMAIL_USER, email, text)
        server.quit()
        
        logger.info(f"Reset code sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending email to {email}: {str(e)}")
        return False

def store_reset_code(email: str, reset_code: str) -> None:
    """Store reset code in memory (use Redis in production)"""
    reset_codes[email] = {
        'code': reset_code,
        'timestamp': time.time()
    }

def verify_reset_code(email: str, code: str) -> bool:
    """Verify the reset code for the given email"""
    if email not in reset_codes:
        return False
    
    stored_data = reset_codes[email]
    stored_code = stored_data['code']
    timestamp = stored_data['timestamp']
    
    # Check if code is expired (15 minutes)
    if time.time() - timestamp > 900:  # 15 minutes
        del reset_codes[email]
        return False
    
    # Check if code matches
    if code == stored_code:
        # Remove the code after successful verification
        del reset_codes[email]
        return True
    
    return False

def cleanup_expired_codes():
    """Clean up expired reset codes"""
    current_time = time.time()
    expired_emails = [
        email for email, data in reset_codes.items()
        if current_time - data['timestamp'] > 900  # 15 minutes
    ]
    for email in expired_emails:
        del reset_codes[email]

def generate_verification_code() -> str:
    """Generate a 6-digit numeric verification code"""
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(email: str, verification_code: str) -> bool:
    """Send verification code to user's email"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = email
        msg['Subject'] = "Email Verification Code - Smart Personal Assistant"
        
        # Email body
        body = f"""
        Hello!
        
        Thank you for registering with Smart Personal Assistant!
        
        Your email verification code is: {verification_code}
        
        Please enter this code in the application to verify your email address.
        
        If you didn't create this account, please ignore this email.
        
        Best regards,
        Smart Personal Assistant Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Create SMTP session
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        
        # Send email
        text = msg.as_string()
        server.sendmail(EMAIL_USER, email, text)
        server.quit()
        
        logger.info(f"Verification code sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending verification email to {email}: {str(e)}")
        return False

def store_verification_code(email: str, verification_code: str) -> None:
    """Store verification code in memory (use Redis in production)"""
    verification_codes[email] = {
        'code': verification_code,
        'timestamp': time.time()
    }

def verify_verification_code(email: str, code: str) -> bool:
    """Verify the verification code for the given email"""
    if email not in verification_codes:
        return False
    
    stored_data = verification_codes[email]
    stored_code = stored_data['code']
    timestamp = stored_data['timestamp']
    
    # Check if code is expired (15 minutes)
    if time.time() - timestamp > 900:  # 15 minutes
        del verification_codes[email]
        return False
    
    # Check if code matches
    if code == stored_code:
        # Remove the code after successful verification
        del verification_codes[email]
        return True
    
    return False

def cleanup_expired_verification_codes():
    """Clean up expired verification codes"""
    current_time = time.time()
    expired_emails = [
        email for email, data in verification_codes.items()
        if current_time - data['timestamp'] > 900  # 15 minutes
    ]
    for email in expired_emails:
        del verification_codes[email]

# Clean up expired codes periodically
def cleanup_all_expired_codes():
    """Clean up all expired codes (reset and verification)"""
    cleanup_expired_codes()
    cleanup_expired_verification_codes()

def send_email(to_email: str, subject: str, body: str, from_email: str = None, attachments: list = None) -> bool:
    """Send an email via SMTP with optional attachments"""
    try:
        # Ensure from_email is not None
        if not from_email:
            from_email = EMAIL_USER
            
        # Create message
        msg = MIMEMultipart()
        
        # Set the display "From" field to the current user's email
        # This is what the recipient will see as the sender
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add Reply-To header to ensure replies go to the current user
        if from_email and from_email != EMAIL_USER:
            msg['Reply-To'] = from_email
        
        # Check if body contains HTML and create appropriate MIME part
        if '<' in body and '>' in body:
            # Body contains HTML, send as HTML
            html_part = MIMEText(body, 'html', 'utf-8')
            msg.attach(html_part)
        else:
            # Body is plain text
            text_part = MIMEText(body, 'plain', 'utf-8')
            msg.attach(text_part)
        
        # Handle attachments if provided
        if attachments and len(attachments) > 0:
            for attachment_data in attachments:
                try:
                    # Convert base64url to standard base64 for decoding
                    # Frontend sends base64url, but we need standard base64 for MIME
                    standard_base64 = attachment_data.data.replace('-', '+').replace('_', '/')
                    # Add padding if needed
                    padding = 4 - (len(standard_base64) % 4)
                    if padding != 4:
                        standard_base64 += '=' * padding
                    
                    logger.info(f"SMTP: Converting base64url to standard base64 for {attachment_data.filename}")
                    logger.info(f"SMTP: Original length: {len(attachment_data.data)}, Standard length: {len(standard_base64)}")
                    
                    # Decode base64 data
                    file_data = base64.b64decode(standard_base64)
                    
                    # Create MIME attachment
                    attachment = MIMEBase('application', 'octet-stream')
                    attachment.set_payload(file_data)
                    encoders.encode_base64(attachment)
                    
                    # Set filename
                    attachment.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {attachment_data.filename}'
                    )
                    
                    msg.attach(attachment)
                    logger.info(f"Attached file: {attachment_data.filename}")
                    
                except Exception as attach_error:
                    logger.error(f"Error attaching file {attachment_data.filename}: {str(attach_error)}")
                    # Continue with other attachments
        
        # Create SMTP session
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        
        # Send email - EMAIL_USER is the authenticated sender for SMTP
        # but the display "From" field shows the current user's email
        text = msg.as_string()
        
        # Try to send with the custom From address
        try:
            server.sendmail(from_email, to_email, text)
            logger.info(f"Email sent successfully to {to_email} from {from_email}")
        except Exception as smtp_error:
            logger.warning(f"Failed to send with custom From address {from_email}: {smtp_error}")
            logger.info("Falling back to authenticated sender address")
            # Fallback: send with authenticated sender
            server.sendmail(EMAIL_USER, to_email, text)
            logger.info(f"Email sent successfully to {to_email} using authenticated sender {EMAIL_USER}")
        
        server.quit()
        return True
        
    except Exception as e:
        logger.error(f"Error sending email to {to_email}: {str(e)}")
        return False

def send_email_via_gmail_api(
    to_email: str, 
    subject: str, 
    body: str, 
    from_email: str = None,
    access_token: str = None,
    attachments: list = None
) -> bool:
    """
    Send an email via Gmail API instead of SMTP.
    This allows sending emails that appear to come from the authenticated user's Gmail account.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        body: Email body content
        from_email: Sender email (should match the authenticated Gmail account)
        access_token: Gmail OAuth access token
        attachments: Optional list of attachment objects with filename, mime_type, size, data, is_inline
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        if not access_token:
            logger.error("Gmail API access token is required")
            return False
            
        if not from_email:
            logger.error("from_email is required for Gmail API")
            return False
        
        import httpx
        
        # Create the email message in Gmail API format
        email_message = {
            'raw': None  # Will be base64 encoded
        }
        
        # Create MIME message
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add Reply-To header if different from From
        if from_email != EMAIL_USER:
            msg['Reply-To'] = from_email
        
        # Check if body contains HTML
        if '<' in body and '>' in body:
            # Body contains HTML
            html_part = MIMEText(body, 'html', 'utf-8')
            msg.attach(html_part)
        else:
            # Body is plain text
            text_part = MIMEText(body, 'plain', 'utf-8')
            msg.attach(text_part)
        
        # Handle attachments if provided
        if attachments and len(attachments) > 0:
            try:
                for attachment_data in attachments:
                    # Convert base64url to standard base64 for decoding
                    # Gmail API sends base64url, but we need standard base64 for MIME
                    standard_base64 = attachment_data.data.replace('-', '+').replace('_', '/')
                    # Add padding if needed
                    padding = 4 - (len(standard_base64) % 4)
                    if padding != 4:
                        standard_base64 += '=' * padding
                    
                    logger.info(f"Gmail API: Converting base64url to standard base64 for {attachment_data.filename}")
                    logger.info(f"Gmail API: Original length: {len(attachment_data.data)}, Standard length: {len(standard_base64)}")
                    
                    # Decode base64 data
                    file_data = base64.b64decode(standard_base64)
                    
                    # Create MIME attachment
                    attachment = MIMEBase('application', 'octet-stream')
                    attachment.set_payload(file_data)
                    encoders.encode_base64(attachment)
                    
                    # Set filename
                    attachment.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {attachment_data.filename}'
                    )
                    
                    msg.attach(attachment)
                    logger.info(f"Gmail API: Attached file: {attachment_data.filename}")
                    
            except Exception as attach_error:
                logger.error(f"Gmail API: Error attaching file: {str(attach_error)}")
                # Continue with other attachments
        
        # Encode the message to base64
        raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode('utf-8')
        email_message['raw'] = raw_message
        
        # Send via Gmail API
        gmail_api_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        with httpx.Client() as client:
            response = client.post(
                gmail_api_url,
                headers=headers,
                json=email_message
            )
        
        if response.status_code == 200:
            logger.info(f"Email sent successfully via Gmail API to {to_email} from {from_email}")
            return True
        else:
            logger.error(f"Gmail API error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending email via Gmail API to {to_email}: {str(e)}")
        return False 