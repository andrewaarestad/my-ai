import { prisma } from './prisma';
import { UserScopedService } from './services/base-service';
import type { Prisma } from '@prisma/client';

/**
 * Task List Service - User-scoped access to tasks
 *
 * Provides secure access to user's task list.
 * All queries are automatically filtered by userId.
 */
export class TaskListService extends UserScopedService {
  /**
   * Get all tasks for the user
   */
  async getTasks(options: { includeCompleted?: boolean } = {}) {
    const { includeCompleted = false } = options;

    const where: Prisma.TaskListItemWhereInput = this.enforceUserScope(
      includeCompleted ? {} : { completed: false }
    );

    return prisma.taskListItem.findMany({
      where,
      orderBy: [{ completed: 'asc' }, { order: 'asc' }],
    });
  }

  /**
   * Create a new task (automatically added at the end)
   */
  async createTask(text: string) {
    if (!text || text.trim().length === 0) {
      throw new Error('Task text cannot be empty');
    }

    const maxOrder = await this.getMaxOrder();

    return prisma.taskListItem.create({
      data: {
        text: text.trim(),
        userId: this.getUserId(),
        order: maxOrder + 1,
      },
    });
  }

  /**
   * Update task text
   */
  async updateTask(taskId: string, text: string) {
    if (!text || text.trim().length === 0) {
      throw new Error('Task text cannot be empty');
    }

    // Use atomic operation with userId in where clause to prevent race conditions
    const updated = await prisma.taskListItem.updateMany({
      where: this.enforceUserScope({ id: taskId }),
      data: { text: text.trim() },
    });

    if (updated.count === 0) {
      throw new Error('Task not found or access denied');
    }

    // Return the updated task
    const task = await prisma.taskListItem.findFirst({
      where: this.enforceUserScope({ id: taskId }),
    });

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId: string) {
    // Use atomic operation with userId in where clause to prevent race conditions
    const updated = await prisma.taskListItem.updateMany({
      where: this.enforceUserScope({ id: taskId }),
      data: {
        completed: true,
        completedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      throw new Error('Task not found or access denied');
    }

    // Return the updated task
    const task = await prisma.taskListItem.findFirst({
      where: this.enforceUserScope({ id: taskId }),
    });

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string) {
    // Use atomic operation with userId in where clause to prevent race conditions
    const deleted = await prisma.taskListItem.deleteMany({
      where: this.enforceUserScope({ id: taskId }),
    });

    if (deleted.count === 0) {
      throw new Error('Task not found or access denied');
    }

    return { id: taskId };
  }

  /**
   * Get the maximum order value for user's tasks
   */
  private async getMaxOrder(): Promise<number> {
    const result = await prisma.taskListItem.aggregate({
      where: this.enforceUserScope({}),
      _max: { order: true },
    });
    return result._max.order ?? 0;
  }
}

/**
 * Factory function to create a TaskListService instance
 */
export function createTaskListService(userId: string) {
  return new TaskListService(userId);
}
