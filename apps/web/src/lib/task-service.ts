import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

export class TaskListService {
  constructor(private userId: string) {}

  /**
   * Get all tasks for the user
   */
  async getTasks(options: { includeCompleted?: boolean } = {}) {
    const { includeCompleted = false } = options;

    const where: Prisma.TaskListItemWhereInput = {
      userId: this.userId,
      ...(includeCompleted ? {} : { completed: false }),
    };

    return prisma.taskListItem.findMany({
      where,
      orderBy: { order: 'asc' },
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
        userId: this.userId,
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

    return this.ensureOwnership(taskId, async () => {
      return prisma.taskListItem.update({
        where: { id: taskId },
        data: { text: text.trim() },
      });
    });
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId: string) {
    return this.ensureOwnership(taskId, async () => {
      return prisma.taskListItem.update({
        where: { id: taskId },
        data: {
          completed: true,
          completedAt: new Date(),
        },
      });
    });
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string) {
    return this.ensureOwnership(taskId, async () => {
      return prisma.taskListItem.delete({
        where: { id: taskId },
      });
    });
  }

  /**
   * Security: Ensure user owns task before operations
   */
  private async ensureOwnership<T>(
    taskId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const task = await prisma.taskListItem.findFirst({
      where: { id: taskId, userId: this.userId },
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    return operation();
  }

  /**
   * Get the maximum order value for user's tasks
   */
  private async getMaxOrder(): Promise<number> {
    const result = await prisma.taskListItem.aggregate({
      where: { userId: this.userId },
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
