import axios from "axios";

const BASE_URL = "http://localhost:8000/api/emails";
const GMAIL_URL = "http://localhost:8000/api/gmail";

export const EmailService = {
  // List emails with new label system
  async list(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.q) queryParams.append('q', params.q);
    if (params.label) queryParams.append('label', params.label); // Filter by label (system labels or Gmail categories)
    if (params.read !== undefined) queryParams.append('read', params.read);
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    
    const res = await axios.get(`${BASE_URL}/list?${queryParams.toString()}`, { withCredentials: true });
    return res.data;
  },

  async get(id) {
    const res = await axios.get(`${BASE_URL}/get/${id}`, { withCredentials: true });
    return res.data;
  },

  async create({ sender, to_recipients, subject, body, category = "inbox", in_reply_to = null, thread_id = null, forwarded_from = null, labels = [], status = "draft", attachments = [] }) {
    const res = await axios.post(
      `${BASE_URL}/create`,
      { 
        sender, 
        to_recipients, 
        subject, 
        body, 
        category,
        in_reply_to,
        thread_id,
        forwarded_from,
        labels,
        status,
        attachments
      },
      { withCredentials: true }
    );
    return res.data;
  },

  async update(id, data) {
    const res = await axios.put(`${BASE_URL}/update/${id}`, data, { withCredentials: true });
    return res.data;
  },

  // Perform actions using new label system
  async performAction(id, action, data = {}) {
    // The backend expects all actions to go through the /action endpoint
    const res = await axios.post(`${BASE_URL}/${id}/action`, {
      action: action,
      data: data
    }, { withCredentials: true });
    return res.data;
  },

  // Restore email from trash
  async restoreFromTrash(id, previousLabel = 'inbox') {
    const res = await axios.post(`${BASE_URL}/${id}/restore`, { previous_label: previousLabel }, { withCredentials: true });
    return res.data;
  },

  // Add label to email
  async addLabelToEmail(id, labelName) {
    const res = await axios.post(`${BASE_URL}/${id}/labels`, { 
      label_name: labelName 
    }, { withCredentials: true });
    return res.data;
  },

  // Remove label from email
  async removeLabelFromEmail(id, labelName) {
    const res = await axios.delete(`${BASE_URL}/${id}/labels/${labelName}`, { withCredentials: true });
    return res.data;
  },

  async remove(id) {
    const res = await axios.delete(`${BASE_URL}/delete/${id}`, { withCredentials: true });
    return res.data;
  },

  // Email Actions
  async bulkAction(emailIds, action, data = {}) {
    const res = await axios.post(
      `${BASE_URL}/bulk-action`,
      { email_ids: emailIds, action, data },
      { withCredentials: true }
    );
    return res.data;
  },

  // Email Statistics
  async getStats() {
    const res = await axios.get(`${BASE_URL}/stats`, { withCredentials: true });
    return res.data;
  },

  // Advanced Search
  async search(query, label = null) {
    const params = { q: query };
    if (label) params.label = label;
    
    const res = await axios.get(`${BASE_URL}/search`, { params, withCredentials: true });
    return res.data;
  },

  // Category Management
  async getCategories() {
    const res = await axios.get(`${BASE_URL}/categories`, { withCredentials: true });
    return res.data;
  },

  async markAllAsRead(label = null) {
    const params = {};
    if (label) params.label = label;
    
    const res = await axios.post(`${BASE_URL}/mark-all-read`, {}, { params, withCredentials: true });
    return res.data;
  },

  // Get user labels
  async getLabels() {
    const res = await axios.get(`${BASE_URL}/labels`, { withCredentials: true });
    return res.data;
  },

  // Gmail Integration - Fetch full email body on-demand
  async fetchEmailBody(emailId) {
    const res = await axios.get(`${GMAIL_URL}/emails/${emailId}/body`, { withCredentials: true });
    return res.data;
  },

  // Gmail Integration - Check connection status
  async checkGmailConnection() {
    const res = await axios.get(`${GMAIL_URL}/connection-status`, { withCredentials: true });
    return res.data;
  },

  // Attachment Management
  async getEmailAttachments(emailId) {
    const res = await axios.get(`${GMAIL_URL}/emails/${emailId}/attachments`, { withCredentials: true });
    return res.data;
  },

  async downloadAttachment(emailId, attachmentId) {
    const res = await axios.get(`${GMAIL_URL}/emails/${emailId}/attachments/${attachmentId}/download`, { 
      withCredentials: true,
      responseType: 'blob'  // Important for file downloads
    });
    return res.data;
  },

  // Gmail Integration Methods
  async getGmailAuthUrl() {
    const res = await axios.get(`${GMAIL_URL}/auth-url`, { withCredentials: true });
    return res.data;
  },

  async getGmailEmails({ q = "", labelIds = "", maxResults = 20 } = {}) {
    const params = {};
    if (q) params.q = q;
    if (labelIds) params.label_ids = labelIds;
    params.max_results = maxResults;
    
    const res = await axios.get(`${GMAIL_URL}/emails`, { 
      params, 
      withCredentials: true 
    });
    return res.data;
  },

  async syncGmailEmails() {
    const res = await axios.post(`${GMAIL_URL}/sync-native-labels`, {}, { withCredentials: true });
    return res.data;
  }
};

export default EmailService;

