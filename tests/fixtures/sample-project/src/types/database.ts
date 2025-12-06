// TypeScript types for database tables

export interface User {
  id: string;
  email: string;
  tenant_id: string;
  created_at: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  project_id: string;
  user_id: string;
  created_at: Date;
}

// Supabase-style Database type
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          tenant_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          tenant_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          tenant_id?: string;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          user_id: string;
          tenant_id: string;
        };
      };
    };
  };
};

