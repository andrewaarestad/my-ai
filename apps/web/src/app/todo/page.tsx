import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createTaskListService } from '@/lib/task-service';
import { TaskList } from '@/components/tasks/TaskList';
import { UserAvatar } from '@/components/auth/UserAvatar';
import Link from 'next/link';

export default async function TodoPage() {
  const session = await auth();

  // Redirect to signin if not authenticated
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const service = createTaskListService(session.user.id);
  const tasks = await service.getTasks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              My AI
            </Link>
            <UserAvatar />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Tasks</h1>
            <p className="text-gray-600">
              {tasks.length === 0
                ? 'No tasks yet. Click the + button to add one!'
                : `${tasks.length} active ${tasks.length === 1 ? 'task' : 'tasks'}`}
            </p>
          </div>

          <TaskList initialTasks={tasks} />
        </div>
      </main>
    </div>
  );
}
