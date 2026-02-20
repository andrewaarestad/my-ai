import { createAuthenticatedHandler } from '@/lib/api/route-handler'
import { createTaskListService } from '@/lib/task-service'
import {
  CreateTaskDto,
  GetTasksQueryDto,
  type TaskListResponseDto,
  type TaskResponseDto,
} from '@/lib/dto/task.dto'

/**
 * GET /api/tasks
 * List all tasks for the authenticated user
 */
export const GET = createAuthenticatedHandler(
  {
    querySchema: GetTasksQueryDto,
  },
  async ({ query, context }) => {
    const service = createTaskListService(context.userId)
    // ✅ query is guaranteed to be present (no optional chaining needed)
    const tasks = await service.getTasks({ includeCompleted: query.includeCompleted })

    return {
      success: true,
      tasks,
      total: tasks.length,
    } satisfies TaskListResponseDto
  }
)

/**
 * POST /api/tasks
 * Create a new task
 */
export const POST = createAuthenticatedHandler(
  {
    bodySchema: CreateTaskDto,
  },
  async ({ body, context }) => {
    const service = createTaskListService(context.userId)
    // ✅ body is guaranteed to be present (no ! operator needed)
    const task = await service.createTask(body.text)

    return {
      success: true,
      task,
    } satisfies TaskResponseDto
  }
)
