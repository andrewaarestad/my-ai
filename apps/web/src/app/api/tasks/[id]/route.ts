import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createTaskListService } from '@/lib/task-service';
import { logError } from '@/lib/error-logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const service = createTaskListService(session.user.id);

    // Handle task completion
    if ('completed' in body && body.completed === true) {
      const task = await service.completeTask(params.id);
      return NextResponse.json({
        success: true,
        task,
      });
    }

    // Handle text update
    if ('text' in body) {
      if (typeof body.text !== 'string' || body.text.trim().length === 0) {
        return NextResponse.json(
          { error: 'Task text cannot be empty' },
          { status: 400 }
        );
      }
      const task = await service.updateTask(params.id, body.text);
      return NextResponse.json({
        success: true,
        task,
      });
    }

    return NextResponse.json(
      { error: 'Invalid update payload' },
      { status: 400 }
    );
  } catch (error) {
    void logError('Failed to update task', { error, taskId: params.id });
    return NextResponse.json(
      {
        error: 'Failed to update task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = createTaskListService(session.user.id);
    await service.deleteTask(params.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    void logError('Failed to delete task', { error, taskId: params.id });
    return NextResponse.json(
      {
        error: 'Failed to delete task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
