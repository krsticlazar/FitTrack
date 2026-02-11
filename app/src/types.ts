// ===== User Types =====
export interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    _id: string;
    username: string;
    email: string;
    createdAt: string;
    token: string;
  };
}

// ===== Exercise Types =====
export interface Exercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
}

export interface ExerciseSearchResponse {
  success: boolean;
  data: Exercise[];
  metadata?: {
    totalPages: number;
    totalExercises: number;
    currentPage: number;
    nextPage: string | null;
    previousPage: string | null;
  };
}

// ===== Workout Template Types =====
export interface ExerciseInTemplate {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  sets: number;
  defaultWeight: number;
  order: number;
}

export interface WorkoutTemplate {
  _id: string;
  userId: string;
  name: string;
  description: string;
  exercises: ExerciseInTemplate[];
  createdAt: string;
  updatedAt: string;
  totalSets?: number;
  exerciseCount?: number;
}

// ===== Workout Session Types =====
export interface Set {
  setNumber: number;
  weight: number;
  reps: number;
  isPersonalRecord: boolean;
  completedAt?: string;
}

export interface ExerciseInSession {
  exerciseId: string;
  name: string;
  gifUrl?: string;
  sets: Set[];
  notes?: string;
}

export interface WorkoutSession {
  _id: string;
  userId: string;
  templateId?: string;
  templateName: string;
  status: 'active' | 'completed' | 'cancelled';
  startTime: string;
  endTime?: string;
  exercises: ExerciseInSession[];
  totalVolume: number;
  duration: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  durationFormatted?: string;
  totalSets?: number;
}

// ===== Stats Types =====
export interface StatsOverview {
  totalWorkouts: number;
  totalVolume: number;
  totalDuration: number;
  avgVolume: number;
  avgDuration: number;
}

export interface LastWorkout {
  templateName: string;
  endTime: string;
  totalVolume: number;
  duration: number;
}

export interface ExerciseStats {
  exerciseId: string;
  hasData: boolean;
  personalRecord: {
    maxWeight: number;
    maxVolume: number;
    maxReps: number;
    prSession: {
      weight: number;
      date: string;
      sessionName: string;
    };
  } | null;
  totalSessions: number;
  history: Array<{
    date: string;
    templateName: string;
    sets: number;
    maxWeight: number;
    maxReps: number;
    volume: number;
  }>;
}

export interface PersonalRecord {
  exerciseId: string;
  name: string;
  maxWeight: number;
  maxVolume: number;
  lastPerformed: string;
  sessionName: string;
}

// ===== API Response Types =====
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  total?: number;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

// ===== Context Types =====
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}


