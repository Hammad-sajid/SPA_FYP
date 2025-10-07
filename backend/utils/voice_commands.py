import re
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class VoiceCommandParser:
    """
    Parse voice commands and convert them to structured actions
    Uses existing endpoints: create_task, create_event, create_email
    """
    
    def __init__(self):
        # Keywords that indicate different parts of the command
        self.keywords = {
            'task_indicators': ['create task', 'add task', 'new task', 'task'],
            'event_indicators': ['create event', 'schedule', 'book', 'event'],
            'email_indicators': ['send email', 'create email', 'write email', 'email'],
            'priority_indicators': ['high priority', 'low priority', 'medium priority', 'urgent', 'critical', 'important', 'not urgent'],
            'date_indicators': ['due', 'on', 'at', 'tomorrow', 'next week', 'next month'],
            'time_indicators': ['at', 'time', 'o\'clock', 'am', 'pm'],
            'category_indicators': ['work', 'personal', 'business', 'family', 'meeting', 'appointment'],
            'description_indicators': ['description', 'details', 'about', 'regarding', 'concerning']
        }
    
    def parse_command(self, voice_text: str, module: str) -> Dict[str, Any]:
        """
        Parse voice command and return structured action data
        
        Args:
            voice_text: Raw voice input text
            module: Target module (tasks, events, emails)
            
        Returns:
            Dict with action, type, and extracted data
        """
        try:
            voice_text = voice_text.lower().strip()
            logger.info(f"Parsing voice command: '{voice_text}' for module: {module}")
            
            if module == "tasks":
                return self._parse_task_command(voice_text)
            elif module == "events":
                return self._parse_event_command(voice_text)
            elif module == "emails":
                return self._parse_email_command(voice_text)
            else:
                return {"success": False, "error": f"Unknown module: {module}"}
                
        except Exception as e:
            logger.error(f"Error parsing voice command: {str(e)}")
            return {"success": False, "error": f"Failed to parse command: {str(e)}"}
    
    def _parse_task_command(self, voice_text: str) -> Dict[str, Any]:
        """Parse task creation commands with smart keyword detection"""
        try:
            # Extract all information using smart parsing
            parsed_data = self._smart_parse_fields(voice_text, 'task')
            
            # Ensure required fields have defaults
            title = parsed_data.get('title', 'Untitled Task')
            description = parsed_data.get('description', f'Task created via voice command: {title}')
            due_date = parsed_data.get('due_date') or self._get_default_due_date()
            importance = parsed_data.get('importance', 2)
            category = parsed_data.get('category', 'general')
            tags = parsed_data.get('tags', 'voice-created')
            
            return {
                "success": True,
                "action": "create_task",
                "type": "task",
                "data": {
                    "title": title,
                    "description": description,
                    "due_date": due_date,
                    "importance": importance,
                    "category": category,
                    "tags": tags
                }
            }
            
        except Exception as e:
            logger.error(f"Error parsing task command: {str(e)}")
            return {"success": False, "error": f"Failed to parse task command: {str(e)}"}
    
    def _parse_event_command(self, voice_text: str) -> Dict[str, Any]:
        """Parse event creation commands with smart keyword detection"""
        try:
            # Extract all information using smart parsing
            parsed_data = self._smart_parse_fields(voice_text, 'event')
            
            # Ensure required fields have defaults
            title = parsed_data.get('title', 'Untitled Event')
            description = parsed_data.get('description', f'Event created via voice command: {title}')
            event_date = parsed_data.get('event_date') or self._get_default_event_date()
            event_time = parsed_data.get('event_time') or self._get_default_event_time()
            category = parsed_data.get('category', 'general')
            location = parsed_data.get('location', 'Voice created')
            
            return {
                "success": True,
                "action": "create_event",
                "type": "event",
                "data": {
                    "title": title,
                    "description": description,
                    "event_date": event_date,
                    "event_time": event_time,
                    "duration": 60,  # Default 1 hour duration
                    "category": category,
                    "location": location
                }
            }
            
        except Exception as e:
            logger.error(f"Error parsing event command: {str(e)}")
            return {"success": False, "error": f"Failed to parse event command: {str(e)}"}
    
    def _parse_email_command(self, voice_text: str) -> Dict[str, Any]:
        """Parse email creation commands with smart keyword detection"""
        try:
            # Extract all information using smart parsing
            parsed_data = self._smart_parse_fields(voice_text, 'email')
            
            # Ensure required fields have defaults
            recipient = parsed_data.get('recipient', 'recipient@example.com')
            subject = parsed_data.get('subject', 'Email from voice command')
            body = parsed_data.get('body', f'Email created via voice command to {recipient}')
            
            return {
                "success": True,
                "action": "create_email",
                "type": "email",
                "data": {
                    "to_recipients": recipient,
                    "subject": subject,
                    "body": body
                }
            }
            
        except Exception as e:
            logger.error(f"Error parsing email command: {str(e)}")
            return {"success": False, "error": f"Failed to parse email command: {str(e)}"}
    
    def _smart_parse_fields(self, text: str, module_type: str) -> Dict[str, Any]:
        """Smart parsing that detects keywords and extracts associated data between keywords"""
        parsed_data = {}
        
        # Remove module creation keywords first
        if module_type == 'task':
            text = self._remove_keywords(text, self.keywords['task_indicators'])
        elif module_type == 'event':
            text = self._remove_keywords(text, self.keywords['event_indicators'])
        elif module_type == 'email':
            text = self._remove_keywords(text, self.keywords['email_indicators'])
        
        # Extract title (first meaningful phrase)
        title = self._extract_title(text)
        if title:
            parsed_data['title'] = title
            text = text.replace(title, '', 1).strip()
        
        # Extract priority/importance
        importance = self._extract_importance(text)
        if importance:
            parsed_data['importance'] = importance
            text = self._remove_keywords(text, self.keywords['priority_indicators'])
        
        # Extract due date for tasks
        if module_type == 'task':
            due_date = self._extract_due_date(text)
            if due_date:
                parsed_data['due_date'] = due_date
                text = self._remove_keywords(text, self.keywords['date_indicators'])
        
        # Extract event date and time
        if module_type == 'event':
            event_date = self._extract_event_date(text)
            if event_date:
                parsed_data['event_date'] = event_date
                text = self._remove_keywords(text, self.keywords['date_indicators'])
            
            event_time = self._extract_event_time(text)
            if event_time:
                parsed_data['event_time'] = event_time
                text = self._remove_keywords(text, self.keywords['time_indicators'])
        
        # Extract category
        category = self._extract_category(text)
        if category:
            parsed_data['category'] = category
            text = self._remove_keywords(text, self.keywords['category_indicators'])
        
        # Extract email-specific fields
        if module_type == 'email':
            recipient = self._extract_recipient(text)
            if recipient:
                parsed_data['recipient'] = recipient
                text = text.replace(recipient, '', 1).strip()
            
            subject = self._extract_subject(text)
            if subject:
                parsed_data['subject'] = subject
                text = text.replace(subject, '', 1).strip()
        
        # Remaining text becomes description
        remaining_text = text.strip()
        if remaining_text and len(remaining_text) > 3:
            parsed_data['description'] = remaining_text
        
        return parsed_data
    
    def _extract_title(self, text: str) -> str:
        """Extract the first meaningful phrase as title"""
        # Look for the first phrase that's not a keyword
        words = text.split()
        title_words = []
        
        for word in words:
            if len(word) > 2 and not self._is_keyword(word):
                title_words.append(word)
                if len(title_words) >= 3:  # Limit title to 3 words
                    break
        
        return ' '.join(title_words) if title_words else ''
    
    def _extract_importance(self, text: str) -> int:
        """Extract importance level from voice text using 1-3 scale (1=low, 2=medium, 3=high)"""
        if any(word in text for word in ['high priority', 'urgent', 'critical', 'high importance']):
            return 3  # High priority
        elif any(word in text for word in ['important', 'medium priority', 'medium importance']):
            return 2  # Medium priority
        elif any(word in text for word in ['low priority', 'low importance', 'not urgent']):
            return 1  # Low priority
        else:
            return 2  # Default to medium priority
    
    def _extract_due_date(self, text: str) -> Optional[str]:
        """Extract due date from voice text"""
        try:
            if 'tomorrow' in text:
                tomorrow = datetime.now() + timedelta(days=1)
                return tomorrow.strftime('%Y-%m-%d')
            elif 'next week' in text:
                next_week = datetime.now() + timedelta(weeks=1)
                return next_week.strftime('%Y-%m-%d')
            elif 'next month' in text:
                current = datetime.now()
                if current.month == 12:
                    next_month = current.replace(year=current.year + 1, month=1)
                else:
                    next_month = current.replace(month=current.month + 1)
                return next_month.strftime('%Y-%m-%d')
            else:
                # Try to extract specific date patterns
                date_patterns = [
                    r'(\d{1,2})/(\d{1,2})',
                    r'(\d{1,2})-(\d{1,2})',
                    r'(\d{1,2})\.(\d{1,2})'
                ]
                
                for pattern in date_patterns:
                    match = re.search(pattern, text)
                    if match:
                        month, day = int(match.group(1)), int(match.group(2))
                        year = datetime.now().year
                        if month < datetime.now().month or (month == datetime.now().month and day < datetime.now().day):
                            year += 1
                        return f"{year:04d}-{month:02d}-{day:02d}"
                
                return None
                
        except Exception as e:
            logger.error(f"Error extracting due date: {str(e)}")
            return None
    
    def _extract_event_date(self, text: str) -> Optional[str]:
        """Extract event date from voice text"""
        try:
            if 'tomorrow' in text:
                tomorrow = datetime.now() + timedelta(days=1)
                return tomorrow.strftime('%Y-%m-%d')
            elif 'next week' in text:
                next_week = datetime.now() + timedelta(weeks=1)
                return next_week.strftime('%Y-%m-%d')
            elif 'next month' in text:
                current = datetime.now()
                if current.month == 12:
                    next_month = current.replace(year=current.year + 1, month=1)
                else:
                    next_month = current.replace(month=current.month + 1)
                return next_month.strftime('%Y-%m-%d')
            else:
                # Try to extract specific date patterns
                date_patterns = [
                    r'(\d{1,2})/(\d{1,2})',
                    r'(\d{1,2})-(\d{1,2})',
                    r'(\d{1,2})\.(\d{1,2})'
                ]
                
                for pattern in date_patterns:
                    match = re.search(pattern, text)
                    if match:
                        month, day = int(match.group(1)), int(match.group(2))
                        year = datetime.now().year
                        if month < datetime.now().month or (month == datetime.now().month and day < datetime.now().day):
                            year += 1
                        return f"{year:04d}-{month:02d}-{day:02d}"
                
                return None
                
        except Exception as e:
            logger.error(f"Error extracting event date: {str(e)}")
            return None
    
    def _extract_event_time(self, text: str) -> Optional[str]:
        """Extract event time from voice text"""
        try:
            # Look for time patterns
            time_patterns = [
                r'(\d{1,2}):(\d{2})\s*(am|pm)',
                r'(\d{1,2})\s*(am|pm)',
                r'(\d{1,2}):(\d{2})',
                r'(\d{1,2})'
            ]
            
            for pattern in time_patterns:
                match = re.search(pattern, text)
                if match:
                    if ':' in pattern:
                        hour, minute = int(match.group(1)), int(match.group(2))
                        if 'am' in pattern or 'pm' in pattern:
                            period = match.group(3)
                            if period == 'pm' and hour != 12:
                                hour += 12
                            elif period == 'am' and hour == 12:
                                hour = 0
                    else:
                        hour = int(match.group(1))
                        minute = 0
                        if 'am' in pattern or 'pm' in pattern:
                            period = match.group(2)
                            if period == 'pm' and hour != 12:
                                hour += 12
                            elif period == 'am' and hour == 12:
                                hour = 0
                    
                    return f"{hour:02d}:{minute:02d}"
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting event time: {str(e)}")
            return None
    
    def _extract_category(self, text: str) -> str:
        """Extract category from voice text"""
        categories = {
            'work': ['work', 'office', 'business', 'professional'],
            'personal': ['personal', 'private', 'family', 'home'],
            'meeting': ['meeting', 'appointment', 'call', 'conference'],
            'urgent': ['urgent', 'critical', 'emergency']
        }
        
        for category, keywords in categories.items():
            if any(keyword in text for keyword in keywords):
                return category
        
        return 'general'  # Default category
    
    def _extract_recipient(self, text: str) -> str:
        """Extract email recipient from voice text"""
        # Look for patterns like "to john", "send to sarah", etc.
        recipient_patterns = [
            r'to (.+?)(?:\s|$)',
            r'send to (.+?)(?:\s|$)',
            r'email to (.+?)(?:\s|$)'
        ]
        
        for pattern in recipient_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()
        
        return 'recipient@example.com'  # Default recipient
    
    def _extract_subject(self, text: str) -> str:
        """Extract email subject from voice text"""
        # Look for patterns like "about project", "regarding meeting", etc.
        subject_patterns = [
            r'about (.+?)(?:\s|$)',
            r'regarding (.+?)(?:\s|$)',
            r'concerning (.+?)(?:\s|$)',
            r'subject (.+?)(?:\s|$)'
        ]
        
        for pattern in subject_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()
        
        return 'Email from voice command'  # Default subject
    
    def _remove_keywords(self, text: str, keywords: list) -> str:
        """Remove specified keywords from text"""
        for keyword in keywords:
            text = text.replace(keyword, '')
        return text.strip()
    
    def _is_keyword(self, word: str) -> bool:
        """Check if a word is a keyword"""
        for keyword_list in self.keywords.values():
            if word in keyword_list:
                return True
        return False
    
    def _get_default_due_date(self) -> str:
        """Get default due date (tomorrow)"""
        tomorrow = datetime.now() + timedelta(days=1)
        return tomorrow.strftime('%Y-%m-%d')
    
    def _get_default_event_date(self) -> str:
        """Get default event date (today)"""
        return datetime.now().strftime('%Y-%m-%d')
    
    def _get_default_event_time(self) -> str:
        """Get default event time (current time + 1 hour)"""
        default_time = datetime.now() + timedelta(hours=1)
        return default_time.strftime('%H:%M')

# Create global instance
voice_parser = VoiceCommandParser()
