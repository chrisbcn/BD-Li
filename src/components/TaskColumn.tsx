import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '../types/Task';
import { TaskStatus } from '../constants/taskStatus';
import { SortableTaskCard } from './SortableTaskCard';
import { AddNewTask } from './AddNewTask';
import { Zap, Target, CheckCircle2, Sparkles, Pencil } from 'lucide-react';

interface TaskColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onToggleComplete?: (id: string) => void;
  onAdd?: (title: string, description: string) => void;
  count?: number;
  triggerAdd?: boolean;
  onTriggerAddComplete?: () => void;
  onAcceptAI?: (id: string) => void;
  onDismissAI?: (id: string) => void;
  onTitleChange?: (newTitle: string) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
}

const icons = {
  incoming: Zap,
  ai_captured: Sparkles,
  todo: Target,
  done: CheckCircle2,
};

export function TaskColumn({
  title,
  status,
  tasks,
  onTaskClick,
  onToggleComplete,
  onAdd,
  count,
  triggerAdd,
  onTriggerAddComplete,
  onAcceptAI,
  onDismissAI,
  onTitleChange,
  onUpdate,
}: TaskColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(title);

  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const Icon = icons[status];

  const handleTitleClick = () => {
    if (onTitleChange) {
      setIsEditing(true);
      setEditingTitle(title);
    }
  };

  const handleTitleBlur = () => {
    if (editingTitle.trim() && editingTitle !== title) {
      onTitleChange?.(editingTitle.trim());
    } else {
      setEditingTitle(title);
    }
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setEditingTitle(title);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-w-0 min-h-0">
      <div className="flex items-center gap-2 mb-4 px-1 group shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" />
        {isEditing ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="text-lg bg-transparent border-b border-primary outline-none flex-1"
            autoFocus
            onFocus={(e) => e.target.select()}
          />
        ) : (
          <h2 
            className={`text-lg ${onTitleChange ? 'cursor-pointer hover:text-foreground/80' : ''}`}
            onClick={handleTitleClick}
          >
            {title}
          </h2>
        )}
        {!isEditing && onTitleChange && (
          <button
            onClick={handleTitleClick}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
            aria-label="Edit column name"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
        {count !== undefined && (
          <span className="text-sm text-muted-foreground">{count}</span>
        )}
      </div>
      
      <div
        className={`flex-1 rounded-lg transition-colors flex flex-col min-h-0 overflow-hidden ${
          isOver ? 'bg-muted/50' : 'bg-muted/20'
        }`}
      >
        <div 
          ref={setNodeRef}
          className="flex-1 overflow-y-auto min-h-0 px-3 pt-3"
        >
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                No tasks
              </div>
            ) : (
              tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                  onToggleComplete={onToggleComplete ? () => onToggleComplete(task.id) : undefined}
                  onAcceptAI={onAcceptAI ? () => onAcceptAI(task.id) : undefined}
                  onDismissAI={onDismissAI ? () => onDismissAI(task.id) : undefined}
                  onUpdate={onUpdate}
                />
              ))
            )}
          </SortableContext>
        </div>

        {onAdd && (
          <div className="shrink-0 px-3 pb-3 pt-3 border-t border-border/50">
            <AddNewTask 
              onAdd={onAdd} 
              externalTrigger={triggerAdd}
              onExternalTriggerComplete={onTriggerAddComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
}