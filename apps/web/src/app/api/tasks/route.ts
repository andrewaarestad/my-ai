import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createTaskListService } from '@/lib/task-service';
import { logError } from '@/lib/error-logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeCompleted = searchParams.get('includeCompleted') === 'true';

    const service = createTaskListService(session.user.id);
    const tasks = await service.getTasks({ includeCompleted });

    return NextResponse.json({
      success: true,
      tasks,
      total: tasks.length,
    });
  } catch (error) {
    void logError('Failed to fetch tasks', { error });
    return NextResponse.json(
      {
        error: 'Failed to fetch tasks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Task text is required and cannot be empty' },
        { status: 400 }
      );
    }

    const service = createTaskListService(session.user.id);
    const task = await service.createTask(text);

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    void logError('Failed to create task', { error });
    return NextResponse.json(
      {
        error: 'Failed to create task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
