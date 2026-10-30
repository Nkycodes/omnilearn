import axios, { AxiosInstance } from 'axios';
import { AuthResponse, Workspace, FileMetadata, ChatMessage } from '../types';

const TOKEN_KEY = 'omnilearn_jwt_token';
const USER_KEY = 'omnilearn_user';

export const apiClient: AxiosInstance = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Bearer token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration or unauthenticated errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized on protected route, redirect to login unless on public page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  async register(data: { email: string; password: string; name?: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/api/auth/register', data);
    if (res.data.token && res.data.user) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/api/auth/login', data);
    if (res.data.token && res.data.user) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getMe() {
    return apiClient.get('/api/auth/me');
  },

  async syncFirebaseUser(data: { uid: string; email: string; displayName?: string; photoURL?: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/api/auth/firebase-sync', data);
    if (res.data.token && res.data.user) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    }
    return res.data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

export const workspaceApi = {
  async list(): Promise<{ success: boolean; workspaces: Workspace[] }> {
    const res = await apiClient.get('/api/workspace');
    return res.data;
  },

  async get(id: string): Promise<{ success: boolean; workspace: Workspace }> {
    const res = await apiClient.get(`/api/workspace/${id}`);
    return res.data;
  },

  async create(data: { title: string; description?: string }): Promise<{ success: boolean; workspace: Workspace }> {
    const res = await apiClient.post('/api/workspace', data);
    return res.data;
  },

  async update(id: string, data: { title?: string; description?: string }): Promise<{ success: boolean; workspace: Workspace }> {
    const res = await apiClient.put(`/api/workspace/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete(`/api/workspace/${id}`);
    return res.data;
  },

  async uploadFiles(
    workspaceId: string,
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; files: FileMetadata[]; workspace: Workspace }> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    const res = await apiClient.post(`/api/workspace/${workspaceId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },

  async deleteFile(workspaceId: string, fileId: string): Promise<{ success: boolean; workspace: Workspace }> {
    const res = await apiClient.delete(`/api/workspace/${workspaceId}/files/${fileId}`);
    return res.data;
  },

  async sendChatMessage(
    workspaceId: string,
    prompt: string,
    selectedFileIds?: string[],
    tutorModel?: string,
    enableSearchGrounding?: boolean
  ): Promise<{ success: boolean; userMessage: ChatMessage; assistantMessage: ChatMessage; workspace: Workspace }> {
    const res = await apiClient.post(`/api/workspace/${workspaceId}/chat`, {
      prompt,
      selectedFileIds,
      tutorModel,
      enableSearchGrounding,
    });
    return res.data;
  },

  async generateStudyGuide(workspaceId: string): Promise<{ success: boolean; studyGuide: string }> {
    const res = await apiClient.post(`/api/workspace/${workspaceId}/study-guide`);
    return res.data;
  },
};

export const scienceApi = {
  async getAlphaFold(uniprotId: string) {
    const res = await apiClient.get(`/api/science/alphafold/${uniprotId}`);
    return res.data;
  },

  async getUniProt(accession: string) {
    const res = await apiClient.get(`/api/science/uniprot/${accession}`);
    return res.data;
  },

  async getPubChem(query: string) {
    const res = await apiClient.get(`/api/science/pubchem/${encodeURIComponent(query)}`);
    return res.data;
  },

  async searchPubMed(query: string, max = 5) {
    const res = await apiClient.get(`/api/science/pubmed?q=${encodeURIComponent(query)}&max=${max}`);
    return res.data;
  },
};

export const videoApi = {
  async generateVideo(prompt: string, aspectRatio: '16:9' | '9:16' = '16:9') {
    const res = await apiClient.post('/api/video/generate', { prompt, aspectRatio });
    return res.data;
  },
};
