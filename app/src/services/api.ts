import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  ApiResponse,
  User,
  Exercise,
  WorkoutTemplate,
  WorkoutSession,
  StatsOverview,
  ExerciseStats,
  PersonalRecord
} from '../types';
import { toStringArray } from '../utils/toStringArray';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;
  private exerciseDetailsCache = new Map<string, Exercise>();
  private exerciseDetailsInFlight = new Map<string, Promise<ApiResponse<Exercise>>>();
  private getRequestsInFlight = new Map<string, Promise<any>>();

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor - dodaj token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private normalizeExercise(rawExercise: any): Exercise {
    const source = rawExercise?.data || rawExercise || {};

    return {
      exerciseId: source.exerciseId || '',
      name: source.name || '',
      gifUrl: source.gifUrl || '',
      targetMuscles: toStringArray(source.targetMuscles),
      bodyParts: toStringArray(source.bodyParts),
      equipments: toStringArray(source.equipments),
      secondaryMuscles: toStringArray(source.secondaryMuscles),
      instructions: toStringArray(source.instructions)
    };
  }

  private normalizeExercises(rawExercises: unknown): Exercise[] {
    if (!Array.isArray(rawExercises)) {
      return [];
    }

    return rawExercises.map((exercise) => this.normalizeExercise(exercise));
  }

  private serializeParams(params?: Record<string, unknown>): string {
    if (!params) {
      return '';
    }

    const pairs: string[] = [];

    Object.keys(params)
      .sort()
      .forEach((key) => {
        const value = params[key];

        if (value === undefined || value === null) {
          return;
        }

        if (Array.isArray(value)) {
          value.forEach((item) => {
            pairs.push(`${key}=${String(item)}`);
          });
          return;
        }

        pairs.push(`${key}=${String(value)}`);
      });

    return pairs.join('&');
  }

  private buildGetRequestKey(url: string, config?: AxiosRequestConfig): string {
    const serializedParams = this.serializeParams(config?.params as Record<string, unknown>);
    return serializedParams ? `${url}?${serializedParams}` : url;
  }

  private getDedup<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const requestKey = this.buildGetRequestKey(url, config);
    const inFlightRequest = this.getRequestsInFlight.get(requestKey);

    if (inFlightRequest) {
      return inFlightRequest as Promise<T>;
    }

    const requestPromise = this.api
      .get<T>(url, config)
      .then((response) => response.data)
      .finally(() => {
        this.getRequestsInFlight.delete(requestKey);
      });

    this.getRequestsInFlight.set(requestKey, requestPromise);
    return requestPromise;
  }

  // ===== AUTH =====
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', {
      username,
      email,
      password
    });
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', {
      email,
      password
    });
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.getDedup<ApiResponse<User>>('/auth/me');
  }

  // ===== EXERCISES =====
  async searchExercises(name: string, limit: number = 10): Promise<ApiResponse<Exercise[]>> {
    const response = await this.getDedup<ApiResponse<Exercise[]>>('/exercises/search', {
      params: { name, limit }
    });
    return {
      ...response,
      data: this.normalizeExercises(response.data)
    };
  }

  async getBodyParts(): Promise<ApiResponse<string[]>> {
    return this.getDedup<ApiResponse<string[]>>('/exercises/bodyparts');
  }

  async getExercisesByBodyPart(
    bodypart: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<Exercise[]>> {
    const response = await this.getDedup<ApiResponse<Exercise[]>>(
      `/exercises/bodypart/${bodypart}`,
      { params: { limit, offset } }
    );
    return {
      ...response,
      data: this.normalizeExercises(response.data)
    };
  }

  async getExercisesByMuscle(
    muscle: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<Exercise[]>> {
    const response = await this.getDedup<ApiResponse<Exercise[]>>(
      `/exercises/muscle/${muscle}`,
      { params: { limit, offset } }
    );
    return {
      ...response,
      data: this.normalizeExercises(response.data)
    };
  }

  async getExerciseById(id: string): Promise<ApiResponse<Exercise>> {
    const cachedExercise = this.exerciseDetailsCache.get(id);
    if (cachedExercise) {
      return {
        success: true,
        data: cachedExercise
      };
    }

    const inFlightRequest = this.exerciseDetailsInFlight.get(id);
    if (inFlightRequest) {
      return inFlightRequest;
    }

    const requestPromise = this.api
      .get<ApiResponse<Exercise>>(`/exercises/${id}`)
      .then((response) => {
        const normalizedExercise = this.normalizeExercise(response.data.data);
        this.exerciseDetailsCache.set(id, normalizedExercise);

        return {
          ...response.data,
          data: normalizedExercise
        };
      })
      .finally(() => {
        this.exerciseDetailsInFlight.delete(id);
      });

    this.exerciseDetailsInFlight.set(id, requestPromise);
    return requestPromise;
  }

  // ===== WORKOUT TEMPLATES =====
  async getTemplates(): Promise<ApiResponse<WorkoutTemplate[]>> {
    return this.getDedup<ApiResponse<WorkoutTemplate[]>>('/templates');
  }

  async getTemplateById(id: string): Promise<ApiResponse<WorkoutTemplate>> {
    return this.getDedup<ApiResponse<WorkoutTemplate>>(`/templates/${id}`);
  }

  async createTemplate(
    template: Omit<WorkoutTemplate, '_id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<WorkoutTemplate>> {
    const response = await this.api.post<ApiResponse<WorkoutTemplate>>('/templates', template);
    return response.data;
  }

  async updateTemplate(
    id: string,
    template: Partial<Omit<WorkoutTemplate, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<ApiResponse<WorkoutTemplate>> {
    const response = await this.api.put<ApiResponse<WorkoutTemplate>>(
      `/templates/${id}`,
      template
    );
    return response.data;
  }

  async deleteTemplate(id: string): Promise<ApiResponse<{}>> {
    const response = await this.api.delete<ApiResponse<{}>>(`/templates/${id}`);
    return response.data;
  }

  async reorderExercises(
    templateId: string,
    exerciseIds: string[]
  ): Promise<ApiResponse<WorkoutTemplate>> {
    const response = await this.api.put<ApiResponse<WorkoutTemplate>>(
      `/templates/${templateId}/exercises/reorder`,
      { exerciseIds }
    );
    return response.data;
  }

  // ===== WORKOUT SESSIONS =====
  async getSessions(
    status?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<ApiResponse<WorkoutSession[]>> {
    return this.getDedup<ApiResponse<WorkoutSession[]>>('/sessions', {
      params: { status, limit, skip }
    });
  }

  async getActiveSession(): Promise<ApiResponse<WorkoutSession | null>> {
    return this.getDedup<ApiResponse<WorkoutSession | null>>('/sessions/active');
  }

  async getSessionById(id: string): Promise<ApiResponse<WorkoutSession>> {
    return this.getDedup<ApiResponse<WorkoutSession>>(`/sessions/${id}`);
  }

  async startSession(data: {
    templateId?: string;
    templateName?: string;
    exercises?: any[];
  }): Promise<ApiResponse<WorkoutSession>> {
    const response = await this.api.post<ApiResponse<WorkoutSession>>('/sessions', data);
    return response.data;
  }

  async updateSession(
    id: string,
    data: { exercises?: any[]; notes?: string }
  ): Promise<ApiResponse<WorkoutSession>> {
    const response = await this.api.put<ApiResponse<WorkoutSession>>(`/sessions/${id}`, data);
    return response.data;
  }

  async completeSession(
    id: string,
    endTime?: string
  ): Promise<ApiResponse<WorkoutSession> & { requiresTimeVerification?: boolean }> {
    const response = await this.api.post<
      ApiResponse<WorkoutSession> & { requiresTimeVerification?: boolean }
    >(`/sessions/${id}/complete`, { endTime });
    return response.data;
  }

  async adjustSessionTime(id: string, endTime: string): Promise<ApiResponse<WorkoutSession>> {
    const response = await this.api.put<ApiResponse<WorkoutSession>>(
      `/sessions/${id}/adjust-time`,
      { endTime }
    );
    return response.data;
  }

  async deleteSession(id: string): Promise<ApiResponse<{}>> {
    const response = await this.api.delete<ApiResponse<{}>>(`/sessions/${id}`);
    return response.data;
  }

  async getSessionHistory(
    limit: number = 10,
    skip: number = 0
  ): Promise<ApiResponse<WorkoutSession[]>> {
    return this.getDedup<ApiResponse<WorkoutSession[]>>('/sessions/history/list', {
      params: { limit, skip }
    });
  }

  // ===== STATS =====
  async getStatsOverview(): Promise<
    ApiResponse<{
      overview: StatsOverview;
      lastWorkout: any;
      recentWorkouts: number;
    }>
  > {
    return this.getDedup<
      ApiResponse<{
        overview: StatsOverview;
        lastWorkout: any;
        recentWorkouts: number;
      }>
    >('/stats/overview');
  }

  async getExerciseStats(exerciseId: string): Promise<ApiResponse<ExerciseStats>> {
    return this.getDedup<ApiResponse<ExerciseStats>>(
      `/stats/exercise/${exerciseId}`
    );
  }

  async getVolumeTrend(days: number = 30): Promise<
    ApiResponse<
      Array<{
        date: string;
        volume: number;
        workouts: number;
        avgDuration: number;
      }>
    >
  > {
    return this.getDedup<
      ApiResponse<
        Array<{
          date: string;
          volume: number;
          workouts: number;
          avgDuration: number;
        }>
      >
    >('/stats/volume-trend', { params: { days } });
  }

  async getPersonalRecords(): Promise<ApiResponse<PersonalRecord[]>> {
    return this.getDedup<ApiResponse<PersonalRecord[]>>('/stats/records');
  }
}

const apiService = new ApiService();

export default apiService;


