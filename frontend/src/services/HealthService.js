import axios from 'axios';

const API_BASE_URL =  "http://localhost:8000/api/health";


class HealthService {
  // Health Records
  static async createHealthRecord(recordData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/records`, recordData, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error creating health record:', error);
      throw error;
    }
  }

  static async getHealthRecords(userId, startDate = null, endDate = null) {
    try {
      let url = `${API_BASE_URL}/records/${userId}`;
      const params = new URLSearchParams();
      
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error fetching health records:', error);
      throw error;
    }
  }

  static async getLatestHealthRecord(userId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/records/${userId}/latest`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error fetching latest health record:', error);
      throw error;
    }
  }

  static async updateHealthRecord(recordId, updateData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/records/${recordId}`, updateData, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error updating health record:', error);
      throw error;
    }
  }

  // Health Reminders
  static async createHealthReminder(reminderData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/reminders`, reminderData, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error creating health reminder:', error);
      throw error;
    }
  }

  static async getHealthReminders(userId, activeOnly = true) {
    try {
      const response = await axios.get(`${API_BASE_URL}/reminders/${userId}?active_only=${activeOnly}`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error fetching health reminders:', error);
      throw error;
    }
  }

  static async updateHealthReminder(reminderId, updateData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/reminders/${reminderId}`, updateData, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error updating health reminder:', error);
      throw error;
    }
  }

  static async deleteHealthReminder(reminderId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/reminders/${reminderId}`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error deleting health reminder:', error);
      throw error;
    }
  }

  static async markReminderTaken(reminderId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/reminders/${reminderId}/mark-taken`, {}, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error marking reminder as taken:', error);
      throw error;
    }
  }

  // AI Health Recommendations
  static async getAIHealthRecommendations(healthData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai-recommendations`, healthData, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error getting AI health recommendations:', error);
      throw error;
    }
  }

  // Health Analytics
  static async getWellnessTrend(userId, days = 30) {
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics/${userId}/wellness-trend?days=${days}`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error fetching wellness trend:', error);
      throw error;
    }
  }
}

export default HealthService;
