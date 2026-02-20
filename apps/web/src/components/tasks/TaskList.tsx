'use client'

import { useState, useRef, useEffect } from 'react'
import { TaskListItemComponent } from './TaskListItem'
import { api } from '@/lib/api/client'
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto, type TaskDto } from '@/lib/dto/task.dto'
import { useToast } from '@/components/toast/ToastContext'
import type { TaskListItem } from '@prisma/client'

interface Props {
  initialTasks: TaskListItem[]
}

export function TaskList({ initialTasks }: Props) {
  const [tasks, setTasks] = useState<TaskDto[]>(initialTasks)
  const [isCreating, setIsCreating] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')
  const newTaskInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleComplete = async (id: string) => {
    try {
      // Validate request data
      const requestData = UpdateTaskDto.parse({ completed: true })

      await api.patch(`/api/tasks/${id}`, requestData, TaskResponseDto)

      // Optimistic update: hide completed task
      setTasks(tasks.filter((t) => t.id !== id))
    } catch (error) {
      console.error('Failed to complete task:', error)
      toast('Failed to complete task. Please try again.', { type: 'error' })
    }
  }

  const handleUpdate = async (id: string, text: string) => {
    try {
      // Validate request data
      const requestData = UpdateTaskDto.parse({ text })

      const response = await api.patch(`/api/tasks/${id}`, requestData, TaskResponseDto)

      setTasks(tasks.map((t) => (t.id === id ? response.task : t)))
    } catch (error) {
      console.error('Failed to update task:', error)
      toast('Failed to update task. Please try again.', { type: 'error' })
    }
  }

  const handleCreateTask = async (text: string) => {
    if (text.trim().length === 0) return

    try {
      // Validate request data
      const requestData = CreateTaskDto.parse({ text: text.trim() })

      const response = await api.post('/api/tasks', requestData, TaskResponseDto)

      setTasks([...tasks, response.task])
      setNewTaskText('')
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to create task:', error)
      toast('Failed to create task. Please try again.', { type: 'error' })
    }
  }

  const handlePlusClick = () => {
    setIsCreating(true)
  }

  const handleEnterOnLast = () => {
    handlePlusClick()
  }

  const handleNewTaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void handleCreateTask(newTaskText)
      // Keep input active for rapid entry - reset text only, useEffect handles focus
    } else if (e.key === 'Escape') {
      setIsCreating(false)
      setNewTaskText('')
    }
  }

  const handleNewTaskBlur = () => {
    if (newTaskText.trim().length > 0) {
      void handleCreateTask(newTaskText)
    } else {
      setIsCreating(false)
      setNewTaskText('')
    }
  }

  // Handle focus when isCreating becomes true
  useEffect(() => {
    if (isCreating && newTaskInputRef.current) {
      newTaskInputRef.current.focus()
    }
  }, [isCreating])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg bg-white shadow">
        <div className="divide-y divide-gray-100">
          {tasks.map((task, index) => (
            <TaskListItemComponent
              key={task.id}
              task={task}
              isLast={index === tasks.length - 1 && !isCreating}
              onComplete={(id) => void handleComplete(id)}
              onUpdate={(id, text) => void handleUpdate(id, text)}
              onEnterOnLast={handleEnterOnLast}
            />
          ))}

          {isCreating && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-4 w-4 flex-shrink-0" /> {/* Spacer for checkbox */}
              <input
                ref={newTaskInputRef}
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={handleNewTaskKeyDown}
                onBlur={handleNewTaskBlur}
                placeholder="New task..."
                className="flex-1 rounded border border-blue-500 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <button
          onClick={handlePlusClick}
          className="flex w-full items-center justify-center gap-2 rounded-b-lg border-t border-gray-100 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Add task</span>
        </button>
      </div>
    </div>
  )
}
