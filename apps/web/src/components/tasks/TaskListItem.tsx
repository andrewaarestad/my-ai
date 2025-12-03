'use client';

import { useState, useRef, useEffect } from 'react';
import type { TaskDto } from '@/lib/dto/task.dto';

interface Props {
  task: TaskDto;
  isLast: boolean;
  onComplete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onEnterOnLast: () => void;
}

export function TaskListItemComponent({
  task,
  isLast,
  onComplete,
  onUpdate,
  onEnterOnLast,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(task.text);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = () => {
    setIsEditing(false);
    if (text.trim() !== task.text && text.trim().length > 0) {
      onUpdate(task.id, text.trim());
    } else if (text.trim().length === 0) {
      setText(task.text); // Revert if empty
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (text.trim().length > 0 && text.trim() !== task.text) {
        onUpdate(task.id, text.trim());
      }

      setIsEditing(false);

      // If this is the last item, create a new task
      if (isLast) {
        onEnterOnLast();
      }
    } else if (e.key === 'Escape') {
      setText(task.text); // Revert
      setIsEditing(false);
    }
  };

  const handleTextClick = () => {
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 rounded-md group">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onComplete(task.id)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
        aria-label={`Mark "${task.text}" as complete`}
      />

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <div
          onClick={handleTextClick}
          className="flex-1 px-2 py-1 cursor-text rounded hover:bg-gray-100"
        >
          {task.text}
        </div>
      )}
    </div>
  );
}
