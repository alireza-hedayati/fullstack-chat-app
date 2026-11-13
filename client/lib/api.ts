import { getToken, clearAuth } from './auth';
import { AuthResponse, ConversationSummary, Message, UserProfile } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage = data?.error || `Request failed with status ${response.status}`;
    if (response.status === 401 && token) {
      clearAuth();
    }
    throw new ApiError(errorMessage, response.status);
  }

  return data as T;
}

export const api = {
  signup(credentials: { username: string; password: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  login(credentials: { username: string; password: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getMe(): Promise<UserProfile> {
    return request<UserProfile>('/api/me');
  },

  updateProfile(profile: {
    first_name?: string;
    last_name?: string;
    bio?: string;
  }): Promise<UserProfile> {
    return request<UserProfile>('/api/me', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
  },

  deleteAccount(password: string): Promise<void> {
    return request<void>('/api/me', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  },

  searchUsers(query: string): Promise<UserProfile[]> {
    return request<UserProfile[]>(`/api/users?q=${encodeURIComponent(query)}`);
  },

  getConversations(): Promise<ConversationSummary[]> {
    return request<ConversationSummary[]>('/api/conversations');
  },

  createConversation(username: string): Promise<ConversationSummary> {
    return request<ConversationSummary>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  },

  getMessages(conversationId: number): Promise<Message[]> {
    return request<Message[]>(`/api/conversations/${conversationId}/messages`);
  },
};
