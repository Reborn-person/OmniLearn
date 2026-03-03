const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Request failed' };
    }

    return { data };
  } catch (error) {
    return { error: 'Network error' };
  }
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name: string) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  me: () => request<{ user: any }>('/auth/me'),
};

// Courses API
export const coursesApi = {
  getAll: () => request<{ courses: any[] }>('/courses'),
  getById: (id: number) => request<{ course: any }>(`/courses/${id}`),
  create: (title: string, description: string, category: string) =>
    request<{ course: any }>('/courses', {
      method: 'POST',
      body: JSON.stringify({ title, description, category }),
    }),
};

// Lessons API
export const lessonsApi = {
  getByCourse: (courseId: number) =>
    request<{ lessons: any[] }>(`/lessons/course/${courseId}`),
  getById: (id: number) => request<{ lesson: any }>(`/lessons/${id}`),
  getVersions: (id: number) => request<{ versions: any[] }>(`/lessons/${id}/versions`),
  create: (data: {
    courseId: number;
    title: string;
    description: string;
    lessonType: string;
    content: any;
    orderIndex?: number;
  }) =>
    request<{ lesson: any }>('/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: {
    title?: string;
    description?: string;
    lessonType?: string;
    content?: any;
    orderIndex?: number;
    changeNote?: string;
  }) =>
    request<{ lesson: any; version: number }>(`/lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  publishRuntime: (data: {
    courseTitle?: string;
    courseDescription?: string;
    category?: string;
    lessonTitle?: string;
    lessonDescription?: string;
    schema: any;
    lessonId?: number;
    courseId?: number;
    changeNote?: string;
    creatorId?: number;
  }) =>
    request<{ lesson: any; courseId: number; version: number; mode: 'create' | 'republish' }>('/lessons/runtime/publish', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Progress API
export const progressApi = {
  getLessonProgress: (lessonId: number) =>
    request<{ progress: any }>(`/progress/lesson/${lessonId}`),
  updateLessonProgress: (lessonId: number, completed: boolean, score?: number) =>
    request<{ success: boolean }>(`/progress/lesson/${lessonId}`, {
      method: 'POST',
      body: JSON.stringify({ completed, score }),
    }),
  getCourseProgress: (courseId: number) =>
    request<{ progress: any[] }>(`/progress/course/${courseId}`),
};

// AI API
export const aiApi = {
  generateCourse: (topic: string, targetAudience?: string) =>
    request<{ course: any; provider: string }>('/ai/generate-course', {
      method: 'POST',
      body: JSON.stringify({ topic, targetAudience }),
    }),
  generateLesson: (lessonTitle: string, topic: string, type?: string) =>
    request<{ lesson: any; provider: string }>('/ai/generate-lesson', {
      method: 'POST',
      body: JSON.stringify({ lessonTitle, topic, type }),
    }),
  generateRuntimeSchema: (topic: string, visualStyle?: string, complexity?: 'low' | 'medium' | 'high') =>
    request<{ schema: any; provider: string }>('/ai/generate-runtime-schema', {
      method: 'POST',
      body: JSON.stringify({ topic, visualStyle, complexity }),
    }),
  refineRuntimeSchema: (currentSchema: any, instruction: string, visualStyle?: string) =>
    request<{ schema: any; provider: string }>('/ai/refine-runtime-schema', {
      method: 'POST',
      body: JSON.stringify({ currentSchema, instruction, visualStyle }),
    }),
  getConfig: () =>
    request<{ provider: string; configured: boolean; availableProviders: string[] }>('/ai/config'),
  getTemplates: () =>
    request<{ templates: string[]; provider: string }>('/ai/templates'),
};

// Drafts API
export const draftsApi = {
  getAll: (userId?: number) => 
    request<any[]>(`/drafts?userId=${userId || 1}`),
  create: (title: string, content: any, userId?: number) =>
    request<{ id: number }>('/drafts', {
      method: 'POST',
      body: JSON.stringify({ title, content, userId: userId || 1 }),
    }),
  update: (id: number, title: string, content: any) =>
    request<{ message: string }>(`/drafts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content }),
    }),
};
