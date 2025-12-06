// Sample Supabase client usage for testing

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// User queries with tenant filter
export async function getUsers(tenantId: string) {
  return supabase
    .from('users')
    .select('*')
    .eq('tenant_id', tenantId);
}

// Project queries with user filter
export async function getUserProjects(userId: string) {
  return supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId);
}

// Task queries with user filter
export async function getUserTasks(userId: string) {
  return supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);
}

// Insert with user context
export async function createProject(userId: string, tenantId: string, name: string) {
  return supabase
    .from('projects')
    .insert({ user_id: userId, tenant_id: tenantId, name });
}

// Update with ownership check
export async function updateTask(taskId: string, userId: string, completed: boolean) {
  return supabase
    .from('tasks')
    .update({ completed })
    .eq('id', taskId)
    .eq('user_id', userId);
}

// Delete with ownership check
export async function deleteTask(taskId: string, userId: string) {
  return supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);
}

