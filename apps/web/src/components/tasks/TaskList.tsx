'use client';

import { useState, useRef } from 'react';
import { TaskListItemComponent } from './TaskListItem';
import type { TaskListItem } from '@prisma/client';

interface Props {
  initialTasks: TaskListItem[];
}

export function TaskList({ initialTasks }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const newTaskInputRef = useRef<HTMLInputElement>(null);

  const handleComplete = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });

      if (response.ok) {
        // Optimistic update: hide completed task
        setTasks(tasks.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleUpdate = async (id: string, text: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const { task } = await response.json();
        setTasks(tasks.map((t) => (t.id === id ? task : t)));
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleCreateTask = async (text: string) => {
    if (text.trim().length === 0) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (response.ok) {
        const { task } = await response.json();
        setTasks([...tasks, task]);
        setNewTaskText('');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handlePlusClick = () => {
    setIsCreating(true);
    setTimeout(() => newTaskInputRef.current?.focus(), 0);
  };

  const handleEnterOnLast = () => {
    handlePlusClick();
  };

  const handleNewTaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateTask(newTaskText);
      // Keep input active for rapid entry
      setTimeout(() => {
        setIsCreating(true);
        setTimeout(() => newTaskInputRef.current?.focus(), 0);
      }, 0);
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewTaskText('');
    }
  };

  const handleNewTaskBlur = () => {
    if (newTaskText.trim().length > 0) {
      handleCreateTask(newTaskText);
    } else {
      setIsCreating(false);
      setNewTaskText('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="divide-y divide-gray-100">
          {tasks.map((task, index) => (
            <TaskListItemComponent
              key={task.id}
              task={task}
              isLast={index === tasks.length - 1 && !isCreating}
              onComplete={handleComplete}
              onUpdate={handleUpdate}
              onEnterOnLast={handleEnterOnLast}
            />
          ))}

          {isCreating && (
            <div className="flex items-center gap-3 py-2 px-3">
              <div className="w-4 h-4 flex-shrink-0" /> {/* Spacer for checkbox */}
              <input
                ref={newTaskInputRef}
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={handleNewTaskKeyDown}
                onBlur={handleNewTaskBlur}
                placeholder="New task..."
                className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <button
          onClick={handlePlusClick}
          className="w-full py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 rounded-b-lg border-t border-gray-100"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="text-sm font-medium">Add task</span>
        </button>
      </div>
    </div>
  );
}
