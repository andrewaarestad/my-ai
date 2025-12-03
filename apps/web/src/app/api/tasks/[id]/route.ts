import { createAuthenticatedHandler } from '@/lib/api/route-handler';
import { createTaskListService } from '@/lib/task-service';
import {
  UpdateTaskDto,
  type TaskResponseDto,
  type DeleteTaskResponseDto,
} from '@/lib/dto/task.dto';

/**
 * PATCH /api/tasks/[id]
 * Update a task (text or completion status)
 */
export const PATCH = createAuthenticatedHandler<UpdateTaskDto, never, TaskResponseDto>(
  {
    bodySchema: UpdateTaskDto,
  },
  async ({ body, context }) => {
    const service = createTaskListService(context.userId);
    const taskId = context.params!.id;

    let task;

    // Handle task completion
    if (body!.completed === true) {
      task = await service.completeTask(taskId);
    }
    // Handle text update
    else if (body!.text !== undefined) {
      task = await service.updateTask(taskId, body!.text);
    }

    return {
      success: true,
      task: task!,
    };
  }
);

/**
 * DELETE /api/tasks/[id]
 * Delete a task
 */
export const DELETE = createAuthenticatedHandler<never, never, DeleteTaskResponseDto>(
  {},
  async ({ context }) => {
    const service = createTaskListService(context.userId);
    await service.deleteTask(context.params!.id);

    return {
      success: true,
    };
  }
);
