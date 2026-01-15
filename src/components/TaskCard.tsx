import { useState, useRef, useEffect } from 'react';
import { Task } from '../types/Task';
import { formatRelativeTime } from '../utils/taskHelpers';
import { Mail, Calendar, FileText, Circle, CheckCircle2, Video, Sparkles, ExternalLink, Check, X, Edit3 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onToggleComplete?: () => void;
  onAcceptAI?: () => void;
  onDismissAI?: () => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
}

export function TaskCard({ task, onClick, onToggleComplete, onAcceptAI, onDismissAI, onUpdate }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update editing title when task changes
  useEffect(() => {
    if (!isEditing) {
      setEditingTitle(task.title);
    }
  }, [task.title, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Always open sidebar on click, not edit mode
    onClick();
  };

  const handleSave = () => {
    if (editingTitle.trim() && editingTitle !== task.title && onUpdate) {
      onUpdate(task.id, { title: editingTitle.trim() });
    } else {
      setEditingTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingTitle(task.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };
  const getSourceIcon = () => {
    switch (task.source) {
      case 'gmail':
        return <Mail className="w-3 h-3" />;
      case 'calendar':
        return <Calendar className="w-3 h-3" />;
      case 'meet':
        return <Video className="w-3 h-3" />;
      case 'gemini':
        return <Sparkles className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getSourceLabel = () => {
    switch (task.source || 'manual') {
      case 'gmail':
        return 'Gmail';
      case 'calendar':
        return 'Calendar';
      case 'meet':
        return 'Meet';
      case 'gemini':
        return 'Gemini';
      default:
        return 'Manual';
    }
  };

  const getPriorityColor = () => {
    switch (task.priority || 'medium') {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const isCompleted = task.status === 'done';
  const isAIExtracted = task.confidence_score !== undefined && task.confidence_score > 0;

  // Task Card (with AI badge if AI-extracted)
  return (
    <div
      onClick={(e) => {
        // Don't open sidebar if we're editing or if user clicked on interactive elements
        if (!isEditing && !(e.target as HTMLElement).closest('input') && !(e.target as HTMLElement).closest('button')) {
          onClick();
        }
      }}
      className="group bg-card border border-border rounded-lg p-4 mb-2 hover:border-muted-foreground/30 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete?.();
          }}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isEditing ? (
              <Input
                ref={inputRef}
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className={`h-auto text-base font-medium flex-1 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h4 
                className={`flex-1 ${isCompleted ? 'line-through text-muted-foreground' : ''} cursor-pointer`}
                onClick={handleTitleClick}
              >
                {task.title}
              </h4>
            )}
            {/* AI Badge */}
            {isAIExtracted && (
              <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] text-purple-400">
                <Sparkles className="w-3 h-3" />
                <span>AI</span>
              </div>
            )}
          </div>
          
          {task.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            {task.source && task.source !== 'manual' && (
              <div className="flex items-center gap-1">
                {getSourceIcon()}
                <span>{getSourceLabel()}</span>
              </div>
            )}
            {task.priority && task.priority !== 'medium' && (
              <>
                {task.source && task.source !== 'manual' && <span>•</span>}
                <span className={getPriorityColor()}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </>
            )}
            {task.due_date && (
              <>
                {(task.source && task.source !== 'manual') || (task.priority && task.priority !== 'medium') ? <span>•</span> : null}
                <span>
                  {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </>
            )}
          </div>

          {/* Contact badge */}
          {task.contact && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded text-xs">
                <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-[10px]">
                    {task.contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <span>{task.contact.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
