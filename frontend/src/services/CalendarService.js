// import axios from "axios";

// const BASE_URL = "http://localhost:8000/api/google-calendar";
// const EVENTS_URL = "http://localhost:8000/api/events";

// export const CalendarService = {
//   // Google Calendar OAuth & Connection
//   async getAuthUrl() {
//     const res = await axios.get(`${BASE_URL}/auth-url`, { withCredentials: true });
//     return res.data;
//   },

//   async exchangeToken(code) {
//     const res = await axios.post(`${BASE_URL}/callback`, { code }, { withCredentials: true });
//     return res.data;
//   },

//   async checkConnectionStatus() {
//     const res = await axios.get(`${BASE_URL}/connection-status`, { withCredentials: true });
//     return res.data;
//   },

//   async disconnect() {
//     const res = await axios.post(`${BASE_URL}/disconnect`, {}, { withCredentials: true });
//     return res.data;
//   },

//   async refreshToken() {
//     const res = await axios.post(`${BASE_URL}/refresh-token`, {}, { withCredentials: true });
//     return res.data;
//   },

//   // Calendar Management
//   async getCalendars() {
//     const res = await axios.get(`${BASE_URL}/calendars`, { withCredentials: true });
//     return res.data;
//   },

//   async getCalendarById(calendarId) {
//     const res = await axios.get(`${BASE_URL}/calendars/${calendarId}`, { withCredentials: true });
//     return res.data;
//   },

//   async createCalendar(calendarData) {
//     const res = await axios.post(`${BASE_URL}/calendars`, calendarData, { withCredentials: true });
//     return res.data;
//   },

//   async updateCalendar(calendarId, calendarData) {
//     const res = await axios.put(`${BASE_URL}/calendars/${calendarId}`, calendarData, { withCredentials: true });
//     return res.data;
//   },

//   async deleteCalendar(calendarId) {
//     const res = await axios.delete(`${BASE_URL}/calendars/${calendarId}`, { withCredentials: true });
//     return res.data;
//   },

//   // Calendar Sync
//   async syncCalendars() {
//     const res = await axios.post(`${BASE_URL}/sync`, {}, { withCredentials: true });
//     return res.data;
//   },

//   async syncSpecificCalendar(calendarId) {
//     const res = await axios.post(`${BASE_URL}/sync/${calendarId}`, {}, { withCredentials: true });
//     return res.data;
//   },

//   // Event Management
//   async getEvents({ 
//     calendarId = "primary", 
//     timeMin = null, 
//     timeMax = null, 
//     maxResults = 100,
//     singleEvents = true,
//     orderBy = "startTime"
//   } = {}) {
//     const params = {};
//     if (timeMin) params.timeMin = timeMin;
//     if (timeMax) params.timeMax = timeMax;
//     if (maxResults) params.maxResults = maxResults;
//     if (singleEvents !== undefined) params.singleEvents = singleEvents;
//     if (orderBy) params.orderBy = orderBy;
    
//     const res = await axios.get(`${BASE_URL}/calendars/${calendarId}/events`, { 
//       params, 
//       withCredentials: true 
//     });
//     return res.data;
//   },

//   async getEvent(calendarId, eventId) {
//     const res = await axios.get(`${BASE_URL}/calendars/${calendarId}/events/${eventId}`, { withCredentials: true });
//     return res.data;
//   },

//   async createEvent(calendarId, eventData) {
//     const res = await axios.post(`${BASE_URL}/calendars/${calendarId}/events`, eventData, { withCredentials: true });
//     return res.data;
//   },

//   async updateEvent(calendarId, eventId, eventData) {
//     const res = await axios.put(`${BASE_URL}/calendars/${calendarId}/events/${eventId}`, eventData, { withCredentials: true });
//     return res.data;
//   },

//   async deleteEvent(calendarId, eventId) {
//     const res = await axios.delete(`${BASE_URL}/calendars/${calendarId}/events/${eventId}`, { withCredentials: true });
//     return res.data;
//   },

//   // Local Events (from your database)
//   async getLocalEvents({ 
//     page = 1, 
//     pageSize = 20, 
//     category = "", 
//     search = "",
//     startDate = null,
//     endDate = null
//   } = {}) {
//     const params = {};
//     if (page) params.page = page;
//     if (pageSize) params.page_size = pageSize;
//     if (category) params.category = category;
//     if (search) params.search = search;
//     if (startDate) params.start_date = startDate;
//     if (endDate) params.end_date = endDate;
    
//     const res = await axios.get(`${EVENTS_URL}/list`, { params, withCredentials: true });
//     return res.data;
//   },

//   async getLocalEvent(eventId) {
//     const res = await axios.get(`${EVENTS_URL}/get/${eventId}`, { withCredentials: true });
//     return res.data;
//   },

//   async createLocalEvent(eventData) {
//     const res = await axios.post(`${EVENTS_URL}/create`, eventData, { withCredentials: true });
//     return res.data;
//   },

//   async updateLocalEvent(eventId, eventData) {
//     const res = await axios.put(`${EVENTS_URL}/update/${eventId}`, eventData, { withCredentials: true });
//     return res.data;
//   },

//   async deleteLocalEvent(eventId) {
//     const res = await axios.delete(`${EVENTS_URL}/delete/${eventId}`, { withCredentials: true });
//     return res.data;
//   },

//   // Event Actions
//   async markAsCompleted(eventId) {
//     const res = await axios.post(`${EVENTS_URL}/complete/${eventId}`, {}, { withCredentials: true });
//     return res.data;
//   },

//   async addReminder(eventId, reminderData) {
//     const res = await axios.post(`${EVENTS_URL}/reminder/${eventId}`, reminderData, { withCredentials: true });
//     return res.data;
//   },

//   async removeReminder(eventId) {
//     const res = await axios.delete(`${EVENTS_URL}/reminder/${eventId}`, { withCredentials: true });
//     return res.data;
//   },

//   // Event Statistics
//   async getEventStats() {
//     const res = await axios.get(`${EVENTS_URL}/stats`, { withCredentials: true });
//     return res.data;
//   },

//   async getCalendarStats(calendarId) {
//     const res = await axios.get(`${BASE_URL}/calendars/${calendarId}/stats`, { withCredentials: true });
//     return res.data;
//   },

//   // Event Search
//   async searchEvents(query, filters = {}) {
//     const params = { q: query, ...filters };
//     const res = await axios.get(`${EVENTS_URL}/search`, { params, withCredentials: true });
//     return res.data;
//   },

//   // Event Categories
//   async getEventCategories() {
//     const res = await axios.get(`${EVENTS_URL}/categories`, { withCredentials: true });
//     return res.data;
//   },

//   // Free/Busy Time
//   async getFreeBusyTime(calendarId, timeMin, timeMax) {
//     const res = await axios.post(`${BASE_URL}/free-busy`, {
//       calendarId,
//       timeMin,
//       timeMax
//     }, { withCredentials: true });
//     return res.data;
//   },

//   // Calendar Settings
//   async getCalendarSettings(calendarId) {
//     const res = await axios.get(`${BASE_URL}/calendars/${calendarId}/settings`, { withCredentials: true });
//     return res.data;
//   },

//   async updateCalendarSettings(calendarId, settings) {
//     const res = await axios.put(`${BASE_URL}/calendars/${calendarId}/settings`, settings, { withCredentials: true });
//     return res.data;
//   },

//   // Additional methods for GoogleCalendarPanel.js
//   async testConnection() {
//     const res = await axios.get(`${BASE_URL}/test-connection`, { withCredentials: true });
//     return res.data;
//   },

 

//   // Additional methods for EventManagement.js
//   async getExpiredEvents() {
//     const res = await axios.get(`${EVENTS_URL}/expired`, { withCredentials: true });
//     return res.data;
//   },

//   async getActiveEvents() {
//     const res = await axios.get(`${EVENTS_URL}/active`, { withCredentials: true });
//     return res.data;
//   },

//   async getArchivedEvents() {
//     const res = await axios.get(`${EVENTS_URL}/archived`, { withCredentials: true });
//     return res.data;
//   },

//   async getAllEvents() {
//     const res = await axios.get(`${EVENTS_URL}/all`, { withCredentials: true });
//     return res.data;
//   },

//   async archiveEvent(eventId) {
//     const res = await axios.post(`${EVENTS_URL}/${eventId}/archive`, {}, { withCredentials: true });
//     return res.data;
//   },

//   async unarchiveEvent(eventId) {
//     const res = await axios.post(`${EVENTS_URL}/${eventId}/unarchive`, {}, { withCredentials: true });
//     return res.data;
//   },

// };

// export default CalendarService;
