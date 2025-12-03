import { z } from 'zod';

/**
 * Request DTOs
 */

export const CreateTaskDto = z.object({
  text: z.string().min(1, 'Task text cannot be empty').trim(),
});

export const UpdateTaskDto = z
  .object({
    text: z.string().min(1, 'Task text cannot be empty').trim().optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => data.text !== undefined || data.completed !== undefined, {
    message: 'At least one field (text or completed) must be provided',
  });

export const GetTasksQueryDto = z.object({
  includeCompleted: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

/**
 * Response DTOs
 */

export const TaskDto = z.object({
  id: z.string(),
  userId: z.string(),
  text: z.string(),
  completed: z.boolean(),
  completedAt: z.date().nullable(),
  order: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const TaskListResponseDto = z.object({
  success: z.literal(true),
  tasks: z.array(TaskDto),
  total: z.number(),
});

export const TaskResponseDto = z.object({
  success: z.literal(true),
  task: TaskDto,
});

export const DeleteTaskResponseDto = z.object({
  success: z.literal(true),
});

/**
 * Infer TypeScript types from schemas
 */

export type CreateTaskDto = z.infer<typeof CreateTaskDto>;
export type UpdateTaskDto = z.infer<typeof UpdateTaskDto>;
export type GetTasksQueryDto = z.infer<typeof GetTasksQueryDto>;
export type TaskDto = z.infer<typeof TaskDto>;
export type TaskListResponseDto = z.infer<typeof TaskListResponseDto>;
export type TaskResponseDto = z.infer<typeof TaskResponseDto>;
export type DeleteTaskResponseDto = z.infer<typeof DeleteTaskResponseDto>;
