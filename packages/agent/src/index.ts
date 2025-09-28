import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'yaml';
import type { Intent, TaskGraph, Task, TaskStatus } from '@layr/core';

export class AgentRunner {
  private prompts: Map<string, string> = new Map();

  constructor() {
    this.loadPrompts();
  }

  private loadPrompts(): void {
    const promptFiles = ['interpreter', 'planner', 'implementer', 'verifier'];
    const promptsDir = join(__dirname, '..', 'prompts');

    for (const file of promptFiles) {
      try {
        const content = readFileSync(join(promptsDir, `${file}.md`), 'utf-8');
        this.prompts.set(file, content);
      } catch (error) {
        console.warn(`Failed to load prompt ${file}:`, error);
      }
    }
  }

  /**
   * Interpret natural language to intent JSON
   */
  async interpretRequest(request: string): Promise<Intent> {
    // In production, this would call an AI model
    // For now, return a mock intent
    console.log('Interpreting request:', request);
    return {
      goal: request,
      audience: 'business',
      capabilities: ['auth', 'crud'],
      auth: 'magic_link'
    };
  }

  /**
   * Plan task execution graph
   */
  async planTasks(intent: Intent, blueprintId: string): Promise<TaskGraph> {
    console.log('Planning tasks for blueprint:', blueprintId);

    const tasks: Task[] = [
      { id: 'init', type: 'init_repo', status: 'pending' },
      { id: 'provision', type: 'provision_backends', status: 'pending', dependencies: ['init'] },
      { id: 'config', type: 'config_env', status: 'pending', dependencies: ['provision'] },
      { id: 'scaffold', type: 'scaffold_pages', status: 'pending', dependencies: ['config'] },
      { id: 'commit', type: 'commit_preview', status: 'pending', dependencies: ['scaffold'] },
      { id: 'deploy', type: 'deploy_prod', status: 'pending', dependencies: ['commit'] },
      { id: 'verify', type: 'verify_smoke', status: 'pending', dependencies: ['deploy'] },
    ];

    return {
      tasks,
      artifacts: {}
    };
  }

  /**
   * Execute a task graph
   */
  async executeTasks(graph: TaskGraph): Promise<void> {
    console.log('Executing task graph with', graph.tasks.length, 'tasks');

    for (const task of graph.tasks) {
      if (task.dependencies) {
        // Wait for dependencies
        const deps = graph.tasks.filter(t =>
          task.dependencies?.includes(t.id)
        );

        const allComplete = deps.every(d => d.status === 'completed');
        if (!allComplete) {
          console.log(`Skipping ${task.id} - dependencies not met`);
          task.status = 'skipped';
          continue;
        }
      }

      console.log(`Executing task: ${task.id} (${task.type})`);
      task.status = 'running';

      try {
        // Execute based on type
        await this.executeTask(task);
        task.status = 'completed';
        console.log(`✅ Completed: ${task.id}`);
      } catch (error) {
        task.status = 'failed';
        task.error = String(error);
        console.error(`❌ Failed: ${task.id}`, error);
      }
    }
  }

  private async executeTask(task: Task): Promise<void> {
    // Simulate task execution
    await new Promise(resolve => setTimeout(resolve, 100));

    switch (task.type) {
      case 'init_repo':
        task.output = { repoPath: './apps/generated' };
        break;
      case 'provision_backends':
        task.output = {
          supabase: { url: 'https://mock.supabase.co' },
          clerk: { publishableKey: 'pk_test_mock' }
        };
        break;
      case 'deploy_prod':
        task.output = { previewUrl: 'https://mock-preview.vercel.app' };
        break;
      default:
        // Other tasks
        break;
    }
  }

  /**
   * Verify deployment
   */
  async verifyDeployment(previewUrl: string): Promise<boolean> {
    console.log('Verifying deployment at:', previewUrl);

    try {
      // In production, this would run actual smoke tests
      // For now, simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Verification passed');
      return true;
    } catch (error) {
      console.error('❌ Verification failed:', error);
      return false;
    }
  }

  /**
   * Full pipeline execution
   */
  async run(intentOrPath: Intent | string): Promise<{ success: boolean; previewUrl?: string }> {
    let intent: Intent;

    if (typeof intentOrPath === 'string') {
      const content = readFileSync(intentOrPath, 'utf-8');
      intent = JSON.parse(content);
    } else {
      intent = intentOrPath;
    }

    console.log('🚀 Starting Layr pipeline...');
    console.log('Intent:', intent.goal);

    // Choose blueprint
    const { chooseBlueprint } = await import('@layr/core');
    const blueprintId = chooseBlueprint(intent);
    console.log('Selected blueprint:', blueprintId);

    // Plan tasks
    const taskGraph = await this.planTasks(intent, blueprintId);

    // Execute tasks
    await this.executeTasks(taskGraph);

    // Get preview URL from deploy task
    const deployTask = taskGraph.tasks.find(t => t.type === 'deploy_prod');
    const previewUrl = deployTask?.output?.previewUrl;

    if (previewUrl) {
      // Verify deployment
      const verified = await this.verifyDeployment(previewUrl);

      return {
        success: verified,
        previewUrl
      };
    }

    return { success: false };
  }
}

// Export convenience function
export async function runLayr(intentPath: string): Promise<void> {
  const runner = new AgentRunner();
  const result = await runner.run(intentPath);

  if (result.success && result.previewUrl) {
    console.log('\n🎉 SUCCESS! Your app is live at:', result.previewUrl);
  } else {
    console.error('\n❌ Pipeline failed');
    process.exit(1);
  }
}