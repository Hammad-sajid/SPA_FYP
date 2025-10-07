// import axios from "axios";

// const BASE_URL = "http://localhost:8000/api/tasks";

// export const TaskService = {
//   // Core Task Operations
//   async list({ 
//     status = "", 
//     priority = "", 
//     category = "", 
//     search = "", 
//     page = 1, 
//     pageSize = 20 
//   } = {}) {
//     const params = {};
//     if (status) params.status = status;
//     if (priority) params.priority = priority;
//     if (category) params.category = category;
//     if (search) params.search = search;
//     params.page = page;
//     params.page_size = pageSize;
    
//     const res = await axios.get(`${BASE_URL}/list`, { params, withCredentials: true });
//     return res.data;
//   },

//   async get(id) {
//     const res = await axios.get(`${BASE_URL}/get/${id}`, { withCredentials: true });
//     return res.data;
//   },

//   async create({ 
//     title, 
//     description = "", 
//     priority = "medium", 
//     status = "pending", 
//     category = "", 
//     due_date = null,
//     reminder_time = null
//   }) {
//     const res = await axios.post(
//       `${BASE_URL}/create`,
//       { 
//         title, 
//         description, 
//         priority, 
//         status, 
//         category, 
//         due_date, 
//         reminder_time 
//       },
//       { withCredentials: true }
//     );
//     return res.data;
//   },

//   async update(id, data) {
//     const res = await axios.put(`${BASE_URL}/update/${id}`, data, { withCredentials: true });
//     return res.data;
//   },

//   async remove(id) {
//     const res = await axios.delete(`${BASE_URL}/delete/${id}`, { withCredentials: true });
//     return res.data;
//   },

//   // Task Actions
//   async updateStatus(id, status) {
//     const res = await axios.put(`${BASE_URL}/update/${id}`, { status }, { withCredentials: true });
//     return res.data;
//   },

//   async updatePriority(id, priority) {
//     const res = await axios.put(`${BASE_URL}/update/${id}`, { priority }, { withCredentials: true });
//     return res.data;
//   },

//   async markComplete(id) {
//     const res = await axios.put(`${BASE_URL}/update/${id}`, { status: "completed" }, { withCredentials: true });
//     return res.data;
//   },

//   async markIncomplete(id) {
//     const res = await axios.put(`${BASE_URL}/update/${id}`, { status: "pending" }, { withCredentials: true });
//     return res.data;
//   },

//   // Bulk Actions
//   async bulkAction(taskIds, action, data = {}) {
//     const res = await axios.post(
//       `${BASE_URL}/bulk-action`,
//       { task_ids: taskIds, action, data },
//       { withCredentials: true }
//     );
//     return res.data;
//   },

//   async bulkStatusUpdate(taskIds, status) {
//     return this.bulkAction(taskIds, "update_status", { status });
//   },

//   async bulkPriorityUpdate(taskIds, priority) {
//     return this.bulkAction(taskIds, "update_priority", { priority });
//   },

//   async bulkDelete(taskIds) {
//     return this.bulkAction(taskIds, "delete");
//   },

//   // Task Statistics
//   async getStats() {
//     const res = await axios.get(`${BASE_URL}/stats`, { withCredentials: true });
//     return res.data;
//   },

//   // Task Categories
//   async getCategories() {
//     const res = await axios.get(`${BASE_URL}/categories`, { withCredentials: true });
//     return res.data;
//   },

//   // Task Search
//   async search(query, filters = {}) {
//     const params = { q: query, ...filters };
//     const res = await axios.get(`${BASE_URL}/search`, { params, withCredentials: true });
//     return res.data;
//   },

//   // Task Reminders
//   async setReminder(taskId, reminderTime) {
//     const res = await axios.post(
//       `${BASE_URL}/reminder/${taskId}`,
//       { reminder_time: reminderTime },
//       { withCredentials: true }
//     );
//     return res.data;
//   },

//   async removeReminder(taskId) {
//     const res = await axios.delete(`${BASE_URL}/reminder/${taskId}`, { withCredentials: true });
//     return res.data;
//   },

//   // Task Completion
//   async markAsCompleted(taskId, completionNotes = "") {
//     const res = await axios.post(
//       `${BASE_URL}/complete/${taskId}`,
//       { completion_notes: completionNotes },
//       { withCredentials: true }
//     );
//     return res.data;
//   },

//   // Task Progress
//   async updateProgress(taskId, progress) {
//     const res = await axios.put(
//       `${BASE_URL}/progress/${taskId}`,
//       { progress },
//       { withCredentials: true }
//     );
//     return res.data;
//   },

//   // Additional methods for TaskManagement.js
//   async getTasks() {
//     const res = await axios.get(`${BASE_URL}/get-tasks`, { withCredentials: true });
//     return res.data;
//   },

//   async getExpiredTasks() {
//     const res = await axios.get(`${BASE_URL}/expired`, { withCredentials: true });
//     return res.data;
//   },

//   async getArchivedTasks() {
//     const res = await axios.get(`${BASE_URL}/archived`, { withCredentials: true });
//     return res.data;
//   },

//   async getAllTasks() {
//     const res = await axios.get(`${BASE_URL}/all`, { withCredentials: true });
//     return res.data;
//   },

//   async getUsers() {
//     const res = await axios.get(`${BASE_URL}/users`, { withCredentials: true });
//     return res.data;
//   },

//   async updateTask(id, data) {
//     const res = await axios.put(`${BASE_URL}/update/${id}`, data, { withCredentials: true });
//     return res.data;
//   },

//   async createTask(data) {
//     const res = await axios.post(`${BASE_URL}/create`, data, { withCredentials: true });
//     return res.data;
//   },

//   async deleteTask(id) {
//     const res = await axios.delete(`${BASE_URL}/delete/${id}`, { withCredentials: true });
//     return res.data;
//   },

//   async archiveTask(id) {
//     const res = await axios.post(`${BASE_URL}/${id}/archive`, {}, { withCredentials: true });
//     return res.data;
//   },

//   async unarchiveTask(id) {
//     const res = await axios.post(`${BASE_URL}/${id}/unarchive`, {}, { withCredentials: true });
//     return res.data;
//   },

//   async convertToEvent(id) {
//     const res = await axios.post(`${BASE_URL}/${id}/convert-to-event`, {}, { withCredentials: true });
//     return res.data;
//   }
// };

// export default TaskService;
