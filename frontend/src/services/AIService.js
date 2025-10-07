import axios from "axios";

const AI_BASE = "http://localhost:8000/api/ai";

export const AIService = {
  async generateResponse(prompt, tone = "professional", length = "medium", emailContext = null) {
    const response = await axios.post(
      `${AI_BASE}/generate-response`,
      {
        prompt,
        tone,
        length,
        email_context: emailContext
      },
      { withCredentials: true }
    );
    return response.data;
  },

  async getHistory(limit = 10, offset = 0) {
    const response = await axios.get(
      `${AI_BASE}/history?limit=${limit}&offset=${offset}`,
      { withCredentials: true }
    );
    return response.data;
  },

  async testConnection() {
    const response = await axios.get(`${AI_BASE}/test-connection`);
    return response.data;
  }
};

export default AIService;

