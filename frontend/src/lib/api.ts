import axios from 'axios';
import { Skill } from '../../shared-config';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Consultant {
  id: string;
  user_id: string;
  skill: Skill;
  user?: User;
}

export interface Availability {
  id?: string;
  consultant_id: string;
  day: string;
  start: string;
  end: string;
  start_time: string;
  end_time: string;
}

export interface Booking {
  id: string;
  user_id: string;
  consultant_id: string;
  start: string;
  end: string;
  status: 'draft' | 'confirmed';
  user?: User;
  consultant?: Consultant;
}

export const authApi = {
  signup: (data: { first_name: string; last_name: string; email: string; password: string }) =>
    api.post('/signup', data),
  login: (data: { email: string; password: string }) => api.post('/login', data),
};

export const usersApi = {
  get: () => api.get<User>('/users'),
  update: (data: Partial<User & { password?: string }>) => api.patch('/users', data),
};

export const consultantsApi = {
  create: (data: { skill: Skill }) => api.post<Consultant>('/consultants', data),
  get: (params?: { user_id?: string; skill?: Skill }) =>
    api.get<Consultant[]>('/consultants', { params }),
};

export const availabilitiesApi = {
  create: (data: {
    consultant_id: string;
    day: string;
    start: string;
    end: string;
    start_time: string;
    end_time: string;
  }) => api.post<Availability>('/availabilities', data),
  update: (availabilityId: string, data: Partial<Availability>) =>
    api.patch(`/availabilities/${availabilityId}`, data),
  delete: (availabilityId: string) => api.delete(`/availabilities/${availabilityId}`),
  get: (consultantId: string) =>
    api.get<{ availabilities: Availability[] }>(
      `/availabilities?consultant_id=${consultantId}`,
    ),
};

export const bookingsApi = {
  create: (data: { consultantId?: string | null; start: string; end: string, clientId: string, userId?: string | null}) =>
    api.post<Booking>('/bookings', data),
  update: (id: string, data: Partial<Booking>) => api.patch(`/bookings/${id}`, data),
  delete: (id: string) => api.delete(`/bookings/${id}`),
  get: (userId?: string) =>
    api.get<Booking[]>('/bookings', { params: userId ? { user_id: userId } : {} }),
};

export default api;
