import { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '../types/Task';
import { TaskStatus } from '../constants/taskStatus';
import { SortableTaskCard } from './SortableTaskCard';
import { AddNewTask } from './AddNewTask';
import { Zap, Target, CheckCircle2, Sparkles, Pencil, Filter } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

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
  const [filter, setFilter] = useState<'all' | 'ai' | 'manual' | 'high-confidence'>('all');

  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const Icon = icons[status];

  // Filter tasks based on selected filter
  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    
    if (filter === 'ai') {
      return tasks.filter(task => task.confidence_score !== undefined && task.confidence_score > 0);
    }
    
    if (filter === 'manual') {
      return tasks.filter(task => !task.confidence_score || task.confidence_score === 0);
    }
    
    if (filter === 'high-confidence') {
      return tasks.filter(task => task.confidence_score && task.confidence_score >= 80);
    }
    
    return tasks;
  }, [tasks, filter]);

  const aiTaskCount = tasks.filter(task => task.confidence_score && task.confidence_score > 0).length;
  const hasAITasks = aiTaskCount > 0;

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
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
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
        <span className="text-sm text-muted-foreground flex-1">
          {filteredTasks.length}
          {filter !== 'all' && <span className="text-muted-foreground/60"> / {tasks.length}</span>}
        </span>
        
        {/* Filter dropdown - only show if there are AI tasks */}
        {hasAITasks && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Filter className="w-3.5 h-3.5 mr-1" />
                {filter === 'all' ? 'All' : filter === 'ai' ? 'AI' : filter === 'manual' ? 'Manual' : 'High Conf'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
                <DropdownMenuRadioItem value="all">
                  All Tasks ({tasks.length})
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ai">
                  <Sparkles className="w-3.5 h-3.5 mr-2 inline text-purple-400" />
                  AI Extracted ({aiTaskCount})
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="high-confidence">
                  <Sparkles className="w-3.5 h-3.5 mr-2 inline text-green-400" />
                  High Confidence (≥80%)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="manual">
                  Manual ({tasks.length - aiTaskCount})
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-0 rounded-lg transition-all flex flex-col overflow-hidden relative ${
          isOver 
            ? 'bg-primary/20 border-2 border-primary ring-2 ring-primary/50' 
            : 'bg-muted/20 border-2 border-transparent'
        }`}
      >
        {/* Drop indicator overlay */}
        {isOver && (
          <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium shadow-lg">
              Drop here
            </div>
          </div>
        )}
        
        <div 
          className="flex-1 min-h-0 overflow-y-auto px-3 pt-3"
        >
          <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {filteredTasks.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                {filter !== 'all' ? `No ${filter} tasks` : 'No tasks'}
              </div>
            ) : (
              filteredTasks.map((task) => (
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