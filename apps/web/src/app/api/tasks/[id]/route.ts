import { createAuthenticatedHandler } from '@/lib/api/route-handler'
import { createTaskListService } from '@/lib/task-service'
import { BadRequestError } from '@/lib/api/errors'
import { UpdateTaskDto, type TaskResponseDto, type DeleteTaskResponseDto } from '@/lib/dto/task.dto'

/**
 * PATCH /api/tasks/[id]
 * Update a task (text or completion status)
 */
export const PATCH = createAuthenticatedHandler(
  {
    bodySchema: UpdateTaskDto,
  },
  async ({ body, context }) => {
    const service = createTaskListService(context.userId)
    const taskId = context.params?.id

    if (!taskId) {
      throw new BadRequestError('Task ID is required')
    }

    // Handle task completion
    if (body.completed === true) {
      const task = await service.completeTask(taskId)
      return {
        success: true,
        task,
      } satisfies TaskResponseDto
    }

    // Handle text update
    if (body.text !== undefined) {
      const task = await service.updateTask(taskId, body.text)
      return {
        success: true,
        task,
      } satisfies TaskResponseDto
    }

    // This should never happen due to Zod validation,
    // but TypeScript doesn't know that
    throw new BadRequestError('Either text or completed must be provided')
  }
)

/**
 * DELETE /api/tasks/[id]
 * Delete a task
 */
export const DELETE = createAuthenticatedHandler({}, async ({ context }) => {
  const service = createTaskListService(context.userId)
  const taskId = context.params?.id

  if (!taskId) {
    throw new BadRequestError('Task ID is required')
  }

  await service.deleteTask(taskId)

  return {
    success: true,
  } satisfies DeleteTaskResponseDto
})
