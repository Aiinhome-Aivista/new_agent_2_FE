export type UserRole = 'ADMIN' | 'ENGAGEMENT_MANAGER' | 'PROJECT_LEAD' | 'PMO_REVIEWER' | 'FINANCE_COMMERCIAL';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export type MonitoringStatus = 'DRAFT' | 'BASELINE_PENDING_REVIEW' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type HealthRagStatus = 'GREEN' | 'AMBER' | 'RED';

export interface Project {
  id: number;
  project_name: string;
  client_name: string;
  description: string;
  monitoring_status: MonitoringStatus;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
  health_score?: number;
  rag_status?: HealthRagStatus;
}

export interface ProjectMember {
  id: number;
  project_id: number;
  name: string;
  email?: string;
  role: string;
  responsibility?: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}
