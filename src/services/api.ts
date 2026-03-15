const BASE_URL = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, message: 'Server unreachable' };
  }
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    register: (data: { name: string; email: string; username: string; password: string; affiliation?: string; bac_matricule?: string; bac_year?: number }) =>
      request<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    checkUsername: (username: string) =>
      request<any>(`/auth/check-username?username=${encodeURIComponent(username)}`),
    sendPin: (email: string, purpose: 'register' | 'reset') =>
      request<any>('/auth/send-pin', {
        method: 'POST',
        body: JSON.stringify({ email, purpose }),
      }),
    verifyPin: (email: string, pin: string, purpose: 'register' | 'reset') =>
      request<any>('/auth/verify-pin', {
        method: 'POST',
        body: JSON.stringify({ email, pin, purpose }),
      }),
    resetPassword: (email: string, password: string) =>
      request<any>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },

  users: {
    get: (params?: { role?: string; team_id?: string; id?: string; email?: string; username?: string }) => {
      const qs = new URLSearchParams();
      if (params?.role) qs.append('role', params.role);
      if (params?.team_id) qs.append('team_id', params.team_id);
      if (params?.id) qs.append('id', params.id);
      if (params?.email) qs.append('email', params.email);
      if (params?.username) qs.append('username', params.username);
      return request(`/users/get?${qs}`);
    },
    create: (data: any) =>
      request('/users/create', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request('/users/update', {
        method: 'POST',
        body: JSON.stringify({ id, ...data }),
      }),
    delete: (id: string) =>
      request('/users/delete', { method: 'POST', body: JSON.stringify({ id }) }),
  },

  teams: {
    get: (params?: { id?: string }) => {
      const qs = params?.id ? `?id=${params.id}` : '';
      return request(`/teams/get${qs}`);
    },
    create: (data: any) =>
      request('/teams/create', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: any) =>
      request('/teams/update', { method: 'POST', body: JSON.stringify(data) }),
    delete: (ids: string | string[]) => {
      const body = Array.isArray(ids) ? { ids } : { id: ids };
      return request('/teams/delete', { method: 'POST', body: JSON.stringify(body) });
    },
  },

  creatorRequests: {
    get: (params?: { id?: string }) => {
      const qs = params?.id ? `?id=${params.id}` : '';
      return request(`/creator-requests/get${qs}`);
    },
    create: (data: any) =>
      request('/creator-requests/create', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: { id: string; action: 'approve' | 'deny' }) =>
      request('/creator-requests/update', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request('/creator-requests/delete', { method: 'POST', body: JSON.stringify({ id }) }),
  },

  eventCategories: {
    get: () => request('/event-categories/get'),
    create: (data: { name: string; uni_exclusive?: boolean }) =>
      request('/event-categories/create', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: { id: string; name?: string; uni_exclusive?: boolean }) =>
      request('/event-categories/update', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request('/event-categories/delete', { method: 'POST', body: JSON.stringify({ id }) }),
  },

  events: {
    get: (params?: { id?: string; creator_id?: string; category_id?: string; search?: string; sort_by?: string; sort_order?: string }) => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val) qs.append(key, val);
        });
      }
      return request(`/events/get?${qs}`);
    },
    create: (data: any) =>
      request('/events/create', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: any) =>
      request('/events/update', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request('/events/delete', { method: 'POST', body: JSON.stringify({ id }) }),
  },

  eventRegistrations: {
    get: (params?: { event_id?: string; user_id?: string }) => {
      const qs = new URLSearchParams();
      if (params?.event_id) qs.append('event_id', params.event_id);
      if (params?.user_id) qs.append('user_id', params.user_id);
      return request(`/event-registrations/get?${qs}`);
    },
    create: (data: { event_id: string; user_id: string }) =>
      request('/event-registrations/create', { method: 'POST', body: JSON.stringify(data) }),
    delete: (data: { event_id: string; user_id: string }) =>
      request('/event-registrations/delete', { method: 'POST', body: JSON.stringify(data) }),
  },

  eventRedirects: {
    get: (params?: { event_id?: string }) => {
      const qs = params?.event_id ? `?event_id=${params.event_id}` : '';
      return request(`/event-redirects/get${qs}`);
    },
    create: (data: { event_id: string; user_id?: string }) =>
      request('/event-redirects/create', { method: 'POST', body: JSON.stringify(data) }),
  },

  favorites: {
    get: (params?: { user_id?: string; event_id?: string }) => {
      const qs = new URLSearchParams();
      if (params?.user_id) qs.append('user_id', params.user_id);
      if (params?.event_id) qs.append('event_id', params.event_id);
      return request(`/favorites/get?${qs}`);
    },
    toggle: (data: { event_id: string; user_id: string }) =>
      request('/favorites/toggle', { method: 'POST', body: JSON.stringify(data) }),
  },

  follows: {
    get: (params?: { follower_id?: string; creator_id?: string }) => {
      const qs = new URLSearchParams();
      if (params?.follower_id) qs.append('follower_id', params.follower_id);
      if (params?.creator_id) qs.append('creator_id', params.creator_id);
      return request(`/follows/get?${qs}`);
    },
    toggle: (data: { follower_id: string; creator_id: string }) =>
      request('/follows/toggle', { method: 'POST', body: JSON.stringify(data) }),
  },

  supervisorGuests: {
    get: (params?: { event_id?: string }) => {
      const qs = params?.event_id ? `?event_id=${params.event_id}` : '';
      return request(`/supervisor-guests/get${qs}`);
    },
    create: (data: { name: string; event_id: string; role: 'reviewer' | 'organizer' }) =>
      request('/supervisor-guests/create', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request('/supervisor-guests/delete', { method: 'POST', body: JSON.stringify({ id }) }),
  },
};
