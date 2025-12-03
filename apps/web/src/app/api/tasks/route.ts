import { createAuthenticatedHandler } from '@/lib/api/route-handler';
import { createTaskListService } from '@/lib/task-service';
import {
  CreateTaskDto,
  GetTasksQueryDto,
  type TaskListResponseDto,
  type TaskResponseDto,
} from '@/lib/dto/task.dto';

/**
 * GET /api/tasks
 * List all tasks for the authenticated user
 */
export const GET = createAuthenticatedHandler<never, GetTasksQueryDto, TaskListResponseDto>(
  {
    querySchema: GetTasksQueryDto,
  },
  async ({ query, context }) => {
    const service = createTaskListService(context.userId);
    const tasks = await service.getTasks({ includeCompleted: query?.includeCompleted });

    return {
      success: true,
      tasks,
      total: tasks.length,
    };
  }
);

/**
 * POST /api/tasks
 * Create a new task
 */
export const POST = createAuthenticatedHandler<CreateTaskDto, never, TaskResponseDto>(
  {
    bodySchema: CreateTaskDto,
  },
  async ({ body, context }) => {
    const service = createTaskListService(context.userId);
    const task = await service.createTask(body!.text);

    return {
      success: true,
      task,
    };
  }
);
