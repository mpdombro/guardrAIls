import axios from 'axios';
import type { ChatRequest, ChatResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatService = {
  sendMessage: async (
    request: ChatRequest,
    getAccessToken?: () => Promise<string>
  ): Promise<ChatResponse> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token is available
    if (getAccessToken) {
      try {
        const token = await getAccessToken();
        headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Failed to get access token:', error);
        throw new Error('Authentication required');
      }
    }

    const response = await api.post<ChatResponse>('/api/chat', request, {
      headers,
    });
    return response.data;
  },

  healthCheck: async (): Promise<{
    status: string;
    timestamp: string;
    security: { openai: boolean; auth0: boolean };
  }> => {
    const response = await api.get('/api/health');
    return response.data;
  },
};

export default api;
