export interface LayrConfig {
  projectName?: string;
  vercelToken?: string;
  supabaseUrl?: string;
  supabaseServiceKey?: string;
  clerkSecretKey?: string;
  stripeSecretKey?: string;
  resendApiKey?: string;
  mcpEnabled?: boolean;
}

export interface TaskGraph {
  tasks: Task[];
  artifacts: Record<string, any>;
}

export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  dependencies?: string[];
  input?: any;
  output?: any;
  error?: string;
}

export type TaskType =
  | 'init_repo'
  | 'provision_backends'
  | 'config_env'
  | 'scaffold_pages'
  | 'commit_preview'
  | 'deploy_prod'
  | 'verify_smoke';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface DeploymentResult {
  previewUrl?: string;
  productionUrl?: string;
  adminCredentials?: {
    email?: string;
    password?: string;
  };
  success: boolean;
  error?: string;
}

export interface ProvisionResult {
  supabase?: {
    url: string;
    anonKey: string;
    serviceKey: string;
  };
  clerk?: {
    publishableKey: string;
    secretKey: string;
  };
  stripe?: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  vercel?: {
    projectId: string;
    projectName: string;
  };
}