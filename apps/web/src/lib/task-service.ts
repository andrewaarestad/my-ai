import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

export class TaskListService {
  constructor(private userId: string) {}

  /**
   * Get all tasks for the user
   */
  async getTasks(options: { includeCompleted?: boolean } = {}) {
    const { includeCompleted = false } = options

    const where: Prisma.TaskListItemWhereInput = {
      userId: this.userId,
      ...(includeCompleted ? {} : { completed: false }),
    }

    return prisma.taskListItem.findMany({
      where,
      orderBy: { order: 'asc' },
    })
  }

  /**
   * Create a new task (automatically added at the end)
   */
  async createTask(text: string) {
    if (!text || text.trim().length === 0) {
      throw new Error('Task text cannot be empty')
    }

    const maxOrder = await this.getMaxOrder()

    try {
      return await prisma.taskListItem.create({
        data: {
          text: text.trim(),
          userId: this.userId,
          order: maxOrder + 1,
        },
      })
    } catch (error) {
      // P2003 = foreign key constraint violation (user doesn't exist in DB)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new Error('User account not found. Please sign out and sign back in.')
      }
      throw error
    }
  }

  /**
   * Update task text
   */
  async updateTask(taskId: string, text: string) {
    if (!text || text.trim().length === 0) {
      throw new Error('Task text cannot be empty')
    }

    // Use atomic operation with userId in where clause to prevent race conditions
    const updated = await prisma.taskListItem.updateMany({
      where: { id: taskId, userId: this.userId },
      data: { text: text.trim() },
    })

    if (updated.count === 0) {
      throw new Error('Task not found or access denied')
    }

    // Return the updated task
    const task = await prisma.taskListItem.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      throw new Error('Task not found')
    }

    return task
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId: string) {
    // Use atomic operation with userId in where clause to prevent race conditions
    const updated = await prisma.taskListItem.updateMany({
      where: { id: taskId, userId: this.userId },
      data: {
        completed: true,
        completedAt: new Date(),
      },
    })

    if (updated.count === 0) {
      throw new Error('Task not found or access denied')
    }

    // Return the updated task
    const task = await prisma.taskListItem.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      throw new Error('Task not found')
    }

    return task
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string) {
    // Use atomic operation with userId in where clause to prevent race conditions
    const deleted = await prisma.taskListItem.deleteMany({
      where: { id: taskId, userId: this.userId },
    })

    if (deleted.count === 0) {
      throw new Error('Task not found or access denied')
    }

    return { id: taskId }
  }

  /**
   * Get the maximum order value for user's tasks
   */
  private async getMaxOrder(): Promise<number> {
    const result = await prisma.taskListItem.aggregate({
      where: { userId: this.userId },
      _max: { order: true },
    })
    return result._max.order ?? 0
  }
}

/**
 * Factory function to create a TaskListService instance
 */
export function createTaskListService(userId: string) {
  return new TaskListService(userId)
}
