import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { FaInbox, FaPaperPlane, FaStar, FaTrash, FaEdit, FaSync, FaPlus, FaEnvelope, FaEnvelopeOpen, FaSpinner, FaGoogle } from 'react-icons/fa';
import EmailService from '../../../../services/EmailService';
import EmailCompose from './EmailCompose';
import EmailRead from './EmailRead';
import GoogleMailPanel from './GoogleMailPanel';
import EmailSidebar from './EmailSidebar';
import EmailList from './EmailList';
import VoiceCommand from '../../VoiceCommand/VoiceCommand';
import axios from 'axios';

const EmailManager = () => {
  // Main state
  const [view, setView] = useState('inbox'); // inbox, compose, read
  const [emails, setEmails] = useState([]);
  const [allEmails, setAllEmails] = useState([]); // Store all emails for accurate counts
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState('inbox');
  const [currentTopTab, setCurrentTopTab] = useState('Primary'); // New state for top tabs within inbox
  
  // User state
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  
  // Gmail state
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailError, setGmailError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [gmailSuccess, setGmailSuccess] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [twoWaySync, setTwoWaySync] = useState(true);
  
  // Email selection
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmails, setTotalEmails] = useState(0);
  const emailsPerPage = 50;

  const API_BASE = "http://localhost:8000";

  // Load emails on component mount
  useEffect(() => {
    loadEmails();
    loadAllEmails(); // Load all emails for accurate counts
    checkGmailConnection();
    getCurrentUserEmail(); // Get current user email
  }, []); // Remove dependencies to load only once on mount

  // Load emails when category, top tab, or search changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when category/search changes
    loadEmails();
  }, [currentCategory, currentTopTab, searchQuery]);

  // Load emails when page changes
  useEffect(() => {
    loadEmails();
  }, [currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleTopTabChange = (topTab) => {
    setCurrentTopTab(topTab);
    // Keep currentCategory as 'inbox' when changing top tabs
    // This ensures the inbox remains active in the sidebar
  };

  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    // Reset top tab to Primary when switching away from inbox
    if (category !== 'inbox') {
      setCurrentTopTab('Primary');
    }
  };

  const loadEmails = async () => {
    setLoading(true);
    try {
      // Map frontend categories to backend labels
      let labelToQuery = undefined;
      
      if (currentCategory === 'draft') {
        labelToQuery = 'draft';
      } else if (currentCategory === 'starred') {
        labelToQuery = 'starred';
      } else if (currentCategory === 'important') {
        labelToQuery = 'important';
      } else if (currentCategory === 'inbox') {
        // For inbox, check if we need to filter by top tab
        if (['Primary', 'Social', 'Promotions', 'Updates', 'Forums'].includes(currentTopTab)) {
          // Map top tab to backend label format
          const categoryMap = {
            'Primary': 'inbox',
            'Social': 'category_social', 
            'Promotions': 'category_promotions',
            'Updates': 'category_updates',
            'Forums': 'category_forums'
          };
          // For inbox tabs, we need emails with BOTH inbox AND category labels
          // The backend will handle this filtering
          labelToQuery = categoryMap[currentTopTab];
        } else {
          labelToQuery = 'inbox';
        }
      } else if (currentCategory === 'sent') {
        labelToQuery = 'sent';
      }  else if (currentCategory === 'trash') {
        labelToQuery = 'trash';
      } else if (currentCategory === 'spam') {
        labelToQuery = 'spam';
      } else if (currentCategory === 'all') {
        labelToQuery = 'all';
      }
      
      console.log("🔍 Loading emails for category:", currentCategory, "top tab:", currentTopTab, "->", { label: labelToQuery });
      console.log("🔍 Page:", currentPage, "PageSize:", emailsPerPage);
      
      const res = await EmailService.list({ 
        q: searchQuery, 
        label: labelToQuery,
        pageSize: emailsPerPage, 
        page: currentPage 
      });
      
      console.log("🔍 API Response:", res);
      
      let filteredEmails = res.results || res;
      
      setEmails(filteredEmails);
      setTotalPages(res.totalPages || 1);
      setTotalEmails(res.totalEmails || filteredEmails.length);
      
      console.log("🔍 Emails loaded:", filteredEmails.length);
      console.log("🔍 Total pages:", res.totalPages);
      console.log("🔍 Total emails for category:", res.totalEmails);
      console.log("🔍 Pagination debug - totalPages:", res.totalPages, "totalEmails:", res.totalEmails, "pageSize:", emailsPerPage);
    } catch (error) {
      console.error("Failed to load emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllEmails = async () => {
    try {
      // Get all emails without pagination for accurate counting
      const res = await EmailService.list({ 
        pageSize: 1000, // Large page size to get all emails
        page: 1
      });
      console.log("🔍 All emails loaded:", res);
      
      // Handle paginated response
      const allEmailsData = res.results || [];
      setAllEmails(allEmailsData);
      
      // Update total counts
      if (res.totalEmails) {
        setTotalEmails(res.totalEmails);
      }
      
      console.log("🔍 Total emails in database:", res.totalEmails);
      console.log("🔍 Emails loaded for counting:", allEmailsData.length);
      console.log("🔍 Email labels:", [...new Set(allEmailsData.map(e => e.label))]);
    } catch (error) {
      console.error("Failed to load all emails:", error);
    }
  };

  // Refresh counts when sync status changes
  useEffect(() => {
    if (syncStatus === 'success') {
      loadAllEmails(); // Refresh counts after successful sync
    }
  }, [syncStatus]);

  const checkGmailConnection = async () => {
    try {
      await EmailService.getGmailEmails({ maxResults: 1 });
      setGmailConnected(true);
      setGmailError(null);
    } catch (error) {
      if (error.response?.status === 404) {
        setGmailConnected(false);
        setGmailError(null);
      } else {
        setGmailError("Failed to check Gmail connection");
      }
    }
  };

  const handleEmailClick = async (email) => {
    if (email.action) {
      // Handle special actions
      switch (email.action) {
        case 'toggle_star':
          // Toggle starring
          if (email.label && email.label.includes('starred')) {
            // Unstarring: move back to inbox
            await EmailService.performAction(email.id, 'categorize', { label: 'inbox' });
            
            // Update local state
            setEmails(prevEmails => 
              prevEmails.map(e => 
                e.id === email.id ? { ...e, starred: false, label: 'inbox' } : e
              )
            );
            
            setAllEmails(prevAllEmails => 
              prevAllEmails.map(e => 
                e.id === email.id ? { ...e, starred: false, label: 'inbox' } : e
              )
            );
          } else {
            // Starring: move to starred category
            await EmailService.performAction(email.id, 'categorize', { label: 'starred' });
            
            // Update local state
              setEmails(prevEmails => 
                prevEmails.map(e => 
                e.id === email.id ? { ...e, starred: true, label: 'starred' } : e
                )
              );
            
              setAllEmails(prevAllEmails => 
                prevAllEmails.map(e => 
                e.id === email.id ? { ...e, starred: true, label: 'starred' } : e
              )
            );
          }
          break;
          
        case 'toggle_read':
          // Toggle read status
          const newReadStatus = !email.read;
          await EmailService.performAction(email.id, 'mark_read', { read: newReadStatus });
          
          // Update local state with both read property and labels
          const updatedEmail = { ...email, read: newReadStatus };
          
          // Update labels array for read/unread
          if (!updatedEmail.labels) updatedEmail.labels = [];
          if (typeof updatedEmail.labels === 'string') {
            updatedEmail.labels = JSON.parse(updatedEmail.labels);
          }
          
          if (newReadStatus) {
            // Remove unread label when marking as read
            updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'unread');
            } else {
            // Add unread label when marking as unread
            if (!updatedEmail.labels.includes('unread')) {
              updatedEmail.labels.push('unread');
            }
          }
          
          // Update both emails and allEmails lists
              setEmails(prevEmails => 
                prevEmails.map(e => 
              e.id === email.id ? updatedEmail : e
                )
              );
          
              setAllEmails(prevAllEmails => 
                prevAllEmails.map(e => 
              e.id === email.id ? updatedEmail : e
            )
          );
          break;
          
        case 'delete':
          // First remove all existing labels, then move to trash
          try {
            // Get current labels to remove them
            let currentLabels = [];
            if (email.labels) {
              if (typeof email.labels === 'string') {
                try {
                  currentLabels = JSON.parse(email.labels);
                } catch (error) {
                  currentLabels = [];
                }
              } else if (Array.isArray(email.labels)) {
                currentLabels = [...email.labels];
              }
            }
            
            // Remove all existing labels one by one
            for (const label of currentLabels) {
              if (label !== 'trash') { // Don't remove trash label if it already exists
                try {
                  await EmailService.removeLabelFromEmail(email.id, label);
                  console.log(`🗑️ Removed label: ${label}`);
                } catch (error) {
                  console.warn(`Failed to remove label ${label}:`, error);
                }
              }
            }
            
            // Now move to trash
            await EmailService.performAction(email.id, 'move_to_trash');
          
            // Show success feedback
            console.log(`✅ Email "${email.subject}" moved to trash successfully`);
          } catch (error) {
            console.error('Failed to delete email:', error);
            return; // Don't proceed with state updates if backend operations failed
          }
          
          // Update local state - remove from current emails list if not viewing trash
          if (currentCategory !== 'trash') {
            setEmails(prevEmails => {
              const updatedEmails = prevEmails.filter(e => e.id !== email.id);
              // If we're on a page that becomes empty, go to previous page
              if (updatedEmails.length === 0 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
              }
              // If no emails left and we're not on page 1, go to page 1
              if (updatedEmails.length === 0 && currentPage === 1) {
                // Force reload to show empty state
                setTimeout(() => loadEmails(), 50);
              }
              return updatedEmails;
            });
          } else {
            // If viewing trash, just update the label
          setEmails(prevEmails => 
            prevEmails.map(e => 
              e.id === email.id ? { ...e, label: 'trash' } : e
            )
          );
          }
          
          // Update allEmails list - remove all labels and set only trash
            setAllEmails(prevAllEmails => 
              prevAllEmails.map(e => 
              e.id === email.id ? { ...e, label: 'trash', labels: ['trash'] } : e
            )
          );
          
          // Refresh the current email list to ensure consistency and update counts
          setTimeout(() => {
            loadEmails();
            loadAllEmails(); // Also refresh the all emails for accurate counts
          }, 100);
          break;
      }
    } else {
      // Regular email click - open email
      // Always mark email as read when opened for viewing
      const hasUnreadLabel = (() => {
        if (!email.labels) return false;
        if (typeof email.labels === 'string') {
          try {
            const parsedLabels = JSON.parse(email.labels);
            return Array.isArray(parsedLabels) && parsedLabels.includes('unread');
          } catch (error) {
            return false;
          }
      }
        return Array.isArray(email.labels) && email.labels.includes('unread');
      })();
    
      if (hasUnreadLabel) {
        // Mark as read by removing unread label
      await EmailService.performAction(email.id, 'mark_read', { read: true });
      
        // Update local state to remove unread label
        const updatedEmail = { ...email, read: true };
        if (!updatedEmail.labels) updatedEmail.labels = [];
        if (typeof updatedEmail.labels === 'string') {
          updatedEmail.labels = JSON.parse(updatedEmail.labels);
        }
        updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'unread');
        
        // Update both lists
      setEmails(prevEmails => 
        prevEmails.map(e => 
            e.id === email.id ? updatedEmail : e
        )
      );
        
      setAllEmails(prevAllEmails => 
        prevAllEmails.map(e => 
            e.id === email.id ? updatedEmail : e
          )
        );
        
        // Open the updated email
        setSelectedEmail(updatedEmail);
      } else {
        // Email is already read, just open it
      setSelectedEmail(email);
      }
      setView('read');
    }
  };

  const handleCompose = () => {
    setSelectedEmail(null);
    setView('compose');
  };

  const handleBackToInbox = () => {
    setSelectedEmail(null);
    setView('inbox');
  };

  const handleEmailAction = async (emailId, action, data = {}) => {
    try {
      // Map frontend action names to backend action names
      let actionName = '';
      let actionData = {};
      
      switch (action) {
        case 'read':
          actionName = 'mark_read';
          actionData = { read: data.read };
          break;
        case 'star':
          actionName = 'categorize';
          actionData = { label: data.starred ? 'starred' : 'inbox' };
          break;
        case 'add_star':
          actionName = 'apply_label';
          actionData = { label: 'starred' };
          break;
        case 'remove_star':
          actionName = 'remove_label';
          actionData = { label: 'starred' };
          break;
        case 'archive':
          actionName = 'apply_label';
          actionData = { label: 'all' };
          break;
        case 'move':
          if (data.label === 'trash') {
            actionName = 'move_to_trash';
          } else {
            actionName = 'categorize';
            actionData = { label: data.label };
          }
          break;
        case 'restore':
          actionName = 'restore_from_trash';
          actionData = { previous_label: data.previous_label || 'inbox' };
          break;
        case 'apply_label':
          actionName = 'add_label';
          actionData = { label: data.label };
          break;
        case 'remove_label':
          actionName = 'remove_label';
          actionData = { label: data.label };
          break;
        case 'delete':
          // For delete action, we need to handle label removal separately
          // since the backend move_to_trash might not remove all labels
          console.log('Delete action detected - will handle label cleanup separately');
          actionName = 'move_to_trash';
          break;
        case 'unread':
          actionName = 'mark_read';
          actionData = { read: false };
          break;
        case 'archive':
          actionName = 'archive';
          break;
        case 'move_to_trash':
          actionName = 'move_to_trash';
          break;
        case 'move_to_inbox':
          actionName = 'restore_from_trash';
          actionData = { previous_label: 'inbox' };
          break;
        case 'move_to_spam':
          actionName = 'restore_from_trash';
          actionData = { previous_label: 'spam' };
          break;
        case 'move_to_social':
          actionName = 'restore_from_trash';
          actionData = { previous_label: 'category_social' };
          break;
        case 'move_to_promotions':
          actionName = 'restore_from_trash';
          actionData = { previous_label: 'category_promotions' };
          break;
        case 'move_to_updates':
          actionName = 'restore_from_trash';
          actionData = { previous_label: 'category_updates' };
          break;
        case 'move_to_forums':
          actionName = 'restore_from_trash';
          actionData = { previous_label: 'category_forums' };
          break;
        case 'delete_forever':
          actionName = 'delete';
          break;
        case 'toggle_read':
          actionName = 'mark_read';
          // Find the email first to get its current read status
          const currentEmail = allEmails.find(e => e.id === emailId);
          if (!currentEmail) {
            console.error('Email not found for toggle_read action');
            return;
          }
          actionData = { read: !currentEmail.read };
          break;
        default:
          console.warn(`Unknown action: ${action}`);
          return;
      }
      
      console.log(`🔍 EmailManager: handleEmailAction called with:`, { emailId, action, actionName, actionData });
      
      const result = await EmailService.performAction(emailId, actionName, actionData);
      console.log(`🔍 EmailManager: action result:`, result);
      
      // Update local email state based on the action performed
      const updatedEmail = { ...allEmails.find(e => e.id === emailId) };
      
      if (action === 'star') {
        // Star/Unstar: Add/remove starred label and update starred status
        if (data.starred) {
          // Add starred label
          if (!updatedEmail.labels) updatedEmail.labels = [];
          if (typeof updatedEmail.labels === 'string') {
            updatedEmail.labels = JSON.parse(updatedEmail.labels);
          }
          if (!updatedEmail.labels.includes('starred')) {
            updatedEmail.labels.push('starred');
          }
          if (!updatedEmail.labels.includes('yellow_star')) {
            updatedEmail.labels.push('yellow_star');
          }
          updatedEmail.starred = true;
        } else {
          // Remove starred label
          if (updatedEmail.labels && Array.isArray(updatedEmail.labels)) {
            updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'starred');
            updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'yellow_star');
          }
          updatedEmail.starred = false;
        }
      } else if (action === 'add_star') {
        // Add star: Add both starred and yellow_star labels
        if (!updatedEmail.labels) updatedEmail.labels = [];
        if (typeof updatedEmail.labels === 'string') {
          updatedEmail.labels = JSON.parse(updatedEmail.labels);
        }
        if (!updatedEmail.labels.includes('starred')) {
          updatedEmail.labels.push('starred');
        }
        if (!updatedEmail.labels.includes('yellow_star')) {
          updatedEmail.labels.push('yellow_star');
        }
        updatedEmail.starred = true;
      } else if (action === 'remove_star') {
        // Remove star: Remove both starred and yellow_star labels
        if (updatedEmail.labels && Array.isArray(updatedEmail.labels)) {
          updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'starred');
          updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'yellow_star');
        }
        updatedEmail.starred = false;
      } else if (action === 'read') {
        // Mark as read/unread: Add/remove unread label
        updatedEmail.read = data.read;
        if (!updatedEmail.labels) updatedEmail.labels = [];
        if (typeof updatedEmail.labels === 'string') {
          updatedEmail.labels = JSON.parse(updatedEmail.labels);
        }
        
        if (data.read) {
          // Remove unread label
          updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'unread');
        } else {
          // Add unread label
          if (!updatedEmail.labels.includes('unread')) {
            updatedEmail.labels.push('unread');
          }
        }
      } else if (action === 'toggle_read') {
        // Toggle read status: Add/remove unread label
        const newReadStatus = !updatedEmail.read;
        updatedEmail.read = newReadStatus;
        if (!updatedEmail.labels) updatedEmail.labels = [];
        if (typeof updatedEmail.labels === 'string') {
          updatedEmail.labels = JSON.parse(updatedEmail.labels);
        }
        
        if (newReadStatus) {
          // Remove unread label
          updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'unread');
        } else {
          // Add unread label
          if (!updatedEmail.labels.includes('unread')) {
            updatedEmail.labels.push('unread');
          }
        }
      } else if (action === 'delete') {
        // Move to trash: Remove ALL labels, add only trash label
        // Note: The actual label removal is handled in handleEmailClick before calling this function
        updatedEmail.labels = ['trash']; // Replace all labels with just trash
        updatedEmail.label = 'trash';
      } else if (action === 'archive') {
        // Archive: Remove inbox label, add all label
        if (!updatedEmail.labels) updatedEmail.labels = [];
        if (typeof updatedEmail.labels === 'string') {
          updatedEmail.labels = JSON.parse(updatedEmail.labels);
        }
        updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'inbox');
        if (!updatedEmail.labels.includes('all')) {
          updatedEmail.labels.push('all');
        }
        updatedEmail.label = 'all';
      } else if (action === 'restore') {
        // Restore from trash: Remove trash label, add previous label
        if (!updatedEmail.labels) updatedEmail.labels = [];
        if (typeof updatedEmail.labels === 'string') {
          updatedEmail.labels = JSON.parse(updatedEmail.labels);
        }
        updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'trash');
        if (data.previous_label && !updatedEmail.labels.includes(data.previous_label)) {
          updatedEmail.labels.push(data.previous_label);
        }
        updatedEmail.label = data.previous_label || 'inbox';
      } else if (action === 'apply_label') {
        // Apply label: Add new label
        if (!updatedEmail.labels) updatedEmail.labels = [];
        if (typeof updatedEmail.labels === 'string') {
          updatedEmail.labels = JSON.parse(updatedEmail.labels);
        }
        if (!updatedEmail.labels.includes(data.label)) {
          updatedEmail.labels.push(data.label);
        }
      } else if (action === 'remove_label') {
        // Remove label: Remove specific label
        if (updatedEmail.labels && Array.isArray(updatedEmail.labels)) {
          if (typeof updatedEmail.labels === 'string') {
            updatedEmail.labels = JSON.parse(updatedEmail.labels);
          }
          updatedEmail.labels = updatedEmail.labels.filter(label => label !== data.label);
        }
      } else if (action === 'unread') {
        // Mark as unread: Add unread label
        updatedEmail.read = false;
        if (!updatedEmail.labels) updatedEmail.labels = [];
        if (typeof updatedEmail.labels === 'string') {
          updatedEmail.labels = JSON.parse(updatedEmail.labels);
        }
        if (!updatedEmail.labels.includes('unread')) {
          updatedEmail.labels.push('unread');
        }
      } else if (action === 'archive') {
        // Archive: Remove inbox label, add all label
        if (!updatedEmail.labels) updatedEmail.labels = [];
        if (typeof updatedEmail.labels === 'string') {
          updatedEmail.labels = JSON.parse(updatedEmail.labels);
        }
        updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'inbox');
        if (!updatedEmail.labels.includes('all')) {
          updatedEmail.labels.push('all');
        }
        updatedEmail.label = 'all';
      } else if (action === 'move_to_trash') {
        // Move to trash: Replace all labels with trash
        updatedEmail.labels = ['trash'];
        updatedEmail.label = 'trash';
      } else if (action === 'move_to_inbox' || action === 'move_to_spam' || action === 'move_to_social' || action === 'move_to_promotions' || action === 'move_to_updates' || action === 'move_to_forums') {
        // Restore from trash: Remove trash label, add new label
        if (!updatedEmail.labels) updatedEmail.labels = [];
        if (typeof updatedEmail.labels === 'string') {
          updatedEmail.labels = JSON.parse(updatedEmail.labels);
        }
        updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'trash');
        
        let newLabel = '';
        if (action === 'move_to_inbox') newLabel = 'inbox';
        else if (action === 'move_to_spam') newLabel = 'spam';
        else if (action === 'move_to_social') newLabel = 'category_social';
        else if (action === 'move_to_promotions') newLabel = 'category_promotions';
        else if (action === 'move_to_updates') newLabel = 'category_updates';
        else if (action === 'move_to_forums') newLabel = 'category_forums';
        
        if (newLabel && !updatedEmail.labels.includes(newLabel)) {
          updatedEmail.labels.push(newLabel);
        }
        updatedEmail.label = newLabel;
      } else if (action === 'delete_forever') {
        // Delete forever: Remove from all lists
        // This will be handled by filtering out the email
      }
      
      console.log(`🔍 EmailManager: updated email state:`, updatedEmail);
      
      // Update both emails and allEmails lists
      // For some actions, we need to remove emails from the current view
      if (action === 'move_to_trash' || action === 'delete_forever') {
        // Remove from current emails list (current view)
        setEmails(prevEmails => 
          prevEmails.filter(e => e.id !== emailId)
        );
        
        // For delete_forever, also remove from allEmails
        if (action === 'delete_forever') {
          setAllEmails(prevAllEmails => 
            prevAllEmails.filter(e => e.id !== emailId)
          );
        } else {
          // For move_to_trash, update in allEmails
          setAllEmails(prevAllEmails => 
            prevAllEmails.map(e => 
              e.id === emailId ? updatedEmail : e
            )
          );
        }
      } else if (action === 'archive' && currentCategory === 'inbox') {
        // Remove archived emails from inbox view
        setEmails(prevEmails => 
          prevEmails.filter(e => e.id !== emailId)
        );
        
        // Update in allEmails
        setAllEmails(prevAllEmails => 
          prevAllEmails.map(e => 
            e.id === emailId ? updatedEmail : e
          )
        );
      } else if (action === 'move_to_inbox' || action === 'move_to_spam' || action === 'move_to_social' || action === 'move_to_promotions' || action === 'move_to_updates' || action === 'move_to_forums') {
        // Remove restored emails from trash view
        if (currentCategory === 'trash') {
          setEmails(prevEmails => 
            prevEmails.filter(e => e.id !== emailId)
          );
        }
        
        // Update in allEmails
        setAllEmails(prevAllEmails => 
          prevAllEmails.map(e => 
            e.id === emailId ? updatedEmail : e
          )
        );
      } else {
        // Regular update for other actions
      setEmails(prevEmails => 
        prevEmails.map(e => 
          e.id === emailId ? updatedEmail : e
        )
      );
      
      setAllEmails(prevAllEmails => 
        prevAllEmails.map(e => 
          e.id === emailId ? updatedEmail : e
        )
      );
      }
      
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedEmails.size === 0) return;
    
    try {
      console.log(`🚀 Starting bulk ${action} for ${selectedEmails.size} emails...`);
      
      // For star/unstar actions, we need to handle both starred and yellow_star labels
      if (action === 'starred' || action === 'unstarred') {
        const promises = Array.from(selectedEmails).map(async (emailId) => {
          try {
            if (action === 'starred') {
              // Add both starred and yellow_star labels
              await EmailService.addLabelToEmail(emailId, 'starred');
              await EmailService.addLabelToEmail(emailId, 'yellow_star');
            } else {
              // Remove both starred and yellow_star labels
              await EmailService.removeLabelFromEmail(emailId, 'starred');
              await EmailService.removeLabelFromEmail(emailId, 'yellow_star');
            }
            return { emailId, action, success: true };
          } catch (error) {
            console.error(`Failed to ${action} email ${emailId}:`, error);
            return { emailId, action, success: false, error };
          }
        });
        
        const results = await Promise.all(promises);
        
        // Update local state immediately for better performance
        setEmails(prevEmails => 
          prevEmails.map(email => {
            if (selectedEmails.has(email.id)) {
              const updatedEmail = { ...email };
              if (!updatedEmail.labels) updatedEmail.labels = [];
              if (typeof updatedEmail.labels === 'string') {
                try {
                  updatedEmail.labels = JSON.parse(updatedEmail.labels);
                } catch (error) {
                  updatedEmail.labels = [];
                }
              }
              
              if (action === 'starred') {
                // Add both labels if not present
                if (!updatedEmail.labels.includes('starred')) {
                  updatedEmail.labels.push('starred');
                }
                if (!updatedEmail.labels.includes('yellow_star')) {
                  updatedEmail.labels.push('yellow_star');
                }
                updatedEmail.starred = true;
              } else {
                // Remove both labels
                updatedEmail.labels = updatedEmail.labels.filter(label => 
                  label !== 'starred' && label !== 'yellow_star'
                );
                updatedEmail.starred = false;
              }
              return updatedEmail;
            }
            return email;
          })
        );
        
        setAllEmails(prevAllEmails => 
          prevAllEmails.map(email => {
            if (selectedEmails.size > 0 && selectedEmails.has(email.id)) {
              const updatedEmail = { ...email };
              if (!updatedEmail.labels) updatedEmail.labels = [];
              if (typeof updatedEmail.labels === 'string') {
                try {
                  updatedEmail.labels = JSON.parse(updatedEmail.labels);
                } catch (error) {
                  updatedEmail.labels = [];
                }
              }
              
              if (action === 'starred') {
                // Add both labels if not present
                if (!updatedEmail.labels.includes('starred')) {
                  updatedEmail.labels.push('starred');
                }
                if (!updatedEmail.labels.includes('yellow_star')) {
                  updatedEmail.labels.push('yellow_star');
                }
                updatedEmail.starred = true;
              } else {
                // Remove both labels
                updatedEmail.labels = updatedEmail.labels.filter(label => 
                  label !== 'starred' && label !== 'yellow_star'
                );
                updatedEmail.starred = false;
              }
              return updatedEmail;
            }
            return email;
          })
        );
        
      } else {
        // Handle other actions (read, unread, archive, delete, restore)
      const promises = Array.from(selectedEmails).map(async (emailId) => {
        let actionName = '';
        let actionData = {};
        
        switch (action) {
          case 'read':
            actionName = 'mark_read';
            actionData = { read: true };
            break;
          case 'unread':
            actionName = 'mark_read';
            actionData = { read: false };
            break;
          case 'archived':
              // For archive, we need to handle both removing inbox and adding all labels
              // We'll handle this manually since backend might not support both operations
              try {
                // First remove the inbox label
                await EmailService.removeLabelFromEmail(emailId, 'inbox');
                // Then add the all label
                await EmailService.addLabelToEmail(emailId, 'all');
                return { emailId, action: 'archived', success: true };
              } catch (error) {
                console.error(`Failed to archive email ${emailId}:`, error);
                return { emailId, action: 'archived', success: false, error };
              }
          case 'delete':
            actionName = 'move_to_trash';
            break;
            case 'move_to_inbox':
            actionName = 'restore_from_trash';
            actionData = { previous_label: 'inbox' };
            break;
            case 'move_to_spam':
              actionName = 'restore_from_trash';
              actionData = { previous_label: 'spam' };
              break;
            case 'move_to_social':
              actionName = 'restore_from_trash';
              actionData = { previous_label: 'category_social' };
              break;
            case 'move_to_promotions':
              actionName = 'restore_from_trash';
              actionData = { previous_label: 'category_promotions' };
              break;
            case 'move_to_updates':
              actionName = 'restore_from_trash';
              actionData = { previous_label: 'category_updates' };
              break;
            case 'move_to_forums':
              actionName = 'restore_from_trash';
              actionData = { previous_label: 'category_forums' };
              break;
            case 'delete_forever':
              // Use the remove method to permanently delete emails
              try {
                await EmailService.remove(emailId);
                return { emailId, action: 'delete_forever', success: true };
              } catch (error) {
                console.error(`Failed to permanently delete email ${emailId}:`, error);
                return { emailId, action: 'delete_forever', success: false, error };
              }
          default:
            console.warn(`Unknown bulk action: ${action}`);
              return { emailId, action, success: false };
        }
        
          try {
        await EmailService.performAction(emailId, actionName, actionData);
            return { emailId, action, success: true };
          } catch (error) {
            console.error(`Failed to perform ${action} on email ${emailId}:`, error);
            return { emailId, action, success: false, error };
          }
      });
      
      const results = await Promise.all(promises);
      
        // Update local state immediately for better performance
        setEmails(prevEmails => 
          prevEmails.map(email => {
            if (selectedEmails.has(email.id)) {
              const updatedEmail = { ...email };
          
          switch (action) {
            case 'read':
                  updatedEmail.read = true;
                  // Remove unread label
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'unread');
              break;
                  
            case 'unread':
                  updatedEmail.read = false;
                  // Add unread label
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  if (!updatedEmail.labels.includes('unread')) {
                    updatedEmail.labels.push('unread');
                  }
              break;
                  
                case 'archived':
                  updatedEmail.label = 'all';
                  // Remove inbox label, add all label
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'inbox');
                  if (!updatedEmail.labels.includes('all')) {
                    updatedEmail.labels.push('all');
                  }
                  // Remove from current view since it's no longer in inbox
                  return null; // This will filter out the email
                  break;
                  
                case 'delete':
                  // Remove from current list
                  return null; // This will filter out the email
                  
                case 'move_to_inbox':
                  updatedEmail.label = 'inbox';
                  // Remove trash label, add inbox label
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'trash');
                  if (!updatedEmail.labels.includes('inbox')) {
                    updatedEmail.labels.push('inbox');
                  }
                  // Remove from current view since it's no longer in trash
                  return null; // This will filter out the email
              break;
                case 'move_to_spam':
                  updatedEmail.label = 'spam';
                  // Remove trash label, add spam label
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'trash');
                  if (!updatedEmail.labels.includes('spam')) {
                    updatedEmail.labels.push('spam');
                }
                  // Remove from current view since it's no longer in trash
                  return null; // This will filter out the email
              break;
                case 'move_to_social':
                  updatedEmail.label = 'category_social';
                  // Remove trash label, add social label
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'trash');
                  if (!updatedEmail.labels.includes('category_social')) {
                    updatedEmail.labels.push('category_social');
                  }
                  // Remove from current view since it's no longer in trash
                  return null; // This will filter out the email
              break;
                case 'move_to_promotions':
                  updatedEmail.label = 'category_promotions';
                  // Remove trash label, add promotions label
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'trash');
                  if (!updatedEmail.labels.includes('category_promotions')) {
                    updatedEmail.labels.push('category_promotions');
                  }
                  // Remove from current view since it's no longer in trash
                  return null; // This will filter out the email
                  break;
                case 'move_to_updates':
                  updatedEmail.label = 'category_updates';
                  // Remove trash label, add updates label
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'trash');
                  if (!updatedEmail.labels.includes('category_updates')) {
                    updatedEmail.labels.push('category_updates');
                  }
                  // Remove from current view since it's no longer in trash
                  return null; // This will filter out the email
                  break;
                case 'move_to_forums':
                  updatedEmail.label = 'category_forums';
                  // Remove trash label, add forums label
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'trash');
                  if (!updatedEmail.labels.includes('category_forums')) {
                    updatedEmail.labels.push('category_forums');
                  }
                  // Remove from current view since it's no longer in trash
                  return null; // This will filter out the email
                  break;
                case 'delete_forever':
                  // Remove from current list permanently
                  return null; // This will filter out the email
                  break;
              }
              
              return updatedEmail;
            }
            return email;
          }).filter(Boolean) // Remove null values (deleted emails)
        );
        
          setAllEmails(prevAllEmails => 
          prevAllEmails.map(email => {
            if (selectedEmails.has(email.id)) {
              const updatedEmail = { ...email };
              
              switch (action) {
                case 'read':
                  updatedEmail.read = true;
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'unread');
                  break;
                  
                case 'unread':
                  updatedEmail.read = false;
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  if (!updatedEmail.labels.includes('unread')) {
                    updatedEmail.labels.push('unread');
                  }
                  break;
                  
                case 'archived':
                  updatedEmail.label = 'all';
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'inbox');
                  if (!updatedEmail.labels.includes('all')) {
                    updatedEmail.labels.push('all');
                  }
                  break;
                  
                case 'delete':
                  updatedEmail.label = 'trash';
                  updatedEmail.labels = ['trash'];
                  break;
                  
                case 'move_to_inbox':
                  updatedEmail.label = 'inbox';
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'trash');
                  if (!updatedEmail.labels.includes('inbox')) {
                    updatedEmail.labels.push('inbox');
                  }
                  break;
                case 'move_to_spam':
                  updatedEmail.label = 'spam';
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'trash');
                  if (!updatedEmail.labels.includes('spam')) {
                    updatedEmail.labels.push('spam');
                  }
                  break;
                case 'move_to_social':
                  updatedEmail.label = 'category_social';
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'trash');
                  if (!updatedEmail.labels.includes('category_social')) {
                    updatedEmail.labels.push('category_social');
                  }
                  break;
                case 'move_to_promotions':
                  updatedEmail.label = 'category_promotions';
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'trash');
                  if (!updatedEmail.labels.includes('category_promotions')) {
                    updatedEmail.labels.push('category_promotions');
                  }
                  break;
                case 'move_to_updates':
                  updatedEmail.label = 'category_updates';
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'trash');
                  if (!updatedEmail.labels.includes('category_updates')) {
                    updatedEmail.labels.push('category_updates');
                  }
                  break;
                case 'move_to_forums':
                  updatedEmail.label = 'category_forums';
                  if (!updatedEmail.labels) updatedEmail.labels = [];
                  if (typeof updatedEmail.labels === 'string') {
                    try {
                      updatedEmail.labels = JSON.parse(updatedEmail.labels);
                    } catch (error) {
                      updatedEmail.labels = [];
                    }
                  }
                  updatedEmail.labels = updatedEmail.labels.filter(label => label !== 'trash');
                  if (!updatedEmail.labels.includes('category_forums')) {
                    updatedEmail.labels.push('category_forums');
                  }
                  break;
                case 'delete_forever':
                  // For delete forever, we don't update allEmails since it's permanently deleted
                  // The email will be removed from the current view only
                  break;
              }
              
              return updatedEmail;
            }
            return email;
          })
        );
      }
      
      // Clear selection
      setSelectedEmails(new Set());
      setSelectAll(false);
      
      console.log(`✅ Bulk ${action} completed successfully for ${selectedEmails.size} emails`);
      
      // Reload emails for actions that change the current view
      if (action === 'delete' || action === 'archived' || action === 'delete_forever' || 
          action === 'move_to_inbox' || action === 'move_to_spam' || action === 'move_to_social' || 
          action === 'move_to_promotions' || action === 'move_to_updates' || action === 'move_to_forums') {
        setTimeout(() => {
          loadEmails();
          loadAllEmails();
        }, 100);
      }
      
    } catch (error) {
      console.error(`Failed to perform bulk ${action}:`, error);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmails(new Set());
      setSelectAll(false);
    } else {
      setSelectedEmails(new Set(emails.map(e => e.id)));
      setSelectAll(true);
    }
  };

  const handleEmailSelect = (emailId) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
    setSelectAll(newSelected.size === emails.length);
  };

  const getUnreadCount = () => {
    const count = allEmails.filter(email => {
      if (!email.labels) return false;
      try {
        // Parse labels if it's a JSON string
        const labels = typeof email.labels === 'string' ? JSON.parse(email.labels) : email.labels;
        return Array.isArray(labels) && labels.includes('unread');
      } catch (error) {
        console.error('Error parsing labels for email:', email.id, error);
        return false;
      }
    }).length;
    console.log('Unread count (using unread label):', count, 'Total emails:', allEmails.length);
    return count;
  };

  // Function to get current user email
  const getCurrentUserEmail = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/auth/users/me`, { withCredentials: true });
      if (response.data && response.data.email) {
        setCurrentUserEmail(response.data.email);
        console.log('Current user email set to:', response.data.email);
      }
    } catch (error) {
      console.error('Failed to get current user email:', error);
    }
  };

  // Render different views
  if (view === 'compose') {
    return (
      <EmailCompose 
        onBack={handleBackToInbox}
        onSent={() => {
          setView('inbox');
          loadEmails();
        }}
        currentUserEmail={currentUserEmail}
      />
    );
  }

  if (view === 'read' && selectedEmail) {
    return (
      <EmailRead 
        email={selectedEmail}
        onBack={handleBackToInbox}
        onUpdate={handleEmailAction}
        currentUserEmail={currentUserEmail}
        currentCategory={currentCategory}
      />
    );
  }

  // Main inbox view
  return (
    <div className="email-manager">
      <Card>
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">
            <FaEnvelope className="fa-1x text-primary me-3" />
            Email Manager
          </h4>
          
          <VoiceCommand 
            module="emails" 
            onSuccess={(data) => {
              // Refresh emails after voice command success
              loadEmails();
              loadAllEmails();
            }}
            buttonVariant="outline-info"
            buttonSize="sm"
            buttonText="🗣️ Voice"
          />
        </div>

        <div className="card-body p-0">
          {/* Gmail Integration Panel - Inside the main card */}
          <div className="p-3 border-bottom">
            <GoogleMailPanel onRefresh={loadEmails} onRefreshCounts={loadAllEmails} />
          </div>
          <Row className="g-0">
            {/* Left Sidebar */}
            <Col lg={3} className="border-end">
              <EmailSidebar 
                currentCategory={currentCategory}
                setCurrentCategory={handleCategoryChange}
                handleCompose={handleCompose}
                emails={emails}
                allEmails={allEmails}
                getUnreadCount={getUnreadCount}
              />
            </Col>

            {/* Main Content */}
            <Col lg={9}>
              <div className="p-3">

                {/* Email List */}
                <EmailList 
                  emails={emails} 
                  loading={loading} 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedEmails={selectedEmails} 
                  selectAll={selectAll} 
                  handleSelectAll={handleSelectAll}
                  handleEmailSelect={handleEmailSelect} 
                  handleEmailClick={handleEmailClick} 
                  handleBulkAction={handleBulkAction} 
                  gmailConnected={gmailConnected} 
                  gmailError={gmailError} 
                  syncStatus={syncStatus} 
                  setGmailError={setGmailError}
                  setSyncStatus={setSyncStatus}
                  // Pagination props
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalEmails={totalEmails}
                  emailsPerPage={emailsPerPage}
                  handlePageChange={handlePageChange}
                  // Top tab props
                  currentCategory={currentCategory}
                  currentTopTab={currentTopTab}
                  onTopTabChange={handleTopTabChange}
                />
              </div>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
};

export default EmailManager;